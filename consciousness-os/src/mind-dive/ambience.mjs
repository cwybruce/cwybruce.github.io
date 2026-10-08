/** A tiny procedural ambient sound bed: no API, downloads or external audio files. */
export function createAmbientEngine({AudioContextCtor=globalThis.AudioContext??globalThis.webkitAudioContext??null}={}){
  let context=null,tones=[];
  const available=Boolean(AudioContextCtor);
  function ensure(){
    if(!available)return false;
    if(context)return true;
    try{
      context=new AudioContextCtor();
      const master=context.createGain();master.gain.value=.018;master.connect(context.destination);
      for(const [type,freq,gain] of [['sine',96,.78],['sine',192,.18],['triangle',290,.04]]){
        const level=context.createGain();level.gain.value=gain;level.connect(master);
        const oscillator=context.createOscillator();oscillator.type=type;oscillator.frequency.value=freq;
        oscillator.connect(level);oscillator.start();tones.push({oscillator,freq});
      }
      return true;
    }catch{return false;}
  }
  return {
    available,
    start(){if(ensure())return context.resume();},
    pause(){if(context)return context.suspend();},
    seek(time){if(!context)return;const modulation=Number(time)>=21?1.13:1;for(const {oscillator,freq} of tones)oscillator.frequency.setTargetAtTime(freq*modulation,context.currentTime,.45);}
  };
}
