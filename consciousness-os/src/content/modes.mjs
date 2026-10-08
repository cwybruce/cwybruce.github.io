export const CONSCIOUSNESS_MODES = Object.freeze([
  { id: 'survival', zh: '生存', en: 'Survival', range: [0, 14], summary: '先确保安全、资源与可控性。' },
  { id: 'belonging', zh: '归属', en: 'Belonging', range: [15, 28], summary: '通过关系、群体与共同规则获得稳定。' },
  { id: 'ego', zh: '自我', en: 'Ego', range: [29, 42], summary: '通过能力、结果与位置证明自我价值。' },
  { id: 'rational', zh: '理性', en: 'Rational', range: [43, 57], summary: '用证据、模型与因果关系修正行动。' },
  { id: 'care', zh: '关怀', en: 'Care', range: [58, 71], summary: '同时看见自己与他人的需求和感受。' },
  { id: 'integration', zh: '整合', en: 'Integration', range: [72, 85], summary: '容纳多种视角，并根据情境切换模型。' },
  { id: 'transcendence', zh: '超越', en: 'Transcendence', range: [86, 100], summary: '把个人目标放回更大的生命与系统背景。' }
]);

export const MODE_ORDER = Object.freeze(CONSCIOUSNESS_MODES.map((mode) => mode.id));

export function getMode(id) {
  const mode = CONSCIOUSNESS_MODES.find((item) => item.id === id);
  if (!mode) throw new Error(`Unknown consciousness mode: ${id}`);
  return mode;
}
