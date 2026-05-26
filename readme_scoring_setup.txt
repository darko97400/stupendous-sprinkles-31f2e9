Project S scoring setup for Netlify

What was added:
- Scoring nav link
- Instagram link: https://www.instagram.com/projectsrts
- Discord link: https://discord.com/invite/WQM9WJhAg
- Global War Effort section on the homepage
- Top 100 Commanders leaderboard table
- Netlify Function: netlify/functions/submit-score.js
- Netlify Function: netlify/functions/leaderboard.js
- package.json dependency for @netlify/blobs
- Codex Unity prompt: CODEX_UNITY_SCORING_PROMPT.txt

How it works:
Unity sends a mission delta to:
https://projectsvr.net/.netlify/functions/submit-score

The website reads:
https://projectsvr.net/.netlify/functions/leaderboard?limit=100

Payload expected from Unity:
{
  "metaUserId": "123456789",
  "displayName": "MetaName",
  "robotsDestroyedDelta": 128,
  "gameVersion": "0.01",
  "platform": "quest"
}

Netlify deploy steps:
1. Upload/deploy this whole folder to Netlify.
2. Netlify should install @netlify/blobs from package.json.
3. After deploy, open:
   https://projectsvr.net/.netlify/functions/leaderboard?limit=100
4. It should return JSON with totalRobotsDestroyed and topPlayers.

Manual test after deploy:
Use Terminal:

curl -X POST https://projectsvr.net/.netlify/functions/submit-score \
  -H "Content-Type: application/json" \
  -d '{"metaUserId":"test_user_001","displayName":"TestCommander","robotsDestroyedDelta":25,"gameVersion":"0.01","platform":"quest"}'

Then refresh:
https://projectsvr.net/#scoring

Current security level:
Good for a community leaderboard prototype.
Not enough for prize automation. If you later add monthly prizes/codes, add signature validation or manual review.
