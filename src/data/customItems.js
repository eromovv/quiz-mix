import { makePoster, makeToneTrack } from "./itemFactories.js";

export const CUSTOM_CARDS_KEY = "quiz_custom_cards";

function emptyStore() {
  return { music: [], movies: [], facts: [] };
}

function readStore() {
  if (typeof window === "undefined") {
    return emptyStore();
  }
  try {
    const raw = window.localStorage.getItem(CUSTOM_CARDS_KEY);
    if (!raw) {
      return emptyStore();
    }
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") {
      return emptyStore();
    }
    return {
      music: Array.isArray(data.music) ? data.music : [],
      movies: Array.isArray(data.movies) ? data.movies : [],
      facts: Array.isArray(data.facts) ? data.facts : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(data) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CUSTOM_CARDS_KEY, JSON.stringify(data));
}

/**
 * @param {"music"|"movies"|"facts"} category
 */
function rowToItem(category, row) {
  if (category === "music") {
    return { id: row.id, media: makeToneTrack(row.freqs, row.noteDuration), answer: row.answer };
  }
  if (category === "movies") {
    return { id: row.id, media: makePoster(row.title, row.background, row.clue), answer: row.answer };
  }
  return { id: row.id, question: row.question, answer: row.answer, description: row.description };
}

/**
 * @param {"music"|"movies"|"facts"} category
 */
export function getCustomItems(category) {
  const data = readStore();
  return (data[category] || []).map((row) => rowToItem(category, row));
}

/**
 * @param {"music"|"movies"|"facts"} category
 * @param {object} payload
 * @returns {number} id новой карточки
 */
export function addCustomCard(category, payload) {
  const data = readStore();
  const id = Date.now();
  if (category === "music") {
    data.music.push({
      id,
      freqs: payload.freqs,
      noteDuration: payload.noteDuration,
      answer: payload.answer.trim(),
    });
  } else if (category === "movies") {
    data.movies.push({
      id,
      title: payload.title.trim(),
      background: payload.background.trim() || "#2d5a8a",
      clue: payload.clue.trim(),
      answer: payload.answer.trim(),
    });
  } else {
    data.facts.push({
      id,
      question: payload.question.trim(),
      answer: Boolean(payload.answer),
      description: payload.description.trim(),
    });
  }
  writeStore(data);
  return id;
}

export function parseFreqs(input) {
  return input
    .split(/[,\s]+/)
    .map((s) => parseFloat(s.replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n > 0);
}
