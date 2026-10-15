// Практична робота №6 — основи JavaScript (варіант 3: трекер настрою).
// DOM поки не змінюємо: весь результат виводимо в консоль браузера.

console.log('script.js підключено');

// Записи настрою за тиждень: mood — число від 1 (жахливий) до 5 (чудовий).
const entries = [
  { date: '2026-09-09', mood: 3 },
  { date: '2026-09-10', mood: 4 },
  { date: '2026-09-11', mood: 2 },
  { date: '2026-09-12', mood: 4 },
  { date: '2026-09-13', mood: 5 },
  { date: '2026-09-14', mood: 3 },
  { date: '2026-09-15', mood: 4 }
];
  
// Стрілкова функція: повертає текстову назву рівня настрою (1–5).
// Назви збігаються з підписами рівнів на картках записів у index.html.
const moodToLabel = mood => {
  const labels = ['Жахливий', 'Поганий', 'Нейтральний', 'Добрий', 'Чудовий'];
  return labels[mood - 1] ?? 'Невідомий рівень';
};

// Рахує середній настрій за період: цикл for накопичує суму, далі ділимо на кількість.
function averageMood(records) {
  let sum = 0;
  for (let i = 0; i < records.length; i++) {
    sum += records[i].mood;
  }
  return sum / records.length;
}

// Виводить кожен запис у консоль: дата, число і текстова назва настрою.
function printEntries(records) {
  for (const record of records) {
    console.log(`${record.date}: ${record.mood} — ${moodToLabel(record.mood)}`);
  }
}

printEntries(entries);

const average = averageMood(entries);
console.log(`Середній настрій за ${entries.length} днів: ${average.toFixed(2)}`);
console.log(`Тип результату: ${typeof average}`);

// Умовна класифікація тижня за середнім значенням.
if (average >= 3) {
  console.log('Підсумок: гарний тиждень');
} else {
  console.log('Підсумок: важкий тиждень');
}

// Те саме для найближчого цілого рівня — виклик стрілкової функції з реальними даними.
console.log(`Переважний настрій тижня: ${moodToLabel(Math.round(average))}`);
