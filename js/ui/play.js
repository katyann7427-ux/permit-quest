// Interactive activities: practice quiz, rule cards, driving mission, practice exam, weekly session.
import {
  recordAnswer, award, XP, shuffle, pickQuestions, scoreChallenge, buildExam, gradeExam,
  startSession, advanceSession, SESSION_STEPS, nextCategory, dueRuleIds,
} from '../engine.js';
import { scenarioById, SCENARIOS } from '../content/scenarios.js';
import { categoryById } from '../content/curriculum.js';
import { carTop, intersection } from './svg.js';
import {
  esc, bar, srcBadge, ruleById, CATEGORIES, VERIFIED_RULES, LIVE_QUESTIONS, PASS_MARK, EXAM_SIZE, reducedMotion,
} from './common.js';

const KEYS = ['A', 'B', 'C', 'D', 'E'];

// ---------------- Launchers ----------------

/** Practice quiz with immediate feedback. onDone(ctx, summary) decides where to go next. */
export function launchQuiz(ctx, { title, questions, challenge = false, onDone }) {
  ctx.activity = {
    type: 'quiz', title, challenge, questions,
    orders: questions.map((q) => shuffle(q.choices.map((_, i) => i))),
    i: 0, picked: null, showWhy: false, results: [], xp: 0, finished: false, onDone,
  };
  ctx.go('#/play');
}

export function launchLearn(ctx, catId, onDone) {
  const rules = VERIFIED_RULES.filter((r) => r.category === catId);
  ctx.activity = { type: 'learn', catId, rules, i: 0, onDone };
  ctx.go('#/play');
}

export function launchMission(ctx, scenarioId, onDone) {
  const sc = scenarioById[scenarioId];
  ctx.activity = { type: 'mission', sc, r: 0, phase: 'intro', picked: null, showWhy: false, results: [], xp: 0, order: null, onDone };
  ctx.go('#/play');
}

export function launchExam(ctx) {
  const qs = buildExam(ctx.state, LIVE_QUESTIONS, EXAM_SIZE);
  ctx.activity = { type: 'exam', questions: qs, orders: qs.map((q) => shuffle(q.choices.map((_, i) => i))), i: 0, answers: [], result: null, reviewOpen: false };
  ctx.go('#/play');
}

/** Five-question challenge for a category. */
export function challengeFor(ctx, catId, onDone) {
  const pool = LIVE_QUESTIONS.filter((q) => q.category === catId);
  const qs = pickQuestions(ctx.state, pool, 5, ctx.now());
  launchQuiz(ctx, { title: `${categoryById[catId].short} CHALLENGE`, questions: qs, challenge: true, onDone });
}

export function reviewDue(ctx, n, onDone) {
  const due = new Set(dueRuleIds(ctx.state, ctx.now()));
  let pool = LIVE_QUESTIONS.filter((q) => due.has(q.rule));
  if (!pool.length) {
    // Nothing due: review the least-solid practised rules instead.
    const practised = new Set(Object.keys(ctx.state.rules).filter((id) => ctx.state.rules[id].attempts));
    pool = LIVE_QUESTIONS.filter((q) => practised.has(q.rule));
  }
  if (!pool.length) return false;
  launchQuiz(ctx, { title: 'REVIEW', questions: pickQuestions(ctx.state, pool, n, ctx.now()), onDone });
  return true;
}

function backTo(hash) {
  return (ctx) => ctx.go(hash);
}

// ---------------- Quiz ----------------

function quizView(ctx) {
  const a = ctx.activity;
  if (a.finished) return quizSummary(ctx);
  const q = a.questions[a.i];
  const rule = ruleById[q.rule];
  const order = a.orders[a.i];
  const answered = a.picked !== null;
  const ok = answered && a.picked === q.answer;
  const last = a.results[a.results.length - 1];
  return `<div class="stack-lg">
    <div class="q-top">
      <button class="q-close" data-act="quit" aria-label="Quit">✕</button>
      <div class="spacer">${segments(a.questions.length, a.i, a.results)}</div>
      <span class="pill blue">${a.i + 1}/${a.questions.length}</span>
    </div>
    <div class="stack">
      <div class="eyebrow">${esc(a.title)} · ${esc(categoryById[q.category].short)}</div>
      <div class="q-prompt">${esc(q.prompt)}</div>
    </div>
    <div class="choices stack" aria-disabled="${answered}">
      ${order.map((ci, k) => {
        let cls = '';
        if (answered) cls = ci === q.answer ? 'right' : ci === a.picked ? 'wrong' : 'dim';
        return `<button class="choice ${cls}" data-act="pick" data-i="${ci}"><span class="key">${KEYS[k]}</span><span>${esc(q.choices[ci])}</span></button>`;
      }).join('')}
    </div>
    ${answered ? `<div class="feedback ${ok ? 'ok' : 'bad'}" aria-live="polite">
      <div class="row between"><span class="verdict ${ok ? 'green' : 'red'}">${ok ? 'CLEAN LINE!' : 'NOT QUITE'}</span>
      <span class="xp-pop">+${last.xp} XP</span></div>
      <p style="margin-top:8px"><b>${esc(rule.title)}.</b> ${esc(q.explain)}</p>
      ${a.showWhy ? `<div class="why-box stack"><p>${esc(rule.text)}</p><p class="muted">${esc(rule.why)}</p><p><b class="red">Common mistake:</b> ${esc(rule.mistake)}</p>${srcBadge(rule.id)}</div>` : ''}
      <div class="row" style="margin-top:12px">
        ${a.showWhy ? '' : '<button class="btn small ghost" data-act="why">WHY?</button>'}
        <span class="spacer"></span>
        <button class="btn primary" data-act="next">${a.i + 1 < a.questions.length ? 'NEXT ›' : 'FINISH ›'}</button>
      </div>
    </div>` : ''}
  </div>`;
}

function segments(n, cur, results) {
  return `<div class="segbar">${Array.from({ length: n }, (_, i) => {
    const r = results[i];
    return `<i class="${r ? (r.correct ? 'done' : 'on') : i === cur ? 'on' : ''}" style="${r && !r.correct ? 'background:var(--red);border-color:var(--red);box-shadow:none' : ''}"></i>`;
  }).join('')}</div>`;
}

function quizSummary(ctx) {
  const a = ctx.activity;
  const s = scoreChallenge(a.results);
  const misses = a.results.filter((r) => !r.correct);
  return `<div class="stack-lg center">
    <div class="eyebrow" style="margin-top:20px">${esc(a.title)} COMPLETE</div>
    <div class="big ${s.perfect ? 'green' : ''}" style="font-size:64px">${s.correct}/${s.total}</div>
    ${s.perfect && a.challenge ? '<div class="pill green" style="margin:0 auto">★ PERFECT RUN +50 BONUS</div>' : ''}
    <div class="card glow-green"><div class="eyebrow">XP EARNED</div><div class="big green" style="margin-top:6px">+${a.xp}</div></div>
    ${misses.length ? `<div class="card" style="text-align:left"><div class="eyebrow">FIX THESE</div><div class="list" style="margin-top:6px">
      ${misses.map((m) => `<div class="list-item"><span class="red">✕</span><div><div class="small"><b>${esc(m.q.prompt)}</b></div><div class="small green">${esc(m.q.choices[m.q.answer])}</div></div></div>`).join('')}
    </div><p class="tiny muted" style="margin-top:8px">These rules come back sooner in your Brain Garage.</p></div>` : ''}
    <button class="btn go block hero" data-act="done">CONTINUE ›</button>
  </div>`;
}

const quizActions = {
  pick(ctx, el) {
    const a = ctx.activity;
    if (a.picked !== null) return;
    const q = a.questions[a.i];
    a.picked = Number(el.dataset.i);
    const correct = a.picked === q.answer;
    const res = recordAnswer(ctx.state, q, correct, ctx.now());
    a.xp += res.xp;
    a.results.push({ q, correct, xp: res.xp });
    if (ctx.state.sessions.current && !correct) ctx.state.sessions.current.mistakes.push(q.id);
    ctx.save();
    ctx.render();
    if (res.mastered) ctx.toast(`RULE MASTERED: ${ruleById[q.rule].title.toUpperCase()} +25 XP`);
  },
  why(ctx) {
    ctx.activity.showWhy = true;
    ctx.render();
  },
  next(ctx) {
    const a = ctx.activity;
    a.i++;
    a.picked = null;
    a.showWhy = false;
    if (a.i >= a.questions.length) {
      a.finished = true;
      const s = scoreChallenge(a.results);
      if (a.challenge && s.perfect) a.xp += award(ctx.state, XP.perfect);
      ctx.save();
    }
    ctx.render();
    window.scrollTo(0, 0);
  },
  done(ctx) {
    const a = ctx.activity;
    ctx.activity = null;
    (a.onDone || backTo('#/home'))(ctx, a);
  },
  quit(ctx) {
    const a = ctx.activity;
    ctx.activity = null;
    // Answers already given are saved; quitting just leaves the activity.
    ctx.go(ctx.state.sessions.current ? '#/session' : a.back || '#/home');
  },
};

// ---------------- Rule cards (learn) ----------------

function learnView(ctx) {
  const a = ctx.activity;
  const cat = categoryById[a.catId];
  const r = a.rules[a.i];
  return `<div class="stack-lg">
    <div class="q-top">
      <button class="q-close" data-act="quit" aria-label="Quit">✕</button>
      <div class="spacer">${bar((a.i + 1) / a.rules.length)}</div>
      <span class="pill blue">${a.i + 1}/${a.rules.length}</span>
    </div>
    <div class="eyebrow">TOPIC ${cat.n} · ${esc(cat.name)}</div>
    <div class="card glow rule-card stack">
      <div class="num">RULE ${a.i + 1} OF ${a.rules.length}${r.md ? ' · MARYLAND' : ''}</div>
      <h2 class="h2" style="font-size:24px">${esc(r.title)}</h2>
      <p style="font-size:18px;font-weight:600">${esc(r.text)}</p>
      <p class="muted">${esc(r.why)}</p>
      <div class="feedback bad" style="padding:10px"><span class="tiny red" style="font-weight:900;letter-spacing:.1em">COMMON MISTAKE</span><p class="small" style="margin-top:4px">${esc(r.mistake)}</p></div>
      ${srcBadge(r.id)}
    </div>
    <button class="btn primary block hero" data-act="lnext">${a.i + 1 < a.rules.length ? 'GOT IT ›' : 'START CHALLENGE ›'}</button>
  </div>`;
}

const learnActions = {
  lnext(ctx) {
    const a = ctx.activity;
    if (a.i + 1 < a.rules.length) {
      a.i++;
      ctx.render();
      window.scrollTo(0, 0);
    } else {
      ctx.activity = null;
      challengeFor(ctx, a.catId, a.onDone);
    }
  },
  quit: quizActions.quit,
};

// ---------------- Driving mission ----------------

const pose = ([x, y, h]) => `translate(${x}px, ${y}px) rotate(${h}deg)`;

function missionScene(round, phase, accent) {
  const cars = round.cars.map((c) => {
    const at = phase === 'arrive' || phase === 'intro' ? c.from : c.stop;
    return `<g id="car-${c.id}" style="transform:${pose(at)}">${carTop(c.player ? accent : c.color, { player: c.player, signal: c.signal })}</g>`;
  }).join('');
  return `<svg viewBox="0 0 400 400" role="img" aria-label="Overhead view of a four-way stop intersection">${intersection()}${cars}</svg>`;
}

function missionView(ctx) {
  const a = ctx.activity;
  const sc = a.sc;
  if (a.phase === 'done') return missionSummary(ctx);
  const round = sc.rounds[a.r];
  const rule = ruleById[round.rule];
  const answered = a.picked !== null;
  const ok = answered && a.picked === round.answer;
  let banner = '';
  if (a.phase === 'decide') banner = `<div class="scene-banner">WHAT'S YOUR MOVE?</div>`;
  if (a.phase === 'resolve') banner = `<div class="scene-banner ${ok ? 'ok' : 'bad'}">${ok ? 'CORRECT MOVE' : 'WATCH THE RIGHT MOVE'}</div>`;
  return `<div class="stack">
    <div class="q-top">
      <button class="q-close" data-act="quit" aria-label="Quit">✕</button>
      <div class="spacer"><div class="eyebrow">${esc(sc.code)}</div><div class="h3" style="font-style:italic">${esc(sc.title)}</div></div>
      <div class="round-dots">${sc.rounds.map((_, i) => `<i class="${a.results[i] ? (a.results[i].correct ? 'ok' : 'bad') : i === a.r ? 'on' : ''}"></i>`).join('')}</div>
    </div>
    <div class="scene-wrap">${missionScene(round, a.phase, ctx.state.profile.accent)}${banner}</div>
    ${a.phase === 'intro' ? `<div class="card stack">
        <div class="eyebrow">ROUND ${a.r + 1} · ${esc(round.title)}</div>
        <p style="font-size:17px;font-weight:600">${esc(round.setup)}</p>
        <p class="tiny muted">You are the <b style="color:var(--accent)">glowing car</b> at the bottom, heading north.</p>
        <button class="btn primary block hero" data-act="roll">ROLL UP ›</button>
      </div>` : ''}
    ${a.phase === 'arrive' ? `<div class="card"><p class="muted center">Approaching the intersection…</p></div>` : ''}
    ${a.phase === 'decide' ? `<p class="small muted">${esc(round.setup)}</p><div class="choices stack">
        ${a.order.map((ci, k) => `<button class="choice" data-act="mpick" data-i="${ci}"><span class="key">${KEYS[k]}</span><span>${esc(round.choices[ci])}</span></button>`).join('')}
      </div>` : ''}
    ${a.phase === 'resolve' ? `<div class="feedback ${ok ? 'ok' : 'bad'}" aria-live="polite">
        <div class="row between"><span class="verdict ${ok ? 'green' : 'red'}">${ok ? 'NAILED IT' : 'NOT QUITE'}</span><span class="xp-pop">+${a.results[a.r].xp} XP</span></div>
        ${ok ? '' : `<p class="small" style="margin-top:6px">Right move: <b class="green">${esc(round.choices[round.answer])}</b></p>`}
        <p style="margin-top:8px">${esc(round.explain)}</p>
        ${a.showWhy ? `<div class="why-box stack"><p>${esc(round.why)}</p><p class="muted"><b>${esc(rule.title)}:</b> ${esc(rule.text)}</p>${srcBadge(rule.id)}</div>` : ''}
        <div class="row" style="margin-top:12px">
          ${a.showWhy ? '' : '<button class="btn small ghost" data-act="mwhy">WHY?</button>'}
          <button class="btn small ghost" data-act="replay">↻ REPLAY</button>
          <span class="spacer"></span>
          <button class="btn primary" data-act="mnext">${a.r + 1 < sc.rounds.length ? 'NEXT ›' : 'FINISH ›'}</button>
        </div>
      </div>` : ''}
  </div>`;
}

function missionSummary(ctx) {
  const a = ctx.activity;
  const c = a.results.filter((r) => r.correct).length;
  return `<div class="stack-lg center">
    <div class="eyebrow" style="margin-top:20px">${esc(a.sc.code)} COMPLETE</div>
    <h1 class="h1">${esc(a.sc.title)}</h1>
    <div class="big ${c === a.results.length ? 'green' : ''}" style="font-size:64px">${c}/${a.results.length}</div>
    <div class="card glow-green"><div class="eyebrow">XP EARNED</div><div class="big green" style="margin-top:6px">+${a.xp}</div><p class="tiny muted" style="margin-top:6px">Includes +${XP.mission} mission completion</p></div>
    <button class="btn go block hero" data-act="mdone">CONTINUE ›</button>
    <button class="link" data-act="again">Run it again</button>
  </div>`;
}

function animateCar(root, id, path, speed = 4.2) {
  const el = root.querySelector(`#car-${id}`);
  if (!el || !el.animate) return Promise.resolve();
  let len = 0;
  for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  const duration = reducedMotion() ? 1 : Math.max(500, len * speed);
  const frames = path.map((p) => ({ transform: pose(p) }));
  const anim = el.animate(frames, { duration, easing: 'ease-in-out', fill: 'forwards' });
  return anim.finished.catch(() => {});
}

async function runArrival(root, ctx) {
  const a = ctx.activity;
  const round = a.sc.rounds[a.r];
  const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));
  await Promise.all(round.cars.map(async (c) => {
    await wait(c.arriveDelay || 0);
    await animateCar(root, c.id, [c.from, c.stop], 4.5);
  }));
  await wait(250);
  if (ctx.activity !== a || a.phase !== 'arrive') return;
  a.phase = 'decide';
  a.order = shuffle(round.choices.map((_, i) => i));
  ctx.render();
}

async function runResolve(root, ctx) {
  const a = ctx.activity;
  const round = a.sc.rounds[a.r];
  for (const step of round.resolve) {
    if (ctx.activity !== a) return;
    await animateCar(root, step.car, step.path, 4);
  }
}

const missionActions = {
  roll(ctx) {
    ctx.activity.phase = 'arrive';
    ctx.render();
  },
  mpick(ctx, el) {
    const a = ctx.activity;
    const round = a.sc.rounds[a.r];
    a.picked = Number(el.dataset.i);
    const correct = a.picked === round.answer;
    const res = recordAnswer(ctx.state, { id: round.id, rule: round.rule }, correct, ctx.now());
    a.xp += res.xp;
    a.results.push({ correct, xp: res.xp });
    if (ctx.state.sessions.current && !correct) ctx.state.sessions.current.mistakes.push(round.id);
    ctx.save();
    a.phase = 'resolve';
    ctx.render();
    if (res.mastered) ctx.toast(`RULE MASTERED: ${ruleById[round.rule].title.toUpperCase()} +25 XP`);
  },
  mwhy(ctx) {
    ctx.activity.showWhy = true;
    ctx.render();
  },
  replay(ctx) {
    ctx.render();
  },
  mnext(ctx) {
    const a = ctx.activity;
    a.r++;
    a.picked = null;
    a.showWhy = false;
    if (a.r >= a.sc.rounds.length) {
      a.phase = 'done';
      a.xp += award(ctx.state, XP.mission);
      const m = (ctx.state.missions[a.sc.id] ||= { plays: 0, best: 0 });
      m.plays++;
      m.best = Math.max(m.best, a.results.filter((r) => r.correct).length);
      ctx.save();
    } else {
      a.phase = 'intro';
    }
    ctx.render();
    window.scrollTo(0, 0);
  },
  mdone(ctx) {
    const a = ctx.activity;
    ctx.activity = null;
    (a.onDone || backTo('#/missions/drive'))(ctx, a);
  },
  again(ctx) {
    const a = ctx.activity;
    launchMission(ctx, a.sc.id, a.onDone);
    ctx.render();
  },
  quit: quizActions.quit,
};

// ---------------- Practice exam ----------------

function examView(ctx) {
  const a = ctx.activity;
  if (a.result) return examResult(ctx);
  const q = a.questions[a.i];
  const picked = a.answers[a.i];
  return `<div class="stack-lg">
    <div class="q-top">
      <button class="q-close" data-act="equit" aria-label="Quit exam">✕</button>
      <div class="spacer">${bar(a.i / a.questions.length)}</div>
      <span class="pill blue">${a.i + 1}/${a.questions.length}</span>
    </div>
    <div class="stack"><div class="eyebrow">PRACTICE EXAM · NO HINTS</div><div class="q-prompt">${esc(q.prompt)}</div></div>
    <div class="choices stack">
      ${a.orders[a.i].map((ci, k) => `<button class="choice ${picked === ci ? 'sel' : ''}" data-act="epick" data-i="${ci}"><span class="key">${KEYS[k]}</span><span>${esc(q.choices[ci])}</span></button>`).join('')}
    </div>
    <div class="row">
      ${a.i > 0 ? '<button class="btn ghost" data-act="eprev">‹ BACK</button>' : ''}
      <span class="spacer"></span>
      <button class="btn primary" data-act="enext" ${picked === undefined ? 'disabled' : ''}>${a.i + 1 < a.questions.length ? 'NEXT ›' : 'SUBMIT EXAM'}</button>
    </div>
  </div>`;
}

function examResult(ctx) {
  const a = ctx.activity;
  const r = a.result;
  const pass = r.score >= PASS_MARK;
  const cats = Object.entries(r.byCat).sort((x, y) => x[1][0] / x[1][1] - y[1][0] / y[1][1]);
  return `<div class="stack-lg">
    <div class="center stack" style="margin-top:16px">
      <div class="eyebrow">PRACTICE EXAM RESULT</div>
      <div class="big ${pass ? 'green' : ''}" style="font-size:72px">${r.score}<span class="muted" style="font-size:32px">/${r.total}</span></div>
      <div class="pill ${pass ? 'green' : 'amber'}" style="margin:0 auto">${pass ? '✓ PASSING SCORE' : `NEED ${PASS_MARK} TO PASS`}</div>
      <p class="tiny muted">MVA pass mark: 88% (${PASS_MARK} of ${EXAM_SIZE}).</p>
    </div>
    <div class="card stack">
      <div class="eyebrow">BY TOPIC</div>
      ${cats.map(([c, [ok, t]]) => `<div><div class="row between small"><span>${esc(categoryById[c].name)}</span><b>${ok}/${t}</b></div>${bar(ok / t, ok === t ? 'green thin' : 'thin')}</div>`).join('')}
    </div>
    ${r.wrong.length ? `<div class="card">
      <div class="row between"><div class="eyebrow">REVIEW MISSES (${r.wrong.length})</div>
      <button class="link" data-act="etoggle">${a.reviewOpen ? 'Hide' : 'Show'}</button></div>
      ${a.reviewOpen ? `<div class="list" style="margin-top:6px">${r.wrong.map((id) => {
        const i = a.questions.findIndex((q) => q.id === id);
        const q = a.questions[i];
        const yours = a.answers[i];
        return `<div class="list-item" style="display:block"><p class="small"><b>${esc(q.prompt)}</b></p>
          <p class="small red" style="margin-top:4px">✕ ${esc(q.choices[yours])}</p>
          <p class="small green">✓ ${esc(q.choices[q.answer])}</p>
          <p class="tiny muted" style="margin-top:4px">${esc(q.explain)}</p></div>`;
      }).join('')}</div>` : ''}
    </div>` : ''}
    <button class="btn go block hero" data-act="edone">DONE ›</button>
  </div>`;
}

const examActions = {
  epick(ctx, el) {
    ctx.activity.answers[ctx.activity.i] = Number(el.dataset.i);
    ctx.render();
  },
  eprev(ctx) {
    ctx.activity.i--;
    ctx.render();
  },
  enext(ctx) {
    const a = ctx.activity;
    if (a.answers[a.i] === undefined) return;
    if (a.i + 1 < a.questions.length) {
      a.i++;
    } else {
      const now = ctx.now();
      a.result = gradeExam(a.questions, a.answers);
      // Exam answers feed the learning model but give no per-question XP (no rewarding guesses).
      a.questions.forEach((q, i) => recordAnswer(ctx.state, q, a.answers[i] === q.answer, now, { exam: true }));
      const xp = award(ctx.state, XP.mission + a.result.score * 2);
      ctx.state.exams.push({ at: now, ...a.result, xp });
      ctx.save();
      ctx.toast(`EXAM LOGGED +${xp} XP`);
    }
    ctx.render();
    window.scrollTo(0, 0);
  },
  etoggle(ctx) {
    ctx.activity.reviewOpen = !ctx.activity.reviewOpen;
    ctx.render();
  },
  equit(ctx) {
    if (!confirm('Quit this exam? It will not be scored.')) return;
    ctx.activity = null;
    ctx.go('#/exams');
  },
  edone(ctx) {
    ctx.activity = null;
    ctx.go('#/exams');
  },
};

// ---------------- Weekly session ----------------

function sessionLauncher(ctx) {
  const cur = ctx.state.sessions.current;
  const step = SESSION_STEPS[cur.step].key;
  const back = (c) => {
    advanceSession(c.state, c.now());
    c.save();
    c.go('#/session');
  };
  if (step === 'review') {
    if (!reviewDue(ctx, 4, back)) {
      back(ctx);
      ctx.toast('NOTHING TO REVIEW YET — CLEAN SLATE');
    }
  } else if (step === 'learn') {
    const cat = nextCategory(ctx.state, CATEGORIES, VERIFIED_RULES);
    cur.cat = cat.id;
    ctx.save();
    launchLearn(ctx, cat.id, back);
  } else if (step === 'mission') {
    launchMission(ctx, SCENARIOS[(cur.n - 1) % SCENARIOS.length].id, back);
  } else if (step === 'mixed') {
    const touched = new Set(Object.keys(ctx.state.rules).filter((id) => ctx.state.rules[id].attempts).map((id) => ruleById[id]?.category).filter(Boolean));
    let pool = LIVE_QUESTIONS.filter((q) => touched.has(q.category));
    if (pool.length < 5) pool = LIVE_QUESTIONS;
    launchQuiz(ctx, { title: 'MIXED CHALLENGE', questions: pickQuestions(ctx.state, pool, 5, ctx.now()), challenge: true, onDone: back });
  } else if (step === 'wrap') {
    const ids = [...new Set(cur.mistakes)];
    const qs = LIVE_QUESTIONS.filter((q) => ids.includes(q.id)).slice(0, 5);
    if (qs.length) {
      launchQuiz(ctx, { title: 'FIX YOUR MISTAKES', questions: qs, onDone: finishSession });
    } else {
      finishSession(ctx);
    }
  }
}

function finishSession(ctx) {
  const res = advanceSession(ctx.state, ctx.now());
  ctx.save();
  if (res && res.done) {
    ctx.ui.sessionDone = res.session;
    ctx.go('#/session');
  } else ctx.go('#/session');
}

function sessionView(ctx) {
  const done = ctx.ui.sessionDone;
  if (done && !ctx.state.sessions.current) {
    return `<div class="stack-lg center">
      <div class="eyebrow" style="margin-top:24px">SESSION ${String(done.n).padStart(2, '0')}</div>
      <h1 class="h1 green">SESSION COMPLETE</h1>
      <div class="card glow-green"><div class="eyebrow">SESSION XP</div><div class="big green" style="margin-top:6px">+${done.xp}</div><p class="tiny muted" style="margin-top:6px">Includes the +${XP.session} weekly session bonus</p></div>
      <p class="muted">That's your week. Rules you just practised come back on schedule — no cramming needed.</p>
      <button class="btn primary block hero" data-act="shome">BACK TO HQ</button>
    </div>`;
  }
  const cur = ctx.state.sessions.current || startSession(ctx.state, ctx.now());
  ctx.save();
  const pct = cur.step / SESSION_STEPS.length;
  const blocks = '█'.repeat(Math.round(pct * 10)) + '░'.repeat(10 - Math.round(pct * 10));
  return `<div class="stack-lg">
    <div class="q-top"><button class="q-close" data-go="#/home" aria-label="Back home">‹</button><div class="spacer"></div><span class="pill blue">~20 MIN</span></div>
    <div class="stack">
      <div class="eyebrow">WEEKLY SESSION</div>
      <h1 class="h1">SESSION ${String(cur.n).padStart(2, '0')}</h1>
      <div class="row"><span style="font-family:ui-monospace,monospace;color:var(--blue);letter-spacing:1px">${blocks}</span><b>${Math.round(pct * 100)}%</b></div>
    </div>
    <div class="stack">
      ${SESSION_STEPS.map((s, i) => {
        const state = i < cur.step ? 'done' : i === cur.step ? 'now' : 'next';
        return `<div class="card ${state === 'now' ? 'glow' : ''}" style="${state === 'next' ? 'opacity:.55' : ''}">
          <div class="row">
            <div class="cat-ico ${state === 'done' ? 'done' : ''}">${state === 'done' ? '✓' : i + 1}</div>
            <div class="spacer"><div class="h3">${esc(s.label)}</div><div class="tiny muted">${s.min} min${i === 1 && cur.cat ? ` · ${esc(categoryById[cur.cat].name)}` : ''}</div></div>
            ${state === 'now' ? '<button class="btn primary small" data-act="sgo">GO ›</button>' : ''}
          </div></div>`;
      }).join('')}
    </div>
    <p class="tiny muted center">Stop anytime — your spot is saved.</p>
  </div>`;
}

const sessionActions = {
  sgo(ctx) {
    sessionLauncher(ctx);
  },
  shome(ctx) {
    ctx.ui.sessionDone = null;
    ctx.go('#/home');
  },
};

// ---------------- Registry ----------------

export const PLAY = {
  play: {
    nav: false,
    title: 'Play',
    render(ctx) {
      const a = ctx.activity;
      if (a.type === 'quiz') return quizView(ctx);
      if (a.type === 'learn') return learnView(ctx);
      if (a.type === 'mission') return missionView(ctx);
      return examView(ctx);
    },
    get actions() {
      return { ...quizActions, ...learnActions, ...missionActions, ...examActions };
    },
    mount(root, ctx) {
      const a = ctx.activity;
      // Keep the feedback + NEXT button in view after answering (small phones).
      const fb = root.querySelector('.feedback');
      if (fb && fb.scrollIntoView) fb.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
      if (a?.type !== 'mission') return;
      if (a.phase === 'arrive') runArrival(root, ctx);
      if (a.phase === 'resolve') runResolve(root, ctx);
    },
  },
  session: { nav: false, title: 'Session', render: sessionView, actions: sessionActions },
};
