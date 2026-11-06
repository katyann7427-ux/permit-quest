import {
  daysUntil, TEST_DATE, weeklyStreak, masteredCount, dueRuleIds, buildPlan, currentWeekIndex,
  dayKey, weekKey, parseDay, DAY, nextCategory, SESSION_STEPS, consecutivePasses,
} from '../engine.js';
import { VEHICLES, ACCENTS, COSMETICS, SLOT_LABELS, isUnlocked, nextUnlock } from '../content/cosmetics.js';
import { SCENARIOS } from '../content/scenarios.js';
import { KNOWLEDGE_TEST, NOT_TAUGHT } from '../content/verification.js';
import { carSide, garageScene } from './svg.js';
import {
  esc, bar, srcBadge, dots, ruleProgress, overallProgress, categoryStats, readinessFor, levelBlock,
  CATEGORIES, VERIFIED_RULES, VERIFIED_IDS, LIVE_QUESTIONS, PASS_MARK, EXAM_SIZE, ruleById,
} from './common.js';
import { launchLearn, challengeFor, launchMission, launchExam, reviewDue } from './play.js';
import { wipe } from '../store.js';

const pad2 = (n) => String(n).padStart(2, '0');
const fmtDate = (key) => new Date(parseDay(key)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// On iPhone, Safari and the Home Screen app keep separate storage. Nudge to install first.
function iosBrowserTip() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  if (!ios || standalone) return '';
  return `<div class="card" style="border-color:rgba(255,176,32,.5)"><div class="eyebrow" style="color:var(--amber)">IPHONE TIP</div>
    <p class="small" style="margin-top:6px">Add this app to your Home Screen <b>before</b> you start: tap <b>Share</b> → <b>Add to Home Screen</b>, then open it from there. Progress in Safari and in the Home Screen app is saved separately.</p></div>`;
}

// ---------------- Onboarding ----------------

const onboard = {
  nav: false,
  title: 'Welcome',
  render(ctx) {
    const o = (ctx.ui.onb ||= { step: 0, nickname: '', vehicle: 'coupe', accent: ACCENTS[0].hex });
    const steps = `<div class="segbar" style="margin-bottom:22px">${[0, 1, 2].map((i) => `<i class="${i < o.step ? 'done' : i === o.step ? 'on' : ''}"></i>`).join('')}</div>`;
    if (o.step === 0) {
      return `${steps}<div class="stack-lg">
        <div class="brand"><h1 class="h1">JACK'S PERMIT QUEST</h1><div class="tag">THE ROAD TO APRIL 20</div></div>
        <div class="card glow stack"><div class="eyebrow">DRIVER NAME</div>
          <input class="field" id="nick" maxlength="16" autocomplete="off" autocapitalize="characters" placeholder="Pick a nickname" value="${esc(o.nickname)}" aria-label="Nickname">
          <p class="tiny muted">Stays on this device only. No account, no email.</p></div>
        ${iosBrowserTip()}
        <button class="btn primary block hero" data-act="o1">NEXT ›</button>
      </div>`;
    }
    if (o.step === 1) {
      return `${steps}<div class="stack-lg">
        ${''}<div class="stack"><div class="eyebrow">STEP 2 OF 3</div><h1 class="h1">PICK YOUR RIDE</h1></div>
        <div class="vehicle-pick">${VEHICLES.map((v) => `<button class="vehicle-opt ${o.vehicle === v.id ? 'sel' : ''}" data-act="ov" data-v="${v.id}">
          ${carSide({ vehicle: v.id, accent: o.accent })}<div><div class="h3" style="font-style:italic">${esc(v.name)}</div><div class="tiny muted">${esc(v.type)}</div></div></button>`).join('')}</div>
        <button class="btn primary block hero" data-act="o2">NEXT ›</button>
      </div>`;
    }
    return `${steps}<div class="stack-lg">
      <div class="stack"><div class="eyebrow">STEP 3 OF 3</div><h1 class="h1">CHOOSE YOUR COLOR</h1></div>
      <div class="card" style="padding:8px 4px">${carSide({ vehicle: o.vehicle, accent: o.accent })}</div>
      <div class="swatches">${ACCENTS.map((a) => `<button class="swatch ${o.accent === a.hex ? 'sel' : ''}" style="background:${a.hex};color:${a.hex}" data-act="oc" data-c="${a.hex}" aria-label="${esc(a.name)}"></button>`).join('')}</div>
      <p class="small muted">${esc(ACCENTS.find((a) => a.hex === o.accent)?.name || '')}</p>
      <button class="btn go block hero" data-act="o3">ENTER THE GARAGE ›</button>
    </div>`;
  },
  mount(root, ctx) {
    const inp = root.querySelector('#nick');
    if (inp) {
      inp.addEventListener('input', () => (ctx.ui.onb.nickname = inp.value));
      inp.addEventListener('keydown', (e) => e.key === 'Enter' && onboard.actions.o1(ctx));
    }
  },
  actions: {
    o1(ctx) {
      const name = (ctx.ui.onb.nickname || '').trim();
      if (!name) return ctx.toast('ENTER A NICKNAME');
      ctx.ui.onb.nickname = name.slice(0, 16);
      ctx.ui.onb.step = 1;
      ctx.render();
    },
    ov(ctx, el) {
      ctx.ui.onb.vehicle = el.dataset.v;
      ctx.render();
    },
    o2(ctx) {
      ctx.ui.onb.step = 2;
      ctx.render();
    },
    oc(ctx, el) {
      ctx.ui.onb.accent = el.dataset.c;
      ctx.render();
    },
    o3(ctx) {
      const o = ctx.ui.onb;
      ctx.state.profile = { nickname: o.nickname, vehicle: o.vehicle, accent: o.accent, created: ctx.now() };
      ctx.ui.onb = null;
      ctx.save();
      ctx.go('#/home');
    },
  },
};

// ---------------- Home / HQ ----------------

function nextUp(ctx) {
  const s = ctx.state;
  const cur = s.sessions.current;
  if (cur) return { label: `RESUME SESSION ${pad2(cur.n)}`, sub: `Next: ${SESSION_STEPS[cur.step].label}`, pct: cur.step / SESSION_STEPS.length };
  const cat = nextCategory(s, CATEGORIES, VERIFIED_RULES);
  return { label: `SESSION ${pad2(s.sessions.completed + 1)}`, sub: `Review · Learn ${cat.name} · Driving mission · Mixed challenge`, pct: 0 };
}

const home = {
  title: 'HQ',
  render(ctx) {
    const s = ctx.state;
    const now = ctx.now();
    const lv = levelBlock(s);
    const days = daysUntil(TEST_DATE, now);
    const mastered = masteredCount(s, VERIFIED_IDS);
    const ready = readinessFor(s);
    const streak = weeklyStreak(s.days, now);
    const nx = nextUp(ctx);
    const due = dueRuleIds(s, now).filter((id) => VERIFIED_IDS.includes(id)).length;
    const unlock = nextUnlock(s.xp);
    return `<div class="stack-lg">
      <div class="row between">
        <div class="brand"><h1 class="h1">JACK'S PERMIT QUEST</h1><div class="tag">THE ROAD TO APRIL 20</div></div>
      </div>
      <div class="card row" style="gap:14px">
        ${lv.html}
        <div class="spacer">
          <div class="row between"><b style="font-size:17px;letter-spacing:.04em">${esc(s.profile.nickname.toUpperCase())}</b><span class="small muted"><b class="blue">${s.xp.toLocaleString()}</b> XP</span></div>
          <div style="margin-top:8px">${bar(lv.pct)}</div>
          <div class="tiny muted" style="margin-top:6px">${lv.next - s.xp} XP to level ${lv.level + 1}</div>
        </div>
      </div>
      <div class="card glow" style="padding:20px">
        <div class="speed-lines"></div>
        <div class="eyebrow">NEXT MISSION</div>
        <div class="h2" style="margin-top:6px;font-style:italic;font-size:24px">${esc(nx.label)}</div>
        <p class="small muted" style="margin-top:6px">${esc(nx.sub)}</p>
        ${nx.pct ? `<div style="margin-top:10px">${bar(nx.pct)}</div>` : ''}
        <button class="btn primary block hero" style="margin-top:16px" data-act="start">START MISSION ›</button>
        ${due ? `<button class="link" data-act="review" style="margin-top:6px">⚡ ${due} rule${due > 1 ? 's' : ''} due for a quick review</button>` : ''}
      </div>
      <div class="grid2">
        <div class="card stat"><div class="label">Days to test</div><div class="val">${Math.max(0, days)}</div><div class="sub">Target: Apr 20, 2027</div></div>
        <div class="card stat"><div class="label">Rules mastered</div><div class="val">${mastered}<span class="muted" style="font-size:16px"> / ${VERIFIED_IDS.length}</span></div><div class="sub">Verified MD rules</div></div>
        <div class="card stat"><div class="label">Overall progress</div><div class="val">${Math.round(overallProgress(s) * 100)}%</div><div class="sub">Toward full mastery</div></div>
        <div class="card stat"><div class="label">Weekly streak</div><div class="val">${streak}<span class="muted" style="font-size:16px"> wk</span></div><div class="sub">${s.sessions.completed} session${s.sessions.completed === 1 ? '' : 's'} done</div></div>
      </div>
      <div class="card tap row" data-go="#/stats">
        <div class="spacer"><div class="eyebrow">EXAM READINESS</div><div class="h3" style="margin-top:4px;font-style:italic;color:${ready.key === 'ready' ? 'var(--green)' : ready.key === 'close' ? 'var(--amber)' : 'var(--blue)'}">${ready.label}</div>
        <div class="tiny muted" style="margin-top:4px">${ready.passes}/3 passing practice exams in a row</div></div><span class="muted">›</span>
      </div>
      ${unlock ? `<div class="card tap row" data-go="#/garage"><div class="spacer"><div class="eyebrow">NEXT UNLOCK</div><div class="h3" style="margin-top:4px">${esc(unlock.name)} <span class="muted small">· ${SLOT_LABELS[unlock.slot]}</span></div>
        <div style="margin-top:8px">${bar(s.xp / unlock.xp, 'green thin')}</div></div><span class="pill green">${unlock.xp - s.xp} XP</span></div>` : ''}
    </div>`;
  },
  actions: {
    start(ctx) {
      ctx.ui.sessionDone = null; // never show last session's "complete" screen again
      ctx.go('#/session');
    },
    review(ctx) {
      reviewDue(ctx, 5, (c) => c.go('#/home'));
    },
  },
};

// ---------------- Garage ----------------

const garage = {
  title: 'Garage',
  render(ctx) {
    const s = ctx.state;
    const p = s.profile;
    const slot = ctx.ui.gslot || 'paint';
    const veh = VEHICLES.find((v) => v.id === p.vehicle);
    const lv = levelBlock(s);
    return `<div class="stack-lg">
      <div class="row between"><div><div class="eyebrow">THE GARAGE</div><h1 class="h1">${esc(veh.name)}</h1></div>${lv.html}</div>
      ${garageScene(p, s.equipped)}
      <div class="row between small"><span class="muted">Driver: <b style="color:var(--text)">${esc(p.nickname)}</b></span><span class="muted"><b class="blue">${s.xp.toLocaleString()}</b> XP</span></div>
      <div class="tabs" role="tablist">${Object.keys(COSMETICS).map((k) => `<button class="tab ${k === slot ? 'on' : ''}" data-act="gtab" data-s="${k}" role="tab">${SLOT_LABELS[k]}</button>`).join('')}</div>
      <div class="cos-grid">${COSMETICS[slot].map((it) => {
        const un = isUnlocked(it, s.xp);
        const sel = s.equipped[slot] === it.id;
        return `<button class="cos ${sel ? 'sel' : ''} ${un ? '' : 'locked'}" data-act="equip" data-s="${slot}" data-id="${it.id}" ${un ? '' : 'aria-disabled="true"'}>
          <div class="n">${un ? '' : '🔒 '}${esc(it.name)}</div><div class="x">${sel ? '<span class="green">EQUIPPED</span>' : un ? 'TAP TO EQUIP' : `UNLOCKS AT ${it.xp} XP`}</div></button>`;
      }).join('')}</div>
      <div class="card stack">
        <div class="eyebrow">SWAP RIDE</div>
        <div class="vehicle-pick">${VEHICLES.map((v) => `<button class="vehicle-opt ${p.vehicle === v.id ? 'sel' : ''}" data-act="gveh" data-v="${v.id}">${carSide({ vehicle: v.id, accent: p.accent })}<div><div class="h3" style="font-style:italic">${esc(v.name)}</div><div class="tiny muted">${esc(v.type)}</div></div></button>`).join('')}</div>
        <div class="eyebrow" style="margin-top:8px">COLOR</div>
        <div class="swatches">${ACCENTS.map((a) => `<button class="swatch ${p.accent === a.hex ? 'sel' : ''}" style="background:${a.hex};color:${a.hex}" data-act="gcol" data-c="${a.hex}" aria-label="${esc(a.name)}"></button>`).join('')}</div>
      </div>
      <p class="tiny muted center">Upgrades are cosmetic. Earn XP by learning — not by grinding.</p>
    </div>`;
  },
  actions: {
    gtab(ctx, el) {
      ctx.ui.gslot = el.dataset.s;
      ctx.render();
    },
    equip(ctx, el) {
      const item = COSMETICS[el.dataset.s].find((i) => i.id === el.dataset.id);
      if (!isUnlocked(item, ctx.state.xp)) return ctx.toast(`EARN ${item.xp - ctx.state.xp} MORE XP TO UNLOCK`);
      ctx.state.equipped[el.dataset.s] = item.id;
      ctx.save();
      ctx.render();
    },
    gveh(ctx, el) {
      ctx.state.profile.vehicle = el.dataset.v;
      ctx.save();
      ctx.render();
    },
    gcol(ctx, el) {
      ctx.state.profile.accent = el.dataset.c;
      ctx.save();
      ctx.render();
    },
  },
};

// ---------------- Missions ----------------

function planInfo(ctx) {
  const start = ctx.state.profile.created || ctx.now();
  return buildPlan(dayKey(start), CATEGORIES);
}

const missions = {
  title: 'Missions',
  render(ctx) {
    const [sub] = ctx.params;
    if (sub && sub !== 'drive' && sub !== 'plan') return categoryDetail(ctx, sub);
    const tab = sub || 'topics';
    const tabs = `<div class="tabs">${[['topics', 'TOPICS'], ['drive', 'DRIVING'], ['plan', 'ROAD MAP']].map(([k, l]) => `<button class="tab ${k === tab ? 'on' : ''}" data-go="#/missions${k === 'topics' ? '' : '/' + k}">${l}</button>`).join('')}</div>`;
    let body = '';
    if (tab === 'topics') {
      body = `<div class="stack">${CATEGORIES.map((c) => {
        const st = categoryStats(ctx.state, c.id);
        const done = st.total && st.mastered === st.total;
        return `<div class="card tap" data-go="#/missions/${c.id}"><div class="cat-row">
          <div class="cat-ico ${done ? 'done' : ''}">${c.icon}</div>
          <div class="spacer"><div class="tiny muted" style="font-weight:800;letter-spacing:.12em">TOPIC ${pad2(c.n)}</div><div class="h3">${esc(c.name)}</div>
          <div style="margin-top:8px">${bar(st.progress, done ? 'green thin' : 'thin')}</div></div>
          <div class="center"><div style="font-weight:900">${st.mastered}/${st.total}</div><div class="tiny muted">MASTERED</div></div>
        </div></div>`;
      }).join('')}</div>`;
    } else if (tab === 'drive') {
      body = `<div class="stack">${SCENARIOS.map((sc) => {
        const m = ctx.state.missions[sc.id];
        return `<div class="card glow"><div class="speed-lines"></div>
          <div class="eyebrow">${esc(sc.code)}</div><div class="h2" style="font-style:italic;font-size:26px;margin-top:4px">${esc(sc.title)}</div>
          <p class="small muted" style="margin-top:6px">${esc(sc.blurb)}</p>
          <div class="row" style="margin-top:10px"><span class="pill">${sc.rounds.length} ROUNDS</span>${m ? `<span class="pill green">BEST ${m.best}/${sc.rounds.length}</span>` : '<span class="pill blue">NEW</span>'}</div>
          <button class="btn primary block hero" style="margin-top:14px" data-act="drive" data-id="${sc.id}">PLAY ›</button></div>`;
      }).join('')}
        <div class="card" style="opacity:.5"><div class="eyebrow">MISSION 02</div><div class="h3" style="margin-top:4px">🔒 SCHOOL BUS STOP</div><p class="tiny muted" style="margin-top:4px">In development — next build.</p></div>
      </div>`;
    } else {
      const plan = planInfo(ctx);
      const nowI = currentWeekIndex(plan, ctx.now());
      const weeksStudied = new Set(ctx.state.days.map((k) => weekKey(parseDay(k))));
      const plannedTopics = plan.weeks.slice(0, Math.max(0, nowI)).filter((w) => w.phase === 'learn').length;
      const learnedTopics = CATEGORIES.filter((c) => categoryStats(ctx.state, c.id).attempts > 0).length;
      const behind = plannedTopics - learnedTopics;
      body = `<div class="stack">
        <div class="card stack"><div class="row between"><div class="eyebrow">YOUR PLAN</div><span class="pill blue">${plan.totalWeeks} WEEKS</span></div>
          <p class="small muted">Learn 11 topics → mixed review → practice exams from March → 3 passing exams in a row by <b>Apr 1</b> → test <b>Apr 20</b>.</p>
          ${behind > 0 ? `<p class="small" style="color:var(--amber)">You're ${behind} topic${behind > 1 ? 's' : ''} behind plan — no stress. Your next session picks up where you left off.</p>` : '<p class="small green">On track.</p>'}
        </div>
        <div class="card list">${plan.weeks.map((w, i) => {
          const past = i < nowI;
          const studied = weeksStudied.has(w.start);
          const badge = i === nowI ? '<span class="pill blue">NOW</span>' : past ? (studied ? '<span class="pill green">✓</span>' : '<span class="pill">MISSED</span>') : '';
          return `<div class="plan-week ${i === nowI ? 'now' : ''}"><div class="wk">WK ${pad2(w.week)}</div><div><div class="small"><b>${esc(w.focus)}</b></div><div class="tiny muted">${fmtDate(w.start)} – ${fmtDate(w.end)} · ${w.phase.toUpperCase()}</div></div>${badge}</div>`;
        }).join('')}</div>
      </div>`;
    }
    return `<div class="stack-lg"><div><div class="eyebrow">MISSIONS</div><h1 class="h1">PICK YOUR ROUTE</h1></div>${tabs}${body}</div>`;
  },
  actions: {
    drive(ctx, el) {
      launchMission(ctx, el.dataset.id, (c) => c.go('#/missions/drive'));
    },
    learn(ctx, el) {
      const id = el.dataset.c;
      launchLearn(ctx, id, (c) => c.go(`#/missions/${id}`));
    },
    challenge(ctx, el) {
      const id = el.dataset.c;
      challengeFor(ctx, id, (c) => c.go(`#/missions/${id}`));
    },
  },
};

function categoryDetail(ctx, catId) {
  const c = CATEGORIES.find((x) => x.id === catId);
  if (!c) return '<p>Unknown topic.</p>';
  const rules = VERIFIED_RULES.filter((r) => r.category === catId);
  const st = categoryStats(ctx.state, catId);
  return `<div class="stack-lg">
    <div class="q-top"><button class="q-close" data-go="#/missions" aria-label="Back">‹</button><div class="spacer"><div class="eyebrow">TOPIC ${pad2(c.n)}</div><div class="h2">${esc(c.name)}</div></div></div>
    <div class="grid2">
      <button class="btn primary" data-act="learn" data-c="${c.id}">LEARN RULES</button>
      <button class="btn go" data-act="challenge" data-c="${c.id}">5-Q CHALLENGE</button>
    </div>
    <div class="row between small"><span class="muted">Accuracy: <b style="color:var(--text)">${st.acc === null ? '—' : Math.round(st.acc * 100) + '%'}</b></span><span class="muted">${st.mastered}/${st.total} mastered</span></div>
    ${rules.map((r, i) => {
      const p = ruleProgress(ctx.state, r.id);
      return `<div class="card rule-card stack">
        <div class="row between"><span class="num">RULE ${i + 1}${r.md ? ' · MARYLAND' : ''}</span><span class="row" style="gap:8px">${dots(p.box)}<span class="pill ${p.key === 'mastered' ? 'green' : p.key === 'due' ? 'amber' : p.key === 'learning' ? 'blue' : ''}">${p.label}</span></span></div>
        <div class="h3">${esc(r.title)}</div>
        <p class="small">${esc(r.text)}</p>
        ${srcBadge(r.id)}
      </div>`;
    }).join('')}
  </div>`;
}

// ---------------- Brain Garage ----------------

const brain = {
  title: 'Brain Garage',
  render(ctx) {
    const s = ctx.state;
    const groups = { due: [], learning: [], mastered: [], new: [] };
    for (const r of VERIFIED_RULES) groups[ruleProgress(s, r.id).key].push(r);
    const sec = (key, title, cls) => groups[key].length ? `<div class="card"><div class="row between"><div class="eyebrow">${title}</div><span class="pill ${cls}">${groups[key].length}</span></div>
      <div class="list" style="margin-top:6px">${groups[key].map((r) => {
        const rr = s.rules[r.id];
        return `<div class="list-item"><div class="spacer"><div class="small"><b>${esc(r.title)}</b></div><div class="tiny muted">${esc(CATEGORIES.find((c) => c.id === r.category).name)}${rr ? ` · ${rr.correct}/${rr.attempts} correct` : ''}</div></div>${dots(rr ? rr.box : 0)}</div>`;
      }).join('')}</div></div>` : '';
    return `<div class="stack-lg">
      <div><div class="eyebrow">BRAIN GARAGE</div><h1 class="h1">TUNE YOUR MEMORY</h1></div>
      <div class="grid3">
        <div class="card stat center"><div class="label">Due</div><div class="val" style="color:var(--amber)">${groups.due.length}</div></div>
        <div class="card stat center"><div class="label">Learning</div><div class="val blue">${groups.learning.length}</div></div>
        <div class="card stat center"><div class="label">Mastered</div><div class="val green">${groups.mastered.length}</div></div>
      </div>
      <button class="btn primary block hero" data-act="breview" ${groups.due.length + groups.learning.length + groups.mastered.length ? '' : 'disabled'}>${groups.due.length ? 'TUNE-UP NOW ›' : 'QUICK REFRESH ›'}</button>
      <p class="tiny muted">Each rule needs <b>3 correct recalls on 3 different days</b> to be mastered (●●●). Review spacing: 1 → 3 → 7 → 14 days. Misses come back right away.</p>
      ${sec('due', 'DUE FOR REVIEW', 'amber')}${sec('learning', 'IN PROGRESS', 'blue')}${sec('mastered', 'MASTERED', 'green')}${sec('new', 'NOT STARTED', '')}
    </div>`;
  },
  actions: {
    breview(ctx) {
      if (!reviewDue(ctx, 8, (c) => c.go('#/brain'))) ctx.toast('LEARN SOME RULES FIRST');
    },
  },
};

// ---------------- Exams ----------------

const exams = {
  title: 'Exams',
  render(ctx) {
    const s = ctx.state;
    const passes = consecutivePasses(s.exams, PASS_MARK);
    const hist = s.exams.slice().reverse();
    return `<div class="stack-lg">
      <div><div class="eyebrow">PRACTICE EXAMS</div><h1 class="h1">TIME TRIAL</h1></div>
      <div class="card glow stack">
        <div class="row between"><div class="eyebrow">MVA FORMAT</div><span class="pill green">✓ VERIFIED</span></div>
        <div class="grid3 center">
          <div><div class="big">${EXAM_SIZE}</div><div class="tiny muted">QUESTIONS</div></div>
          <div><div class="big">${PASS_MARK}</div><div class="tiny muted">TO PASS (88%)</div></div>
          <div><div class="big">${KNOWLEDGE_TEST.minutes}</div><div class="tiny muted">MIN (REAL TEST)</div></div>
        </div>
        <p class="tiny muted">No hints, no feedback until the end. Mixed topics, randomized. Practice questions are original — not official MVA questions.</p>
        <button class="btn primary block hero" data-act="exam">START EXAM ›</button>
      </div>
      <div class="card stack">
        <div class="eyebrow">READINESS TARGET</div>
        <div class="h3">3 passing practice exams in a row</div>
        <div class="segbar">${[0, 1, 2].map((i) => `<i class="${i < Math.min(3, passes) ? 'done' : ''}"></i>`).join('')}</div>
        <p class="tiny muted">${passes >= 3 ? 'Target met. Keep it warm until test day.' : `${passes}/3 so far — goal: by April 1, 2027.`}</p>
      </div>
      ${hist.length ? `<div class="card"><div class="eyebrow">HISTORY</div><div class="list" style="margin-top:6px">${hist.slice(0, 12).map((e) => `<div class="list-item"><div class="spacer small">${new Date(e.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div><b class="${e.score >= PASS_MARK ? 'green' : ''}">${e.score}/${e.total}</b><span class="pill ${e.score >= PASS_MARK ? 'green' : ''}">${e.score >= PASS_MARK ? 'PASS' : 'MISS'}</span></div>`).join('')}</div></div>` : '<p class="small muted center">No exams yet. Big push starts in March — but try one anytime.</p>'}
    </div>`;
  },
  actions: {
    exam(ctx) {
      launchExam(ctx);
    },
  },
};

// ---------------- Stats ----------------

function examChart(list) {
  if (!list.length) return '<p class="small muted">No exam scores yet.</p>';
  const last = list.slice(-10);
  return `<div class="chart-bars" aria-label="Recent practice exam scores">${last.map((e) => `<div class="b ${e.score >= PASS_MARK ? 'pass' : 'fail'}" style="height:${(e.score / e.total) * 100}%" title="${e.score}/${e.total}"><span>${e.score}</span></div>`).join('')}</div>
    <div class="tiny muted" style="margin-top:6px">Green = passing (≥${PASS_MARK}/${EXAM_SIZE})</div>`;
}

const stats = {
  title: 'Stats',
  render(ctx) {
    const s = ctx.state;
    const now = ctx.now();
    const ready = readinessFor(s);
    const acc = s.stats.answered ? Math.round((s.stats.correct / s.stats.answered) * 100) : null;
    const mastered = masteredCount(s, VERIFIED_IDS);
    const needing = dueRuleIds(s, now).filter((id) => VERIFIED_IDS.includes(id)).length;
    return `<div class="stack-lg">
      <div><div class="eyebrow">STATS</div><h1 class="h1">AM I READY?</h1></div>
      <div class="card ready ${ready.key} ${ready.key === 'ready' ? 'glow-green' : 'glow'}">
        <div class="eyebrow">PERMIT TEST READINESS</div>
        <div class="state">${ready.label}</div>
        <div class="segbar" style="margin:12px auto 0;max-width:240px">${['building', 'close', 'ready'].map((k, i) => `<i class="${i <= ['building', 'close', 'ready'].indexOf(ready.key) ? 'done' : ''}"></i>`).join('')}</div>
        <p class="tiny muted" style="margin-top:10px">TEST READY = 3 passing practice exams in a row (≥${PASS_MARK}/${EXAM_SIZE}). Currently ${ready.passes}/3.</p>
      </div>
      <div class="grid2">
        <div class="card stat"><div class="label">Days to Apr 20</div><div class="val">${Math.max(0, daysUntil(TEST_DATE, now))}</div></div>
        <div class="card stat"><div class="label">Sessions</div><div class="val">${s.sessions.completed}</div></div>
        <div class="card stat"><div class="label">Questions</div><div class="val">${s.stats.answered}</div></div>
        <div class="card stat"><div class="label">Accuracy</div><div class="val">${acc === null ? '—' : acc + '%'}</div></div>
        <div class="card stat"><div class="label">Rules mastered</div><div class="val green">${mastered}<span class="muted" style="font-size:15px">/${VERIFIED_IDS.length}</span></div></div>
        <div class="card stat"><div class="label">Need review</div><div class="val" style="color:var(--amber)">${needing}</div></div>
      </div>
      <div class="card stack"><div class="eyebrow">ACCURACY BY TOPIC</div>
        ${CATEGORIES.map((c) => {
          const st = categoryStats(s, c.id);
          return `<div><div class="row between small"><span>${esc(c.name)}</span><b>${st.acc === null ? '<span class="muted">—</span>' : Math.round(st.acc * 100) + '%'}</b></div>${bar(st.acc || 0, (st.acc || 0) >= 0.88 ? 'green thin' : 'thin')}</div>`;
        }).join('')}
      </div>
      <div class="card stack"><div class="row between"><div class="eyebrow">PRACTICE EXAMS</div><span class="pill ${ready.passes ? 'green' : ''}">${ready.passes} IN A ROW</span></div>${examChart(s.exams)}</div>
      <div class="card stack"><div class="eyebrow">CONTENT SOURCES</div>
        <p class="small">${VERIFIED_IDS.length} rules verified against the official <a href="https://mva.maryland.gov/Documents/DL-002.pdf" target="_blank" rel="noopener">Maryland Driver's Manual (Oct 2026)</a> and Maryland law. ${LIVE_QUESTIONS.length} original practice questions.</p>
        <p class="tiny muted">Held back pending review: ${NOT_TAUGHT.map((n) => esc(n.claim)).join('; ')}.</p>
      </div>
      <div class="row between">
        <button class="link" data-go="#/parent">Parent view ›</button>
        <button class="link" style="color:var(--muted)" data-act="reset">Reset progress</button>
      </div>
    </div>`;
  },
  actions: {
    reset(ctx) {
      if (!confirm('Erase ALL progress on this device? This cannot be undone.')) return;
      wipe();
      location.hash = '#/home';
      location.reload();
    },
  },
};

// ---------------- Parent view ----------------

const parent = {
  title: 'Parent View',
  tab: 'stats',
  render(ctx) {
    const s = ctx.state;
    const now = ctx.now();
    const thisWeek = parseDay(weekKey(now));
    const weeks = [3, 2, 1, 0].map((k) => {
      const start = thisWeek - k * 7 * DAY;
      const end = start + 7 * DAY;
      return {
        label: k === 0 ? 'This wk' : `${k} wk ago`,
        sessions: s.sessions.history.filter((h) => h.at >= start && h.at < end).length,
        active: s.days.some((d) => parseDay(d) >= start && parseDay(d) < end),
      };
    });
    const studied = weeks.filter((w) => w.active).length;
    const topics = CATEGORIES.map((c) => ({ c, st: categoryStats(s, c.id) })).filter((t) => t.st.attempts >= 3);
    const sorted = topics.slice().sort((a, b) => b.st.acc - a.st.acc);
    const strengths = sorted.slice(0, 3);
    const weak = sorted.slice(-3).reverse().filter((t) => !strengths.includes(t) || sorted.length > 3);
    const ready = readinessFor(s);
    const list = (arr) => arr.length ? arr.map((t) => `<div class="list-item"><span class="spacer small">${esc(t.c.name)}</span><b>${Math.round(t.st.acc * 100)}%</b></div>`).join('') : '<p class="small muted">Not enough answers yet.</p>';
    return `<div class="stack-lg">
      <div class="q-top"><button class="q-close" data-go="#/stats" aria-label="Back">‹</button><div class="spacer"><div class="eyebrow">FOR PARENTS</div><div class="h2">PARENT VIEW</div></div></div>
      <p class="small muted">A simple summary of ${esc(s.profile.nickname)}'s study. Data lives only on this device — nothing is sent anywhere.</p>
      <div class="card ready ${ready.key}"><div class="eyebrow">OVERALL READINESS</div><div class="state">${ready.label}</div>
        <p class="tiny muted" style="margin-top:6px">${masteredCount(s, VERIFIED_IDS)}/${VERIFIED_IDS.length} rules mastered · ${ready.passes}/3 consecutive passing practice exams</p></div>
      <div class="card stack"><div class="row between"><div class="eyebrow">STUDY CONSISTENCY</div><span class="pill ${studied >= 3 ? 'green' : 'blue'}">${studied}/4 WEEKS ACTIVE</span></div>
        <div class="grid2" style="grid-template-columns:repeat(4,1fr)">${weeks.map((w) => `<div class="center"><div class="big" style="font-size:24px;color:${w.active ? 'var(--green)' : 'var(--muted)'}">${w.sessions}</div><div class="tiny muted">${w.label}</div></div>`).join('')}</div>
        <p class="tiny muted">Weekly sessions completed (goal: 1 per week, ~20 min).</p></div>
      <div class="grid2">
        <div class="card"><div class="eyebrow">STRENGTHS</div><div class="list" style="margin-top:4px">${list(strengths)}</div></div>
        <div class="card"><div class="eyebrow">WORK ON</div><div class="list" style="margin-top:4px">${list(sorted.length > 3 ? weak : [])}</div></div>
      </div>
      <div class="card stack"><div class="eyebrow">RECENT PRACTICE EXAMS</div>${s.exams.length ? s.exams.slice(-5).reverse().map((e) => `<div class="row between small"><span>${new Date(e.at).toLocaleDateString()}</span><b class="${e.score >= PASS_MARK ? 'green' : ''}">${e.score}/${e.total}</b></div>`).join('') : '<p class="small muted">None yet — exam practice ramps up in March 2027.</p>'}</div>
    </div>`;
  },
};

export const SCREENS = { onboard, home, garage, missions, brain, exams, stats, parent };
