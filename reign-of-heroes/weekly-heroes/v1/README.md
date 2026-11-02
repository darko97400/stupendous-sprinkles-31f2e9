# Reign of Heroes — weekly hero illustrations

These twelve original cartoon illustrations follow the game's existing `HeroRotationV341` schedule. ImageGen generated each image using the four actual in-game hero cards as identity references. There is no AI generation at runtime.

The schedule starts Monday 5 January 2026 at 00:00 UTC. Compute `floor((utc - epoch).TotalDays / 7)`, then normalize modulo 12. Each Monday the game automatically selects that cycle's PNG. After twelve weeks the cycle repeats. No weekly manual upload or scheduled job is necessary.

`manifest.json` ties each image to the four stable game hero IDs and its SHA-256. `hero_vex` is Vaorik's intentionally stable internal ID. Images contain no text; the game adds sharp localized FR/EN captions.

The game checks every manifest entry against its own rotation. A manifest cannot change which heroes are free, grant purchases or activate the store. Invalid data, network errors and missing images keep the matching bundled illustration visible. Only one weekly texture is loaded; requests stop when leaving the main menu.

Purchases and weekly access restrictions remain disabled until the game's release configuration explicitly enables them. In this state the same panel says “Hero spotlight / À l'affiche” and “All heroes are available / Tous les héros sont disponibles”. With rotation enabled it says “4 free heroes / 4 héros gratuits” and shows the UTC end date.

To replace an illustration: keep the four exact hero identities, use PNG at approximately 1.144534:1 (512–2048 pixels per side, under 8 MiB), replace its `week-XX.png`, and update that entry's SHA-256 in the same commit. Keep the filename, cycle, epoch and hero IDs unchanged. Leave room for the native 3D frame; do not bake labels into the art.
