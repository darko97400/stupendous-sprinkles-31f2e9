const {job,keys}=require('./catalog.cjs');
const {validWav}=require('./audio.cjs');
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
function reply(statusCode) { return {statusCode,headers,body:''}; }
function audio(data) {return {statusCode:200,headers:{...headers,'Content-Type':'audio/wav'},isBase64Encoded:true,body:data.toString('base64')};}
function createHandler({enabled,authenticate,store,synthesize,hashSecret}) {
  return async event => {
    if(event.httpMethod!=='POST')return reply(405);
    if(!enabled || !hashSecret || hashSecret.length<32)return reply(503);
    if(event.isBase64Encoded || typeof event.body!=='string' || Buffer.byteLength(event.body)>4096)return reply(400);
    let j; try {j=job(JSON.parse(event.body));}catch{return reply(400);}
    if(!j)return reply(400);
    let key, reserved=false;
    try {
      if(!await authenticate(j.userId,j.nonce))return reply(401);
      const ids=keys(hashSecret,j);key=ids.key;
      const status=await store.reserve(key,ids.owner,j.prompt.length);
      if(status==='ready') { const data=await store.get(key); return validWav(data)?audio(data):reply(503); }
      if(status==='quota')return reply(429);
      if(status!=='new')return reply(409);
      reserved=true;
      const data=await synthesize(j);if(!validWav(data))throw new Error('audio');
      await store.save(key,data);return audio(data);
    } catch {
      if(reserved)await store.fail(key).catch(()=>{});
      // Never return provider bodies, names, IDs, tokens or exception messages.
      return reply(503);
    }
  };
}
module.exports={createHandler};
