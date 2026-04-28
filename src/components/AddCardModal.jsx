import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { CATEGORIES } from "../data/quizData";
import { addCustomCard, getCustomRawRow, updateBaseCard, updateCustomCard } from "../data/customItems";

const BLOB_UPLOAD_ENDPOINT = "/api/blob-upload";

const defaultMusic = {
  musicAudioUrl: "",
  musicAnswer: "",
};

const defaultMovies = {
  mvVideoUrl: "",
  mvAnswer: "",
};

const defaultFacts = {
  factQuestion: "",
  factDesc: "",
  factTrue: "true",
};

/**
 * @param {object} props
 * @param {"music"|"movies"|"facts"} props.category
 * @param {number | null} props.editCardId
 * @param {"base"|"custom"|null} props.editSource
 * @param {object | null} props.initialRow
 * @param {() => void} props.onClose
 * @param {() => void} props.onSuccess
 */
export function AddCardModal({ category, editCardId, editSource, initialRow, onClose, onSuccess }) {
  const title = CATEGORIES[category].title;
  const isEdit = editCardId != null;
  const [error, setError] = useState(null);

  const [musicAudioUrl, setMusicAudioUrl] = useState(defaultMusic.musicAudioUrl);
  const [musicAnswer, setMusicAnswer] = useState(defaultMusic.musicAnswer);
  const [musicFile, setMusicFile] = useState(null);
  const [musicUploading, setMusicUploading] = useState(false);

  const [mvVideoUrl, setMvVideoUrl] = useState(defaultMovies.mvVideoUrl);
  const [mvAnswer, setMvAnswer] = useState(defaultMovies.mvAnswer);
  const [mvFile, setMvFile] = useState(null);
  const [mvUploading, setMvUploading] = useState(false);

  const [factQuestion, setFactQuestion] = useState(defaultFacts.factQuestion);
  const [factDesc, setFactDesc] = useState(defaultFacts.factDesc);
  const [factTrue, setFactTrue] = useState(defaultFacts.factTrue);

  useEffect(() => {
    setError(null);

    function applyDefaults() {
      setMusicAudioUrl(defaultMusic.musicAudioUrl);
      setMusicAnswer(defaultMusic.musicAnswer);
      setMusicFile(null);
      setMvVideoUrl(defaultMovies.mvVideoUrl);
      setMvAnswer(defaultMovies.mvAnswer);
      setMvFile(null);
      setFactQuestion(defaultFacts.factQuestion);
      setFactDesc(defaultFacts.factDesc);
      setFactTrue(defaultFacts.factTrue);
    }

    if (editCardId == null) {
      applyDefaults();
      return;
    }

    const row = initialRow ?? getCustomRawRow(category, editCardId);
    if (!row) {
      applyDefaults();
      return;
    }

    if (category === "music") {
      setMusicAudioUrl(row.audioUrl || "");
      setMusicAnswer(row.answer);
      setMusicFile(null);
    } else if (category === "movies") {
      setMvVideoUrl(row.videoUrl || "");
      setMvAnswer(row.answer);
      setMvFile(null);
    } else {
      setFactQuestion(row.question);
      setFactDesc(row.description);
      setFactTrue(row.answer ? "true" : "false");
    }
  }, [editCardId, category, initialRow]);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (category === "music") {
      if (!musicAudioUrl.trim() || !musicAnswer.trim()) {
        setError("Загрузите аудиофайл и укажите правильный ответ.");
        return;
      }
      const payload = { audioUrl: musicAudioUrl, answer: musicAnswer };
      if (isEdit && editCardId != null) {
        if (editSource === "base") {
          updateBaseCard("music", editCardId, payload);
        } else {
          updateCustomCard("music", editCardId, payload);
        }
      } else {
        addCustomCard("music", payload);
      }
    } else if (category === "movies") {
      if (!mvVideoUrl.trim() || !mvAnswer.trim()) {
        setError("Загрузите видеофайл и укажите правильный ответ.");
        return;
      }
      const payload = { videoUrl: mvVideoUrl, answer: mvAnswer };
      if (isEdit && editCardId != null) {
        if (editSource === "base") {
          updateBaseCard("movies", editCardId, payload);
        } else {
          updateCustomCard("movies", editCardId, payload);
        }
      } else {
        addCustomCard("movies", payload);
      }
    } else {
      if (!factQuestion.trim() || !factDesc.trim()) {
        setError("Заполните утверждение и пояснение.");
        return;
      }
      const payload = {
        question: factQuestion,
        description: factDesc,
        answer: factTrue === "true",
      };
      if (isEdit && editCardId != null) {
        if (editSource === "base") {
          updateBaseCard("facts", editCardId, payload);
        } else {
          updateCustomCard("facts", editCardId, payload);
        }
      } else {
        addCustomCard("facts", payload);
      }
    }
    onSuccess();
  }

  async function handleMovieFileUpload() {
    if (!mvFile) {
      setError("Выберите видеофайл для загрузки.");
      return;
    }

    setError(null);
    setMvUploading(true);
    try {
      const blob = await upload(`quiz-mix/movies/${mvFile.name}`, mvFile, {
        access: "public",
        handleUploadUrl: BLOB_UPLOAD_ENDPOINT,
      });
      setMvVideoUrl(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить файл в Vercel Blob.");
    } finally {
      setMvUploading(false);
    }
  }

  async function handleMusicFileUpload() {
    if (!musicFile) {
      setError("Выберите аудиофайл для загрузки.");
      return;
    }

    setError(null);
    setMusicUploading(true);
    try {
      const blob = await upload(`quiz-mix/music/${musicFile.name}`, musicFile, {
        access: "public",
        handleUploadUrl: BLOB_UPLOAD_ENDPOINT,
      });
      setMusicAudioUrl(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить файл в Vercel Blob.");
    } finally {
      setMusicUploading(false);
    }
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
          <h2 id="add-card-title">
            {isEdit ? "Изменить карточку" : "Новая карточка"}: {title}
          </h2>
          <button className="control-button secondary" type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <form className="add-card-form" onSubmit={handleSubmit}>
          {category === "music" ? (
            <>
              <label className="form-field">
                <span>Загрузить музыку в Vercel Blob</span>
                <input accept="audio/*" onChange={(e) => setMusicFile(e.target.files?.[0] ?? null)} type="file" />
              </label>
              <div className="upload-row">
                <button className="control-button secondary" disabled={!musicFile || musicUploading} onClick={handleMusicFileUpload} type="button">
                  {musicUploading ? "Загрузка..." : "Загрузить файл"}
                </button>
                {musicFile ? <span className="upload-file-name">{musicFile.name}</span> : null}
              </div>
              <label className="form-field">
                <span>Правильный ответ</span>
                <input value={musicAnswer} onChange={(e) => setMusicAnswer(e.target.value)} type="text" required />
              </label>
            </>
          ) : null}
          {category === "movies" ? (
            <>
              <label className="form-field">
                <span>Загрузить видео в Vercel Blob</span>
                <input
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  onChange={(e) => setMvFile(e.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
              <div className="upload-row">
                <button className="control-button secondary" disabled={!mvFile || mvUploading} onClick={handleMovieFileUpload} type="button">
                  {mvUploading ? "Загрузка..." : "Загрузить файл"}
                </button>
                {mvFile ? <span className="upload-file-name">{mvFile.name}</span> : null}
              </div>
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
              {isEdit ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
