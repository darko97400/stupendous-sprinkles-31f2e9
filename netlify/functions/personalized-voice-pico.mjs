import 'pg';
import '@netlify/blobs';
import 'ffmpeg-static';
import storage from '../../voice-service/create-store.cjs';
import audio from '../../voice-service/audio.cjs';
import {createPicoVoice} from '../../voice-service/pico-handler.mjs';
import {voiceHttp} from '../../voice-service/http-voice.mjs';

export const config = {path:'/.netlify/functions/personalized-voice-pico',
  rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
let setup;
const projectSPicoAppId = '2268655b03fd3b888a6df7b454485766';
export default voiceHttp({async handler(event) {
  const env = process.env;
  if (env.PS_VOICE_ENV !== 'production' || env.PS_VOICE_ENABLED !== 'true' ||
      !env.PS_VOICE_ELEVENLABS_KEY || !env.PS_VOICE_HASH_SECRET)
    return {statusCode:503,headers:{'Cache-Control':'no-store'},body:''};
  setup ??= storage.createVoiceStore(env).then(store => createPicoVoice({
    appId:projectSPicoAppId, hashSecret:env.PS_VOICE_HASH_SECRET, store,
    synthesize:job => audio.synthesize(job, env.PS_VOICE_ELEVENLABS_KEY)
  })).catch(error => {setup = undefined; throw error;});
  return (await setup)(event);
}});
