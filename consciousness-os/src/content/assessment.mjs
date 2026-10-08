const rationalFixture = (id, label, dims = {}) => ({
  id,
  label,
  tags: ['rational-fixture'],
  modeWeights: { rational: 4, care: 2, ego: 1, integration: 1 },
  pressureWeights: { ego: 4, survival: 1, rational: 1 },
  dimensions: { safety: 42, belonging: 48, achievement: 72, analysis: 92, empathy: 66, flexibility: 70, ...dims }
});

export const ASSESSMENT_QUESTIONS = Object.freeze([
  {
    id: 'q1',
    prompt: '一个重要计划连续两天没有完成，你最自然的第一反应是什么？',
    options: [
      { id: 'q1-a', label: '先确保别再失控，马上把一切重新排死。', modeWeights: { survival: 4, ego: 2 }, pressureWeights: { survival: 5 }, dimensions: { safety: 94, belonging: 34, achievement: 75, analysis: 42, empathy: 28, flexibility: 20 } },
      { id: 'q1-b', label: '有点怕别人觉得我不行，想赶紧追回进度。', modeWeights: { ego: 4, belonging: 2 }, pressureWeights: { ego: 5 }, dimensions: { safety: 55, belonging: 72, achievement: 94, analysis: 52, empathy: 42, flexibility: 35 } },
      rationalFixture('q1-c', '先看是哪一步反复失败，再调整系统而不是骂自己。'),
      { id: 'q1-d', label: '先理解自己现在的状态，再决定怎样兼顾目标和恢复。', modeWeights: { care: 4, integration: 3, rational: 1 }, pressureWeights: { belonging: 2, care: 2 }, dimensions: { safety: 50, belonging: 65, achievement: 58, analysis: 72, empathy: 94, flexibility: 84 } }
    ]
  },
  {
    id: 'q2', prompt: '别人公开质疑你的能力时，你更可能怎么处理？',
    options: [
      { id: 'q2-a', label: '先判断对方是不是在威胁我的位置。', modeWeights: { survival: 3, ego: 3 }, pressureWeights: { survival: 4, ego: 3 }, dimensions: { safety: 88, belonging: 38, achievement: 80, analysis: 36, empathy: 25, flexibility: 22 } },
      { id: 'q2-b', label: '最难受的是群体怎么看我。', modeWeights: { belonging: 4, ego: 2 }, pressureWeights: { belonging: 5 }, dimensions: { safety: 61, belonging: 95, achievement: 68, analysis: 38, empathy: 62, flexibility: 38 } },
      rationalFixture('q2-c', '把质疑拆成可验证的事实：他说对了什么，错了什么？', { analysis: 96 }),
      { id: 'q2-d', label: '既看事实，也看这场冲突背后的关系和需求。', modeWeights: { integration: 4, care: 3, rational: 2 }, pressureWeights: { care: 2, rational: 1 }, dimensions: { safety: 48, belonging: 70, achievement: 55, analysis: 84, empathy: 92, flexibility: 93 } }
    ]
  },
  {
    id: 'q3', prompt: '面对一个没有标准答案的人生选择，你通常依靠什么？',
    options: [
      { id: 'q3-a', label: '选风险最低、最稳的那个。', modeWeights: { survival: 4, belonging: 1 }, pressureWeights: { survival: 5 }, dimensions: { safety: 96, belonging: 44, achievement: 45, analysis: 48, empathy: 35, flexibility: 18 } },
      { id: 'q3-b', label: '参考我认可的人和群体怎么选。', modeWeights: { belonging: 4, care: 1 }, pressureWeights: { belonging: 4 }, dimensions: { safety: 66, belonging: 94, achievement: 48, analysis: 42, empathy: 68, flexibility: 42 } },
      rationalFixture('q3-c', '列出假设、代价和可逆性，先做一个小实验。', { flexibility: 78 }),
      { id: 'q3-d', label: '允许多个价值同时成立，再做此刻最匹配的选择。', modeWeights: { integration: 4, transcendence: 2, care: 2 }, pressureWeights: { rational: 2, care: 1 }, dimensions: { safety: 45, belonging: 64, achievement: 52, analysis: 82, empathy: 86, flexibility: 98 } }
    ]
  },
  {
    id: 'q4', prompt: '你努力做一件长期事情时，最能驱动你的是什么？',
    options: [
      { id: 'q4-a', label: '不想掉下去，我必须保住基本盘。', modeWeights: { survival: 4, ego: 1 }, pressureWeights: { survival: 5 }, dimensions: { safety: 95, belonging: 40, achievement: 70, analysis: 38, empathy: 32, flexibility: 24 } },
      { id: 'q4-b', label: '想被认可，也想证明自己有能力。', modeWeights: { ego: 4, belonging: 2 }, pressureWeights: { ego: 5 }, dimensions: { safety: 52, belonging: 76, achievement: 98, analysis: 52, empathy: 40, flexibility: 40 } },
      rationalFixture('q4-c', '我会把长期目标拆成可反馈的系统，让数据帮我校准。', { achievement: 80 }),
      { id: 'q4-d', label: '它和我想成为的人、想创造的价值是一致的。', modeWeights: { transcendence: 4, integration: 3, care: 2 }, pressureWeights: { care: 2, rational: 1 }, dimensions: { safety: 46, belonging: 62, achievement: 72, analysis: 72, empathy: 84, flexibility: 88 } }
    ]
  },
  {
    id: 'q5', prompt: '当计划被突发事件打乱，你通常最难受的是什么？',
    options: [
      { id: 'q5-a', label: '不确定性让我觉得危险。', modeWeights: { survival: 5 }, pressureWeights: { survival: 5 }, dimensions: { safety: 100, belonging: 35, achievement: 58, analysis: 36, empathy: 30, flexibility: 12 } },
      { id: 'q5-b', label: '失去掌控让我觉得自己很失败。', modeWeights: { ego: 4, survival: 1 }, pressureWeights: { ego: 5 }, dimensions: { safety: 60, belonging: 42, achievement: 96, analysis: 48, empathy: 34, flexibility: 24 } },
      rationalFixture('q5-c', '先确认哪些变量真的变了，再重算下一步。', { safety: 48, flexibility: 74 }),
      { id: 'q5-d', label: '我会根据情境切换目标，而不是执着于原方案。', modeWeights: { integration: 4, rational: 2, care: 1 }, pressureWeights: { rational: 2 }, dimensions: { safety: 44, belonging: 54, achievement: 62, analysis: 86, empathy: 72, flexibility: 97 } }
    ]
  },
  {
    id: 'q6', prompt: '朋友做了一个你认为明显错误的决定，你更可能？',
    options: [
      { id: 'q6-a', label: '赶紧提醒他风险，避免事情变糟。', modeWeights: { survival: 3, care: 2 }, pressureWeights: { survival: 3 }, dimensions: { safety: 84, belonging: 58, achievement: 46, analysis: 55, empathy: 65, flexibility: 38 } },
      { id: 'q6-b', label: '如果他不听，我会觉得他不尊重我的判断。', modeWeights: { ego: 4, belonging: 1 }, pressureWeights: { ego: 4 }, dimensions: { safety: 52, belonging: 58, achievement: 88, analysis: 56, empathy: 35, flexibility: 28 } },
      rationalFixture('q6-c', '先问他依据什么，再提供我看到的证据和风险。', { empathy: 72 }),
      { id: 'q6-d', label: '理解他为什么必须自己走这一步，同时保持我的边界。', modeWeights: { care: 4, integration: 3 }, pressureWeights: { care: 3 }, dimensions: { safety: 46, belonging: 72, achievement: 45, analysis: 72, empathy: 98, flexibility: 88 } }
    ]
  },
  {
    id: 'q7', prompt: '当你发现自己一直重复同一个坏习惯，你首先会怎么理解？',
    options: [
      { id: 'q7-a', label: '我可能就是控制不住自己。', modeWeights: { survival: 2, ego: 3 }, pressureWeights: { survival: 3, ego: 3 }, dimensions: { safety: 74, belonging: 42, achievement: 82, analysis: 35, empathy: 30, flexibility: 20 } },
      { id: 'q7-b', label: '我会担心别人发现后怎么看我。', modeWeights: { belonging: 4, ego: 2 }, pressureWeights: { belonging: 5 }, dimensions: { safety: 60, belonging: 96, achievement: 70, analysis: 35, empathy: 55, flexibility: 30 } },
      rationalFixture('q7-c', '这个习惯一定在某个环节给了我即时收益，我要找到它。', { analysis: 98 }),
      { id: 'q7-d', label: '它可能曾经保护过我，现在需要的是更新而不是消灭自己。', modeWeights: { integration: 4, care: 3, transcendence: 1 }, pressureWeights: { care: 3 }, dimensions: { safety: 48, belonging: 62, achievement: 48, analysis: 78, empathy: 96, flexibility: 92 } }
    ]
  },
  {
    id: 'q8', prompt: '如果一个目标很重要但短期完全看不到回报，你会怎么继续？',
    options: [
      { id: 'q8-a', label: '先保证生活安全，有余力再说。', modeWeights: { survival: 4 }, pressureWeights: { survival: 5 }, dimensions: { safety: 97, belonging: 45, achievement: 50, analysis: 46, empathy: 42, flexibility: 35 } },
      { id: 'q8-b', label: '靠竞争、承诺和成绩逼自己坚持。', modeWeights: { ego: 4, belonging: 1 }, pressureWeights: { ego: 5 }, dimensions: { safety: 56, belonging: 58, achievement: 99, analysis: 54, empathy: 35, flexibility: 34 } },
      rationalFixture('q8-c', '定义领先指标，让系统在最终结果出现前就给我反馈。', { achievement: 84, analysis: 97 }),
      { id: 'q8-d', label: '把它放进更大的生命方向里，允许节奏变化但不丢方向。', modeWeights: { transcendence: 4, integration: 4, care: 1 }, pressureWeights: { rational: 1, care: 1 }, dimensions: { safety: 44, belonging: 58, achievement: 64, analysis: 78, empathy: 82, flexibility: 96 } }
    ]
  }
]);
