import service from '../../voice-service/steam-entry.cjs';
import 'pg';
import '@netlify/blobs';
import 'ffmpeg-static';
export const config={path:'/.netlify/functions/personalized-voice-steam',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
export default async request=>{
  const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
  if(request.method!=='POST')return new Response(null,{status:405,headers});
  if(Number(request.headers.get('content-length'))>8192)return new Response(null,{status:400,headers});
  try{
    if(!request.body)return new Response(null,{status:400,headers});
    const reader=request.body.getReader(),parts=[];let size=0;
    try{
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
        if(size>8192){await reader.cancel();return new Response(null,{status:400,headers});}parts.push(Buffer.from(value));}
    }finally{reader.releaseLock();}
    const result=await service.handler({httpMethod:'POST',body:Buffer.concat(parts).toString('utf8')});
    return new Response(result.isBase64Encoded?Buffer.from(result.body,'base64'):result.body,{status:result.statusCode,headers:result.headers});
  }catch{return new Response(null,{status:503,headers});}
};
