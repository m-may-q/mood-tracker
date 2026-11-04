// Практична робота №9 — клієнт для API (fetch/async/await), варіант 3: трекер настрою.
// Основа — масив, рендер і форма з практикумів 6–8; тепер додатково завантажуємо записи з API.

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

// Блок «Записи із сервера» (практикум 9): контейнер списку, повідомлення про стан і кнопка.
const remoteContainer = document.querySelector('#remote-history');
const remoteStatus = document.querySelector('#remote-status');
const refreshButton = document.querySelector('#refresh-remote');

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

// Універсальний рендер карток у вказаний контейнер (функція з практикуму 7, узагальнена):
// очищає контейнер і для кожного елемента створює картку — мітка, h3, p і, за потреби, додатковий рядок.
// item: { label, title, text, meta?, mood? }. Якщо mood задано — картка отримує data-mood і класи рівня настрою.
function renderCards(container, items) {
  container.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('article');
    const moodLabel = document.createElement('span');
    const title = document.createElement('h3');
    const note = document.createElement('p');

    moodLabel.className = 'card__mood-label';
    moodLabel.textContent = item.label;
    title.textContent = item.title;
    note.textContent = item.text;

    card.classList.add('card');
    if (item.mood) {
      card.dataset.mood = item.mood;
      card.classList.add(`card--${MOOD_KEYS[item.mood - 1]}`);
      card.classList.add(item.mood >= 3 ? 'good' : 'hard');
    } else {
      card.classList.add('card--neutral');
    }

    card.append(moodLabel, title, note);

    if (item.meta) {
      const meta = document.createElement('p');
      meta.className = 'card__meta';
      meta.textContent = item.meta;
      card.append(meta);
    }

    container.append(card);
  });
}

// Рендер історії власних записів: найновіші першими; поля запису зіставляємо з полями картки.
function renderMoodHistory(records) {
  const items = [...records]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(record => ({
      mood: record.mood,
      label: moodToLabel(record.mood),
      title: formatDate(record.date),
      text: record.note || 'Без нотатки'
    }));

  renderCards(listContainer, items);
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


// ===== Практикум 9: клієнт для API =====

// API: JSONPlaceholder (мок-дані, без ключа) — https://jsonplaceholder.typicode.com
// Коментарі до допису №1 трактуємо як записи настрою: name — заголовок, body — нотатка, email — автор.
const API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=1';
const API_ERROR_MESSAGE = 'Записи тимчасово недоступні';

// Показує або ховає стан завантаження: текст «Завантаження…» і заблокована кнопка «Оновити».
function showLoading(isLoading) {
  refreshButton.disabled = isLoading;
  if (isLoading) {
    remoteStatus.textContent = 'Завантаження…';
    remoteStatus.classList.remove('is-error');
  }
}

// Виводить зрозуміле користувачу повідомлення про помилку й очищає список.
function showError(message) {
  remoteContainer.innerHTML = '';
  remoteStatus.textContent = message;
  remoteStatus.classList.add('is-error');
}

// Завантажує записи з API (JSONPlaceholder, /comments?postId=1) і виводить їх тією ж функцією renderCards.
// Мережевий збій (reject від fetch) і HTTP-помилка (response.ok === false) обробляються в одному catch.
async function loadRemoteEntries() {
  showLoading(true);
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Сервер відповів кодом ${response.status}`);
    }
    const data = await response.json();
    console.log('Відповідь API:', data);

    // Зіставляємо поля API з полями картки: name → title, body → text, email → meta.
    const items = data.map(comment => ({
      label: 'Запис із сервера',
      title: comment.name,
      text: comment.body,
      meta: `Автор: ${comment.email}`
    }));

    renderCards(remoteContainer, items);
    remoteStatus.textContent = items.length > 0
      ? `Завантажено записів: ${items.length}`
      : 'Записів поки немає';
  } catch (error) {
    showError(API_ERROR_MESSAGE);
    console.error('Помилка завантаження записів:', error);
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener('click', loadRemoteEntries);
loadRemoteEntries();

// Контрольний вивід у консоль (як у практикумі 6).
const average = averageMood(entries);
console.log(`Середній настрій за ${entries.length} днів: ${average.toFixed(2)}`);
if (average >= 3) {
  console.log('Підсумок: гарний тиждень');
} else {
  console.log('Підсумок: важкий тиждень');
}