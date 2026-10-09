import { WHY_CANT_I_PERSIST } from '../../src/content/questions/why-cant-i-persist.mjs';
import { buildMindProfile } from '../../src/domain/profile.mjs';
import { getMindDiveState, MIND_DIVE_DURATION } from '../../src/mind-dive/state.mjs';
import { createPlaybackController } from '../../src/mind-dive/playback.mjs';
import { buildMindDiveViewModel } from '../../src/mind-dive/view-model.mjs';
import { getMindDiveVisualState } from '../../src/mind-dive/visual-state.mjs';
import { drawNeuralField } from '../../src/mind-dive/neural-field.mjs';
import { getNarrationCue } from '../../src/mind-dive/narration.mjs';
import { createNarrationPlayer } from '../../src/mind-dive/narration-player.mjs';
import { createAmbientEngine } from '../../src/mind-dive/ambience.mjs';

const params = new URLSearchParams(location.search);
const renderMode = params.get('render') === '1';
if (renderMode) document.body.classList.add('render-mode');

const defaultResult = {dominantMode:'rational',secondaryMode:'care',fallbackMode:'ego',dimensions:{safety:42,belonging:48,achievement:72,analysis:92,empathy:66,flexibility:70},modeScores:{survival:20,belonging:25,ego:50,rational:80,care:55,integration:35,transcendence:20}};
let result = defaultResult;
if (!renderMode) {
  try { result = JSON.parse(sessionStorage.getItem('consciousness-assessment-result')) || defaultResult; } catch { result = defaultResult; }
}
const profile = buildMindProfile(result);

const stage = document.querySelector('#stage');
const canvas = document.querySelector('#neural');
const ctx = canvas.getContext('2d');
const webglCanvas=document.querySelector('#brain-webgl');
const renderModeStatus=document.querySelector('#render-mode-status');
let brain3d=null;let brainRenderMode='loading';
const core = document.querySelector('#mind-core');
const aperture = document.querySelector('#neural-aperture');
const brainGate = document.querySelector('#brain-gate');
const anatomicalTexture = document.querySelector('#anatomical-texture');
const facialTexture = document.querySelector('#face-scan-texture');
const depthReadout = document.querySelector('#depth-readout');
const journeyCaption = document.querySelector('#journey-caption');
const graph = document.querySelector('#graph');
const packetLayer = document.querySelector('#packets');
const pathIds = ['p1','p2','p3','p4','p5','p6','p7'];
const paths = pathIds.map((id)=>document.querySelector(`#${id}`));
const phaseTimes = {trigger:1,interpretation:6,reward:11,'old-loop':16,observer:22,intervention:27,'new-loop':32};
const phaseOrder = Object.keys(phaseTimes);
const phaseNames = {trigger:'TRIGGER',interpretation:'INTERPRETATION',reward:'REWARD CONFLICT','old-loop':'OLD LOOP',observer:'OBSERVER',intervention:'INTERVENTION','new-loop':'NEW LOOP'};
let lastState = null;
const captionText = document.querySelector('#narration-text');

function setBar(name,value){document.querySelector(`#m-${name}`).style.width=`${value}%`;document.querySelector(`#v-${name}`).textContent=String(value).padStart(2,'0');}
function drawPackets(progress, activePhase) {
  packetLayer.replaceChildren();
  const phaseIndex=phaseOrder.indexOf(activePhase);
  paths.forEach((path,index)=>{
    const length=path.getTotalLength();
    const local=(progress+index*.17)%1;
    const p=path.getPointAtLength(length*local);
    const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('class','packet');circle.setAttribute('r',index<=phaseIndex?4:2.4);circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.style.opacity=index<=phaseIndex?'1':'.25';packetLayer.append(circle);
    const tail=document.createElementNS('http://www.w3.org/2000/svg','circle');const tp=path.getPointAtLength(length*Math.max(0,local-.035));tail.setAttribute('class','packet tail');tail.setAttribute('r','2');tail.setAttribute('cx',tp.x);tail.setAttribute('cy',tp.y);tail.style.opacity=index<=phaseIndex?'.55':'.12';packetLayer.append(tail);
  });
}
function renderAt(t){
  const state=getMindDiveState(t,profile,WHY_CANT_I_PERSIST); const vm=buildMindDiveViewModel(state);
  const visual=getMindDiveVisualState(state.time);
  lastState=state;
  document.querySelector('#time-label').textContent=vm.timeLabel;
  document.querySelector('#control-time').textContent=`00:${String(Math.floor(state.time)).padStart(2,'0')} / 00:${state.duration}`;
  document.querySelector('#scrubber').value=state.time;
  document.querySelector('#headline').textContent=vm.headline; document.querySelector('#subline').textContent=vm.subline;
  const activeNarration=getNarrationCue(state.time);
  if(captionText.textContent !== (activeNarration?.text??'')) captionText.textContent=activeNarration?.text??'';
  document.querySelector('#phase-kicker').textContent=`PHASE ${String(state.phaseIndex+1).padStart(2,'0')} / 07`;
  document.querySelector('#phase-name').textContent=phaseNames[state.phase];
  document.querySelector('#trace-lines').replaceChildren(...vm.traceLines.map((line)=>{const div=document.createElement('div');div.textContent=line;return div;}));
  document.querySelectorAll('.node').forEach((node)=>node.classList.toggle('active',node.dataset.node===vm.activeNode));
  document.querySelectorAll('#scene-map button').forEach((button)=>button.classList.toggle('active',Number(button.dataset.time)===phaseTimes[state.phase]));
  setBar('threat',vm.metrics.threat);setBar('friction',vm.metrics.friction);setBar('reward',vm.metrics.rewardBias);setBar('observer',vm.metrics.observer);setBar('agency',vm.metrics.agency);
  document.querySelector('#old-loop').textContent=`${vm.oldLoopStrength}%`;document.querySelector('#old-loop-bar').style.width=`${vm.oldLoopStrength}%`;
  document.querySelector('#new-loop').textContent=`${vm.newLoopStrength}%`;document.querySelector('#new-loop-bar').style.width=`${vm.newLoopStrength}%`;
  document.querySelector('#overall-progress').style.width=`${vm.overallProgress*100}%`;
  document.querySelector('#profile-mode').textContent=profile.highlightedMode.toUpperCase();
  document.querySelector('#scan').style.top=`${8+((state.time*9)%84)}%`;
  // DOM HUD and Canvas2D both use the same seek(t), including during MP4 export.
  stage.dataset.phase=state.phase;
  const c=visual.camera;
  core.style.transform='translateZ(0)';
  graph.style.opacity=String(state.time < 5 ? .06 : state.time < 21 ? .12 : .18 + .10*visual.cyanMix);
  graph.style.transform=`translate(${(-c.shiftX*.16).toFixed(2)}px,${(-c.shiftY*.13).toFixed(2)}px) scale(${(0.98+(c.zoom-1)*.05).toFixed(4)})`;
  aperture.style.transform=`translate(calc(-50% + ${c.shiftX.toFixed(2)}px),calc(-50% + ${c.shiftY.toFixed(2)}px)) scale(${(0.86+c.zoom*.14).toFixed(4)}) rotate(${c.roll.toFixed(4)}rad)`;
  aperture.style.opacity=(.24+.27*visual.lensPulse).toFixed(4);
  const portrait=matchMedia('(max-width:800px)').matches && !renderMode;
  if(brainRenderMode!=='3d')anatomicalTexture.style.opacity=((portrait?.37:.68) + .10*visual.cyanMix + .018*Math.sin(state.time*.95)).toFixed(4);
  if(brainRenderMode!=='3d')facialTexture.style.opacity=((portrait?.42:.78)+.09*visual.cyanMix+.016*Math.sin(state.time*.63)).toFixed(4);
  anatomicalTexture.style.setProperty('--brain-pan-x',`${(c.shiftX*.09).toFixed(2)}px`);
  anatomicalTexture.style.setProperty('--brain-pan-y',`${(c.shiftY*.07).toFixed(2)}px`);
  anatomicalTexture.style.setProperty('--brain-scale',(.98+.03*c.zoom).toFixed(4));
  facialTexture.style.setProperty('--face-pan-x',`${(c.shiftX*.08).toFixed(2)}px`);
  facialTexture.style.setProperty('--face-pan-y',`${(c.shiftY*.05).toFixed(2)}px`);
  facialTexture.style.setProperty('--face-scale',(.98+.020*c.zoom).toFixed(4));
  brainGate.style.opacity=Math.max(0,1-state.time/5.8).toFixed(4);
  brainGate.style.transform=`translate(-50%,-50%) scale(${(1+Math.min(1,state.time/5.8)*1.8).toFixed(4)})`;
  aperture.style.setProperty('--lens-color',visual.palette==='cyan'?'#5ee7ff':'#ff4fa5');
  depthReadout.textContent=`${visual.depthLabel} / ${c.speed.toFixed(2)}x`;
  journeyCaption.textContent=visual.title;
  document.querySelector('#fallback-mode').textContent=profile.result.fallbackMode.toUpperCase();
  if(brainRenderMode==='3d'&&brain3d)brain3d.render(state.time,visual);
  else drawNeuralField(ctx,{time:state.time,visual,width:canvas.width,height:canvas.height});
  drawPackets(vm.packetProgress,state.phase);
  return state;
}

const voiceStatus=document.querySelector('#voice-status');
const playButton=document.querySelector('#play');
const voiceButton=document.querySelector('#voice-toggle');
const musicSlider=document.querySelector('#music-volume');
const recordedAudio=renderMode?null:document.querySelector('#recorded-narration');
const recordedScore=renderMode?null:document.querySelector('#recorded-score');
let narrator;
const ambience=renderMode?createAmbientEngine({AudioContextCtor:null}):createAmbientEngine({recordedAudio:recordedScore});
if(recordedScore?.dataset.scoreSrc){
  recordedScore.addEventListener('loadedmetadata',()=>{
    ambience.setRecordedAvailable(Math.abs(recordedScore.duration-MIND_DIVE_DURATION)<.75);
  });
  recordedScore.addEventListener('error',()=>ambience.setRecordedAvailable(false));
  recordedScore.src=recordedScore.dataset.scoreSrc;
  recordedScore.load();
}
// Keeping animation time as the master clock makes captions and silent MP4 export deterministic.
const controller=createPlaybackController({duration:MIND_DIVE_DURATION,onFrame:(t)=>{
  const audioTime=narrator?.getAudioTime();
  if(audioTime!==null&&audioTime!==undefined&&Number.isFinite(audioTime)&&Math.abs(audioTime-t)>.14){
    controller.seek(audioTime);return;
  }
  renderAt(t);
  narrator?.tick(t);
  if(!renderMode)ambience.seek(t);
  if(t>=MIND_DIVE_DURATION&&playButton.textContent==='暂停')playButton.textContent='重播探索';
},reducedMotion:renderMode||matchMedia('(prefers-reduced-motion: reduce)').matches});
narrator=createNarrationPlayer({speech:renderMode?null:globalThis.speechSynthesis,createUtterance:(text)=>new SpeechSynthesisUtterance(text),getTime:()=>controller.getTime(),recordedAudio});
if(recordedAudio?.dataset.voiceSrc){
  recordedAudio.addEventListener('loadedmetadata',()=>{
    const ready=Math.abs(recordedAudio.duration-MIND_DIVE_DURATION)<.75;
    narrator.setRecordedAvailable(ready);
    if(ready)voiceStatus.textContent='专业中文男声已就绪，点击播放';
    else voiceStatus.textContent='专业配音时长不符，改用设备语音';
  });
  recordedAudio.addEventListener('error',()=>{narrator.setRecordedAvailable(false);voiceStatus.textContent='语音文件不可用，改用设备语音';});
  recordedAudio.src=recordedAudio.dataset.voiceSrc;
  recordedAudio.preload='metadata';
  recordedAudio.load();
}
musicSlider.addEventListener('input',()=>ambience.setVolume(Number(musicSlider.value)/100));
if(!narrator.available)voiceStatus.textContent='此浏览器不支持语音朗读；字幕仍可用';
function stopPlayback(){controller.pause();narrator.pause();ambience.pause();playButton.textContent='播放';}
function startPlayback(){
  if(controller.getTime()>=MIND_DIVE_DURATION)controller.seek(0);
  // A real click activates speech synthesis and WebAudio in browsers with autoplay restrictions.
  controller.play();
  if(voiceButton.getAttribute('aria-pressed')==='true'){
    narrator.playAt(controller.getTime());ambience.start(controller.getTime());
    voiceStatus.textContent=narrator.voiceMode==='recorded'?'专业男声 + 钢琴氛围配乐':narrator.available?'设备中文男声 + 钢琴氛围配乐':'仅钢琴配乐和字幕；本机无中文 TTS';
  }
  playButton.textContent='暂停';
}
playButton.addEventListener('click',()=>controller.isPlaying()?stopPlayback():startPlayback());
document.querySelector('#restart').addEventListener('click',()=>{stopPlayback();controller.seek(0);startPlayback();});
voiceButton.addEventListener('click',()=>{
  const enabled=voiceButton.getAttribute('aria-pressed')!=='true';
  voiceButton.setAttribute('aria-pressed',String(enabled));voiceButton.textContent=enabled?'声音：开':'声音：关';
  narrator.setMuted(!enabled);
  if(enabled&&controller.isPlaying())ambience.start(controller.getTime());else ambience.pause();
  voiceStatus.textContent=enabled?'已开启声音':'仅显示字幕';
});
document.querySelector('#scrubber').addEventListener('input',(e)=>{stopPlayback();controller.seek(Number(e.target.value));narrator.seek(controller.getTime());});
document.querySelectorAll('#scene-map button').forEach((button)=>button.addEventListener('click',()=>{stopPlayback();controller.seek(Number(button.dataset.time));narrator.seek(controller.getTime());}));

const waitlist=document.querySelector('#waitlist');
waitlist.addEventListener('submit',(event)=>{event.preventDefault();const value=document.querySelector('#contact').value.trim();const ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||/^\+?[\d\s-]{7,18}$/.test(value);const status=document.querySelector('#waitlist-status');if(!ok){status.textContent='请输入可识别的邮箱或手机号。';status.style.color='#ff7bbb';return;}sessionStorage.setItem('consciousness-waitlist-demo',value);status.textContent='已保存在当前浏览器会话中（演示版未上传服务器）。';status.style.color='#69e9c4';});

function getCheck(){const overflows=[];document.querySelectorAll('.check-text').forEach((el,index)=>{if(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2)overflows.push(`${el.id||el.className||'text'}:${index}`);});return{overflows,stage:{width:stage.clientWidth,height:stage.clientHeight}};}
function hashText(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
function getSignature(){
  const activeNodes=[...document.querySelectorAll('.node.active')].map((node)=>node.dataset.node);
  const widths=[...document.querySelectorAll('.metric-track i,.loop-track i,.progress-line i')].map((el)=>el.style.width);
  const domSignature=hashText(JSON.stringify({state:lastState,text:stage.innerText,activeNodes,widths,core:core.style.transform,graph:graph.style.transform,aperture:aperture.style.transform,scan:document.querySelector('#scan').style.top}));
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let h=2166136261;
  for(let i=0;i<pixels.length;i+=97){h^=pixels[i];h=Math.imul(h,16777619);}
  if(brainRenderMode==='3d'&&brain3d){
    const debug=brain3d.getDebugState();
    // GPU framebuffers can vary across redraws; rely on deterministic 3D scene inputs here.
    return `${domSignature}-${hashText(JSON.stringify(debug))}-${(h>>>0).toString(16)}`;
  }
  return `${domSignature}-${(h>>>0).toString(16)}`;
}
window.__CONSCIOUSNESS_OS__={ready:false,seek:(seconds)=>{controller.pause();narrator.pause();return renderAt(Number(seconds));},getDuration:()=>MIND_DIVE_DURATION,getCheck,getSignature,getRendererMode:()=>brainRenderMode,getRendererInfo:()=>brain3d?.getDebugState()??{mode:brainRenderMode},dispose:()=>brain3d?.destroy()};
const initial=Number(params.get('t')||0);controller.seek(initial);
// Audio cannot reliably autoplay. Playback starts only after a user gesture.

// Lazy WebGL layer. The licensed HRA GLB is required to claim 3D mode; a missing
// asset, GPU failure or context loss must visibly use the old 2D educational fallback.
function activateFallback(reason){
  brainRenderMode='fallback';brain3d?.destroy();brain3d=null;
  stage.classList.remove('brain-3d-active');stage.classList.add('brain-3d-fallback');
  renderModeStatus.textContent='简化模式 · 3D 加载失败';
  renderModeStatus.title=String(reason||'此设备无法显示实时 WebGL2');
  renderAt(controller.getTime());
  window.__CONSCIOUSNESS_OS__.ready=true;
}
window.addEventListener('consciousness-webgl-failed',e=>activateFallback(e.detail));
(async()=>{
  try{
    if(!webglCanvas?.getContext('webgl2'))throw Error('WebGL2 unsupported');
    // This separate bundle includes real pinned Three.js and GLTFLoader;
    // no runtime dependency on public CDNs or external model URLs.
    const {createBrainScene}=await import('./brain-scene.bundle.mjs');
    const isMobile=matchMedia('(max-width:800px)').matches&&!renderMode;
    const quality=isMobile?'mobile':'high';
    brain3d=await createBrainScene({canvas:webglCanvas,modelUrl:'./assets/models/hra-allen-brain-v1.4.glb',quality});
    brainRenderMode='3d';
    stage.classList.add('brain-3d-active');stage.classList.remove('brain-3d-fallback');
    renderModeStatus.textContent=`3D LIVE · HRA ATLAS / ${brain3d.model.meshCount} MESHES · 示意`;
    document.querySelector('#system-status').textContent='● REAL 3D / WebGL2';
    // Frame-aware resize: works for both 1280×720 film and portrait mobile.
    brain3d.resize(stage.clientWidth,stage.clientHeight);
    window.addEventListener('resize',()=>brain3d?.resize(stage.clientWidth,stage.clientHeight));
    renderAt(controller.getTime());
    window.__CONSCIOUSNESS_OS__.ready=true;
  }catch(error){activateFallback(error?.message||error);}
})();
