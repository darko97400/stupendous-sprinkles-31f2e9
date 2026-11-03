const APP_ID='5525510';
const AUDIENCE='project-s-voice-v1';
function createSteamAuthenticate({publisherKey,fetchImpl=fetch,limitedBody}) {
  async function call(path,parameters,signal) {
    const url=new URL('https://partner.steam-api.com/'+path);
    url.search=new URLSearchParams({key:publisherKey,...parameters}).toString();
    const response=await fetchImpl(url,{signal,redirect:'error'});
    return JSON.parse((await limitedBody(response,16384)).toString('utf8'));
  }
  return async (userId,ticket)=>{
    if(typeof publisherKey!=='string'||!publisherKey||!/^\d{17}$/.test(userId)||
       typeof ticket!=='string'||!/^(?:[a-f0-9]{2}){16,2560}$/i.test(ticket))return false;
    const signal=AbortSignal.timeout(6000);
    const auth=await call('ISteamUserAuth/AuthenticateUserTicket/v1/',{appid:APP_ID,ticket,identity:AUDIENCE},signal);
    const result=auth?.response?.params;
    if(result?.result!=='OK'||typeof result.steamid!=='string'||result.steamid!==userId)return false;
    // ownsapp also covers active Family Sharing, free-weekend and PC Cafe licenses.
    const ownership=await call('ISteamUser/CheckAppOwnership/v4/',{appid:APP_ID,steamid:userId},signal);
    return ownership?.appownership?.ownsapp===true;
  };
}
module.exports={APP_ID,AUDIENCE,createSteamAuthenticate};
