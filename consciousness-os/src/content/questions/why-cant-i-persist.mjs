export const WHY_CANT_I_PERSIST = Object.freeze({
  slug: 'why-cant-i-persist',
  title: '为什么我总坚持不了？',
  mechanisms: ['reward_conflict', 'task_friction', 'identity_threat'],
  oldLoop: ['今天很累', '少做一天没关系', '即时舒服更有吸引力', '跳过行动', '旧回路被强化'],
  interventions: ['看见自动解释', '把目标缩到两分钟', '让启动动作比逃避更容易'],
  newLoop: ['触发出现', '观察者上线', '完成最小动作', '获得完成反馈', '强化“我是会回来的人”'],
  trainingPrompt: '今天只做一个两分钟版本，并记录你开始前和完成后的感受。',
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
