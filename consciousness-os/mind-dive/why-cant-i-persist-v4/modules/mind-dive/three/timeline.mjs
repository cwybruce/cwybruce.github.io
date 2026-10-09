/** Immutable, reproducible cinema camera. Every field depends only on absolute seconds. */
export const SHOTS=Object.freeze([
 {time:0,radius:9.8,azimuth:1.15,elevation:0.16,look:[0,0,0],roll:-0.035},
 {time:5,radius:6.4,azimuth:1.38,elevation:0.22,look:[-0.12,0.12,0],roll:0.015},
 {time:10,radius:2.0,azimuth:1.88,elevation:0.16,look:[0.24,-0.05,0],roll:0.05},
 {time:15,radius:1.15,azimuth:2.5,elevation:0.05,look:[0.05,-0.1,0],roll:0.12},
 {time:21,radius:9.4,azimuth:4.45,elevation:0.08,look:[0,0.05,0],roll:0.0},
 {time:26,radius:9.8,azimuth:4.56,elevation:-0.03,look:[0,0.1,0],roll:-0.05},
 {time:31,radius:9.8,azimuth:4.72,elevation:0.07,look:[0,0,0],roll:-0.025},
 {time:36,radius:10.2,azimuth:4.92,elevation:0.13,look:[0,0,0],roll:0}
]);
export const PHASES=Object.freeze([
 {start:0,end:5,name:'trigger'},
 {start:5,end:10,name:'interpretation'},
 {start:10,end:15,name:'reward'},
 {start:15,end:21,name:'old-loop'},
 {start:21,end:26,name:'observer'},
 {start:26,end:31,name:'intervention'},
 {start:31,end:36.00001,name:'new-loop'}
]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=x=>x*x*(3-2*x);
const lerp=(a,b,f)=>a+(b-a)*f;
export function stageAt(seconds){
 const t=clamp(Number.isFinite(+seconds)?+seconds:0,0,36);
 const phase=PHASES.find(p=>t>=p.start&&t<p.end)??PHASES[PHASES.length-1];
 const cyanMix=ease(clamp((t-20)/12,0,1));
 return {name:phase.name,time:t,cyanMix,threat:1-cyanMix,agency:cyanMix};
}
export function cameraPoseAt(seconds){
 const t=clamp(Number.isFinite(+seconds)?+seconds:0,0,36);
 let i=0;while(i<SHOTS.length-2&&t>SHOTS[i+1].time)i++;
 const a=SHOTS[i],b=SHOTS[i+1],s=ease(clamp((t-a.time)/(b.time-a.time),0,1));
 const radius=lerp(a.radius,b.radius,s),azimuth=lerp(a.azimuth,b.azimuth,s),elevation=lerp(a.elevation,b.elevation,s);
 const position=[radius*Math.sin(azimuth)*Math.cos(elevation),radius*Math.sin(elevation),radius*Math.cos(azimuth)*Math.cos(elevation)];
 return {time:t,position,target:a.look.map((n,j)=>lerp(n,b.look[j],s)),radius,roll:lerp(a.roll,b.roll,s),phase:stageAt(t).name,cyanMix:stageAt(t).cyanMix};
}
