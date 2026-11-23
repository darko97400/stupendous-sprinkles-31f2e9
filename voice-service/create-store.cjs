const {VoiceStore}=require('./store.cjs');
const {Pool}=require('pg');
const {getStore}=require('@netlify/blobs');
async function createVoiceStore(env, setStage = () => {}) {
    const connection=new URL(env.PS_VOICE_DATABASE_URL || (await import('@netlify/database')).getConnectionString());
    if(!['postgres:','postgresql:'].includes(connection.protocol))throw new Error('configuration');
    for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])connection.searchParams.delete(key);
    const pool=new Pool({connectionString:connection.toString(),ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:2500,query_timeout:4000,idleTimeoutMillis:5000});
    setStage('blob-configuration');
    const blobs=getStore({name:'project-s-personalized-voices-v1',consistency:'strong',
      ...(env.NETLIFY_BLOBS_SITE_ID&&env.NETLIFY_BLOBS_TOKEN?{siteID:env.NETLIFY_BLOBS_SITE_ID,token:env.NETLIFY_BLOBS_TOKEN}:{})});
    // Five fixed clips per language, with the old outcomes retaining their keys.
    return new VoiceStore(pool,blobs,{total:10000,dailyCharacters:5000,monthlyCharacters:20000,userDaily:10,userMonthly:12});
}
module.exports={createVoiceStore};
