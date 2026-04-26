import { getCustomItems } from "./customItems.js";
import { makePoster, makeToneTrack } from "./itemFactories.js";

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

export const musicItems = [
  { id: 1, media: makeToneTrack([261.63, 329.63, 392], 0.45), answer: "Трезвучие до мажора" },
  { id: 2, media: makeToneTrack([220, 246.94, 293.66, 329.63], 0.42), answer: "Восходящий контур ля минора" },
  { id: 3, media: makeToneTrack([392, 392, 349.23, 293.66], 0.5), answer: "Нисходящий рисунок G–F–D" },
  { id: 4, media: makeToneTrack([293.66, 349.23, 440, 349.23], 0.46), answer: "Арпеджио D–F–A–F" },
  { id: 5, media: makeToneTrack([329.63, 392, 523.25], 0.62), answer: "Светлая каденция E–G–C" },
  { id: 6, media: makeToneTrack([174.61, 220, 261.63, 220], 0.48), answer: "Повторяющийся ход F–A–C–A" },
  { id: 7, media: makeToneTrack([440, 493.88, 587.33], 0.56), answer: "Подъём A–B–D" },
  { id: 8, media: makeToneTrack([311.13, 369.99, 466.16], 0.54), answer: "Кластер Es–F♯–B" },
  { id: 9, media: makeToneTrack([196, 246.94, 293.66, 392], 0.43), answer: "Сочетание G–B–D–G" },
  { id: 10, media: makeToneTrack([523.25, 493.88, 440, 392], 0.5), answer: "Нисходящая линия C–B–A–G" },
];

export const moviesItems = [
  { id: 1, media: makePoster("Интерстеллар", "#0c3b78", "Горизонт кукурузного поля и одинокий космический корабль"), answer: "Интерстеллар" },
  { id: 2, media: makePoster("Назад в будущее", "#8f4d16", "Машина времени, искры и 88 миль в час"), answer: "Назад в будущее" },
  { id: 3, media: makePoster("Титаник", "#12364a", "Океанский лайнер в сумерках, холодный сине-голубой свет"), answer: "Титаник" },
  { id: 4, media: makePoster("Король Лев", "#bb7a1c", "Тёплый свет саванны и высокая скала"), answer: "Король Лев" },
  { id: 5, media: makePoster("Начало", "#31445f", "Город складывается сам на себя"), answer: "Начало" },
  { id: 6, media: makePoster("Матрица", "#18381f", "Зелёный цифровой дождь и чёрные силуэты"), answer: "Матрица" },
  { id: 7, media: makePoster("Джокер", "#6a1f28", "Одинокий персонаж в свете уличных фонарей"), answer: "Джокер" },
  { id: 8, media: makePoster("Аватар", "#16506b", "Сияющий лес и парящие горы"), answer: "Аватар" },
  { id: 9, media: makePoster("Дюна", "#9b6731", "Пыльная дымка, дюны и силуэт всадника вдали"), answer: "Дюна" },
  { id: 10, media: makePoster("Гарри Поттер", "#49311c", "Башни замка, ночное небо и вспышка палочки"), answer: "Гарри Поттер" },
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

/**
 * @param {"music"|"movies"|"facts"} category
 */
export function getItems(category) {
  const base = category === "music" ? musicItems : category === "movies" ? moviesItems : factsItems;
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
