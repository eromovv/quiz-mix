export const LANGUAGE_KEY = "quiz_ui_language";

export const LANGUAGES = {
  ru: "ru",
  en: "en",
};

const CATEGORY_TRANSLATIONS = {
  ru: {
    music: {
      title: "Музыка",
      description: "Прослушайте короткие музыкальные фрагменты и определите их название и исполнителя",
    },
    movies: {
      title: "Кино",
      description: "Просмотрите короткие фрагменты фильмов и угадайте их название",
    },
    facts: {
      title: "Факты",
      description: "Решите для каждого утверждения, верно оно или нет",
    },
  },
  en: {
    music: {
      title: "Music",
      description: "Listen to short music clips and identify their title and artist",
    },
    movies: {
      title: "Movies",
      description: "Watch short movie clips and guess the title",
    },
    facts: {
      title: "Facts",
      description: "Decide whether each statement is true or false",
    },
  },
};

const TRANSLATIONS = {
  ru: {
    add: "Добавить",
    addCard: "Добавить карточку",
    answer: "Ответ",
    audioHint: ({ number }) => `Музыкальная подсказка ${number}`,
    back: "Назад",
    cancel: "Отмена",
    cardsCompleted: ({ title }) => `Карточек «${title}» пройдено`,
    chooseAudioFile: "Выберите аудиофайл для загрузки.",
    chooseVideoFile: "Выберите видеофайл для загрузки.",
    close: "Закрыть",
    completed: "Выполнено",
    copy: "Копировать",
    copiedLink: "Ссылка скопирована",
    copyLinkManually: "Скопируйте ссылку из поля ниже.",
    createRoom: "Создать комнату",
    deleteCard: "Удалить карточку",
    deleteCardConfirm: "Удалить эту пользовательскую карточку? Прогресс по ней будет сброшен.",
    editCard: "Изменить карточку",
    editCardTitle: "Изменить карточку",
    editorMode: "Редактор",
    editorModeTitle: "Редактирование: добавление, удаление и правка пользовательских карточек",
    factAnswerHidden: "Правильный вариант и пояснение появятся после нажатия «Показать ответ».",
    factExplanationLabel: "Пояснение после ответа",
    factQuestionLabel: "Утверждение",
    false: "Неверно",
    hideRoundSummary: "Скрыть количество раундов и вопросов",
    homeSettings: "Главная",
    language: "Язык",
    languageEnglish: "English",
    languageRussian: "Русский",
    loadRoomFailed: "Не удалось загрузить комнату.",
    loading: "Загрузка...",
    markComplete: "Отметить выполненным",
    mediaTimers: "Таймер карточек",
    missingAudio: "Для этой карточки не задан URL аудио из Vercel Blob.",
    missingFactFields: "Заполните утверждение и пояснение.",
    missingMusicFields: "Загрузите аудиофайл и укажите правильный ответ.",
    missingVideoFields: "Загрузите видеофайл и укажите правильный ответ.",
    movieCorrectTitle: "Правильное название фильма",
    musicUploadLabel: "Загрузить музыку в Vercel Blob",
    newCard: "Новая карточка",
    noVideo: "Для этой карточки не задан URL видео из Vercel Blob.",
    open: "Открыть",
    previewMode: "Превью",
    previewModeTitle: "Только прохождение квиза без правок карточек",
    quizFlowChaotic: "Хаотичный",
    quizFlowChaoticTitle: "Все наборы квизов доступны сразу",
    quizFlowThreshold: "Порог прохождения",
    quizFlowMode: "Прохождение квизов",
    quizFlowSequential: "Последовательный",
    quizFlowSequentialTitle: "Следующий набор открывается после прохождения порога в предыдущем",
    quizCategoryLockedAction: ({ threshold }) => `Для открытия нужно открыть ${threshold} карточек в предыдущем наборе`,
    quizCategoryLocked: ({ threshold }) => `Откроется после ${threshold} пройденных карточек в предыдущем наборе.`,
    quizCategoryPageLocked: ({ threshold }) => `Этот набор откроется после ${threshold} пройденных карточек в предыдущем наборе.`,
    quizThresholdNotice: ({ current, threshold }) => `В этом наборе ${current}/${threshold} карточек для выбранного порога. Добавьте ещё карточки или уменьшите порог.`,
    questionCounter: ({ category, current, total }) => `${category} — вопрос ${current}${total > 0 ? ` из ${total}` : ""}`,
    remaining: ({ seconds }) => `Осталось: ${seconds} с`,
    revealAnswer: "Показать ответ",
    room: "Комната",
    roomCreated: "Комната создана. Ссылка готова для участников.",
    roomCreateFailed: "Не удалось создать комнату.",
    roomLoadErrorTitle: "Комната не открылась",
    roomLoading: "Загружаем комнату...",
    roomMyRoom: "Моя комната",
    roomOnlyPreview: "Комната открыта только для прохождения.",
    roomPanelSubtitle: "Создайте ссылку на текущий набор карточек или обновите уже созданную комнату",
    roomPanelTitle: "Комната квиза",
    roomProgressNote: "Вы проходите опубликованный квиз в preview-режиме. Прогресс сохраняется только на этом устройстве.",
    roomUpdateButton: "Обновить комнату",
    roomUpdated: "Комната обновлена. Публичная ссылка осталась прежней.",
    roomUpdateFailed: "Не удалось обновить комнату.",
    roomAccessExpired: "Ссылка доступа истекла. Попросите организатора обновить ссылку.",
    roomAccessExpiry: ({ date }) => `Ссылка для участников действует до ${date}.`,
    roomAccessRequired: "Для входа в комнату нужна ссылка с токеном доступа или ключ от организатора.",
    roomAccessTitle: "Вход в комнату",
    roomAccessSubmit: "Открыть комнату",
    roomAccessTokenLabel: "Токен доступа",
    roomAccessTokenPlaceholder: "Вставьте токен из ссылки (?t=...)",
    roomOwnerAccessExpiry: ({ date }) => `Права редактирования действуют до ${date}.`,
    roomOwnerTokenExpired: "Срок действия прав редактирования истёк. Обновите ссылку доступа, если вы организатор.",
    roomRenewAccessButton: "Обновить ссылку",
    roomAccessRenewed: "Новая ссылка для участников создана.",
    roomAccessRenewFailed: "Не удалось обновить ссылку доступа.",
    roomShareHint: "Поделитесь ссылкой ниже — участники смогут проходить квиз без редактирования.",
    authLoginButton: "Войти",
    authLoginFailed: "Не удалось войти. Проверьте ID комнаты и токен.",
    authLoginHint: "Вставьте ссылку приглашения или укажите ID комнаты и токен доступа.",
    authLoginTitle: "Вход",
    authLogoutButton: "Выйти",
    authRoleGuest: "Участник",
    authRoleOwner: "Организатор",
    authRoomIdLabel: "ID комнаты",
    authRoomIdPlaceholder: "abc123xyz",
    authSessionLabel: ({ role, roomId }) => `${role} · ${roomId}`,
    authTokenOrLinkLabel: "Токен или ссылка",
    authTokenOrLinkPlaceholder: "https://.../room/id?t=...",
    addQuestCategory: "Добавить категорию квестов",
    addQuestCategoryTitle: "Новая категория квестов",
    addQuestCategoryHint: "Выберите тип заданий для нового набора карточек.",
    roomEmptyGuest: "В этой комнате пока нет категорий квестов.",
    roundSummary: ({ rounds, totalQuestions }) => `${rounds} ${pluralRu(rounds, ["раунд", "раунда", "раундов"])}, ${totalQuestions} ${pluralRu(totalQuestions, ["вопрос", "вопроса", "вопросов"])}.`,
    save: "Сохранить",
    settings: "Настройки",
    settingsMode: "Режим",
    true: "Верно",
    trueOrFalse: "Правда или ложь",
    timerMusic: "Музыка",
    timerVideo: "Видео",
    uploadFailed: "Не удалось загрузить файл в Vercel Blob.",
    uploadFile: "Загрузить файл",
    uploadVideoLabel: "Загрузить видео в Vercel Blob",
    correctAnswer: "Правильный ответ",
    userChoice: ({ value }) => `Ваш выбор: ${value}`,
    allRoundQuestionsCompleted: "Все вопросы этого раунда пройдены.",
    darkTheme: "Тёмная тема",
    lightTheme: "Светлая тема",
    videoHint: ({ number }) => `Видео-подсказка к фильму ${number}`,
  },
  en: {
    add: "Add",
    addCard: "Add card",
    answer: "Answer",
    audioHint: ({ number }) => `Music hint ${number}`,
    back: "Back",
    cancel: "Cancel",
    cardsCompleted: ({ title }) => `${title} cards completed`,
    chooseAudioFile: "Choose an audio file to upload.",
    chooseVideoFile: "Choose a video file to upload.",
    close: "Close",
    completed: "Completed",
    copy: "Copy",
    copiedLink: "Link copied",
    copyLinkManually: "Copy the link from the field below.",
    createRoom: "Create room",
    deleteCard: "Delete card",
    deleteCardConfirm: "Delete this custom card? Progress for it will be reset.",
    editCard: "Edit card",
    editCardTitle: "Edit card",
    editorMode: "Editor",
    editorModeTitle: "Editing: add, delete, and update custom cards",
    factAnswerHidden: 'The correct choice and explanation appear after you tap "Show answer".',
    factExplanationLabel: "Explanation after answer",
    factQuestionLabel: "Statement",
    false: "False",
    hideRoundSummary: "Hide number of rounds and questions",
    homeSettings: "Home",
    language: "Language",
    languageEnglish: "English",
    languageRussian: "Русский",
    loadRoomFailed: "Failed to load room.",
    loading: "Uploading...",
    markComplete: "Mark complete",
    mediaTimers: "Card timers",
    missingAudio: "This card has no Vercel Blob audio URL.",
    missingFactFields: "Fill in the statement and explanation.",
    missingMusicFields: "Upload an audio file and enter the correct answer.",
    missingVideoFields: "Upload a video file and enter the correct answer.",
    movieCorrectTitle: "Correct movie title",
    musicUploadLabel: "Upload music to Vercel Blob",
    newCard: "New card",
    noVideo: "This card has no Vercel Blob video URL.",
    open: "Open",
    previewMode: "Preview",
    previewModeTitle: "Quiz playthrough only, no card edits",
    quizFlowChaotic: "Free order",
    quizFlowChaoticTitle: "All quiz sets are available at once",
    quizFlowThreshold: "Completion threshold",
    quizFlowMode: "Quiz flow",
    quizFlowSequential: "Sequential",
    quizFlowSequentialTitle: "The next set opens after reaching the threshold in the previous set",
    quizCategoryLockedAction: ({ threshold }) => `To unlock, open ${threshold} cards in the previous set`,
    quizCategoryLocked: ({ threshold }) => `Opens after ${threshold} completed cards in the previous set.`,
    quizCategoryPageLocked: ({ threshold }) => `This set opens after ${threshold} completed cards in the previous set.`,
    quizThresholdNotice: ({ current, threshold }) => `This set has ${current}/${threshold} cards for the selected threshold. Add more cards or lower the threshold.`,
    questionCounter: ({ category, current, total }) => `${category} - question ${current}${total > 0 ? ` of ${total}` : ""}`,
    remaining: ({ seconds }) => `Remaining: ${seconds}s`,
    revealAnswer: "Show answer",
    room: "Room",
    roomCreated: "Room created. The link is ready for participants.",
    roomCreateFailed: "Failed to create room.",
    roomLoadErrorTitle: "Room did not open",
    roomLoading: "Loading room...",
    roomMyRoom: "My room",
    roomOnlyPreview: "Room is open for playthrough only.",
    roomPanelSubtitle: "Create a link for the current card set or update an existing room",
    roomPanelTitle: "Quiz room",
    roomProgressNote: "You are playing a published quiz in preview mode. Progress is saved only on this device.",
    roomUpdateButton: "Update room",
    roomUpdated: "Room updated. The public link stayed the same.",
    roomUpdateFailed: "Failed to update room.",
    roomAccessExpired: "The access link has expired. Ask the host for a new link.",
    roomAccessExpiry: ({ date }) => `Participant link is valid until ${date}.`,
    roomAccessRequired: "You need an access link with a token or the host key to open this room.",
    roomAccessTitle: "Room access",
    roomAccessSubmit: "Open room",
    roomAccessTokenLabel: "Access token",
    roomAccessTokenPlaceholder: "Paste the token from the link (?t=...)",
    roomOwnerAccessExpiry: ({ date }) => `Edit rights are valid until ${date}.`,
    roomOwnerTokenExpired: "Edit rights have expired. Renew the access link if you are the host.",
    roomRenewAccessButton: "Renew link",
    roomAccessRenewed: "A new participant link has been created.",
    roomAccessRenewFailed: "Failed to renew the access link.",
    roomShareHint: "Share the link below — participants can play the quiz without editing.",
    authLoginButton: "Log in",
    authLoginFailed: "Sign-in failed. Check the room ID and access token.",
    authLoginHint: "Paste an invite link or enter the room ID and access token.",
    authLoginTitle: "Sign in",
    authLogoutButton: "Log out",
    authRoleGuest: "Guest",
    authRoleOwner: "Host",
    authRoomIdLabel: "Room ID",
    authRoomIdPlaceholder: "abc123xyz",
    authSessionLabel: ({ role, roomId }) => `${role} · ${roomId}`,
    authTokenOrLinkLabel: "Token or link",
    authTokenOrLinkPlaceholder: "https://.../room/id?t=...",
    addQuestCategory: "Add quest category",
    addQuestCategoryTitle: "New quest category",
    addQuestCategoryHint: "Choose the task type for a new card set.",
    roomEmptyGuest: "This room has no quest categories yet.",
    roundSummary: ({ rounds, totalQuestions }) => `${rounds} ${pluralEn(rounds, "round")}, ${totalQuestions} ${pluralEn(totalQuestions, "question")}.`,
    save: "Save",
    settings: "Settings",
    settingsMode: "Mode",
    true: "True",
    trueOrFalse: "True or false",
    timerMusic: "Music",
    timerVideo: "Video",
    uploadFailed: "Failed to upload file to Vercel Blob.",
    uploadFile: "Upload file",
    uploadVideoLabel: "Upload video to Vercel Blob",
    correctAnswer: "Correct answer",
    userChoice: ({ value }) => `Your choice: ${value}`,
    allRoundQuestionsCompleted: "All questions in this round are completed.",
    darkTheme: "Dark theme",
    lightTheme: "Light theme",
    videoHint: ({ number }) => `Movie video hint ${number}`,
  },
};

function pluralRu(value, forms) {
  const abs = Math.abs(value) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) {
    return forms[2];
  }
  if (last > 1 && last < 5) {
    return forms[1];
  }
  if (last === 1) {
    return forms[0];
  }
  return forms[2];
}

function pluralEn(value, singular) {
  return value === 1 ? singular : `${singular}s`;
}

export function normalizeLanguage(value) {
  return value === LANGUAGES.en ? LANGUAGES.en : LANGUAGES.ru;
}

export function getBrowserLanguage() {
  if (typeof window === "undefined") {
    return LANGUAGES.ru;
  }
  const browserLanguage = window.navigator.language || window.navigator.languages?.[0] || "";
  return browserLanguage.toLowerCase().startsWith("en") ? LANGUAGES.en : LANGUAGES.ru;
}

export function loadLanguage() {
  if (typeof window === "undefined") {
    return LANGUAGES.ru;
  }
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  if (stored === LANGUAGES.ru || stored === LANGUAGES.en) {
    return stored;
  }
  return getBrowserLanguage();
}

export function saveLanguage(language) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LANGUAGE_KEY, normalizeLanguage(language));
}

export function createTranslator(language) {
  const normalized = normalizeLanguage(language);
  return (key, params = {}) => {
    const value = TRANSLATIONS[normalized][key] ?? TRANSLATIONS.ru[key] ?? key;
    return typeof value === "function" ? value(params) : value;
  };
}

export function getCategoryMeta(language, category) {
  const normalized = normalizeLanguage(language);
  return CATEGORY_TRANSLATIONS[normalized][category] ?? CATEGORY_TRANSLATIONS.ru[category];
}
