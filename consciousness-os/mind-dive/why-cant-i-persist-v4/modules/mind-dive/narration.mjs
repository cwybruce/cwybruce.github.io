/** Human-written narration; one addressable cue per existing 36-second chapter. */
export const NARRATION_CUES = Object.freeze([
  {id:'trigger',start:0,end:5,text:'为什么你总坚持不了？我们先钻进这个念头。'},
  {id:'interpretation',start:5,end:10,text:'当你说太累了，大脑会判断：现在行动太难。'},
  {id:'reward',start:10,end:15,text:'休息立刻舒服；进步的回报，却需要等待。'},
  {id:'old-loop',start:15,end:21,text:'于是你推迟行动，得到短暂轻松。逃避也变得更容易。'},
  {id:'observer',start:21,end:26,text:'改变始于觉察：想放弃只是信号，不是命令。'},
  {id:'intervention',start:26,end:31,text:'不要强迫自己做完。先开始，哪怕只有两分钟。'},
  {id:'new-loop',start:31,end:36,text:'完成一个小动作，留下反馈。新回路就此开始。'}
].map(x=>Object.freeze(x)));

export function getNarrationCue(seconds){
  const time=Number.isFinite(Number(seconds))?Math.max(0,Number(seconds)):0;
  return NARRATION_CUES.find(cue=>time>=cue.start && time<cue.end)??null;
}

export function getNarrationText(seconds){return getNarrationCue(seconds)?.text??'';}
