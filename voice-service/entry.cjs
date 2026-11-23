const {createVoiceStore}=require('./create-store.cjs');
const {createHandler}=require('./handler.cjs');
const {synthesize,limitedBody}=require('./audio.cjs');
let handler, diagnosticLogged=false;
exports.handler=async event=>{
  const env=process.env;
  // Production only. Preview tests use mocks and cannot spend production credits.
  if(env.PS_VOICE_ENV!=='production'||env.PS_VOICE_ENABLED!=='true'||!env.PS_VOICE_META_APP_SECRET||
     !env.PS_VOICE_ELEVENLABS_KEY||!env.PS_VOICE_HASH_SECRET||env.PS_VOICE_HASH_SECRET.length<32)
    return {statusCode:503,headers:{'Cache-Control':'no-store'},body:''};
  let stage='dependencies';
  try { if(!handler) {
    stage='database-configuration';
    const store=await createVoiceStore(env, value => {stage=value;});
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
  } catch (error) {
    // Fixed diagnostic labels only: never log provider bodies, identifiers or secrets.
    if(!diagnosticLogged){diagnosticLogged=true;
      const reason=error?.name==='MissingDatabaseConnectionError'?'missing-database':
        error?.code==='MODULE_NOT_FOUND'?'missing-module':
        String(error?.message).startsWith('Dynamic require of')?'dynamic-require':'initialization';
      console.error('PS_VOICE_INIT',stage,reason);
    }
    return {statusCode:503,headers:{'Cache-Control':'no-store'},body:''};
  }
};
