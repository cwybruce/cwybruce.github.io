export const WHY_CANT_I_PERSIST = Object.freeze({
  slug: 'why-cant-i-persist',
  title: '为什么我总坚持不了？',
  mechanisms: ['reward_conflict', 'task_friction', 'identity_threat'],
  oldLoop: ['今天很累', '少做一天没关系', '即时舒服更有吸引力', '跳过行动', '旧回路被强化'],
  interventions: ['看见自动解释', '把目标缩到两分钟', '让启动动作比逃避更容易'],
  newLoop: ['触发出现', '观察者上线', '完成最小动作', '获得完成反馈', '强化“我是会回来的人”'],
  trainingPrompt: '今天只做一个两分钟版本，并记录你开始前和完成后的感受。',
  microAction: {
    trigger: '当你想到“今天太累了，明天再开始”，先停一下：这是一个信号。看看自己需要缩小任务，还是确实需要休息。',
    choices: [
      {id:'read',title:'阅读：只读一段',detail:'打开你原本想读的材料，读一段，圈出一句。两分钟后可以停。'},
      {id:'write',title:'写作：只写一句',detail:'打开你正在拖延的文档，写下一句粗糙的开头。暂时不用修改。'},
      {id:'tidy',title:'整理：只归位一件',detail:'挑一件妨碍你开始的物品，把它放回合适的位置。先做这一件。'}
    ],
    completed: '你报告已完成这个小动作。回想一下：什么让开始变容易了？下次遇到同样触发，可以再用这个小版本。',
    incomplete: {
      '': '先观察卡在哪里，再决定缩小动作、换个时机，或先休息。',
      'too-big': '动作仍然太大？下次先只打开材料或文档，把第一步再缩小一点。',
      interrupted: '被打断了也可以回来。下次选一个更少打扰的时机，从第一步重新开始。',
      rest: '如果你确实疲惫，休息也是合理的选择。等精力恢复，再决定是否回来做这个小动作。'
    }
  },
  scenes: [
    {
      id: 'trigger', label: '现实触发', start: 0, end: 5,
      headline: '现实触发', subline: '“今天太累了，明天再开始。”', activeNode: 'trigger',
      trace: ['INPUT  今天很累', 'SIGNAL  task_friction ↑', 'SYSTEM  searching default path...']
    },
    {
      id: 'interpretation', label: '自动解释', start: 5, end: 10,
      headline: '自动解释', subline: '大脑不是在讨论真理，它在快速解释：现在行动成本太高。', activeNode: 'meaning',
      trace: ['MEANING  “现在做很难”', 'PREDICTION  effort > reward', 'IDENTITY  checking self-worth...']
    },
    {
      id: 'reward', label: '即时奖励冲突', start: 10, end: 15,
      headline: '即时奖励冲突', subline: '休息马上舒服；坚持的收益却要很久以后才出现。', activeNode: 'reward',
      trace: ['REWARD_NOW  relief = immediate', 'REWARD_LATER  progress = delayed', 'CHOICE_BIAS  immediate reward wins']
    },
    {
      id: 'old-loop', label: '旧回路', start: 15, end: 21,
      headline: '旧回路被强化', subline: '每一次“先逃一下”，都会让下一次逃避更容易被选择。', activeNode: 'action',
      trace: ['ACTION  skip / scroll / postpone', 'RELIEF  short-term ↑', 'LEARNING  avoidance path +1']
    },
    {
      id: 'observer', label: '观察者介入', start: 21, end: 26,
      headline: '观察者上线', subline: '改变从这一秒开始：你第一次看见“想放弃”只是一个信号。', activeNode: 'observer',
      personalizeWithProfile: true,
      trace: ['OBSERVER  online', 'LABEL  “这是冲动，不是命令”', 'CHOICE_SPACE  expanding...']
    },
    {
      id: 'intervention', label: '最小干预', start: 26, end: 31,
      headline: '最小干预', subline: '别要求自己完成全部，只把启动动作缩到两分钟。', activeNode: 'intervention',
      trace: ['REFRAME  finish → start', 'ACTION  2-minute version', 'FRICTION  ↓↓↓']
    },
    {
      id: 'new-loop', label: '新回路', start: 31, end: 36,
      headline: '重写默认路径', subline: '触发 → 看见 → 最小行动 → 完成反馈 → 更容易再次回来。', activeNode: 'new-loop',
      trace: ['ACTION  minimum completed', 'FEEDBACK  “我回来了”', 'IDENTITY  reliable-return +1']
    }
  ]
});
