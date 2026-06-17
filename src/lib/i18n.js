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
    roomDeleteButton: "Удалить комнату",
    roomDeleteConfirm: "Удалить эту комнату? Ссылка перестанет работать, данные квиза будут удалены.",
    roomDeleteFailed: "Не удалось удалить комнату.",
    roomDeleted: "Комната удалена.",
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
    roomAccessRequired: "Комната не найдена или недоступна.",
    roomAccessTitle: "Вход в комнату",
    roomAccessSubmit: "Открыть комнату",
    roomAccessTokenLabel: "Токен доступа",
    roomAccessTokenPlaceholder: "Вставьте токен из ссылки (?t=...)",
    roomOwnerAccessExpiry: ({ date }) => `Права редактирования действуют до ${date}.`,
    roomOwnerTokenExpired: "Срок действия прав редактирования истёк. Обновите ссылку доступа, если вы организатор.",
    roomRenewAccessButton: "Обновить ссылку",
    roomAccessRenewed: "Новая ссылка для участников создана.",
    roomAccessRenewFailed: "Не удалось обновить ссылку доступа.",
    roomShareHint: "Поделитесь ссылкой ниже — участники смогут проходить квиз без регистрации и без токена.",
    authLoginButton: "Войти",
    authLoginFailed: "Не удалось открыть комнату. Проверьте ссылку или ID.",
    authLoginHint: "Вставьте ссылку приглашения или укажите ID комнаты и токен доступа.",
    authRoomLoginHint: "Вставьте ссылку приглашения или ID комнаты — токен не нужен.",
    authRoomIdOrLinkLabel: "Ссылка или ID комнаты",
    authRoomIdOrLinkPlaceholder: "https://.../room/id или abc123xyz",
    authRoomIdRequired: "Укажите ссылку или ID комнаты.",
    authRoomOpenButton: "Открыть комнату",
    authLoginTitle: "Вход",
    authLogoutButton: "Выйти",
    authRoleGuest: "Участник",
    authRoleOwner: "Организатор",
    authRoomIdLabel: "ID комнаты",
    authRoomIdPlaceholder: "abc123xyz",
    authSessionLabel: ({ role, roomId }) => `${role} · ${roomId}`,
    authTokenOrLinkLabel: "Токен или ссылка",
    authTokenOrLinkPlaceholder: "https://.../room/id?t=...",
    authTabAccount: "Аккаунт",
    authTabRoom: "Комната",
    authTabsLabel: "Способ входа",
    accountAuthFailed: "Не удалось выполнить вход или регистрацию.",
    accountEmailLabel: "Email",
    accountEmailPlaceholder: "you@example.com",
    accountHaveAccount: "Уже есть аккаунт?",
    accountLoginButton: "Войти в аккаунт",
    accountLoginHint: "Войдите, чтобы создавать и управлять своими комнатами.",
    accountLogoutButton: "Выйти из аккаунта",
    accountNeedAccount: "Нет аккаунта?",
    accountPasswordLabel: "Пароль",
    accountPasswordPlaceholder: "Минимум 8 символов",
    accountRegisterButton: "Зарегистрироваться",
    accountRegisterHint: "Создайте аккаунт организатора для своих комнат квиза.",
    accountSessionLabel: ({ email }) => email,
    myRoomsEmpty: "У вас пока нет комнат. Создайте первую, чтобы поделиться квизом.",
    myRoomsLoginRequired: "Войдите в аккаунт, чтобы создавать и управлять комнатами.",
    myRoomsOpenRoom: "Открыть",
    myRoomsTitle: "Мои комнаты",
    platformIntroTitle: "Интерактивные квизы для компании и мероприятий",
    platformIntroLead:
      "Quiz Mix объединяет музыкальные, кинематографические и фактологические раунды в одном месте. Организаторы собирают набор карточек, публикуют комнату по ссылке, а участники проходят квиз прямо в браузере — без установки приложения.",
    platformFeatureQuizzesTitle: "Три формата заданий",
    platformFeatureQuizzesText:
      "Музыка, кино и факты — каждый раунд со своей механикой: аудиофрагменты, видео и утверждения «правда или ложь».",
    platformFeatureRoomsTitle: "Комнаты по ссылке",
    platformFeatureRoomsText:
      "Создайте комнату, поделитесь ссылкой с гостями и отслеживайте прогресс. Участникам не нужна регистрация — достаточно открыть приглашение.",
    platformFeatureEditorTitle: "Свои карточки",
    platformFeatureEditorText:
      "Добавляйте вопросы, загружайте медиа и обновляйте набор в любой момент. Комната всегда показывает актуальную версию квиза.",
    platformIntroCta: "Войдите в аккаунт, чтобы создавать комнаты и управлять своими квизами.",
    roomClaimButton: "Привязать к аккаунту",
    roomClaimFailed: "Не удалось привязать комнату к аккаунту.",
    roomClaimHint: "Есть комната с ключом организатора? Привяжите её к аккаунту.",
    roomClaimed: "Комната привязана к вашему аккаунту.",
    roomSessionLogoutButton: "Выйти из комнаты",
    roomSessionLabel: ({ role, roomId }) => `${role} · ${roomId}`,
    addQuestCategory: "Добавить категорию квестов",
    addQuestCategoryTitle: "Новая категория квестов",
    addQuestCategoryHint: "Выберите тип заданий для нового набора карточек.",
    roomEmptyGuest: "В этой комнате пока нет категорий квестов.",
    roomAddQuizHint: "Добавьте набор квестов, чтобы начать",
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
    roomDeleteButton: "Delete room",
    roomDeleteConfirm: "Delete this room? The link will stop working and quiz data will be removed.",
    roomDeleteFailed: "Failed to delete room.",
    roomDeleted: "Room deleted.",
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
    roomAccessRequired: "Room not found or unavailable.",
    roomAccessTitle: "Room access",
    roomAccessSubmit: "Open room",
    roomAccessTokenLabel: "Access token",
    roomAccessTokenPlaceholder: "Paste the token from the link (?t=...)",
    roomOwnerAccessExpiry: ({ date }) => `Edit rights are valid until ${date}.`,
    roomOwnerTokenExpired: "Edit rights have expired. Renew the access link if you are the host.",
    roomRenewAccessButton: "Renew link",
    roomAccessRenewed: "A new participant link has been created.",
    roomAccessRenewFailed: "Failed to renew the access link.",
    roomShareHint: "Share the link below — participants can play the quiz without signing in or using a token.",
    authLoginButton: "Log in",
    authLoginFailed: "Could not open the room. Check the link or room ID.",
    authLoginHint: "Paste an invite link or enter the room ID and access token.",
    authRoomLoginHint: "Paste an invite link or room ID — no token required.",
    authRoomIdOrLinkLabel: "Invite link or room ID",
    authRoomIdOrLinkPlaceholder: "https://.../room/id or abc123xyz",
    authRoomIdRequired: "Enter an invite link or room ID.",
    authRoomOpenButton: "Open room",
    authLoginTitle: "Sign in",
    authLogoutButton: "Log out",
    authRoleGuest: "Guest",
    authRoleOwner: "Host",
    authRoomIdLabel: "Room ID",
    authRoomIdPlaceholder: "abc123xyz",
    authSessionLabel: ({ role, roomId }) => `${role} · ${roomId}`,
    authTokenOrLinkLabel: "Token or link",
    authTokenOrLinkPlaceholder: "https://.../room/id?t=...",
    authTabAccount: "Account",
    authTabRoom: "Room",
    authTabsLabel: "Sign-in method",
    accountAuthFailed: "Sign-in or registration failed.",
    accountEmailLabel: "Email",
    accountEmailPlaceholder: "you@example.com",
    accountHaveAccount: "Already have an account?",
    accountLoginButton: "Sign in",
    accountLoginHint: "Sign in to create and manage your quiz rooms.",
    accountLogoutButton: "Sign out",
    accountNeedAccount: "Need an account?",
    accountPasswordLabel: "Password",
    accountPasswordPlaceholder: "At least 8 characters",
    accountRegisterButton: "Create account",
    accountRegisterHint: "Create a host account for your quiz rooms.",
    accountSessionLabel: ({ email }) => email,
    myRoomsEmpty: "You have no rooms yet. Create one to share your quiz.",
    myRoomsLoginRequired: "Sign in to create and manage rooms.",
    myRoomsOpenRoom: "Open",
    myRoomsTitle: "My rooms",
    platformIntroTitle: "Interactive quizzes for teams and events",
    platformIntroLead:
      "Quiz Mix brings music, movie, and fact rounds together in one place. Hosts build card sets, publish a room link, and guests play in the browser — no app install required.",
    platformFeatureQuizzesTitle: "Three quiz formats",
    platformFeatureQuizzesText:
      "Music, movies, and facts — each round has its own mechanic: audio clips, video, and true-or-false statements.",
    platformFeatureRoomsTitle: "Rooms via link",
    platformFeatureRoomsText:
      "Create a room, share the link with guests, and track progress. Participants don't need an account — just open the invite.",
    platformFeatureEditorTitle: "Custom cards",
    platformFeatureEditorText:
      "Add questions, upload media, and refresh the set anytime. The room always shows the latest version of your quiz.",
    platformIntroCta: "Sign in to create rooms and manage your quizzes.",
    roomClaimButton: "Link to account",
    roomClaimFailed: "Failed to link the room to your account.",
    roomClaimHint: "Have a room with a host key? Link it to your account.",
    roomClaimed: "Room linked to your account.",
    roomSessionLogoutButton: "Leave room",
    roomSessionLabel: ({ role, roomId }) => `${role} · ${roomId}`,
    addQuestCategory: "Add quest category",
    addQuestCategoryTitle: "New quest category",
    addQuestCategoryHint: "Choose the task type for a new card set.",
    roomEmptyGuest: "This room has no quest categories yet.",
    roomAddQuizHint: "Add a quest set to get started",
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

  const candidates = [
    ...(window.navigator.languages || []),
    window.navigator.language || "",
  ];

  for (const code of candidates) {
    const normalized = String(code).toLowerCase();
    if (normalized.startsWith("ru")) {
      return LANGUAGES.ru;
    }
    if (normalized.startsWith("en")) {
      return LANGUAGES.en;
    }
  }

  return LANGUAGES.ru;
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
