import { CATEGORIES, getItems, STORAGE_KEY } from "../data/quizData";

/**
 * Подгоняет длины массивов прогресса к текущему числу вопросов (в т.ч. пользовательских).
 * @param {Record<string, boolean[]>|null|undefined} progress
 * @returns {Record<string, boolean[]>}
 */
export function alignProgressToItems(progress) {
  /** @type {Record<string, boolean[]>} */
  const out = { ...progress };
  for (const key of Object.keys(CATEGORIES)) {
    const target = getItems(key).length;
    const cur = Array.isArray(out[key]) ? out[key] : [];
    if (cur.length < target) {
      out[key] = [...cur, ...Array(target - cur.length).fill(false)];
    } else if (cur.length > target) {
      out[key] = cur.slice(0, target);
    }
  }
  return out;
}

export function createDefaultProgress() {
  /** @type {Record<string, boolean[]>} */
  const result = {};
  for (const key of Object.keys(CATEGORIES)) {
    result[key] = Array(getItems(key).length).fill(false);
  }
  return result;
}

function isValidProgressShape(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.keys(CATEGORIES).every(
    (key) => Array.isArray(value[key]) && value[key].every((item) => typeof item === "boolean")
  );
}

export function loadProgress() {
  const fallback = createDefaultProgress();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!isValidProgressShape(parsed)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }

    const aligned = alignProgressToItems(parsed);
    const str = JSON.stringify(aligned);
    if (str !== raw) {
      window.localStorage.setItem(STORAGE_KEY, str);
    }

    return aligned;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

export function saveProgress(progress) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function countCompleted(progress, category) {
  return progress[category].filter(Boolean).length;
}
