import { SCORE_EVENTS, getMusicGainAt } from './score.mjs';

/** Musical WebAudio score. All instruments are finite notes, not endless drone tones.
 * No network, audio model or commercial samples are required by the website. */
export function createAmbientEngine({AudioContextCtor=globalThis.AudioContext??globalThis.webkitAudioContext??null,recordedAudio=null}={}){
  let context=null,master=null,delay=null,active=[],playing=false,volume=.68,recordedAvailable=false,usingRecording=false;
  const available=Boolean(AudioContextCtor);
  const midiHz=midi=>440*Math.pow(2,(midi-69)/12);
  const paramSet=(param,value,at)=>{if(param?.setValueAtTime)param.setValueAtTime(value,at);else if(param)param.value=value;};
  const paramRamp=(param,value,at)=>{if(param?.linearRampToValueAtTime)param.linearRampToValueAtTime(value,at);else paramSet(param,value,at);};
  const paramTarget=(param,value,at,ramp)=>{if(param?.setTargetAtTime)param.setTargetAtTime(value,at,ramp);else paramSet(param,value,at);};
  function ensure(){
    if(context)return true;
    if(!available)return false;
    try{
      context=new AudioContextCtor();
      master=context.createGain();master.gain.value=0;master.connect(context.destination);
      if(context.createDelay){
        delay=context.createDelay(1);delay.delayTime.value=.285;
        const wet=context.createGain();wet.gain.value=.13;
        const echo=context.createGain();echo.gain.value=.16;
        delay.connect(wet);wet.connect(master);
        delay.connect(echo);echo.connect(delay);
      }
      return true;
    }catch{return false;}
  }
  function clear(){
    if(!context)return;
    for(const {osc,at} of active){
      try{osc.stop(Math.max(context.currentTime+.001,at+.005));}catch{}
      try{osc.disconnect?.();}catch{}
    }
    active=[];
  }
  function addNote(ev,offset){
    const now=context.currentTime+.06;
    const when=Math.max(now,now+ev.start-offset);
    const remaining=Math.min(ev.duration,ev.start+ev.duration-offset);
    if(remaining<=.08)return;
    const isPad=ev.instrument==='pad';
    const partials=isPad?[[1,'sine',.65,-4],[1.005,'sine',.28,4],[2,'sine',.08,0]]
      :[[1,'sine',.68,0],[2.003,'sine',.21,0],[3.99,'sine',.11,0]];
    const peak=(isPad?.014:.040)*ev.velocity;
    for(const [ratio,wave,weight,detune] of partials){
      const osc=context.createOscillator();osc.type=wave;
      osc.frequency.value=midiHz(ev.midi)*ratio;
      if(osc.detune)osc.detune.value=detune;
      const env=context.createGain();const g=env.gain;
      const end=when+Math.min(remaining,isPad?7:2.2);
      const voiceLevel=peak*weight;
      paramSet(g,.00001,when);
      if(isPad){
        paramRamp(g,voiceLevel,when+Math.min(.9,(end-when)*.30));
        paramTarget(g,voiceLevel*.68,when+Math.min(1.2,(end-when)*.40),.5);
        paramRamp(g,.00001,end-.025);
      }else{
        paramRamp(g,voiceLevel,when+.020);
        paramTarget(g,.00001,when+.045,.37);
        paramRamp(g,.00001,end-.025);
      }
      osc.connect(env);env.connect(master);
      if(delay && !isPad)env.connect(delay);
      osc.start(when);osc.stop?.(end);
      active.push({osc,at:when});
    }
  }
  return {
    available,
    get recordedAvailable(){return recordedAvailable;},
    setRecordedAvailable(value){recordedAvailable=Boolean(value&&recordedAudio);},
    get volume(){return volume;},
    setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));if(recordedAudio)recordedAudio.volume=volume;if(context&&playing)this.seek(this.time??0);},
    async start(seconds=0){
      const offset=Number.isFinite(Number(seconds))?Math.max(0,Math.min(36,Number(seconds))):0;
      if(recordedAvailable && recordedAudio){
        clear();usingRecording=true;playing=true;
        recordedAudio.volume=volume;recordedAudio.currentTime=offset;
        try{await recordedAudio.play();return;}catch{recordedAvailable=false;usingRecording=false;}
      }
      if(!ensure())return;
      usingRecording=false;clear();playing=true;
      if(context.resume)await context.resume();
      for(const ev of SCORE_EVENTS)if(ev.start+ev.duration>offset)addNote(ev,offset);
      this.seek(offset);
    },
    async pause(){playing=false;if(recordedAudio)recordedAudio.pause();usingRecording=false;clear();if(context?.suspend)await context.suspend();},
    seek(seconds){
      this.time=seconds;
      if(usingRecording&&recordedAudio&&Math.abs(recordedAudio.currentTime-seconds)>.14)recordedAudio.currentTime=seconds;
      if(context&&master&&!usingRecording){const level=(playing?1:0)*volume*getMusicGainAt(seconds);
        paramTarget(master.gain,level,context.currentTime,.08);
      }
    }
  };
}
