document.documentElement.classList.add('js-enabled');

const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}


/* Navigation scroll helpers */
function closeMobileNav() {
  if (mainNav && navToggle) {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
}

function forcePageTop() {
  // Force the real browser scroll container to the absolute maximum top.
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Run once more after layout/animations so the page cannot stop a few pixels below the top.
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

/* Logo click: always return to the absolute top of the page */
const brandLink = document.querySelector('.brand');
if (brandLink) {
  brandLink.addEventListener('click', (event) => {
    event.preventDefault();
    closeMobileNav();
    forcePageTop();

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  });
}

/* Game & Merch / Merch links: scroll cleanly to the Merch section */
const merchSection = document.getElementById('merch');
document.querySelectorAll('a[href="#merch"]').forEach(link => {
  link.addEventListener('click', (event) => {
    if (!merchSection) return;

    event.preventDefault();
    closeMobileNav();

    const headerOffset = document.querySelector('.site-header')?.offsetHeight || 0;
    const extraGap = 12;
    const targetY = Math.max(
      0,
      merchSection.getBoundingClientRect().top + window.scrollY - headerOffset - extraGap
    );

    window.scrollTo({ top: targetY, left: 0, behavior: 'smooth' });

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#merch');
    }
  });
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => revealObserver.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('visible'));
}

/* Gallery controlled by gallery-config.js */
const galleryGrid = document.getElementById('galleryGrid');
const fallbackGallery = [
  { title: 'VR Gameplay', file: 'assets/gameplay-vr.png', show: true },
  { title: 'Victory', file: 'assets/victory.png', show: true },
  { title: 'Big Bob & Bouba', file: 'assets/robots-box.png', show: true },
  { title: 'Key Art', file: 'assets/hero-packshot.png', show: true }
];

function renderGallery() {
  if (!galleryGrid) return;

  const items = (window.PROJECTS_GALLERY || fallbackGallery).filter(item => item.show !== false);
  galleryGrid.innerHTML = '';

  items.forEach(item => {
    const button = document.createElement('button');
    button.className = 'gallery-card reveal visible';
    button.dataset.full = item.file;
    button.dataset.title = item.title;

    const image = document.createElement('img');
    image.src = item.file;
    image.alt = item.title;

    const label = document.createElement('span');
    label.textContent = item.title;

    button.appendChild(image);
    button.appendChild(label);
    galleryGrid.appendChild(button);
  });
}
renderGallery();

/* Custom PNG depth particles — fewer, bigger, vertical-only parallax */
const spriteAssets = window.PROJECTS_PARTICLES || [
  'assets/particles/red-arm-cables.png',
  'assets/particles/blue-arm-cables.png',
  'assets/particles/blue-arm.png',
  'assets/particles/blue-armor.png',
  'assets/particles/blue-core.png',
  'assets/particles/blue-head.png',
  'assets/particles/red-head-large.png',
  'assets/particles/red-leg-cannon.png',
  'assets/particles/red-core-shell.png',
  'assets/particles/red-armor.png',
  'assets/particles/red-head-damaged.png',
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function createParallaxSprites(selector, count, options = {}) {
  const layer = document.querySelector(selector);
  if (!layer) return;

  layer.innerHTML = '';

  const topMin = options.topMin || 0;
  const topMax = options.topMax || 220;
  const span = Math.max(1, topMax - topMin);

  const leftMin = options.leftMin || 8;
  const leftMax = options.leftMax || 92;
  const leftSpan = Math.max(1, leftMax - leftMin);

  const avoidCenterMin = options.avoidCenterMin ?? null;
  const avoidCenterMax = options.avoidCenterMax ?? null;

  function getSideBiasedLeft() {
    // When a center exclusion zone is defined, create more particles on the sides
    // by choosing either the left band or the right band.
    if (avoidCenterMin !== null && avoidCenterMax !== null) {
      const chooseLeft = Math.random() > 0.5;
      if (chooseLeft) {
        return rand(leftMin, Math.max(leftMin + 1, avoidCenterMin));
      }
      return rand(Math.min(leftMax - 1, avoidCenterMax), leftMax);
    }
    return rand(leftMin, leftMax);
  }

  // Build X anchors already biased to the sides rather than the center.
  const xAnchors = [];
  for (let i = 0; i < count; i += 1) {
    let x;
    if (avoidCenterMin !== null && avoidCenterMax !== null) {
      const half = count <= 1 ? 0 : i / Math.max(1, count - 1);
      const useLeftBand = i % 2 === 0;

      if (useLeftBand) {
        x = leftMin + half * Math.max(1, avoidCenterMin - leftMin);
      } else {
        x = avoidCenterMax + half * Math.max(1, leftMax - avoidCenterMax);
      }
      x += rand(-(options.leftJitter || 4), options.leftJitter || 4);
    } else {
      const slot = count <= 1 ? 0.5 : i / (count - 1);
      x = leftMin + slot * leftSpan;
    }
    xAnchors.push(x);
  }

  // Shuffle anchors for a more natural look.
  for (let i = xAnchors.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [xAnchors[i], xAnchors[j]] = [xAnchors[j], xAnchors[i]];
  }

  const yAnchors = [];
  for (let i = 0; i < count; i += 1) {
    const slot = count <= 1 ? 0.5 : i / (count - 1);
    yAnchors.push(topMin + slot * span);
  }

  for (let i = yAnchors.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [yAnchors[i], yAnchors[j]] = [yAnchors[j], yAnchors[i]];
  }

  const placed = [];
  const usedRotations = [];

  for (let i = 0; i < count; i += 1) {
    const sprite = document.createElement('img');
    sprite.className = 'parallax-sprite';
    sprite.src = spriteAssets[Math.floor(Math.random() * spriteAssets.length)];
    sprite.alt = '';

    const size = rand(options.sizeMin || 44, options.sizeMax || 110);
    const opacity = rand(options.opacityMin || 0.18, options.opacityMax || 0.34);

    let left = (xAnchors[i] ?? getSideBiasedLeft()) + rand(-(options.leftJitter || 4), options.leftJitter || 4);
    let top = yAnchors[i] + rand(-(options.topJitter || span * 0.03), options.topJitter || span * 0.03);

    const minXDist = options.minXDist || 10;
    const minYDist = options.minYDist || 18;

    let tries = 0;
    while (tries < 100) {
      const tooClose = placed.some(p =>
        Math.abs(p.left - left) < minXDist &&
        Math.abs(p.top - top) < minYDist
      );

      const inCenterAvoidZone = (
        avoidCenterMin !== null &&
        avoidCenterMax !== null &&
        left > avoidCenterMin &&
        left < avoidCenterMax
      );

      if (!tooClose && !inCenterAvoidZone) break;

      left = getSideBiasedLeft() + rand(-(options.leftJitter || 4), options.leftJitter || 4);
      top = yAnchors[i] + rand(-(options.topJitter || span * 0.03), options.topJitter || span * 0.03);
      tries += 1;
    }

    const rotateMin = options.rotateMin || -85;
    const rotateMax = options.rotateMax || 85;
    const minRotationGap = options.minRotationGap || 14;

    let rotate = rand(rotateMin, rotateMax);
    let rotateTry = 0;
    while (
      rotateTry < 80 &&
      usedRotations.some(r => Math.abs(r - rotate) < minRotationGap)
    ) {
      rotate = rand(rotateMin, rotateMax);
      rotateTry += 1;
    }

    const flipX = Math.random() > 0.5 ? -1 : 1;
    const flipY = Math.random() > 0.82 ? -1 : 1;

    const rotateStrength = rand(options.rotateStrengthMin || 0.004, options.rotateStrengthMax || 0.012)
      * (Math.random() > 0.5 ? 1 : -1);

    left = Math.max(leftMin, Math.min(leftMax, left));
    top = Math.max(topMin, Math.min(topMax, top));

    sprite.dataset.baseRotate = rotate.toFixed(3);
    sprite.dataset.flipX = flipX;
    sprite.dataset.flipY = flipY;
    sprite.dataset.rotateStrength = rotateStrength.toFixed(5);

    sprite.style.setProperty('--sprite-size', `${size}px`);
    sprite.style.setProperty('--sprite-opacity', opacity.toFixed(2));
    sprite.style.left = `${left}%`;
    sprite.style.top = `${top}vh`;
    sprite.style.transform = `translate3d(-50%, 0, 0) scale(${flipX}, ${flipY}) rotate(${rotate}deg)`;

    layer.appendChild(sprite);
    placed.push({ left, top });
    usedRotations.push(rotate);
  }
}

function buildDepthField() {
  const isMobile = window.innerWidth < 780;

  // Far = lots of small pieces, pushed more toward the sides, slower rotation.
  createParallaxSprites('.layer-far', isMobile ? 34 : 74, {
    sizeMin: 14,
    sizeMax: 32,
    topMin: 0,
    topMax: 430,
    leftMin: 3,
    leftMax: 97,
    avoidCenterMin: 36,
    avoidCenterMax: 64,
    leftJitter: 2,
    topJitter: 8,
    minXDist: 4,
    minYDist: 8,
    rotateMin: -140,
    rotateMax: 140,
    minRotationGap: 12,
    rotateStrengthMin: 0.0004,
    rotateStrengthMax: 0.0013,
    opacityMin: 0.06,
    opacityMax: 0.16
  });

  // Mid = more on the sides too, with less clutter around the text, slower rotation.
  createParallaxSprites('.layer-mid', isMobile ? 12 : 22, {
    sizeMin: 92,
    sizeMax: 175,
    topMin: 10,
    topMax: 425,
    leftMin: 8,
    leftMax: 92,
    avoidCenterMin: 34,
    avoidCenterMax: 66,
    leftJitter: 3,
    topJitter: 10,
    minXDist: 12,
    minYDist: 20,
    rotateMin: -150,
    rotateMax: 150,
    minRotationGap: 14,
    rotateStrengthMin: 0.0009,
    rotateStrengthMax: 0.0024,
    opacityMin: 0.10,
    opacityMax: 0.24
  });

  // Near = still large, but fewer in the middle, and slower/more pleasant rotation.
  createParallaxSprites('.layer-near', isMobile ? 0 : 12, {
    sizeMin: 280,
    sizeMax: 460,
    topMin: 24,
    topMax: 425,
    leftMin: 10,
    leftMax: 90,
    avoidCenterMin: 32,
    avoidCenterMax: 68,
    leftJitter: 2,
    topJitter: 12,
    minXDist: 18,
    minYDist: 32,
    rotateMin: -110,
    rotateMax: 110,
    minRotationGap: 16,
    rotateStrengthMin: 0.0012,
    rotateStrengthMax: 0.0032,
    opacityMin: 0.24,
    opacityMax: 0.40
  });
}

function updateSpriteRotations(layer, scrollY) {
  if (!layer) return;

  const sprites = layer.querySelectorAll('.parallax-sprite');
  sprites.forEach((sprite) => {
    const baseRotate = parseFloat(sprite.dataset.baseRotate || '0');
    const flipX = parseFloat(sprite.dataset.flipX || '1');
    const flipY = parseFloat(sprite.dataset.flipY || '1');
    const rotateStrength = parseFloat(sprite.dataset.rotateStrength || '0.006');

    // Small additional rotation while scrolling, enough to feel alive without looking too chaotic.
    const scrollRotate = scrollY * rotateStrength;
    const finalRotate = baseRotate + scrollRotate;

    sprite.style.transform = `translate3d(-50%, 0, 0) scale(${flipX}, ${flipY}) rotate(${finalRotate}deg)`;
  });
}

const layerFar = document.querySelector('.layer-far');
const layerMid = document.querySelector('.layer-mid');
const layerNear = document.querySelector('.layer-near');

function updateScrollDepth() {
  const y = window.scrollY || 0;

  // Stronger depth separation while keeping the main motion vertical.
  if (layerFar) layerFar.style.transform = `translate3d(0, ${-y * 0.025}px, 0)`;
  if (layerMid) layerMid.style.transform = `translate3d(0, ${-y * 0.17}px, 0)`;
  if (layerNear) layerNear.style.transform = `translate3d(0, ${-y * 0.42}px, 0)`;

  // Add a slight per-piece rotation while scrolling for extra depth / life.
  updateSpriteRotations(layerFar, y);
  updateSpriteRotations(layerMid, y);
  updateSpriteRotations(layerNear, y);
}

let scrollTicking = false;
let scrollDepthTimer = null;

window.addEventListener('scroll', () => {
  document.documentElement.classList.add('scrolling-depth');
  clearTimeout(scrollDepthTimer);
  scrollDepthTimer = setTimeout(() => {
    document.documentElement.classList.remove('scrolling-depth');
  }, 180);

  if (!scrollTicking) {
    requestAnimationFrame(() => {
      updateScrollDepth();
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    buildDepthField();
    updateScrollDepth();
  }, 150);
});

buildDepthField();
updateScrollDepth();

/* Subtle hero parallax on desktop */
const heroImage = document.querySelector('.hero-media img');
if (heroImage && window.matchMedia('(min-width: 781px)').matches) {
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 7;
    heroImage.style.transform = `scale(1.07) translate(${x}px, ${y}px)`;
  });
}

/* Lightbox */
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');

document.addEventListener('click', (e) => {
  const card = e.target.closest('.gallery-card');
  if (!card || !lightbox || !lightboxImage || !lightboxCaption) return;

  lightboxImage.src = card.dataset.full;
  lightboxImage.alt = card.dataset.title || 'Gallery image';
  lightboxCaption.textContent = card.dataset.title || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
});

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

/* Hidden email helper */
function hiddenProjectEmail() {
  return ['xperiencefx', 'gmail.com'].join('@');
}

/* Contact form with auto subject */
const contactForm = document.getElementById('contactForm');
const contactName = document.getElementById('contactName');
const contactTopic = document.getElementById('contactTopic');
const contactSubject = document.getElementById('contactSubject');

function updateContactSubject() {
  if (!contactSubject || !contactTopic) return;
  const topic = contactTopic.value || 'General';
  const name = contactName && contactName.value.trim() ? ` - ${contactName.value.trim()}` : '';
  contactSubject.value = `Project S Website - ${topic}${name}`;
}

if (contactName) contactName.addEventListener('input', updateContactSubject);
if (contactTopic) contactTopic.addEventListener('change', updateContactSubject);
updateContactSubject();

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateContactSubject();

    const formStatus = document.getElementById('formStatus');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);

    // Required by Netlify Forms when submitting with JavaScript.
    formData.set('form-name', 'contact');

    if (formStatus) {
      formStatus.className = 'form-status';
      formStatus.textContent = 'Sending message...';
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });

      if (!response.ok) {
        throw new Error(`Netlify form error: ${response.status}`);
      }

      contactForm.reset();
      updateContactSubject();

      if (formStatus) {
        formStatus.className = 'form-status success';
        formStatus.textContent = 'Message sent. Thanks!';
      }
    } catch (error) {
      if (formStatus) {
        formStatus.className = 'form-status error';
        formStatus.textContent = 'Message could not be sent here. Please try again after the site is fully deployed on Netlify.';
      }
      console.error(error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send message';
      }
    }
  });
}


window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (lightbox && lightbox.classList.contains('open')) closeLightbox();
    if (typeof orderModal !== 'undefined' && orderModal && orderModal.classList.contains('open')) closeOrderModal();
  }
});

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

/* Project S leaderboard */
const leaderboardBody = document.getElementById('leaderboardBody');
const leaderboardStatus = document.getElementById('leaderboardStatus');
const leaderboardPeriodLabel = document.getElementById('leaderboardPeriodLabel');
const leaderboardScoreHeader = document.getElementById('leaderboardScoreHeader');
const globalRobotsDestroyed = document.getElementById('globalRobotsDestroyed');
const monthlyRobotsDestroyed = document.getElementById('monthlyRobotsDestroyed');
const refreshLeaderboard = document.getElementById('refreshLeaderboard');
const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');

let activeLeaderboardPeriod = 'all';

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function escapeText(value) {
  const div = document.createElement('div');
  div.textContent = String(value || 'Commander');
  return div.innerHTML;
}

function updateLeaderboardTabs() {
  leaderboardTabs.forEach((tab) => {
    const isActive = tab.dataset.period === activeLeaderboardPeriod;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
}

async function loadProjectSLeaderboard(period = activeLeaderboardPeriod) {
  if (!leaderboardBody || !globalRobotsDestroyed) return;

  activeLeaderboardPeriod = period === 'month' ? 'month' : 'all';
  updateLeaderboardTabs();

  const isMonth = activeLeaderboardPeriod === 'month';

  if (leaderboardStatus) {
    leaderboardStatus.className = 'leaderboard-status';
    leaderboardStatus.textContent = isMonth ? 'Loading monthly Top 100 Commanders...' : 'Loading all-time Top 100 Commanders...';
  }

  if (leaderboardPeriodLabel) {
    leaderboardPeriodLabel.textContent = isMonth ? 'Showing this month ranking.' : 'Showing all-time ranking.';
  }

  if (leaderboardScoreHeader) {
    leaderboardScoreHeader.textContent = isMonth ? 'Robots This Month' : 'Robots Destroyed';
  }

  leaderboardBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

  try {
    const response = await fetch('/.netlify/functions/leaderboard?period=' + encodeURIComponent(activeLeaderboardPeriod) + '&limit=100', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Leaderboard request failed: ' + response.status);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Leaderboard returned an error');
    }

    const players = Array.isArray(data.topPlayers) ? data.topPlayers : [];
    globalRobotsDestroyed.textContent = formatNumber(data.totalRobotsDestroyed || 0);
    if (monthlyRobotsDestroyed) {
      monthlyRobotsDestroyed.textContent = formatNumber(data.totalRobotsDestroyedMonth || 0);
    }

    if (leaderboardPeriodLabel) {
      leaderboardPeriodLabel.textContent = isMonth
        ? 'Showing monthly ranking for ' + (data.monthKey || 'this month') + '.'
        : 'Showing all-time ranking. Lifetime score never resets.';
    }

    if (!players.length) {
      leaderboardBody.innerHTML = '<tr><td colspan="5">No commanders yet for this period.</td></tr>';
      if (leaderboardStatus) {
        leaderboardStatus.textContent = isMonth ? 'Waiting for the first score this month.' : 'Waiting for the first submitted score.';
      }
      return;
    }

    leaderboardBody.innerHTML = players.map((player, index) => {
      const rank = index + 1;
      const scoreValue = isMonth ? player.robotsDestroyedMonth : player.robotsDestroyedTotal;
      const runsValue = isMonth ? player.runsCountMonth : player.runsCount;
      const bestRunValue = isMonth ? player.bestRunMonth : player.bestRun;

      return `
        <tr>
          <td class="leaderboard-rank">#${rank}</td>
          <td class="leaderboard-name">${escapeText(player.displayName)}</td>
          <td class="leaderboard-number">${formatNumber(scoreValue)}</td>
          <td class="leaderboard-number">${formatNumber(runsValue)}</td>
          <td class="leaderboard-number">${formatNumber(bestRunValue)}</td>
        </tr>
      `;
    }).join('');

    if (leaderboardStatus) {
      leaderboardStatus.textContent = 'Showing Top ' + players.length + ' Commanders.';
    }
  } catch (error) {
    console.error(error);
    globalRobotsDestroyed.textContent = '--';
    if (monthlyRobotsDestroyed) monthlyRobotsDestroyed.textContent = '--';
    leaderboardBody.innerHTML = '<tr><td colspan="5">Leaderboard temporarily unavailable.</td></tr>';
    if (leaderboardStatus) {
      leaderboardStatus.className = 'leaderboard-status error';
      leaderboardStatus.textContent = 'Could not load scoring. Check Netlify Functions.';
    }
  }
}

leaderboardTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    loadProjectSLeaderboard(tab.dataset.period);
  });
});

if (refreshLeaderboard) {
  refreshLeaderboard.addEventListener('click', () => loadProjectSLeaderboard(activeLeaderboardPeriod));
}

loadProjectSLeaderboard('all');
