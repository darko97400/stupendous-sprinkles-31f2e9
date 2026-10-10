const {createHandler}=require('./handler.cjs');
const {VoiceStore}=require('./store.cjs');
const {synthesize,limitedBody}=require('./audio.cjs');
let handler;
exports.handler=async event=>{
  const env=process.env;
  // Production only. Preview tests use mocks and cannot spend production credits.
  if(env.PS_VOICE_ENV!=='production'||env.PS_VOICE_ENABLED!=='true'||!env.PS_VOICE_META_APP_SECRET||
     !env.PS_VOICE_ELEVENLABS_KEY||!env.PS_VOICE_HASH_SECRET||env.PS_VOICE_HASH_SECRET.length<32)
    return {statusCode:503,headers:{'Cache-Control':'no-store'},body:''};
  try { if(!handler) {
    const {Pool}=require('pg'); const {getStore}=require('@netlify/blobs');
    const connection=new URL(env.PS_VOICE_DATABASE_URL || (await import('@netlify/database')).getConnectionString());
    if(!['postgres:','postgresql:'].includes(connection.protocol))throw new Error('configuration');
    for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])connection.searchParams.delete(key);
    const pool=new Pool({connectionString:connection.toString(),ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:2500,query_timeout:4000,idleTimeoutMillis:5000});
    const blobs=getStore({name:'project-s-personalized-voices-v1',consistency:'strong',
      ...(env.NETLIFY_BLOBS_SITE_ID&&env.NETLIFY_BLOBS_TOKEN?{siteID:env.NETLIFY_BLOBS_SITE_ID,token:env.NETLIFY_BLOBS_TOKEN}:{})});
    const store=new VoiceStore(pool,blobs,{total:10000,dailyCharacters:5000,monthlyCharacters:20000,userDaily:6,userMonthly:12});
    handler=createHandler({enabled:true,hashSecret:env.PS_VOICE_HASH_SECRET,store,
      authenticate:async (userId,nonce)=>{
        const response=await fetch('https://graph.oculus.com/user_nonce_validate',{method:'POST',signal:AbortSignal.timeout(6000),
          headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({
            access_token:'OC|35020187484294368|'+env.PS_VOICE_META_APP_SECRET,user_id:userId,nonce})});
        const result=JSON.parse((await limitedBody(response,16384)).toString('utf8'));
        return result.is_valid===true;
      },synthesize:j=>synthesize(j,env.PS_VOICE_ELEVENLABS_KEY)});
  }
  return await handler(event);
  } catch { return {statusCode:503,headers:{'Cache-Control':'no-store'},body:''}; }
};
