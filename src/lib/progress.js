import { PROGRESS_SESSION_MS } from "../config/progressSession.js";
import { CATEGORIES, getItems, getVisibleCategoryKeys, STORAGE_KEY } from "../data/quizData";

export { PROGRESS_SESSION_MS };

const BUNDLE_VERSION = 1;

export function getProgressStorageKey(roomId) {
  return roomId ? `${STORAGE_KEY}_room_${roomId}` : STORAGE_KEY;
}

/**
 * Подгоняет длины массивов прогресса к текущему числу вопросов (в т.ч. пользовательских).
 * @param {Record<string, boolean[]>|null|undefined} progress
 * @returns {Record<string, boolean[]>}
 */
export function alignProgressToItems(progress) {
  /** @type {Record<string, boolean[]>} */
  const out = { ...progress };
  const visibleKeys = getVisibleCategoryKeys();

  for (const key of visibleKeys) {
    const target = getItems(key).length;
    const cur = Array.isArray(out[key]) ? out[key] : [];
    if (cur.length < target) {
      out[key] = [...cur, ...Array(target - cur.length).fill(false)];
    } else if (cur.length > target) {
      out[key] = cur.slice(0, target);
    }
  }

  for (const key of Object.keys(CATEGORIES)) {
    if (!visibleKeys.includes(key)) {
      delete out[key];
    }
  }

  return out;
}

export function createDefaultProgress() {
  /** @type {Record<string, boolean[]>} */
  const result = {};
  for (const key of getVisibleCategoryKeys()) {
    result[key] = Array(getItems(key).length).fill(false);
  }
  return result;
}

function isValidProgressShape(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const visibleKeys = getVisibleCategoryKeys();
  if (visibleKeys.length === 0) {
    return Object.keys(value).length === 0 || Object.keys(value).every((key) => Array.isArray(value[key]));
  }

  return visibleKeys.every((key) => Array.isArray(value[key]) && value[key].every((item) => typeof item === "boolean"));
}

/**
 * @param {unknown} parsed
 */
function parseBundle(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return { kind: "invalid" };
  }

  if (
    parsed.v === BUNDLE_VERSION &&
    typeof parsed.startedAt === "number" &&
    parsed.data &&
    isValidProgressShape(parsed.data)
  ) {
    if (Date.now() - parsed.startedAt > PROGRESS_SESSION_MS) {
      return { kind: "expired" };
    }
    return { kind: "ok", startedAt: parsed.startedAt, data: parsed.data };
  }

  if (isValidProgressShape(parsed)) {
    return { kind: "legacy", data: parsed };
  }

  return { kind: "invalid" };
}

/**
 * @param {Record<string, boolean[]>} data
 * @param {number} startedAt
 */
function persistBundle(data, startedAt, storageKey = STORAGE_KEY) {
  const payload = { v: BUNDLE_VERSION, startedAt, data };
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
}

export function loadProgress(storageKey = STORAGE_KEY) {
  const fallback = createDefaultProgress();

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      persistBundle(fallback, Date.now(), storageKey);
      return fallback;
    }

    const parsed = JSON.parse(raw);
    const pb = parseBundle(parsed);

    if (pb.kind === "ok") {
      const aligned = alignProgressToItems(pb.data);
      const nextStr = JSON.stringify({ v: BUNDLE_VERSION, startedAt: pb.startedAt, data: aligned });
      if (nextStr !== raw) {
        window.localStorage.setItem(storageKey, nextStr);
      }
      return aligned;
    }

    if (pb.kind === "legacy") {
      const startedAt = Date.now();
      const aligned = alignProgressToItems(pb.data);
      persistBundle(aligned, startedAt, storageKey);
      return aligned;
    }

    if (pb.kind === "expired") {
      persistBundle(fallback, Date.now(), storageKey);
      return fallback;
    }

    persistBundle(fallback, Date.now(), storageKey);
    return fallback;
  } catch {
    persistBundle(fallback, Date.now(), storageKey);
    return fallback;
  }
}

export function saveProgress(progress, storageKey = STORAGE_KEY) {
  try {
    const aligned = alignProgressToItems(progress);
    const raw = window.localStorage.getItem(storageKey);
    let startedAt = Date.now();

    if (raw) {
      const pb = parseBundle(JSON.parse(raw));
      if (pb.kind === "ok") {
        startedAt = pb.startedAt;
      }
    }

    persistBundle(aligned, startedAt, storageKey);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function countCompleted(progress, category) {
  return progress[category].filter(Boolean).length;
}
