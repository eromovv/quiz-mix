import { useMemo } from "react";
import { createTranslator } from "../lib/i18n";

function QuizzesIllustration() {
  return (
    <svg aria-hidden="true" className="platform-illustration-svg" viewBox="0 0 320 200">
      <rect fill="rgba(132, 215, 255, 0.22)" height="118" rx="16" width="92" x="16" y="36" />
      <rect fill="rgba(92, 174, 255, 0.18)" height="118" rx="16" width="92" x="114" y="36" />
      <rect fill="rgba(185, 228, 255, 0.28)" height="118" rx="16" width="92" x="212" y="36" />
      <circle cx="62" cy="72" fill="#5caeff" r="14" />
      <path d="M56 72 L62 66 L68 72 L62 78 Z" fill="#fff" />
      <rect fill="#5caeff" height="8" rx="4" width="48" x="38" y="98" />
      <rect fill="rgba(45, 127, 229, 0.35)" height="6" rx="3" width="56" x="34" y="114" />
      <rect fill="#2d7fe5" height="22" rx="11" width="64" x="30" y="126" />
      <rect fill="#2d7fe5" height="34" rx="6" width="52" x="134" y="68" />
      <polygon fill="rgba(255,255,255,0.9)" points="148,82 148,98 162,90" />
      <rect fill="#5caeff" height="8" rx="4" width="48" x="136" y="114" />
      <rect fill="#2d7fe5" height="22" rx="11" width="64" x="128" y="126" />
      <circle cx="258" cy="78" fill="#5caeff" r="16" />
      <path d="M252 78 L264 78" stroke="#fff" strokeLinecap="round" strokeWidth="3" />
      <path d="M258 72 L258 84" stroke="#fff" strokeLinecap="round" strokeWidth="3" />
      <rect fill="#5caeff" height="8" rx="4" width="48" x="234" y="98" />
      <rect fill="#2d7fe5" height="22" rx="11" width="64" x="226" y="126" />
    </svg>
  );
}

function RoomsIllustration() {
  return (
    <svg aria-hidden="true" className="platform-illustration-svg" viewBox="0 0 320 200">
      <rect fill="rgba(255,255,255,0.92)" height="132" rx="18" stroke="rgba(92, 174, 255, 0.35)" strokeWidth="2" width="220" x="50" y="28" />
      <rect fill="#5caeff" height="10" rx="5" width="72" x="72" y="52" />
      <rect fill="rgba(92, 174, 255, 0.2)" height="8" rx="4" width="140" x="72" y="72" />
      <rect fill="rgba(92, 174, 255, 0.16)" height="8" rx="4" width="120" x="72" y="88" />
      <rect fill="linear-gradient" height="28" rx="14" width="96" x="72" y="118" />
      <rect fill="#2d7fe5" height="28" rx="14" width="96" x="72" y="118" />
      <path d="M228 88 C248 88 262 102 262 122 C262 142 248 156 228 156" fill="none" stroke="#5caeff" strokeDasharray="6 6" strokeWidth="2" />
      <circle cx="278" cy="122" fill="#daf5df" r="28" stroke="rgba(80, 160, 100, 0.35)" strokeWidth="2" />
      <path d="M268 122 L276 130 L290 114" fill="none" stroke="#2d5a3a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <circle cx="36" cy="122" fill="#daf5df" r="20" stroke="rgba(80, 160, 100, 0.35)" strokeWidth="2" />
      <circle cx="24" cy="156" fill="rgba(92, 174, 255, 0.18)" r="14" />
      <circle cx="296" cy="56" fill="rgba(92, 174, 255, 0.18)" r="12" />
    </svg>
  );
}

function EditorIllustration() {
  return (
    <svg aria-hidden="true" className="platform-illustration-svg" viewBox="0 0 320 200">
      <rect fill="rgba(255,255,255,0.92)" height="144" rx="18" stroke="rgba(92, 174, 255, 0.35)" strokeWidth="2" width="248" x="36" y="24" />
      <rect fill="rgba(92, 174, 255, 0.14)" height="56" rx="12" width="208" x="56" y="44" />
      <circle cx="88" cy="72" fill="#5caeff" r="16" />
      <rect fill="#5caeff" height="8" rx="4" width="96" x="112" y="64" />
      <rect fill="rgba(45, 127, 229, 0.25)" height="6" rx="3" width="120" x="112" y="80" />
      <rect fill="rgba(92, 174, 255, 0.12)" height="10" rx="5" width="180" x="56" y="116" />
      <rect fill="rgba(92, 174, 255, 0.12)" height="10" rx="5" width="148" x="56" y="134" />
      <rect fill="#2d7fe5" height="24" rx="12" width="88" x="176" y="128" />
      <path d="M252 52 L268 68 L244 92 L224 92 L224 72 Z" fill="#daf5df" stroke="rgba(80, 160, 100, 0.45)" strokeLinejoin="round" strokeWidth="2" />
      <path d="M244 52 L252 60" stroke="#2d5a3a" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

const FEATURES = [
  { id: "quizzes", titleKey: "platformFeatureQuizzesTitle", textKey: "platformFeatureQuizzesText", Illustration: QuizzesIllustration },
  { id: "rooms", titleKey: "platformFeatureRoomsTitle", textKey: "platformFeatureRoomsText", Illustration: RoomsIllustration },
  { id: "editor", titleKey: "platformFeatureEditorTitle", textKey: "platformFeatureEditorText", Illustration: EditorIllustration },
];

export function PlatformIntro({ language }) {
  const t = useMemo(() => createTranslator(language), [language]);

  return (
    <div className="platform-intro">
      <div className="platform-intro-hero">
        <h2 className="platform-intro-title">{t("platformIntroTitle")}</h2>
        <p className="platform-intro-lead">{t("platformIntroLead")}</p>
      </div>

      <div className="platform-feature-grid">
        {FEATURES.map(({ id, titleKey, textKey, Illustration }) => (
          <article className="platform-feature-card" key={id}>
            <div className="platform-feature-visual">
              <Illustration />
            </div>
            <h3>{t(titleKey)}</h3>
            <p>{t(textKey)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
