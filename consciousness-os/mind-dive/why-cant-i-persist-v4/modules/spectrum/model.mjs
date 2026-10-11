import {CONSCIOUSNESS_MODES} from '../content/modes.mjs';
import {MODE_COPY} from '../domain/profile.mjs';
// Authored examples, not NLP inference, clinical data, or visitor telemetry.
export const THOUGHT_EXAMPLES=Object.freeze([
 {id:'failure',thought:'我必须成功，否则就证明我不行',event:'failure',meaning:'self invalidation',emotion:'anxiety',action:'avoidance / control',pattern:'把结果和自我价值绑定',belief:'只有成功才有价值',need:'被认可 / 证明自我',reframe:'失败是反馈，不是自我否定。',next:'把任务缩成两分钟，只验证能否开始。',from:'ego',to:'rational',metrics:[87,91,76]},
 {id:'comparison',thought:'别人都比我好，我是不是不够好？',event:'comparison',meaning:'external validation',emotion:'self doubt',action:'comparison / withdrawal',pattern:'用他人的进度评判自己',belief:'必须得到认同才值得',need:'归属 / 被接纳',reframe:'别人的进度不是我的价值刻度。',next:'选一个与自己的目标有关的小动作。',from:'belonging',to:'care',metrics:[68,52,89]},
 {id:'control',thought:'我要掌握一切，才不会出错',event:'uncertainty',meaning:'loss of control',emotion:'tension',action:'overplanning / delay',pattern:'用更多计划回避不确定',belief:'没有完美准备就不能开始',need:'安全 / 确定感',reframe:'不需要控制全部变量，先验证一个。',next:'做一个可撤回的两分钟小实验。',from:'rational',to:'integration',metrics:[79,94,48]},
 {id:'rest',thought:'我今天太累了，还要逼自己继续吗？',event:'fatigue',meaning:'need for recovery',emotion:'exhaustion',action:'pause / recovery',pattern:'可能是资源不足，不一定是逃避',belief:'休息也可以是负责任的选择',need:'恢复 / 身体需要',reframe:'确实疲惫时可以休息，不必证明自己。',next:'先休息；有余力再选择一个小动作。',from:'care',to:'care',metrics:[32,41,24]},
 {id:'delay',thought:'我知道该做什么，可就是不开始',event:'task friction',meaning:'too much at once',emotion:'overwhelm',action:'analysis / avoidance',pattern:'把想清楚替代了真正行动',belief:'必须一次把事情做好',need:'降低摩擦 / 可执行的起点',reframe:'先开始一个小版本，再用反馈修正。',next:'打开行动卡，选一个两分钟版本。',from:'rational',to:'rational',metrics:[56,82,74]}
]);
export function getSpectrumState(result=null,{modeId,exampleId='failure'}={}){
 const find=id=>CONSCIOUSNESS_MODES.find(m=>m.id===id);
 const valid=result&&find(result.dominantMode)&&find(result.secondaryMode)&&find(result.fallbackMode);
 const example=THOUGHT_EXAMPLES.find(e=>e.id===exampleId)||THOUGHT_EXAMPLES[0];
 const mode=find(modeId)||find(valid?result.dominantMode:example.from);
 const value=valid?result.modeScores?.[mode.id]:null;
 return {source:valid?'assessment':'demo',mode,copy:MODE_COPY[mode.id],example,
   weight:Number.isFinite(value)&&value>=0&&value<=100?Math.round(value):null};
}
