import { createHash } from 'node:crypto';
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';

// PICO publishes an independent OIDC issuer and key set for each region.
const issuers = new Map([
  'https://platform-us.picovr.com', 'https://platform-cn.picovr.com',
  'https://platform-sg.picoxr.com', 'https://platform-us.picoxr.us'
].map(issuer => [issuer, createRemoteJWKSet(new URL('/oidc/jwks', issuer))]));

export async function picoOwner(token, appId, keySets = issuers) {
  const { iss } = decodeJwt(token);
  const keySet = keySets.get(iss);
  if (!appId || !keySet) throw new Error('Invalid PICO identity');
  const { payload } = await jwtVerify(token, keySet, {
    algorithms: ['RS256'], issuer: iss, audience: appId, requiredClaims: ['exp', 'sub']
  });
  if (typeof payload.sub !== 'string' || !payload.sub.length ||
      (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== appId) ||
      (payload.azp !== undefined && payload.azp !== appId)) throw new Error('Invalid PICO identity');
  return 'pico-' + createHash('sha256').update(JSON.stringify([iss, appId, payload.sub])).digest('hex');
}
