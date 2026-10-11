const crypto = require('node:crypto');
// Bump if existing templates/voice/processing change; shared with Unity.
// New optional kinds have their own version so old scoring/training MP3s survive.
const REVISION = 'ps-voice-20261010-v3-mp3';
const MODEL = 'eleven_v3';
const SETTINGS = { stability: 0.5, similarity_boost: 0.75, use_speaker_boost: true };
function normalizeName(value) {
  if (typeof value !== 'string' || value.length > 96) return null;
  let name = value.normalize('NFC');
  if (!/^[\p{L}\p{M}\p{N}\s_'\-]+$/u.test(name)) return null;
  // Speech only. Keep normal double letters (Emma, Aaron) and real name punctuation.
  name = name.replace(/[\p{N}_]+/gu, ' ')
    .replace(/(?<![\p{L}\p{M}])(\p{L})\1{2,}(?![\p{L}\p{M}])/giu, '')
    .replace(/\s+/gu, ' ').replace(/^[ '\-]+|[ '\-]+$/gu, '');
  if (name.length < 2 || name.length > 24 || !/\p{L}/u.test(name)) return null;
  return name;
}
function job(body) {
  if (!body || typeof body !== 'object' || Object.keys(body).some(k => !['userId','nonce','name','language','kind','revision'].includes(k))) return null;
  const name = normalizeName(body.name);
  if (!name || typeof body.userId !== 'string' || !/^[0-9]{3,24}$/.test(body.userId) || typeof body.nonce !== 'string' || body.nonce.length < 8 || body.nonce.length > 2048 ||
      !['fr','en'].includes(body.language) || !['win','lose','training','battle_start_v1','battle_support_v1'].includes(body.kind) || body.revision !== REVISION) return null;
  const fr = body.language === 'fr';
  const text = body.kind === 'battle_start_v1' ? (fr ? `Allez, ${name} ! Je compte sur toi. J’ai mis les robots en mode courage… le mode ménage, c’est demain !` : `Let's go, ${name}! I'm counting on you. The robots are in brave mode… cleaning mode can wait until tomorrow!`) :
    body.kind === 'battle_support_v1' ? (fr ? `Tiens bon, ${name} ! Je compte sur toi… et sur quelques boulons bien serrés !` : `Hang in there, ${name}! I'm counting on you… and a few tightly fastened bolts!`) :
    body.kind === 'win' ? (fr ? `Belle victoire, ${name} !` : `Great victory, ${name}!`) :
    body.kind === 'lose' ? (fr ? `Tu auras ta revanche, ${name} !` : `You'll get them next time, ${name}!`) :
    (fr ? `Bien joué, ${name} ! Entraînement terminé. À toi de jouer !` : `Well done, ${name}! Training complete. You're ready for action!`);
  const prompt = (body.kind === 'lose' ? '[encouraging] ' : '[excited] ') + text;
  return { ...body, name, prompt, voice: body.kind === 'training' ? 'cgSgspJ2msm6clMCkdW9' : 'IKne3meq5aSn9XLyUdCD', model: MODEL, settings: SETTINGS };
}
function digest(secret, value) { return crypto.createHmac('sha256', secret).update(value).digest('hex'); }
function keys(secret, j) {
  return { owner: digest(secret, j.userId), key: digest(secret, [j.userId,j.name,j.language,j.kind,REVISION].join('\n')) };
}
module.exports = { REVISION, normalizeName, job, keys };
