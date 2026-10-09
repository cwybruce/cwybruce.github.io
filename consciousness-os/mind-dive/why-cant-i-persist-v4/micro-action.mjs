/** Render a local practice session without touching the deterministic 3D state. */
export function initializeMicroAction({document,session,content,stopPlayback}) {
  const card=document.querySelector('#micro-action');
  const find=id=>document.getElementById(id);
  const choices=find('action-choices');
  find('action-trigger').textContent=content.trigger;
  for(const choice of content.choices){
    const label=document.createElement('label');label.className='action-choice';
    const input=document.createElement('input');input.type='radio';input.name='micro-action-choice';input.value=choice.id;input.id=`action-choice-${choice.id}`;
    const copy=document.createElement('span');const title=document.createElement('strong');const detail=document.createElement('small');title.textContent=choice.title;detail.textContent=choice.detail;copy.append(title,detail);label.append(input,copy);choices.append(label);
    input.addEventListener('change',()=>{session.select(choice.id);render();});
  }
  const statuses={idle:'先选一个与你原本计划有关的小动作。',ready:'准备好了就开始。不必完成原来的全部任务。',running:'现在去做这个动作。两分钟后，你可以选择停下。',paused:'已暂停。准备好后继续；刷新页面也会暂停计时。','awaiting-feedback':'两分钟到了。你实际做了吗？由你来记录结果。',reported:'这是你的本次自报结果，可以回看或重新练习。'};
  function render(){
    const state=session.getState();
    card.dataset.status=state.status;
    find('action-timer').textContent=`${String(Math.floor(state.remaining/60)).padStart(2,'0')}:${String(state.remaining%60).padStart(2,'0')}`;
    if(find('action-status').textContent!==statuses[state.status])find('action-status').textContent=statuses[state.status];
    for(const input of choices.querySelectorAll('input')){input.checked=input.value===state.choice;input.disabled=!['idle','ready'].includes(state.status);}
    find('action-start').hidden=!['idle','ready','paused'].includes(state.status);find('action-start').disabled=state.status==='idle';find('action-start').textContent=state.status==='paused'?'继续这两分钟':'开始这两分钟';
    find('action-pause').hidden=state.status!=='running';
    find('action-feedback').hidden=['idle','reported'].includes(state.status);
    find('action-complete').disabled=!state.started;
    find('action-result').hidden=state.status!=='reported';
    find('action-result').textContent=state.status==='reported'?(state.outcome==='completed'?content.completed:`你报告这次尚未完成。${content.incomplete[state.reason]}`):'';
    find('action-reset').hidden=state.status==='idle';
    find('action-storage').textContent=state.saved?'只保存在当前标签页的浏览器会话中，刷新可回看；不会上传，也未保存到账户。':'当前仅在页面内保留；刷新可能丢失。不会上传，也未保存到账户。';
  }
  find('action-start').addEventListener('click',()=>{stopPlayback();session.start();render();});
  find('action-pause').addEventListener('click',()=>{session.pause();render();});
  find('action-complete').addEventListener('click',()=>{session.report('completed');render();});
  find('action-incomplete').addEventListener('click',()=>{session.report('incomplete',find('action-reason').value);render();});
  find('action-reset').addEventListener('click',()=>{session.reset();find('action-reason').value='';render();});
  const view=document.defaultView;
  const interval=view.setInterval(()=>{if(session.getState().status==='running'||card.dataset.status==='running'){session.checkpoint();render();}},1000);
  const leave=()=>{session.pause();session.checkpoint();};
  view.addEventListener('pagehide',leave);
  // Practice happens in another document or in the real world. Background
  // throttling must not pause its wall clock; returning refreshes the display.
  document.addEventListener('visibilitychange',()=>{session.checkpoint();render();});
  render();
  return {
    showEnd({reveal=false}={}){
      find('action-entry').textContent='探索结束 · 现在做一个两分钟动作 ↓';
      if(reveal&&session.getState().status!=='running')card.scrollIntoView({block:'start',behavior:view.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    },
    destroy(){view.clearInterval(interval);view.removeEventListener('pagehide',leave);}
  };
}
