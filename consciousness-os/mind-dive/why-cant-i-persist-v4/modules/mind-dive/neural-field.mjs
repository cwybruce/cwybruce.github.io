import { drawAnatomicalBrain } from './anatomical-brain.mjs';
// A reproducible pseudo-3D neuron tunnel rendered entirely with Canvas2D.
// No WebGL or runtime randomness: the same time always reconstructs the same frame.

function hash(n) {
  const x=Math.sin(n*127.1+13.47)*43758.5453123;
  return x-Math.floor(x);
}
function loop(n,period) { return ((n%period)+period)%period; }
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}

export function buildNeuralFieldGeometry({time,visual,width=1280,height=720}) {
  const camera=visual.camera;
  const zoom=camera.zoom;
  const cx=width*.50+camera.shiftX;
  const cy=height*.462+camera.shiftY;
  const aspect=height/720;
  const travel=time*(.65+camera.speed*.65);
  const totalDepth=36;
  function project(depth,theta,factor=1) {
    const near=3.2;
    const size=2.55/(depth+near)*zoom;
    const swirl=theta+depth*.133+time*.06+camera.roll;
    return {
      x: cx + (480*size*factor)*Math.cos(swirl) + Math.sin(depth*.21+time*.2)*12,
      y: cy + (305*size*factor)*Math.sin(swirl)*aspect + Math.cos(depth*.12+time*.24)*10,
      size
    };
  }
  const rings=[];
  for(let i=0;i<30;i++) {
    const depth=loop(i*1.28+travel,totalDepth)+.5;
    const size=2.55/(depth+3.2)*zoom;
    rings.push({x:cx+Math.sin(depth*.21+time*.2)*12,y:cy+Math.cos(depth*.12+time*.24)*10,
      radiusX:480*size,radiusY:305*size*aspect,angle:camera.roll+depth*.024,
      alpha:clamp((.035 + (1-depth/totalDepth)*.29)*camera.glow,0,.75),depth});
  }
  // Each strand is a row of connected points wrapped around the tunnel wall.
  const threads=[];
  for(let strand=0;strand<14;strand++) {
    let previous=null;
    for(let step=0;step<27;step++) {
      const depth=1+step*1.22;
      const theta=(strand/14)*Math.PI*2+Math.sin(step*.11+strand*.72)*.16;
      const p=project(depth,theta, .94+hash(strand*14+step)*.11);
      if(previous) threads.push({x1:previous.x,y1:previous.y,x2:p.x,y2:p.y,
        alpha:clamp((.045 + .29*(1-depth/totalDepth))*camera.glow,0,.5),cyan:strand%4===0});
      previous=p;
    }
  }
  const particles=[];
  for(let i=0;i<610;i++) {
    const depth=.6+loop(hash(i+197)*totalDepth - travel*(.47+hash(i+6)*.32),totalDepth);
    const theta=hash(i+401)*Math.PI*2+Math.sin(i*.23+depth*.25)*.24;
    const wall=.58+hash(i+119)*.62;
    const p=project(depth,theta,wall);
    particles.push({x:p.x,y:p.y,radius:clamp((.55+hash(i+10)*1.4)*(.52+p.size*.95),.45,4.1),
      alpha:clamp((.06+hash(i+31)*.47)*(1-depth/totalDepth)*camera.glow,0,.87),cyan:i%7===0});
  }
  // Bright packets physically advance along active nerve strands toward the viewer.
  const pulses=[];
  for(let stream=0;stream<8;stream++){
    for(let j=0;j<4;j++){
      const depth=loop(34-j*7 - time*(1.8+camera.speed*.9)-stream*.88,totalDepth)+.5;
      const theta=(stream/8)*Math.PI*2 + .20*Math.sin(time*.3+stream);
      const p=project(depth,theta,.92);
      const tail=project(depth+.9,theta,.92);
      pulses.push({x:p.x,y:p.y,tailX:tail.x,tailY:tail.y,radius:clamp(2.1+p.size*3,1.5,10.5),alpha:clamp((.18+.85*(1-depth/totalDepth))*camera.glow,0,1),cyan:visual.cyanMix>.55 || stream%6===0});
    }
  }
  return {rings,threads,particles,pulses,center:{x:cx,y:cy},cyanMix:visual.cyanMix,lensPulse:visual.lensPulse};
}

export function drawNeuralField(ctx,{time,visual,width,height}){
  const {rings,threads,particles,pulses,center,cyanMix,lensPulse}=buildNeuralFieldGeometry({time,visual,width,height});
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#03050a';ctx.fillRect(0,0,width,height);
  const magenta=1-cyanMix;
  const bg=ctx.createRadialGradient(center.x,center.y,12,center.x,center.y,width*.54);
  bg.addColorStop(0,`rgba(${Math.round(60+50*cyanMix)},${Math.round(34+90*cyanMix)},${Math.round(100+50*cyanMix)},.23)`);
  bg.addColorStop(.30,`rgba(76,16,95,${.14*magenta+.07})`);
  bg.addColorStop(.7,'rgba(10,9,27,.13)');bg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
  const pink=`rgba(255,69,169,${.68*magenta+.1})`;
  const cyan=`rgba(94,232,255,${.72*cyanMix+.15})`;
  // Rear-to-front perspective rings.
  rings.sort((a,b)=>b.depth-a.depth);
  for(const r of rings){
    ctx.beginPath();ctx.ellipse(r.x,r.y,r.radiusX,r.radiusY,r.angle,0,Math.PI*2);
    ctx.strokeStyle=`rgba(${Math.round(192-89*cyanMix)},${Math.round(55+154*cyanMix)},${Math.round(189+48*cyanMix)},${r.alpha})`;
    ctx.lineWidth=.45+(1-r.depth/36)*1.65;ctx.stroke();
  }
  for(const seg of threads){
    ctx.beginPath();ctx.moveTo(seg.x1,seg.y1);ctx.lineTo(seg.x2,seg.y2);
    ctx.lineWidth=seg.cyan?1.0:.72;
    ctx.strokeStyle=seg.cyan?`rgba(94,231,255,${seg.alpha*.8})`:`rgba(${Math.round(222-60*cyanMix)},${Math.round(85+140*cyanMix)},${Math.round(210+22*cyanMix)},${seg.alpha})`;
    ctx.stroke();
  }
  for(const p of particles){
    ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
    ctx.fillStyle=p.cyan?`rgba(140,237,255,${p.alpha*.85})`:`rgba(255,${Math.round(130+90*cyanMix)},${Math.round(210+40*cyanMix)},${p.alpha})`;
    ctx.fill();
  }
  // Live anatomical cutaway remains present through the entire 36-second story.
  drawAnatomicalBrain(ctx,{time,visual,width,height});
  for(const p of pulses){
    const color=p.cyan?`rgba(94,235,255,${p.alpha})`:`rgba(255,81,187,${p.alpha})`;
    ctx.shadowBlur=20;ctx.shadowColor=color;
    ctx.beginPath();ctx.moveTo(p.tailX,p.tailY);ctx.lineTo(p.x,p.y);ctx.strokeStyle=color;ctx.lineWidth=p.radius*.85;ctx.stroke();
    ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  ctx.shadowBlur=0;
  // Central vanishing point marks the 'deep brain' target.
  const halo=ctx.createRadialGradient(center.x,center.y,0,center.x,center.y,70);
  halo.addColorStop(0,`rgba(220,234,255,${.13+.13*lensPulse})`);
  halo.addColorStop(.4,`rgba(255,76,177,${.10*magenta})`);
  halo.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=halo;ctx.fillRect(center.x-75,center.y-75,150,150);
  return {rings:rings.length,particles:particles.length,pulses:pulses.length};
}
