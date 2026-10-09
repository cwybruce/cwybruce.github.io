const KEY='consciousness-micro-action-v1';
const DURATION=120;
const STATUSES=['idle','ready','running','paused','awaiting-feedback','reported'];
const REASONS=['','too-big','interrupted','rest'];

/** A user's real-world session. This clock never drives the Mind Dive scene. */
export function createMicroAction({choices,storage=null,now=()=>Date.now()}) {
  const validChoice=id=>choices.some(choice=>choice.id===id);
  const fresh=()=>({version:1,choice:null,status:'idle',elapsed:0,started:false,outcome:null,reason:''});
  let state=fresh(),startedAt=null,saved=false;
  try {
    const data=JSON.parse(storage?.getItem(KEY)??'null');
    if(data?.version===1 && STATUSES.includes(data.status) &&
      (data.choice===null?data.status==='idle':validChoice(data.choice)) &&
      Number.isFinite(data.elapsed)&&data.elapsed>=0&&data.elapsed<=DURATION&&
      typeof data.started==='boolean'&&REASONS.includes(data.reason)&&
      (data.status==='reported'?['completed','incomplete'].includes(data.outcome):data.outcome===null)&&
      (!['running','paused','awaiting-feedback'].includes(data.status)||data.started)&&
      (data.outcome!=='completed'||data.started)) {
      state={...fresh(),...data,status:data.status==='running'?'paused':data.status};
      saved=true;
    }
  } catch { /* Blocked storage and stale data must not prevent practice. */ }
  const sync=()=>{
    if(state.status!=='running')return;
    const stamp=now();
    state.elapsed=Math.min(DURATION,state.elapsed+Math.max(0,(stamp-startedAt)/1000));
    startedAt=stamp;
    if(state.elapsed>=DURATION){state.status='awaiting-feedback';startedAt=null;}
  };
  const persist=()=>{
    try {if(!storage)throw Error('No session storage');storage.setItem(KEY,JSON.stringify(state));saved=true;}
    catch {saved=false;}
  };
  const api={
    getState(){sync();return {...state,remaining:Math.max(0,Math.ceil(DURATION-state.elapsed)),saved};},
    select(id){if(!['idle','ready'].includes(state.status)||!validChoice(id))return;state.choice=id;state.status='ready';persist();},
    start(){sync();if(!['ready','paused'].includes(state.status))return;state.status='running';state.started=true;startedAt=now();persist();},
    pause(){sync();if(state.status==='running'){state.status='paused';startedAt=null;persist();}},
    checkpoint(){sync();persist();},
    report(outcome,reason=''){
      sync();
      if(!state.choice||state.status==='reported'||!['completed','incomplete'].includes(outcome)||!REASONS.includes(reason))return;
      if(outcome==='completed'&&!state.started)return;
      state.status='reported';state.outcome=outcome;state.reason=outcome==='incomplete'?reason:'';startedAt=null;persist();
    },
    reset(){state=fresh();startedAt=null;persist();}
  };
  return api;
}
