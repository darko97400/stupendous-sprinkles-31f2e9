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

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const params = event.queryStringParameters || {};
  const limitParam = Number(params.limit);
  const limit = Math.max(1, Math.min(100, Number.isFinite(limitParam) ? Math.floor(limitParam) : 100));
  const period = String(params.period || 'all').toLowerCase() === 'month' ? 'month' : 'all';
  const monthKey = currentMonthKey();

  try {
    const store = getLeaderboardStore();
    const listed = await store.list({ prefix: 'player:' });
    const blobs = Array.isArray(listed.blobs) ? listed.blobs : [];

    const players = [];
    let totalRobotsDestroyed = 0;
    let totalRobotsDestroyedMonth = 0;

    for (const blob of blobs) {
      const key = blob.key || blob.name;
      if (!key) continue;

      try {
        const entry = await store.get(key, { type: 'json' });
        if (!entry) continue;

        const entryMonthKey = entry.monthKey === monthKey ? monthKey : null;
        const robotsDestroyedTotal = safeNumber(entry.robotsDestroyedTotal);
        const robotsDestroyedMonth = entryMonthKey ? safeNumber(entry.robotsDestroyedMonth) : 0;
        const runsCount = safeNumber(entry.runsCount);
        const runsCountMonth = entryMonthKey ? safeNumber(entry.runsCountMonth) : 0;
        const bestRun = safeNumber(entry.bestRun);
        const bestRunMonth = entryMonthKey ? safeNumber(entry.bestRunMonth) : 0;

        totalRobotsDestroyed += robotsDestroyedTotal;
        totalRobotsDestroyedMonth += robotsDestroyedMonth;

        players.push({
          displayName: String(entry.displayName || 'Commander').slice(0, 24),
          robotsDestroyedTotal,
          robotsDestroyedMonth,
          runsCount,
          runsCountMonth,
          bestRun,
          bestRunMonth,
          monthKey: entryMonthKey || monthKey,
          updatedAt: entry.updatedAt || null
        });
      } catch (error) {
        console.warn('Could not read leaderboard entry', key, error);
      }
    }

    players.sort((a, b) => {
      if (period === 'month') {
        if (b.robotsDestroyedMonth !== a.robotsDestroyedMonth) {
          return b.robotsDestroyedMonth - a.robotsDestroyedMonth;
        }
        return b.bestRunMonth - a.bestRunMonth;
      }

      if (b.robotsDestroyedTotal !== a.robotsDestroyedTotal) {
        return b.robotsDestroyedTotal - a.robotsDestroyedTotal;
      }
      return b.bestRun - a.bestRun;
    });

    const filteredPlayers = period === 'month'
      ? players.filter(player => player.robotsDestroyedMonth > 0)
      : players;

    return json(200, {
      ok: true,
      period,
      monthKey,
      totalRobotsDestroyed,
      totalRobotsDestroyedMonth,
      topPlayers: filteredPlayers.slice(0, limit)
    });
  } catch (error) {
    console.error(error);
    return json(500, {
      ok: false,
      error: 'Could not load leaderboard',
      detail: error.message,
      name: error.name
    });
  }
};
