export const MIND_DIVE_DURATION = 36;
export const PHASES = Object.freeze([
  { id: 'trigger', start: 0, end: 5 },
  { id: 'interpretation', start: 5, end: 10 },
  { id: 'reward', start: 10, end: 15 },
  { id: 'old-loop', start: 15, end: 21 },
  { id: 'observer', start: 21, end: 26 },
  { id: 'intervention', start: 26, end: 31 },
  { id: 'new-loop', start: 31, end: 36 }
]);

export function clampTime(seconds, duration = MIND_DIVE_DURATION) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(duration, value));
}

export function phaseAt(seconds) {
  const t = clampTime(seconds);
  return PHASES.find((phase) => t >= phase.start && (t < phase.end || phase.end === MIND_DIVE_DURATION)) ?? PHASES.at(-1);
}

export function smooth01(value) {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
}
