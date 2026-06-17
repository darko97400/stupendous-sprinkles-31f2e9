const { getStore } = require('@netlify/blobs');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://projectsvr.net',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store'
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

function isAuthorized(event) {
  const expected = process.env.LEADERBOARD_RESET_TOKEN;
  if (!expected || expected.length < 16) return false;

  const auth = event.headers.authorization || event.headers.Authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const bodyToken = (() => {
    try {
      const body = JSON.parse(event.body || '{}');
      return String(body.token || '').trim();
    } catch (_) {
      return '';
    }
  })();

  return bearer === expected || bodyToken === expected;
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  if (!isAuthorized(event)) {
    return json(401, { ok: false, error: 'Unauthorized' });
  }

  try {
    const store = getLeaderboardStore();
    const listed = await store.list({ prefix: 'player:' });
    const blobs = Array.isArray(listed.blobs) ? listed.blobs : [];

    const backup = [];
    const deletedKeys = [];

    for (const blob of blobs) {
      const key = blob.key || blob.name;
      if (!key) continue;

      try {
        const entry = await store.get(key, { type: 'json' });
        backup.push({ key, entry });
      } catch (error) {
        backup.push({ key, entry: null, readError: error.message });
      }
    }

    const resetAt = new Date().toISOString();
    const backupKey = 'backup:reset:' + resetAt.replace(/[:.]/g, '-');
    await store.setJSON(backupKey, {
      resetAt,
      count: backup.length,
      entries: backup
    });

    for (const item of backup) {
      await store.delete(item.key);
      deletedKeys.push(item.key);
    }

    return json(200, {
      ok: true,
      resetAt,
      deletedCount: deletedKeys.length,
      backupKey
    });
  } catch (error) {
    console.error(error);
    return json(500, {
      ok: false,
      error: 'Could not reset leaderboard',
      detail: error.message,
      name: error.name
    });
  }
};
