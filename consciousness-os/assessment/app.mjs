import { ASSESSMENT_QUESTIONS } from '/consciousness-os/src/content/assessment.mjs';
import { scoreAssessment } from '/consciousness-os/src/domain/assessment.mjs';

let index = 0;
const answers = new Map();
const form = document.querySelector('#form');
const prompt = document.querySelector('#prompt');
const options = document.querySelector('#options');
const step = document.querySelector('#step');
const progress = document.querySelector('#progress');
const back = document.querySelector('#back');
const next = document.querySelector('#next');

function render() {
  const question = ASSESSMENT_QUESTIONS[index];
  prompt.textContent = question.prompt;
  step.textContent = `${String(index + 1).padStart(2, '0')} / ${String(ASSESSMENT_QUESTIONS.length).padStart(2, '0')}`;
  progress.style.width = `${((index + 1) / ASSESSMENT_QUESTIONS.length) * 100}%`;
  options.replaceChildren(...question.options.map((option, optionIndex) => {
    const label = document.createElement('label');
    label.className = 'option';
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'answer'; input.value = option.id;
    input.checked = answers.get(question.id) === option.id;
    input.addEventListener('change', () => { answers.set(question.id, option.id); updateButtons(); });
    const text = document.createElement('span');
    text.textContent = `${String.fromCharCode(65 + optionIndex)}. ${option.label}`;
    label.append(input, text); return label;
  }));
  back.disabled = index === 0;
  next.textContent = index === ASSESSMENT_QUESTIONS.length - 1 ? '查看我的意识模式 →' : '下一步';
  updateButtons();
}
function updateButtons() { next.disabled = !answers.has(ASSESSMENT_QUESTIONS[index].id); }
back.addEventListener('click', () => { if (index > 0) { index -= 1; render(); } });
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!answers.has(ASSESSMENT_QUESTIONS[index].id)) return;
  if (index < ASSESSMENT_QUESTIONS.length - 1) { index += 1; render(); return; }
  const ordered = ASSESSMENT_QUESTIONS.map((q) => answers.get(q.id));
  const result = scoreAssessment(ordered);
  sessionStorage.setItem('consciousness-assessment-result', JSON.stringify(result));
  location.href = '/consciousness-os/result/';
});
render();
