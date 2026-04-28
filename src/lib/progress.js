import { PROGRESS_SESSION_MS } from "../config/progressSession.js";
import { CATEGORIES, getItems, STORAGE_KEY } from "../data/quizData";

export { PROGRESS_SESSION_MS };

const BUNDLE_VERSION = 1;

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
    (key) => Array.isArray(value[key]) && value[key].every((item) => typeof item === "boolean"),
  );
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
function persistBundle(data, startedAt) {
  const payload = { v: BUNDLE_VERSION, startedAt, data };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadProgress() {
  const fallback = createDefaultProgress();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persistBundle(fallback, Date.now());
      return fallback;
    }

    const parsed = JSON.parse(raw);
    const pb = parseBundle(parsed);

    if (pb.kind === "ok") {
      const aligned = alignProgressToItems(pb.data);
      const nextStr = JSON.stringify({ v: BUNDLE_VERSION, startedAt: pb.startedAt, data: aligned });
      if (nextStr !== raw) {
        window.localStorage.setItem(STORAGE_KEY, nextStr);
      }
      return aligned;
    }

    if (pb.kind === "legacy") {
      const startedAt = Date.now();
      const aligned = alignProgressToItems(pb.data);
      persistBundle(aligned, startedAt);
      return aligned;
    }

    if (pb.kind === "expired") {
      persistBundle(fallback, Date.now());
      return fallback;
    }

    persistBundle(fallback, Date.now());
    return fallback;
  } catch {
    persistBundle(fallback, Date.now());
    return fallback;
  }
}

export function saveProgress(progress) {
  try {
    const aligned = alignProgressToItems(progress);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    let startedAt = Date.now();

    if (raw) {
      const pb = parseBundle(JSON.parse(raw));
      if (pb.kind === "ok") {
        startedAt = pb.startedAt;
      }
    }

    persistBundle(aligned, startedAt);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function countCompleted(progress, category) {
  return progress[category].filter(Boolean).length;
}
