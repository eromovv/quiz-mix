import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { AddCardModal } from "./components/AddCardModal";
import { AddCategoryModal } from "./components/AddCategoryModal";
import { AuthModal } from "./components/AuthModal";
import { PlatformIntro } from "./components/PlatformIntro";
import {
  addRoomCategory,
  createEmptyCardsStore,
  exportActiveCardsStore,
  exportLocalCustomCardsStore,
  getRoomCategories,
  removeCustomCard,
  setActiveCustomCardsStore,
} from "./data/customItems";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  getEditableItemRow,
  getItemCount,
  getItems,
  getRoundCount,
  getTotalQuestionCount,
  isCustomItemIndex,
  MUSIC_LISTEN_DURATION_SEC,
} from "./data/quizData";
import { APP_MODE, loadAppMode, saveAppMode } from "./lib/appMode";
import {
  claimRoomForAccount,
  fetchAccount,
  fetchMyRooms,
  getAccountLabel,
  logoutAccount,
  subscribeAccount,
} from "./lib/accountAuth";
import { createTranslator, getCategoryMeta, LANGUAGES, loadLanguage, saveLanguage } from "./lib/i18n";
import { alignProgressToItems, countCompleted, getProgressStorageKey, loadProgress, saveProgress } from "./lib/progress";
import {
  captureAccessTokenFromUrl,
  createRoom,
  deleteRoom,
  fetchRoom,
  formatTokenExpiry,
  forgetRoomCredentials,
  getOwnedRooms,
  getRoomAccessToken,
  getRoomMeta,
  getRoomOwnerToken,
  makeRoomShareUrl,
  rememberRoomCredentials,
  renewRoomAccessToken,
  resolveRoomToken,
  RoomRequestError,
  saveRoomAccessToken,
  saveRoomOwnerToken,
  updateRoom,
} from "./lib/rooms";
import { loadTheme, saveTheme } from "./lib/theme";
import {
  establishUserSession,
  LAST_ROOM_ID_KEY,
  resolveInitialUserSession,
  subscribeUserSession,
} from "./lib/userAuth";

const MEDIA_TIMER_SETTINGS_KEY = "quiz_media_timer_settings";
const QUIZ_FLOW_MODE = {
  chaotic: "chaotic",
  sequential: "sequential",
};
const DEFAULT_QUIZ_FLOW_THRESHOLD = 1;

const DEFAULT_MEDIA_TIMER_ENABLED = true;

const DEFAULT_DISPLAY_SETTINGS = {
  hideRoundSummary: true,
  quizFlowMode: QUIZ_FLOW_MODE.chaotic,
  quizFlowThreshold: DEFAULT_QUIZ_FLOW_THRESHOLD,
};

function loadMediaTimerSettings() {
  if (typeof window === "undefined") {
    return DEFAULT_MEDIA_TIMER_ENABLED;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(MEDIA_TIMER_SETTINGS_KEY) || "{}");
    if (typeof parsed.enabled === "boolean") {
      return parsed.enabled;
    }
    if (typeof parsed.music === "boolean") {
      return parsed.music;
    }
    if (typeof parsed.movies === "boolean") {
      return parsed.movies;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_MEDIA_TIMER_ENABLED;
}

function saveMediaTimerSettings(enabled) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(MEDIA_TIMER_SETTINGS_KEY, JSON.stringify({ enabled }));
  } catch {
    /* ignore */
  }
}

function loadDisplaySettings() {
  if (typeof window === "undefined") {
    return DEFAULT_DISPLAY_SETTINGS;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem("quiz_display_settings") || "{}");
    return {
      hideRoundSummary: typeof parsed.hideRoundSummary === "boolean" ? parsed.hideRoundSummary : DEFAULT_DISPLAY_SETTINGS.hideRoundSummary,
      quizFlowMode: parsed.quizFlowMode === QUIZ_FLOW_MODE.sequential ? QUIZ_FLOW_MODE.sequential : DEFAULT_DISPLAY_SETTINGS.quizFlowMode,
      quizFlowThreshold: normalizeQuizFlowThreshold(parsed.quizFlowThreshold),
    };
  } catch {
    return DEFAULT_DISPLAY_SETTINGS;
  }
}

function normalizeQuizFlowThreshold(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_QUIZ_FLOW_THRESHOLD;
  }
  return Math.min(99, Math.max(1, parsed));
}

function isCategoryUnlocked(progress, category, quizFlowMode, threshold, categoryKeys = CATEGORY_KEYS) {
  if (quizFlowMode !== QUIZ_FLOW_MODE.sequential) {
    return true;
  }

  const categoryIndex = categoryKeys.indexOf(category);
  if (categoryIndex <= 0) {
    return true;
  }

  const previousCategory = categoryKeys[categoryIndex - 1];
  return countCompleted(progress, previousCategory) >= threshold;
}

function saveDisplaySettings(settings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem("quiz_display_settings", JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(() => loadProgress());
  const [uiTheme, setUiTheme] = useState(() => loadTheme());
  const [language, setLanguage] = useState(() => loadLanguage());
  const [appMode, setAppMode] = useState(() => loadAppMode());
  const [mediaTimerEnabled, setMediaTimerEnabled] = useState(() => loadMediaTimerSettings());
  const [displaySettings, setDisplaySettings] = useState(() => loadDisplaySettings());
  const [cardRevision, setCardRevision] = useState(0);
  const [accountUser, setAccountUser] = useState(null);
  const [accountReady, setAccountReady] = useState(false);
  const [roomSession, setRoomSession] = useState(() => resolveInitialUserSession());
  const [authOpen, setAuthOpen] = useState(false);
  const [roomsRevision, setRoomsRevision] = useState(0);
  const isRoomPath = location.pathname.startsWith("/room/");

  useEffect(() => subscribeUserSession(setRoomSession), []);

  useEffect(() => {
    let cancelled = false;
    fetchAccount()
      .then((user) => {
        if (!cancelled) {
          setAccountUser(user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccountUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAccountReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeAccount(setAccountUser), []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (!isRoomPath) {
      setActiveCustomCardsStore(null);
    }
  }, [isRoomPath]);

  useEffect(() => {
    document.documentElement.dataset.uiTheme = uiTheme;
    saveTheme(uiTheme);
  }, [uiTheme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function handleSetLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    saveLanguage(nextLanguage);
  }

  useEffect(() => {
    document.documentElement.dataset.appMode = appMode;
    saveAppMode(appMode);
  }, [appMode]);

  useEffect(() => {
    saveMediaTimerSettings(mediaTimerEnabled);
  }, [mediaTimerEnabled]);

  useEffect(() => {
    saveDisplaySettings(displaySettings);
  }, [displaySettings]);

  return (
    <div className="app-shell">
      <AppHeader
        accountUser={accountUser}
        appMode={appMode}
        displaySettings={displaySettings}
        isRoomMode={isRoomPath}
        language={language}
        onLogin={() => setAuthOpen(true)}
        onLogoutAccount={async () => {
          await logoutAccount();
          setAccountUser(null);
        }}
        onSetLanguage={handleSetLanguage}
        onSetAppMode={setAppMode}
        mediaTimerEnabled={mediaTimerEnabled}
        onSetMediaTimerEnabled={setMediaTimerEnabled}
        onSetDisplaySettings={setDisplaySettings}
        onToggleTheme={() => setUiTheme((t) => (t === "light" ? "dark" : "light"))}
        uiTheme={uiTheme}
      />
      {authOpen ? (
        <AuthModal
          language={language}
          onClose={() => setAuthOpen(false)}
          onAccountSuccess={(user) => {
            setAuthOpen(false);
            setAccountUser(user);
          }}
        />
      ) : null}
      {!isRoomPath && appMode === APP_MODE.dev && accountReady ? (
        <MyRoomsPanel
          accountUser={accountUser}
          cardRevision={cardRevision}
          language={language}
          onRoomsChanged={() => setRoomsRevision((value) => value + 1)}
        />
      ) : null}
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                accountReady={accountReady}
                accountUser={accountUser}
                cardRevision={cardRevision}
                displaySettings={displaySettings}
                language={language}
                onRoomsChanged={() => setRoomsRevision((value) => value + 1)}
                progress={progress}
                roomsRevision={roomsRevision}
              />
            }
          />
          <Route
            path="/music"
            element={
              <QuizPage
                appMode={appMode}
                cardRevision={cardRevision}
                category="music"
                language={language}
                mediaTimerEnabled={mediaTimerEnabled}
                onCustomCardsChanged={() => setCardRevision((n) => n + 1)}
                progress={progress}
                quizFlowMode={displaySettings.quizFlowMode}
                quizFlowThreshold={displaySettings.quizFlowThreshold}
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
                language={language}
                mediaTimerEnabled={mediaTimerEnabled}
                onCustomCardsChanged={() => setCardRevision((n) => n + 1)}
                progress={progress}
                quizFlowMode={displaySettings.quizFlowMode}
                quizFlowThreshold={displaySettings.quizFlowThreshold}
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
                language={language}
                mediaTimerEnabled={mediaTimerEnabled}
                onCustomCardsChanged={() => setCardRevision((n) => n + 1)}
                progress={progress}
                quizFlowMode={displaySettings.quizFlowMode}
                quizFlowThreshold={displaySettings.quizFlowThreshold}
                setProgress={setProgress}
              />
            }
          />
          <Route path="/room/:roomId/*" element={<RoomApp mediaTimerEnabled={mediaTimerEnabled} displaySettings={displaySettings} language={language} />} />
        </Routes>
      </main>
    </div>
  );
}

function makeRoomUrl(roomId) {
  return makeRoomShareUrl(roomId);
}

function MyRoomsPanel({ accountUser, cardRevision, language, onRoomsChanged }) {
  const navigate = useNavigate();
  const t = useMemo(() => createTranslator(language), [language]);
  const [rooms, setRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const localOwnedRooms = getOwnedRooms();
  const unclaimedRoomIds = Object.keys(localOwnedRooms).filter((roomId) => !rooms.some((room) => room.id === roomId));
  const currentRoom = rooms.find((room) => room.id === currentRoomId) || null;
  const currentRoomUrl = currentRoomId ? makeRoomUrl(currentRoomId) : "";
  const currentRoomMeta = currentRoomId ? getRoomMeta(currentRoomId) : {};
  const ownerExpiryLabel = formatTokenExpiry(currentRoomMeta.ownerTokenExpiresAt || currentRoom?.ownerTokenExpiresAt, language);

  useEffect(() => {
    if (!accountUser) {
      setRooms([]);
      setCurrentRoomId("");
      return undefined;
    }

    let cancelled = false;
    fetchMyRooms()
      .then((nextRooms) => {
        if (cancelled) {
          return;
        }
        setRooms(nextRooms);
        const stored = window.localStorage.getItem(LAST_ROOM_ID_KEY) || "";
        const fallback = nextRooms[0]?.id || "";
        setCurrentRoomId((stored && nextRooms.some((room) => room.id === stored) ? stored : fallback) || "");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("loadRoomFailed"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountUser, cardRevision, language, t]);

  useEffect(() => {
    if (!status) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  function rememberRoom(roomId, payload) {
    rememberRoomCredentials(roomId, payload);
    setCurrentRoomId(roomId);
    window.localStorage.setItem(LAST_ROOM_ID_KEY, roomId);
  }

  async function refreshRooms(preferredRoomId = currentRoomId) {
    const nextRooms = await fetchMyRooms();
    setRooms(nextRooms);
    if (preferredRoomId && nextRooms.some((room) => room.id === preferredRoomId)) {
      setCurrentRoomId(preferredRoomId);
    } else {
      setCurrentRoomId(nextRooms[0]?.id || "");
    }
    onRoomsChanged?.();
    return nextRooms;
  }

  async function handleCreateRoom() {
    setError("");
    setStatus("");
    setIsSaving(true);
    try {
      const result = await createRoom(createEmptyCardsStore());
      rememberRoom(result.room.id, {
        ownerToken: result.ownerToken,
        accessToken: result.accessToken,
        room: result.room,
      });
      establishUserSession(result.room.id, "owner", result.room);
      await refreshRooms(result.room.id);
      setStatus(t("roomCreated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("roomCreateFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateRoom() {
    if (!currentRoomId) {
      return;
    }

    setError("");
    setStatus("");
    setIsSaving(true);
    try {
      const result = await updateRoom(currentRoomId, getRoomOwnerToken(currentRoomId), exportLocalCustomCardsStore());
      rememberRoom(currentRoomId, {
        ownerToken: result.ownerToken || getRoomOwnerToken(currentRoomId),
        accessToken: result.accessToken,
        room: result.room,
      });
      await refreshRooms(currentRoomId);
      setStatus(t("roomUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("roomUpdateFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRenewAccessLink() {
    if (!currentRoomId) {
      return;
    }

    setError("");
    setStatus("");
    setIsSaving(true);
    try {
      const result = await renewRoomAccessToken(currentRoomId, getRoomOwnerToken(currentRoomId));
      rememberRoom(currentRoomId, {
        ownerToken: result.ownerToken || getRoomOwnerToken(currentRoomId),
        accessToken: result.accessToken,
        room: result.room,
      });
      await refreshRooms(currentRoomId);
      setStatus(t("roomAccessRenewed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("roomAccessRenewFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteRoom() {
    if (!currentRoomId) {
      return;
    }

    if (!window.confirm(t("roomDeleteConfirm"))) {
      return;
    }

    setError("");
    setStatus("");
    setIsSaving(true);
    try {
      await deleteRoom(currentRoomId, getRoomOwnerToken(currentRoomId));
      forgetRoomCredentials(currentRoomId);
      if (window.localStorage.getItem(LAST_ROOM_ID_KEY) === currentRoomId) {
        window.localStorage.removeItem(LAST_ROOM_ID_KEY);
      }
      await refreshRooms();
      setStatus(t("roomDeleted"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("roomDeleteFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClaimRoom(roomId) {
    const ownerToken = getRoomOwnerToken(roomId);
    if (!ownerToken) {
      return;
    }

    setError("");
    setStatus("");
    setIsSaving(true);
    try {
      const result = await claimRoomForAccount(roomId, ownerToken);
      rememberRoom(roomId, {
        ownerToken: result.ownerToken,
        accessToken: result.accessToken,
        room: result.room,
      });
      await refreshRooms(roomId);
      setStatus(t("roomClaimed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("roomClaimFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyLink() {
    if (!currentRoomUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentRoomUrl);
      setStatus(t("copiedLink"));
    } catch {
      setStatus(t("copyLinkManually"));
    }
  }

  if (!accountUser) {
    return null;
  }

  return (
    <section className={`room-panel ${isOpen ? "" : "is-collapsed"}`} data-card-revision={cardRevision}>
      <button
        className="room-panel-header"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span>
          <span className="room-panel-title">{t("myRoomsTitle")}</span>
          <span className="room-panel-subtitle">{t("roomPanelSubtitle")}</span>
        </span>
        <span className="room-panel-toggle" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M6.7 9.3 12 14.6l5.3-5.3" />
          </svg>
        </span>
      </button>
      <div className="room-panel-body" aria-hidden={!isOpen}>
        <div className="room-panel-body-inner">
          {rooms.length === 0 ? <p className="room-link-hint">{t("myRoomsEmpty")}</p> : null}
          <div className="room-panel-actions">
            {rooms.length > 0 ? (
              <label className="room-select-label">
                <span>{t("roomMyRoom")}</span>
                <select
                  tabIndex={isOpen ? 0 : -1}
                  value={currentRoomId}
                  onChange={(event) => {
                    setCurrentRoomId(event.target.value);
                    window.localStorage.setItem(LAST_ROOM_ID_KEY, event.target.value);
                  }}
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.id}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="room-button-group">
              {currentRoomId ? (
                <>
                  <button className="control-button secondary" disabled={isSaving} onClick={() => navigate(`/room/${currentRoomId}`)} tabIndex={isOpen ? 0 : -1} type="button">
                    {t("myRoomsOpenRoom")}
                  </button>
                  <button className="control-button secondary" disabled={isSaving} onClick={handleUpdateRoom} tabIndex={isOpen ? 0 : -1} type="button">
                    {t("roomUpdateButton")}
                  </button>
                  <button className="control-button secondary" disabled={isSaving} onClick={handleRenewAccessLink} tabIndex={isOpen ? 0 : -1} type="button">
                    {t("roomRenewAccessButton")}
                  </button>
                  <button className="control-button danger" disabled={isSaving} onClick={handleDeleteRoom} tabIndex={isOpen ? 0 : -1} type="button">
                    {t("roomDeleteButton")}
                  </button>
                </>
              ) : null}
              <button className="control-button primary" disabled={isSaving} onClick={handleCreateRoom} tabIndex={isOpen ? 0 : -1} type="button">
                {t("createRoom")}
              </button>
            </div>
          </div>
          {unclaimedRoomIds.length > 0 ? (
            <div className="room-link-block">
              <p className="room-link-hint">{t("roomClaimHint")}</p>
              <div className="room-button-group">
                {unclaimedRoomIds.map((roomId) => (
                  <button
                    className="control-button secondary"
                    disabled={isSaving}
                    key={roomId}
                    onClick={() => handleClaimRoom(roomId)}
                    tabIndex={isOpen ? 0 : -1}
                    type="button"
                  >
                    {t("roomClaimButton")} · {roomId}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {currentRoomUrl ? (
            <div className="room-link-block">
              <p className="room-link-hint">{t("roomShareHint")}</p>
              <div className="room-link-row">
                <input readOnly tabIndex={isOpen ? 0 : -1} value={currentRoomUrl} />
                <button className="control-button secondary" onClick={handleCopyLink} tabIndex={isOpen ? 0 : -1} type="button">
                  {t("copy")}
                </button>
              </div>
              {ownerExpiryLabel ? <p className="room-meta">{t("roomOwnerAccessExpiry", { date: ownerExpiryLabel })}</p> : null}
            </div>
          ) : null}
          {status ? <p className="room-status">{status}</p> : null}
          {error ? <p className="room-error">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}

function RoomApp({ mediaTimerEnabled, displaySettings, language }) {
  const { roomId } = useParams();
  const location = useLocation();
  const t = useMemo(() => createTranslator(language), [language]);
  const [room, setRoom] = useState(null);
  const [roomRole, setRoomRole] = useState("");
  const [progress, setProgress] = useState(null);
  const [cardRevision, setCardRevision] = useState(0);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [roomToken, setRoomToken] = useState(() => captureAccessTokenFromUrl(roomId) || resolveRoomToken(roomId) || "");
  const progressKey = getProgressStorageKey(roomId);

  useEffect(() => {
    const urlToken = captureAccessTokenFromUrl(roomId);
    if (urlToken) {
      setRoomToken(urlToken);
    }
  }, [roomId, location.search]);

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    setError("");
    setRoom(null);
    setProgress(null);
    setActiveCustomCardsStore(null);

    fetchRoom(roomId, roomToken)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        if (payload.ownerToken) {
          saveRoomOwnerToken(roomId, payload.ownerToken);
        }
        if (payload.accessToken) {
          saveRoomAccessToken(roomId, payload.accessToken);
        }
        rememberRoomCredentials(roomId, {
          ownerToken: payload.ownerToken || (payload.role === "owner" ? roomToken : ""),
          accessToken: payload.accessToken || "",
          room: payload.room,
        });
        establishUserSession(roomId, payload.role === "owner" ? "owner" : "guest", payload.room);
        setActiveCustomCardsStore(payload.room.cards);
        setRoom(payload.room);
        setRoomRole(payload.role || "");
        setProgress(loadProgress(progressKey));
        setCardRevision((value) => value + 1);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err instanceof RoomRequestError && err.code === "TOKEN_EXPIRED") {
          setStatus("error");
          setError(err.message || t("roomOwnerTokenExpired"));
          return;
        }
        setStatus("error");
        setError(err instanceof Error ? err.message : t("loadRoomFailed"));
      });

    return () => {
      cancelled = true;
      setActiveCustomCardsStore(null);
    };
  }, [progressKey, roomId, roomToken, t]);

  useEffect(() => {
    if (status === "ready" && progress) {
      saveProgress(progress, progressKey);
    }
  }, [progress, progressKey, status]);

  if (status === "loading") {
    return <p className="empty-copy">{t("roomLoading")}</p>;
  }

  if (status === "error") {
    return (
      <section className="room-load-state">
        <h2>{t("roomLoadErrorTitle")}</h2>
        <p>{error}</p>
      </section>
    );
  }

  if (!room || !progress) {
    return null;
  }

  const roomBasePath = `/room/${roomId}`;
  const roomPath = location.pathname.startsWith(roomBasePath) ? location.pathname.slice(roomBasePath.length) || "/" : "/";
  const activeCategory = roomPath.replace(/^\/+/, "").split("/")[0];
  const isCategoryRoute = Object.prototype.hasOwnProperty.call(CATEGORIES, activeCategory);
  const roomCategories = getRoomCategories();
  const canEditRoom = roomRole === "owner";
  const ownerExpiryLabel = formatTokenExpiry(room.ownerTokenExpiresAt, language);

  async function persistRoomCards() {
    const ownerToken = getRoomOwnerToken(roomId);
    if (!ownerToken) {
      setCardRevision((value) => value + 1);
      return;
    }

    try {
      const result = await updateRoom(roomId, ownerToken, exportActiveCardsStore());
      rememberRoomCredentials(roomId, {
        accessToken: result.accessToken,
        room: result.room,
      });
      setActiveCustomCardsStore(result.room.cards);
      setRoom(result.room);
      setError("");
      setCardRevision((value) => value + 1);
    } catch (err) {
      if (err instanceof RoomRequestError && err.code === "TOKEN_EXPIRED") {
        setError(err.message || t("roomOwnerTokenExpired"));
      } else {
        setError(err instanceof Error ? err.message : t("roomUpdateFailed"));
      }
    }
  }

  async function handleAddCategory(category) {
    addRoomCategory(category);
    const ownerToken = getRoomOwnerToken(roomId);
    if (ownerToken) {
      try {
        const result = await updateRoom(roomId, ownerToken, exportActiveCardsStore());
        rememberRoomCredentials(roomId, {
          accessToken: result.accessToken,
          room: result.room,
        });
        setActiveCustomCardsStore(result.room.cards);
        setRoom(result.room);
      } catch (err) {
        if (err instanceof RoomRequestError && err.code === "TOKEN_EXPIRED") {
          setError(err.message || t("roomOwnerTokenExpired"));
        } else {
          setError(err instanceof Error ? err.message : t("roomUpdateFailed"));
        }
        return;
      }
    }
    setProgress((current) => alignProgressToItems(current));
    setCardRevision((value) => value + 1);
  }

  if (isCategoryRoute && !roomCategories.includes(activeCategory)) {
    return <Navigate replace to={roomBasePath} />;
  }

  return (
    <>
      <section className="room-banner">
        <div>
          <p className="settings-title">{t("room")}</p>
          <h2>{room.id}</h2>
        </div>
        <div className="room-banner-copy">
          <p>{canEditRoom ? t("roomProgressNote") : t("roomOnlyPreview")}</p>
          {ownerExpiryLabel && canEditRoom ? <p className="room-meta">{t("roomOwnerAccessExpiry", { date: ownerExpiryLabel })}</p> : null}
          {error ? <p className="room-error">{error}</p> : null}
        </div>
      </section>
      {isCategoryRoute ? (
        <QuizPage
          appMode={canEditRoom ? APP_MODE.dev : APP_MODE.preview}
          cardRevision={cardRevision}
          category={activeCategory}
          categoryKeys={roomCategories}
          language={language}
          mediaTimerEnabled={mediaTimerEnabled}
          onCustomCardsChanged={persistRoomCards}
          progress={progress}
          quizFlowMode={displaySettings.quizFlowMode}
          quizFlowThreshold={displaySettings.quizFlowThreshold}
          roomId={roomId}
          setProgress={setProgress}
        />
      ) : (
        <RoomHomePage
          canEdit={canEditRoom}
          cardRevision={cardRevision}
          displaySettings={displaySettings}
          language={language}
          onAddCategory={handleAddCategory}
          progress={progress}
          routePrefix={roomBasePath}
        />
      )}
    </>
  );
}

function AppHeader({
  accountUser,
  appMode,
  displaySettings,
  isRoomMode,
  language,
  mediaTimerEnabled,
  onLogin,
  onLogoutAccount,
  onSetAppMode,
  onSetDisplaySettings,
  onSetLanguage,
  onSetMediaTimerEnabled,
  onToggleTheme,
  uiTheme,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useMemo(() => createTranslator(language), [language]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const settingsMenuRef = useRef(null);
  const accountMenuRef = useRef(null);
  const roomRootMatch = location.pathname.match(/^\/room\/([^/]+)\/?$/);
  const roomSectionMatch = location.pathname.match(/^\/room\/([^/]+)\//);
  const isHome = location.pathname === "/" || Boolean(roomRootMatch);
  const isDark = uiTheme === "dark";
  const themeLabel = isDark ? t("lightTheme") : t("darkTheme");
  const accountLabel = getAccountLabel(accountUser, t);
  const isAuthenticated = Boolean(accountUser);

  useEffect(() => {
    if (!settingsOpen) {
      return undefined;
    }

    function handleOutsidePointerDown(event) {
      if (settingsMenuRef.current?.contains(event.target)) {
        return;
      }
      setSettingsOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [settingsOpen]);

  useEffect(() => {
    if (!accountMenuOpen) {
      return undefined;
    }

    function handleOutsidePointerDown(event) {
      if (accountMenuRef.current?.contains(event.target)) {
        return;
      }
      setAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [accountMenuOpen]);

  function updateMediaTimer(checked) {
    onSetMediaTimerEnabled(checked);
  }

  function updateDisplaySetting(key, checked) {
    onSetDisplaySettings((current) => ({
      ...current,
      [key]: key === "quizFlowThreshold" ? normalizeQuizFlowThreshold(checked) : checked,
    }));
  }

  function handleBack() {
    if (roomSectionMatch) {
      navigate(`/room/${roomSectionMatch[1]}`);
      return;
    }
    navigate("/");
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className={`back-link ${isHome ? "hidden" : ""}`} onClick={handleBack} type="button">
          {t("back")}
        </button>
        <div className="topbar-toolbar">
          <div className="settings-menu" ref={settingsMenuRef}>
            <button
              className="icon-toggle"
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              title={t("settings")}
              aria-expanded={settingsOpen}
              aria-label={t("settings")}
            >
              ⚙
            </button>
            {settingsOpen ? (
              <div className="settings-panel">
                {isAuthenticated && !isRoomMode ? (
                  <div className="settings-section">
                    <p className="settings-title">{t("settingsMode")}</p>
                    <div className="mode-switch" role="group" aria-label={t("settingsMode")}>
                      <button
                        className={`mode-switch-btn ${appMode === APP_MODE.preview ? "is-active" : ""}`}
                        type="button"
                        onClick={() => onSetAppMode(APP_MODE.preview)}
                        title={t("previewModeTitle")}
                      >
                        {t("previewMode")}
                      </button>
                      <button
                        className={`mode-switch-btn ${appMode === APP_MODE.dev ? "is-active" : ""}`}
                        type="button"
                        onClick={() => onSetAppMode(APP_MODE.dev)}
                        title={t("editorModeTitle")}
                      >
                        {t("editorMode")}
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="settings-section">
                  <p className="settings-title">{t("language")}</p>
                  <div className="mode-switch" role="group" aria-label={t("language")}>
                    <button
                      className={`mode-switch-btn ${language === LANGUAGES.ru ? "is-active" : ""}`}
                      type="button"
                      onClick={() => onSetLanguage(LANGUAGES.ru)}
                    >
                      {t("languageRussian")}
                    </button>
                    <button
                      className={`mode-switch-btn ${language === LANGUAGES.en ? "is-active" : ""}`}
                      type="button"
                      onClick={() => onSetLanguage(LANGUAGES.en)}
                    >
                      {t("languageEnglish")}
                    </button>
                  </div>
                </div>
                {isAuthenticated ? (
                  <>
                    <div className="settings-section">
                      <p className="settings-title">{t("quizFlowMode")}</p>
                      <div className="mode-switch mode-switch-balanced" role="group" aria-label={t("quizFlowMode")}>
                        <button
                          className={`mode-switch-btn ${displaySettings.quizFlowMode !== QUIZ_FLOW_MODE.sequential ? "is-active" : ""}`}
                          type="button"
                          onClick={() => updateDisplaySetting("quizFlowMode", QUIZ_FLOW_MODE.chaotic)}
                          title={t("quizFlowChaoticTitle")}
                        >
                          {t("quizFlowChaotic")}
                        </button>
                        <button
                          className={`mode-switch-btn ${displaySettings.quizFlowMode === QUIZ_FLOW_MODE.sequential ? "is-active" : ""}`}
                          type="button"
                          onClick={() => updateDisplaySetting("quizFlowMode", QUIZ_FLOW_MODE.sequential)}
                          title={t("quizFlowSequentialTitle")}
                        >
                          {t("quizFlowSequential")}
                        </button>
                      </div>
                      {displaySettings.quizFlowMode === QUIZ_FLOW_MODE.sequential ? (
                        <label className="settings-number">
                          <span>{t("quizFlowThreshold")}</span>
                          <input
                            min="1"
                            max="99"
                            step="1"
                            type="number"
                            value={displaySettings.quizFlowThreshold}
                            onChange={(event) => updateDisplaySetting("quizFlowThreshold", event.target.value)}
                          />
                        </label>
                      ) : null}
                    </div>
                    <div className="settings-section">
                      <label className="settings-check">
                        <input checked={mediaTimerEnabled} onChange={(event) => updateMediaTimer(event.target.checked)} type="checkbox" />
                        <span>{t("mediaTimers")}</span>
                      </label>
                    </div>
                    <div className="settings-section">
                      <p className="settings-title">{t("homeSettings")}</p>
                      <label className="settings-check">
                        <input checked={displaySettings.hideRoundSummary} onChange={(event) => updateDisplaySetting("hideRoundSummary", event.target.checked)} type="checkbox" />
                        <span>{t("hideRoundSummary")}</span>
                      </label>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          <button
            className="icon-toggle"
            type="button"
            onClick={onToggleTheme}
            title={themeLabel}
            aria-label={themeLabel}
          >
            {isDark ? "☀" : "🌙"}
          </button>
        </div>
      </div>
      <div className="brand">
        <h1>Quiz Mix</h1>
      </div>
      <div className="topbar-right topbar-controls">
        {accountUser ? (
          <div className="account-menu" ref={accountMenuRef}>
            <button
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              className="auth-session-badge auth-session-trigger"
              onClick={() => setAccountMenuOpen((open) => !open)}
              title={accountLabel}
              type="button"
            >
              {accountLabel}
            </button>
            {accountMenuOpen ? (
              <div className="account-menu-panel" role="menu">
                <button
                  className="control-button secondary auth-button account-menu-logout"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onLogoutAccount();
                  }}
                  role="menuitem"
                  type="button"
                >
                  {t("accountLogoutButton")}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button className="control-button primary auth-button" type="button" onClick={onLogin}>
            {t("accountLoginButton")}
          </button>
        )}
      </div>
    </header>
  );
}

function CategoryAddCard({ language, onAdd }) {
  const t = useMemo(() => createTranslator(language), [language]);

  return (
    <button className="category-card category-card-add" onClick={onAdd} title={t("addQuestCategory")} type="button">
      <div>
        <h3>{t("addQuestCategory")}</h3>
        <p className="progress-copy">{t("roomAddQuizHint")}</p>
      </div>
      <div className="category-add-mark" aria-hidden="true">
        +
      </div>
      <span className="category-button category-add-action">{t("add")}</span>
    </button>
  );
}

function RoomHomePage({ canEdit, cardRevision, displaySettings, language, onAddCategory, progress, routePrefix }) {
  const t = useMemo(() => createTranslator(language), [language]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const roomCategories = useMemo(() => getRoomCategories(), [cardRevision]);
  const availableCategories = CATEGORY_KEYS.filter((key) => !roomCategories.includes(key));
  const rounds = getRoundCount();
  const totalQuestions = getTotalQuestionCount();

  async function handleSelectCategory(category) {
    setPickerOpen(false);
    await onAddCategory(category);
  }

  return (
    <section className="hero room-home" data-card-revision={cardRevision}>
      {displaySettings.hideRoundSummary || roomCategories.length === 0 ? null : (
        <div className="hero-copy">
          <h2>{t("roundSummary", { rounds, totalQuestions })}</h2>
        </div>
      )}
      {roomCategories.length === 0 && !canEdit ? (
        <p className="empty-copy">{t("roomEmptyGuest")}</p>
      ) : (
        <div className="category-list">
          {roomCategories.map((key) => {
            const value = CATEGORIES[key];
            const categoryMeta = getCategoryMeta(language, key);
            const cap = getItemCount(key);
            const done = cap > 0 && countCompleted(progress, key) === cap;
            const isLocked = !isCategoryUnlocked(
              progress,
              key,
              displaySettings.quizFlowMode,
              displaySettings.quizFlowThreshold,
              roomCategories,
            );
            return (
              <article className={`category-card ${isLocked ? "is-locked" : ""}`} data-theme={key} key={key}>
                <div>
                  <h3>{categoryMeta.title}</h3>
                  <p className="progress-copy">{categoryMeta.description}</p>
                </div>
                <div className="progress-pill">
                  {countCompleted(progress, key)}/{cap}
                </div>
                {isLocked ? (
                  <span className="category-locked-message" role="status">
                    {t("quizCategoryLockedAction", { threshold: displaySettings.quizFlowThreshold })}
                  </span>
                ) : done ? (
                  <span className="category-button category-link category-completed" role="status">
                    {t("completed")}
                  </span>
                ) : (
                  <NavLink className="category-button category-link" to={`${routePrefix}${value.route}`}>
                    {t("open")}
                  </NavLink>
                )}
              </article>
            );
          })}
          {canEdit && availableCategories.length > 0 ? (
            <CategoryAddCard language={language} onAdd={() => setPickerOpen(true)} />
          ) : null}
        </div>
      )}
      {roomCategories.length > 0 ? (
        <div className="stats-row">
          {roomCategories.map((key) => (
            <div className="stat-box" key={key}>
              <span className="stat-value">{countCompleted(progress, key)}</span>
              <p className="progress-copy">{t("cardsCompleted", { title: getCategoryMeta(language, key).title })}</p>
            </div>
          ))}
        </div>
      ) : null}
      {pickerOpen ? (
        <AddCategoryModal
          availableCategories={availableCategories}
          language={language}
          onClose={() => setPickerOpen(false)}
          onSelect={handleSelectCategory}
        />
      ) : null}
    </section>
  );
}

function HomePage({ progress, cardRevision, displaySettings, language, routePrefix = "", accountUser, accountReady, roomsRevision, onRoomsChanged }) {
  const t = useMemo(() => createTranslator(language), [language]);
  const [rooms, setRooms] = useState([]);
  const [roomsReady, setRoomsReady] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!accountUser) {
      setRooms([]);
      setRoomsReady(true);
      return undefined;
    }

    let cancelled = false;
    setRoomsReady(false);
    fetchMyRooms()
      .then((nextRooms) => {
        if (!cancelled) {
          setRooms(nextRooms);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRooms([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRoomsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountUser, roomsRevision]);

  const currentRoom = useMemo(() => {
    if (rooms.length === 0) {
      return null;
    }

    const stored = typeof window !== "undefined" ? window.localStorage.getItem(LAST_ROOM_ID_KEY) || "" : "";
    if (stored && rooms.some((room) => room.id === stored)) {
      return rooms.find((room) => room.id === stored) || rooms[0];
    }

    return rooms[0];
  }, [rooms]);

  const roomCategoryKeys = currentRoom?.cards?.categories || [];
  const availableCategories = CATEGORY_KEYS.filter((key) => !roomCategoryKeys.includes(key));

  useEffect(() => {
    if (!currentRoom) {
      return undefined;
    }

    setActiveCustomCardsStore(currentRoom.cards);
    return () => setActiveCustomCardsStore(null);
  }, [currentRoom, cardRevision, roomsRevision]);

  const rounds = roomCategoryKeys.length;
  const totalQuestions = roomCategoryKeys.reduce((sum, key) => sum + getItemCount(key), 0);
  const heroLine = t("roundSummary", { rounds, totalQuestions });
  const showDashboard = accountReady && roomsReady && accountUser && rooms.length > 0;

  async function handleAddCategory(category) {
    if (!currentRoom) {
      return;
    }

    setPickerOpen(false);
    setActiveCustomCardsStore(currentRoom.cards);
    addRoomCategory(category);

    const ownerToken = getRoomOwnerToken(currentRoom.id);
    if (!ownerToken) {
      return;
    }

    try {
      const result = await updateRoom(currentRoom.id, ownerToken, exportActiveCardsStore());
      rememberRoomCredentials(currentRoom.id, {
        ownerToken,
        accessToken: result.accessToken,
        room: result.room,
      });
      onRoomsChanged?.();
    } catch {
      /* ignore */
    }
  }

  if (!accountReady || (accountUser && !roomsReady)) {
    return (
      <section className="hero" data-card-revision={cardRevision}>
        <p className="empty-copy">{t("loading")}</p>
      </section>
    );
  }

  if (!accountUser) {
    return (
      <section className="hero" data-card-revision={cardRevision}>
        <PlatformIntro language={language} />
      </section>
    );
  }

  if (!showDashboard) {
    return null;
  }

  if (roomCategoryKeys.length === 0) {
    return (
      <section className="hero" data-card-revision={cardRevision}>
        <div className="category-list">
          <CategoryAddCard language={language} onAdd={() => setPickerOpen(true)} />
        </div>
        {pickerOpen ? (
          <AddCategoryModal
            availableCategories={availableCategories}
            language={language}
            onClose={() => setPickerOpen(false)}
            onSelect={handleAddCategory}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="hero" data-card-revision={cardRevision}>
      {displaySettings.hideRoundSummary ? null : (
        <div className="hero-copy">
          <h2>{heroLine}</h2>
        </div>
      )}
      <div className="category-list">
        {roomCategoryKeys.map((key) => {
          const value = CATEGORIES[key];
          const categoryMeta = getCategoryMeta(language, key);
          const cap = getItemCount(key);
          const done = cap > 0 && countCompleted(progress, key) === cap;
          const isLocked = !isCategoryUnlocked(
            progress,
            key,
            displaySettings.quizFlowMode,
            displaySettings.quizFlowThreshold,
            roomCategoryKeys,
          );
          return (
            <article className={`category-card ${isLocked ? "is-locked" : ""}`} data-theme={key} key={key}>
              <div>
                <h3>{categoryMeta.title}</h3>
                <p className="progress-copy">{categoryMeta.description}</p>
              </div>
              <div className="progress-pill">
                {countCompleted(progress, key)}/{cap}
              </div>
              {isLocked ? (
                <span className="category-locked-message" role="status">
                  {t("quizCategoryLockedAction", { threshold: displaySettings.quizFlowThreshold })}
                </span>
              ) : done ? (
                <span className="category-button category-link category-completed" role="status">
                  {t("completed")}
                </span>
              ) : (
                <NavLink className="category-button category-link" to={`${routePrefix}${value.route}`}>
                  {t("open")}
                </NavLink>
              )}
            </article>
          );
        })}
      </div>
      <div className="stats-row">
        {roomCategoryKeys.map((key) => (
          <div className="stat-box" key={key}>
            <span className="stat-value">{countCompleted(progress, key)}</span>
            <p className="progress-copy">{t("cardsCompleted", { title: getCategoryMeta(language, key).title })}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuizPage({
  appMode,
  category,
  cardRevision,
  categoryKeys = CATEGORY_KEYS,
  language,
  mediaTimerEnabled,
  onCustomCardsChanged,
  progress,
  quizFlowMode,
  quizFlowThreshold,
  roomId = "",
  setProgress,
}) {
  const t = useMemo(() => createTranslator(language), [language]);
  const items = useMemo(() => getItems(category), [category, cardRevision]);
  const info = getCategoryMeta(language, category);
  const completedCount = countCompleted(progress, category);
  const isSequentialFlow = quizFlowMode === QUIZ_FLOW_MODE.sequential;
  const isBelowThreshold = isSequentialFlow && items.length < quizFlowThreshold;
  const isLockedCategory = !isCategoryUnlocked(progress, category, quizFlowMode, quizFlowThreshold, categoryKeys);
  const [activeIndex, setActiveIndex] = useState(null);
  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [editCardId, setEditCardId] = useState(null);
  const [editSource, setEditSource] = useState(null);
  const [editInitialRow, setEditInitialRow] = useState(null);
  const isDevMode = appMode === APP_MODE.dev;
  const showInlineAddCard = isDevMode && Boolean(roomId);

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
    if (!window.confirm(t("deleteCardConfirm"))) {
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
            {isDevMode && !showInlineAddCard ? (
              <button
                className="add-card-btn"
                disabled={activeIndex !== null}
                onClick={openAddCard}
                title={t("addCard")}
                type="button"
              >
                +
              </button>
            ) : null}
          </div>
        </div>
        {isBelowThreshold ? (
          <p className="threshold-notice">{t("quizThresholdNotice", { current: items.length, threshold: quizFlowThreshold })}</p>
        ) : null}
        {isLockedCategory ? <p className="threshold-notice">{t("quizCategoryPageLocked", { threshold: quizFlowThreshold })}</p> : null}
        <div className={`tile-grid ${isLockedCategory ? "is-disabled" : ""}`}>
          {items.map((item, index) => {
            const isCompleted = progress[category][index];
            return (
              <button
                className={`tile ${isCompleted ? "completed" : ""}`}
                disabled={isCompleted || isLockedCategory}
                key={`${category}-${item.id}`}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                {index + 1}
              </button>
            );
          })}
          {showInlineAddCard ? (
            <button
              aria-label={t("addCard")}
              className="tile tile-add"
              disabled={activeIndex !== null || isLockedCategory}
              onClick={openAddCard}
              title={t("addCard")}
              type="button"
            >
              +
            </button>
          ) : null}
        </div>
        {completedCount === items.length ? <p className="empty-copy">{t("allRoundQuestionsCompleted")}</p> : null}
      </section>

      <QuestionModal
        canDeleteCard={isDevMode && activeIndex !== null && isCustomItemIndex(category, activeIndex)}
        canEditCard={isDevMode && activeIndex !== null}
        category={category}
        isDevMode={isDevMode}
        item={activeIndex === null ? null : items[activeIndex]}
        itemIndex={activeIndex}
        language={language}
        mediaTimerEnabled={mediaTimerEnabled}
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
          language={language}
          roomId={roomId}
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

function getPlayableMediaSrc(src) {
  if (!src) {
    return "";
  }

  try {
    const url = new URL(src);
    if (url.hostname.endsWith(".private.blob.vercel-storage.com")) {
      return `/api/blob-media?url=${encodeURIComponent(src)}`;
    }
  } catch {
    return src;
  }

  return src;
}

function QuestionModal({
  category,
  item,
  itemIndex,
  language,
  roundItemCount,
  onMarkComplete,
  onClose,
  isDevMode,
  canEditCard,
  canDeleteCard,
  mediaTimerEnabled,
  onEditCard,
  onDeleteCustomCard,
}) {
  const t = useMemo(() => createTranslator(language), [language]);
  const categoryTitle = getCategoryMeta(language, category).title;
  const [answerVisible, setAnswerVisible] = useState(false);
  const [selectedFactAnswer, setSelectedFactAnswer] = useState(null);
  const [musicRemaining, setMusicRemaining] = useState(MUSIC_LISTEN_DURATION_SEC);
  const audioContextRef = useRef(null);
  const musicAudioRef = useRef(null);
  const movieVideoRef = useRef(null);
  const intervalRef = useRef(null);
  const musicStartedAtRef = useRef(null);
  const musicRemainingRef = useRef(MUSIC_LISTEN_DURATION_SEC);
  const musicTimerStartedWithRef = useRef(MUSIC_LISTEN_DURATION_SEC);
  const isMediaTimerEnabled = (category === "music" || category === "movies") && mediaTimerEnabled;

  useEffect(() => {
    setAnswerVisible(false);
    setSelectedFactAnswer(null);
    setMusicRemaining(MUSIC_LISTEN_DURATION_SEC);
    musicRemainingRef.current = MUSIC_LISTEN_DURATION_SEC;
  }, [category, itemIndex, isMediaTimerEnabled]);

  useEffect(() => {
    if (!isMediaTimerEnabled) {
      stopMusicTimer(false);
    }
  }, [isMediaTimerEnabled]);

  useEffect(() => {
    if (!item || category !== "music") {
      stopMusic();
      return undefined;
    }

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
    startMusicTimer();

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
    stopMusicTimer(false);

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    pauseMusicAudio(true);
  }

  /** Остановка с сохранением момента: таймер и полоса — как в момент остановки, звук — suspend (не close). */
  function pauseMusicAtPosition() {
    stopMusicTimer(true);
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === "running") {
      void ctx.suspend();
    }
    pauseMusicAudio(false);
  }

  function setMusicRemainingValue(value) {
    const nextValue = Math.max(0, value);
    musicRemainingRef.current = nextValue;
    setMusicRemaining(nextValue);
  }

  function startMusicTimer() {
    if (!isMediaTimerEnabled || intervalRef.current || musicRemainingRef.current <= 0) {
      return;
    }

    const startedAt = performance.now();
    const startedWith = musicRemainingRef.current;
    const media = category === "music" ? musicAudioRef.current : category === "movies" ? movieVideoRef.current : null;
    musicStartedAtRef.current = startedAt;
    musicTimerStartedWithRef.current = startedWith;

    const intervalId = window.setInterval(() => {
      if (media && (media.paused || media.ended || media.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)) {
        window.clearInterval(intervalId);
        if (intervalRef.current === intervalId) {
          intervalRef.current = null;
        }
        stopMusicTimer(true);
        return;
      }

      const elapsed = (performance.now() - startedAt) / 1000;
      const nextValue = startedWith - elapsed;
      setMusicRemainingValue(nextValue);
      if (nextValue <= 0) {
        window.clearInterval(intervalId);
        if (intervalRef.current === intervalId) {
          intervalRef.current = null;
        }
        if (category === "movies") {
          pauseMovieVideo();
        }
        stopMusic();
      }
    }, 150);

    intervalRef.current = intervalId;
  }

  function stopMusicTimer(keepElapsed) {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (keepElapsed && musicStartedAtRef.current != null) {
      const elapsed = (performance.now() - musicStartedAtRef.current) / 1000;
      setMusicRemainingValue(musicTimerStartedWithRef.current - elapsed);
    }

    musicStartedAtRef.current = null;
  }

  function handleMusicAudioPlaying() {
    startMusicTimer();
  }

  function handleMusicAudioStopped() {
    stopMusicTimer(true);
  }

  function handleMovieVideoPlaying() {
    startMusicTimer();
  }

  function handleMovieVideoStopped() {
    stopMusicTimer(true);
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
              {t("questionCounter", { category: categoryTitle, current: (itemIndex ?? 0) + 1, total: roundItemCount })}
            </h3>
          </div>
          <div className="modal-header-actions">
            {isDevMode && canEditCard ? (
              <button className="control-button secondary dev-edit-btn" onClick={() => onEditCard()} type="button">
                {t("editCard")}
              </button>
            ) : null}
            <button className="control-button secondary" onClick={() => handleClose(false)} type="button">
              {t("close")}
            </button>
          </div>
        </div>

        {isDevMode && canDeleteCard ? (
          <div className="modal-card-dev-actions">
            <button className="control-button secondary dev-delete-btn" onClick={() => onDeleteCustomCard()} type="button">
              {t("deleteCard")}
            </button>
          </div>
        ) : null}

        {category === "music" ? (
          <>
            <div className="media-frame music-frame">
              {item.media.type === "audio" ? (
                item.media.src ? (
                  <audio
                    aria-label={t("audioHint", { number: (itemIndex ?? 0) + 1 })}
                    controls
                    onEnded={handleMusicAudioStopped}
                    onPause={handleMusicAudioStopped}
                    onPlaying={handleMusicAudioPlaying}
                    onWaiting={handleMusicAudioStopped}
                    preload="none"
                    ref={musicAudioRef}
                    src={getPlayableMediaSrc(item.media.src)}
                  />
                ) : (
                  <div className="audio-placeholder">
                    <p className="modal-copy">{t("missingAudio")}</p>
                  </div>
                )
              ) : null}
              {isMediaTimerEnabled ? <MediaTimer language={language} remaining={musicRemaining} /> : null}
            </div>
            <section className={`answer-panel ${answerVisible ? "" : "is-hidden"}`}>
              <h3>{t("answer")}</h3>
              <p>{item.answer}</p>
            </section>
          </>
        ) : null}

        {category === "movies" ? (
          <>
            <div className="media-frame">
              {item.media.src ? (
                <video
                  aria-label={t("videoHint", { number: (itemIndex ?? 0) + 1 })}
                  onEnded={handleMovieVideoStopped}
                  onClick={toggleMovieVideo}
                  onPause={handleMovieVideoStopped}
                  onPlaying={handleMovieVideoPlaying}
                  onWaiting={handleMovieVideoStopped}
                  playsInline
                  poster={item.media.poster}
                  preload="none"
                  ref={movieVideoRef}
                  src={getPlayableMediaSrc(item.media.src)}
                />
              ) : (
                <div className="video-placeholder">
                  <p className="modal-copy">{t("noVideo")}</p>
                </div>
              )}
              {isMediaTimerEnabled ? <MediaTimer language={language} remaining={musicRemaining} /> : null}
            </div>
            <section className={`answer-panel ${answerVisible ? "" : "is-hidden"}`}>
              <h3>{t("answer")}</h3>
              <p>{item.answer}</p>
            </section>
          </>
        ) : null}

        {category === "facts" ? (
          <>
            <div className="fact-frame">
              <p className="fact-statement">{item.question}</p>
              <div className="choice-row">
                <FactChoiceButton answerVisible={answerVisible} choice correct={item.answer} language={language} onClick={() => setSelectedFactAnswer(true)} selected={selectedFactAnswer} />
                <FactChoiceButton answerVisible={answerVisible} choice={false} correct={item.answer} language={language} onClick={() => setSelectedFactAnswer(false)} selected={selectedFactAnswer} />
              </div>
              {selectedFactAnswer !== null ? (
                <p className="choice-note">{t("userChoice", { value: selectedFactAnswer ? t("true").toLowerCase() : t("false").toLowerCase() })}</p>
              ) : null}
            </div>
            <section className="answer-panel">
              <h3>{t("answer")}</h3>
              {answerVisible ? (
                <>
                  <p>{item.answer ? t("true") : t("false")}</p>
                  {item.description ? <p className="answer-meta">{item.description}</p> : null}
                </>
              ) : (
                <p className="answer-panel-placeholder">{t("factAnswerHidden")}</p>
              )}
            </section>
          </>
        ) : null}

        {!answerVisible ? (
          <div className="modal-actions">
            <button className="control-button primary" onClick={handleReveal} type="button">
              {t("revealAnswer")}
            </button>
            <button className="control-button secondary" onClick={() => handleClose(true)} type="button">
              {t("markComplete")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MediaTimer({ language, remaining }) {
  const t = useMemo(() => createTranslator(language), [language]);
  return (
    <div className="media-timer">
      <div className="timer-bar">
        <div
          className="timer-progress"
          style={{
            width: `${(remaining / MUSIC_LISTEN_DURATION_SEC) * 100}%`,
          }}
        />
      </div>
      <p>
        <strong>{t("remaining", { seconds: Math.ceil(remaining) })}</strong>
      </p>
    </div>
  );
}

function FactChoiceButton({ answerVisible, choice, correct, language, onClick, selected }) {
  const t = useMemo(() => createTranslator(language), [language]);
  const isSelected = selected === choice;
  const isCorrect = answerVisible && correct === choice;
  const isWrong = answerVisible && isSelected && correct !== choice;

  return (
    <button
      className={`choice-button ${isSelected ? "is-selected" : ""} ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""}`}
      onClick={onClick}
      type="button"
    >
      {choice ? t("true") : t("false")}
    </button>
  );
}

