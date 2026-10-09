/**
 * Procedural neuroanatomy illustration for Mind Dive. All activation is an
 * illustrative narrative signal, not MRI, EEG, or medical inference.
 * Geometry is derived only from absolute time; there are no timers, random
 * side effects, network dependencies, or bitmap backgrounds.
 */
const BRAIN_TAU=Math.PI*2;
const brainClamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
function brainHash(n){const v=Math.sin(n*127.131+87.17)*43758.5453;return v-Math.floor(v);}
function brainSmooth(t){const s=brainClamp(t);return s*s*(3-2*s);}
function brainRgba(r,g,b,a){return `rgba(${r},${g},${b},${brainClamp(a).toFixed(4)})`;}

const ANATOMY = Object.freeze([
  {id:'prefrontal',label:'PREFRONTAL',x:305,y:144,size:24,offsetX:30,offsetY:-46},
  {id:'parietal',label:'PARIETAL',x:214,y:98,size:19,offsetX:38,offsetY:-47},
  {id:'amygdala',label:'AMYGDALA',x:254,y:226,size:19,offsetX:31,offsetY:37},
  {id:'hippocampus',label:'HIPPOCAMPUS',x:211,y:225,size:23,offsetX:-104,offsetY:35},
  {id:'striatum',label:'STRIATUM',x:228,y:176,size:24,offsetX:-110,offsetY:-7},
  {id:'insula',label:'INSULA',x:283,y:194,size:17,offsetX:46,offsetY:17},
  {id:'cerebellum',label:'CEREBELLUM',x:154,y:261,size:23,offsetX:-107,offsetY:58}
]);

export function getBrainActivationProfile(rawTime){
  const time=brainClamp(Number(rawTime)||0,0,36);
  const transition=brainSmooth((time-20)/11);
  const onset=brainSmooth(time/4);
  return {
    prefrontal: .26+.66*transition+.05*Math.sin(time*.63),
    parietal:.37+.23*transition,
    amygdala:.50+.38*onset*(1-transition),
    hippocampus:.42+.19*transition,
    striatum:.76-.47*transition,
    insula:.46+.17*transition,
    cerebellum:.33+.18*transition
  };
}

/** Screen-independent 400x440 anatomical coordinates; scales by viewport. */
export function buildAnatomicalBrainGeometry({time=0,visual={},width=1280,height=720}={}){
  const t=brainClamp(Number(time)||0,0,36);
  const camera=visual.camera||{};
  const scale=(height/720)*(1.27 + .054*(Number(camera.zoom)||1));
  const ox=width*.305+(Number(camera.shiftX)||0)*.20;
  const oy=height*.082+(Number(camera.shiftY)||0)*.12;
  const cyanMix=brainClamp(Number(visual.cyanMix)||0);
  const phase=getBrainActivationProfile(t);
  const regions=ANATOMY.map(r=>({...r,activation:brainClamp(phase[r.id]),pulse:.75+.25*Math.sin(t*(1.4+brainHash(r.x)*2)+r.y)}));
  const folds=[];
  // Short wandering curved ridges, clipped to cortex during rendering.
  for(let i=0;i<158;i++){
    const vertical=i%3===0;
    const x=105+brainHash(i*2+91)*235;
    const y=71+brainHash(i*2+92)*179;
    const dx=(vertical?6:20)+brainHash(i+247)*(vertical?15:31);
    const dy=(vertical?15:2)+brainHash(i+251)*(vertical?24:12);
    const bend=(brainHash(i+478)-.5)*25;
    folds.push({x,y,dx,dy,bend,alpha:.13+brainHash(i+326)*.38,depth:brainHash(i+179)});
  }
  const gyri=[];
  // Overlapping small volumes form ridges with real shaded depth.
  for(let i=0;i<164;i++){
    const angle=brainHash(i+2234)*BRAIN_TAU;
    const radius=Math.sqrt(brainHash(i+1423))*.98;
    const x=224+108*radius*Math.cos(angle);
    const y=148+75*radius*Math.sin(angle);
    gyri.push({x,y,rx:6+brainHash(i+371)*12,ry:5+brainHash(i+731)*10,
      angle:(brainHash(i+517)-.5)*1.6,bright:.35+brainHash(i+803)*.6,seed:brainHash(i+2003)});
  }
  const axons=[];
  const hubs=[[227,187],[269,186],[197,218],[266,233],[173,180]];
  for(let i=0;i<440;i++){
    const k=i%hubs.length;
    const hub=hubs[k];
    const angle=brainHash(i+19)*BRAIN_TAU;
    const rad=Math.sqrt(brainHash(i*3+71));
    const x=223+112*rad*Math.cos(angle);
    const y=153+83*rad*Math.sin(angle);
    const twist=(brainHash(i+317)-.5)*48;
    axons.push({x1:hub[0],y1:hub[1],x2:x,y2:y,bend:twist,alpha:.035+brainHash(i+599)*.16,width:.30+brainHash(i+743)*.68,cyan:brainHash(i+833)>.72,seed:brainHash(i+739)});
  }
  const synapses=[];
  for(let i=0;i<258;i++){
    const theta=brainHash(i+481)*BRAIN_TAU;
    const radius=Math.sqrt(brainHash(i+1403));
    const x=226+112*radius*Math.cos(theta)+Math.sin(t*(.42+brainHash(i+80)*.5)+i)*.30;
    const y=151+83*radius*Math.sin(theta)+Math.cos(t*(.49+brainHash(i+45)*.3)+i)*.26;
    const pulse=.5+.5*Math.sin(t*(.8+brainHash(i+310)*2)+i*3.19);
    synapses.push({x,y,radius:.5+brainHash(i+360)*1.23+Math.pow(pulse,9)*1.2,alpha:.17+brainHash(i+477)*.3+pulse*.26,cyan:brainHash(i+109)>.66||cyanMix>.82,seed:brainHash(i+902)});
  }
  return {time:t,ox,oy,scale,cyanMix,regions,gyri,folds,axons,synapses};
}

function skullPath(ctx){
  ctx.beginPath();
  ctx.moveTo(164,30);
  ctx.bezierCurveTo(104,45,66,99,60,159);
  ctx.bezierCurveTo(43,225,73,275,115,305);
  ctx.bezierCurveTo(124,330,118,372,120,413);
  ctx.bezierCurveTo(154,426,224,429,258,410);
  ctx.lineTo(263,351);
  ctx.bezierCurveTo(271,314,307,303,328,285);
  ctx.bezierCurveTo(348,270,356,254,358,229);
  ctx.lineTo(386,225);
  ctx.quadraticCurveTo(399,221,386,199);
  ctx.lineTo(356,166);
  ctx.bezierCurveTo(363,112,331,63,289,43);
  ctx.bezierCurveTo(250,19,195,17,164,30);
  ctx.closePath();
}
function brainPath(ctx){
  ctx.beginPath();
  ctx.moveTo(123,152);
  ctx.bezierCurveTo(111,110,150,70,205,65);
  ctx.bezierCurveTo(239,43,293,75,320,105);
  ctx.bezierCurveTo(338,131,344,163,327,182);
  ctx.bezierCurveTo(311,211,286,221,267,220);
  ctx.bezierCurveTo(233,244,207,236,171,227);
  ctx.bezierCurveTo(132,224,111,199,116,174);
  ctx.quadraticCurveTo(117,161,123,152);
  ctx.closePath();
}
function brainGlow(ctx,x,y,r,color){
  const gr=ctx.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,color);gr.addColorStop(.22,color.replace(/, ?[\d.]+\)$/,', 0.18)'));
  gr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,BRAIN_TAU);ctx.fill();
}
function haloRings(ctx,t,cyanMix){
  ctx.save();
  ctx.strokeStyle=brainRgba(71,173,233,.17);ctx.lineWidth=.5;
  ctx.setLineDash([3,12]);
  for(let i=0;i<4;i++){
    ctx.beginPath();ctx.ellipse(221,183,184+i*26,145+i*20,-.11,.03,BRAIN_TAU*.96);ctx.stroke();
  }
  ctx.setLineDash([]);
  const angle=t*.035;
  for(let i=0;i<46;i++){
    const theta=i*BRAIN_TAU/46+angle;
    const x=221+185*Math.cos(theta),y=183+148*Math.sin(theta);
    ctx.beginPath();ctx.arc(x,y,.7+(i%7===0?1.3:0),0,BRAIN_TAU);
    ctx.fillStyle=brainRgba(85+160*cyanMix,129+90*cyanMix,245,.15+(i%7===0?.29:0));ctx.fill();
  }
  ctx.restore();
}

/** Pixel art from primitive paths, lighting, fibers and animation; no pre-rendered brain image. */
export function drawAnatomicalBrain(ctx,{time=0,visual={},width=1280,height=720}={}){
  const geo=buildAnatomicalBrainGeometry({time,visual,width,height});
  const {ox,oy,scale,cyanMix,regions,gyri,folds,axons,synapses}=geo;
  const pink=1-cyanMix;
  ctx.save();
  ctx.translate(ox,oy);
  ctx.scale(scale,scale);
  ctx.globalCompositeOperation='screen';

  haloRings(ctx,geo.time,cyanMix);
  // Frosted translucent head volume gives neural structures physical containment.
  skullPath(ctx);
  const headFill=ctx.createLinearGradient(90,90,376,305);
  headFill.addColorStop(0,'rgba(12,42,77,.25)');headFill.addColorStop(.55,'rgba(7,27,56,.26)');headFill.addColorStop(1,'rgba(58,112,166,.16)');
  ctx.fillStyle=headFill;ctx.fill();
  ctx.save();skullPath(ctx);ctx.clip();
  const aura=ctx.createRadialGradient(215,159,22,215,159,238);
  aura.addColorStop(0,brainRgba(57,96,204,.14));aura.addColorStop(.55,brainRgba(30,114,221,.10));aura.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=aura;ctx.fillRect(45,15,360,435);
  ctx.restore();

  // Cortex anatomical envelope with layered light scattering.
  brainPath(ctx);
  const corticalFill=ctx.createRadialGradient(246,126,9,216,150,184);
  corticalFill.addColorStop(0,brainRgba(154,190,255,.53));
  corticalFill.addColorStop(.33,brainRgba(88,111,216,.29));
  corticalFill.addColorStop(.78,brainRgba(28,64,126,.20));
  corticalFill.addColorStop(1,brainRgba(18,30,69,.08));
  ctx.fillStyle=corticalFill;ctx.fill();
  ctx.save();brainPath(ctx);ctx.clip();
  ctx.globalCompositeOperation='screen';
  // Rounded translucent cortex ridges with a shaded valley and a light-facing crest.
  // Together the lobules, valleys, sulci and fibers behave as a relief map.
  for(const g of gyri){
    const r=Math.max(g.rx,g.ry)*1.22;
    const lighting=ctx.createRadialGradient(g.x-g.rx*.37,g.y-g.ry*.36,0,g.x,g.y,r);
    lighting.addColorStop(0,brainRgba(188,210+37*cyanMix,255,.23*g.bright));
    lighting.addColorStop(.44,brainRgba(97+54*cyanMix,134+55*cyanMix,233,.25*g.bright));
    lighting.addColorStop(.84,brainRgba(28,46,113,.22*g.bright));
    lighting.addColorStop(1,brainRgba(4,6,35,.02));
    ctx.beginPath();ctx.ellipse(g.x,g.y,g.rx,g.ry,g.angle,0,BRAIN_TAU);
    ctx.fillStyle=lighting;ctx.fill();
    ctx.beginPath();ctx.ellipse(g.x,g.y,g.rx,g.ry,g.angle,Math.PI*.95,Math.PI*1.95);
    ctx.lineWidth=.75;ctx.strokeStyle=brainRgba(203,217,255,.30*g.bright);ctx.stroke();
  }
  // Dark trough under each pale crest is crucial for cortical folding relief.
  for(const fold of folds){
    const {x,y,dx,dy,bend,alpha,depth}=fold;
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+dx*.3,y+dy*.08+bend,x+dx*.62,y+dy*.82-bend,x+dx,y+dy);
    ctx.globalCompositeOperation='source-over';
    ctx.lineWidth=1.45+depth*.75;
    ctx.strokeStyle=brainRgba(2,10,36,Math.min(.74,alpha+.22));ctx.stroke();
    ctx.globalCompositeOperation='screen';
    ctx.beginPath();ctx.moveTo(x-1,y-1.2);
    ctx.bezierCurveTo(x+dx*.3-1,y+dy*.08+bend-1,x+dx*.62-1,y+dy*.82-bend-1,x+dx-1,y+dy-1);
    ctx.lineWidth=.72+depth*.65;
    ctx.strokeStyle=brainRgba(173+50*cyanMix,178+58*cyanMix,255,alpha*1.28);ctx.stroke();
  }
  // Axons are directed and layered by their hub (reward vs executive systems).
  ctx.lineCap='round';
  for(const [i,f] of axons.entries()){
    const intensity=.5+.5*Math.sin(geo.time*(.9+f.seed)+i*.27);
    const alpha=f.alpha*(1.05+.6*intensity);
    ctx.beginPath();ctx.moveTo(f.x1,f.y1);
    ctx.bezierCurveTo(f.x1+f.bend*.45,f.y1-36,f.x2-f.bend*.55,f.y2+f.bend*.27,f.x2,f.y2);
    ctx.lineWidth=f.width;
    ctx.strokeStyle=f.cyan||cyanMix>.77?brainRgba(70,205,255,alpha*1.25):brainRgba(250,89+96*cyanMix,215+26*cyanMix,alpha);
    ctx.stroke();
  }
  for(const p of synapses){
    ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,BRAIN_TAU);
    ctx.fillStyle=p.cyan?brainRgba(114,227,255,p.alpha*1.26):brainRgba(255,129,215,p.alpha*1.20);
    ctx.fill();
  }
  ctx.restore();

  // Cerebellum, brain stem and deeper structures are distinct anatomy layers.
  ctx.save();
  ctx.beginPath();ctx.ellipse(153,254,59,43,-.20,0,BRAIN_TAU);
  ctx.fillStyle=brainRgba(37,98,175,.30);ctx.fill();
  ctx.strokeStyle=brainRgba(147,204,255,.55);ctx.lineWidth=1.5;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.ellipse(153,254,58,42,-.2,0,BRAIN_TAU);ctx.clip();
  for(let i=0;i<30;i++){
    const yy=221+i*2.4;
    ctx.beginPath();ctx.moveTo(89,yy+Math.sin(i*.7)*4);
    ctx.bezierCurveTo(119,yy-11,160,yy+8,219,yy+Math.sin(i*.4)*9);
    ctx.strokeStyle=brainRgba(90+100*cyanMix,170,245,.14+(i%4)*.035);ctx.lineWidth=.6;ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();ctx.moveTo(207,227);ctx.bezierCurveTo(228,255,224,293,219,334);ctx.bezierCurveTo(212,351,211,380,220,413);
  ctx.lineWidth=16;ctx.strokeStyle=brainRgba(28,91,160,.32);ctx.stroke();
  ctx.lineWidth=3;ctx.strokeStyle=brainRgba(119,205,250,.45);ctx.stroke();
  ctx.beginPath();ctx.ellipse(260,180,45,25,-.18,0,BRAIN_TAU);
  ctx.fillStyle=brainRgba(106,66,172,.16);ctx.fill();ctx.strokeStyle=brainRgba(194,150,255,.26);ctx.stroke();
  ctx.beginPath();ctx.moveTo(231,210);ctx.bezierCurveTo(249,227,282,229,300,215);
  ctx.strokeStyle=brainRgba(240,163,255,.62);ctx.lineWidth=3;ctx.stroke();
  ctx.restore();

  // Active-region brainGlow and moving metabolic signals. This is narration art.
  for(const region of regions){
    const activation=region.activation*(.72+.28*region.pulse);
    const r=region.size*(1.75+.35*Math.sin(geo.time*1.55+region.y*.1));
    const color=geo.time>=21&&region.id==='prefrontal'?brainRgba(69,233,255,activation*.49):brainRgba(249,81+120*cyanMix,214+28*cyanMix,activation*.45);
    brainGlow(ctx,region.x,region.y,r,color);
    ctx.beginPath();ctx.arc(region.x,region.y,2.2+activation*3.3,0,BRAIN_TAU);
    ctx.fillStyle=brainRgba(198+53*cyanMix,181+58*cyanMix,255,activation*.95);ctx.fill();
    ctx.beginPath();ctx.arc(region.x,region.y,6+activation*5,0,BRAIN_TAU);
    ctx.lineWidth=.65;ctx.strokeStyle=brainRgba(144+92*cyanMix,177,255,activation*.45);ctx.stroke();
  }
  // Traveling luminous impulses between limbic and executive hubs.
  const linked=[[2,4],[4,0],[0,1],[3,5],[2,3],[4,6],[1,0]];
  linked.forEach(([ia,ib],i)=>{
    const a=regions[ia],b=regions[ib];
    const f=((geo.time*(.18+i*.011)+i*.19)%1+1)%1;
    const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f-10*Math.sin(Math.PI*f);
    const tint=geo.time>=21&&i%2===0?brainRgba(89,239,255,.68):brainRgba(255,116,217,.68);
    brainGlow(ctx,x,y,5,tint);
    ctx.beginPath();ctx.arc(x,y,1.5,0,BRAIN_TAU);ctx.fillStyle=tint;ctx.fill();
  });

  // Forehead, nose, lips, jawline and skull rim remain visible over the scan.
  ctx.save();
  ctx.shadowColor=brainRgba(106,186,255,.6);ctx.shadowBlur=14;
  skullPath(ctx);ctx.strokeStyle=brainRgba(134,213,255,.70);ctx.lineWidth=1.5;ctx.stroke();
  ctx.shadowBlur=0;
  ctx.beginPath();ctx.moveTo(306,263);ctx.bezierCurveTo(320,260,347,250,355,224);ctx.strokeStyle=brainRgba(129,185,239,.20);ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.moveTo(331,187);ctx.quadraticCurveTo(345,190,353,188);
  ctx.strokeStyle=brainRgba(160,227,255,.5);ctx.lineWidth=1.2;ctx.stroke();
  ctx.beginPath();ctx.arc(335,195,2.4,0,BRAIN_TAU);ctx.fillStyle=brainRgba(148,219,255,.55);ctx.fill();
  ctx.beginPath();ctx.moveTo(380,232);ctx.quadraticCurveTo(357,244,354,242);ctx.strokeStyle=brainRgba(116,201,255,.32);ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.ellipse(118,226,12,22,-.18,0,BRAIN_TAU);ctx.strokeStyle=brainRgba(92,184,234,.38);ctx.stroke();
  ctx.beginPath();ctx.moveTo(132,301);ctx.bezierCurveTo(153,327,166,355,165,410);ctx.moveTo(242,350);ctx.bezierCurveTo(226,375,231,393,240,418);
  ctx.strokeStyle=brainRgba(77,165,222,.32);ctx.lineWidth=1;ctx.stroke();
  ctx.restore();

  // Compact expert HUD callouts are real canvas elements, not raster text.
  for(const r of regions){
    if(r.id==='parietal'||r.id==='insula')continue;
    const lx=r.x+r.offsetX,ly=r.y+r.offsetY;
    ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo((r.x+lx)*.5,(r.y+ly)*.5);ctx.lineTo(lx,ly);
    ctx.strokeStyle=brainRgba(108+110*cyanMix,168,249,.44);ctx.lineWidth=.75;ctx.stroke();
    ctx.font='8px monospace';ctx.textAlign=lx>r.x?'left':'right';
    ctx.fillStyle=brainRgba(157,211,250,.80);ctx.fillText(r.label,lx+(lx>r.x?3:-3),ly-3);
  }
  ctx.restore();
  return {gyri:gyri.length,folds:folds.length,axons:axons.length,synapses:synapses.length,regions:regions.length};
}
