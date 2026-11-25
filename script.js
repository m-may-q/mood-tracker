// Практична робота №11 (етап 2) — IndexedDB замість localStorage, варіант 3: трекер настрою.
// Практикум 10 — бібліотеки й фреймворки (Vue 3).
// Вибрано Vue 3 (CDN, без збірки): шаблон близький до звичайного HTML, не потрібні JSX і Babel,
// а computed-властивості точно відповідають завданню про похідне значення emoji.
// Список історії записів тепер рендерить компонент MoodEntry; форма (п. 8) і запит до API (п. 9) лишились без змін.

console.log('script.js підключено');

// Повідомлення про помилку сховища (IndexedDB) і елементи підсумку в блоці «Статистика».
const storageStatus = document.querySelector('#storage-status');
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

// Стару функцію renderMoodHistory (ручний рендер через createElement з практикуму 7) ЗАМІНЕНО
// компонентом MoodEntry нижче: Vue сам перемальовує список, коли змінюється масив entries.
// Функцію renderCards залишено лише для блоку «Записи із сервера» (практикум 9).

// Оновлює підсумки в блоці «Статистика»: змінює вміст уже наявних елементів.
function updateSummary(records) {
  if (records.length === 0) {
    entriesCountOutput.textContent = 'Усього записів: 0';
    avgMoodOutput.textContent = 'Середній настрій: —';
    return;
  }
  const average = averageMood(records);
  entriesCountOutput.textContent = `Усього записів: ${records.length}`;
  avgMoodOutput.textContent =
    `Середній настрій: ${average.toFixed(2)} (${moodToLabel(Math.round(average))})`;
}

// ===== Практикум 10: Vue 3 =====

// Компонент одного запису. Дані приходять через props, глобальних змінних компонент не читає.
// emoji, назва рівня та класи — похідні (computed) значення: вони виводяться з props.mood
// і ніде окремо не зберігаються, тому не можуть розійтися з числом настрою.
const MoodEntry = {
  props: {
    date: { type: String, required: true },
    mood: { type: Number, required: true },
    note: { type: String, default: '' }
  },
  computed: {
    emoji() {
      return ['😢', '🙁', '😐', '🙂', '😄'][this.mood - 1] ?? '❔';
    },
    label() {
      return moodToLabel(this.mood);
    },
    moodKey() {
      return MOOD_KEYS[this.mood - 1];
    },
    prettyDate() {
      return formatDate(this.date);
    }
  },
  template: `
    <article class="card" :class="['card--' + moodKey, mood >= 3 ? 'good' : 'hard']" :data-mood="mood">
      <span class="card__mood-label">
        <span class="card__emoji" aria-hidden="true">{{ emoji }}</span>{{ label }}
      </span>
      <h3>{{ prettyDate }}</h3>
      <p>{{ note || 'Без нотатки' }}</p>
    </article>`
};

// ===== Практикум 11, етап 2: IndexedDB =====

// Схема: база MoodDB (версія 1), одне сховище moodEntries, keyPath 'id' з автоінкрементом.
const DB_NAME = 'MoodDB';
const DB_VERSION = 1;
const STORE_NAME = 'moodEntries';

// Ключ у localStorage, під яким лежали записи на етапі 1 (джерело для міграції), і прапорець міграції.
const STORAGE_KEY = 'moodEntries';
const MIGRATED_KEY = 'migrated';

// Читає масив із localStorage (використовується лише для одноразової міграції).
// Якщо даних немає або рядок пошкоджений — повертає порожній масив.
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Пошкоджені дані в localStorage:', error);
    return [];
  }
}

// Відкриває базу даних і повертає Promise з об'єктом db.
// onupgradeneeded спрацьовує лише при створенні бази (або підвищенні версії) — тут створюємо сховище.
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Створення/оновлення: put() додає запис або замінює наявний з тим самим id.
// Для нового запису без id браузер сам видає наступний номер (autoIncrement) — повертаємо його.
async function addItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  });
}

// Читання: повертає всю історію записів масивом.
async function getAllItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Оновлення наявного запису (той самий id — без дубліката).
const updateItem = addItem;

// Видалення запису за id.
async function deleteItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Початкові записи для першого запуску (без id: їх видасть autoIncrement).
function defaultEntries() {
  return [
    { date: '2026-09-09', mood: 3, note: 'Повільний старт тижня, мало енергії.' },
    { date: '2026-09-10', mood: 4, note: 'Гарна погода й вдалі пари.' },
    { date: '2026-09-11', mood: 2, note: 'Багато завдань, відчувалася втома.' },
    { date: '2026-09-12', mood: 4, note: 'Закрила лабораторну, стало легше.' },
    { date: '2026-09-13', mood: 5, note: 'Зустрілася з друзями, гарно провела вихідний.' },
    { date: '2026-09-14', mood: 3, note: 'Звичайний робочий день, без особливих подій.' },
    { date: '2026-09-15', mood: 4, note: 'День пройшов продуктивно, встигла все заплановане.' }
  ];
}

// Одноразова міграція: якщо сховище порожнє, а в localStorage лежать записи з етапу 1 —
// переносимо їх в IndexedDB і ставимо прапорець migrated, щоб не повторювати перенесення.
async function migrateFromLocalStorage() {
  if (localStorage.getItem(MIGRATED_KEY) === 'true') return;
  const existing = await getAllItems();
  const legacy = loadFromLocalStorage();
  if (existing.length === 0 && legacy.length > 0) {
    for (const item of legacy) {
      await addItem(item);
    }
    console.log(`Міграція: перенесено записів із localStorage — ${legacy.length}`);
  }
  localStorage.setItem(MIGRATED_KEY, 'true');
}

// Кореневий застосунок Vue (контейнер #mood-history, шаблон із v-for — в index.html).
// Джерело даних тепер IndexedDB: список читаємо через getAllItems() і оновлюємо після кожної операції.
const app = Vue.createApp({
  components: { MoodEntry },
  data() {
    return { entries: [], storageError: '' };
  },
  computed: {
    // Найновіші записи першими; копія масиву, щоб не змінювати порядок у стані.
    sortedEntries() {
      return [...this.entries].sort((a, b) => b.date.localeCompare(a.date));
    }
  },
  watch: {
    // Блок «Статистика» оновлюється щоразу, коли змінюється масив записів.
    entries: {
      handler(records) {
        updateSummary(records);
      },
      deep: true,
      immediate: true
    },
    storageError(message) {
      storageStatus.textContent = message;
    }
  },
  methods: {
    // Початкове завантаження: міграція (за потреби), заповнення порожньої бази, читання історії.
    // Якщо IndexedDB недоступна, показуємо повідомлення і працюємо лише в пам'яті.
    async init() {
      try {
        await migrateFromLocalStorage();
        let items = await getAllItems();
        if (items.length === 0) {
          for (const item of defaultEntries()) {
            await addItem(item);
          }
          items = await getAllItems();
        }
        this.entries = items;
      } catch (error) {
        console.error('IndexedDB недоступна:', error);
        this.storageError = 'Не вдалося відкрити сховище браузера: записи не збережуться після перезавантаження сторінки.';
        this.entries = defaultEntries().map((item, index) => ({ id: index + 1, ...item }));
      }
    },

    // Додає запис у IndexedDB і перечитує список із бази.
    async addEntry(entry) {
      if (this.storageError) {
        // Запасний варіант без бази: запис живе лише в пам'яті.
        const nextId = this.entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;
        this.entries.push({ id: nextId, ...entry });
        return;
      }
      try {
        await addItem(entry);
        this.entries = await getAllItems();
      } catch (error) {
        console.error('Не вдалося зберегти запис:', error);
        this.storageError = 'Не вдалося зберегти запис у сховище браузера.';
      }
    }
  }
});

const vm = app.mount('#mood-history');

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

// Надсилання форми: скасовуємо перезавантаження, зчитуємо поля, передаємо запис застосунку Vue
// (він сам перемальовує список і статистику), очищаємо форму. Порожні/хибні поля до цього місця
// не доходять — їх зупиняють required, min/max і власна перевірка настрою.
form.addEventListener('submit', async event => {
  event.preventDefault();

  const newEntry = {
    date: dateInput.value,
    mood: Number(moodInput.value),
    note: noteInput.value.trim()
  };

  // Зберігаємо запис в IndexedDB і перечитуємо список: Vue сам оновить картки й статистику.
  await vm.addEntry(newEntry);

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

// Контрольний вивід у консоль (як у практикумі 6) — після завантаження записів із бази.
vm.init().then(() => {
  if (vm.entries.length === 0) return;
  const average = averageMood(vm.entries);
  console.log(`Середній настрій за ${vm.entries.length} днів: ${average.toFixed(2)}`);
  if (average >= 3) {
    console.log('Підсумок: гарний тиждень');
  } else {
    console.log('Підсумок: важкий тиждень');
  }
});