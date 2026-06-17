PROJECT S - RESET LEADERBOARD SCORES

What changed:
1. Website text changed from Wishlist / Coming Soon to Available Now / Get Project S.
2. Added a protected Netlify Function:
   /.netlify/functions/reset-leaderboard

How the reset works:
- It lists every Netlify Blob key starting with player:
- It saves a backup first under a key like backup:reset:2026-06-17T...
- It deletes all player score entries after the backup is saved.
- New scores submitted after the reset will start from zero.

Before using it:
1. In Netlify, go to Site configuration > Environment variables.
2. Add this variable:
   LEADERBOARD_RESET_TOKEN
3. Put a long secret value, minimum 16 characters, for example a random password.
4. Deploy this updated project.

To reset the live scores after deploy:
Replace YOUR_SECRET_TOKEN with your Netlify environment variable value:

curl -X POST "https://projectsvr.net/.netlify/functions/reset-leaderboard" \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN"

Expected success response:
{
  "ok": true,
  "resetAt": "...",
  "deletedCount": 12,
  "backupKey": "backup:reset:..."
}

Important:
- Do not put LEADERBOARD_RESET_TOKEN in Unity or in public JavaScript.
- Keep this token private.
- After reset, you can keep the function for future admin resets, or delete netlify/functions/reset-leaderboard.js and redeploy.
