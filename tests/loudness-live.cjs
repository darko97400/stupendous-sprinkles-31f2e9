// Explicit local smoke test only; never imported by the deployed function.
// Uses the fictional name Alex. Maximum 300 existing credits; no auto-retry.
const fs=require('node:fs/promises');
const output='test-output/level-match-v3';
const {job,REVISION}=require('../voice-service/catalog.cjs');
const {synthesize,validMp3}=require('../voice-service/audio.cjs');
(async()=>{
 const key=process.env.ELEVENLABS_API_KEY;if(!key)throw new Error('Missing local key');
 await fs.mkdir(output,{recursive:true});
 const plan=[];for(const language of ['fr','en'])for(const kind of ['win','lose','training']){
  const target=`${output}/${kind}-${language}.mp3`;
  try{await fs.access(target);continue;}catch{}
  plan.push({target,job:job({userId:'123456789',name:'Alex',nonce:'test-only-not-used',language,kind,revision:REVISION})});
 }
 const cost=plan.reduce((sum,p)=>sum+p.job.prompt.length,0);
 const response=await fetch('https://api.elevenlabs.io/v1/user/subscription',{headers:{'xi-api-key':key},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('Subscription unavailable');const sub=await response.json();
 if(sub.status!=='active'||sub.character_limit-sub.character_count<cost||cost>300||sub.allowed_to_extend_character_limit)throw new Error('Credit guard refused');
 console.log('Bounded test:',plan.length,'clips, maximum',cost,'characters; existing credits only.');
 for(const p of plan){
  // Exclusive marker survives any uncertain request or charge.
  await fs.writeFile(p.target+'.pending','generation may have been charged',{flag:'wx'});
  const audio=await synthesize(p.job,key);if(!validMp3(audio))throw new Error('Invalid generated audio');
  await fs.writeFile(p.target,audio);await fs.unlink(p.target+'.pending');
  await fs.appendFile(output+'/generation.jsonl',JSON.stringify({kind:p.job.kind,language:p.job.language,maximumCharacters:p.job.prompt.length,bytes:audio.length})+'\n');
  console.log('PASS',p.job.kind,p.job.language,audio.length,'bytes');
 }
})().catch(()=>{console.error('Live test stopped; inspect pending markers. No automatic retry.');process.exitCode=1;});
