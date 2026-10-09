/** Deterministic V4 sci-fi HUD display. Pure time-driven: no randomized measurements. */
const ns='http://www.w3.org/2000/svg';
const palette=['#28dcf3','#698df2','#e952bb','#69c9f4','#fd5dd1'];
const zoneStages={pfc:['observer','intervention'],amygdala:['interpretation','old-loop'],striatum:['reward','old-loop'],parietal:['observer','new-loop'],hippocampus:['interpretation','observer'],insula:['trigger','intervention']};
const cached=new WeakMap();
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
export function getSignal(t,seed=0){
 const p=Number.isFinite(+t)?+t:0;
 return .48+.25*Math.sin(p*.43+seed*1.9)+.14*Math.sin(p*1.7+seed*2.7);
}
function makeWave(t,seed,width=100,height=14,samples=46){
 let d='';
 for(let k=0;k<=samples;k++){
  const u=k/samples;
  const x=u*width;
  const modulation=.36*Math.sin(40*u+seed*1.6+t*.39)+.20*Math.sin(116*u+seed*2.7+t*1.19)+.11*Math.sin(222*u+seed*2.3-t*.6);
  const envelope=.4+.6*(.5+.5*Math.sin(u*7.4+seed));
  const y=height*.5+modulation*height*envelope;
  d+=`${k?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)} `;
 }
 return d;
}
export function initializeV4Cockpit(root=document){
 const stage=root.querySelector('#stage');
 if(!stage||cached.has(stage))return;
 const stack=root.querySelector('#v4-slice-stack');
 if(stack){
  stack.replaceChildren();
  for(let i=0;i<7;i++){
   const slice=root.createElement('div');slice.className='v4-slice';slice.dataset.slice=String(i);
   slice.style.top=`${4+i*12.4}%`;
   const particle=root.createElement('i');slice.append(particle);stack.append(slice);
  }
 }
 const graph=root.querySelector('#v4-waves');
 if(graph){
  graph.replaceChildren();
  for(let i=0;i<5;i++){
   const path=root.createElementNS(ns,'path');path.dataset.frequency=String(i);
   path.setAttribute('stroke',palette[i]);path.setAttribute('stroke-width',i===4?'1.1':'1.2');
   path.setAttribute('opacity',i===4?'.9':'.65');graph.append(path);
  }
 }
 cached.set(stage,{lastTime:null});
}
export function updateV4Cockpit(root=document,{time=0,phase='trigger',observer=10,rewardBias=60,agency=8}={}){
 const stage=root.querySelector('#stage');if(!stage)return;
 initializeV4Cockpit(root);
 const t=clamp(Number(time)||0,0,36),stageIndex=Math.min(6,Math.floor(t/5.4));
 stage.style.setProperty('--v4-signal',String(getSignal(t,3)));
 root.querySelectorAll('#v4-slice-stack .v4-slice').forEach((node,i)=>node.classList.toggle('active',i===stageIndex));
 root.querySelectorAll('.v4-callout').forEach((node,i)=>{
  const isActive=(zoneStages[node.dataset.region]||[]).includes(phase);
  node.classList.toggle('is-active',isActive);
  node.style.setProperty('--v4-pulse',(0.65+getSignal(t,i)*.42).toFixed(4));
  const path=node.querySelector('svg path');
  if(path)path.setAttribute('d',makeWave(t,i+1));
 });
 root.querySelectorAll('#v4-waves path').forEach((path,i)=>{
   path.setAttribute('d',makeWave(t,i+10,222,108,112));
 });
 const needle=root.querySelector('#v4-wave-needle');
 if(needle)needle.setAttribute('d',`M${((t*6)%221).toFixed(2)} 0V108`);
 for(const [key,seed,base] of [['alpha',1,observer],['beta',2,rewardBias],['theta',3,agency],['gamma',4,observer+15],['sync',5,agency+24]]){
  const el=root.querySelector(`#v4-${key}`);if(el)el.textContent=clamp(base*.005 + getSignal(t,seed)*.52,.04,.99).toFixed(2);
 }
 root.querySelectorAll('#v4-log-status span').forEach((node,i)=>node.classList.toggle('active',i<=clamp(Math.floor(t/10),0,3)));
 return {time:t,phase,activeSlice:stageIndex,activeRegions:(zoneStages||{})};
}
