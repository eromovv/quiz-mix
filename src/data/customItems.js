import { makeToneTrack } from "./itemFactories.js";

export const CUSTOM_CARDS_KEY = "quiz_custom_cards";
const ROOM_CATEGORY_ORDER = ["music", "movies", "facts"];
const ROOM_CATEGORY_KEYS = new Set(ROOM_CATEGORY_ORDER);

let activeCustomCardsStore = null;

function emptyStore() {
  return {
    categories: [],
    music: [],
    movies: [],
    facts: [],
    overrides: { music: {}, movies: {}, facts: {} },
  };
}

function inferLegacyCategories(data) {
  const inferred = ROOM_CATEGORY_ORDER.filter((key) => {
    const list = data[key];
    if (Array.isArray(list) && list.length > 0) {
      return true;
    }
    const overrides = data.overrides?.[key];
    return overrides && typeof overrides === "object" && Object.keys(overrides).length > 0;
  });
  return inferred;
}

export function normalizeCustomCardsStore(data) {
  if (!data || typeof data !== "object") {
    return emptyStore();
  }

  const categories = Array.isArray(data.categories)
    ? data.categories.filter((key) => ROOM_CATEGORY_KEYS.has(key))
    : inferLegacyCategories(data);

  return {
    categories,
    music: Array.isArray(data.music) ? data.music : [],
    movies: Array.isArray(data.movies) ? data.movies : [],
    facts: Array.isArray(data.facts) ? data.facts : [],
    overrides: {
      music: data.overrides && data.overrides.music && typeof data.overrides.music === "object" ? data.overrides.music : {},
      movies: data.overrides && data.overrides.movies && typeof data.overrides.movies === "object" ? data.overrides.movies : {},
      facts: data.overrides && data.overrides.facts && typeof data.overrides.facts === "object" ? data.overrides.facts : {},
    },
  };
}

export function createEmptyCardsStore() {
  return emptyStore();
}

export function isRoomCardsContext() {
  return activeCustomCardsStore !== null;
}

export function getRoomCategories() {
  return [...readStore().categories];
}

/**
 * @param {"music"|"movies"|"facts"} category
 */
export function addRoomCategory(category) {
  if (!ROOM_CATEGORY_KEYS.has(category)) {
    return false;
  }

  const data = readStore();
  if (data.categories.includes(category)) {
    return false;
  }

  data.categories = [...data.categories, category];
  writeStore(data);
  return true;
}

export function exportActiveCardsStore() {
  return readStore();
}

export function setActiveCustomCardsStore(data) {
  activeCustomCardsStore = data ? normalizeCustomCardsStore(data) : null;
}

function readLocalStore() {
  if (typeof window === "undefined") {
    return emptyStore();
  }
  try {
    const raw = window.localStorage.getItem(CUSTOM_CARDS_KEY);
    if (!raw) {
      return emptyStore();
    }
    const data = JSON.parse(raw);
    return normalizeCustomCardsStore(data);
  } catch {
    return emptyStore();
  }
}

function readStore() {
  return activeCustomCardsStore ? normalizeCustomCardsStore(activeCustomCardsStore) : readLocalStore();
}

function writeStore(data) {
  const normalized = normalizeCustomCardsStore(data);
  if (activeCustomCardsStore !== null) {
    activeCustomCardsStore = normalized;
    return;
  }
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CUSTOM_CARDS_KEY, JSON.stringify(normalized));
}

export function exportLocalCustomCardsStore() {
  return readLocalStore();
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
