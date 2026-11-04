// Практична робота №8 — обробка подій і форми, клієнтська валідація (варіант 3: трекер настрою).
// Основа — масив, функції та рендер з практикумів 6–7; тепер список поповнює форма.

console.log('script.js підключено');

// Прибираємо статичні картки-заглушки з практикуму 2: вони лишились у HTML
// лише як орієнтир структури, а список тепер будується з масиву.
document.querySelectorAll('#mood-history .card').forEach(card => card.remove());

// Записи настрою за тиждень: mood — число від 1 (жахливий) до 5 (чудовий).
const entries = [
  { date: '2026-09-09', mood: 3, note: 'Повільний старт тижня, мало енергії.' },
  { date: '2026-09-10', mood: 4, note: 'Гарна погода й вдалі пари.' },
  { date: '2026-09-11', mood: 2, note: 'Багато завдань, відчувалася втома.' },
  { date: '2026-09-12', mood: 4, note: 'Закрила лабораторну, стало легше.' },
  { date: '2026-09-13', mood: 5, note: 'Зустрілася з друзями, гарно провела вихідний.' },
  { date: '2026-09-14', mood: 3, note: 'Звичайний робочий день, без особливих подій.' },
  { date: '2026-09-15', mood: 4, note: 'День пройшов продуктивно, встигла все заплановане.' }
];

// Контейнер історії записів і елементи підсумку в блоці «Статистика».
const listContainer = document.querySelector('#mood-history');
const avgMoodOutput = document.querySelector('#avg-mood');
const entriesCountOutput = document.querySelector('#entries-count');

// Форма додавання запису, її поля, повідомлення про помилку й лічильник символів нотатки.
const form = document.querySelector('#mood-form');
const dateInput = document.querySelector('#mood-date');
const moodInput = document.querySelector('#mood-value');
const noteInput = document.querySelector('#mood-note');
const moodError = document.querySelector('#mood-error');
const noteCounter = document.querySelector('#note-counter');

// Назви рівнів настрою 1–5 (індекс = рівень − 1) і відповідні ключі для CSS-класів.
const MOOD_LABELS = ['Жахливий', 'Поганий', 'Нейтральний', 'Добрий', 'Чудовий'];
const MOOD_KEYS = ['terrible', 'bad', 'neutral', 'good', 'great'];

// Стрілкова функція: повертає текстову назву рівня настрою (1–5).
const moodToLabel = mood => MOOD_LABELS[mood - 1] ?? 'Невідомий рівень';

// Рахує середній настрій за період: цикл for накопичує суму, далі ділимо на кількість.
function averageMood(records) {
  let sum = 0;
  for (let i = 0; i < records.length; i++) {
    sum += records[i].mood;
  }
  return sum / records.length;
}

// Перетворює дату з формату 2026-09-15 на «15 вересня 2026».
const formatDate = isoDate =>
  new Date(isoDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(' р.', '');

// Рендер історії: очищає контейнер і для кожного запису створює картку
// (мітка настрою, h3 з датою, p з нотаткою), задає data-mood і класи за рівнем настрою.
// Записи впорядковуємо за датою: найновіші першими (новий запис, доданий формою, стає на своє місце).
function renderMoodHistory(records) {
  listContainer.innerHTML = '';

  [...records].sort((a, b) => b.date.localeCompare(a.date)).forEach(record => {
    const card = document.createElement('article');
    const moodLabel = document.createElement('span');
    const title = document.createElement('h3');
    const note = document.createElement('p');

    moodLabel.className = 'card__mood-label';
    moodLabel.textContent = moodToLabel(record.mood);
    title.textContent = formatDate(record.date);
    note.textContent = record.note || 'Без нотатки';

    card.dataset.mood = record.mood;
    card.classList.add('card', `card--${MOOD_KEYS[record.mood - 1]}`);
    card.classList.add(record.mood >= 3 ? 'good' : 'hard');

    card.append(moodLabel, title, note);
    listContainer.append(card);
  });
}

// Оновлює підсумки в блоці «Статистика»: змінює вміст уже наявних елементів.
function updateSummary(records) {
  const average = averageMood(records);
  entriesCountOutput.textContent = `Усього записів: ${records.length}`;
  avgMoodOutput.textContent =
    `Середній настрій: ${average.toFixed(2)} (${moodToLabel(Math.round(average))})`;
}

renderMoodHistory(entries);
updateSummary(entries);

// Власна перевірка настрою на кожну зміну поля: значення має бути цілим числом від 1 до 5.
// Повідомлення показуємо і через setCustomValidity (його бачить браузер при сабміті),
// і текстом під полем. Порожнє поле лишаємо стандартному required.
function validateMood() {
  const raw = moodInput.value;
  const value = Number(raw);
  const isOutOfRange = raw !== '' && (!Number.isInteger(value) || value < 1 || value > 5);

  if (isOutOfRange) {
    const message = 'Настрій має бути цілим числом від 1 до 5';
    moodInput.setCustomValidity(message);
    moodError.textContent = message;
    moodInput.classList.add('is-invalid');
  } else {
    moodInput.setCustomValidity('');
    moodError.textContent = '';
    moodInput.classList.remove('is-invalid');
  }
}

moodInput.addEventListener('input', validateMood);

// Лічильник символів нотатки: оновлюється на кожне натискання клавіші (подія input).
function updateNoteCounter() {
  const left = noteInput.maxLength - noteInput.value.length;
  noteCounter.textContent = `Залишилось символів: ${left}`;
}

noteInput.addEventListener('input', updateNoteCounter);

// Надсилання форми: скасовуємо перезавантаження, зчитуємо поля, додаємо запис у масив,
// перемальовуємо список і підсумок, очищаємо форму. Порожні/хибні поля до цього місця
// не доходять — їх зупиняють required, min/max і власна перевірка настрою.
form.addEventListener('submit', event => {
  event.preventDefault();

  const newEntry = {
    date: dateInput.value,
    mood: Number(moodInput.value),
    note: noteInput.value.trim()
  };

  entries.push(newEntry);
  renderMoodHistory(entries);
  updateSummary(entries);

  form.reset();
  validateMood();
  updateNoteCounter();
  console.log('Додано запис:', newEntry);
});

// Контрольний вивід у консоль (як у практикумі 6).
const average = averageMood(entries);
console.log(`Середній настрій за ${entries.length} днів: ${average.toFixed(2)}`);
if (average >= 3) {
  console.log('Підсумок: гарний тиждень');
} else {
  console.log('Підсумок: важкий тиждень');
}