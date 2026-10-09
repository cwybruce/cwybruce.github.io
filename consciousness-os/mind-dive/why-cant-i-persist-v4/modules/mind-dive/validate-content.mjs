export class InvalidQuestionContentError extends Error {
  constructor(field) { super(`Invalid question content: ${field}`); this.name = 'InvalidQuestionContentError'; this.field = field; }
}

export function validateQuestionContent(content) {
  const scalarFields = ['slug','title','trainingPrompt'];
  for (const field of scalarFields) if (typeof content?.[field] !== 'string' || !content[field].trim()) throw new InvalidQuestionContentError(field);
  const arrayFields = ['mechanisms','oldLoop','interventions','newLoop','scenes'];
  for (const field of arrayFields) if (!Array.isArray(content?.[field]) || content[field].length === 0) throw new InvalidQuestionContentError(field);
  for (const scene of content.scenes) {
    if (!scene?.id || !Number.isFinite(scene.start) || !Number.isFinite(scene.end) || scene.end <= scene.start || !scene.headline?.trim() || !scene.subline?.trim() || !scene.activeNode?.trim() || !Array.isArray(scene.trace) || scene.trace.length === 0) throw new InvalidQuestionContentError('scenes');
  }
  return content;
}
