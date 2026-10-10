/** Deterministic V4 sci-fi HUD display. Pure time-driven: no randomized measurements. */
const ns='http://www.w3.org/2000/svg';
const palette=['#28dcf3','#698df2','#e952bb','#69c9f4','#fd5dd1'];
const zoneStages={pfc:['observer','intervention'],amygdala:['interpretation','old-loop'],striatum:['reward','old-loop'],parietal:['observer','new-loop'],hippocampus:['interpretation','observer'],insula:['trigger','intervention']};
const phaseOrder=['trigger','interpretation','reward','old-loop','observer','intervention','new-loop'];
const cached=new WeakMap();
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
export function getSignal(t,seed=0){
 const p=Number.isFinite(+t)?+t:0;
 return .48+.25*Math.sin(p*.43+seed*1.9)+.14*Math.sin(p*1.7+seed*2.7);
}
function makeWave(t,seed,width=100,height=14,samples=92){
 let d='';
 for(let k=0;k<=samples;k++){
  const u=k/samples;
  const x=u*width;
  const frequency=seed>=10?[2.2,5.2,1.5,8.5,1][(seed-10)%5]:5.8;
  const modulation=.20*Math.sin(6.2831853*frequency*u+seed*1.6+t*.39)+.13*Math.sin(6.2831853*(frequency*3.7)*u+seed*2.7+t*1.19)+.07*Math.sin(6.2831853*(frequency*6.3)*u+seed+t*.8);
  const envelope=.4+.6*(.5+.5*Math.sin(u*7.4+seed));
  const y=height*.5+modulation*height*envelope;
  d+=`${k?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)} `;
 }
 return d;
}
export function initializeV4Cockpit(root=document){
 const stage=root.querySelector('#stage');
 if(!stage||cached.has(stage))return;
 const orbit=root.createElementNS(ns,'svg');orbit.id='v4-orbital-scan';orbit.setAttribute('viewBox','0 0 1000 562.5');orbit.setAttribute('preserveAspectRatio','none');orbit.setAttribute('aria-hidden','true');
 const rings=root.createElementNS(ns,'g');rings.id='v4-orbital-rings';orbit.append(rings);
 for(let i=0;i<8;i++){const circle=root.createElementNS(ns,'circle');circle.setAttribute('r',String(190+i*18));circle.setAttribute('fill','none');circle.setAttribute('stroke',i%3===0?'#df4faa':'#249cc6');circle.setAttribute('stroke-dasharray',`${78+i*9} ${12+i*7}`);rings.append(circle);}
 for(let i=0;i<72;i++){const angle=i*Math.PI/36,r=274,x=Math.cos(angle),y=Math.sin(angle),path=root.createElementNS(ns,'path');path.setAttribute('d',`M${x*r} ${y*r}L${x*(r+(i%6?3:9))} ${y*(r+(i%6?3:9))}`);rings.append(path);if(i%6===0){const dot=root.createElementNS(ns,'circle');dot.setAttribute('cx',String(x*292));dot.setAttribute('cy',String(y*292));dot.setAttribute('r','1.8');dot.setAttribute('class','orbit-dot');rings.append(dot);}}
 for(const [label,angle]of [['PFC',-1.92],['HPC',-.43],['STR',2.64],['INS',.35],['THA',1.18]]){const text=root.createElementNS(ns,'text');text.textContent=label;text.setAttribute('x',String(Math.cos(angle)*277));text.setAttribute('y',String(Math.sin(angle)*277));rings.append(text);}
 stage.append(orbit);
 for(const frame of root.querySelectorAll('.v4-hud-frame')){
  const outline=root.createElementNS(ns,'svg');outline.setAttribute('class','v4-frame-outline');outline.setAttribute('aria-hidden','true');outline.setAttribute('preserveAspectRatio','none');
  const path=root.createElementNS(ns,'path');path.setAttribute('vector-effect','non-scaling-stroke');outline.append(path);frame.append(outline);
 }
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
 const leaders=root.createElementNS(ns,'svg');leaders.id='v4-region-leaders';leaders.setAttribute('aria-hidden','true');leaders.setAttribute('preserveAspectRatio','none');
 for(const node of root.querySelectorAll('.v4-callout')){const group=root.createElementNS(ns,'g');group.dataset.region=node.dataset.region;const path=root.createElementNS(ns,'path'),circle=root.createElementNS(ns,'circle');circle.setAttribute('r','5');group.append(path,circle);leaders.append(group);}
 stage.append(leaders);
 cached.set(stage,{lastTime:null});
}
export function updateV4Cockpit(root=document,{time=0,phase='trigger',observer=10,rewardBias=60,agency=8,projectedRegions=null}={}){
 const stage=root.querySelector('#stage');if(!stage)return;
 initializeV4Cockpit(root);
 const t=clamp(Number(time)||0,0,36),stageIndex=Math.max(0,phaseOrder.indexOf(phase));
 const frameKey=`${stage.clientWidth}:${stage.clientHeight}:${root.querySelector('.mobile-hud')?.open}`;
 const frameState=cached.get(stage);
 if(frameState.frameKey!==frameKey)for(const outline of root.querySelectorAll('.v4-frame-outline')){
  const {width:w,height:h}=outline.parentElement.getBoundingClientRect();if(w<=0||h<=0)continue;
  const c=Math.min(9,w*.025,h*.10);outline.setAttribute('viewBox',`0 0 ${w} ${h}`);
  outline.querySelector('path').setAttribute('d',`M${c} 1H${w-c}L${w-1} ${c}V${h-c}L${w-c} ${h-1}H${c}L1 ${h-c}V${c}Z`);
 }
 frameState.frameKey=frameKey;
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
 root.querySelector('#v4-orbital-rings')?.setAttribute('transform',`translate(540 265) rotate(${(t*.12).toFixed(3)})`);
 if(needle)needle.setAttribute('d',`M${((t*6)%221).toFixed(2)} 0V108`);
 for(const [key,seed,base] of [['alpha',1,observer],['beta',2,rewardBias],['theta',3,agency],['gamma',4,observer+15],['sync',5,agency+24]]){
  const el=root.querySelector(`#v4-${key}`);if(el)el.textContent=clamp(base*.005 + getSignal(t,seed)*.52,.04,.99).toFixed(2);
 }
 root.querySelectorAll('#v4-log-status span').forEach((node,i)=>node.classList.toggle('active',i<=clamp(Math.floor(t/10),0,3)));
 const leaders=root.querySelector('#v4-region-leaders');
 if(leaders){
  stage.classList.toggle('tracked-regions',Boolean(projectedRegions));
  leaders.style.display=projectedRegions?'':'none';
  const rect=stage.getBoundingClientRect();leaders.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
  const cards=[...root.querySelectorAll('.v4-callout')].map(card=>({card,box:card.getBoundingClientRect()}));
  for(const {card,box}of cards){const key=card.dataset.region,point=projectedRegions?.[key],group=leaders.querySelector(`[data-region="${key}"]`);if(!group)continue;
   group.style.display=point?.visible?'':'none';if(!point?.visible)continue;
   const left=['pfc','amygdala','striatum'].includes(key),color=['parietal','insula'].includes(key)?'#39eaff':'#ff58bf';
   const x=point.x*rect.width,y=point.y*rect.height,sx=(left?box.right:box.left)-rect.left,sy=box.top-rect.top+box.height*.42;
   group.style.color=color;group.querySelector('path').setAttribute('d',`M${sx.toFixed(2)},${sy.toFixed(2)} L${x.toFixed(2)},${y.toFixed(2)}`);
   group.querySelector('circle').setAttribute('cx',x.toFixed(2));group.querySelector('circle').setAttribute('cy',y.toFixed(2));card.style.setProperty('--region-color',color);
  }
 }
 return {time:t,phase,activeSlice:stageIndex,activeRegions:(zoneStages||{})};
}
