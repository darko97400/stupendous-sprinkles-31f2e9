import {voiceHttp} from '../../voice-service/http-voice.mjs';
import service from '../../voice-service/steam-entry.cjs';
import 'pg';
import '@netlify/blobs';
import 'ffmpeg-static';
export const config={path:'/.netlify/functions/personalized-voice-steam',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
export default voiceHttp(service);
