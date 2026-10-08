import { getNarrationCue } from './narration.mjs';

/** Browser speech synthesis is intentionally opt-in (autoplay audio is blocked on most devices). */
export function createNarrationPlayer({speech,createUtterance,getTime=()=>0}={}){
  let playing=false, muted=false, currentCue=null;
  const available=Boolean(speech && typeof speech.speak==='function' && typeof speech.cancel==='function' && typeof createUtterance==='function');
  function bestVoice(){
    const voices=speech?.getVoices?.()??[];
    return voices.find(v=>/^zh[-_]CN/i.test(v.lang??'') && /xiaoxiao|晓晓|natural|huihui|云希/i.test(v.name??''))
      ?? voices.find(v=>/^zh[-_]CN/i.test(v.lang??''))
      ?? voices.find(v=>/^zh/i.test(v.lang??''))
      ?? null;
  }
  function speak(cue){
    if(!available||muted||!cue)return;
    speech.cancel();
    const utter=createUtterance(cue.text);
    utter.lang='zh-CN';utter.rate=1.12;utter.pitch=0.97;utter.volume=.95;
    const voice=bestVoice();if(voice)utter.voice=voice;
    speech.speak(utter);
  }
  const api={
    available,
    get currentCue(){return currentCue;},
    get muted(){return muted;},
    get playing(){return playing;},
    playAt(seconds=getTime()){playing=true;currentCue=getNarrationCue(seconds);speak(currentCue);},
    pause(){playing=false;if(available)speech.cancel();},
    tick(seconds){if(!playing)return;const next=getNarrationCue(seconds);if(next?.id!==currentCue?.id){currentCue=next;speak(next);}if(!next)api.pause();},
    seek(seconds){currentCue=getNarrationCue(seconds);if(playing)speak(currentCue);},
    setMuted(value){const next=Boolean(value);if(next===muted)return;muted=next;if(muted){if(available)speech.cancel();}else if(playing){currentCue=getNarrationCue(getTime());speak(currentCue);}},
  };
  return api;
}
