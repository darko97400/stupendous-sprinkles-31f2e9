Project S website package v2
===========================

What was updated:
- Added the YouTube trailer embed: https://youtu.be/HPIkUr10lnA
- Changed the hero background to the new image you provided
- Removed the transparent logo image from the gallery
- Added a Merchandising section with mug / cap / shirt
- Added a game store section for the VR game ($20)
- Added hidden-contact button (email not displayed on the page)
- Added a lightweight floating particle / depth effect
- Added order-request modal for merch and game

Important note about purchases:
This version lets users click Buy and send an order request by email.
That means it is NOT a real automated payment checkout yet.
For true payments, later replace the Buy buttons with:
- Stripe payment links
- Gumroad links
- Shopify product links
- PayPal checkout links

Files included:
- index.html
- styles.css
- script.js
- assets/

Quick edits:
1. Change text in index.html directly.
2. Replace images by keeping the same filenames in the assets folder.
3. If you later have a Meta Store page, replace the Game button behavior or add a real store URL.
4. If you want real automated merch sales, connect Stripe / Shopify.


V2.1 fix:
- Fixed the blank hero/page issue caused by reveal animations staying invisible when script.js is not loaded or blocked.
- Content is now visible by default, with animation only when JavaScript is working.


V2.2 update:
- Replaced the YouTube iframe with a clean trailer poster + YouTube button to avoid local-file Error 153.
- Added a more visible depth effect: foreground particles, background particles, soft glow layers, and desktop hero parallax.
- Added a real contact form layout with name, email, topic, message.
- The contact form auto-generates the subject and opens the user's email app without showing your email on the page.
- Note: direct email sending from a static HTML site requires a service such as Netlify Forms, Formspree, EmailJS, or a backend.


V2.3 update:
- Restored an embedded YouTube player so the trailer can play directly in the website.
- Uses youtube-nocookie.com privacy-enhanced embed.
- If you still see Error 153 while testing by double-clicking index.html, upload the site to Netlify/Vercel and confirm embedding is allowed in YouTube Studio.
- For a 100% guaranteed local/direct playback without YouTube restrictions, replace the iframe with a real MP4 file and an HTML5 <video> tag.


V2.4 update:
- Added faster low-opacity particles.
- Added scroll-depth particles that move with the page for a stronger depth feeling when scrolling.
- Gallery is now controlled by gallery-config.js:
  set show: true or show: false for each image.
- Hidden the two images you marked with a red X by default.
- Added a visible auto Subject field in the contact form.
- Added START_LOCAL_SERVER.bat for Windows. Use it instead of double-clicking index.html when testing YouTube embeds locally.

About the YouTube trailer:
- The trailer is still embedded directly in the site.
- If it shows Error 153 when opening index.html directly, run START_LOCAL_SERVER.bat and open http://localhost:8080.
- If it still fails after the site is hosted online, check YouTube Studio to confirm that embedding is allowed for the video.
- The only 100% guaranteed alternative is to put an MP4 file in the site and use an HTML5 <video> tag.


V2.5 update:
- Removed autonomous particle animation.
- Particles now move only when the page scrolls, at different speeds for depth.
- Removed visible helper text under the trailer.
- Removed visible helper text under the gallery.
- Fixed the extra empty scroll space at the bottom by replacing the long absolute particle field with fixed parallax layers.


V2.6 update:
- Contact form now uses Netlify Forms instead of mailto.
- Added success.html after form submission.
- Added Netlify honeypot anti-spam field.
- Contact form subject is still generated automatically.
- Particles become more visible only while scrolling.

Netlify Forms setup:
1. Deploy the whole folder to Netlify.
2. Open Netlify dashboard > your site > Forms.
3. Submit one test message from the live site.
4. You should see a form named "contact".
5. To receive emails, configure Form notifications in Netlify:
   Site configuration / Forms / Form notifications > Add email notification.


V2.7 update:
- Merch products are now marked Coming Soon.
- Removed the temporary email order modal.
- VR game button is now Coming Soon instead of Buy/Wishlist.
- Prices remain visible as target prices:
  Mug $20 / Cap $28 / Shirt $35 / VR Game $20.


V2.8 update:
- Fixed form redirect from /success.html to /success/.
- Added /success/index.html so Netlify can find the thank-you page.
- Kept a small /success.html redirect file for compatibility.
- Removed all visible product prices.
- Removed the visible game price.
- Product cards now show Coming Soon only.
- Netlify form still uses name="contact", data-netlify="true", and hidden form-name field.


V2.9 update:
- Removed the contact form redirect to /success.html or /success/.
- Contact form now submits to Netlify in-place with JavaScript.
- After clicking Send message, the visitor stays on the same page and sees "Message sent. Thanks!"
- Added _redirects so old cached /success paths return to the homepage instead of a 404.
- This ZIP is packaged with index.html at the root, which is safer for Netlify drag-and-drop deploys.

Netlify deploy tip:
Upload the CONTENTS of this folder, or upload this ZIP directly.
The root of the deployed site must contain index.html, styles.css, script.js, gallery-config.js, and assets/.


V3.0 update:
- Removed visible game price text.
- Removed the line "Embedded directly from your YouTube trailer."
- Trailer section now says this is a concept video for the game's direction, tone, and gameplay vision.


V3.1 update:
- Aligned all merch 'Coming Soon' buttons at the same baseline.
- Hid any leftover visible price text in merch cards.
- Made background particles more visible.
- Increased the number, size, glow, and scroll displacement of depth particles for a stronger scroll effect.
- You can later replace the particles with custom PNG sprites if desired.


V3.2 update:
- Removed / hidden the "Big Bob & Bouba" image from the Gallery section.
- The image file is still kept in assets because the site may use it elsewhere.


V3.3 update:
- Replaced the old dot particles with your custom PNG robot-part sprites.
- Added three depth layers (far / mid / near) for a stronger 3D feeling when scrolling.
- Near sprites now move much more than far sprites, so the parallax effect feels more obvious.
- The PNG files are stored in assets/particles/.


V3.4 update:
- Changed merch cap text to: "Black Cap with embroidered".
- Reduced PNG particle count by about 2x.
- Made particles bigger overall.
- Made foreground particles about 3x larger.
- Removed the opacity-change effect during scroll.
- Particles now sit behind the text/content and move only vertically for a cleaner depth effect.


V3.5 update:
- Foreground PNG particles made about 3x larger.
- Background particles increased in number and reduced to about 0.5x size.
- Mid layer kept similar for readability and depth balance.


V3.6 update:
- Reduced foreground PNG particles by about 2x.
- Doubled the number of small background PNG particles.
- Mid layer kept unchanged.


V3.7 update:
- Fixed PNG parts being partially hidden/cut too aggressively.
- Added safer placement margins for large foreground particles.
- Increased brightness/opacity slightly for near and mid layers so dark robot heads don't disappear into the dark background.
- Particle layers now use overflow: visible to reduce clipping.


V3.8 update:
- Added more large pieces in the mid and near layers.
- Added many more small background pieces.
- Extended the particle field vertically so particles stay visible lower on the site.
- Made the vertical-only parallax more obvious for a stronger 3D feeling.


V3.9 update:
- Particles are now distributed more evenly from the top to the bottom of the site.
- Added more big foreground pieces.
- Added more small background pieces.
- Extended the particle field height so big pieces remain visible lower on the page.
- Slightly reduced the near-layer scroll speed so large pieces do not disappear too early.


V4.0 update:
- Increased rotation variety so repeated PNGs do not all look the same.
- Spread large pieces more evenly across the page, especially lower on the site.
- Added spacing constraints so big pieces do not sit too close to each other.
- Increased full-page distribution while keeping the depth effect.


V4.1 update:
- Added stronger random rotation variation to the PNG particles.
- Reduced the number of large foreground pieces by about 15%.
- Added more small and medium particles.
- Added random opacity variation for the far and mid layers.


V4.2 update:
- Increased random rotation variety even more.
- Added a minimum rotation gap so pieces in the same layer are less likely to share similar angles.
- Added occasional horizontal / vertical flips for extra visual variation.


V4.3 update:
- Added the new robot debris PNG particle pack.
- Replaced/updated the particle assets in assets/particles/.
- Added particles-config.js so future particle changes are easier.
- To add new particles later:
  1. Put the PNG in assets/particles/
  2. Add the file path to particles-config.js


V4.4 update:
- Stronger 3D feeling in the particle system.
- Increased separation between far / mid / near scroll speeds.
- Made far particles smaller and near particles slightly larger for clearer depth.
- Kept vertical-only movement and no scroll-opacity effect.


V4.5 update:
- Added a slight scroll-based rotation to the PNG particles.
- Each particle now has its own base angle plus its own small rotation strength.
- Far particles rotate very slightly, mid particles a bit more, near particles the most.
- Main movement is still vertical, but the pieces now feel a bit more alive and 3D while scrolling.


V4.6 update:
- Reduced particle density in the center area where the text sits.
- Biased more particles toward the left and right sides.
- Slowed the scroll-based rotation so it feels smoother and less distracting.
- Kept random rotation variety, but made the motion more pleasant.


V4.7 update:
- Replaced merch default images with the new robot lifestyle photos:
  Mug = robot with mug
  Cap = robot with cap
  Shirt = robot wearing shirt
- On desktop hover, the product image swaps back to the clean studio mockup on gray background.
- On touch/mobile, the images cycle between lifestyle and studio mockup automatically.
- Kept products as Coming Soon.


V4.8 update:
- Removed requested descriptive paragraphs from Features, Gallery, Merch, Game, and Contact sections.


V4.9 update:
- Fixed the white/grey contour on merch hover images.
- Created transparent cutout versions of the mug, cap, and shirt mockups.
- Hover state now shows the mockup on a dark sci-fi background instead of a light grey/white plate.


V5.0 update:
- Fixed merch hover images being cropped.
- Product image area is now square, which fits the mug/cap/shirt studio mockups better.
- Hover mockup uses object-fit: contain with extra padding and a slight scale-down.


V5.1 update:
- Removed the automatic transparent/cutout hover versions for mug/cap/shirt.
- Restored the original product mockups with the light grey studio background on hover.
- Kept the square merch image area so the mockups do not crop.


V5.2 update:
- Changed hero title to three separate lines:
  Big Robot Wars
  Tiny Tabletop
  Pure VR Chaos


V5.3 update:
- Shirt text changed/kept as: "Black shirt with a bold Project S"


V5.4 update:
- Adjusted requested text line breaks:
  Business, press, merch,
  or collaboration.

  Bring Project S
  into the real world.

  Fast, readable strategy
  with a bold sci-fi look.


V5.5 update:
- Changed the sentence layout to:
  Command Bouba, Big Bob,
  and a growing army across
  Rustoria and beyond.
- Reduced the size of the large foreground particle pieces to help avoid visible pixelation.


V5.6 update:
- Hid the visible "Subject Auto" field in the contact form.
- Kept the hidden subject value so Netlify still receives the auto-generated email subject.


V5.7 update:
- Reduced the size of the hero title.
- Kept the title exactly on these three lines:
  Big Robot Wars
  Tiny Tabletop
  Pure VR Chaos
- Prevented "Big Robot Wars" from breaking into two lines.


V5.8 update:
- Added the new blue robot PNG as a fixed decorative element at the bottom-right of the site.
- It stays attached to the bottom of the viewport, has a subtle glow/shadow, and gently floats.
- It uses pointer-events: none so it does not block clicks.


V5.9 update:
- The blue robot PNG is no longer fixed to the viewport.
- It now appears only when reaching the bottom of the website.
- It is positioned at the bottom-left inside the footer.


V6.0 update:
- Moved the footer robot into the foreground.
- Reduced and repositioned it so it stays bottom-left but does not cover the footer copy.
- Added left padding to the footer content so:
  Project S
  Solo indie VR tabletop RTS project...
  stays fully readable.


V6.3 update:
- Cropped the transparent empty space around the footer robot PNG.
- The robot should now visibly scale much larger.
- Added stronger CSS overrides to force the footer robot size.


V6.4 update:
- Made the footer robots slightly smaller and moved them upward.
- Reworked the footer text layout so it looks cleaner and less cramped.
- Reduced awkward wrapping on the right side and improved the footer typography.


V6.5 update:
- Moved the footer robots higher and made them a bit smaller.
- Reworked the footer into a cleaner glass-style text panel on the right.
- Reduced and cleaned up the footer typography and year/copyright layout.


V6.6 update:
- Reduced the footer robots again.
- Allowed them to overlap upward above the footer divider line so the hands/head can rise in front.
- Cleaned up and reduced the right footer card / pagination text.


V6.7 update:
- Increased the footer robots by about 1.5x.
- Tightened the footer text card slightly.
- Added overflow/height cleanup to help remove the extra scrollbar.


V6.8 update:
- Restored the footer robots so they rise above the footer divider again.
- Kept them bigger.
- Adjusted html/body/footer overflow so the overlap effect returns without the earlier bad scroll behavior.


V6.9 update:
- Removed the footer sentence "Built around your art, trailer, merch and store goals."
- Kept only: "Solo indie VR tabletop RTS project."
- Raised the footer stacking context and robot z-index so the robots should now appear in front above the footer divider again.


V7.0 update:
- Moved the blue robots out of the footer into a dedicated overlay layer placed between the main content and the footer.
- This avoids the clipping/stacking issue and makes the robots appear truly in front above the footer line.
- Footer text remains simplified:
  Project S
  Solo indie VR tabletop RTS project.


V7.1 update:
- Fixed the double-scrollbar issue.
- Body scrolling is clipped so only the main browser/html scrollbar remains.
- Footer/robot overlay stays visible but should not create a second scrollbar.


V7.2 update:
- Increased the footer robot overlay to roughly 2x larger.
- Adjusted the overlay vertical position so the larger robots still rise above the footer area.


V7.3 mobile pass:
- Added responsive layout overrides for tablet and phone.
- Hero, buttons, text, grids, merch cards, trailer, and contact form are adjusted for mobile.
- The bottom blue robots are much smaller and safer on phones so they stop breaking the layout.


V7.4 update:
- The bottom blue robots are now hidden on mobile only.
- Desktop/tablet keeps the bottom robot overlay.
- Footer text block is re-centered on mobile after hiding the robots.


Added by request:
- Backpack
- Hoodie
- Mouse Pad
Backpack / Hoodie / Mouse Pad are currently set to Coming soon cards.
You can later replace them with your Printify links inside index.html.

V7.6 update:
- Added Printify links:
  Hoodie: https://project-s.printify.me/product/28435415
  Backpack: https://project-s.printify.me/product/28435529
  Mouse Pad: https://project-s.printify.me/product/28435568
- Updated product buttons from Coming soon to Buy buttons.

V7.7 update:
- Fixed malformed merch HTML from V7.6.
- Removed the 3 empty/extra product cards.
- Confirmed merch section now has exactly 6 products:
  Mug, Cap, Shirt, Backpack, Hoodie, Mouse Pad.
