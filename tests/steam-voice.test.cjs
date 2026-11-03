const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {PGlite}=require('@electric-sql/pglite');
const {createSteamHandler}=require('../voice-service/steam-handler.cjs');
const {createSteamAuthenticate,APP_ID,AUDIENCE}=require('../voice-service/steam-auth.cjs');
const {createHandler}=require('../voice-service/handler.cjs');
const {VoiceStore}=require('../voice-service/store.cjs');
const {REVISION}=require('../voice-service/catalog.cjs');
const secret='test-only-shared-hash-secret-1234567890';
const body={userId:'76561198000000001',ticket:'ab'.repeat(128),name:'Élodie',language:'fr',kind:'win',revision:REVISION};
const audio=Buffer.alloc(313*20);
for(let at=0;at<audio.length;at+=313)audio.set([255,251,112,192],at);
const send=(handler,overrides={})=>handler({httpMethod:'POST',body:JSON.stringify({...body,...overrides})});
async function fixture(){
  const db=new PGlite();await db.exec(await fs.readFile('netlify/database/migrations/202610100001_personalized_voices.sql','utf8'));
  let tail=Promise.resolve(),calls=0,authCalls=0;
  const pool={query:(...a)=>db.query(...a),connect:async()=>{const before=tail;let release;tail=new Promise(r=>release=r);await before;return {query:(...a)=>db.query(...a),release};}};
  const blobs=new Map(),store=new VoiceStore(pool,{get:async k=>blobs.get(k)||null,set:async(k,v)=>blobs.set(k,v)},{total:100,dailyCharacters:10000,monthlyCharacters:10000,userDaily:10,userMonthly:12});
  const handler=createSteamHandler({enabled:true,hashSecret:secret,store,authenticate:async(id,ticket)=>{authCalls++;return id===body.userId&&ticket===body.ticket;},synthesize:async()=>{calls++;return audio;}});
  return {db,store,handler,calls:()=>calls,authCalls:()=>authCalls};
}
test('Valve ticket verifies the exact SteamID, audience and active app license',async()=>{
  const urls=[];
  const authenticate=createSteamAuthenticate({publisherKey:'test-key',limitedBody:async r=>Buffer.from(JSON.stringify(r)),fetchImpl:async url=>{
    urls.push(url);return url.pathname.includes('AuthenticateUserTicket')?{response:{params:{result:'OK',steamid:body.userId}}}:{appownership:{ownsapp:true,permanent:false}};
  }});
  assert.equal(await authenticate(body.userId,body.ticket),true);
  assert.equal(urls.length,2);
  for(const url of urls){assert.equal(url.origin,'https://partner.steam-api.com');assert.equal(url.searchParams.get('appid'),APP_ID);}
  assert.equal(urls[0].searchParams.get('identity'),AUDIENCE);
  assert.equal(urls[0].searchParams.get('ticket'),body.ticket);
  assert.equal(urls[1].searchParams.get('steamid'),body.userId);
});
test('foreign or numeric SteamID, invalid ticket, inactive license and absent key fail closed',async()=>{
  for(const params of [{result:'OK',steamid:'76561198000000002'},{result:'OK',steamid:Number(body.userId)},{result:'Invalid',steamid:body.userId}]){
    let requests=0;
    const authenticate=createSteamAuthenticate({publisherKey:'test-key',limitedBody:async r=>Buffer.from(JSON.stringify(r)),fetchImpl:async()=>{requests++;return {response:{params}};}});
    assert.equal(await authenticate(body.userId,body.ticket),false);assert.equal(requests,1);
  }
  const noLicense=createSteamAuthenticate({publisherKey:'test-key',limitedBody:async r=>Buffer.from(JSON.stringify(r)),fetchImpl:async url=>url.pathname.includes('AuthenticateUserTicket')?{response:{params:{result:'OK',steamid:body.userId}}}:{appownership:{ownsapp:false}}});
  assert.equal(await noLicense(body.userId,body.ticket),false);
  let called=false;
  const disabled=createSteamAuthenticate({fetchImpl:async()=>{called=true;},limitedBody:async()=>{}});
  assert.equal(await disabled(body.userId,body.ticket),false);assert.equal(called,false);
});
test('Steam repeats use persisted MP3, every request authenticates, Meta cache stays distinct',async()=>{
  const f=await fixture();try{
    const first=await send(f.handler);assert.equal(first.statusCode,200);
    for(let i=0;i<20;i++)assert.equal((await send(f.handler)).body,first.body);
    assert.equal(f.calls(),1);assert.equal(f.authCalls(),21);
    const meta=createHandler({enabled:true,hashSecret:secret,store:f.store,authenticate:async()=>true,synthesize:async()=>audio});
    const {ticket,...metadata}=body;
    assert.equal((await meta({httpMethod:'POST',body:JSON.stringify({...metadata,nonce:'test-meta-proof'})})).statusCode,200);
    assert.equal((await f.db.query('select count(*)::int as n from ps_voice_jobs')).rows[0].n,2);
    assert.equal((await f.db.query('select count(distinct owner_hash)::int as n from ps_voice_jobs')).rows[0].n,2);
  }finally{await f.db.close();}
});
test('Steam invalid proof or malformed metadata never consumes a provider call or quota',async()=>{
  const f=await fixture();try{
    assert.equal((await send(f.handler,{ticket:'cd'.repeat(128)})).statusCode,401);
    for(const bad of [{userId:Number(body.userId)},{ticket:'xyz'},{nonce:'meta-proof'},{text:'arbitrary'},{voice:'arbitrary'},{name:'[laughs]'},{language:'de'}])
      assert.equal((await send(f.handler,bad)).statusCode,400);
    assert.equal(f.calls(),0);assert.equal((await f.db.query('select count(*)::int as n from ps_voice_jobs')).rows[0].n,0);
  }finally{await f.db.close();}
});
test('parallel Steam requests keep each request ticket isolated',async()=>{
  const seen=[];
  const handler=createSteamHandler({enabled:true,hashSecret:secret,authenticate:async(id,ticket)=>{await new Promise(r=>setImmediate(r));seen.push(ticket);return false;}});
  const responses=await Promise.all([send(handler),send(handler,{ticket:'cd'.repeat(128)})]);
  assert(responses.every(r=>r.statusCode===401));assert.deepEqual(new Set(seen),new Set([body.ticket,'cd'.repeat(128)]));
});
test('full 2560-byte Steam ticket fits the bounded adapter, oversized requests fail',async()=>{
  let length=0;
  const handler=createSteamHandler({enabled:true,hashSecret:secret,authenticate:async(id,ticket)=>{length=ticket.length;return false;}});
  assert.equal((await send(handler,{ticket:'ab'.repeat(2560)})).statusCode,401);assert.equal(length,5120);
  assert.equal((await send(handler,{ticket:'ab'.repeat(2561)})).statusCode,400);
  assert.equal((await handler({httpMethod:'POST',body:'x'.repeat(8193)})).statusCode,400);
  assert.equal((await handler({httpMethod:'GET'})).statusCode,405);
});
test('Steam function defaults closed and bounds streamed bodies independently of Meta',async()=>{
  const {default:entry,config}=await import('../netlify/functions/personalized-voice-steam.mjs');
  assert.equal(config.rateLimit.windowLimit,30);
  assert.equal((await entry(new Request('https://test.invalid',{method:'GET'}))).status,405);
  assert.equal((await entry(new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}))).status,503);
  assert.equal((await entry(new Request('https://test.invalid',{method:'POST',body:'x'.repeat(8193)}))).status,400);
});
