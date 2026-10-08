import { ASSESSMENT_QUESTIONS } from '../content/assessment.mjs';
import { MODE_ORDER } from '../content/modes.mjs';

export class AssessmentIncompleteError extends Error {
  constructor(message = '请先完成全部题目。') { super(message); this.name = 'AssessmentIncompleteError'; }
}
export class AssessmentAnswerError extends Error {
  constructor(answerId) { super(`未知答案：${answerId}`); this.name = 'AssessmentAnswerError'; }
}

export function rankModeScores(scores) {
  return [...MODE_ORDER].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0) || MODE_ORDER.indexOf(a) - MODE_ORDER.indexOf(b));
}

const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));

export function scoreAssessment(answerIds) {
  if (!Array.isArray(answerIds) || answerIds.length !== ASSESSMENT_QUESTIONS.length) throw new AssessmentIncompleteError();
  const knownAnswerIds = new Set(ASSESSMENT_QUESTIONS.flatMap((question) => question.options.map((option) => option.id)));
  for (const id of answerIds) if (!knownAnswerIds.has(id)) throw new AssessmentAnswerError(id);

  const modeRaw = Object.fromEntries(MODE_ORDER.map((id) => [id, 0]));
  const pressureRaw = Object.fromEntries(MODE_ORDER.map((id) => [id, 0]));
  const dimensionRaw = {};

  for (const question of ASSESSMENT_QUESTIONS) {
    const chosen = question.options.find((option) => answerIds.includes(option.id));
    if (!chosen) throw new AssessmentIncompleteError(`题目 ${question.id} 尚未作答。`);
    for (const [mode, value] of Object.entries(chosen.modeWeights ?? {})) modeRaw[mode] += value;
    for (const [mode, value] of Object.entries(chosen.pressureWeights ?? {})) pressureRaw[mode] += value;
    for (const [dimension, value] of Object.entries(chosen.dimensions ?? {})) {
      (dimensionRaw[dimension] ??= []).push(value);
    }
  }

  const ranked = rankModeScores(modeRaw);
  const fallbackRanked = rankModeScores(pressureRaw);
  const maxRaw = ASSESSMENT_QUESTIONS.length * 5;
  const modeScores = Object.fromEntries(MODE_ORDER.map((id) => [id, clamp100((modeRaw[id] / maxRaw) * 100)]));
  const dimensions = Object.fromEntries(Object.entries(dimensionRaw).map(([key, values]) => [key, clamp100(values.reduce((a, b) => a + b, 0) / values.length)]));

  return { dominantMode: ranked[0], secondaryMode: ranked[1], fallbackMode: fallbackRanked[0], dimensions, modeScores };
}
