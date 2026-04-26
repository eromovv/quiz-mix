function escapeSvg(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function makeToneTrack(sequence, noteDuration) {
  return {
    notes: sequence.map((frequency, index) => ({
      frequency,
      duration: noteDuration,
      start: index * (noteDuration + 0.1),
    })),
  };
}

export function makePoster(title, background, clue) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="#dff1ff" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#g)"/>
      <circle cx="1030" cy="170" r="120" fill="rgba(255,255,255,0.16)"/>
      <circle cx="260" cy="540" r="190" fill="rgba(255,255,255,0.1)"/>
      <text x="100" y="180" fill="#f7fbff" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="40">Кино: подсказка</text>
      <text x="100" y="300" fill="#ffffff" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="96">${escapeSvg(title)}</text>
      <text x="100" y="420" fill="#eef7ff" font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="42">${escapeSvg(clue)}</text>
      <rect x="100" y="500" width="360" height="8" rx="4" fill="#f7fbff" opacity="0.7"/>
      <rect x="100" y="532" width="220" height="8" rx="4" fill="#f7fbff" opacity="0.45"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
