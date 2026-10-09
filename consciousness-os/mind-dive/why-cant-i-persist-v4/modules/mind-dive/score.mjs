/** Original, royalty-free 36-second score: quiet piano over evolving air pads. */
export const SCORE_DURATION = 36;

// Before 21s: a searching D-minor motif. After the observer appears:
// an open F-major melody. Both web synthesis and offline export use these notes.
const progression = [
  {start:0, root:50, chord:[50,57,62,65,69], motif:[65,69,74,69,65,62], scene:'tension'}, // Dm(add9)
  {start:6, root:46, chord:[46,53,57,62,65], motif:[65,62,69,65,62,57], scene:'tension'}, // Bbmaj9
  {start:12,root:43, chord:[43,50,58,62,65], motif:[62,65,70,65,62,58], scene:'tension'}, // Gm9
  {start:18,root:45, chord:[45,52,57,62,64], motif:[64,62,69,64,62,57], scene:'tension'}, // A sus
  {start:21,root:53, chord:[53,60,64,69,72], motif:[69,72,76,72,69,64], scene:'hope'}, // Fmaj7
  {start:27,root:48, chord:[48,55,60,64,67], motif:[67,72,76,72,67,64], scene:'hope'}, // C add9
  {start:33,root:53, chord:[53,60,65,69,72], motif:[69,72,77,72,69,65], scene:'hope'} // F6/maj7
];

const events = [];
for (const [i,chord] of progression.entries()) {
  const length=i===3?3:i===6?3:6;
  chord.chord.slice(0,4).forEach((midi,index)=>{
    events.push({instrument:'pad',start:chord.start,midi,velocity:.39-index*.045,duration:length+.6,scene:chord.scene});
  });
  const step=length/6;
  chord.motif.forEach((midi,j)=>{
    const start=chord.start+.22+j*step;
    if(start<SCORE_DURATION-.1)events.push({instrument:'piano',start:Number(start.toFixed(3)),midi,velocity:.50+.18*(j===0?1:j===3?.5:0),duration:j%3===0?2:1.45,scene:chord.scene});
  });
}
export const SCORE_EVENTS = Object.freeze(events.sort((a,b)=>a.start-b.start).map(e=>Object.freeze(e)));

const scoreClamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
const scoreSmooth=x=>{const a=scoreClamp(x);return a*a*(3-2*a);};
export const getScoreScene = seconds => Number(seconds)>=21?'hope':'tension';

/** Quiet under spoken phrases, gently breathes up at chapter boundaries. */
export function getMusicGainAt(seconds){
  const t=Number(seconds);
  if(!Number.isFinite(t)||t<0||t>=SCORE_DURATION)return 0;
  const starts=[0,5,10,15,21,26,31];
  const ends=[5,10,15,21,26,31,36];
  let level=.74;
  for(let i=0;i<starts.length;i++){
    if(t>=starts[i]&&t<ends[i]){
      const span=ends[i]-starts[i];
      const progress=t-starts[i];
      // First and middle sections lift during the last ~0.85s, creating space.
      const release=scoreSmooth((progress-(span-.95))/.62);
      level=.30+(.44*release);
      break;
    }
  }
  const fadeIn=scoreSmooth(t/1.3);
  const fadeOut=scoreSmooth((SCORE_DURATION-t)/1.1);
  return Number((level*fadeIn*fadeOut).toFixed(6));
}
