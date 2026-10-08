export function createPlaybackController({
  duration,
  onFrame,
  requestFrame = globalThis.requestAnimationFrame?.bind(globalThis) ?? (() => 0),
  cancelFrame = globalThis.cancelAnimationFrame?.bind(globalThis) ?? (() => {}),
  now = () => globalThis.performance?.now?.() ?? Date.now(),
  reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}) {
  let time = 0;
  let playing = false;
  let raf = 0;
  let previous = 0;
  const clamp = (value) => Math.max(0, Math.min(duration, Number.isFinite(Number(value)) ? Number(value) : 0));
  const emit = () => onFrame(time);
  const tick = (stamp) => {
    if (!playing) return;
    if (!previous) previous = stamp || now();
    const current = stamp || now();
    const delta = Math.max(0, (current - previous) / 1000);
    previous = current;
    time = clamp(time + delta);
    emit();
    if (time >= duration) { playing = false; previous = 0; return; }
    raf = requestFrame(tick);
  };
  const api = {
    play() { if (playing || time >= duration) return; playing = true; previous = 0; raf = requestFrame(tick); },
    pause() { playing = false; previous = 0; cancelFrame(raf); },
    restart() { api.pause(); time = 0; emit(); if (!reducedMotion) api.play(); },
    seek(value) { time = clamp(value); previous = 0; emit(); },
    getTime() { return time; },
    isPlaying() { return playing; }
  };
  emit();
  return api;
}
