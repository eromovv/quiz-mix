const MODE_STORAGE_KEY = "quiz_app_mode";

/** @typedef {"dev"|"preview"} AppMode */

export const APP_MODE = {
  dev: "dev",
  preview: "preview",
};

/**
 * @returns {AppMode}
 */
export function loadAppMode() {
  if (typeof window === "undefined") {
    return APP_MODE.preview;
  }
  try {
    const raw = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (raw === APP_MODE.dev || raw === APP_MODE.preview) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return APP_MODE.preview;
}

/**
 * @param {AppMode} mode
 */
export function saveAppMode(mode) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
