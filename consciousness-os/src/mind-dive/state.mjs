import { validateQuestionContent } from './validate-content.mjs';
import { MIND_DIVE_DURATION, clampTime, phaseAt, smooth01 } from './timeline.mjs';

export { MIND_DIVE_DURATION };

export function getMindDiveState(seconds, profile, content) {
  validateQuestionContent(content);
  const time = clampTime(seconds, MIND_DIVE_DURATION);
  const phase = phaseAt(time);
  const scene = content.scenes.find((item) => item.id === phase.id);
  if (!scene) throw new Error(`Question content missing scene for phase: ${phase.id}`);
  const phaseProgress = smooth01((time - phase.start) / (phase.end - phase.start));
  const overall = time / MIND_DIVE_DURATION;
  const fallbackIsEgo = profile?.result?.fallbackMode === 'ego';
  const analysis = Number(profile?.result?.dimensions?.analysis ?? 50);
  const achievement = Number(profile?.result?.dimensions?.achievement ?? 50);
  const personalizedSubline = scene.personalizeWithProfile && profile?.copy?.blindSpot
    ? `${scene.subline} ${profile.copy.blindSpot}`
    : scene.subline;

  const threat = Math.round(Math.max(10, Math.min(96, 38 + (fallbackIsEgo ? 18 : 4) + 24 * Math.sin(Math.PI * Math.min(1, time / 18)))));
  const friction = Math.round(Math.max(8, Math.min(96, 82 - (time > 26 ? 48 * smooth01((time - 26) / 10) : 0))));
  const rewardBias = Math.round(Math.max(12, Math.min(96, 74 - (time > 26 ? 42 * smooth01((time - 26) / 10) : 0))));
  const observer = Math.round(Math.max(6, Math.min(98, 10 + (time > 21 ? 82 * smooth01((time - 21) / 12) : 0) + analysis * 0.03)));
  const agency = Math.round(Math.max(8, Math.min(98, 18 + (time > 26 ? 62 * smooth01((time - 26) / 10) : 0) + achievement * 0.04)));

  return {
    time,
    duration: MIND_DIVE_DURATION,
    phase: phase.id,
    phaseIndex: Math.max(0, content.scenes.findIndex((item) => item.id === phase.id)),
    phaseProgress,
    overallProgress: overall,
    activeNode: scene.activeNode,
    headline: scene.headline,
    subline: personalizedSubline,
    trace: [...scene.trace],
    metrics: { threat, friction, rewardBias, observer, agency },
    packetProgress: (time * 0.37) % 1,
    pulse: 0.5 + 0.5 * Math.sin(time * 2.7),
    cameraDepth: 1 + 0.035 * Math.sin(time * 0.45),
    oldLoopStrength: Math.round(100 * (1 - (time > 21 ? 0.68 * smooth01((time - 21) / 15) : 0))),
    newLoopStrength: Math.round(100 * (time > 26 ? smooth01((time - 26) / 10) : 0)),
    profileMode: profile?.highlightedMode ?? 'rational',
    modifier: profile?.sceneModifiers?.[0] ?? 'none',
    trainingPrompt: content.trainingPrompt
  };
}
