import { load, save, requestPersistence } from './store.js';
import { SCREENS } from './ui/screens.js';
import { levelInfo } from './engine.js';
import { COSMETICS } from './content/cosmetics.js';
import { PLAY } from './ui/play.js';

const root = document.getElementById('app');
const navEl = document.getElementById('nav');

const ctx = {
  state: load(),
  activity: null, // in-progress quiz/exam/mission (transient)
  ui: {}, // transient per-screen UI state
  route: '',
  params: [],
  now: () => Date.now(),
  save() {
    save(ctx.state);
    celebrate();
  },
  go(hash) {
    if (location.hash === hash) ctx.render();
    else location.hash = hash;
  },
  render,
  toast,
};

const ALL = { ...SCREENS, ...PLAY };

function parseRoute() {
  const parts = (location.hash || '#/home').replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'home', params: parts.slice(1) };
}

function render() {
  let { name, params } = parseRoute();
  if (!ctx.state.profile && name !== 'onboard') {
    name = 'onboard';
    params = [];
  }
  if (name === 'play' && !ctx.activity) {
    // Activities are transient; a refresh mid-activity returns to the session/home.
    location.replace(ctx.state.sessions.current ? '#/session' : '#/home');
    return;
  }
  const screen = ALL[name] || SCREENS.home;
  const changed = ctx.route !== name || ctx.params.join('/') !== params.join('/');
  ctx.route = name;
  ctx.params = params;
  if (name !== 'play') ctx.lastHash = '#/' + [name, ...params].join('/');
  if (ctx.state.profile) document.documentElement.style.setProperty('--accent', ctx.state.profile.accent);
  root.innerHTML = `<div class="${changed ? 'fade-in' : ''}">${screen.render(ctx)}</div>`;
  const showNav = screen.nav !== false;
  root.classList.toggle('no-nav', !showNav);
  navEl.hidden = !showNav;
  navEl.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.go === `#/${screen.tab || name}`));
  if (screen.mount) screen.mount(root, ctx);
  if (screen.title) document.title = `${screen.title} · Jack's Permit Quest`;
}

// Small wins: toast when Jack levels up or unlocks a garage item.
let seenXp = ctx.state.xp;
function celebrate() {
  const xp = ctx.state.xp;
  if (!ctx.state.profile || xp < seenXp) {
    seenXp = xp;
    return;
  }
  if (xp <= seenXp) return;
  const before = levelInfo(seenXp).level;
  const after = levelInfo(xp).level;
  const unlocked = Object.values(COSMETICS).flat().filter((i) => i.xp > seenXp && i.xp <= xp);
  seenXp = xp;
  const msgs = [];
  if (after > before) msgs.push(`LEVEL UP! LEVEL ${after}`);
  if (unlocked.length) msgs.push(`GARAGE UNLOCK: ${unlocked.map((u) => u.name.toUpperCase()).join(', ')}`);
  if (msgs.length) setTimeout(() => toast(msgs.join(' · ')), 900);
}

let toastTimer;
function toast(msg) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2200);
}

// Event delegation: elements with data-act="name" call the current screen's action.
document.addEventListener('click', (e) => {
  const navBtn = e.target.closest('[data-go]');
  if (navBtn) {
    e.preventDefault();
    ctx.go(navBtn.dataset.go);
    return;
  }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const screen = ALL[ctx.route];
  const fn = screen && screen.actions && screen.actions[el.dataset.act];
  if (fn) {
    e.preventDefault();
    fn(ctx, el, root);
  }
});

window.addEventListener('hashchange', () => {
  window.scrollTo(0, 0);
  render();
});

render();
requestPersistence();

// Offline support
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW registration failed', err));
  });
}

// For debugging/tests in the console only.
window.__jpq = ctx;
