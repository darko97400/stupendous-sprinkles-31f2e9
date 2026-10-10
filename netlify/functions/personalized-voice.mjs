import service from '../../voice-service/entry.cjs';

// Modern Functions API is required for Netlify's rateLimit configuration.
export const config={path:'/.netlify/functions/personalized-voice',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
export default async request=>{
  const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
  if(request.method!=='POST')return new Response(null,{status:405,headers});
  if(Number(request.headers.get('content-length'))>4096)return new Response(null,{status:400,headers});
  let body='';
  try {
    if(!request.body)return new Response(null,{status:400,headers});
    const reader=request.body.getReader();const parts=[];let size=0;
    try {
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
        if(size>4096){await reader.cancel();return new Response(null,{status:400,headers});}parts.push(Buffer.from(value));}
    }finally{reader.releaseLock();}
    body=Buffer.concat(parts).toString('utf8');
    const result=await service.handler({httpMethod:'POST',body});
    return new Response(result.isBase64Encoded?Buffer.from(result.body,'base64'):result.body,{status:result.statusCode,headers:result.headers});
  } catch {return new Response(null,{status:503,headers});}
};
