import { useState } from "react";
import { CATEGORIES } from "../data/quizData";
import { addCustomCard, parseFreqs } from "../data/customItems";

/**
 * @param {object} props
 * @param {"music"|"movies"|"facts"} props.category
 * @param {() => void} props.onClose
 * @param {() => void} props.onSuccess
 */
export function AddCardModal({ category, onClose, onSuccess }) {
  const title = CATEGORIES[category].title;
  const [error, setError] = useState(null);

  const [musicAnswer, setMusicAnswer] = useState("");
  const [musicFreqs, setMusicFreqs] = useState("262, 330, 392");
  const [musicNoteDur, setMusicNoteDur] = useState(0.45);

  const [mvTitle, setMvTitle] = useState("");
  const [mvBg, setMvBg] = useState("#0c3b78");
  const [mvClue, setMvClue] = useState("");
  const [mvAnswer, setMvAnswer] = useState("");

  const [factQuestion, setFactQuestion] = useState("");
  const [factDesc, setFactDesc] = useState("");
  const [factTrue, setFactTrue] = useState("true");

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (category === "music") {
      const freqs = parseFreqs(musicFreqs);
      if (!musicAnswer.trim()) {
        setError("Введите ответ");
        return;
      }
      if (freqs.length < 1) {
        setError("Укажите хотя бы одну частоту нот (числа через запятую).");
        return;
      }
      const noteDur = Number(musicNoteDur);
      if (!Number.isFinite(noteDur) || noteDur <= 0) {
        setError("Длительность ноты должна быть больше 0.");
        return;
      }
      addCustomCard("music", { freqs, noteDuration: noteDur, answer: musicAnswer });
    } else if (category === "movies") {
      if (!mvTitle.trim() || !mvClue.trim() || !mvAnswer.trim()) {
        setError("Заполните заголовок на афише, подсказку и правильный ответ.");
        return;
      }
      addCustomCard("movies", { title: mvTitle, background: mvBg, clue: mvClue, answer: mvAnswer });
    } else {
      if (!factQuestion.trim() || !factDesc.trim()) {
        setError("Заполните утверждение и пояснение.");
        return;
      }
      addCustomCard("facts", { question: factQuestion, description: factDesc, answer: factTrue === "true" });
    }
    onSuccess();
  }

  return (
    <div
      className="modal-root add-card-modal-root"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div className="modal-card add-card-form-card" role="dialog" aria-modal="true" aria-labelledby="add-card-title">
        <div className="modal-header add-card-form-header">
          <h2 id="add-card-title">Новая карточка: {title}</h2>
          <button className="control-button secondary" type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <form className="add-card-form" onSubmit={handleSubmit}>
          {category === "music" ? (
            <>
              <label className="form-field">
                <span>Частоты нот (Гц, через запятую)</span>
                <input value={musicFreqs} onChange={(e) => setMusicFreqs(e.target.value)} type="text" required />
              </label>
              <label className="form-field">
                <span>Длительность одной ноты (сек.)</span>
                <input
                  value={musicNoteDur}
                  onChange={(e) => setMusicNoteDur(Number(e.target.value))}
                  type="number"
                  min="0.05"
                  max="2"
                  step="0.01"
                  required
                />
              </label>
              <label className="form-field">
                <span>Правильный ответ</span>
                <input value={musicAnswer} onChange={(e) => setMusicAnswer(e.target.value)} type="text" required />
              </label>
            </>
          ) : null}
          {category === "movies" ? (
            <>
              <label className="form-field">
                <span>Заголовок на «афише» (как в ответе)</span>
                <input value={mvTitle} onChange={(e) => setMvTitle(e.target.value)} type="text" required />
              </label>
              <label className="form-field">
                <span>Цвет фона (HEX, например #0c3b78)</span>
                <input value={mvBg} onChange={(e) => setMvBg(e.target.value)} type="text" required />
              </label>
              <label className="form-field">
                <span>Текст подсказки (сюжет, без спойлеров)</span>
                <textarea value={mvClue} onChange={(e) => setMvClue(e.target.value)} rows={3} required />
              </label>
              <label className="form-field">
                <span>Правильное название фильма</span>
                <input value={mvAnswer} onChange={(e) => setMvAnswer(e.target.value)} type="text" required />
              </label>
            </>
          ) : null}
          {category === "facts" ? (
            <>
              <label className="form-field">
                <span>Утверждение</span>
                <textarea value={factQuestion} onChange={(e) => setFactQuestion(e.target.value)} rows={3} required />
              </label>
              <label className="form-field">
                <span>Правда или ложь</span>
                <select value={factTrue} onChange={(e) => setFactTrue(e.target.value)}>
                  <option value="true">Верно</option>
                  <option value="false">Неверно</option>
                </select>
              </label>
              <label className="form-field">
                <span>Пояснение после ответа</span>
                <textarea value={factDesc} onChange={(e) => setFactDesc(e.target.value)} rows={4} required />
              </label>
            </>
          ) : null}
          <div className="modal-actions add-card-form-actions">
            <button className="control-button secondary" type="button" onClick={onClose}>
              Отмена
            </button>
            <button className="control-button primary" type="submit">
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
