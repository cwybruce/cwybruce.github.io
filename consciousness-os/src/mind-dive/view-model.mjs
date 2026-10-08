export function buildMindDiveViewModel(state) {
  const labelMap = {
    trigger: '现实触发', meaning: '自动解释', reward: '即时奖励', action: '行为选择',
    observer: '观察者', intervention: '最小干预', 'new-loop': '新回路'
  };
  return {
    timeLabel: `${state.time.toFixed(1)}s / ${state.duration}s`,
    phase: state.phase,
    activeNode: state.activeNode,
    activeLabel: labelMap[state.activeNode] ?? state.activeNode,
    headline: state.headline,
    subline: state.subline,
    traceLines: state.trace,
    metrics: state.metrics,
    packetProgress: state.packetProgress,
    pulse: state.pulse,
    cameraDepth: state.cameraDepth,
    oldLoopStrength: state.oldLoopStrength,
    newLoopStrength: state.newLoopStrength,
    overallProgress: state.overallProgress
  };
}
