# Project S — website redesign

## Overview

A responsive English site with a dark navy and orange visual direction, new reference-based cartoon illustrations, live official leaderboards, community links and merchandise. The video, YouTube player and trailer controls have been removed.

The next update is clearly marked **upcoming** throughout the site. A prominent announcement above the hero highlights **hand tracking, 40 levels, 10 planets and 10 playable factions**. These features are not presented as already available, and no release date is invented. The current game is still described as having 8 levels, 2 planets and more than 10 units/vehicles, as on the existing website.

## Artwork

Two new illustrations were generated with ImageGen using **both supplied images as direct image references**, then visually compared with them before integration. The design constraints preserve hovering robots without legs or feet, broad circular thrusters, recognizable armor and head shapes, reference colors and the distinct faction silhouettes. The next-update image is concept artwork, not a gameplay screenshot or a complete ten-faction roster.

- `assets/hero-reference-v4.webp`: new blue/red battle illustration for the hero.
- `assets/factions-reference-v4.webp`: new illustration of the distinct referenced factions for the upcoming update.
- `assets/keyart-current.webp` and `assets/keyart-update.webp`: the supplied reference artwork, retained in the source assets.
- Merchandise imagery is retained from the supplied ZIP.

Illustration generation can vary small mechanical details. It is not an exact reconstruction of in-game models. No earlier rejected generation is reused.

## Live leaderboard

The frontend retains the existing read-only endpoint:

`/.netlify/functions/leaderboard?period=all&limit=100`

Monthly rankings use `period=month`. Backend fields and behavior are unchanged. The interface adds search within the top 100, progressive display, a refresh button, loading/error/empty states and protection against out-of-order responses. All interface text, date labels and number formatting are in English.

No fictitious scores or frozen score snapshots are used. Availability depends on the official leaderboard service. This presentation site does not submit scores or reset rankings.

## Deploying on the current hosting

This archive is based on the supplied project ZIP and preserves its Netlify functions, migrations, voice service, dependencies and existing configuration. Presentation changes are in `index.html`, `styles.css`, `script.js`, `favicon.svg`, artwork assets and the privacy page layout. The privacy policy wording is unchanged. The build copy script also includes SVG files.

1. Keep a backup of the currently deployed version.
2. Use this archive as source for the **same existing Netlify project**. Preserve its existing environment variables and Netlify Blobs access. Do not create an empty replacement leaderboard store.
3. Install existing dependencies with `npm ci` in the deployment environment.
4. The build command remains `node scripts/prepare-site.cjs`, the publish folder is `site-dist`, and functions remain in `netlify/functions`.
5. Check both leaderboard periods after deployment and confirm the existing score-submission flow from the game.

Original backend code is unchanged. Write operations were not executed during testing so that game data would not be modified. The original projectsvr.net site has not been changed.

## Separate private preview

The separate private preview reads public rankings through a fixed server-side, read-only relay to projectsvr.net. The relay is needed because the original API permits browser requests only from its own domain. It is not needed when the redesigned frontend is deployed to the original Netlify domain.

This archive is the portable Netlify project, not the preview relay code. Opening index.html directly can show the design but cannot run Netlify functions; use the existing deployment for functioning rankings.

## Checks

- English copy, navigation, buttons, alt text and live leaderboard states.
- Desktop and 390/320 px responsive layouts.
- Real all-time and monthly rankings, search and refresh.
- JavaScript syntax, unique IDs, local assets and anchors.
- Worker asset handling, fixed read-only proxy and upstream errors.
- Netlify build, archive integrity and unchanged original backend files.
- No video player, iframe or trailer controls in the public site.
