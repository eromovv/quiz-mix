import { getBaseOverrideRows, getCustomItems, getCustomRawRow, rowToItem } from "./customItems.js";

export const STORAGE_KEY = "quiz_progress";

export const CATEGORIES = {
  music: {
    route: "/music",
    title: "Музыка",
    description: "Прослушайте короткие музыкальные фрагменты и определите их название и исполнителя",
  },
  movies: {
    route: "/movies",
    title: "Кино",
    description: "Просмотрите короткие фрагменты фильмов и угадайте их название",
  },
  facts: {
    route: "/facts",
    title: "Факты",
    description: "Решите для каждого утверждения, верно оно или нет",
  },
};

function getMovieVideoUrl(id) {
  return String(import.meta.env[`VITE_MOVIE_VIDEO_${id}`] || "").trim();
}

function makeMovieMedia(id) {
  return {
    type: "video",
    src: getMovieVideoUrl(id),
  };
}

function getMusicAudioUrl(id) {
  return String(import.meta.env[`VITE_MUSIC_AUDIO_${id}`] || "").trim();
}

function makeMusicMedia(id) {
  return {
    type: "audio",
    src: getMusicAudioUrl(id),
  };
}

export const musicItems = [
  { id: 1, media: makeMusicMedia(1), answer: "Трезвучие до мажора" },
  { id: 2, media: makeMusicMedia(2), answer: "Восходящий контур ля минора" },
  { id: 3, media: makeMusicMedia(3), answer: "Нисходящий рисунок G-F-D" },
  { id: 4, media: makeMusicMedia(4), answer: "Арпеджио D-F-A-F" },
  { id: 5, media: makeMusicMedia(5), answer: "Светлая каденция E-G-C" },
  { id: 6, media: makeMusicMedia(6), answer: "Повторяющийся ход F-A-C-A" },
  { id: 7, media: makeMusicMedia(7), answer: "Подъём A-B-D" },
  { id: 8, media: makeMusicMedia(8), answer: "Кластер Es-F#-B" },
  { id: 9, media: makeMusicMedia(9), answer: "Сочетание G-B-D-G" },
  { id: 10, media: makeMusicMedia(10), answer: "Нисходящая линия C-B-A-G" },
];

const musicEditableRows = [
  { id: 1, audioUrl: getMusicAudioUrl(1), answer: "Трезвучие до мажора" },
  { id: 2, audioUrl: getMusicAudioUrl(2), answer: "Восходящий контур ля минора" },
  { id: 3, audioUrl: getMusicAudioUrl(3), answer: "Нисходящий рисунок G-F-D" },
  { id: 4, audioUrl: getMusicAudioUrl(4), answer: "Арпеджио D-F-A-F" },
  { id: 5, audioUrl: getMusicAudioUrl(5), answer: "Светлая каденция E-G-C" },
  { id: 6, audioUrl: getMusicAudioUrl(6), answer: "Повторяющийся ход F-A-C-A" },
  { id: 7, audioUrl: getMusicAudioUrl(7), answer: "Подъём A-B-D" },
  { id: 8, audioUrl: getMusicAudioUrl(8), answer: "Кластер Es-F#-B" },
  { id: 9, audioUrl: getMusicAudioUrl(9), answer: "Сочетание G-B-D-G" },
  { id: 10, audioUrl: getMusicAudioUrl(10), answer: "Нисходящая линия C-B-A-G" },
];

export const moviesItems = [
  { id: 1, media: makeMovieMedia(1), answer: "Интерстеллар" },
  { id: 2, media: makeMovieMedia(2), answer: "Назад в будущее" },
  { id: 3, media: makeMovieMedia(3), answer: "Титаник" },
  { id: 4, media: makeMovieMedia(4), answer: "Король Лев" },
  { id: 5, media: makeMovieMedia(5), answer: "Начало" },
  { id: 6, media: makeMovieMedia(6), answer: "Матрица" },
  { id: 7, media: makeMovieMedia(7), answer: "Джокер" },
  { id: 8, media: makeMovieMedia(8), answer: "Аватар" },
  { id: 9, media: makeMovieMedia(9), answer: "Дюна" },
  { id: 10, media: makeMovieMedia(10), answer: "Гарри Поттер" },
];

const moviesEditableRows = [
  { id: 1, videoUrl: getMovieVideoUrl(1), answer: "Интерстеллар" },
  { id: 2, videoUrl: getMovieVideoUrl(2), answer: "Назад в будущее" },
  { id: 3, videoUrl: getMovieVideoUrl(3), answer: "Титаник" },
  { id: 4, videoUrl: getMovieVideoUrl(4), answer: "Король Лев" },
  { id: 5, videoUrl: getMovieVideoUrl(5), answer: "Начало" },
  { id: 6, videoUrl: getMovieVideoUrl(6), answer: "Матрица" },
  { id: 7, videoUrl: getMovieVideoUrl(7), answer: "Джокер" },
  { id: 8, videoUrl: getMovieVideoUrl(8), answer: "Аватар" },
  { id: 9, videoUrl: getMovieVideoUrl(9), answer: "Дюна" },
  { id: 10, videoUrl: getMovieVideoUrl(10), answer: "Гарри Поттер" },
];

export const factsItems = [
  { id: 1, question: "Молния может нагревать окружающий воздух сильнее, чем поверхность Солнца.", answer: true, description: "Канал молнии на короткое время достигает температур гораздо выше, чем видимая поверхность Солнца." },
  { id: 2, question: "У осьминогов только одно сердце.", answer: false, description: "У осьминогов три сердца: два для жабр и одно для остального тела." },
  { id: 3, question: "С ботанической точки зрения банан — ягода.", answer: true, description: "Ботанически банан относится к ягодам, а клубника — нет." },
  { id: 4, question: "Память золотой рыбки длится всего несколько секунд.", answer: false, description: "Золотые рыбки запоминают схемы и распорядок гораздо дольше нескольких секунд." },
  { id: 5, question: "На Земле вода может одновременно существовать в твёрдом, жидком и газообразном виде.", answer: true, description: "Лёд, вода и водяной пар часто сосуществуют в природе." },
  { id: 6, question: "Великую китайскую стену невооружённым глазом видно с Луны.", answer: false, description: "Это миф: стена слишком узкая, чтобы её было различить с Луны без оптики." },
  { id: 7, question: "Акулы — млекопитающие.", answer: false, description: "Акулы — рыбы: дышат жабрами, молоком детенышей не кормят." },
  { id: 8, question: "Венера вращается в направлении, противоположном большинству планет Солнечной системы.", answer: true, description: "У Венеры ретроградное вращение, поэтому Солнце там «восходило бы» на западе." },
  { id: 9, question: "Человек использует лишь десять процентов мозга.", answer: false, description: "Снимки мозга показывают активность многих зон в обычных задачах и поведении." },
  { id: 10, question: "Сутки на Меркурии длиннее, чем год на Меркурии.", answer: true, description: "Меркурий вращается настолько медленно, что одни солнечные сутки дольше оборота по орбите." },
];

/** Количество встроенных карточек по категориям (пользовательские добавляются после них). */
export const BASE_ITEM_COUNTS = {
  music: musicItems.length,
  movies: moviesItems.length,
  facts: factsItems.length,
};

/**
 * Индекс в общем списке getItems(category) относится к пользовательской карточке.
 * @param {"music"|"movies"|"facts"} category
 * @param {number} index
 */
export function isCustomItemIndex(category, index) {
  return index >= BASE_ITEM_COUNTS[category];
}

function getBaseItems(category) {
  return category === "music" ? musicItems : category === "movies" ? moviesItems : factsItems;
}

function getBaseEditableRows(category) {
  if (category === "music") {
    return musicEditableRows;
  }
  if (category === "movies") {
    return moviesEditableRows;
  }
  return factsItems.map(({ id, question, answer, description }) => ({ id, question, answer, description }));
}

/**
 * @param {"music"|"movies"|"facts"} category
 * @param {number} index
 */
export function getEditableItemRow(category, index) {
  if (isCustomItemIndex(category, index)) {
    const customIndex = index - BASE_ITEM_COUNTS[category];
    const customItem = getCustomItems(category)[customIndex];
    return customItem ? getCustomRawRow(category, customItem.id) : null;
  }

  const baseRow = getBaseEditableRows(category)[index] ?? null;
  if (!baseRow) {
    return null;
  }
  const override = getBaseOverrideRows(category)[baseRow.id];
  return override ?? baseRow;
}

/**
 * @param {"music"|"movies"|"facts"} category
 */
export function getItems(category) {
  const overrides = getBaseOverrideRows(category);
  const base = getBaseItems(category).map((item) => (overrides[item.id] ? rowToItem(category, overrides[item.id]) : item));
  return [...base, ...getCustomItems(category)];
}

/** Ключи тем в порядке отображения (как в объекте CATEGORIES). */
export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export function getItemCount(category) {
  return getItems(category).length;
}

export function getRoundCount() {
  return CATEGORY_KEYS.length;
}

export function getTotalQuestionCount() {
  return CATEGORY_KEYS.reduce((sum, key) => sum + getItemCount(key), 0);
}

/** Секунды ожидания в раунде «Музыка» до разблокировки ответа. */
export const MUSIC_LISTEN_DURATION_SEC = 10;
