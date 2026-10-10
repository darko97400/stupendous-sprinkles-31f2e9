const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {PGlite}=require('@electric-sql/pglite');
const {job,keys,REVISION,normalizeName}=require('../voice-service/catalog.cjs');
const {VoiceStore}=require('../voice-service/store.cjs');
const {createHandler}=require('../voice-service/handler.cjs');
const {validMp3,processAudio}=require('../voice-service/audio.cjs');
const body={userId:'123456789',nonce:'test-proof-only',name:'Élodie',language:'fr',kind:'win',revision:REVISION};
const secret='test-only-not-a-server-secret-12345678';
function wave(){const b=Buffer.alloc(44+44100);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(22050,24);b.writeUInt32LE(44100,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);for(let i=44;i<b.length;i+=2)b.writeInt16LE(Math.round(10000*Math.sin(i*.1)),i);return b;}
let cachedMp3;
before(async()=>{cachedMp3=await processAudio(wave(),'training');});
async function fixture(limits={}){
 const db=new PGlite();await db.exec(await fs.readFile('netlify/database/migrations/202610100001_personalized_voices.sql','utf8'));
 // PGlite is a single embedded PostgreSQL connection. Serialize connections;
 // real multi-instance advisory-lock contention remains a staging test.
 let tail=Promise.resolve();
 const pool={query:(...a)=>db.query(...a),connect:async()=>{const before=tail;let release;tail=new Promise(r=>release=r);await before;return {query:(...a)=>db.query(...a),release};}};
 const blobs=new Map();const storage={get:async k=>blobs.get(k)||null,set:async(k,v)=>blobs.set(k,v)};
 const store=new VoiceStore(pool,storage,{total:100,dailyCharacters:10000,monthlyCharacters:10000,userDaily:3,userMonthly:6,...limits});
 let calls=0,verified=0;
 const handler=createHandler({enabled:true,hashSecret:secret,store,authenticate:async(id,nonce)=>{verified++;return nonce==='test-proof-only';},synthesize:async()=>{calls++;return cachedMp3;}});
 const send=(overrides={})=>handler({httpMethod:'POST',body:JSON.stringify({...body,...overrides})});
 return {db,store,blobs,send,calls:()=>calls,verified:()=>verified,close:()=>db.close()};
}
test('fixed bilingual catalog, nickname validation, profile and key separation',()=>{
 assert.equal(normalizeName('  E\u0301lodie   Paris  '),'Élodie Paris');
 for(const name of ['<tag>','[laughs]','a','1234','x'.repeat(25),'a\u200bb'])assert.equal(normalizeName(name),null);
 assert.equal(job({...body,voice:'arbitrary'}),null);
 assert.equal(job({...body,language:'de'}),null);
 assert.equal(job({...body,kind:'welcome'}),null);
 const set=new Set();for(const language of ['fr','en'])for(const kind of ['win','lose','training']){const j=job({...body,language,kind});assert(j.prompt.includes('Élodie'));set.add(keys(secret,j).key);assert.equal(j.voice,kind==='training'?'cgSgspJ2msm6clMCkdW9':'IKne3meq5aSn9XLyUdCD');}
 assert.equal(set.size,6);assert.notEqual(keys(secret,job(body)).key,keys(secret,job({...body,userId:'987654321'})).key);
});
test('real SQL reservation, repeat playback cache and concurrent duplicate requests',async()=>{
 const f=await fixture();try{
  const responses=await Promise.all(Array.from({length:12},()=>f.send()));
  assert.equal(f.calls(),1);assert(responses.every(r=>[200,409].includes(r.statusCode)));
  const repeat=await f.send();assert.equal(repeat.statusCode,200);assert.equal(f.calls(),1);assert.equal(f.verified(),13);
  assert(validMp3(Buffer.from(repeat.body,'base64')));
  assert.equal((await f.db.query('select count(*)::int as n from ps_voice_jobs')).rows[0].n,1);
  assert.equal(repeat.headers['Content-Type'],'audio/mpeg');
  for(let session=0;session<5;session++){
   const relaunched=createHandler({enabled:true,hashSecret:secret,store:f.store,authenticate:async()=>true,synthesize:async()=>{throw new Error('Must reuse persisted audio');}});
   const reused=await relaunched({httpMethod:'POST',body:JSON.stringify(body)});
   assert.equal(reused.statusCode,200);assert.equal(reused.body,repeat.body);
  }
  assert.equal(f.calls(),1);
 }finally{await f.close();}
});

test('spoken nickname removes number/decorative blocks, preserves names and reuses cached audio',async()=>{
 const cases=[['ZZZzzz_Pablo_Zzzzzz','Pablo'],['45624_Stephane','Stephane'],['12_Jean-Luc_99','Jean-Luc'],["777_O'Neill","O'Neill"],['Emma_51284','Emma'],['Aaron','Aaron'],['Élodie_１２３','Élodie'],['zzzz-Pablo-ZZZZ','Pablo'],['ZZZZ_51284',null]];
 for(const [raw,expected] of cases){assert.equal(normalizeName(raw),expected);if(expected)assert.equal(normalizeName(expected),expected);}
 assert.equal(keys(secret,job({...body,name:'45624_Stephane'})).key,keys(secret,job({...body,name:'Stephane'})).key);
 assert.equal(job({...body,name:'45624_Stephane'}).prompt,'[excited] Belle victoire, Stephane !');
 const f=await fixture();try{for(let match=0;match<10;match++){const r=await f.send({name:match%2?'Stephane':'45624_Stephane'});assert.equal(r.statusCode,200);}assert.equal(f.calls(),1);}finally{await f.close();}
});
test('user/global quotas and rollback, cache works after quota',async()=>{
 const f=await fixture({userDaily:2});try{
  assert.equal((await f.send()).statusCode,200);assert.equal((await f.send({kind:'lose'})).statusCode,200);
  assert.equal((await f.send({kind:'training'})).statusCode,429);assert.equal((await f.send()).statusCode,200);
  assert.equal(f.calls(),2);assert.equal((await f.db.query("select used from ps_voice_budgets where bucket='total'")).rows[0].used,2);
 }finally{await f.close();}
 const g=await fixture({dailyCharacters:1});try{assert.equal((await g.send()).statusCode,429);assert.equal(g.calls(),0);assert.equal((await g.db.query('select * from ps_voice_jobs')).rows.length,0);}finally{await g.close();}
});
test('bad proof and malformed requests never consume budgets or provider credits',async()=>{
 const f=await fixture();try{assert.equal((await f.send({nonce:'invalid-proof'})).statusCode,401);assert.equal((await f.send({name:'[explosion]'})).statusCode,400);assert.equal(f.calls(),0);assert.equal((await f.db.query('select * from ps_voice_jobs')).rows.length,0);}finally{await f.close();}
});
test('uncertain provider failure remains reserved/failed across requests, no second charge',async()=>{
 const f=await fixture();let n=0;try{
 const h=createHandler({enabled:true,hashSecret:secret,store:f.store,authenticate:async()=>true,synthesize:async()=>{n++;throw new Error('SECRET provider body');}});
 const req={httpMethod:'POST',body:JSON.stringify(body)};
 assert.equal((await h(req)).statusCode,503);assert.equal((await h(req)).statusCode,409);assert.equal(n,1);
 assert(!(await h(req)).body.includes('SECRET'));
 }finally{await f.close();}
});

test('stored MP3 survives a failed ledger update without a second synthesis',async()=>{
 const f=await fixture();try{
  f.store.save=async(key,data)=>{await f.store.blobs.set(key,data);throw new Error('simulated database interruption after blob save');};
  assert.equal((await f.send()).statusCode,503);
  assert.equal(f.calls(),1);
  assert.equal((await f.db.query('select state from ps_voice_jobs')).rows[0].state,'failed');
  const recovered=await f.send();assert.equal(recovered.statusCode,200);assert(validMp3(Buffer.from(recovered.body,'base64')));
  assert.equal((await f.db.query('select state from ps_voice_jobs')).rows[0].state,'ready');
  assert.equal((await f.send()).body,recovered.body);assert.equal(f.calls(),1);
 }finally{await f.close();}
});
test('activation defaults closed, method and payload limits',async()=>{
 const h=createHandler({enabled:false});assert.equal((await h({httpMethod:'POST'})).statusCode,503);
 const on=createHandler({enabled:true,hashSecret:secret});assert.equal((await on({httpMethod:'GET'})).statusCode,405);
 assert.equal((await on({httpMethod:'POST',body:'x'.repeat(4097)})).statusCode,400);
 assert.equal((await on({httpMethod:'POST',body:'{'})).statusCode,400);
});
test('actual FFmpeg processing for both voices; invalid/truncated/oversized MP3 rejected',async()=>{
 assert(validMp3(cachedMp3));assert(!validMp3(wave()));assert(!validMp3(Buffer.alloc(250001)));assert(!validMp3(Buffer.from('not audio')));
 assert(!validMp3(cachedMp3.subarray(0,cachedMp3.length-1)));assert(!validMp3(Buffer.concat([cachedMp3,Buffer.from([0])])));
 const wrongHeader=Buffer.from(cachedMp3);wrongHeader[2]=0x90;assert(!validMp3(wrongHeader));
 assert(!validMp3(Buffer.concat(Array(21).fill(cachedMp3))));
 for(const kind of ['win','training']){const output=await processAudio(wave(),kind);assert(validMp3(output));}
});

test('modern Netlify entry bounds streaming input and fails closed without activation',async()=>{
 const prior=process.env.PS_VOICE_ENABLED;delete process.env.PS_VOICE_ENABLED;
 try {
  const {default:entry,config}=await import('../netlify/functions/personalized-voice.mjs');
  assert.equal(config.rateLimit.windowLimit,30);
  assert.equal((await entry(new Request('https://test.invalid',{method:'GET'}))).status,405);
  assert.equal((await entry(new Request('https://test.invalid',{method:'POST',body:'{}'}))).status,503);
  assert.equal((await entry(new Request('https://test.invalid',{method:'POST'}))).status,400);
  assert.equal((await entry(new Request('https://test.invalid',{method:'POST',body:'x'.repeat(4097)}))).status,400);
  const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(2048));c.enqueue(new Uint8Array(2049));c.close();}});
  assert.equal((await entry(new Request('https://test.invalid',{method:'POST',body:stream,duplex:'half'}))).status,400);
 } finally {if(prior===undefined)delete process.env.PS_VOICE_ENABLED;else process.env.PS_VOICE_ENABLED=prior;}
});

test('public site contains unchanged web assets without server code, tests or secrets',async()=>{
 const os=require('node:os'),path=require('node:path');
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ps-site-test-'));
 try {
  await fs.mkdir(path.join(root,'assets'));
  for(const name of ['index.html','script.js','styles.css','_redirects','.env','package.json','private.cjs'])await fs.writeFile(path.join(root,name),name);
  await fs.writeFile(path.join(root,'assets','image.png'),'image');
  await require('../scripts/prepare-site.cjs').prepare(root);
  const out=path.join(root,'site-dist');
  assert.deepEqual((await fs.readdir(out)).sort(),['_redirects','assets','index.html','script.js','styles.css']);
  assert.equal(await fs.readFile(path.join(out,'index.html'),'utf8'),'index.html');
  assert.equal(await fs.readFile(path.join(out,'assets','image.png'),'utf8'),'image');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
