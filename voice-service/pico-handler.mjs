import { picoOwner } from './pico-auth.mjs';
import handler from './handler.cjs';

const fields = new Set(['idToken', 'name', 'language', 'kind', 'revision']);
export function createPicoVoice({appId, store, synthesize, hashSecret, verify = picoOwner}) {
  return async event => {
    const reply = statusCode => ({statusCode, headers: {'Cache-Control':'no-store'}, body:''});
    if (event.httpMethod !== 'POST') return reply(405);
    if (!appId || !hashSecret || hashSecret.length < 32) return reply(503);
    if (typeof event.body !== 'string' || Buffer.byteLength(event.body) > 8192) return reply(400);
    let body;
    try { body = JSON.parse(event.body); } catch { return reply(400); }
    if (!body || Object.keys(body).some(k => !fields.has(k)) ||
        typeof body.idToken !== 'string' || !body.idToken.length) return reply(400);
    const { idToken, ...metadata } = body;
    let owner;
    try { owner = await verify(idToken, appId); } catch { return reply(401); }
    const generate = handler.createHandler({enabled:true, hashSecret, store, synthesize,
      idPattern:/^pico-[a-f0-9]{64}$/, authenticate: async id => id === owner});
    return generate({httpMethod:'POST', body:JSON.stringify({...metadata, userId:owner, nonce:'verified-pico-oidc'})});
  };
}
