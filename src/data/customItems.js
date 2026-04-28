import { makeToneTrack } from "./itemFactories.js";

export const CUSTOM_CARDS_KEY = "quiz_custom_cards";

function emptyStore() {
  return {
    music: [],
    movies: [],
    facts: [],
    overrides: { music: {}, movies: {}, facts: {} },
  };
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
      overrides: {
        music: data.overrides && data.overrides.music && typeof data.overrides.music === "object" ? data.overrides.music : {},
        movies: data.overrides && data.overrides.movies && typeof data.overrides.movies === "object" ? data.overrides.movies : {},
        facts: data.overrides && data.overrides.facts && typeof data.overrides.facts === "object" ? data.overrides.facts : {},
      },
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
export function rowToItem(category, row) {
  if (category === "music") {
    if (row.audioUrl) {
      return {
        id: row.id,
        media: {
          type: "audio",
          src: row.audioUrl,
        },
        answer: row.answer,
      };
    }
    return { id: row.id, media: makeToneTrack(row.freqs, row.noteDuration), answer: row.answer };
  }
  if (category === "movies") {
    return {
      id: row.id,
      media: {
        type: "video",
        src: row.videoUrl || "",
      },
      answer: row.answer,
    };
  }
  return { id: row.id, question: row.question, answer: row.answer, description: row.description };
}

/**
 * @param {"music"|"movies"|"facts"} category
 * @param {number} id
 * @param {object} payload
 */
function payloadToRow(category, id, payload) {
  if (category === "music") {
    if (payload.audioUrl) {
      return {
        id,
        audioUrl: payload.audioUrl.trim(),
        answer: payload.answer.trim(),
      };
    }
    return {
      id,
      freqs: payload.freqs,
      noteDuration: payload.noteDuration,
      answer: payload.answer.trim(),
    };
  }
  if (category === "movies") {
    return {
      id,
      videoUrl: payload.videoUrl.trim(),
      answer: payload.answer.trim(),
    };
  }
  return {
    id,
    question: payload.question.trim(),
    answer: Boolean(payload.answer),
    description: payload.description.trim(),
  };
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
  data[category].push(payloadToRow(category, id, payload));
  writeStore(data);
  return id;
}

/**
 * @param {"music"|"movies"|"facts"} category
 */
export function getBaseOverrideRows(category) {
  const data = readStore();
  return data.overrides[category] || {};
}

/**
 * Сырая строка из localStorage для редактирования.
 * @param {"music"|"movies"|"facts"} category
 * @param {number} id
 */
export function getCustomRawRow(category, id) {
  const data = readStore();
  const list = data[category] || [];
  return list.find((r) => r.id === id) ?? null;
}

/**
 * @param {"music"|"movies"|"facts"} category
 * @param {number} id
 */
export function removeCustomCard(category, id) {
  const data = readStore();
  const list = data[category] || [];
  const nextList = list.filter((r) => r.id !== id);
  if (nextList.length === list.length) {
    return false;
  }
  data[category] = nextList;
  writeStore(data);
  return true;
}

/**
 * @param {"music"|"movies"|"facts"} category
 * @param {number} id
 * @param {object} payload — как у addCustomCard
 */
export function updateCustomCard(category, id, payload) {
  const data = readStore();
  const list = [...(data[category] || [])];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) {
    return false;
  }
  list[idx] = payloadToRow(category, id, payload);
  data[category] = list;
  writeStore(data);
  return true;
}

/**
 * @param {"music"|"movies"|"facts"} category
 * @param {number} id
 * @param {object} payload — как у addCustomCard
 */
export function updateBaseCard(category, id, payload) {
  const data = readStore();
  data.overrides[category] = {
    ...(data.overrides[category] || {}),
    [id]: payloadToRow(category, id, payload),
  };
  writeStore(data);
  return true;
}

export function parseFreqs(input) {
  return input
    .split(/[,\s]+/)
    .map((s) => parseFloat(s.replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n > 0);
}
