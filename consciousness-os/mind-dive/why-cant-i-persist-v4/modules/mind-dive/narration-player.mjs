import { getNarrationCue } from './narration.mjs';

/** Optional professionally produced audio is preferred; otherwise use system TTS. */
export function createNarrationPlayer({speech,createUtterance,getTime=()=>0,recordedAudio=null}={}){
  let playing=false, muted=false, currentCue=null, recordedAvailable=false, currentMode='none';
  const availableSpeech=Boolean(speech&&typeof speech.speak==='function'&&typeof speech.cancel==='function'&&typeof createUtterance==='function');
  const available=availableSpeech||Boolean(recordedAudio);
  function bestVoice(){
    const voices=speech?.getVoices?.()??[];
    const chinese=voices.filter(v=>/^zh(?:[-_]|$)/i.test(v.lang??''));
    return chinese.find(v=>/yunxi|yunjian|yunyang|yunhao|xiaodong|云希|云健|云扬|云浩|晓东|男声|\bmale\b/i.test(v.name??''))
      ?? chinese.find(v=>/natural|neural|在线/i.test(v.name??''))
      ?? chinese[0] ?? null;
  }
  function stopSpeech(){if(availableSpeech)speech.cancel();}
  function stopRecorded(){if(recordedAudio)recordedAudio.pause();}
  function speak(cue){
    if(!availableSpeech||muted||!cue){currentMode='none';return;}
    stopSpeech();
    const utter=createUtterance(cue.text);
    utter.lang='zh-CN';utter.rate=.93;utter.pitch=.94;utter.volume=.96;
    const voice=bestVoice();if(voice)utter.voice=voice;
    speech.speak(utter);currentMode='browser';
  }
  function playCurrent(seconds){
    if(muted||!playing){currentMode='none';return;}
    if(recordedAudio&&recordedAvailable){
      stopSpeech();
      recordedAudio.currentTime=seconds;
      try{
        const promise=recordedAudio.play();
        if(promise?.catch)promise.catch(()=>{if(playing&&!muted){recordedAvailable=false;speak(getNarrationCue(getTime()));}});
        currentMode='recorded';return;
      }catch{recordedAvailable=false;}
    }
    speak(getNarrationCue(seconds));
  }
  const api={
    available,
    get currentCue(){return currentCue;},
    get muted(){return muted;},
    get playing(){return playing;},
    get voiceMode(){return currentMode;},
    get recordedAvailable(){return recordedAvailable;},
    getAudioTime(){return currentMode==='recorded'&&playing&&recordedAudio?Number(recordedAudio.currentTime):null;},
    setRecordedAvailable(value){
      recordedAvailable=Boolean(value&&recordedAudio);
      if(!recordedAvailable&&currentMode==='recorded'){
        stopRecorded();currentMode='none';
        if(playing&&!muted){currentCue=getNarrationCue(getTime());playCurrent(getTime());}
      }
    },
    playAt(seconds=getTime()){playing=true;currentCue=getNarrationCue(seconds);playCurrent(seconds);},
    pause(){playing=false;stopSpeech();stopRecorded();currentMode='none';},
    tick(seconds){
      if(!playing)return;
      const next=getNarrationCue(seconds);
      if(next?.id!==currentCue?.id){currentCue=next;if(currentMode!=='recorded')playCurrent(seconds);}
      if(!next)api.pause();
    },
    seek(seconds){
      currentCue=getNarrationCue(seconds);
      if(currentMode==='recorded'&&recordedAudio)recordedAudio.currentTime=seconds;
      else if(playing)playCurrent(seconds);
    },
    setMuted(value){
      const next=Boolean(value);if(next===muted)return;muted=next;
      if(muted){stopSpeech();stopRecorded();currentMode='none';}
      else if(playing){currentCue=getNarrationCue(getTime());playCurrent(getTime());}
    }
  };
  return api;
}
