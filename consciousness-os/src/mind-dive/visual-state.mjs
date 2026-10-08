import { MIND_DIVE_DURATION, clampTime, smooth01 } from './timeline.mjs';

// Virtual camera: every value is calculated from the video time, not playback history.
// These shots trace an entry into the tunnel, a circuit lock, and a route rewrite.
export const CAMERA_SHOTS = Object.freeze([
  { t:0, zoom:0.92, shiftX:0, shiftY:4, roll:-0.08, speed:0.65, glow:0.48 },
  { t:5, zoom:1.50, shiftX:-32, shiftY:-14, roll:0.02, speed:1.06, glow:0.65 },
  { t:10, zoom:2.16, shiftX:28, shiftY:6, roll:0.14, speed:1.16, glow:0.74 },
  { t:15, zoom:2.70, shiftX:-26, shiftY:0, roll:0.23, speed:0.86, glow:0.92 },
  { t:21, zoom:3.06, shiftX:9, shiftY:10, roll:0.10, speed:0.34, glow:0.82 },
  { t:26, zoom:2.70, shiftX:22, shiftY:-18, roll:-0.11, speed:0.72, glow:0.86 },
  { t:31, zoom:2.08, shiftX:-12, shiftY:-10, roll:-0.03, speed:1.20, glow:1.00 },
  { t:36, zoom:1.24, shiftX:0, shiftY:0, roll:0.00, speed:0.48, glow:0.72 }
]);

function interpolateShots(time) {
  const index = CAMERA_SHOTS.findIndex((item) => time < item.t);
  const right = index < 0 ? CAMERA_SHOTS.at(-1) : CAMERA_SHOTS[index];
  const left = index <= 0 ? CAMERA_SHOTS[0] : CAMERA_SHOTS[index - 1];
  const fraction = right.t === left.t ? 0 : smooth01((time-left.t)/(right.t-left.t));
  return Object.fromEntries(Object.keys(left).filter((k)=>k!=='t').map((key) => [key,left[key] + (right[key]-left[key])*fraction]));
}

export function getMindDiveVisualState(seconds) {
  const time = clampTime(seconds,MIND_DIVE_DURATION);
  const camera=interpolateShots(time);
  // Not a measurement: these are art-directed signals for visual storytelling.
  const neuralRewire=smooth01((time-20)/10);
  return {
    time,
    camera,
    palette: time < 23 ? 'pink' : 'cyan',
    cyanMix: neuralRewire,
    signalDirection: time < 21 ? 'habit-loop' : 'rewrite',
    lensPulse: 0.5 + Math.sin(time*2.35)*0.5,
    title: time < 5 ? 'INITIALIZING / 进入意识层' : time < 21 ? 'TRACING / 追踪旧回路' : 'REWIRING / 正在构建新路径',
    depthLabel: `DEPTH ${Math.round(camera.zoom*100).toString().padStart(3,'0')}`
  };
}
