// Pure learning-engine logic. No DOM access, so it can be unit tested.
// Every function takes state/time explicitly.

export const DAY = 24 * 60 * 60 * 1000;
export const TEST_DATE = '2027-04-20';
export const EXAM_TARGET_DATE = '2027-04-01';

// Spaced repetition intervals (days) indexed by box after a successful recall.
export const INTERVALS = [0, 1, 3, 7, 14];
export const MASTERY_BOX = 3; // 3 successful recalls on 3 different days

export const XP = {
  correct: 10,
  attempt: 2, // participation for a wrong answer
  mission: 50,
  master: 25,
  session: 100,
  perfect: 50,
};

export function dayKey(ts) {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dd}`;
}

export function parseDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function daysUntil(targetKey, now) {
  const start = parseDay(dayKey(now));
  return Math.round((parseDay(targetKey) - start) / DAY);
}

// ---------- State ----------

export function freshState() {
  return {
    version: 1,
    profile: null, // {nickname, vehicle, accent}
    equipped: { wheels: 'stock', paint: 'gloss', lights: 'none', bg: 'concrete' },
    xp: 0,
    rules: {}, // ruleId -> {box, due, lastCorrectDay, attempts, correct, mastered}
    questions: {}, // qid -> {seen, correct, last}
    days: [], // dayKeys with any study activity
    sessions: { completed: 0, history: [], current: null },
    exams: [], // {at, score, total, byCat: {cat:[c,t]}, wrong:[qid], ids:[qid]}
    missions: {}, // scenarioId -> {plays, best}
    stats: { answered: 0, correct: 0 },
  };
}

// Make old/partial saves safe to load.
export function migrate(raw) {
  const base = freshState();
  if (!raw || typeof raw !== 'object') return base;
  const s = { ...base, ...raw };
  s.equipped = { ...base.equipped, ...(raw.equipped || {}) };
  s.sessions = { ...base.sessions, ...(raw.sessions || {}) };
  s.stats = { ...base.stats, ...(raw.stats || {}) };
  for (const k of ['rules', 'questions', 'missions']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
  for (const k of ['days', 'exams']) if (!Array.isArray(s[k])) s[k] = [];
  s.version = 1;
  return s;
}

// ---------- Levels & unlocks ----------

export function levelThreshold(n) {
  return 50 * (n - 1) * (n + 2); // L1 0, L2 200, L3 500, L4 900, L5 1400 ...
}

export function levelInfo(xp) {
  let level = 1;
  while (xp >= levelThreshold(level + 1)) level++;
  const floor = levelThreshold(level);
  const next = levelThreshold(level + 1);
  return { level, floor, next, pct: (xp - floor) / (next - floor) };
}

// ---------- Answer recording / spaced repetition ----------

function ruleRec(state, ruleId) {
  if (!state.rules[ruleId]) {
    state.rules[ruleId] = { box: 0, due: 0, lastCorrectDay: null, attempts: 0, correct: 0, mastered: false };
  }
  return state.rules[ruleId];
}

function markDay(state, now) {
  const k = dayKey(now);
  if (!state.days.includes(k)) state.days.push(k);
}

/**
 * Record one answer. Returns {xp, mastered} gained.
 * opts.exam: exam answers update learning stats but award no per-question XP.
 */
export function recordAnswer(state, question, isCorrect, now, opts = {}) {
  markDay(state, now);
  const today = dayKey(now);
  const q = state.questions[question.id] || { seen: 0, correct: 0, last: 0 };
  q.seen++;
  if (isCorrect) q.correct++;
  q.last = now;
  state.questions[question.id] = q;
  state.stats.answered++;
  if (isCorrect) state.stats.correct++;

  const r = ruleRec(state, question.rule);
  r.attempts++;
  let xp = 0;
  let mastered = false;

  if (isCorrect) {
    r.correct++;
    // Box only advances once per calendar day: mastery needs separate sessions.
    if (r.lastCorrectDay !== today) {
      r.box = Math.min(r.box + 1, INTERVALS.length - 1);
      r.lastCorrectDay = today;
    }
    r.due = now + INTERVALS[r.box] * DAY;
    if (!r.mastered && r.box >= MASTERY_BOX) {
      r.mastered = true;
      mastered = true;
      xp += XP.master;
    }
    if (!opts.exam) xp += XP.correct;
  } else {
    // Wrong answers come back sooner: drop two boxes, due again right away.
    r.box = Math.max(0, r.box - 2);
    r.due = now;
    r.mastered = r.box >= MASTERY_BOX && r.mastered;
    if (!opts.exam) xp += XP.attempt;
  }
  state.xp += xp;
  return { xp, mastered };
}

export function award(state, amount) {
  state.xp += amount;
  return amount;
}

// ---------- Question selection ----------

/** Priority score: lower = ask sooner. */
function questionPriority(state, q, now) {
  const r = state.rules[q.rule];
  const qs = state.questions[q.id];
  let p = 0;
  if (!r) p -= 50; // never practised rule: high value
  else {
    if (r.due <= now) p -= 100; // due for review
    p += r.box * 20;
    if (r.attempts && r.correct / r.attempts < 0.6) p -= 30;
  }
  // Avoid repeating the exact same question: prefer the unseen / least recent variant.
  if (qs) p += 15 + Math.max(0, 30 - (now - qs.last) / (DAY / 4));
  return p;
}

export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick n questions, at most one per rule where possible, best priority first. */
export function pickQuestions(state, pool, n, now, rand = Math.random) {
  const scored = shuffle(pool, rand)
    .map((q) => ({ q, p: questionPriority(state, q, now) }))
    .sort((a, b) => a.p - b.p);
  const out = [];
  const usedRules = new Set();
  for (const { q } of scored) {
    if (out.length >= n) break;
    if (usedRules.has(q.rule)) continue;
    usedRules.add(q.rule);
    out.push(q);
  }
  for (const { q } of scored) {
    if (out.length >= n) break;
    if (!out.includes(q)) out.push(q);
  }
  return out;
}

export function dueRuleIds(state, now) {
  return Object.entries(state.rules)
    .filter(([, r]) => r.due <= now && r.attempts > 0)
    .map(([id]) => id);
}

// ---------- Challenge scoring ----------

export function scoreChallenge(results) {
  const correct = results.filter((r) => r.correct).length;
  return { correct, total: results.length, perfect: results.length > 0 && correct === results.length };
}

// ---------- Practice exams ----------

/** Build an exam: spread across categories, randomized, avoid last exam's questions. */
export function buildExam(state, questions, size, rand = Math.random) {
  const last = state.exams.length ? new Set(state.exams[state.exams.length - 1].ids || []) : new Set();
  const byCat = {};
  for (const q of shuffle(questions, rand)) (byCat[q.category] ||= []).push(q);
  for (const c of Object.keys(byCat)) {
    byCat[c].sort((a, b) => (last.has(a.id) ? 1 : 0) - (last.has(b.id) ? 1 : 0));
  }
  const cats = shuffle(Object.keys(byCat), rand);
  const out = [];
  let i = 0;
  while (out.length < size && cats.some((c) => byCat[c].length)) {
    const c = cats[i++ % cats.length];
    if (byCat[c].length) out.push(byCat[c].shift());
  }
  return shuffle(out, rand);
}

export function gradeExam(questions, answers) {
  const byCat = {};
  const wrong = [];
  let score = 0;
  questions.forEach((q, i) => {
    const ok = answers[i] === q.answer;
    const c = (byCat[q.category] ||= [0, 0]);
    c[1]++;
    if (ok) {
      score++;
      c[0]++;
    } else wrong.push(q.id);
  });
  return { score, total: questions.length, byCat, wrong, ids: questions.map((q) => q.id) };
}

// ---------- Readiness ----------

export function consecutivePasses(exams, passMark) {
  let n = 0;
  for (let i = exams.length - 1; i >= 0; i--) {
    if (exams[i].score >= passMark) n++;
    else break;
  }
  return n;
}

/**
 * TEST READY only when the defined criteria are actually met:
 * three consecutive passing practice exams (each a different generated test).
 */
export function readiness(state, totalRules, passMark) {
  const passes = consecutivePasses(state.exams, passMark);
  const mastered = masteredCount(state);
  const masteryPct = totalRules ? mastered / totalRules : 0;
  if (passes >= 3) return { key: 'ready', label: 'TEST READY', passes, masteryPct };
  const best = state.exams.reduce((m, e) => Math.max(m, e.score / e.total), 0);
  // GETTING CLOSE needs evidence on both fronts: a passing exam, or solid mastery plus a strong exam score.
  if (passes >= 1 || masteryPct >= 0.6 || (best >= 0.8 && masteryPct >= 0.25)) return { key: 'close', label: 'GETTING CLOSE', passes, masteryPct };
  return { key: 'building', label: 'BUILDING SKILLS', passes, masteryPct };
}

export function masteredCount(state, ruleIds) {
  return Object.entries(state.rules).filter(([id, r]) => r.mastered && (!ruleIds || ruleIds.includes(id))).length;
}

// ---------- Streak ----------

/** Weekly streak: consecutive ISO-ish weeks (Mon start) with any study. Missed weeks are not punished beyond reset. */
export function weekKey(ts) {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7; // Mon=0
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return dayKey(monday.getTime());
}

export function weeklyStreak(days, now) {
  const weeks = new Set(days.map((k) => weekKey(parseDay(k))));
  let n = 0;
  let cursor = parseDay(weekKey(now));
  // The current week counts if studied; if not yet, start from last week without breaking.
  if (!weeks.has(dayKey(cursor))) cursor -= 7 * DAY;
  while (weeks.has(weekKey(cursor))) {
    n++;
    cursor -= 7 * DAY;
  }
  return n;
}

// ---------- Weekly session ----------

export const SESSION_STEPS = [
  { key: 'review', label: 'Warm-up review', min: 2 },
  { key: 'learn', label: 'New rules', min: 5 },
  { key: 'mission', label: 'Driving mission', min: 5 },
  { key: 'mixed', label: 'Mixed challenge', min: 5 },
  { key: 'wrap', label: 'Fix mistakes + XP', min: 3 },
];

export function startSession(state, now) {
  if (state.sessions.current) return state.sessions.current;
  state.sessions.current = {
    n: state.sessions.completed + 1,
    startedAt: now,
    step: 0,
    xp: 0,
    xpStart: state.xp,
    mistakes: [],
  };
  return state.sessions.current;
}

export function sessionPct(cur) {
  return cur ? cur.step / SESSION_STEPS.length : 0;
}

export function advanceSession(state, now) {
  const cur = state.sessions.current;
  if (!cur) return null;
  cur.step++;
  if (cur.step >= SESSION_STEPS.length) {
    award(state, XP.session);
    // Session XP = everything earned since the session started (answers, missions, bonuses).
    cur.xp = state.xp - (cur.xpStart ?? state.xp - XP.session);
    state.sessions.completed++;
    state.sessions.history.push({ at: now, n: cur.n, xp: cur.xp });
    state.sessions.current = null;
    markDay(state, now);
    return { done: true, session: cur };
  }
  return { done: false, session: cur };
}

/** Next category to learn: first one with unpractised rules, in curriculum order. */
export function nextCategory(state, categories, rules) {
  for (const c of categories) {
    const ids = rules.filter((r) => r.category === c.id).map((r) => r.id);
    if (ids.some((id) => !state.rules[id] || !state.rules[id].attempts)) return c;
  }
  // Everything touched: weakest category by mastery.
  let worst = categories[0];
  let worstPct = 2;
  for (const c of categories) {
    const ids = rules.filter((r) => r.category === c.id).map((r) => r.id);
    const pct = ids.filter((id) => state.rules[id] && state.rules[id].mastered).length / (ids.length || 1);
    if (pct < worstPct) {
      worst = c;
      worstPct = pct;
    }
  }
  return worst;
}

// ---------- Study plan ----------

/**
 * Build a week-by-week plan from `startKey` to the test date.
 * Phases: learn 11 topics -> spaced/mixed review -> practice exams (from March) -> final check.
 */
export function buildPlan(startKey, categories, testKey = TEST_DATE) {
  const start = parseDay(weekKey(parseDay(startKey)));
  const test = parseDay(testKey);
  const weeks = [];
  for (let t = start; t < test; t += 7 * DAY) weeks.push(t);
  const marchStart = parseDay(testKey.slice(0, 4) + '-03-01');
  const examTarget = parseDay(EXAM_TARGET_DATE);
  let topic = 0;
  const plan = weeks.map((t, i) => {
    const end = t + 6 * DAY;
    let phase;
    let focus;
    if (t >= examTarget) {
      phase = 'final';
      focus = 'Final readiness check + light review';
    } else if (t >= marchStart) {
      phase = 'exams';
      focus = 'Practice exams — aim for 3 passes in a row by Apr 1';
    } else if (topic < categories.length) {
      phase = 'learn';
      focus = categories[topic].name;
      topic++;
    } else {
      phase = 'review';
      focus = 'Mixed review + weak-topic repair';
    }
    return { week: i + 1, start: dayKey(t), end: dayKey(end), phase, focus };
  });
  return {
    weeks: plan,
    totalWeeks: plan.length,
    fits24: plan.length >= 24,
    topicsScheduled: topic,
  };
}

/** Which plan week are we in? Returns index or -1 before / plan.length after. */
export function currentWeekIndex(plan, now) {
  const k = dayKey(now);
  if (k < plan.weeks[0].start) return -1;
  const i = plan.weeks.findIndex((w) => k >= w.start && k <= w.end);
  return i === -1 ? plan.weeks.length : i;
}
