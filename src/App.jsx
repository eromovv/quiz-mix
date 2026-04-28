import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AddCardModal } from "./components/AddCardModal";
import { removeCustomCard } from "./data/customItems";
import {
  CATEGORIES,
  getEditableItemRow,
  getItemCount,
  getItems,
  getRoundCount,
  getTotalQuestionCount,
  isCustomItemIndex,
  MUSIC_LISTEN_DURATION_SEC,
} from "./data/quizData";
import { APP_MODE, loadAppMode, saveAppMode } from "./lib/appMode";
import { alignProgressToItems, countCompleted, loadProgress, saveProgress } from "./lib/progress";
import { pluralRu } from "./lib/pluralRu";
import { loadTheme, saveTheme } from "./lib/theme";

export default function App() {
  const [progress, setProgress] = useState(() => loadProgress());
  const [uiTheme, setUiTheme] = useState(() => loadTheme());
  const [appMode, setAppMode] = useState(() => loadAppMode());
  const [cardRevision, setCardRevision] = useState(0);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    document.documentElement.dataset.uiTheme = uiTheme;
    saveTheme(uiTheme);
  }, [uiTheme]);

  useEffect(() => {
    document.documentElement.dataset.appMode = appMode;
    saveAppMode(appMode);
  }, [appMode]);

  return (
    <div className="app-shell">
      <AppHeader
        appMode={appMode}
        onSetAppMode={setAppMode}
        onToggleTheme={() => setUiTheme((t) => (t === "light" ? "dark" : "light"))}
        uiTheme={uiTheme}
      />
      <main>
        <Routes>
          <Route path="/" element={<HomePage cardRevision={cardRevision} progress={progress} />} />
          <Route
            path="/music"
            element={
              <QuizPage
                appMode={appMode}
                cardRevision={cardRevision}
                category="music"
                onCustomCardsChanged={() => setCardRevision((n) => n + 1)}
                progress={progress}
                setProgress={setProgress}
              />
            }
          />
          <Route
            path="/movies"
            element={
              <QuizPage
                appMode={appMode}
                cardRevision={cardRevision}
                category="movies"
                onCustomCardsChanged={() => setCardRevision((n) => n + 1)}
                progress={progress}
                setProgress={setProgress}
              />
            }
          />
          <Route
            path="/facts"
            element={
              <QuizPage
                appMode={appMode}
                cardRevision={cardRevision}
                category="facts"
                onCustomCardsChanged={() => setCardRevision((n) => n + 1)}
                progress={progress}
                setProgress={setProgress}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function AppHeader({ appMode, onSetAppMode, onToggleTheme, uiTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const isDark = uiTheme === "dark";
  const themeLabel = isDark ? "Светлая тема" : "Тёмная тема";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className={`back-link ${isHome ? "hidden" : ""}`} onClick={() => navigate("/")} type="button">
          Назад
        </button>
      </div>
      <div className="brand">
        <h1>Quiz Mix</h1>
      </div>
      <div className="topbar-right topbar-controls">
        <div className="mode-switch" role="group" aria-label="Режим приложения">
          <button
            className={`mode-switch-btn ${appMode === APP_MODE.preview ? "is-active" : ""}`}
            type="button"
            onClick={() => onSetAppMode(APP_MODE.preview)}
            title="Только прохождение квиза без правок карточек"
          >
            Превью
          </button>
          <button
            className={`mode-switch-btn ${appMode === APP_MODE.dev ? "is-active" : ""}`}
            type="button"
            onClick={() => onSetAppMode(APP_MODE.dev)}
            title="Редактирование: добавление, удаление и правка пользовательских карточек"
          >
            Редактор
          </button>
        </div>
        <button
          className="theme-toggle"
          type="button"
          onClick={onToggleTheme}
          title={themeLabel}
          aria-label={themeLabel}
        >
          {isDark ? "☀" : "🌙"}
        </button>
      </div>
    </header>
  );
}

function HomePage({ progress, cardRevision }) {
  const rounds = getRoundCount();
  const totalQuestions = getTotalQuestionCount();
  const heroLine = `${rounds} ${pluralRu(rounds, ["раунд", "раунда", "раундов"])}, ${totalQuestions} ${pluralRu(totalQuestions, ["вопрос", "вопроса", "вопросов"])}.`;

  return (
    <section className="hero" data-card-revision={cardRevision}>
      <div className="hero-copy">
        <h2>{heroLine}</h2>
      </div>
      <div className="category-list">
        {Object.entries(CATEGORIES).map(([key, value]) => {
          const cap = getItemCount(key);
          const done = cap > 0 && countCompleted(progress, key) === cap;
          return (
            <article className="category-card" data-theme={key} key={key}>
              <div>
                <h3>{value.title}</h3>
                <p className="progress-copy">{value.description}</p>
              </div>
              <div className="progress-pill">
                {countCompleted(progress, key)}/{cap}
              </div>
              {done ? (
                <span className="category-button category-link category-completed" role="status">
                  Выполнено
                </span>
              ) : (
                <NavLink className="category-button category-link" to={value.route}>
                  Открыть
                </NavLink>
              )}
            </article>
          );
        })}
      </div>
      <div className="stats-row">
        {Object.entries(CATEGORIES).map(([key, value]) => (
          <div className="stat-box" key={key}>
            <span className="stat-value">{countCompleted(progress, key)}</span>
            <p className="progress-copy">Карточек «{value.title}» пройдено</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuizPage({ appMode, category, cardRevision, onCustomCardsChanged, progress, setProgress }) {
  const items = useMemo(() => getItems(category), [category, cardRevision]);
  const info = CATEGORIES[category];
  const completedCount = countCompleted(progress, category);
  const [activeIndex, setActiveIndex] = useState(null);
  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [editCardId, setEditCardId] = useState(null);
  const [editSource, setEditSource] = useState(null);
  const [editInitialRow, setEditInitialRow] = useState(null);
  const isDevMode = appMode === APP_MODE.dev;

  function handleComplete(index) {
    setProgress((current) => {
      if (current[category][index]) {
        return current;
      }

      return {
        ...current,
        [category]: current[category].map((value, itemIndex) => (itemIndex === index ? true : value)),
      };
    });
  }

  function openAddCard() {
    setEditCardId(null);
    setEditSource(null);
    setEditInitialRow(null);
    setCardEditorOpen(true);
  }

  function handleEditFromModal() {
    if (activeIndex === null) {
      return;
    }
    const isCustom = isCustomItemIndex(category, activeIndex);
    const id = items[activeIndex].id;
    setActiveIndex(null);
    setEditCardId(id);
    setEditSource(isCustom ? "custom" : "base");
    setEditInitialRow(getEditableItemRow(category, activeIndex));
    setCardEditorOpen(true);
  }

  function handleDeleteCustomFromModal() {
    if (activeIndex === null) {
      return;
    }
    if (!isCustomItemIndex(category, activeIndex)) {
      return;
    }
    if (!window.confirm("Удалить эту пользовательскую карточку? Прогресс по ней будет сброшен.")) {
      return;
    }
    const idx = activeIndex;
    const id = items[idx].id;
    removeCustomCard(category, id);
    setProgress((p) => {
      const nextRow = [...p[category]];
      nextRow.splice(idx, 1);
      return alignProgressToItems({ ...p, [category]: nextRow });
    });
    setActiveIndex(null);
    onCustomCardsChanged();
  }

  return (
    <>
      <section className="quiz-layout">
        <div className="quiz-head">
          <div className="quiz-heading">
            <h2>{info.title}</h2>
            <p>{info.description}</p>
          </div>
          <div className="quiz-head-actions">
            <div className="progress-pill">
              {completedCount}/{items.length}
            </div>
            {isDevMode ? (
              <button
                className="add-card-btn"
                disabled={activeIndex !== null}
                onClick={openAddCard}
                title="Добавить карточку"
                type="button"
              >
                +
              </button>
            ) : null}
          </div>
        </div>
        <div className="tile-grid">
          {items.map((item, index) => {
            const isCompleted = progress[category][index];
            return (
              <button
                className={`tile ${isCompleted ? "completed" : ""}`}
                disabled={isCompleted}
                key={`${category}-${item.id}`}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        {completedCount === items.length ? <p className="empty-copy">Все вопросы этого раунда пройдены.</p> : null}
      </section>

      <QuestionModal
        canDeleteCard={isDevMode && activeIndex !== null && isCustomItemIndex(category, activeIndex)}
        canEditCard={isDevMode && activeIndex !== null}
        category={category}
        isDevMode={isDevMode}
        item={activeIndex === null ? null : items[activeIndex]}
        itemIndex={activeIndex}
        onDeleteCustomCard={handleDeleteCustomFromModal}
        onEditCard={handleEditFromModal}
        roundItemCount={items.length}
        onMarkComplete={() => {
          if (activeIndex !== null) {
            handleComplete(activeIndex);
          }
        }}
        onClose={(shouldComplete) => {
          if (shouldComplete && activeIndex !== null) {
            handleComplete(activeIndex);
          }
          setActiveIndex(null);
        }}
      />
      {cardEditorOpen ? (
        <AddCardModal
          category={category}
          editCardId={editCardId}
          editSource={editSource}
          initialRow={editInitialRow}
          onClose={() => {
            setCardEditorOpen(false);
            setEditCardId(null);
            setEditSource(null);
            setEditInitialRow(null);
          }}
          onSuccess={() => {
            setCardEditorOpen(false);
            setEditCardId(null);
            setEditSource(null);
            setEditInitialRow(null);
            setProgress((p) => alignProgressToItems(p));
            onCustomCardsChanged();
          }}
        />
      ) : null}
    </>
  );
}

function QuestionModal({
  category,
  item,
  itemIndex,
  roundItemCount,
  onMarkComplete,
  onClose,
  isDevMode,
  canEditCard,
  canDeleteCard,
  onEditCard,
  onDeleteCustomCard,
}) {
  const [answerVisible, setAnswerVisible] = useState(false);
  const [selectedFactAnswer, setSelectedFactAnswer] = useState(null);
  const [musicRemaining, setMusicRemaining] = useState(MUSIC_LISTEN_DURATION_SEC);
  const audioContextRef = useRef(null);
  const musicAudioRef = useRef(null);
  const movieVideoRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const musicStartedAtRef = useRef(null);

  useEffect(() => {
    setAnswerVisible(false);
    setSelectedFactAnswer(null);
    setMusicRemaining(MUSIC_LISTEN_DURATION_SEC);
  }, [category, itemIndex]);

  useEffect(() => {
    if (!item || category !== "music") {
      stopMusic();
      return undefined;
    }

    const startedAt = performance.now();
    musicStartedAtRef.current = startedAt;
    const listenMs = MUSIC_LISTEN_DURATION_SEC * 1000;
    intervalRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      setMusicRemaining(Math.max(0, MUSIC_LISTEN_DURATION_SEC - elapsed));
    }, 150);

    timeoutRef.current = window.setTimeout(() => {
      setMusicRemaining(0);
      stopMusic();
    }, listenMs);

    if (item.media.type === "audio") {
      const audio = musicAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return () => stopMusic();
    }

    const context = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = context;

    item.media.notes.forEach((note) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = note.frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + note.start);
      gain.gain.linearRampToValueAtTime(0.16, context.currentTime + note.start + 0.05);
      gain.gain.linearRampToValueAtTime(0.0001, context.currentTime + note.start + note.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + note.start);
      oscillator.stop(context.currentTime + note.start + note.duration + 0.08);
    });

    return () => stopMusic();
  }, [category, item]);

  if (!item) {
    return null;
  }

  function stopMusic() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    musicStartedAtRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    pauseMusicAudio(true);
  }

  /** Остановка с сохранением момента: таймер и полоса — как в момент остановки, звук — suspend (не close). */
  function pauseMusicAtPosition() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (musicStartedAtRef.current != null) {
      const elapsed = (performance.now() - musicStartedAtRef.current) / 1000;
      setMusicRemaining(Math.max(0, MUSIC_LISTEN_DURATION_SEC - elapsed));
    }
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === "running") {
      void ctx.suspend();
    }
    pauseMusicAudio(false);
  }

  function pauseMusicAudio(resetPosition) {
    const audio = musicAudioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    if (resetPosition) {
      audio.currentTime = 0;
    }
  }

  function handleReveal() {
    if (category === "music") {
      pauseMusicAtPosition();
    } else if (category === "movies") {
      pauseMovieVideo();
      stopMusic();
    } else {
      stopMusic();
    }
    setAnswerVisible(true);
    onMarkComplete();
  }

  function handleClose(shouldComplete) {
    stopMusic();
    pauseMovieVideo();
    onClose(shouldComplete);
  }

  function pauseMovieVideo() {
    if (movieVideoRef.current) {
      movieVideoRef.current.pause();
    }
  }

  function toggleMovieVideo() {
    const video = movieVideoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  return (
    <div
      className="modal-root"
      aria-hidden="false"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose(false);
        }
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h3>
              {CATEGORIES[category].title} — вопрос {(itemIndex ?? 0) + 1}
              {roundItemCount > 0 ? ` из ${roundItemCount}` : ""}
            </h3>
          </div>
          <div className="modal-header-actions">
            {isDevMode && canEditCard ? (
              <button className="control-button secondary dev-edit-btn" onClick={() => onEditCard()} type="button">
                Изменить карточку
              </button>
            ) : null}
            <button className="control-button secondary" onClick={() => handleClose(false)} type="button">
              Закрыть
            </button>
          </div>
        </div>

        {isDevMode && canDeleteCard ? (
          <div className="modal-card-dev-actions">
            <button className="control-button secondary dev-delete-btn" onClick={() => onDeleteCustomCard()} type="button">
              Удалить карточку
            </button>
          </div>
        ) : null}

        {category === "music" ? (
          <>
            <div className="media-frame music-frame">
              {item.media.type === "audio" ? (
                item.media.src ? (
                  <audio aria-label={`Музыкальная подсказка ${(itemIndex ?? 0) + 1}`} controls preload="metadata" ref={musicAudioRef} src={item.media.src} />
                ) : (
                  <div className="audio-placeholder">
                    <p className="modal-copy">Для этой карточки не задан URL аудио из Vercel Blob.</p>
                  </div>
                )
              ) : null}
              <div className="timer-bar">
                <div
                  className="timer-progress"
                  style={{
                    width: `${(musicRemaining / MUSIC_LISTEN_DURATION_SEC) * 100}%`,
                  }}
                />
              </div>
              <p>
                <strong>Осталось:</strong> {Math.ceil(musicRemaining)} с
              </p>
            </div>
            <section className={`answer-panel ${answerVisible ? "" : "is-hidden"}`}>
              <h3>Ответ</h3>
              <p>{item.answer}</p>
            </section>
          </>
        ) : null}

        {category === "movies" ? (
          <>
            <div className="media-frame">
              {item.media.src ? (
                <video
                  aria-label={`Видео-подсказка к фильму ${(itemIndex ?? 0) + 1}`}
                  onClick={toggleMovieVideo}
                  playsInline
                  poster={item.media.poster}
                  preload="metadata"
                  ref={movieVideoRef}
                  src={item.media.src}
                />
              ) : (
                <div className="video-placeholder">
                  <p className="modal-copy">Для этой карточки не задан URL видео из Vercel Blob.</p>
                </div>
              )}
            </div>
            <section className={`answer-panel ${answerVisible ? "" : "is-hidden"}`}>
              <h3>Ответ</h3>
              <p>{item.answer}</p>
            </section>
          </>
        ) : null}

        {category === "facts" ? (
          <>
            <div className="fact-frame">
              <p className="fact-statement">{item.question}</p>
              <div className="choice-row">
                <FactChoiceButton answerVisible={answerVisible} choice correct={item.answer} onClick={() => setSelectedFactAnswer(true)} selected={selectedFactAnswer} />
                <FactChoiceButton answerVisible={answerVisible} choice={false} correct={item.answer} onClick={() => setSelectedFactAnswer(false)} selected={selectedFactAnswer} />
              </div>
              {selectedFactAnswer !== null ? (
                <p className="choice-note">Ваш выбор: {selectedFactAnswer ? "верно" : "неверно"}</p>
              ) : null}
            </div>
            <section className={`answer-panel ${answerVisible ? "" : "is-hidden"}`}>
              <h3>Ответ</h3>
              <p>{item.answer ? "Верно" : "Неверно"}</p>
              <p className="answer-meta">{item.description}</p>
            </section>
          </>
        ) : null}

        {!answerVisible ? (
          <div className="modal-actions">
            <button className="control-button primary" onClick={handleReveal} type="button">
              Показать ответ
            </button>
            <button className="control-button secondary" onClick={() => handleClose(true)} type="button">
              Отметить выполненным
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FactChoiceButton({ answerVisible, choice, correct, onClick, selected }) {
  const isSelected = selected === choice;
  const isCorrect = answerVisible && correct === choice;
  const isWrong = answerVisible && isSelected && correct !== choice;

  return (
    <button
      className={`choice-button ${isSelected ? "is-selected" : ""} ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""}`}
      onClick={onClick}
      type="button"
    >
      {choice ? "Верно" : "Неверно"}
    </button>
  );
}

