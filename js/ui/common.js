import { CATEGORIES, RULES, ruleById } from '../content/curriculum.js';
import { QUESTIONS } from '../content/questions.js';
import { verificationFor, KNOWLEDGE_TEST } from '../content/verification.js';
import { MASTERY_BOX, readiness, levelInfo } from '../engine.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Only VERIFIED rules count as authoritative curriculum. */
export const VERIFIED_RULES = RULES.filter((r) => verificationFor(r.id).status === 'VERIFIED');
export const VERIFIED_IDS = VERIFIED_RULES.map((r) => r.id);
/** Questions in released content: only those testing verified rules. */
export const LIVE_QUESTIONS = QUESTIONS.filter((q) => VERIFIED_IDS.includes(q.rule));

export const PASS_MARK = KNOWLEDGE_TEST.passMark;
export const EXAM_SIZE = KNOWLEDGE_TEST.questions;

export function bar(pct, cls = '') {
  const p = Math.max(0, Math.min(1, pct || 0));
  return `<div class="bar ${cls}" role="progressbar" aria-valuenow="${Math.round(p * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${(p * 100).toFixed(1)}%"></i></div>`;
}

export function srcBadge(ruleId) {
  const v = verificationFor(ruleId);
  if (v.status === 'VERIFIED') {
    const short = v.source.startsWith("Maryland Driver's Manual") ? 'MD Driver\'s Manual (Oct 2026)' : v.source;
    return `<div class="src"><b>✓ VERIFIED</b> · ${esc(short)}, ${esc(v.ref)}</div>`;
  }
  return `<div class="src warn"><b>⚠ ${esc(v.status)}</b> · Demo content — not verified Maryland law</div>`;
}

export function ruleProgress(state, ruleId) {
  const r = state.rules[ruleId];
  if (!r || !r.attempts) return { key: 'new', label: 'NEW', box: 0 };
  if (r.mastered) return { key: 'mastered', label: 'MASTERED', box: r.box };
  if (r.due <= Date.now()) return { key: 'due', label: 'REVIEW', box: r.box };
  return { key: 'learning', label: 'LEARNING', box: r.box };
}

export function dots(box) {
  return `<span class="dots" aria-label="Recall level ${box} of ${MASTERY_BOX}">${Array.from({ length: MASTERY_BOX }, (_, i) => `<i class="${i < box ? 'on' : ''}"></i>`).join('')}</span>`;
}

/** Honest overall progress: average progress toward mastery across verified rules. */
export function overallProgress(state) {
  if (!VERIFIED_IDS.length) return 0;
  const sum = VERIFIED_IDS.reduce((a, id) => a + Math.min(1, (state.rules[id]?.box || 0) / MASTERY_BOX), 0);
  return sum / VERIFIED_IDS.length;
}

export function categoryStats(state, catId) {
  const ruleIds = VERIFIED_RULES.filter((r) => r.category === catId).map((r) => r.id);
  let att = 0, cor = 0, mastered = 0, boxSum = 0;
  for (const id of ruleIds) {
    const r = state.rules[id];
    if (!r) continue;
    att += r.attempts;
    cor += r.correct;
    boxSum += Math.min(MASTERY_BOX, r.box);
    if (r.mastered) mastered++;
  }
  return { ruleIds, attempts: att, correct: cor, acc: att ? cor / att : null, mastered, total: ruleIds.length, progress: ruleIds.length ? boxSum / (ruleIds.length * MASTERY_BOX) : 0 };
}

export function readinessFor(state) {
  return readiness(state, VERIFIED_IDS.length, PASS_MARK);
}

export function levelBlock(state) {
  const li = levelInfo(state.xp);
  return { ...li, html: `<div class="level-badge" aria-label="Level ${li.level}">${li.level}</div>` };
}

export function header(title, eyebrow = '') {
  return `<div class="stack" style="margin-bottom:16px">${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<h1 class="h1">${esc(title)}</h1></div>`;
}

export { CATEGORIES, RULES, ruleById, QUESTIONS };
