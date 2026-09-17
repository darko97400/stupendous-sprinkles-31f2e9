const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#primary-nav');
const year = document.querySelector('#year');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (year) year.textContent = new Date().getFullYear();

const updateHeader = () => {
  header?.classList.toggle('scrolled', window.scrollY > 24);
};
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

navToggle?.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

if (!reducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.13 });

  document.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 3, 2) * 90}ms`;
    revealObserver.observe(element);
  });
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

const counters = document.querySelectorAll('[data-count]');
let countersStarted = false;
const startCounters = () => {
  if (countersStarted) return;
  countersStarted = true;
  counters.forEach((counter) => {
    const target = Number(counter.dataset.count);
    const suffix = counter.dataset.suffix || '';
    if (reducedMotion) {
      counter.textContent = target + suffix;
      return;
    }
    const started = performance.now();
    const duration = 900;
    const step = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
};

const worldStats = document.querySelector('.world-stats');
if (worldStats && 'IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      startCounters();
      observer.disconnect();
    }
  }, { threshold: .4 });
  counterObserver.observe(worldStats);
} else {
  startCounters();
}

const modal = document.querySelector('.trailer-modal');
const trailerFrame = modal?.querySelector('iframe');
const openButtons = document.querySelectorAll('.trailer-open');
const closeButton = modal?.querySelector('.trailer-close');

const closeTrailer = () => {
  if (!modal) return;
  modal.close();
  document.body.classList.remove('modal-open');
  if (trailerFrame) trailerFrame.src = '';
};

openButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!modal) return;
    if (trailerFrame) trailerFrame.src = trailerFrame.dataset.src;
    modal.showModal();
    document.body.classList.add('modal-open');
  });
});

closeButton?.addEventListener('click', closeTrailer);
modal?.addEventListener('click', (event) => {
  if (event.target === modal) closeTrailer();
});
modal?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeTrailer();
});

const cursor = document.querySelector('.cursor-glow');
if (cursor && window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
  window.addEventListener('pointermove', (event) => {
    cursor.style.left = event.clientX + 'px';
    cursor.style.top = event.clientY + 'px';
  }, { passive: true });
  document.querySelectorAll('a, button').forEach((item) => {
    item.addEventListener('pointerenter', () => cursor.classList.add('hover'));
    item.addEventListener('pointerleave', () => cursor.classList.remove('hover'));
  });
}

const heroArt = document.querySelector('.hero-art');
if (heroArt && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - .5) * -10;
    const y = (event.clientY / window.innerHeight - .5) * -6;
    heroArt.style.translate = `${x}px ${y}px`;
  }, { passive: true });
}


/* Project S leaderboard */
const leaderboardBody = document.getElementById('leaderboardBody');
const leaderboardStatus = document.getElementById('leaderboardStatus');
const leaderboardPeriodLabel = document.getElementById('leaderboardPeriodLabel');
const leaderboardScoreHeader = document.getElementById('leaderboardScoreHeader');
const globalRobotsDestroyed = document.getElementById('globalRobotsDestroyed');
const monthlyRobotsDestroyed = document.getElementById('monthlyRobotsDestroyed');
const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
let activeLeaderboardPeriod = 'all';

function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString('en-US') : '0';
}

function escapeText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateLeaderboardTabs() {
  leaderboardTabs.forEach((tab) => {
    const active = tab.dataset.period === activeLeaderboardPeriod;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
}

async function loadLeaderboard() {
  if (!leaderboardBody || !globalRobotsDestroyed || !monthlyRobotsDestroyed) return;

  const isMonth = activeLeaderboardPeriod === 'month';
  updateLeaderboardTabs();

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
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();
    const players = Array.isArray(data.topPlayers) ? data.topPlayers : [];
    globalRobotsDestroyed.textContent = formatNumber(data.totalRobotsDestroyed);
    monthlyRobotsDestroyed.textContent = formatNumber(data.totalRobotsDestroyedMonth);

    if (leaderboardPeriodLabel) {
      leaderboardPeriodLabel.textContent = isMonth
        ? 'Showing this month ranking. Monthly score resets automatically.'
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
    leaderboardBody.innerHTML = '<tr><td colspan="5">Leaderboard temporarily unavailable.</td></tr>';
    if (leaderboardStatus) {
      leaderboardStatus.className = 'leaderboard-status error';
      leaderboardStatus.textContent = 'Could not load scoring. Check Netlify Functions.';
    }
    console.error(error);
  }
}

leaderboardTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const period = tab.dataset.period === 'month' ? 'month' : 'all';
    if (period === activeLeaderboardPeriod) return;
    activeLeaderboardPeriod = period;
    loadLeaderboard();
  });
});

loadLeaderboard();
