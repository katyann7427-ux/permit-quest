import * as E from '../js/engine.js';
import { RULES, CATEGORIES, ruleById } from '../js/content/curriculum.js';
import { QUESTIONS } from '../js/content/questions.js';
import { VERIFICATION, KNOWLEDGE_TEST } from '../js/content/verification.js';
import { SCENARIOS } from '../js/content/scenarios.js';

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, err: e.message });
  }
}
function eq(a, b, msg = '') {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}
function ok(v, msg = 'expected truthy') {
  if (!v) throw new Error(msg);
}

const T0 = new Date(2026, 10, 6, 10, 0).getTime(); // Fri Nov 6 2026
const D = E.DAY;
const q1 = QUESTIONS.find((q) => q.rule === 'ROW-1');
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------- Levels / XP ----------
test('level thresholds', () => {
  eq(E.levelInfo(0).level, 1);
  eq(E.levelInfo(199).level, 1);
  eq(E.levelInfo(200).level, 2);
  eq(E.levelInfo(500).level, 3);
  eq(E.levelInfo(1400).level, 5);
});
test('correct answer gives +10, wrong gives participation +2', () => {
  const s = E.freshState();
  eq(E.recordAnswer(s, q1, true, T0).xp, 10);
  eq(E.recordAnswer(s, q1, false, T0).xp, 2);
  eq(s.xp, 12);
  eq(s.stats, { answered: 2, correct: 1 });
});
test('exam answers award no per-question XP', () => {
  const s = E.freshState();
  eq(E.recordAnswer(s, q1, true, T0, { exam: true }).xp, 0);
  eq(s.stats.answered, 1);
});

// ---------- Spaced repetition / mastery ----------
test('mastery is NOT granted for many correct answers on one day', () => {
  const s = E.freshState();
  for (let i = 0; i < 6; i++) E.recordAnswer(s, q1, true, T0 + i * 1000);
  eq(s.rules['ROW-1'].box, 1);
  eq(s.rules['ROW-1'].mastered, false);
});
test('mastery after 3 correct recalls on 3 separate days (+25 XP)', () => {
  const s = E.freshState();
  E.recordAnswer(s, q1, true, T0);
  E.recordAnswer(s, q1, true, T0 + 1 * D);
  const r = E.recordAnswer(s, q1, true, T0 + 4 * D);
  eq(r.mastered, true);
  eq(r.xp, 35);
  eq(s.rules['ROW-1'].mastered, true);
});
test('intervals 1 -> 3 -> 7 -> 14 days', () => {
  const s = E.freshState();
  const days = [];
  let t = T0;
  for (let i = 0; i < 4; i++) {
    E.recordAnswer(s, q1, true, t);
    days.push(Math.round((s.rules['ROW-1'].due - t) / D));
    t = s.rules['ROW-1'].due;
  }
  eq(days, [1, 3, 7, 14]);
});
test('wrong answer drops box by 2 and is due immediately', () => {
  const s = E.freshState();
  E.recordAnswer(s, q1, true, T0);
  E.recordAnswer(s, q1, true, T0 + D);
  E.recordAnswer(s, q1, true, T0 + 4 * D);
  E.recordAnswer(s, q1, false, T0 + 11 * D);
  eq(s.rules['ROW-1'].box, 1);
  eq(s.rules['ROW-1'].due, T0 + 11 * D);
  eq(s.rules['ROW-1'].mastered, false);
});
test('mastery XP awarded only once', () => {
  const s = E.freshState();
  [0, 1, 4, 11, 25].forEach((d) => E.recordAnswer(s, q1, true, T0 + d * D));
  eq(s.xp, 5 * 10 + 25);
});

// ---------- Question selection ----------
test('pickQuestions: one question per rule when possible', () => {
  const s = E.freshState();
  const pool = QUESTIONS.filter((q) => q.category === 'signs');
  const picked = E.pickQuestions(s, pool, 3, T0, seeded(3));
  eq(new Set(picked.map((q) => q.rule)).size, 3);
});
test('pickQuestions: due rules come first', () => {
  const s = E.freshState();
  const pool = QUESTIONS.filter((q) => q.category === 'row');
  const row2 = pool.find((q) => q.rule === 'ROW-2');
  E.recordAnswer(s, row2, false, T0 - D); // ROW-2 due now
  ['ROW-1', 'ROW-3'].forEach((id) => E.recordAnswer(s, pool.find((q) => q.rule === id), true, T0 - D)); // due tomorrow-ish
  const picked = E.pickQuestions(s, pool, 1, T0 - D + 1000, seeded(5));
  eq(picked[0].rule, 'ROW-2');
});
test('pickQuestions: prefers a different wording of the same rule', () => {
  const s = E.freshState();
  const pool = QUESTIONS.filter((q) => q.rule === 'SGN-1');
  E.recordAnswer(s, pool[0], true, T0);
  const picked = E.pickQuestions(s, pool, 1, T0 + 60000, seeded(7));
  ok(picked[0].id !== pool[0].id, 'repeated the just-seen question');
});

// ---------- Exams ----------
test('buildExam: 25 unique questions spanning all 11 topics', () => {
  const s = E.freshState();
  const ex = E.buildExam(s, QUESTIONS, 25, seeded(11));
  eq(ex.length, 25);
  eq(new Set(ex.map((q) => q.id)).size, 25);
  eq(new Set(ex.map((q) => q.category)).size, 11);
});
test('buildExam: avoids repeating the previous exam where possible', () => {
  const s = E.freshState();
  const first = E.buildExam(s, QUESTIONS, 25, seeded(13));
  s.exams.push({ score: 0, total: 25, ids: first.map((q) => q.id) });
  const second = E.buildExam(s, QUESTIONS, 25, seeded(17));
  const overlap = second.filter((q) => first.some((f) => f.id === q.id)).length;
  ok(overlap <= 3, `overlap too high: ${overlap}`);
});
test('gradeExam: score, topic breakdown, wrong list', () => {
  const qs = QUESTIONS.slice(0, 4);
  const g = E.gradeExam(qs, [0, 0, 1, 0]);
  eq(g.score, 3);
  eq(g.wrong, [qs[2].id]);
  eq(g.byCat.signs, [3, 4]);
});

// ---------- Readiness ----------
test('readiness: TEST READY only after 3 consecutive passes', () => {
  const s = E.freshState();
  eq(E.readiness(s, 33, 22).key, 'building');
  s.exams = [{ score: 23, total: 25 }, { score: 22, total: 25 }];
  eq(E.readiness(s, 33, 22).key, 'close');
  s.exams.push({ score: 21, total: 25 });
  eq(E.consecutivePasses(s.exams, 22), 0);
  eq(E.readiness(s, 33, 22).key, 'building', 'a strong score alone, with no mastery, is not "close"');
  s.exams.push({ score: 22, total: 25 }, { score: 24, total: 25 }, { score: 25, total: 25 });
  eq(E.readiness(s, 33, 22).key, 'ready');
});

// ---------- Sessions ----------
test('session: 5 steps, +100 XP on completion, resumable', () => {
  const s = E.freshState();
  E.startSession(s, T0);
  E.advanceSession(s, T0);
  E.advanceSession(s, T0);
  const restored = E.migrate(JSON.parse(JSON.stringify(s))); // simulate app close/reopen
  eq(restored.sessions.current.step, 2);
  E.advanceSession(restored, T0);
  E.advanceSession(restored, T0);
  const res = E.advanceSession(restored, T0);
  eq(res.done, true);
  eq(restored.xp, 100);
  eq(restored.sessions.completed, 1);
  eq(restored.sessions.current, null);
});
test('weekly streak counts weeks, not days, and tolerates an unfinished current week', () => {
  const now = new Date(2026, 10, 20).getTime(); // Fri Nov 20
  eq(E.weeklyStreak(['2026-11-03', '2026-11-12'], now), 2);
  eq(E.weeklyStreak(['2026-11-03', '2026-11-12', '2026-11-18'], now), 3);
  eq(E.weeklyStreak(['2026-10-20'], now), 0);
});

// ---------- Persistence ----------
test('migrate: survives null, garbage, and partial saves', () => {
  eq(E.migrate(null).xp, 0);
  eq(E.migrate('junk').version, 1);
  const m = E.migrate({ xp: 50, rules: null, equipped: { wheels: 'split' } });
  eq(m.xp, 50);
  eq(m.rules, {});
  eq(m.equipped.wheels, 'split');
  eq(m.equipped.paint, 'gloss');
});
test('readiness: one good exam on day one with zero mastery stays BUILDING', () => {
  const s = E.freshState();
  s.exams = [{ score: 21, total: 25 }];
  eq(E.readiness(s, 33, 22).key, 'building');
});
test('state round-trips through JSON without loss', () => {
  const s = E.freshState();
  s.profile = { nickname: 'J', vehicle: 'suv', accent: '#00B8FF' };
  E.recordAnswer(s, q1, true, T0);
  eq(E.migrate(JSON.parse(JSON.stringify(s))), s);
});

// ---------- Plan ----------
test('plan: weeks run to the April 20, 2027 test date', () => {
  const p = E.buildPlan('2026-11-06', CATEGORIES);
  eq(p.weeks[0].start, '2026-11-02');
  ok(p.weeks[p.weeks.length - 1].end >= '2027-04-19', 'last week ends before test');
  eq(p.topicsScheduled, 11);
  ok(p.weeks.filter((w) => w.phase === 'exams').every((w) => w.start >= '2027-03-01'), 'exam weeks start before March');
});
test('plan: missed weeks are not marked complete (index only moves by date)', () => {
  const p = E.buildPlan('2026-11-06', CATEGORIES);
  eq(E.currentWeekIndex(p, new Date(2026, 11, 1).getTime()), 4);
});

// ---------- Content integrity ----------
test('33 rules, 3 per category, unique ids', () => {
  eq(RULES.length, 33);
  eq(new Set(RULES.map((r) => r.id)).size, 33);
  CATEGORIES.forEach((c) => eq(RULES.filter((r) => r.category === c.id).length, 3, c.id));
});
test('every rule has a verification record with source, URL, reference and date', () => {
  RULES.forEach((r) => {
    const v = VERIFICATION[r.id];
    ok(v, `missing verification for ${r.id}`);
    ok(['VERIFIED', 'NEEDS REVIEW', 'UNVERIFIED'].includes(v.status), r.id);
    if (v.status === 'VERIFIED') ok(v.source && v.url.startsWith('https://') && v.ref && v.date, `incomplete source for ${r.id}`);
  });
});
test('every question references a real rule, has 4 unique choices and a valid answer', () => {
  eq(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  QUESTIONS.forEach((q) => {
    ok(ruleById[q.rule], `${q.id} bad rule`);
    eq(q.category, ruleById[q.rule].category, q.id);
    eq(q.choices.length, 4, q.id);
    eq(new Set(q.choices).size, 4, q.id);
    ok(q.answer >= 0 && q.answer < q.choices.length, q.id);
  });
});
test('every rule is tested by at least 2 questions; every topic has >= 5', () => {
  RULES.forEach((r) => ok(QUESTIONS.filter((q) => q.rule === r.id).length >= 2, r.id));
  CATEGORIES.forEach((c) => ok(QUESTIONS.filter((q) => q.category === c.id).length >= 5, c.id));
});
test('knowledge test format matches verified MVA format', () => {
  eq([KNOWLEDGE_TEST.questions, KNOWLEDGE_TEST.passMark, KNOWLEDGE_TEST.passPct], [25, 22, 88]);
  eq(Math.ceil(KNOWLEDGE_TEST.questions * KNOWLEDGE_TEST.passPct / 100), KNOWLEDGE_TEST.passMark);
});
test('scenario rounds reference rules and have valid answers', () => {
  SCENARIOS.forEach((sc) => sc.rounds.forEach((r) => {
    ok(ruleById[r.rule], r.id);
    ok(r.answer >= 0 && r.answer < r.choices.length, r.id);
    ok(r.cars.some((c) => c.player), `${r.id} has no player car`);
    r.resolve.forEach((st) => ok(r.cars.some((c) => c.id === st.car), `${r.id} resolve car`));
  }));
});

// ---------- Report ----------
const pass = results.filter((r) => r.ok).length;
window.__testResults = { pass, fail: results.length - pass, results };
document.getElementById('out').innerHTML =
  `<h1 style="color:${pass === results.length ? '#B6FF40' : '#FF4D5E'}">${pass}/${results.length} passed</h1>` +
  results.map((r) => `<div style="color:${r.ok ? '#B6FF40' : '#FF4D5E'}">${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : ` — ${r.err}`}</div>`).join('');
