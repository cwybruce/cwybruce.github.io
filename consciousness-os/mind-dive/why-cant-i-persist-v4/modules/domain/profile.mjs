import { getMode } from '../content/modes.mjs';

export const MODE_COPY = Object.freeze({
  survival: {
    explanation: '你会先扫描风险、资源和可控性。稳定以后，你才有余力探索更复杂的问题。',
    strengths: ['风险感知快', '现实生存能力强'],
    blindSpot: '容易把不确定性自动解释成威胁，长期消耗注意力。',
    fallbackCopy: '压力大时，你更容易收缩到“先别出事”的模式。'
  },
  belonging: {
    explanation: '你会先确认关系与群体位置，再决定怎样行动。被接纳会显著提高安全感。',
    strengths: ['忠诚与协作', '能够感知群体规则'],
    blindSpot: '容易把他人的评价当成自己的最终判断。',
    fallbackCopy: '压力大时，你可能更想寻求认同或避免被排斥。'
  },
  ego: {
    explanation: '你倾向通过能力、结果和位置确认“我是谁”。目标会给你很强的驱动力。',
    strengths: ['行动力强', '结果意识清晰'],
    blindSpot: '容易把一次失败和“我不够好”绑定。',
    fallbackCopy: '压力大时，你可能通过控制、竞争或证明自己恢复确定感。'
  },
  rational: {
    explanation: '你更愿意把问题拆成变量、证据和因果关系，用模型而不是情绪做决定。',
    strengths: ['系统分析', '能够修正旧方法'],
    blindSpot: '容易把“想清楚”替代真正行动，也可能低估身体和关系信息。',
    fallbackCopy: '压力大时，你可能退回自我证明：知道很多，但一失败仍会怀疑自己。'
  },
  care: {
    explanation: '你能同时感知自己的需要和他人的感受，关系质量本身就是重要信息。',
    strengths: ['共情与修复关系', '多视角理解'],
    blindSpot: '为了理解所有人，可能削弱自己的边界和必要冲突。',
    fallbackCopy: '压力大时，你可能过度照顾关系，暂时忽略自己的需要。'
  },
  integration: {
    explanation: '你更容易看见不同模型在不同情境下都可能成立，并主动切换视角。',
    strengths: ['系统思维', '处理复杂矛盾'],
    blindSpot: '理解越复杂，行动有时反而越慢。',
    fallbackCopy: '压力大时，你可能退回理性分析，用更多模型替代选择。'
  },
  transcendence: {
    explanation: '你会把个人目标放进更大的生命与意义背景，较少只围绕自我证明行动。',
    strengths: ['意义感稳定', '低防御开放性'],
    blindSpot: '如果缺少现实落地，超越也可能变成逃避具体责任。',
    fallbackCopy: '压力大时，你仍可能回到整合或理性层，重新寻找结构。'
  }
});

const MODIFIER_MAP = {
  survival: ['high-threat-sensitivity'],
  belonging: ['social-evaluation'],
  ego: ['identity-threat', 'control-loop'],
  rational: ['analysis-loop'],
  care: ['relationship-salience'],
  integration: ['multi-model'],
  transcendence: ['meaning-frame']
};

export function buildMindProfile(result) {
  const mode = getMode(result?.dominantMode);
  getMode(result?.secondaryMode);
  getMode(result?.fallbackMode);
  const copy = MODE_COPY[mode.id];
  return {
    highlightedMode: mode.id,
    copyVariant: `${mode.id}-${result.fallbackMode}`,
    sceneModifiers: [...(MODIFIER_MAP[mode.id] ?? [])].slice(0, 2),
    copy,
    result
  };
}
