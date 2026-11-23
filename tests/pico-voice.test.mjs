import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair, SignJWT} from 'jose';
import {picoOwner} from '../voice-service/pico-auth.mjs';
import {createPicoVoice} from '../voice-service/pico-handler.mjs';
import catalog from '../voice-service/catalog.cjs';

test('PICO voice verifies the player and app before reserving a fixed line', async () => {
  const {publicKey, privateKey} = await generateKeyPair('RS256');
  const issuer = 'https://platform-us.picovr.com';
  const keys = new Map([[issuer, publicKey]]);
  const sign = (app, expiry) => new SignJWT({}).setSubject('player-one')
    .setProtectedHeader({alg:'RS256'}).setIssuer(issuer).setAudience(app)
    .setExpirationTime(expiry).sign(privateKey);
  let reservations = 0;
  const handler = createPicoVoice({appId:'test-project', hashSecret:'x'.repeat(32),
    verify:(token, app) => picoOwner(token, app, keys),
    store:{reserve:async () => { reservations++; return 'quota'; }}});
  const send = (idToken, extra = {}) => handler({httpMethod:'POST', body:JSON.stringify({
    idToken, name:'Élodie', kind:'win', language:'fr', revision:catalog.REVISION, ...extra
  })});
  const valid = await sign('test-project','1h');
  assert.equal((await send(await sign('other-project','1h'))).statusCode,401);
  assert.equal((await send(await sign('test-project',1))).statusCode,401);
  assert.equal((await send(valid,{userId:'chosen-by-client'})).statusCode,400);
  assert.equal(reservations,0);
  assert.equal((await send(valid)).statusCode,429);
  assert.equal(reservations,1);
});

test('PICO greeting uses the normalized display name and returns the same cached audio', async () => {
  const frame = Buffer.alloc(313);
  Buffer.from([255,251,112,192]).copy(frame);
  const mp3 = Buffer.concat(Array(5).fill(frame));
  let saved, generated = 0;
  const send = createPicoVoice({appId:'test-project', hashSecret:'s'.repeat(32),
    verify:async () => 'pico-'+'1'.repeat(64),
    store:{reserve:async () => saved ? 'ready' : 'new', save:async (_,data) => {saved=data;},
      get:async () => saved},
    synthesize:async job => {
      assert.match(job.prompt,/Élodie/);
      generated++;
      return mp3;
    }});
  const event = {httpMethod:'POST',body:JSON.stringify({name:'Élodie_47',idToken:'local-fixture',
    kind:'win',language:'fr',revision:catalog.REVISION})};
  for (let i=0; i<2; i++) {
    const result = await send(event);
    assert.equal(result.statusCode,200);
    assert.equal(result.body,mp3.toString('base64'));
  }
  assert.equal(generated,1);
});
