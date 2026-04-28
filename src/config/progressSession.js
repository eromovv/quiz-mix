/** Значение по умолчанию, если переменные окружения не заданы или некорректны (6 ч). */
const DEFAULT_SESSION_MS = 6 * 60 * 60 * 1000;

function readProgressSessionMs() {
  const msRaw = import.meta.env.VITE_QUIZ_SESSION_MS;
  if (msRaw !== undefined && String(msRaw).trim() !== "") {
    const ms = Number(String(msRaw).trim());
    if (Number.isFinite(ms) && ms > 0) {
      return Math.floor(ms);
    }
  }

  const hoursRaw = import.meta.env.VITE_QUIZ_SESSION_HOURS;
  if (hoursRaw !== undefined && String(hoursRaw).trim() !== "") {
    const h = Number(String(hoursRaw).replace(",", ".").trim());
    if (Number.isFinite(h) && h > 0) {
      return Math.floor(h * 60 * 60 * 1000);
    }
  }

  return DEFAULT_SESSION_MS;
}

/**
 * Длительность сессии: прогресс хранится в течение этого интервала (мс).
 * Задаётся через `VITE_QUIZ_SESSION_MS` или `VITE_QUIZ_SESSION_HOURS` (.env при сборке/запуске).
 */
export const PROGRESS_SESSION_MS = readProgressSessionMs();
