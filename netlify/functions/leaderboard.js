const { getStore } = require('@netlify/blobs');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://projectsvr.net',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const limitParam = Number(event.queryStringParameters && event.queryStringParameters.limit);
  const limit = Math.max(1, Math.min(100, Number.isFinite(limitParam) ? Math.floor(limitParam) : 100));

  try {
    const store = getLeaderboardStore();
    const listed = await store.list({ prefix: 'player:' });
    const blobs = Array.isArray(listed.blobs) ? listed.blobs : [];

    const players = [];
    let totalRobotsDestroyed = 0;

    for (const blob of blobs) {
      const key = blob.key || blob.name;
      if (!key) continue;

      try {
        const entry = await store.get(key, { type: 'json' });
        if (!entry) continue;

        const robotsDestroyedTotal = safeNumber(entry.robotsDestroyedTotal);
        totalRobotsDestroyed += robotsDestroyedTotal;

        players.push({
          displayName: String(entry.displayName || 'Commander').slice(0, 24),
          robotsDestroyedTotal,
          runsCount: safeNumber(entry.runsCount),
          bestRun: safeNumber(entry.bestRun),
          updatedAt: entry.updatedAt || null
        });
      } catch (error) {
        console.warn('Could not read leaderboard entry', key, error);
      }
    }

    players.sort((a, b) => {
      if (b.robotsDestroyedTotal !== a.robotsDestroyedTotal) {
        return b.robotsDestroyedTotal - a.robotsDestroyedTotal;
      }
      return b.bestRun - a.bestRun;
    });

    return json(200, {
      ok: true,
      totalRobotsDestroyed,
      topPlayers: players.slice(0, limit)
    });
  } catch (error) {
    console.error(error);
    return json(500, { ok: false, error: 'Could not load leaderboard', detail: error.message, name: error.name });
  }
};
