const { getStore } = require('@netlify/blobs');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://projectsvr.net',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function getLeaderboardStore() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;

  const options = {
    name: 'project-s-leaderboard',
    consistency: 'strong'
  };

  if (siteID && token) {
    options.siteID = siteID;
    options.token = token;
  }

  return getStore(options);
}

function sanitizeDisplayName(value, metaUserId) {
  const raw = String(value || '').trim();
  const cleaned = raw
    .replace(/[^a-zA-Z0-9_ .\-]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 24)
    .trim();

  if (cleaned) return cleaned;

  const id = String(metaUserId || '0000');
  return 'Commander_' + id.slice(-4);
}

function clampInt(value, min, max) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { ok: false, error: 'Invalid JSON' });
  }

  const metaUserId = String(payload.metaUserId || '').trim();
  if (!metaUserId || metaUserId.length < 3 || metaUserId.length > 80) {
    return json(400, { ok: false, error: 'Invalid metaUserId' });
  }

  const robotsDestroyedDelta = clampInt(payload.robotsDestroyedDelta, 0, 5000);
  if (robotsDestroyedDelta <= 0) {
    return json(400, { ok: false, error: 'robotsDestroyedDelta must be greater than 0' });
  }

  const displayName = sanitizeDisplayName(payload.displayName, metaUserId);
  const gameVersion = String(payload.gameVersion || '').slice(0, 24);
  const platform = String(payload.platform || 'quest').slice(0, 24);
  const now = new Date().toISOString();

  try {
    const store = getLeaderboardStore();
    const key = 'player:' + metaUserId;
    const existing = await store.get(key, { type: 'json' });

    const entry = existing || {
      metaUserId,
      displayName,
      robotsDestroyedTotal: 0,
      runsCount: 0,
      bestRun: 0,
      createdAt: now
    };

    entry.displayName = displayName;
    entry.robotsDestroyedTotal = clampInt(entry.robotsDestroyedTotal, 0, Number.MAX_SAFE_INTEGER) + robotsDestroyedDelta;
    entry.runsCount = clampInt(entry.runsCount, 0, Number.MAX_SAFE_INTEGER) + 1;
    entry.bestRun = Math.max(clampInt(entry.bestRun, 0, Number.MAX_SAFE_INTEGER), robotsDestroyedDelta);
    entry.lastGameVersion = gameVersion;
    entry.platform = platform;
    entry.updatedAt = now;

    await store.setJSON(key, entry);

    return json(200, {
      ok: true,
      player: {
        displayName: entry.displayName,
        robotsDestroyedTotal: entry.robotsDestroyedTotal,
        runsCount: entry.runsCount,
        bestRun: entry.bestRun
      }
    });
  } catch (error) {
    console.error(error);
    return json(500, { ok: false, error: 'Could not save score', detail: error.message, name: error.name });
  }
};
