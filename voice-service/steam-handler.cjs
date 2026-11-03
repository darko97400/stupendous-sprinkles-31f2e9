const crypto=require('node:crypto');
const {job}=require('./catalog.cjs');
const {createHandler}=require('./handler.cjs');
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const reply=statusCode=>({statusCode,headers,body:''});
function createSteamHandler({enabled,authenticate,store,synthesize,hashSecret}) {
  // Separate Steam cache/owner namespace; every existing Meta key remains unchanged.
  const steamSecret=typeof hashSecret==='string'&&hashSecret.length>=32?
    crypto.createHmac('sha256',hashSecret).update('steam:5525510:voice-v1').digest('hex'):null;
  return async event=>{
    if(event.httpMethod!=='POST')return reply(405);
    if(!enabled||!steamSecret)return reply(503);
    if(event.isBase64Encoded||typeof event.body!=='string'||Buffer.byteLength(event.body)>8192)return reply(400);
    let body;
    try{body=JSON.parse(event.body);}catch{return reply(400);}
    if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['userId','ticket','name','language','kind','revision'].includes(k))||
       typeof body.userId!=='string'||!/^\d{17}$/.test(body.userId)||typeof body.ticket!=='string'||
       !/^(?:[a-f0-9]{2}){16,2560}$/i.test(body.ticket))return reply(400);
    const {ticket,...metadata}=body;
    // Reuse fixed templates, audio validation, SQL quotas and recovery unchanged.
    // This internal placeholder is never accepted as a Steam proof: authentication
    // below always validates this request's real ticket against Valve first.
    const request={...metadata,nonce:'steam-web-api-ticket'};
    if(!job(request))return reply(400);
    const handler=createHandler({enabled:true,hashSecret:steamSecret,store,synthesize,
      authenticate:id=>authenticate(id,ticket)});
    return handler({httpMethod:'POST',body:JSON.stringify(request)});
  };
}
module.exports={createSteamHandler};
