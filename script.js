// Практична робота №7 — маніпуляція DOM (варіант 3: трекер настрою).
// Основа — дані й функції з практикуму 6; тепер результат виводимо на сторінку.

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
// Найновіші записи показуємо першими.
function renderMoodHistory(records) {
  listContainer.innerHTML = '';

  [...records].reverse().forEach(record => {
    const card = document.createElement('article');
    const moodLabel = document.createElement('span');
    const title = document.createElement('h3');
    const note = document.createElement('p');

    moodLabel.className = 'card__mood-label';
    moodLabel.textContent = moodToLabel(record.mood);
    title.textContent = formatDate(record.date);
    note.textContent = record.note;

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
  entriesCountOutput.textContent = `Записів за тиждень: ${records.length}`;
  avgMoodOutput.textContent =
    `Середній настрій: ${average.toFixed(2)} (${moodToLabel(Math.round(average))})`;
}

renderMoodHistory(entries);
updateSummary(entries);

// Контрольний вивід у консоль (як у практикумі 6).
const average = averageMood(entries);
console.log(`Середній настрій за ${entries.length} днів: ${average.toFixed(2)}`);
if (average >= 3) {
  console.log('Підсумок: гарний тиждень');
} else {
  console.log('Підсумок: важкий тиждень');
}