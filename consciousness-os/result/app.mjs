import { CONSCIOUSNESS_MODES, getMode } from '/consciousness-os/src/content/modes.mjs';
import { buildMindProfile } from '/consciousness-os/src/domain/profile.mjs';

const raw = sessionStorage.getItem('consciousness-assessment-result');
const missing = document.querySelector('#missing');
const content = document.querySelector('#content');
if (!raw) {
  missing.hidden = false;
} else {
  try {
    const result = JSON.parse(raw);
    const profile = buildMindProfile(result);
    const mode = getMode(result.dominantMode);
    document.querySelector('#mode-en').textContent = `${mode.en.toUpperCase()} / CURRENT MODE`;
    document.querySelector('#mode-name').textContent = mode.zh;
    document.querySelector('#explanation').textContent = profile.copy.explanation;
    document.querySelector('#strengths').replaceChildren(...profile.copy.strengths.map((item) => { const li=document.createElement('li'); li.textContent=item; return li; }));
    document.querySelector('#blind').textContent = profile.copy.blindSpot;
    document.querySelector('#fallback-copy').textContent = profile.copy.fallbackCopy;
    document.querySelector('#spectrum').replaceChildren(...[...CONSCIOUSNESS_MODES].reverse().map((item) => { const row=document.createElement('div'); row.className=`band${item.id===mode.id?' active':''}`; row.innerHTML=`<span>${item.zh} <small>${item.en}</small></span><span>${item.range[0]}–${item.range[1]}</span>`; return row; }));
    const labels={safety:'安全',belonging:'归属',achievement:'成就',analysis:'分析',empathy:'共情',flexibility:'灵活'};
    document.querySelector('#bars').replaceChildren(...Object.entries(result.dimensions).map(([key,value])=>{const row=document.createElement('div');row.className='metric';row.innerHTML=`<span>${labels[key]??key}</span><div class="track"><div class="fill" style="width:${value}%"></div></div><b>${value}</b>`;return row;}));
    content.hidden = false;
  } catch {
    sessionStorage.removeItem('consciousness-assessment-result');
    missing.hidden = false;
  }
}
