const WATCH_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "PEPEUSDT",
];
const EXCHANGE_OPTIONS = [
  { id: "bybit", label: "Bybit" },
  { id: "binance", label: "Binance" },
];
const WATCHLIST_REFRESH_INTERVAL_MS = 30000;
const TRADE_REFRESH_INTERVAL_MS = 30000;
const FUTURES_REFRESH_INTERVAL_MS = 180000;
const SIGNAL_CHART_REFRESH_INTERVAL_MS = 5000;
const SIGNAL_AUDIO_ENABLED_STORAGE_KEY = "tradeflow-signal-audio-enabled";
const BALANCE_PRIVACY_STORAGE_KEY = "tradeflow-balance-hidden";
const FORM_DRAFT_STORAGE_KEY = "tradeflow-form-drafts";
const AUTH_SESSION_TOKEN_STORAGE_KEY = "tradeflow-session-token";
const APP_VERSION = "1.3.0";
const PWA_INSTALL_DISMISSED_UNTIL_KEY = "netruefi-pwa-install-dismissed-until";
const PWA_INSTALL_VISITS_KEY = "netruefi-pwa-install-visits";
const PWA_INSTALL_DELAY_MS = 9000;
const PWA_INSTALL_DISMISS_MS = 1000 * 60 * 60 * 24 * 5;
const PWA_NOTIFICATION_DISMISSED_UNTIL_KEY = "netruefi-pwa-notification-dismissed-until";
const PWA_NOTIFICATION_DISMISS_MS = 1000 * 60 * 60 * 24 * 3;
const REFERRAL_CODE_STORAGE_KEY = "netruefi-referral-code";
const FORM_DRAFT_EXCLUDED_FIELD_KEYS = new Set([
  "trade-symbol",
  "trade-price",
  "trade-quantity",
  "trade-total",
  "trade-tp",
]);
const ACTIVE_API_ORDER_STATUSES = new Set(["NEW", "PARTIALLY_FILLED", "PENDING_NEW"]);
const STABLECOIN_ASSETS = ["USDT", "USDC", "FDUSD", "BUSD"];
const KNOWN_QUOTE_ASSETS = ["USDT", "USDC", "FDUSD", "BUSD", "BTC", "ETH", "EUR", "BRL", "TRY"];
const EXCLUDED_PROFIT_LOSS_REPORT_SYMBOLS = new Set(["ZENUSDT"]);
const VTU_NETWORKS = [
  { id: "mtn", label: "MTN NG", shortLabel: "MTN", logo: "MTN" },
  { id: "airtel", label: "AIRTEL NG", shortLabel: "airtel", logo: "airtel" },
  { id: "glo", label: "GLO NG", shortLabel: "glo", logo: "glo" },
  { id: "9mobile", label: "9MOBILE", shortLabel: "9mobile", logo: "9mobile" },
];
const VTU_PLAN_CATEGORIES = ["Daily", "Weekly", "Monthly", "Yearly"];
const SIGNAL_INTERVAL_OPTIONS = ["15m", "1h", "1d"];
const SIGNAL_CHART_TYPES = [
  { id: "candles", label: "Candles" },
  { id: "line", label: "Line" },
];

function loadFormDraftsFromStorage() {
  try {
    return JSON.parse(sessionStorage.getItem(FORM_DRAFT_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
const SPOT_MIRROR_GUIDANCE = {
  bybit: {
    referenceMinUsdt: 5,
    ruleLabel: "minOrderAmt / minOrderQty",
    copy: "Bybit checks the live symbol minimum amount and quantity before a mirror spot order is submitted.",
  },
  binance: {
    referenceMinUsdt: 10,
    ruleLabel: "MIN_NOTIONAL / NOTIONAL",
    copy: "Binance checks the live symbol notional and lot-size filters before a mirror spot order is submitted.",
  },
};
const API_BASE_URL = String(window.TRADE_API_BASE_URL || "").replace(/\/$/, "");

function toApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

function toWebSocketUrl(path) {
  const baseUrl = API_BASE_URL || window.location.origin;
  const url = new URL(path, baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

function getDefaultSignalAutoTradeState() {
  return {
    settings: {
      enabled: false,
      firstTradeBalancePercent: 50,
      secondTradeBalancePercent: 100,
      maxSimultaneousTrades: 2,
    },
    runtime: {
      exchange: "bybit",
      activeTrades: 0,
      remainingSlots: 2,
      nextAllocationPercent: 50,
    },
    loaded: false,
  };
}

const state = {
  user: null,
  theme: localStorage.getItem("tradeflow-theme") || "light",
  authExchange: localStorage.getItem("tradeflow-auth-exchange") || "bybit",
  selectedExchange: localStorage.getItem("tradeflow-selected-exchange") || "bybit",
  authTab: "login",
  showSplash: false,
  hasShownSplash: true,
  activeTab: "home",
  isLoading: false,
  modalError: null,
  actionModal: null,
  menuSheetOpen: false,
  notice: null,
  balances: [],
  openOrders: [],
  trades: [],
  dashboardMarketMode: "spot",
  hideBalanceAmounts: localStorage.getItem(BALANCE_PRIVACY_STORAGE_KEY) === "true",
  futuresAccount: null,
  futuresLastLoadedAt: 0,
  futuresError: "",
  loadingFutures: false,
  expandedFuturesPositionIds: [],
  expandedFuturesOrderIds: [],
  reportPeriod: "days",
  users: [],
  adminUserSearch: "",
  adminUsersModalScrollTop: 0,
  adminDepositSettingsDraft: null,
  adminDeposits: [],
  adminWithdrawals: [],
  adminTransactions: [],
  adminGiftCards: [],
  adminVtuTransactions: [],
  referralProfile: null,
  adminReferrals: null,
  loadingReferral: false,
  paymentBanks: [],
  paymentBanksLoadedAt: 0,
  resolvedBankAccount: null,
  financialDashboard: null,
  vtuSettings: null,
  vtuDataPlans: [],
  vtuDataPlansNetwork: "",
  vtuTransactions: [],
  loadingVtu: false,
  digitalServices: {
    settings: null,
    products: [],
    categories: [],
    orders: [],
    query: "",
    category: "",
    loading: false,
    admin: null,
  },
  notifications: [],
  showNotifications: false,
  totalUsdt: 0,
  previousTotalUsdt: 0,
  totalNgn: 0,
  accountTotalAvailableBalance: 0,
  usdtNgnRate: 0,
  todayPnlValue: 0,
  todayPnlPercent: 0,
  todayLabel: "",
  monthPnlValue: 0,
  monthPnlPercent: 0,
  monthLabel: "",
  estimatedPnlValue: 0,
  estimatedPnlPercent: 0,
  loadingWatchlist: false,
  loadingAccount: false,
  loadingTrades: false,
  loadingUsers: false,
  loadingAdminFinance: false,
  loadingFinancial: false,
  watchlistSeed: [],
  spotSymbols: [],
  spotSymbolsLoadedAt: 0,
  signalChart: {
    symbol: "",
    interval: "15m",
    chartType: "candles",
    candles: [],
    guidePrice: null,
    loading: false,
  },
  liveMap: {},
  tradeMarketMap: {},
  showAllBalances: false,
  showAllWatchlist: false,
  expandedTradeIds: [],
  expandedPendingOrderIds: [],
  expandedAdminUserIds: [],
  expandedListKeys: [],
  settingsDisclosureOpen: {},
  selectedHistoryTradeIds: [],
  selectedFinanceHistoryIds: [],
  adminPasswordDrafts: {},
  revealedAdminPasswordIds: [],
  volatileFieldDrafts: {},
  settingsDraft: {
    apiKey: "",
    apiSecret: "",
    testnet: "false",
  },
  settingsLive: {
    connected: false,
    statusMessage: "Realtime settings sync is offline.",
  },
  settingsRenderDeferred: false,
  signalAutoTrade: getDefaultSignalAutoTradeState(),
  formDrafts: loadFormDraftsFromStorage(),
  quest: {
    status: null,
    rewards: [],
    history: [],
    admin: null,
    selectedAnswer: "",
    view: "play",
    loading: false,
    feedback: null,
    draft: null,
  },
  homePromoSlide: 0,
  socket: null,
  socketRetry: null,
  socketRefreshTimer: null,
  routeScrollSection: "",
  signalSocket: null,
  tradeRefreshTimer: null,
  signalFeed: {
    pairs: [],
    timeframe: "15m",
    supportedTimeframes: ["15m", "1h", "1d"],
    signals: [],
    streamConnected: false,
    statusMessage: "Connecting to the live signal engine...",
    notificationPermission: typeof Notification === "undefined" ? "unsupported" : Notification.permission,
    audioEnabled: localStorage.getItem(SIGNAL_AUDIO_ENABLED_STORAGE_KEY) !== "false",
    audioUnlocked: false,
    selectedIds: [],
    deleting: false,
    switchingTimeframe: false,
  },
  pwa: {
    installEvent: null,
    installPromptVisible: false,
    notificationPromptVisible: false,
    updateAvailable: false,
    serviceWorkerRegistration: null,
    pushConfig: { enabled: false, publicKey: "", preferences: {} },
    pushPreferences: null,
    pushSubscriptions: [],
    pushSubscribed: false,
    notificationPermission: typeof Notification === "undefined" ? "unsupported" : Notification.permission,
    isStandalone: false,
    isIos: false,
    isOnline: typeof navigator === "undefined" ? true : navigator.onLine !== false,
    onlineNoticeVisible: false,
  },
};

const app = document.getElementById("app");
const topbarActions = document.getElementById("topbar-actions");

let watchlistRefreshPromise = null;
let tradeRefreshPromise = null;
let futuresRefreshPromise = null;
let signalChartRefreshTimer = null;
let tradeSymbolRefreshTimer = null;
let signalAlertAudio = null;
let signalAudioUnlockHandler = null;
let questCountdownTimer = null;
let homePromoTimer = null;
const seenSignalIds = new Set();

function getAuthSessionToken() {
  try {
    return localStorage.getItem(AUTH_SESSION_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function setAuthSessionToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_SESSION_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // The session cookie remains the primary auth mechanism.
  }
}

function clearAuthSessionToken() {
  try {
    localStorage.removeItem(AUTH_SESSION_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures during logout.
  }
}

function normalizeUserPayload(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    cachedAccountSnapshot: user.cachedAccountSnapshot || null,
    cachedAccountSnapshots: user.cachedAccountSnapshots || {},
  };
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  localStorage.setItem("tradeflow-theme", state.theme);
}

function isDocumentVisible() {
  return typeof document === "undefined" || !document.hidden;
}

function shouldRefreshWatchlistLive() {
  return !!state.user && isDocumentVisible() && state.activeTab === "home";
}

function shouldRefreshTradeLive() {
  if (!state.user || !isDocumentVisible()) {
    return false;
  }
  if (state.user.role === "admin") {
    return ["home", "history", "settings", "signals", "store", "referral", "adminQuests"].includes(state.activeTab);
  }
  return ["home", "history", "signals", "store", "referral", "quest"].includes(state.activeTab);
}

function getExchangeLabel(exchange) {
  return EXCHANGE_OPTIONS.find((item) => item.id === exchange)?.label || "Bybit";
}

function setAuthExchange(exchange) {
  state.authExchange = EXCHANGE_OPTIONS.some((item) => item.id === exchange) ? exchange : "bybit";
  localStorage.setItem("tradeflow-auth-exchange", state.authExchange);
}

function getActiveExchange() {
  return state.user?.activeExchange || state.selectedExchange || state.authExchange || "bybit";
}

function getAdminDashboardExchange() {
  const preferredExchange = state.selectedExchange || state.user?.activeExchange || state.authExchange || "bybit";
  const connectedAccounts = state.user?.exchangeAccounts || {};
  if (state.user?.role !== "admin") {
    return getActiveExchange();
  }
  if (
    (preferredExchange === "bybit" && (state.user.bybitConnected || connectedAccounts.bybit)) ||
    (preferredExchange === "binance" && (state.user.binanceConnected || connectedAccounts.binance))
  ) {
    return preferredExchange;
  }
  if (state.user.bybitConnected || connectedAccounts.bybit) {
    return "bybit";
  }
  if (state.user.binanceConnected || connectedAccounts.binance) {
    return "binance";
  }
  return preferredExchange;
}

function setSelectedExchange(exchange) {
  state.selectedExchange = EXCHANGE_OPTIONS.some((item) => item.id === exchange) ? exchange : "bybit";
  localStorage.setItem("tradeflow-selected-exchange", state.selectedExchange);
}

function getSignalAlertAudio() {
  if (!signalAlertAudio) {
    signalAlertAudio = new Audio("/sounds/alert.mp3");
    signalAlertAudio.preload = "auto";
  }
  return signalAlertAudio;
}

function persistSignalAudioEnabled() {
  localStorage.setItem(SIGNAL_AUDIO_ENABLED_STORAGE_KEY, String(!!state.signalFeed.audioEnabled));
}

function clearSignalAudioAutoUnlock() {
  if (!signalAudioUnlockHandler) {
    return;
  }

  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    window.removeEventListener(eventName, signalAudioUnlockHandler, true);
  });
  signalAudioUnlockHandler = null;
}

function ensureSignalAudioAutoUnlock() {
  if (signalAudioUnlockHandler || !state.signalFeed.audioEnabled || state.signalFeed.audioUnlocked) {
    return;
  }

  signalAudioUnlockHandler = () => {
    if (!state.signalFeed.audioEnabled || state.signalFeed.audioUnlocked) {
      clearSignalAudioAutoUnlock();
      return;
    }
    void unlockSignalAudio({ silent: true });
  };

  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    window.addEventListener(eventName, signalAudioUnlockHandler, true);
  });
}

function updateSignalNotificationPermission() {
  state.signalFeed.notificationPermission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

function mergeSignalList(signals = []) {
  return [...signals]
    .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
    .filter((signal, index, list) => list.findIndex((item) => item.id === signal.id) === index)
    .slice(0, 500);
}

function areFlatArraysEqual(left = [], right = []) {
  if (left === right) {
    return true;
  }
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }
  return left.every((item, index) => item === right[index]);
}

function areSignalListsEquivalent(left = [], right = []) {
  if (left === right) {
    return true;
  }
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }
  return left.every((signal, index) => {
    const candidate = right[index];
    return candidate
      && signal.id === candidate.id
      && Number(signal.timestamp || 0) === Number(candidate.timestamp || 0)
      && String(signal.updatedAt || "") === String(candidate.updatedAt || "")
      && Number(signal.confidence || 0) === Number(candidate.confidence || 0);
  });
}

function patchSignalPaneDom(nextFeed) {
  const streamPill = document.getElementById("signal-stream-pill");
  if (streamPill) {
    streamPill.classList.toggle("live", !!nextFeed.streamConnected);
    streamPill.classList.toggle("lagging", !nextFeed.streamConnected);
  }

  const streamLabel = document.getElementById("signal-stream-label");
  if (streamLabel) {
    streamLabel.textContent = nextFeed.streamConnected ? "Live" : "Reconnecting";
  }

  const streamTimeframe = document.getElementById("signal-stream-timeframe");
  if (streamTimeframe) {
    streamTimeframe.textContent = nextFeed.timeframe || "15m";
  }

  const trackedPairsCount = document.getElementById("signal-tracked-pairs-count");
  if (trackedPairsCount) {
    trackedPairsCount.textContent = String(nextFeed?.pairs?.length || 20);
  }

  const notificationPermission = document.getElementById("signal-notification-permission");
  if (notificationPermission) {
    notificationPermission.textContent = nextFeed.notificationPermission || "default";
  }

  const recentCount = document.getElementById("signal-recent-count");
  if (recentCount) {
    recentCount.textContent = String((nextFeed.signals || []).length);
  }

  const statusMessage = document.getElementById("signal-status-message");
  if (statusMessage) {
    statusMessage.textContent = nextFeed.statusMessage || "Waiting for the next qualified setup.";
  }

  const alertsButton = document.getElementById("signal-alert-enable-btn");
  if (alertsButton) {
    alertsButton.textContent = nextFeed.audioEnabled ? "Sound on" : "Sound off";
  }
}

function shouldFullyRefreshSignalPane(previousFeed, nextFeed) {
  return !areSignalListsEquivalent(previousFeed?.signals, nextFeed?.signals)
    || !areFlatArraysEqual(previousFeed?.selectedIds, nextFeed?.selectedIds)
    || !areFlatArraysEqual(previousFeed?.supportedTimeframes, nextFeed?.supportedTimeframes)
    || String(previousFeed?.timeframe || "") !== String(nextFeed?.timeframe || "")
    || !!previousFeed?.deleting !== !!nextFeed?.deleting
    || !!previousFeed?.switchingTimeframe !== !!nextFeed?.switchingTimeframe;
}

function refreshSignalPaneDom() {
  if (!state.user || state.activeTab !== "signals") {
    return;
  }

  const host = document.getElementById("signal-page-shell-host");
  if (!host || !window.SignalPage?.renderSignalPage) {
    return;
  }

  host.innerHTML = window.SignalPage.renderSignalPage({
    signalFeed: state.signalFeed,
    trades: state.trades,
    user: state.user,
    formatNumber,
    formatUsdtUnit,
    getTradePnlPercent,
    getTradeCurrentValue,
    getTradeEntryPrice,
    getTradeCurrentMarket,
    renderExchangeBadge,
    renderTradeJoinedUsersButton,
    minTradeJoinUsdt: getMinimumTradeJoinUsdt(),
    tradeJoinBalanceUsdt: getTradeJoinBalanceUsdt(),
  });
  bindSignalFeedActions();
  bindInvestmentTradeActions();
}

function refreshSettingsPaneDom() {
  if (!state.user || state.activeTab !== "settings") {
    return;
  }

  if (shouldDeferSettingsRender()) {
    state.settingsRenderDeferred = true;
    return;
  }

  state.settingsRenderDeferred = false;
  render();
}

function shouldDeferSettingsRender() {
  if (!state.user || state.activeTab !== "settings") {
    return false;
  }
  const activeElement = document.activeElement;
  if (
    activeElement &&
    app?.contains(activeElement) &&
    ["INPUT", "SELECT", "TEXTAREA"].includes(activeElement.tagName)
  ) {
    return true;
  }
  return !!(state.actionModal && document.querySelector(".modal-card"));
}

function flushDeferredSettingsRender() {
  if (!state.settingsRenderDeferred || shouldDeferSettingsRender()) {
    return;
  }
  state.settingsRenderDeferred = false;
  render();
}

function updateSignalFeed(patch, options = {}) {
  const previousFeed = state.signalFeed;
  state.signalFeed = {
    ...state.signalFeed,
    ...patch,
  };

  if (options.render) {
    render();
    return;
  }

  if (!shouldFullyRefreshSignalPane(previousFeed, state.signalFeed)) {
    patchSignalPaneDom(state.signalFeed);
    return;
  }

  refreshSignalPaneDom();
}

function toggleSignalSelection(signalId) {
  const id = String(signalId || "").trim();
  if (!id) {
    return;
  }

  const selectedIds = state.signalFeed.selectedIds.includes(id)
    ? state.signalFeed.selectedIds.filter((item) => item !== id)
    : [...state.signalFeed.selectedIds, id];

  updateSignalFeed({ selectedIds });
}

function toggleSelectAllSignals() {
  const allIds = (state.signalFeed.signals || []).map((signal) => signal.id);
  const shouldClear = allIds.length && state.signalFeed.selectedIds.length === allIds.length;
  updateSignalFeed({
    selectedIds: shouldClear ? [] : allIds,
  });
}

async function api(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  if (typeof navigator !== "undefined" && navigator.onLine === false && !["GET", "HEAD"].includes(method)) {
    throw new Error("You're offline. Reconnect to continue.");
  }
  const sessionToken = getAuthSessionToken();
  let response;
  try {
    response = await fetch(toApiUrl(path), {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    throw new Error(
      typeof navigator !== "undefined" && navigator.onLine === false
        ? "You're offline. Reconnect to continue."
        : "We're having trouble reaching NetrueFi services. Please try again."
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function isStandalonePwa() {
  return !!(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
}

function isIosLikeDevice() {
  const platform = String(navigator.platform || "").toLowerCase();
  const userAgent = String(navigator.userAgent || "").toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || (platform === "macintel" && navigator.maxTouchPoints > 1);
}

function isPwaDismissed(key) {
  return Number(localStorage.getItem(key) || 0) > Date.now();
}

function dismissPwaPrompt(key, durationMs) {
  localStorage.setItem(key, String(Date.now() + durationMs));
}

function shouldShowInstallPrompt() {
  if (!state.user || state.pwa.isStandalone || state.pwa.installPromptVisible || isPwaDismissed(PWA_INSTALL_DISMISSED_UNTIL_KEY)) {
    return false;
  }
  const visits = Number(localStorage.getItem(PWA_INSTALL_VISITS_KEY) || 0);
  return !!state.pwa.installEvent || state.pwa.isIos || visits >= 2;
}

function scheduleInstallPrompt() {
  if (!state.user || state.pwa.isStandalone) {
    return;
  }
  window.setTimeout(() => {
    if (shouldShowInstallPrompt()) {
      state.pwa.installPromptVisible = true;
      render();
    }
  }, PWA_INSTALL_DELAY_MS);
}

function scheduleNotificationPrompt() {
  window.setTimeout(() => {
    state.pwa.notificationPermission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
    if (
      state.user &&
      canUseWebPush() &&
      !state.pwa.pushSubscribed &&
      state.pwa.notificationPermission === "default" &&
      !state.pwa.notificationPromptVisible &&
      !isPwaDismissed(PWA_NOTIFICATION_DISMISSED_UNTIL_KEY)
    ) {
      state.pwa.notificationPromptVisible = true;
      render();
    }
  }, PWA_INSTALL_DELAY_MS + 4000);
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}

function canUseWebPush() {
  return !!(
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    state.pwa.pushConfig?.enabled
  );
}

async function loadPushSettings() {
  const config = await api("/api/push/public-key").catch(() => ({ enabled: false, publicKey: "" }));
  state.pwa.pushConfig = config;
  state.pwa.notificationPermission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
  if (!state.user) {
    return;
  }
  const payload = await api("/api/push/preferences").catch(() => null);
  if (payload) {
    state.pwa.pushPreferences = payload.preferences || config.preferences || {};
    state.pwa.pushSubscriptions = payload.subscriptions || [];
    state.pwa.pushSubscribed = !!state.pwa.pushSubscriptions.length;
  }
}

async function subscribeToPushNotifications() {
  if (!state.pwa.pushConfig?.enabled || !state.pwa.pushConfig?.publicKey) {
    await loadPushSettings();
  }
  if (!state.pwa.serviceWorkerRegistration) {
    await registerNetrueServiceWorker();
  }
  if (!canUseWebPush()) {
    throw new Error("Push notifications are not available on this device yet.");
  }
  if (state.pwa.isIos && !state.pwa.isStandalone) {
    throw new Error("Install NetrueFi first to enable notifications on iPhone or iPad.");
  }

  const permission = await Notification.requestPermission();
  state.pwa.notificationPermission = permission;
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = state.pwa.serviceWorkerRegistration || await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(state.pwa.pushConfig.publicKey),
    });
  }
  const payload = await api("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      platform: state.pwa.isIos ? "ios" : "web",
      browser: navigator.userAgent,
    }),
  });
  state.pwa.pushSubscribed = true;
  state.pwa.pushSubscriptions = payload.subscription
    ? [
        payload.subscription,
        ...state.pwa.pushSubscriptions.filter((item) => item.id !== payload.subscription.id),
      ]
    : state.pwa.pushSubscriptions;
  state.pwa.pushPreferences = payload.preferences || state.pwa.pushPreferences;
  state.pwa.notificationPromptVisible = false;
}

async function updatePushPreferences(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  const preferences = {};
  Object.keys(state.pwa.pushConfig.preferences || {}).forEach((key) => {
    preferences[key] = payload[key] === "on";
  });
  const result = await api("/api/push/preferences", {
    method: "POST",
    body: JSON.stringify(preferences),
  });
  state.pwa.pushPreferences = result.preferences || preferences;
}

function hasSensitiveActionInProgress() {
  const type = String(state.actionModal?.type || "").toLowerCase();
  return /withdraw|deposit|trade|gift|vtu|airtime|data|quest/.test(type);
}

function updateAppBadge() {
  if (!navigator.setAppBadge && !navigator.clearAppBadge) {
    return;
  }
  const count = (state.notifications || []).filter((item) => !item.readAt).length;
  if (count > 0 && navigator.setAppBadge) {
    navigator.setAppBadge(count).catch(() => {});
  } else if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(() => {});
  }
}

async function registerNetrueServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    state.pwa.serviceWorkerRegistration = registration;
    if (registration.waiting) {
      state.pwa.updateAvailable = true;
      render();
    }
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) {
        return;
      }
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          state.pwa.updateAvailable = true;
          render();
        }
      });
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
    return registration;
  } catch {
    return null;
  }
}

function initPwaExperience() {
  state.pwa.isStandalone = isStandalonePwa();
  state.pwa.isIos = isIosLikeDevice();
  state.pwa.isOnline = navigator.onLine !== false;
  localStorage.setItem(PWA_INSTALL_VISITS_KEY, String(Number(localStorage.getItem(PWA_INSTALL_VISITS_KEY) || 0) + 1));

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.pwa.installEvent = event;
    scheduleInstallPrompt();
  });
  window.addEventListener("appinstalled", () => {
    state.pwa.installEvent = null;
    state.pwa.installPromptVisible = false;
    state.pwa.isStandalone = true;
    showNotice("NetrueFi installed");
  });
  window.addEventListener("online", () => {
    state.pwa.isOnline = true;
    state.pwa.onlineNoticeVisible = true;
    render();
    if (state.user) {
      void loadDashboardData();
    }
    window.setTimeout(() => {
      state.pwa.onlineNoticeVisible = false;
      render();
    }, 2800);
  });
  window.addEventListener("offline", () => {
    state.pwa.isOnline = false;
    render();
  });
  void registerNetrueServiceWorker();
  void loadPushSettings();
}

async function requireSessionUser() {
  const payload = await api("/api/auth/me");
  if (!payload.user) {
    throw new Error(
      "Login succeeded, but the session cookie was not stored or sent back. On Render this usually means the browser blocked the cookie or the deployment URL changed."
    );
  }
  return normalizeUserPayload(payload.user);
}

function beginLoading() {
  state.isLoading = true;
  render();
}

function endLoading() {
  state.isLoading = false;
  render();
}

async function withLoading(task) {
  beginLoading();
  try {
    return await task();
  } finally {
    endLoading();
  }
}

function showError(message) {
  state.modalError = message;
  state.actionModal = null;
  render();
}

function clearError() {
  state.modalError = null;
  render();
}

function persistFormDrafts() {
  try {
    sessionStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify(state.formDrafts || {}));
  } catch {
    // Session storage can be disabled; drafts still work in memory.
  }
}

function getFormDraftKey(form) {
  if (!form) {
    return "standalone";
  }
  const dataKey = Object.entries(form.dataset || {}).find(([, value]) => String(value || "").trim());
  if (dataKey) {
    return `form:${dataKey[0]}:${dataKey[1]}`;
  }
  if (form.id) {
    return `form:${form.id}`;
  }
  return "";
}

function isDraftableField(field) {
  const tagName = String(field?.tagName || "").toLowerCase();
  const type = String(field?.type || "").toLowerCase();
  const name = String(field?.name || field?.id || "").toLowerCase();
  if (!["input", "textarea", "select"].includes(tagName)) {
    return false;
  }
  if (["password", "hidden", "file", "button", "submit", "reset", "image"].includes(type)) {
    return false;
  }
  if (/(password|secret|token|apikey|api-key|privatekey|private-key)/.test(name)) {
    return false;
  }
  if (FORM_DRAFT_EXCLUDED_FIELD_KEYS.has(name)) {
    return false;
  }
  return !!(field.name || field.id);
}

function isRestorableField(field) {
  const tagName = String(field?.tagName || "").toLowerCase();
  const type = String(field?.type || "").toLowerCase();
  if (!["input", "textarea", "select"].includes(tagName)) {
    return false;
  }
  if (["hidden", "file", "button", "submit", "reset", "image"].includes(type)) {
    return false;
  }
  return !!(field.name || field.id);
}

function isVolatileDraftField(field) {
  if (!isRestorableField(field)) {
    return false;
  }
  const type = String(field.type || "").toLowerCase();
  const name = String(field.name || field.id || "").toLowerCase();
  return (
    field.dataset?.volatileDraft === "true" ||
    type === "password" ||
    /(password|secret|token|apikey|api-key|privatekey|private-key|pin)/.test(name) ||
    !isDraftableField(field)
  );
}

function getFieldDraftKey(field) {
  if (!isDraftableField(field)) {
    return "";
  }
  const formKey = getFormDraftKey(field.closest("form"));
  const fieldKey = field.name || field.id;
  if (!formKey && !field.id) {
    return "";
  }
  return `${formKey || "standalone"}::${fieldKey}`;
}

function getRestorableFieldKey(field) {
  if (!isRestorableField(field)) {
    return "";
  }
  const formKey = getFormDraftKey(field.closest("form"));
  const fieldKey = field.name || field.id;
  if (!formKey && !field.id) {
    return "";
  }
  return `${formKey || "standalone"}::${fieldKey}`;
}

function readDraftFieldValue(field) {
  const type = String(field.type || "").toLowerCase();
  if (type === "checkbox") {
    return !!field.checked;
  }
  if (type === "radio") {
    return field.checked ? field.value : undefined;
  }
  return field.value;
}

function writeDraftFieldValue(field, value) {
  const type = String(field.type || "").toLowerCase();
  if (type === "checkbox") {
    field.checked = !!value;
    return;
  }
  if (type === "radio") {
    field.checked = String(field.value) === String(value);
    return;
  }
  field.value = value ?? "";
}

function captureFormDrafts(root = app) {
  if (!root) {
    return;
  }
  root.querySelectorAll("input, textarea, select").forEach((field) => {
    const key = getFieldDraftKey(field);
    if (!key) {
      return;
    }
    const value = readDraftFieldValue(field);
    if (value === undefined) {
      return;
    }
    state.formDrafts = {
      ...(state.formDrafts || {}),
      [key]: value,
    };
  });
  persistFormDrafts();
}

function restoreFormDrafts(root = app) {
  if (!root) {
    return;
  }
  const drafts = state.formDrafts || {};
  root.querySelectorAll("input, textarea, select").forEach((field) => {
    const key = getFieldDraftKey(field);
    if (!key || !Object.prototype.hasOwnProperty.call(drafts, key)) {
      return;
    }
    writeDraftFieldValue(field, drafts[key]);
  });
}

function captureVolatileFieldDrafts(root = app) {
  if (!root) {
    return;
  }
  const nextDrafts = { ...(state.volatileFieldDrafts || {}) };
  root.querySelectorAll("input, textarea, select").forEach((field) => {
    if (!isVolatileDraftField(field)) {
      return;
    }
    const key = getRestorableFieldKey(field);
    if (!key) {
      return;
    }
    const value = readDraftFieldValue(field);
    if (value === undefined || value === "") {
      delete nextDrafts[key];
      return;
    }
    nextDrafts[key] = value;
  });
  state.volatileFieldDrafts = nextDrafts;
}

function restoreVolatileFieldDrafts(root = app) {
  if (!root) {
    return;
  }
  const drafts = state.volatileFieldDrafts || {};
  root.querySelectorAll("input, textarea, select").forEach((field) => {
    if (!isVolatileDraftField(field)) {
      return;
    }
    const key = getRestorableFieldKey(field);
    if (!key || !Object.prototype.hasOwnProperty.call(drafts, key)) {
      return;
    }
    writeDraftFieldValue(field, drafts[key]);
  });
}

function getFocusedFieldSnapshot(root = app) {
  const field = document.activeElement;
  if (!root || !field || !root.contains(field) || !isRestorableField(field)) {
    return null;
  }
  let selectionStart = null;
  let selectionEnd = null;
  try {
    selectionStart = field.selectionStart ?? null;
    selectionEnd = field.selectionEnd ?? null;
  } catch {
    selectionStart = null;
    selectionEnd = null;
  }
  return {
    key: getRestorableFieldKey(field),
    selectionStart,
    selectionEnd,
  };
}

function restoreFocusedField(snapshot, root = app) {
  if (!snapshot?.key || !root) {
    return;
  }
  requestAnimationFrame(() => {
    const field = [...root.querySelectorAll("input, textarea, select")]
      .find((item) => getRestorableFieldKey(item) === snapshot.key);
    if (!field) {
      return;
    }
    field.focus();
    if (
      snapshot.selectionStart !== null &&
      snapshot.selectionEnd !== null &&
      typeof field.setSelectionRange === "function"
    ) {
      field.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
    }
  });
}

function clearFormDraft(form) {
  const formKey = getFormDraftKey(form);
  if (!formKey) {
    return;
  }
  const nextDrafts = { ...(state.formDrafts || {}) };
  const nextVolatileDrafts = { ...(state.volatileFieldDrafts || {}) };
  for (const key of Object.keys(nextDrafts)) {
    if (key.startsWith(`${formKey}::`)) {
      delete nextDrafts[key];
    }
  }
  for (const key of Object.keys(nextVolatileDrafts)) {
    if (key.startsWith(`${formKey}::`)) {
      delete nextVolatileDrafts[key];
    }
  }
  state.formDrafts = nextDrafts;
  state.volatileFieldDrafts = nextVolatileDrafts;
  persistFormDrafts();
}

function clearStandaloneDrafts(fieldIds = []) {
  const nextDrafts = { ...(state.formDrafts || {}) };
  for (const fieldId of fieldIds) {
    delete nextDrafts[`standalone::${fieldId}`];
  }
  state.formDrafts = nextDrafts;
  persistFormDrafts();
}

function clearWalletDrafts() {
  clearStandaloneDrafts([
    "wallet-amount-input",
    "wallet-tx-input",
    "wallet-reference-input",
    "wallet-sender-input",
    "wallet-address-input",
    "wallet-network-input",
    "wallet-bank-code-input",
    "wallet-account-input",
    "wallet-save-bank-input",
    "gift-card-code-input",
  ]);
}

function bindFormDraftCapture() {
  if (bindFormDraftCapture.bound || !app) {
    return;
  }
  const handler = (event) => {
    const field = event.target;
    const key = getFieldDraftKey(field);
    if (!key) {
      return;
    }
    const value = readDraftFieldValue(field);
    if (value === undefined) {
      return;
    }
    state.formDrafts = {
      ...(state.formDrafts || {}),
      [key]: value,
    };
    persistFormDrafts();
  };
  app.addEventListener("input", handler, true);
  app.addEventListener("change", handler, true);
  app.addEventListener("focusout", () => {
    setTimeout(flushDeferredSettingsRender, 0);
  }, true);
  bindFormDraftCapture.bound = true;
}

function syncQuestCountdownTimer() {
  const shouldTick = !!(
    state.user?.role === "user" &&
    state.activeTab === "quest" &&
    !state.quest.status?.activeSession &&
    Number(state.quest.status?.cooldownRemainingMs || 0) > 0
  );
  if (!shouldTick) {
    if (questCountdownTimer) {
      window.clearInterval(questCountdownTimer);
      questCountdownTimer = null;
    }
    return;
  }
  if (questCountdownTimer) {
    return;
  }
  questCountdownTimer = window.setInterval(() => {
    if (!state.quest.status) {
      syncQuestCountdownTimer();
      return;
    }
    const nextMs = Math.max(0, Number(state.quest.status.cooldownRemainingMs || 0) - 1000);
    state.quest.status = {
      ...state.quest.status,
      cooldownRemainingMs: nextMs,
    };
    if (nextMs <= 0) {
      window.clearInterval(questCountdownTimer);
      questCountdownTimer = null;
      void refreshQuestData();
      return;
    }
    render();
  }, 1000);
}

function updateHomePromoDom() {
  const track = document.querySelector("[data-home-promo-track]");
  const dots = [...document.querySelectorAll("[data-home-promo-slide]")];
  if (!track || dots.length < 2) {
    return;
  }
  const activeSlide = Math.min(Math.max(Number(state.homePromoSlide || 0), 0), dots.length - 1);
  track.style.transform = `translateX(-${activeSlide * 100}%)`;
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === activeSlide);
  });
}

function syncHomePromoSliderTimer() {
  const shouldRun = !!(
    state.user?.role === "user" &&
    state.activeTab === "home" &&
    isDocumentVisible()
  );
  if (!shouldRun) {
    if (homePromoTimer) {
      window.clearInterval(homePromoTimer);
      homePromoTimer = null;
    }
    return;
  }
  if (homePromoTimer) {
    return;
  }
  homePromoTimer = window.setInterval(() => {
    const slideCount = document.querySelectorAll("[data-home-promo-slide]").length || 2;
    if (slideCount < 2 || !isDocumentVisible() || state.activeTab !== "home") {
      syncHomePromoSliderTimer();
      return;
    }
    state.homePromoSlide = (Number(state.homePromoSlide || 0) + 1) % slideCount;
    updateHomePromoDom();
  }, 5000);
}

function playQuestWinSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    const context = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.1;
      oscillator.type = index % 2 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.28);
    });
    window.setTimeout(() => context.close().catch(() => undefined), 900);
  } catch {
    // Browsers may block audio until the user interacts; the quest still works.
  }
}

function parseQuestStagesJson(stagesJson = "[]") {
  try {
    const stages = JSON.parse(stagesJson || "[]");
    return Array.isArray(stages) ? stages : [];
  } catch {
    return [];
  }
}

function normalizeQuestStage(stage = {}) {
  const options = Array.isArray(stage.options) ? stage.options : [];
  return {
    type: stage.type || "multiple-choice",
    prompt: stage.prompt || "",
    options: [...options, "", "", "", ""].slice(0, 4),
    correctAnswer: stage.correctAnswer || options[0] || "",
    explanation: stage.explanation || "",
    hint: stage.hint || "",
  };
}

function showActionModal(modal) {
  if (state.actionModal?.type === "signal-chart" && window.SignalPage?.destroyActiveChart) {
    window.SignalPage.destroyActiveChart();
  }
  stopSignalChartRefreshTimer();
  if (modal?.type === "admin-users") {
    state.adminUsersModalScrollTop = 0;
    state.adminUserSearch = "";
  }
  state.actionModal = modal;
  render();
}

async function openWalletActionModal(type) {
  await withLoading(async () => {
    await loadFinancialDashboard();
    if (type === "withdraw") {
      await refreshTradeStatusData();
    }
    if (type === "withdraw" && getWithdrawalBlockingInvestmentRecords().length) {
      showActionModal({ type: "withdraw-blocked" });
      return;
    }
    if (type === "withdraw") {
      await loadPaymentBanks().catch(() => []);
      const savedAccounts = getSavedBankAccounts();
      state.resolvedBankAccount = savedAccounts[0] || null;
      showActionModal({
        type,
        currency: "",
        bankMode: savedAccounts.length ? "saved" : "new",
        bankAccountId: savedAccounts[0]?.id || "",
      });
      return;
    }
    showActionModal({ type, currency: "", depositMode: "manual" });
  }).catch((error) => showError(error.message));
}

function clearActionModal() {
  stopSignalChartRefreshTimer();
  if (window.SignalPage?.destroyActiveChart) {
    window.SignalPage.destroyActiveChart();
  }
  const returnModal = state.actionModal?.returnModal || null;
  state.actionModal = returnModal;
  render();
}

function showNotice(message) {
  state.notice = message;
  render();
  clearTimeout(showNotice.timeoutId);
  showNotice.timeoutId = setTimeout(() => {
    state.notice = null;
    render();
  }, 2600);
}

function loadingClass(isLoading) {
  return isLoading ? " is-section-loading" : "";
}

function renderSectionLoadingOverlay(title, detail = "Still fetching live data") {
  return `
    <div class="section-loading-overlay" aria-hidden="true">
      <div class="section-loading-card">
        <div class="section-loading-blur"></div>
        <p class="section-loading-title">${title}</p>
        <p class="section-loading-copy">${detail}</p>
      </div>
    </div>
  `;
}

function formatNumber(value, digits = 8) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) {
    return "-";
  }
  return num.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

function formatDecimalInput(value, digits = 8) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) {
    return "";
  }
  return num.toFixed(digits).replace(/\.?0+$/, "");
}

function formatMarketSpendInput(value, { fullBalance = false, quoteAsset = "USDT" } = {}) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) {
    return "";
  }
  const stableQuote = STABLECOIN_ASSETS.includes(String(quoteAsset || "USDT").toUpperCase());
  const digits = stableQuote ? 2 : 8;
  const unit = 10 ** -digits;
  const shouldBuffer = fullBalance && num > 10;
  const buffer = shouldBuffer
    ? stableQuote
      ? Math.max(unit, Math.min(1, num * 0.001))
      : Math.max(unit, num * 0.0005)
    : 0;
  const adjusted = Math.max(num - buffer, unit);
  const scale = 10 ** digits;
  const floored = Math.floor((adjusted + Number.EPSILON) * scale) / scale;
  return formatDecimalInput(floored, digits);
}

function formatUsdt(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNaira(value) {
  return `NGN ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSignedNaira(value, { positiveSign = false } = {}) {
  const amount = Number(value || 0);
  if (amount < 0) {
    return `-${formatNaira(Math.abs(amount))}`;
  }
  return `${positiveSign && amount > 0 ? "+" : ""}${formatNaira(amount)}`;
}

function formatUsdtUnit(value) {
  return `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDT`;
}

function formatCurrencyAmount(value, currency = "USDT") {
  return String(currency || "USDT").toUpperCase() === "NGN" ? formatNaira(value) : formatUsdtUnit(value);
}

function getUsdtToNgnRate() {
  return Number(
    state.financialDashboard?.settings?.exchangeRate?.usdtToNgn ||
      state.financialDashboard?.totalBalance?.usdtToNgnRate ||
      state.usdtNgnRate ||
      0
  );
}

function getEquivalentAmount(value, currency = "USDT") {
  const amount = Number(value || 0);
  const rate = getUsdtToNgnRate();
  const normalizedCurrency = String(currency || "USDT").toUpperCase();
  if (!amount || !rate) {
    return null;
  }
  return normalizedCurrency === "NGN"
    ? { currency: "USDT", amount: amount / rate }
    : { currency: "NGN", amount: amount * rate };
}

function formatEquivalentAmount(value, currency = "USDT") {
  const equivalent = getEquivalentAmount(value, currency);
  return equivalent ? formatCurrencyAmount(equivalent.amount, equivalent.currency) : "";
}

function formatRecordEquivalent(record, currency = "USDT") {
  const sourceCurrency = String(currency || record?.currency || "USDT").toUpperCase();
  const displayAmounts = record?.displayAmounts || record?.metadata?.displayAmounts || null;
  const targetCurrency = sourceCurrency === "NGN" ? "USDT" : "NGN";
  const targetAmount = displayAmounts?.[targetCurrency];
  const isNegative = String(record?.amount || "").trim().startsWith("-");
  if (targetAmount !== undefined && targetAmount !== null && targetAmount !== "") {
    const signedAmount = isNegative && !String(targetAmount).startsWith("-") ? `-${targetAmount}` : targetAmount;
    return formatCurrencyAmount(signedAmount, targetCurrency);
  }
  return formatEquivalentAmount(record?.amount || 0, sourceCurrency);
}

function getSignalById(signalId) {
  return (state.signalFeed.signals || []).find((signal) => signal.id === signalId) || null;
}

function scrollSignalListToTop() {
  if (state.activeTab !== "signals") {
    return;
  }
  requestAnimationFrame(() => {
    const host = document.getElementById("signal-feed-list");
    if (host) {
      host.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

async function unlockSignalAudio(options = {}) {
  const silent = !!options.silent;
  if (!state.signalFeed.audioEnabled) {
    return false;
  }

  const audio = getSignalAlertAudio();
  audio.muted = true;
  try {
    audio.currentTime = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    state.signalFeed.audioUnlocked = true;
    clearSignalAudioAutoUnlock();
    render();
    return true;
  } catch {
    audio.muted = false;
    if (!silent) {
      ensureSignalAudioAutoUnlock();
    }
    return false;
  }
}

async function enableSignalAlerts() {
  if (state.signalFeed.audioEnabled) {
    state.signalFeed.audioEnabled = false;
    state.signalFeed.audioUnlocked = false;
    persistSignalAudioEnabled();
    clearSignalAudioAutoUnlock();
    refreshSignalPaneDom();
    showNotice("Signal sound muted");
    return;
  }

  state.signalFeed.audioEnabled = true;
  persistSignalAudioEnabled();
  updateSignalNotificationPermission();
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      // Ignore permission prompt failures and keep audio alert path available.
    }
  }
  updateSignalNotificationPermission();
  await unlockSignalAudio({ silent: true });
  ensureSignalAudioAutoUnlock();
  refreshSignalPaneDom();
  showNotice("Signal sound enabled");
}

function announceSignal(signal) {
  if (!signal || seenSignalIds.has(signal.id)) {
    return;
  }

  seenSignalIds.add(signal.id);

  if (state.signalFeed.audioEnabled && state.signalFeed.audioUnlocked) {
    const audio = getSignalAlertAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else if (state.signalFeed.audioEnabled) {
    ensureSignalAudioAutoUnlock();
  }

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const strategyLabel = String(signal.strategyType || "BUY").replace(/_/g, "-");
    new Notification(`${signal.pair} BUY signal`, {
      body: `${strategyLabel} at ${formatNumber(signal.entryPrice, 6)} | Confidence ${Math.round(Number(signal.confidence || 0))}%`,
      icon: "/netruefi-logo.png",
    });
  }

  scrollSignalListToTop();
}

function applySignalSnapshot(payload, options = {}) {
  const silent = !!options.silent;
  const nextSignals = mergeSignalList(payload.signals || []);
  if (silent) {
    nextSignals.forEach((signal) => seenSignalIds.add(signal.id));
  }

  const nextSelectedIds = state.signalFeed.selectedIds.filter((id) => nextSignals.some((signal) => signal.id === id));
  updateSignalFeed({
    pairs: payload.pairs || state.signalFeed.pairs,
    timeframe: payload.timeframe || state.signalFeed.timeframe,
    supportedTimeframes:
      Array.isArray(payload.supportedTimeframes) && payload.supportedTimeframes.length
        ? payload.supportedTimeframes
        : state.signalFeed.supportedTimeframes,
    signals: nextSignals,
    statusMessage: nextSignals.length ? "New BUY signals are sorted with the freshest setup first." : "Scanning the market for the next BUY setup.",
    selectedIds: nextSelectedIds,
    deleting: false,
    switchingTimeframe: false,
  });

  if (state.actionModal?.type === "signal-chart" && !nextSignals.some((signal) => signal.id === state.actionModal.signalId)) {
    clearActionModal();
  }
}

async function loadSignalsSnapshot(options = {}) {
  if (!state.user) {
    return;
  }

  const payload = await api("/api/signals");
  applySignalSnapshot(payload, options);
}

function disconnectSignalStream() {
  if (state.signalSocket) {
    state.signalSocket._manualClose = true;
    if (typeof state.signalSocket.removeAllListeners === "function") {
      state.signalSocket.removeAllListeners();
    }
    state.signalSocket.disconnect();
    state.signalSocket = null;
  }
  updateSignalFeed({
    streamConnected: false,
  });
}

function connectSettingsUsersSocket() {
  if (!state.user || state.activeTab !== "settings" || typeof WebSocket === "undefined") {
    return;
  }

  if (state.socket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(state.socket.readyState)) {
    return;
  }

  clearTimeout(state.socketRetry);
  const socket = new WebSocket(toWebSocketUrl("/ws/settings-users"));
  state.socket = socket;

  socket.onopen = () => {
    state.settingsLive = {
      connected: true,
      statusMessage: "Realtime settings sync is live.",
    };
    refreshSettingsPaneDom();
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data || "{}");
      if (message.type === "settings-users" && message.payload) {
        if (message.payload.scope === "admin") {
          state.users = Array.isArray(message.payload.users) ? message.payload.users : state.users;
          if (message.payload.signalAutoTrade) {
            state.signalAutoTrade = normalizeSignalAutoTradePayload(message.payload.signalAutoTrade);
          }
        } else if (message.payload.scope === "user") {
          if (message.payload.user) {
            state.user = normalizeUserPayload(message.payload.user);
          }
          if (message.payload.accountSnapshot) {
            applyAccountSnapshot(message.payload.accountSnapshot);
          }
        }
        state.settingsLive = {
          connected: true,
          statusMessage: "Realtime settings sync is live.",
        };
        refreshSettingsPaneDom();
        return;
      }

      if (message.type === "settings-users-error") {
        state.settingsLive = {
          connected: false,
          statusMessage: message.error || "Realtime settings sync hit an error.",
        };
        refreshSettingsPaneDom();
      }
    } catch {
      state.settingsLive = {
        connected: false,
        statusMessage: "Realtime settings sync payload could not be parsed.",
      };
      refreshSettingsPaneDom();
    }
  };

  socket.onerror = () => {
    state.settingsLive = {
      connected: false,
      statusMessage: "Realtime settings sync is reconnecting...",
    };
    refreshSettingsPaneDom();
  };

  socket.onclose = () => {
    if (state.socket === socket) {
      state.socket = null;
    }
    state.settingsLive = {
      connected: false,
      statusMessage: "Realtime settings sync is reconnecting...",
    };
    refreshSettingsPaneDom();
    if (!socket._manualClose && state.user && state.activeTab === "settings") {
      clearTimeout(state.socketRetry);
      state.socketRetry = setTimeout(() => {
        connectSettingsUsersSocket();
      }, 3000);
    }
  };
}

function disconnectSettingsUsersSocket() {
  clearTimeout(state.socketRetry);
  state.socketRetry = null;
  if (state.socket) {
    state.socket._manualClose = true;
    state.socket.close();
    state.socket = null;
  }
  state.settingsLive = {
    connected: false,
    statusMessage: "Realtime settings sync is offline.",
  };
}

function connectSignalStream() {
  if (!state.user || typeof window.io !== "function") {
    return;
  }

  if (state.signalSocket) {
    if (state.signalSocket.connected || state.signalSocket.active) {
      return;
    }
    state.signalSocket._manualClose = true;
    if (typeof state.signalSocket.removeAllListeners === "function") {
      state.signalSocket.removeAllListeners();
    }
    state.signalSocket.disconnect();
    state.signalSocket = null;
  }

  const socket = window.io(`${API_BASE_URL}/signals`, {
    path: "/socket.io",
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  state.signalSocket = socket;

  socket.on("connect", () => {
    socket._manualClose = false;
    updateSignalFeed({
      streamConnected: true,
      statusMessage: "Live signal socket connected.",
    });
  });

  socket.on("signals:snapshot", (payload) => {
    applySignalSnapshot(payload || {}, { silent: true });
  });

  socket.on("signals:status", (payload) => {
    updateSignalFeed({
      streamConnected: !!payload?.ok,
      statusMessage: payload?.message || state.signalFeed.statusMessage,
    });
  });

  socket.on("signals:new", (signal) => {
    if (!signal) {
      return;
    }
    updateSignalFeed({
      signals: mergeSignalList([signal, ...(state.signalFeed.signals || [])]),
      statusMessage: `${signal.pair} triggered a fresh ${String(signal.strategyType || "").replace(/_/g, "-")} BUY setup.`,
    });
    announceSignal(signal);
  });

  socket.on("disconnect", (reason) => {
    const manuallyClosed = socket._manualClose || reason === "io client disconnect";
    updateSignalFeed({
      streamConnected: false,
      statusMessage: manuallyClosed ? "Signal socket offline." : "Signal socket reconnecting...",
    });
    if (manuallyClosed && state.signalSocket === socket) {
      state.signalSocket = null;
    }
  });

  socket.on("connect_error", (error) => {
    const reason = String(error?.message || "").trim();
    updateSignalFeed({
      streamConnected: false,
      statusMessage: reason ? `Signal socket reconnecting: ${reason}` : "Signal socket reconnecting...",
    });
  });
}

function stopSignalChartRefreshTimer() {
  clearInterval(signalChartRefreshTimer);
  signalChartRefreshTimer = null;
}

function startSignalChartRefreshTimer() {
  stopSignalChartRefreshTimer();
  if (state.actionModal?.type !== "signal-chart") {
    return;
  }
  signalChartRefreshTimer = setInterval(() => {
    void refreshSignalChartModal(true);
  }, SIGNAL_CHART_REFRESH_INTERVAL_MS);
}

async function refreshSignalChartModal(silent = false) {
  if (state.actionModal?.type !== "signal-chart") {
    return;
  }

  const signal = getSignalById(state.actionModal.signalId);
  if (!signal) {
    return;
  }

  try {
    const payload = await api(`/api/signals/chart?pair=${encodeURIComponent(signal.pair)}&signalId=${encodeURIComponent(signal.id)}`);
    if (state.actionModal?.type !== "signal-chart" || state.actionModal.signalId !== signal.id) {
      return;
    }
    state.actionModal = {
      ...state.actionModal,
      chartPayload: payload,
      chartError: null,
    };
    render();
  } catch (error) {
    if (!silent && state.actionModal?.type === "signal-chart") {
      state.actionModal = {
        ...state.actionModal,
        chartError: error.message,
      };
      render();
    }
  }
}

function openSignalModal(signalId) {
  const signal = getSignalById(signalId);
  if (!signal) {
    showError("Signal details could not be found.");
    return;
  }
  showActionModal({
    type: "signal-chart",
    signalId,
    chartPayload: null,
    chartError: null,
  });
  void refreshSignalChartModal();
}

async function deleteSelectedSignals() {
  const signalIds = [...state.signalFeed.selectedIds];
  if (!signalIds.length) {
    showError("Select at least one signal to delete.");
    return;
  }

  updateSignalFeed({ deleting: true });
  try {
    const result = await api("/api/signals/delete", {
      method: "POST",
      body: JSON.stringify({ signalIds }),
    });
    applySignalSnapshot({
      pairs: state.signalFeed.pairs,
      timeframe: state.signalFeed.timeframe,
      signals: result.signals || [],
    });
    showNotice(`${result.deletedCount || signalIds.length} signal${(result.deletedCount || signalIds.length) === 1 ? "" : "s"} deleted`);
  } catch (error) {
    updateSignalFeed({ deleting: false });
    showError(error.message);
  }
}

async function updateSignalTimeframe(timeframe) {
  const nextTimeframe = String(timeframe || "").trim();
  if (!nextTimeframe || nextTimeframe === state.signalFeed.timeframe || state.signalFeed.switchingTimeframe) {
    return;
  }

  updateSignalFeed({
    switchingTimeframe: true,
    statusMessage: `Switching signal dashboard to ${nextTimeframe} candles...`,
  });

  try {
    const snapshot = await api("/api/signals/timeframe", {
      method: "POST",
      body: JSON.stringify({ timeframe: nextTimeframe }),
    });
    applySignalSnapshot(snapshot, { silent: true });
    updateSignalFeed({
      streamConnected: true,
      statusMessage: `Signal dashboard switched to ${nextTimeframe}.`,
    });
    if (state.actionModal?.type === "signal-chart") {
      void refreshSignalChartModal(true);
    }
  } catch (error) {
    updateSignalFeed({
      switchingTimeframe: false,
      statusMessage: state.signalFeed.signals.length
        ? "New BUY signals are sorted with the freshest setup first."
        : "Scanning the market for the next BUY setup.",
    });
    showError(error.message);
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function icon(name) {
  const paths = {
    eye:
      '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff:
      '<path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6 0 9.5 7 9.5 7a16.2 16.2 0 0 1-3.1 4"/><path d="M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 7 9.5 7a9.7 9.7 0 0 0 4.1-.9"/>',
    bell:
      '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    bank:
      '<path d="m3 10 9-6 9 6"/><path d="M5 10h14v9H5z"/><path d="M8 14v5"/><path d="M12 14v5"/><path d="M16 14v5"/>',
    send:
      '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    arrowLeft:
      '<path d="m15 18-6-6 6-6"/>',
    plus:
      '<path d="M12 5v14"/><path d="M5 12h14"/>',
    card:
      '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M7 15h4"/>',
    gift:
      '<path d="M20 12v8H4v-8"/><path d="M2 8h20v4H2z"/><path d="M12 8v12"/><path d="M12 8H8.5a2 2 0 1 1 2-2c0 2-2.5 2-2.5 2"/><path d="M12 8h3.5a2 2 0 1 0-2-2c0 2 2.5 2 2.5 2"/>',
    lock:
      '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    edit:
      '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"/>',
    settings:
      '<path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Zm8 3.3-.9-.5a7.5 7.5 0 0 0-.4-1l.5-1a1 1 0 0 0-.2-1.1l-1.2-1.2a1 1 0 0 0-1.1-.2l-1 .5c-.3-.2-.7-.3-1-.4L14 3h-4l-.4 1.1c-.3.1-.7.2-1 .4l-1-.5a1 1 0 0 0-1.1.2L5 5.4a1 1 0 0 0-.2 1.1l.5 1c-.2.3-.3.7-.4 1L4 12v.1l.9.4c.1.3.2.7.4 1l-.5 1a1 1 0 0 0 .2 1.1l1.2 1.2a1 1 0 0 0 1.1.2l1-.5c.3.2.7.3 1 .4L10 21h4l.4-1.1c.3-.1.7-.2 1-.4l1 .5a1 1 0 0 0 1.1-.2l1.2-1.2a1 1 0 0 0 .2-1.1l-.5-1c.2-.3.3-.7.4-1l.9-.4V12Z"/>',
    signals:
      '<path d="M4 17h3l2.5-7 3 11 2.5-6H20" /><circle cx="7" cy="17" r="1.2"/><circle cx="15" cy="15" r="1.2"/>',
    menu:
      '<circle cx="6" cy="7" r="2.2"/><circle cx="17" cy="6" r="2.8"/><circle cx="8" cy="18" r="2.6"/><circle cx="18" cy="17" r="2.1"/>',
    profile:
      '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c0-3.4 2.8-6 7-6s7 2.6 7 6"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    contact:
      '<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v11A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5v-11Z"/><path d="m8 8 4 3 4-3"/>' ,
    download:
      '<path d="M12 3v10"/><path d="m7 9 5 5 5-5"/><path d="M5 19h14"/>',
    whatsapp:
      '<path d="M20 11.6a8.2 8.2 0 0 1-12.1 7.2L4 20l1.3-3.7A8.2 8.2 0 1 1 20 11.6Z"/><path d="M9.2 8.3c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4 0 .5l-.4.5c-.1.1-.2.3-.1.5.4.8 1.1 1.5 2.1 2 .2.1.3.1.5-.1l.7-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.3.4.5 0 .6-.4 1.4-.9 1.7-.5.3-1.5.4-3.1-.3-2.6-1.1-4.4-3.7-4.6-4-.1-.2-1.1-1.5-1.1-2.8 0-1.2.7-1.8 1-2Z"/>',
    phone:
      '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/>',
    wifi:
      '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M12 20h.01"/><path d="M2 9a15 15 0 0 1 20 0"/>',
    copy:
      '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>',
    chevronDown:
      '<path d="m6 9 6 6 6-6"/>',
    chevronUp:
      '<path d="m18 15-6-6-6 6"/>',
    x:
      '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    refresh:
      '<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/>',
    check:
      '<path d="m20 6-11 11-5-5"/>',
    play:
      '<path d="M8 5v14l11-7Z"/>',
    trash:
      '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    copyPlus:
      '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/><path d="M13.5 11.5v4"/><path d="M11.5 13.5h4"/>',
    star:
      '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    home:
      '<path d="M4 11.5 12 5l8 6.5V20h-5v-4h-6v4H4z"/>',
  };

  return `
    <svg viewBox="0 0 24 24" class="nav-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      ${paths[name] || paths.home}
    </svg>
  `;
}

function renderPasswordField({ label, name, placeholder, autocomplete, value = "", required = true }) {
  return `
    <label class="stack-label">
      <span>${escapeHtml(label)}</span>
      <span class="password-field">
        <input name="${escapeHtml(name)}" type="password" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" autocomplete="${escapeHtml(autocomplete)}" ${required ? "required" : ""} />
        <button class="password-toggle" data-password-toggle type="button" aria-label="Show password" title="Show password">
          ${icon("eye")}
        </button>
      </span>
    </label>
  `;
}

function getWatchlist() {
  const base = new Map((state.watchlistSeed || []).map((item) => [item.symbol, item]));
  const sourceSymbols = state.watchlistSeed.length ? state.watchlistSeed.map((item) => item.symbol) : WATCH_SYMBOLS;
  const symbols = [...new Set(sourceSymbols)].slice(0, 10);
  return symbols.map((symbol) => {
    const seed = base.get(symbol) || { symbol, price: 0, changePercent: 0, volume24h: 0, turnover24h: 0 };
    const live = state.liveMap[symbol] || {};
    return {
      symbol,
      price: Number(live.price || seed.price || 0),
      changePercent: Number(live.changePercent ?? seed.changePercent ?? 0),
      volume24h: Number(live.volume24h ?? seed.volume24h ?? 0),
      turnover24h: Number(live.turnover24h ?? seed.turnover24h ?? 0),
    };
  });
}

function getSymbolData(symbol) {
  return state.tradeMarketMap[symbol] || getWatchlist().find((item) => item.symbol === symbol) || { symbol, price: 0, changePercent: 0 };
}

function buildMarketPricesPath(symbols) {
  const normalizedSymbols = Array.isArray(symbols) ? symbols.join(",") : String(symbols || "");
  const params = new URLSearchParams({
    symbols: normalizedSymbols,
    exchange: getActiveExchange(),
  });
  return `/api/market/prices?${params.toString()}`;
}

function getTradeFormDefaults() {
  return {
    symbol: "PEPEUSDT",
    side: "BUY",
    type: "LIMIT",
    price: "",
    quantity: "",
    quoteOrderQty: "",
    takeProfitPrice: "",
  };
}

let tradeDraft = getTradeFormDefaults();

function getDisplayedBalances() {
  if (state.showAllBalances) {
    return state.balances;
  }
  return state.balances.slice(0, 5);
}

function getDisplayedWatchlist() {
  return getWatchlist().slice(0, 10);
}

function getConnectedExchanges(user) {
  if (!user) {
    return [];
  }

  return EXCHANGE_OPTIONS.filter((exchange) => user[`${exchange.id}Connected`]);
}

function canUseFuturesMode() {
  return !!state.user?.binanceConnected;
}

function isFuturesMode() {
  return false;
}

function setDashboardMarketMode(mode) {
  state.dashboardMarketMode = "spot";
}

function getSpotMirrorGuidance(exchange = getActiveExchange()) {
  return SPOT_MIRROR_GUIDANCE[exchange] || SPOT_MIRROR_GUIDANCE.bybit;
}

function getStablecoinBuyingBalance(balances = []) {
  return (balances || []).reduce((sum, balance) => {
    const asset = String(balance.asset || "").toUpperCase();
    if (!STABLECOIN_ASSETS.includes(asset)) {
      return sum;
    }
    return sum + Number(balance.free ?? balance.total ?? 0);
  }, 0);
}

function getUnifiedQuoteBalance(quoteAsset = "USDT") {
  const normalizedQuote = String(quoteAsset || "USDT").trim().toUpperCase();
  const walletBalance = Number(getBalanceForAsset(normalizedQuote)?.free ?? getBalanceForAsset(normalizedQuote)?.total ?? 0);
  const stablecoinBalance = normalizedQuote === "USDT" ? getStablecoinBuyingBalance(state.balances || []) : walletBalance;
  const accountAvailable = normalizedQuote === "USDT" ? Number(state.accountTotalAvailableBalance || 0) : 0;
  const candidates = [walletBalance, stablecoinBalance, accountAvailable].filter((value) => Number(value) > 0);
  return candidates.length ? Math.min(...candidates) : 0;
}

function getDetectedSpotHoldings() {
  const activeTradeSymbols = new Set((state.trades || []).filter(isTradeStrictlyOpen).map((trade) => trade.symbol));
  const stableAssets = new Set(["USDT", "USDC", "FDUSD", "BUSD"]);

  return (state.balances || [])
    .filter(
      (balance) =>
        Number(balance.total || 0) > 0 &&
        !!balance.spotSellTradable &&
        !stableAssets.has(String(balance.asset || "").toUpperCase())
    )
    .map((balance) => {
      const symbol = `${String(balance.asset || "").toUpperCase()}USDT`;
      const total = Number(balance.total || 0);
      const derivedPrice = total ? Number(balance.usdtValue || 0) / total : 0;
      return {
        id: `external-${symbol}`,
        symbol,
        asset: balance.asset,
        quantity: total,
        currentPrice: Number(getTradeCurrentMarket(symbol).price || derivedPrice || 0),
        currentValue: Number(balance.usdtValue || 0),
        changePercent: Number(balance.changePercent || 0),
        exchange: getActiveExchange(),
        lifecycleStatus: "OPEN",
        external: true,
      };
    })
    .filter((holding) => !activeTradeSymbols.has(holding.symbol) && holding.currentValue > 0);
}

function getTradeSymbolSuggestions() {
  return [...new Set([
    ...state.spotSymbols,
    ...WATCH_SYMBOLS,
    ...(state.watchlistSeed || []).map((item) => item.symbol),
    ...(state.trades || []).map((trade) => trade.symbol),
    ...(state.openOrders || []).map((order) => order.symbol),
  ])].filter(Boolean);
}

function renderWatchlistRows(items) {
  return items
    .map(
      (item) => `
        <div class="ticker-row" data-watch-symbol="${item.symbol}">
          <div>
            <strong>${item.symbol}</strong>
            <p class="muted-copy watch-trend-copy">24h move</p>
          </div>
          <div class="watch-values">
            <strong data-watch-price>${formatNumber(item.price, 8)}</strong>
            <p class="watch-change ${Number(item.changePercent) >= 0 ? "positive" : "negative"}" data-watch-change>${Number(item.changePercent || 0) >= 0 ? "+" : ""}${formatNumber(item.changePercent, 2)}%</p>
          </div>
        </div>
      `
    )
    .join("");
}

function getBalanceForAsset(asset) {
  const normalizedAsset = String(asset || "").trim().toUpperCase();
  return state.balances.find((item) => String(item.asset || "").toUpperCase() === normalizedAsset);
}

function getQuoteAssetFromSymbol(symbol) {
  const normalizedSymbol = normalizeTradeSymbolValue(symbol);
  const quoteAsset = KNOWN_QUOTE_ASSETS.find(
    (item) => normalizedSymbol.endsWith(item) && normalizedSymbol.length > item.length
  );
  return quoteAsset || "USDT";
}

function getBaseAssetFromSymbol(symbol) {
  const normalizedSymbol = String(symbol || "").trim().toUpperCase();
  const quoteAsset = getQuoteAssetFromSymbol(normalizedSymbol);
  return normalizedSymbol.endsWith(quoteAsset) ? normalizedSymbol.slice(0, -quoteAsset.length) : normalizedSymbol;
}

function hasActiveOpenOrderForSymbol(symbol) {
  return (state.openOrders || []).some(
    (order) => order.symbol === symbol && ACTIVE_API_ORDER_STATUSES.has(String(order.status || "").toUpperCase())
  );
}

function hasExchangeBalanceForTrade(trade) {
  const baseAsset = getBaseAssetFromSymbol(trade.symbol);
  const balance = getBalanceForAsset(baseAsset);
  if (!balance) {
    return false;
  }

  if (balance.spotSellTradable !== undefined) {
    return !!balance.spotSellTradable;
  }

  const totalBalance = balance.total !== undefined
    ? Number(balance.total || 0)
    : Number(balance?.free || 0) + Number(balance?.locked || 0);
  return totalBalance > 0;
}

function isTradeStrictlyOpen(trade) {
  if (trade.lifecycleStatus !== "OPEN" || getTradeRemainingQuantity(trade) <= 0) {
    return false;
  }

  if (!state.user?.exchangeConnected) {
    return true;
  }

  if (trade.side !== "BUY") {
    return false;
  }

  // Strict rule: if the connected exchange API no longer shows an active order and no remaining
  // asset balance for the trade, the app must not keep that trade inside Open Trades.
  return hasActiveOpenOrderForSymbol(trade.symbol) || hasExchangeBalanceForTrade(trade);
}

function isTradeVisibleOnHome(trade) {
  const status = String(trade.lifecycleStatus || "").toUpperCase();
  if (state.user?.role === "user") {
    return ["OPEN", "PENDING"].includes(status) && trade.userInvestment?.status === "ACTIVE";
  }
  return status === "OPEN" || isTradeStrictlyOpen(trade);
}

function isTradeClearableFromHistory(trade) {
  return !isTradeStrictlyOpen(trade) && trade.lifecycleStatus !== "PENDING";
}

function syncHistorySelection() {
  const tradeIds = new Set(getHistoryTrades().filter(isTradeClearableFromHistory).map((trade) => trade.id));
  state.selectedHistoryTradeIds = state.selectedHistoryTradeIds.filter((tradeId) => tradeIds.has(tradeId));
}

function getHistoryTrades() {
  return [...state.trades];
}

function getCurrentTradeSummary() {
  const symbol = tradeDraft.symbol || "PEPEUSDT";
  const quoteAsset = getQuoteAssetFromSymbol(symbol);
  const baseAsset = getBaseAssetFromSymbol(symbol);
  const live = getSymbolData(symbol);
  const effectivePrice = Number(tradeDraft.price || live.price || 0);
  const amount = Number(tradeDraft.quantity || 0);
  const canUseQuoteTotal = tradeDraft.side === "BUY" && tradeDraft.type === "MARKET";
  const total = canUseQuoteTotal && tradeDraft.quoteOrderQty
    ? Number(tradeDraft.quoteOrderQty || 0)
    : effectivePrice * amount;
  const baseBalance = getBalanceForAsset(baseAsset)?.total || 0;
  const usdtBalance = getUnifiedQuoteBalance(quoteAsset);
  return {
    baseAsset,
    quoteAsset,
    live,
    effectivePrice,
    total,
    amount,
    baseBalance,
    usdtBalance,
  };
}

function getNetrueBalanceValue() {
  if (state.totalUsdt > 0) {
    return state.totalUsdt;
  }
  return 250;
}

function getInvestmentBalanceNgn() {
  return Number(state.financialDashboard?.totalBalance?.ngnEquivalent || state.totalNgn || 0);
}

function getUserOpenTradePnlUsdt() {
  if (state.user?.role !== "user") {
    return 0;
  }

  return (state.trades || [])
    .filter((trade) => String(trade.lifecycleStatus || "").toUpperCase() === "OPEN")
    .filter((trade) => trade.userInvestment?.status === "ACTIVE")
    .reduce((sum, trade) => sum + getTradePnlValue(trade), 0);
}

function getSavedBankAccount() {
  return getSavedBankAccounts()[0] || state.financialDashboard?.bankAccount || {};
}

function getSavedBankAccounts() {
  const bankAccounts = [
    ...(Array.isArray(state.financialDashboard?.bankAccounts) ? state.financialDashboard.bankAccounts : []),
    state.financialDashboard?.bankAccount,
  ].filter((account) => account?.verified);
  const byKey = new Map();
  bankAccounts.forEach((account) => {
    const key = account.id || `${account.bankCode || ""}:${account.accountNumber || account.maskedAccountNumber || ""}`;
    if (key && !byKey.has(key)) {
      byKey.set(key, account);
    }
  });
  return [...byKey.values()];
}

function getUserDynamicPnlUsdt() {
  if (state.user?.role !== "user") {
    return 0;
  }

  const openTradePnl = getUserOpenTradePnlUsdt();
  if (openTradePnl) {
    return openTradePnl;
  }

  return Number(state.financialDashboard?.performance?.todayUsdt || state.financialDashboard?.mirrorPnl?.amountUsdt || 0);
}

function getActiveInvestmentRecords() {
  const fromDashboard = state.financialDashboard?.activeInvestments || [];
  const fromTrades = (state.trades || [])
    .filter((trade) => ["OPEN", "PENDING"].includes(String(trade.lifecycleStatus || "").toUpperCase()))
    .map((trade) => trade.userInvestment)
    .filter((investment) => investment?.status === "ACTIVE");
  const byId = new Map();
  [...fromDashboard, ...fromTrades].forEach((investment) => {
    if (investment?.id) {
      byId.set(investment.id, investment);
    }
  });
  return [...byId.values()];
}

function getWithdrawalBlockingInvestmentRecords() {
  return (state.trades || [])
    .filter((trade) => ["OPEN", "PENDING"].includes(String(trade.lifecycleStatus || "").toUpperCase()))
    .map((trade) => trade.userInvestment)
    .filter((investment) => investment?.status === "ACTIVE");
}

function getUserLockedInvestmentUsdt() {
  return getActiveInvestmentRecords().reduce((sum, investment) => sum + Number(investment.amountUsdt || 0), 0);
}

function getInvestmentDailyReturnNgn() {
  if (state.user?.role === "user") {
    return getUserDynamicPnlUsdt() * getUsdtToNgnRate();
  }

  const performanceValue = Number(state.financialDashboard?.performance?.todayUsdt || 0);
  const mirrorValue = Number(state.financialDashboard?.mirrorPnl?.amountUsdt || 0);
  return (performanceValue || mirrorValue) * getUsdtToNgnRate();
}

function getFinancialSettings() {
  return state.financialDashboard?.settings || {};
}

function getReferralSettings() {
  return state.referralProfile?.settings
    || state.adminReferrals?.settings
    || state.financialDashboard?.settings?.referral
    || state.financialDashboard?.referral?.settings
    || {};
}

function getTradingSettings() {
  return getFinancialSettings().trading || {};
}

function captureReferralCodeFromUrl() {
  const params = new URLSearchParams(window.location?.search || "");
  const code = String(params.get("ref") || params.get("referral") || "").trim().toUpperCase();
  if (code) {
    sessionStorage.setItem(REFERRAL_CODE_STORAGE_KEY, code);
    state.authTab = "register";
  }
  if (/^\/signup\/?$/.test(String(window.location?.pathname || "")) || params.get("signup") === "1") {
    state.authTab = "register";
  }
  return code || sessionStorage.getItem(REFERRAL_CODE_STORAGE_KEY) || "";
}

function getPendingReferralCode() {
  return String(sessionStorage.getItem(REFERRAL_CODE_STORAGE_KEY) || "").trim().toUpperCase();
}

function clearPendingReferralCode() {
  sessionStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
}

function getReferralLink(profile = state.referralProfile) {
  const path = profile?.referralCode ? `/?signup=1&ref=${encodeURIComponent(profile.referralCode)}` : (profile?.referralPath || "");
  return path ? new URL(path, window.location.origin).toString() : "";
}

function formatReferralStatus(status = "") {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "in_progress") {
    return "In Progress";
  }
  return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : "Registered";
}

function renderReferralCheck(done) {
  return `<span class="referral-check ${done ? "done" : ""}">${done ? icon("check") : icon("lock")}</span>`;
}

async function loadReferralProfile() {
  if (!state.user || state.user.role !== "user") {
    state.referralProfile = null;
    return null;
  }
  state.loadingReferral = true;
  try {
    state.referralProfile = await api("/api/referrals/me");
    return state.referralProfile;
  } finally {
    state.loadingReferral = false;
  }
}

async function loadAdminReferralData(offset = 0) {
  if (!state.user || state.user.role !== "admin") {
    state.adminReferrals = null;
    return null;
  }
  const payload = await api(`/api/admin/referrals?limit=25&offset=${encodeURIComponent(offset)}`);
  state.adminReferrals = payload;
  return payload;
}

function getMinimumTradeJoinUsdt() {
  const configured = Number(getTradingSettings().minJoinUsdt || 1);
  return Number.isFinite(configured) && configured > 0 ? configured : 1;
}

function getTradeJoinBalanceUsdt() {
  const totalBalance = state.financialDashboard?.totalBalance || {};
  const usdtWallet = getFinancialWallet("USDT");
  const ngnWallet = getFinancialWallet("NGN");
  const rate = Number(totalBalance.usdtToNgnRate || getUsdtToNgnRate() || 0);
  const availableUsdt = Number(usdtWallet?.availableBalance || 0);
  const availableNgnAsUsdt = rate > 0 ? Number(ngnWallet?.availableBalance || 0) / rate : 0;
  const balance = availableUsdt + availableNgnAsUsdt;
  return Number.isFinite(balance) && balance > 0 ? balance : 0;
}

function getFinancialWallet(currency) {
  const target = String(currency || "USDT").toUpperCase();
  return (state.financialDashboard?.wallets || []).find((wallet) => wallet.currency === target) || null;
}

function getWalletFromList(wallets, currency) {
  const target = String(currency || "USDT").toUpperCase();
  return (wallets || []).find((wallet) => wallet.currency === target) || {
    currency: target,
    availableBalance: "0",
    lockedBalance: "0",
  };
}

function financeHistoryKey(kind, id) {
  return `${kind}:${id}`;
}

function getFinanceHistoryKeys() {
  return [
    ...(state.adminDeposits || []).map((item) => financeHistoryKey("deposit", item.id)),
    ...(state.adminWithdrawals || []).map((item) => financeHistoryKey("withdrawal", item.id)),
    ...(state.adminTransactions || []).map((item) => financeHistoryKey("transaction", item.id)),
    ...(state.adminVtuTransactions || []).map((item) => financeHistoryKey("vtu", item.id)),
  ];
}

function syncFinanceHistorySelection() {
  const available = new Set(getFinanceHistoryKeys());
  state.selectedFinanceHistoryIds = state.selectedFinanceHistoryIds.filter((key) => available.has(key));
}

async function loadFinancialDashboard() {
  if (!state.user) {
    state.financialDashboard = null;
    state.notifications = [];
    return;
  }
  const endpoint = state.user.role === "admin" ? "/api/admin/dashboard" : "/api/user/dashboard";
  const url = state.user.role === "admin"
    ? `${endpoint}?exchange=${encodeURIComponent(getAdminDashboardExchange())}&refresh=1`
    : endpoint;
  state.financialDashboard = await api(url);
  state.notifications = state.financialDashboard?.notifications || [];
  updateAppBadge();
  if (state.user.role === "admin" && state.financialDashboard?.accountSnapshot) {
    applyAccountSnapshot(state.financialDashboard.accountSnapshot);
  }
  await loadVtuSnapshot().catch(() => undefined);
  await loadDigitalServicesSnapshot().catch(() => undefined);
}

async function refreshTradingAccountSnapshot({ force = false, silent = false } = {}) {
  if (!state.user?.exchangeConnected && !(state.user?.role === "admin" && (state.user?.bybitConnected || state.user?.binanceConnected))) {
    return null;
  }
  const exchange = state.user.role === "admin" ? getAdminDashboardExchange() : getActiveExchange();
  const refreshParam = force ? "&refresh=1" : "";
  if (!silent) {
    state.loadingAccount = true;
    render();
  }
  try {
    const account = await api(`/api/exchange/account?exchange=${encodeURIComponent(exchange)}${refreshParam}`);
    applyAccountSnapshot(account);
    state.user = {
      ...state.user,
      cachedAccountSnapshot: account,
      cachedAccountSnapshots: {
        ...(state.user.cachedAccountSnapshots || {}),
        [account.exchange || exchange]: account,
      },
    };
    return account;
  } finally {
    state.loadingAccount = false;
  }
}

async function loadPaymentBanks({ force = false } = {}) {
  if (!state.user) {
    state.paymentBanks = [];
    return [];
  }
  const isFresh = state.paymentBanks.length && Date.now() - Number(state.paymentBanksLoadedAt || 0) < 6 * 60 * 60 * 1000;
  if (!force && isFresh) {
    return state.paymentBanks;
  }
  const payload = await api("/api/payments/banks");
  state.paymentBanks = payload.banks || [];
  state.paymentBanksLoadedAt = Date.now();
  return state.paymentBanks;
}

async function loadVtuSnapshot() {
  if (!state.user) {
    state.vtuSettings = null;
    state.vtuTransactions = [];
    state.vtuDataPlans = [];
    return;
  }
  if (state.user.role === "admin") {
    state.vtuSettings = state.financialDashboard?.settings?.vtu || state.financialDashboard?.vtu?.settings || state.vtuSettings;
    return;
  }
  const [settingsPayload, transactionsPayload] = await Promise.all([
    api("/api/vtu/settings").catch(() => ({ settings: null })),
    api("/api/vtu/transactions?limit=20").catch(() => ({ transactions: [] })),
  ]);
  state.vtuSettings = settingsPayload.settings || null;
  state.vtuTransactions = transactionsPayload.transactions || [];
}

async function loadVtuDataPlans(network, { force = false } = {}) {
  const normalizedNetwork = String(network || "").trim().toLowerCase();
  if (!normalizedNetwork) {
    state.vtuDataPlans = [];
    state.vtuDataPlansNetwork = "";
    return [];
  }
  if (!force && state.vtuDataPlansNetwork === normalizedNetwork && state.vtuDataPlans.length) {
    return state.vtuDataPlans;
  }
  state.loadingVtu = true;
  try {
    const payload = await api(`/api/vtu/data/plans?network=${encodeURIComponent(normalizedNetwork)}`);
    state.vtuDataPlans = payload.plans || [];
    state.vtuDataPlansNetwork = normalizedNetwork;
    return state.vtuDataPlans;
  } finally {
    state.loadingVtu = false;
  }
}

async function loadAdminFinanceQueues() {
  if (!state.user || state.user.role !== "admin") {
    state.adminDeposits = [];
    state.adminWithdrawals = [];
    state.adminTransactions = [];
    state.adminGiftCards = [];
    state.adminVtuTransactions = [];
    return;
  }
  const [depositPayload, withdrawalPayload, transactionPayload, giftCardPayload, vtuPayload] = await Promise.all([
    api("/api/admin/deposits"),
    api("/api/admin/withdrawals"),
    api("/api/admin/transactions"),
    api("/api/admin/gift-cards"),
    api("/api/admin/integrations/vtu/transactions").catch(() => ({ transactions: [] })),
  ]);
  state.adminDeposits = depositPayload.deposits || [];
  state.adminWithdrawals = withdrawalPayload.withdrawals || [];
  state.adminTransactions = transactionPayload.transactions || [];
  state.adminGiftCards = giftCardPayload.giftCards || [];
  state.adminVtuTransactions = vtuPayload.transactions || [];
  syncFinanceHistorySelection();
}

async function loadQuestData() {
  if (!state.user || state.user.role !== "user") {
    state.quest.status = null;
    state.quest.rewards = [];
    state.quest.history = [];
    return;
  }
  const [statusPayload, rewardsPayload, historyPayload] = await Promise.all([
    api("/api/quest/my-status"),
    api("/api/quest/rewards").catch(() => ({ rewards: [] })),
    api("/api/quest/history").catch(() => ({ history: [] })),
  ]);
  state.quest.status = statusPayload;
  state.quest.rewards = rewardsPayload.rewards || [];
  state.quest.history = historyPayload.history || [];
}

async function loadAdminQuestData() {
  if (!state.user || state.user.role !== "admin") {
    state.quest.admin = null;
    return;
  }
  state.quest.admin = await api("/api/admin/quests");
}

function buildFrontendPath(path) {
  const normalizedPath = String(path || "/").startsWith("/") ? String(path || "/") : `/${path}`;
  return `${window.location.origin}${normalizedPath}`;
}

function getQuestDraft() {
  const fallbackStages = [
    {
      type: "multiple-choice",
      prompt: "What does P&L show?",
      options: ["Profit and loss", "Password and login", "Payment limit", ""],
      correctAnswer: "Profit and loss",
      explanation: "P&L tracks profit and loss after entry.",
    },
  ];
  const draft = state.quest.draft || {
    id: "",
    title: "",
    category: "crypto",
    difficulty: "easy",
    description: "",
    active: true,
    stagesJson: JSON.stringify(fallbackStages, null, 2),
  };
  const stages = (draft.stages || parseQuestStagesJson(draft.stagesJson || "[]"));
  return {
    ...draft,
    stages: (stages.length ? stages : fallbackStages).map(normalizeQuestStage),
  };
}

function setQuestDraftFromQuest(quest) {
  const stages = (quest.stages || []).map(normalizeQuestStage);
  state.quest.draft = {
    id: quest.id || "",
    title: quest.title || "",
    category: quest.category || "crypto",
    difficulty: quest.difficulty || "easy",
    description: quest.description || "",
    active: quest.active !== false,
    stages,
    stagesJson: JSON.stringify(stages, null, 2),
  };
}

function formatMonthLabel(monthKey) {
  const raw = String(monthKey || "").trim();
  if (!/^\d{4}-\d{2}$/.test(raw)) {
    return "This Month";
  }
  const [year, month] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function formatDayLabel(dayKey) {
  return dayKey ? `Today (${dayKey} GMT)` : "Today";
}

function getTradeEntryPrice(trade) {
  return Number(
    trade.price ||
      trade.adminExecution?.price ||
      trade.adminExecution?.fills?.[0]?.price ||
      0
  );
}

function getTradeCurrentMarket(symbol) {
  return state.tradeMarketMap[symbol] || getSymbolData(symbol) || { price: 0, changePercent: 0 };
}

function getSelectedSignalSymbol() {
  const selected = String(state.signalChart.symbol || "").trim().toUpperCase();
  if (selected) {
    return selected;
  }
  const { topPump, topDip } = getAiRecommendations();
  return topPump?.symbol || topDip?.symbol || "";
}

function buildSparklinePath(values, width, height, padding = 8) {
  if (!values.length) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = padding + (usableWidth * index) / Math.max(values.length - 1, 1);
      const y = padding + usableHeight - ((value - min) / range) * usableHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSignalChartGeometry(candles, width = 320, height = 180) {
  const padding = { top: 12, right: 12, bottom: 14, left: 12 };
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const highs = candles.map((item) => Number(item.high || item.close || 0)).filter((value) => Number.isFinite(value));
  const lows = candles.map((item) => Number(item.low || item.close || 0)).filter((value) => Number.isFinite(value));
  const minPrice = lows.length ? Math.min(...lows) : 0;
  const maxPrice = highs.length ? Math.max(...highs) : 0;
  const range = maxPrice - minPrice || Math.max(maxPrice * 0.02, 1);
  const paddedMin = minPrice - range * 0.08;
  const paddedMax = maxPrice + range * 0.08;
  const chartRange = paddedMax - paddedMin || 1;
  const candleStep = usableWidth / Math.max(candles.length, 1);
  const candleBodyWidth = Math.max(Math.min(candleStep * 0.56, 10), 3);
  const toX = (index) => padding.left + candleStep * index + candleStep / 2;
  const toY = (price) =>
    padding.top + usableHeight - ((Number(price || 0) - paddedMin) / chartRange) * usableHeight;

  return {
    width,
    height,
    padding,
    usableWidth,
    usableHeight,
    minPrice: paddedMin,
    maxPrice: paddedMax,
    candleStep,
    candleBodyWidth,
    toX,
    toY,
  };
}

function buildSignalLinePath(candles, geometry) {
  if (!candles.length) {
    return "";
  }

  return candles
    .map((candle, index) => {
      const x = geometry.toX(index);
      const y = geometry.toY(candle.close || 0);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildSignalCandleMarkup(candles, geometry) {
  return candles
    .map((candle, index) => {
      const open = Number(candle.open || 0);
      const close = Number(candle.close || 0);
      const high = Number(candle.high || close || open || 0);
      const low = Number(candle.low || close || open || 0);
      const x = geometry.toX(index);
      const wickTop = geometry.toY(high);
      const wickBottom = geometry.toY(low);
      const bodyTop = geometry.toY(Math.max(open, close));
      const bodyBottom = geometry.toY(Math.min(open, close));
      const bodyHeight = Math.max(bodyBottom - bodyTop, 1.5);
      const className = close >= open ? "positive" : "negative";
      return `
        <g class="signal-candle ${className}">
          <line x1="${x.toFixed(2)}" y1="${wickTop.toFixed(2)}" x2="${x.toFixed(2)}" y2="${wickBottom.toFixed(2)}" class="signal-candle-wick"></line>
          <rect
            x="${(x - geometry.candleBodyWidth / 2).toFixed(2)}"
            y="${Math.min(bodyTop, bodyBottom).toFixed(2)}"
            width="${geometry.candleBodyWidth.toFixed(2)}"
            height="${bodyHeight.toFixed(2)}"
            rx="1.5"
            class="signal-candle-body"
          ></rect>
        </g>
      `;
    })
    .join("");
}

function getSignalChartSummary(candles) {
  const first = candles[0] || null;
  const last = candles[candles.length - 1] || null;
  const highs = candles.map((item) => Number(item.high || 0)).filter((value) => Number.isFinite(value) && value > 0);
  const lows = candles.map((item) => Number(item.low || 0)).filter((value) => Number.isFinite(value) && value > 0);
  const currentPrice = Number(last?.close || 0);
  const openingPrice = Number(first?.open || first?.close || 0);
  return {
    currentPrice,
    highPrice: highs.length ? Math.max(...highs) : currentPrice,
    lowPrice: lows.length ? Math.min(...lows) : currentPrice,
    movePercent: openingPrice && currentPrice ? ((currentPrice - openingPrice) / openingPrice) * 100 : 0,
  };
}

function getSignalGuidePrice(candles) {
  const currentGuide = Number(state.signalChart.guidePrice || 0);
  if (currentGuide > 0) {
    return currentGuide;
  }
  return Number(candles[candles.length - 1]?.close || 0);
}

function getTradePnlPercent(trade) {
  const entry = getTradeEntryPrice(trade);
  const current = Number(getTradeCurrentMarket(trade.symbol)?.price || 0);
  if (!entry || !current) {
    return 0;
  }
  const multiplier = trade.side === "SELL" ? -1 : 1;
  return ((current - entry) / entry) * 100 * multiplier;
}

function getTradeExitExecutionSnapshot(exitOrder) {
  if (state.user?.role === "user") {
    return exitOrder?.mirroredExecution?.order || null;
  }
  return exitOrder?.adminExecution || null;
}

function getTradeClosedAt(trade) {
  const exitTimes = (trade.exitOrders || [])
    .map((exitOrder) => getTradeExitExecutionSnapshot(exitOrder))
    .filter((execution) => ["FILLED", "PARTIALLY_FILLED"].includes(String(execution?.status || "").toUpperCase()))
    .map((execution) => Number(execution?.transactTime || execution?.updateTime || execution?.time || 0))
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > 0);

  if (exitTimes.length) {
    return new Date(Math.max(...exitTimes)).toISOString();
  }

  const entryExecution = state.user?.role === "user" ? trade.mirroredExecution?.order : trade.adminExecution;
  if (
    String(trade.lifecycleStatus || "").toUpperCase() === "CLOSED" &&
    String(entryExecution?.status || "").toUpperCase() === "FILLED" &&
    String(trade.side || "").toUpperCase() === "SELL"
  ) {
    const timestamp = Number(entryExecution.transactTime || entryExecution.updateTime || entryExecution.time || 0);
    if (Number.isFinite(timestamp) && timestamp > 0) {
      return new Date(timestamp).toISOString();
    }
  }

  return trade.closedAt || trade.updatedAt || "";
}

function getExecutionAveragePrice(execution, fallbackPrice = 0) {
  const directPrice = Number(execution?.price || 0);
  if (directPrice > 0) {
    return directPrice;
  }

  const executedQty = Number(execution?.executedQty || 0);
  const quoteQty = Number(execution?.cummulativeQuoteQty || 0);
  if (executedQty > 0 && quoteQty > 0) {
    return quoteQty / executedQty;
  }

  return Number(fallbackPrice || 0);
}

function getTradeStaticPnlPercent(trade) {
  const entry = getTradeEntryPrice(trade);
  if (!entry) {
    return 0;
  }

  if (trade.lifecycleStatus === "CANCELED") {
    return 0;
  }

  if (trade.lifecycleStatus !== "CLOSED") {
    return getTradePnlPercent(trade);
  }

  const filledExitExecutions = (trade.exitOrders || [])
    .map((exitOrder) => ({
      execution: getTradeExitExecutionSnapshot(exitOrder),
      fallbackPrice: Number(exitOrder?.price || 0),
    }))
    .filter(({ execution }) => ["FILLED", "PARTIALLY_FILLED"].includes(String(execution?.status || "").toUpperCase()));

  const totalExitQuantity = filledExitExecutions.reduce(
    (sum, { execution }) => sum + Number(execution?.executedQty || 0),
    0
  );
  const totalExitValue = filledExitExecutions.reduce((sum, { execution, fallbackPrice }) => {
    const qty = Number(execution?.executedQty || 0);
    const price = getExecutionAveragePrice(execution, fallbackPrice);
    return sum + qty * price;
  }, 0);

  const closePrice = totalExitQuantity > 0 && totalExitValue > 0
    ? totalExitValue / totalExitQuantity
    : getExecutionAveragePrice(
        state.user?.role === "user" ? trade.mirroredExecution?.order : trade.adminExecution,
        Number(trade.price || 0)
      );

  if (!closePrice) {
    return 0;
  }

  const multiplier = trade.side === "SELL" ? -1 : 1;
  return ((closePrice - entry) / entry) * 100 * multiplier;
}

function getTradeExecutedQuantity(trade) {
  if (state.user?.role === "user") {
    return Number(trade.mirroredExecution?.order?.executedQty || 0);
  }
  return Number(trade.adminExecution?.executedQty || 0);
}

function getTradeExitExecutedQuantity(trade) {
  return (trade.exitOrders || []).reduce((sum, exitOrder) => {
    const execution =
      state.user?.role === "user" ? exitOrder.mirroredExecution?.order || null : exitOrder.adminExecution || null;
    return sum + Number(execution?.executedQty || 0);
  }, 0);
}

function getTradeRemainingQuantity(trade) {
  return Math.max(getTradeExecutedQuantity(trade) - getTradeExitExecutedQuantity(trade), 0);
}

function getTradeCurrentValue(trade) {
  if (state.user?.role === "user" && trade.userInvestment?.status === "ACTIVE") {
    return Number(trade.userInvestment.amountUsdt || 0) + getTradePnlValue(trade);
  }
  return getTradeRemainingQuantity(trade) * Number(getTradeCurrentMarket(trade.symbol)?.price || 0);
}

function getTradePnlValue(trade) {
  if (state.user?.role === "user" && trade.userInvestment?.status === "ACTIVE") {
    const amountUsdt = Number(trade.userInvestment.amountUsdt || 0);
    const baselinePnlPercent = Number(trade.userInvestment.baselinePnlPercent || 0);
    return amountUsdt * ((getTradePnlPercent(trade) - baselinePnlPercent) / 100);
  }
  const entry = getTradeEntryPrice(trade);
  const current = Number(getTradeCurrentMarket(trade.symbol)?.price || 0);
  const quantity = getTradeRemainingQuantity(trade);
  if (!entry || !current || !quantity) {
    return 0;
  }
  const multiplier = trade.side === "SELL" ? -1 : 1;
  return (current - entry) * quantity * multiplier;
}

function getUserInvestmentPnlPercent(trade) {
  if (state.user?.role !== "user" || trade.userInvestment?.status !== "ACTIVE") {
    return getTradePnlPercent(trade);
  }
  const amountUsdt = Number(trade.userInvestment.amountUsdt || 0);
  if (!amountUsdt) {
    return 0;
  }
  return (getTradePnlValue(trade) / amountUsdt) * 100;
}

function getTradeStaticPnlValue(trade) {
  const entry = getTradeEntryPrice(trade);
  const quantity = getTradeExecutedQuantity(trade);
  if (!entry || !quantity || trade.lifecycleStatus === "CANCELED") {
    return 0;
  }
  return entry * quantity * (getTradeStaticPnlPercent(trade) / 100);
}

function getTradeReportPnlValue(trade) {
  const status = String(trade.lifecycleStatus || "").toUpperCase();
  if (status === "CLOSED") {
    return getTradeStaticPnlValue(trade);
  }
  return getTradePnlValue(trade);
}

function getWeekStartKey(date) {
  const normalized = new Date(date);
  const day = normalized.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + offset);
  return normalized.toISOString().slice(0, 10);
}

function getTradeReportKey(trade, period) {
  const date = new Date(getTradeClosedAt(trade) || Date.now());
  if (period === "months") {
    return date.toISOString().slice(0, 7);
  }
  if (period === "weeks") {
    return `Week of ${getWeekStartKey(date)}`;
  }
  return date.toISOString().slice(0, 10);
}

function getTradeReportExitPrice(trade) {
  if (String(trade.lifecycleStatus || "").toUpperCase() !== "CLOSED") {
    return 0;
  }
  const filledExitExecutions = (trade.exitOrders || [])
    .map((exitOrder) => ({
      execution: getTradeExitExecutionSnapshot(exitOrder),
      fallbackPrice: Number(exitOrder?.price || 0),
    }))
    .filter(({ execution }) => ["FILLED", "PARTIALLY_FILLED"].includes(String(execution?.status || "").toUpperCase()));
  const totalExitQuantity = filledExitExecutions.reduce((sum, { execution }) => sum + Number(execution?.executedQty || 0), 0);
  const totalExitValue = filledExitExecutions.reduce((sum, { execution, fallbackPrice }) => {
    const qty = Number(execution?.executedQty || 0);
    return sum + qty * getExecutionAveragePrice(execution, fallbackPrice);
  }, 0);
  return totalExitQuantity && totalExitValue
    ? totalExitValue / totalExitQuantity
    : Number(getTradeCurrentMarket(trade.symbol)?.price || 0);
}

function buildProfitLossTradeBreakdown(trade, pnlValue) {
  const pnlPercent = getTradeStaticPnlPercent(trade);
  const investedUsdt = state.user?.role === "user" && trade.userInvestment?.amountUsdt
    ? Number(trade.userInvestment.amountUsdt || 0)
    : getTradeEntryPrice(trade) * getTradeExecutedQuantity(trade);
  const closedAt = getTradeClosedAt(trade);
  return {
    id: trade.id,
    symbol: trade.symbol || "-",
    side: trade.side || "-",
    status: trade.lifecycleStatus || "-",
    entryPrice: getTradeEntryPrice(trade),
    exitPrice: getTradeReportExitPrice(trade),
    quantity: getTradeExecutedQuantity(trade),
    investedUsdt,
    pnlPercent,
    pnlValue,
    createdAt: closedAt || trade.createdAt || "",
    closedAt,
  };
}

function shouldIncludeTradeInProfitLossReport(trade) {
  const symbol = normalizeTradeSymbolValue(trade?.symbol);
  if (EXCLUDED_PROFIT_LOSS_REPORT_SYMBOLS.has(symbol)) {
    return false;
  }
  return String(trade?.lifecycleStatus || "").toUpperCase() === "CLOSED" && !!getTradeClosedAt(trade);
}

function getTradeJoinedUsers(trade) {
  return Array.isArray(trade?.joinedUsers) ? trade.joinedUsers : [];
}

function getTradeJoinedUsersCount(trade) {
  const count = Number(trade?.joinedUsersCount ?? getTradeJoinedUsers(trade).length ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function renderTradeJoinedUsersButton(trade) {
  if (state.user?.role !== "admin") {
    return "";
  }

  const count = getTradeJoinedUsersCount(trade);
  return `
    <button
      class="trade-joined-count-btn"
      data-open-trade-joined-users="${escapeHtml(trade.id || "")}"
      type="button"
      aria-label="View joined users for ${escapeHtml(trade.symbol || "trade")}"
      title="View joined users"
    >
      ${icon("users")}
      <span>${count.toLocaleString()}</span>
    </button>
  `;
}

function getProfitLossReportRows(period = state.reportPeriod) {
  const groups = new Map();
  for (const trade of getHistoryTrades().filter(shouldIncludeTradeInProfitLossReport)) {
    const key = getTradeReportKey(trade, period);
    const current = groups.get(key) || {
      key,
      trades: 0,
      pnlValue: 0,
      wins: 0,
      losses: 0,
      items: [],
    };
    const pnlValue = getTradeReportPnlValue(trade);
    current.trades += 1;
    current.pnlValue += pnlValue;
    if (pnlValue > 0) {
      current.wins += 1;
    } else if (pnlValue < 0) {
      current.losses += 1;
    }
    current.items.push(buildProfitLossTradeBreakdown(trade, pnlValue));
    groups.set(key, current);
  }
  return [...groups.values()]
    .map((row) => ({
      ...row,
      items: row.items.sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0)),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

function getReportPeriodLabel(period = state.reportPeriod) {
  return {
    days: "Daily",
    weeks: "Weekly",
    months: "Monthly",
  }[period] || "Daily";
}

function escapePdfText(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfRgb(color) {
  return color.map((value) => Math.max(0, Math.min(1, Number(value || 0))).toFixed(3)).join(" ");
}

function pdfText(text, x, y, { size = 9, font = "F1", color = [0.08, 0.1, 0.14], max = 64 } = {}) {
  return [
    `${pdfRgb(color)} rg`,
    "BT",
    `/${font} ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(String(text || "").slice(0, max))}) Tj`,
    "ET",
  ].join("\n");
}

function pdfRect(x, y, width, height, color, stroke = null) {
  const commands = [
    `${pdfRgb(color)} rg`,
    `${x} ${y} ${width} ${height} re f`,
  ];
  if (stroke) {
    commands.push(`${pdfRgb(stroke)} RG`, `${x} ${y} ${width} ${height} re S`);
  }
  return commands.join("\n");
}

function getPdfPnlColor(value) {
  if (value > 0) {
    return [0.02, 0.5, 0.22];
  }
  if (value < 0) {
    return [0.74, 0.12, 0.12];
  }
  return [0.42, 0.46, 0.52];
}

function createProfitLossPdfBlob(rows, period) {
  const pageWidth = 612;
  const pageHeight = 842;
  const margin = 36;
  const rowHeight = 22;
  const columns = [
    { label: "Trade", x: 46, width: 82 },
    { label: "Side", x: 130, width: 38 },
    { label: "Entry", x: 172, width: 70 },
    { label: "Exit", x: 244, width: 70 },
    { label: "Size", x: 316, width: 74 },
    { label: "P&L %", x: 392, width: 62 },
    { label: "P&L", x: 456, width: 104 },
  ];
  const pages = [];
  let commands = [];
  let y = 790;
  const total = rows.reduce((sum, row) => sum + row.pnlValue, 0);

  function pushPage() {
    pages.push(commands.join("\n"));
    commands = [];
    y = 790;
  }

  function ensureSpace(height = rowHeight) {
    if (y - height < margin) {
      pushPage();
      renderPageHeader(false);
    }
  }

  function renderPageHeader(isFirstPage = false) {
    commands.push(pdfRect(0, 0, pageWidth, pageHeight, [0.98, 0.99, 1]));
    commands.push(pdfText("Netrue Trade P&L Report", 46, y, { size: 18, font: "F2", color: [0.04, 0.1, 0.22], max: 80 }));
    y -= 24;
    if (isFirstPage) {
      commands.push(pdfText(`${getReportPeriodLabel(period)} report  |  Generated ${new Date().toLocaleString()}`, 46, y, { size: 9, color: [0.38, 0.43, 0.5], max: 100 }));
      y -= 22;
      commands.push(pdfRect(46, y - 12, 520, 34, total >= 0 ? [0.91, 0.98, 0.94] : [1, 0.94, 0.94], [0.84, 0.88, 0.93]));
      commands.push(pdfText("Total P&L", 60, y, { size: 9, font: "F2", color: [0.38, 0.43, 0.5] }));
      commands.push(pdfText(`${total >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(total))}`, 142, y, { size: 14, font: "F2", color: getPdfPnlColor(total), max: 40 }));
      y -= 38;
    } else {
      commands.push(pdfText("continued", 46, y, { size: 9, color: [0.38, 0.43, 0.5] }));
      y -= 24;
    }
  }

  function renderTableHeader() {
    commands.push(pdfRect(46, y - 14, 520, 20, [0.08, 0.12, 0.2]));
    columns.forEach((column) => {
      commands.push(pdfText(column.label, column.x, y - 8, { size: 8, font: "F2", color: [1, 1, 1], max: 16 }));
    });
    y -= 24;
  }

  renderPageHeader(true);
  if (!rows.length) {
    commands.push(pdfText("No closed trade history available.", 46, y, { size: 11, color: [0.38, 0.43, 0.5] }));
  }

  rows.forEach((group) => {
    ensureSpace(58);
    commands.push(pdfRect(46, y - 14, 520, 26, [0.93, 0.96, 1], [0.84, 0.88, 0.93]));
    commands.push(pdfText(group.key, 58, y - 4, { size: 11, font: "F2", color: [0.04, 0.1, 0.22], max: 32 }));
    commands.push(pdfText(`${group.trades} trades  |  ${group.wins} wins  |  ${group.losses} losses`, 170, y - 4, { size: 8, color: [0.38, 0.43, 0.5], max: 48 }));
    commands.push(pdfText(`${group.pnlValue >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(group.pnlValue))}`, 456, y - 4, { size: 10, font: "F2", color: getPdfPnlColor(group.pnlValue), max: 28 }));
    y -= 34;
    renderTableHeader();

    (group.items || []).forEach((item, index) => {
      ensureSpace(rowHeight + 4);
      commands.push(pdfRect(46, y - 14, 520, 20, index % 2 ? [0.99, 0.995, 1] : [1, 1, 1], [0.9, 0.92, 0.95]));
      commands.push(pdfText(item.symbol, columns[0].x, y - 8, { size: 8, font: "F2", max: 16 }));
      commands.push(pdfText(item.side, columns[1].x, y - 8, { size: 8, max: 8 }));
      commands.push(pdfText(item.entryPrice ? formatNumber(item.entryPrice, 6) : "-", columns[2].x, y - 8, { size: 8, max: 14 }));
      commands.push(pdfText(item.exitPrice ? formatNumber(item.exitPrice, 6) : "-", columns[3].x, y - 8, { size: 8, max: 14 }));
      commands.push(pdfText(item.investedUsdt ? formatUsdtUnit(item.investedUsdt) : formatNumber(item.quantity, 6), columns[4].x, y - 8, { size: 8, max: 18 }));
      commands.push(pdfText(`${item.pnlPercent >= 0 ? "+" : ""}${formatNumber(item.pnlPercent, 2)}%`, columns[5].x, y - 8, { size: 8, font: "F2", color: getPdfPnlColor(item.pnlValue), max: 12 }));
      commands.push(pdfText(`${item.pnlValue >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(item.pnlValue))}`, columns[6].x, y - 8, { size: 8, font: "F2", color: getPdfPnlColor(item.pnlValue), max: 24 }));
      y -= rowHeight;
    });
    y -= 8;
  });

  if (commands.length) {
    pushPage();
  }

  const pageObjects = pages.map((content, index) =>
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${5 + index} 0 R >>`
  );
  const contentObjects = pages.map((content) => `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjects.map((_, index) => `${5 + pages.length + index} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ...contentObjects,
    ...pageObjects,
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefStart = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([body], { type: "application/pdf" });
}

function downloadProfitLossReport() {
  const rows = getProfitLossReportRows(state.reportPeriod);
  const blob = createProfitLossPdfBlob(rows, state.reportPeriod);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trade-profit-loss-${state.reportPeriod}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getTradeTpPnlPercent(trade, targetPrice) {
  const entry = getTradeEntryPrice(trade);
  const target = Number(targetPrice || 0);
  if (!entry || !target) {
    return 0;
  }
  const multiplier = trade.side === "SELL" ? -1 : 1;
  return ((target - entry) / entry) * 100 * multiplier;
}

function getTradeTpPnlValue(trade, targetPrice) {
  const entry = getTradeEntryPrice(trade);
  const target = Number(targetPrice || 0);
  const quantity = getTradeRemainingQuantity(trade);
  if (!entry || !target || !quantity) {
    return 0;
  }
  const multiplier = trade.side === "SELL" ? -1 : 1;
  return (target - entry) * quantity * multiplier;
}

function renderNotice() {
  return state.notice ? `<div class="floating-notice">${state.notice}</div>` : "";
}

function renderPwaStatusBanner() {
  if (!state.pwa.isOnline) {
    return `<div class="pwa-status-banner offline">Offline</div>`;
  }
  if (state.pwa.onlineNoticeVisible) {
    return `<div class="pwa-status-banner online">Back online</div>`;
  }
  return "";
}

function renderPwaInstallPrompt() {
  if (!state.pwa.installPromptVisible || state.pwa.isStandalone) {
    return "";
  }
  const isIos = state.pwa.isIos && !state.pwa.installEvent;
  return `
    <div class="modal-backdrop pwa-backdrop">
      <section class="pwa-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
        <img src="/icons/icon-192.png" alt="" class="pwa-logo" />
        <h3 id="pwa-install-title">${isIos ? "Install NetrueFi on iPhone" : "Get the NetrueFi App"}</h3>
        ${
          isIos
            ? `
              <p>Add NetrueFi to your Home Screen for faster access and notifications.</p>
              <ol class="pwa-steps">
                <li>Tap Share</li>
                <li>Choose Add to Home Screen</li>
                <li>Tap Add</li>
              </ol>
            `
            : `
              <p>Open NetrueFi faster from your home screen with a full-screen app feel.</p>
              <div class="pwa-benefits">
                <span>${icon("check")} Faster access</span>
                <span>${icon("check")} Secure alerts</span>
                <span>${icon("check")} Dashboard shortcut</span>
              </div>
            `
        }
        <div class="modal-actions">
          <button class="button-secondary" id="pwa-install-later-btn" type="button">${isIos ? "Got it" : "Maybe later"}</button>
          ${isIos ? "" : `<button class="button-primary shimmer-button" id="pwa-install-now-btn" type="button">Install app</button>`}
        </div>
      </section>
    </div>
  `;
}

function renderPwaNotificationPrompt() {
  if (!state.pwa.notificationPromptVisible) {
    return "";
  }
  const needsIosInstall = state.pwa.isIos && !state.pwa.isStandalone;
  return `
    <div class="modal-backdrop pwa-backdrop">
      <section class="pwa-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-notification-title">
        <img src="/icons/icon-192.png" alt="" class="pwa-logo" />
        <h3 id="pwa-notification-title">${needsIosInstall ? "Install first" : "Stay Updated"}</h3>
        <p>${needsIosInstall ? "Install NetrueFi on your Home Screen first to enable iPhone notifications." : "Get transaction, quest, service, and trading updates when they matter."}</p>
        <div class="pwa-benefits">
          <span>${icon("bell")} Transactions</span>
          <span>${icon("gift")} Quest rewards</span>
          <span>${icon("signals")} Trading signals</span>
        </div>
        <div class="modal-actions">
          <button class="button-secondary" id="pwa-notification-later-btn" type="button">Not now</button>
          <button class="button-primary shimmer-button" id="${needsIosInstall ? "pwa-notification-install-btn" : "pwa-notification-enable-btn"}" type="button">
            ${needsIosInstall ? "How to install" : "Enable notifications"}
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderPwaUpdatePrompt() {
  if (!state.pwa.updateAvailable) {
    return "";
  }
  return `
    <div class="pwa-update-banner">
      <div>
        <strong>NetrueFi update available</strong>
        <p>A new version is ready.</p>
      </div>
      <button class="button-secondary" id="pwa-update-later-btn" type="button">Later</button>
      <button class="button-primary shimmer-button" id="pwa-update-now-btn" type="button">Update</button>
    </div>
  `;
}

function renderPwaLayer() {
  return `
    ${renderPwaStatusBanner()}
    ${renderPwaInstallPrompt()}
    ${renderPwaNotificationPrompt()}
    ${renderPwaUpdatePrompt()}
  `;
}

function renderPwaSettingsContent() {
  const preferences = state.pwa.pushPreferences || state.pwa.pushConfig.preferences || {};
  const installedLabel = state.pwa.isStandalone ? "Installed" : "Not installed";
  const notificationLabel = state.pwa.pushSubscribed
    ? "Enabled"
    : state.pwa.notificationPermission === "denied"
      ? "Blocked"
      : "Disabled";
  const rows = [
    ["transactions", "Transaction Updates"],
    ["messages", "Messages"],
    ["quest", "Quest Notifications"],
    ["lowBalance", "Low Balance Alerts"],
    ["vtuPurchases", "Airtime & Data"],
    ["tradingSignals", "Trading Signals"],
    ["appUpdates", "App Updates"],
  ];
  return `
    <div class="pwa-settings-card">
      <div class="pwa-settings-title-row">
        <p class="muted-copy">Install, offline support, and alerts.</p>
        <span class="app-version-pill">v${escapeHtml(APP_VERSION)}</span>
      </div>
      <div class="pwa-settings-grid">
        <div>
          <span>Installation</span>
          <strong>${installedLabel}</strong>
        </div>
        <div>
          <span>Notifications</span>
          <strong>${notificationLabel}</strong>
        </div>
      </div>
      <div class="pwa-settings-actions">
        ${state.pwa.isStandalone ? "" : `<button class="button-secondary" id="pwa-settings-install-btn" type="button">${icon("download")} Install NetrueFi</button>`}
        <button class="button-secondary" id="pwa-settings-notification-btn" type="button">${icon("bell")} Manage notifications</button>
      </div>
      <form id="pwa-notification-preferences-form" class="pwa-preference-list">
        ${rows
          .map(([key, label]) => `
            <label class="toggle-row">
              <span>${label}</span>
              <input name="${key}" type="checkbox" ${preferences[key] !== false ? "checked" : ""} />
            </label>
          `)
          .join("")}
        <button class="button-primary shimmer-button" type="submit">Save preferences</button>
      </form>
    </div>
  `;
}

function renderPwaSettingsCard() {
  return `
    <section class="mobile-card settings-card" data-section="app">
      <div class="section-head">
        <div>
          <h3>App</h3>
          <p class="muted-copy">Install and alerts.</p>
        </div>
      </div>
      ${renderPwaSettingsContent()}
    </section>
  `;
}

async function installNetrueFiApp() {
  if (state.pwa.isIos && !state.pwa.installEvent) {
    state.pwa.installPromptVisible = true;
    render();
    return;
  }
  const promptEvent = state.pwa.installEvent;
  if (!promptEvent) {
    state.pwa.installPromptVisible = false;
    dismissPwaPrompt(PWA_INSTALL_DISMISSED_UNTIL_KEY, PWA_INSTALL_DISMISS_MS);
    render();
    showNotice("Install is not available from this browser yet.");
    return;
  }
  state.pwa.installPromptVisible = false;
  render();
  try {
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
  } finally {
    dismissPwaPrompt(PWA_INSTALL_DISMISSED_UNTIL_KEY, PWA_INSTALL_DISMISS_MS);
  }
  state.pwa.installEvent = null;
  render();
}

function showNotificationSoftPrompt() {
  if (isPwaDismissed(PWA_NOTIFICATION_DISMISSED_UNTIL_KEY)) {
    showNotice("Notifications can be enabled later from App settings.");
    return;
  }
  state.pwa.notificationPromptVisible = true;
  render();
}

async function activatePwaUpdate() {
  if (hasSensitiveActionInProgress()) {
    showNotice("Finish your current action before updating.");
    return;
  }
  const registration = state.pwa.serviceWorkerRegistration || await navigator.serviceWorker.ready.catch(() => null);
  const worker = registration?.waiting;
  if (!worker) {
    state.pwa.updateAvailable = false;
    render();
    return;
  }
  worker.postMessage({ type: "SKIP_WAITING" });
}

function bindPwaActions() {
  const installLater = document.getElementById("pwa-install-later-btn");
  if (installLater) {
    installLater.onclick = () => {
      dismissPwaPrompt(PWA_INSTALL_DISMISSED_UNTIL_KEY, PWA_INSTALL_DISMISS_MS);
      state.pwa.installPromptVisible = false;
      render();
    };
  }

  const installButtons = [
    document.getElementById("pwa-install-now-btn"),
    document.getElementById("pwa-settings-install-btn"),
    document.getElementById("pwa-notification-install-btn"),
  ].filter(Boolean);
  installButtons.forEach((button) => {
    button.onclick = () => {
      button.disabled = true;
      if (state.pwa.isIos && !state.pwa.installEvent) {
        state.pwa.notificationPromptVisible = false;
        state.pwa.installPromptVisible = true;
        render();
        return;
      }
      void installNetrueFiApp().catch((error) => showError(error.message));
    };
  });

  const notificationLater = document.getElementById("pwa-notification-later-btn");
  if (notificationLater) {
    notificationLater.onclick = () => {
      dismissPwaPrompt(PWA_NOTIFICATION_DISMISSED_UNTIL_KEY, PWA_NOTIFICATION_DISMISS_MS);
      state.pwa.notificationPromptVisible = false;
      render();
    };
  }

  const notificationButton = document.getElementById("pwa-settings-notification-btn");
  if (notificationButton) {
    notificationButton.onclick = showNotificationSoftPrompt;
  }

  const notificationEnable = document.getElementById("pwa-notification-enable-btn");
  if (notificationEnable) {
    notificationEnable.onclick = () => {
      notificationEnable.disabled = true;
      void subscribeToPushNotifications()
        .then(() => {
          render();
          showNotice("Notifications enabled");
        })
        .catch((error) => {
          state.pwa.notificationPromptVisible = false;
          render();
          showError(error.message);
        });
    };
  }

  const preferenceForm = document.getElementById("pwa-notification-preferences-form");
  if (preferenceForm) {
    preferenceForm.onsubmit = (event) => {
      event.preventDefault();
      void updatePushPreferences(preferenceForm)
        .then(() => showNotice("Notification preferences saved"))
        .catch((error) => showError(error.message));
    };
  }

  const updateLater = document.getElementById("pwa-update-later-btn");
  if (updateLater) {
    updateLater.onclick = () => {
      state.pwa.updateAvailable = false;
      render();
    };
  }

  const updateNow = document.getElementById("pwa-update-now-btn");
  if (updateNow) {
    updateNow.onclick = () => {
      void activatePwaUpdate().catch((error) => showError(error.message));
    };
  }
}

function getUnreadMessageNotifications() {
  const now = Date.now();
  return (state.notifications || [])
    .filter((item) => {
      if (String(item.type || "").toUpperCase() !== "MESSAGE" || item.readAt) {
        return false;
      }
      const expiresAt = Date.parse(item.expiresAt || "");
      return !Number.isFinite(expiresAt) || expiresAt > now;
    })
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
}

function renderMessageNotificationPopup() {
  const message = getUnreadMessageNotifications()[0];
  if (!message) {
    return "";
  }
  return `
    <aside class="message-popover" aria-live="polite">
      <button class="message-popover-body" data-message-popup-open="${escapeHtml(message.id)}" type="button">
        <span class="message-popover-icon">${icon("contact")}</span>
        <span>
          <strong>${escapeHtml(message.title || "Message")}</strong>
          <small>${escapeHtml(message.message || "")}</small>
        </span>
      </button>
      <button class="message-popover-close" data-message-popup-dismiss="${escapeHtml(message.id)}" type="button" aria-label="Dismiss message">x</button>
    </aside>
  `;
}

function getNotificationConversationUserId(notification = {}) {
  return notification.metadata?.conversationUserId
    || notification.conversationUserId
    || (String(notification.entityType || "").toUpperCase() === "USER" ? notification.entityId : "");
}

function renderDashboardTopBar() {
  if (!state.user) {
    return "";
  }
  const notifications = state.notifications || [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  return `
    <header class="dashboard-topbar">
      <div>
        <strong>${escapeHtml(state.user.name || "Dashboard")}</strong>
        <p class="muted-copy">${state.user.role === "admin" ? "Admin" : "Wallet"}</p>
      </div>
      <div class="notification-wrap">
        <button class="icon-action notification-button" id="notification-toggle-btn" type="button" aria-label="Notifications" title="Notifications">
          ${icon("bell")}
          ${unreadCount ? `<span class="notification-badge">${unreadCount > 9 ? "9+" : unreadCount}</span>` : ""}
        </button>
        ${
          state.showNotifications
            ? `
              <div class="notification-panel">
                ${notifications
                  .slice(0, 30)
                  .map(
                    (item) => `
                      <button class="notification-item ${item.readAt ? "read" : ""}" data-notification-open="${escapeHtml(item.id)}" type="button">
                        <strong>${escapeHtml(item.title || item.type || "Update")}</strong>
                        <p>${escapeHtml(item.message || "")}</p>
                        <span class="notification-time">${item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
                      </button>
                    `
                  )
                  .join("") || `<p class="muted-copy">No notifications.</p>`}
              </div>
            `
            : ""
        }
      </div>
    </header>
  `;
}

function renderErrorModal() {
  if (!state.modalError) {
    return "";
  }
  return `
    <div class="modal-backdrop">
      <div class="modal-card">
        <button class="modal-close" id="modal-close-btn" type="button">x</button>
        <p class="modal-eyebrow">Action Needed</p>
        <h3>Something needs attention</h3>
        <p class="modal-text">${state.modalError}</p>
      </div>
    </div>
  `;
}

function getFilteredAdminUsers() {
  const query = String(state.adminUserSearch || "").trim().toLowerCase();
  if (!query) {
    return state.users || [];
  }
  return (state.users || []).filter((user) =>
    [
      user.name,
      user.email,
      user.id,
      user.activeExchange,
      user.mirrorEnabled ? "mirror active" : "mirror off",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query)
  );
}

function isListExpanded(key) {
  return state.expandedListKeys.includes(key);
}

function getRecordTime(record = {}) {
  const value = record.createdAt || record.submittedAt || record.completedAt || record.updatedAt || record.generatedAt || record.redeemedAt || 0;
  return Date.parse(value) || 0;
}

function sortRecent(records = []) {
  return [...records].sort((a, b) => getRecordTime(b) - getRecordTime(a));
}

function getPreviewRecords(records = [], key, limit = 3) {
  const sorted = sortRecent(records);
  return isListExpanded(key) ? sorted : sorted.slice(0, limit);
}

function renderListToggle(key, total, limit = 3) {
  if (total <= limit) {
    return "";
  }
  const expanded = isListExpanded(key);
  return `
    <button class="view-more-btn" data-list-toggle="${escapeHtml(key)}" type="button" aria-expanded="${expanded ? "true" : "false"}">
      ${icon(expanded ? "chevronUp" : "chevronDown")}
      <span>${expanded ? "Less" : "More"}</span>
    </button>
  `;
}

function renderCopyButton(value, label = "Copy") {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return `
    <button class="copy-icon-btn" data-copy-text="${escapeHtml(text)}" type="button" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
      ${icon("copy")}
    </button>
  `;
}

async function copyTextToClipboard(text) {
  const value = String(text || "").trim();
  if (!value) {
    return;
  }
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function getVtuNetwork(networkId) {
  const normalized = String(networkId || "").trim().toLowerCase();
  return VTU_NETWORKS.find((network) => network.id === normalized) || null;
}

function renderVtuNetworkLogo(networkId) {
  const network = getVtuNetwork(networkId) || { id: "other", logo: "+" };
  return `<span class="vtu-network-logo vtu-network-${escapeHtml(network.id)}">${escapeHtml(network.logo)}</span>`;
}

function getVtuRecentTargets(productType) {
  const product = String(productType || "").trim().toLowerCase();
  const seen = new Set();
  return (state.vtuTransactions || [])
    .filter((transaction) => String(transaction.productType || "").trim().toLowerCase() === product && transaction.phone)
    .filter((transaction) => {
      const key = `${transaction.network}:${transaction.phone}:${transaction.planName || transaction.faceValue || ""}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function getVtuPlanCategory(plan = {}) {
  const text = `${plan.validity || ""} ${plan.name || ""}`.toLowerCase();
  const dayMatch = text.match(/(\d+(?:\.\d+)?)\s*(day|days|daily)\b/);
  const weekMatch = text.match(/(\d+(?:\.\d+)?)\s*(week|weeks|weekly)\b/);
  const monthMatch = text.match(/(\d+(?:\.\d+)?)\s*(month|months|monthly)\b/);
  const yearMatch = text.match(/(\d+(?:\.\d+)?)\s*(year|years|yearly|annual)\b/);
  if (yearMatch) return "Yearly";
  if (monthMatch) return "Monthly";
  if (weekMatch) return "Weekly";
  if (dayMatch) {
    const days = Number(dayMatch[1] || 1);
    if (days >= 365) return "Yearly";
    if (days >= 28) return "Monthly";
    if (days >= 7) return "Weekly";
    return "Daily";
  }
  if (/\b365\b/.test(text)) return "Yearly";
  if (/\b30\b|\b31\b|\b28\b/.test(text)) return "Monthly";
  if (/\b7\b|\b14\b/.test(text)) return "Weekly";
  return "Daily";
}

function getVtuPlansByCategory() {
  return VTU_PLAN_CATEGORIES.reduce((groups, category) => {
    groups[category] = (state.vtuDataPlans || []).filter((plan) => getVtuPlanCategory(plan) === category);
    return groups;
  }, {});
}

function formatVtuPlanLabel(plan = {}) {
  const title = plan.name || [plan.size, plan.validity].filter(Boolean).join(" for ");
  return `${title} - ${formatNaira(plan.sellingPrice).replace(".00", "")}`;
}

function getSelectedVtuPlan() {
  const variationId = state.actionModal?.variationId || "";
  return (state.vtuDataPlans || []).find((plan) => plan.id === variationId || plan.variationId === variationId) || null;
}

function renderVtuPackageSheet() {
  if (state.actionModal?.type !== "vtu-data" || !state.actionModal.packageSheet) {
    return "";
  }
  const activeCategory = state.actionModal.packageCategory || "Daily";
  const groups = getVtuPlansByCategory();
  const plans = groups[activeCategory] || [];
  return `
    <div class="vtu-package-backdrop">
      <div class="vtu-package-sheet">
        <button class="vtu-sheet-close" id="vtu-package-close-btn" type="button" aria-label="Close package picker">${icon("x")}</button>
        <div class="vtu-sheet-handle"></div>
        <h3>Choose a Package</h3>
        <p>Categories</p>
        <div class="vtu-package-tabs">
          ${VTU_PLAN_CATEGORIES.map((category) => `
            <button class="${category === activeCategory ? "active" : ""}" data-vtu-plan-category="${category}" type="button">${category}</button>
          `).join("")}
        </div>
        <div class="vtu-package-list">
          ${
            plans.length
              ? plans.map((plan) => `
                  <button class="vtu-package-row" data-vtu-plan-select="${escapeHtml(plan.variationId || plan.id)}" type="button">
                    ${escapeHtml(formatVtuPlanLabel(plan))}
                  </button>
                `).join("")
              : `<p class="vtu-empty-state">No active package here.</p>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderTransferModal() {
  const ngnWallet = getFinancialWallet("NGN");
  const usdtWallet = getFinancialWallet("USDT");
  const currency = state.actionModal.currency || "NGN";
  const available = currency === "USDT" ? Number(usdtWallet?.availableBalance || 0) : Number(ngnWallet?.availableBalance || 0);
  return `
    <div class="modal-backdrop vtu-screen-backdrop">
      <div class="vtu-phone-screen">
        <header class="vtu-screen-header">
          <button class="vtu-back-btn" id="action-modal-cancel-btn" type="button">${icon("arrowLeft")}</button>
          <strong>Transfer</strong>
          <span></span>
        </header>
        <div class="vtu-transfer-card">
          <label>Email <input id="transfer-email-input" type="email" value="${escapeHtml(state.actionModal.email || "")}" placeholder="user@email.com" autocomplete="off" /></label>
          <label>Currency
            <select id="transfer-currency-input">
              <option value="NGN" ${currency === "NGN" ? "selected" : ""}>NGN</option>
              <option value="USDT" ${currency === "USDT" ? "selected" : ""}>USDT</option>
            </select>
          </label>
          <label>Amount <input id="transfer-amount-input" type="number" min="0" step="${currency === "USDT" ? "0.00000001" : "1"}" value="${escapeHtml(state.actionModal.amount || "")}" placeholder="0" /></label>
          <label>Note <input id="transfer-note-input" value="${escapeHtml(state.actionModal.note || "")}" placeholder="Optional" /></label>
        </div>
        <p class="vtu-balance-line">Balance: ${currency === "USDT" ? formatUsdtUnit(available) : formatNaira(available)}</p>
        <button class="vtu-next-btn" id="transfer-submit-btn" type="button" ${state.actionModal.email && state.actionModal.amount ? "" : "disabled"}>${icon("send")} Send</button>
      </div>
    </div>
  `;
}

function renderVtuServiceModal() {
  const isData = state.actionModal.type === "vtu-data";
  const settings = state.vtuSettings || getFinancialSettings().vtu || {};
  const ngnWallet = getFinancialWallet("NGN");
  const availableNgn = Number(ngnWallet?.availableBalance || 0);
  const network = state.actionModal.network || "";
  const selectedPlan = getSelectedVtuPlan();
  const amount = isData ? selectedPlan?.sellingPrice || "" : state.actionModal.amount || "";
  const canUse = settings.configured && (isData ? settings.dataEnabled : settings.airtimeEnabled);
  const recent = getVtuRecentTargets(isData ? "data" : "airtime");
  const title = isData ? "Internet" : "Airtime";
  return `
    <div class="modal-backdrop vtu-screen-backdrop">
      <div class="vtu-phone-screen">
        <header class="vtu-screen-header">
          <button class="vtu-back-btn" id="action-modal-cancel-btn" type="button">${icon("arrowLeft")}</button>
          <strong>${title} <span class="flag-chip">NG</span></strong>
          <span></span>
        </header>
        ${
          canUse
            ? `
              <section class="vtu-recent-row">
                <p>Most Recent</p>
                <div>
                  ${
                    recent.length
                      ? recent.map((item) => `
                          <button class="vtu-recent-item" data-vtu-recent="${escapeHtml(item.id)}" type="button">
                            ${renderVtuNetworkLogo(item.network)}
                            <span>${escapeHtml(item.planName || item.phone)}</span>
                            <small>${escapeHtml(item.phone || "")}</small>
                          </button>
                        `).join("")
                      : `<span class="vtu-recent-empty">No recent</span>`
                  }
                </div>
              </section>
              <section class="vtu-network-section">
                <p>Choose Network</p>
                <div class="vtu-network-grid">
                  ${VTU_NETWORKS.map((item) => `
                    <button class="vtu-network-tile ${network === item.id ? "active" : ""}" data-vtu-network="${item.id}" type="button">
                      ${renderVtuNetworkLogo(item.id)}
                      <span>${escapeHtml(item.label)}</span>
                    </button>
                  `).join("")}
                </div>
              </section>
              ${
                isData
                  ? `
                    <section class="vtu-field-section">
                      <label>Package</label>
                      <button class="vtu-select-field" id="vtu-package-open-btn" type="button" ${state.loadingVtu || !network ? "disabled" : ""}>
                        <span>${selectedPlan ? escapeHtml(formatVtuPlanLabel(selectedPlan)) : state.loadingVtu ? "Loading plans..." : network && !state.vtuDataPlans.length ? "No active plans" : "Choose a Package"}</span>
                        ${icon("chevronDown")}
                      </button>
                    </section>
                  `
                  : `
                    <section class="vtu-field-section">
                      <label>Airtime</label>
                      <div class="wallet-choice-row vtu-airtime-row">
                        ${[100, 200, 500, 1000, 2000, 5000].map((value) => `<button class="wallet-choice" data-vtu-airtime-amount="${value}" type="button">${formatNaira(value).replace(".00", "")}</button>`).join("")}
                      </div>
                    </section>
                  `
              }
              <section class="vtu-field-section">
                <label>Phone Number <span>Choose Contact</span></label>
                <input id="vtu-phone-input" type="tel" inputmode="tel" value="${escapeHtml(state.actionModal.phone || "")}" placeholder="Phone Number" />
              </section>
              <section class="vtu-field-section">
                <label>Amount <span>Balance: ${formatNaira(availableNgn)}</span></label>
                <div class="vtu-amount-field">
                  <span>₦</span>
                  <input id="vtu-amount-input" type="number" min="${escapeHtml(settings.minAirtimeAmount || "100")}" max="${escapeHtml(settings.maxAirtimeAmount || "50000")}" step="1" value="${escapeHtml(amount)}" placeholder="0" ${isData ? "readonly" : ""} />
                </div>
              </section>
              <button class="vtu-next-btn" id="vtu-review-btn" data-vtu-product="${isData ? "data" : "airtime"}" type="button" ${amount && state.actionModal.phone && network ? "" : "disabled"}>Next</button>
              ${renderVtuPackageSheet()}
            `
            : `<p class="warning-copy">Service not available now.</p>`
        }
      </div>
    </div>
  `;
}

function renderAdminManualWithdrawalModal() {
  const withdrawal = (state.adminWithdrawals || []).find((item) => item.id === state.actionModal.withdrawalId);
  if (!withdrawal) {
    return "";
  }
  const destination = withdrawal.bank || withdrawal.destination || {};
  const status = String(withdrawal.status || "").trim().toUpperCase();
  const isNgnBankWithdrawal = withdrawal.currency === "NGN" && destination.type === "NGN_BANK";
  const canManualComplete = ["PENDING", "APPROVED", "PROCESSING"].includes(status);
  const amount = withdrawal.currency === "NGN" ? formatNaira(withdrawal.amount) : formatUsdtUnit(withdrawal.amount);
  const reference = withdrawal.paystackReference || withdrawal.externalTransactionReference || withdrawal.id || "";
  return `
    <div class="modal-backdrop">
      <div class="modal-card action-modal-card manual-withdrawal-modal" data-withdrawal-manual-modal="${escapeHtml(withdrawal.id || "")}">
        <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
        <p class="modal-eyebrow neutral">Withdrawal</p>
        <h3>Manual payout</h3>
        <div class="manual-withdrawal-summary">
          <div>
            <span>User</span>
            <strong>${escapeHtml(withdrawal.user?.name || "Unknown user")}</strong>
            <small>${escapeHtml(withdrawal.user?.email || "")}</small>
          </div>
          <div>
            <span>Amount</span>
            <strong>${amount}</strong>
            <small>${escapeHtml(formatWalletRequestStatus(status))}</small>
          </div>
        </div>
        <div class="withdrawal-detail-grid manual-withdrawal-details">
          ${
            isNgnBankWithdrawal
              ? `
                <div>
                  <span>Bank</span>
                  <strong>${escapeHtml(destination.bankName || "Not provided")}</strong>
                </div>
                <div>
                  <span>Name</span>
                  <strong>${escapeHtml(destination.accountName || "Not provided")}</strong>
                </div>
                <div>
                  <span>Account</span>
                  <strong>${escapeHtml(destination.accountNumber || "Not provided")}</strong>
                  ${destination.accountNumber ? renderCopyButton(destination.accountNumber, "Copy account number") : ""}
                </div>
              `
              : `
                <div>
                  <span>Network</span>
                  <strong>${escapeHtml(destination.network || "Not provided")}</strong>
                </div>
                <div>
                  <span>Wallet</span>
                  <strong>${escapeHtml(destination.address || "Not provided")}</strong>
                  ${destination.address ? renderCopyButton(destination.address, "Copy wallet address") : ""}
                </div>
              `
          }
          <div>
            <span>Request ref</span>
            <strong>${escapeHtml(reference)}</strong>
            ${reference ? renderCopyButton(reference, "Copy request reference") : ""}
          </div>
        </div>
        <div class="manual-approval-box">
          <label>
            Manual ref
            <input id="manual-withdrawal-reference-input" value="${escapeHtml(state.actionModal.manualReference || "")}" placeholder="Bank transfer reference" autocomplete="off" />
          </label>
          <label>
            Note
            <input id="manual-withdrawal-note-input" value="${escapeHtml(state.actionModal.adminNote || "")}" placeholder="Optional" autocomplete="off" />
          </label>
        </div>
        <div class="modal-actions">
          <button class="button-secondary" id="action-modal-cancel-btn" type="button">Cancel</button>
          <button class="button-primary shimmer-button" id="manual-withdrawal-submit-btn" data-admin-withdrawal-manual="${escapeHtml(withdrawal.id || "")}" type="button" ${canManualComplete ? "" : "disabled"}>
            ${icon("check")} Manual approval
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderActionModal() {
  if (!state.actionModal) {
    return "";
  }

  if (state.actionModal.type === "signal-chart") {
    const signal = getSignalById(state.actionModal.signalId);
    return window.SignalPage?.renderSignalChartModal
      ? window.SignalPage.renderSignalChartModal({
          signal,
          chartPayload: state.actionModal.chartPayload,
          error: state.actionModal.chartError,
          formatNumber,
        })
      : "";
  }

  if (state.actionModal.type === "trade-joined-users") {
    const trade = state.trades.find((item) => item.id === state.actionModal.tradeId);
    if (!trade) {
      return "";
    }
    const users = getTradeJoinedUsers(trade);
    const count = getTradeJoinedUsersCount(trade);
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card trade-joined-users-modal">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">${escapeHtml(trade.symbol || "Trade")}</p>
          <h3>${count.toLocaleString()} connected</h3>
          <div class="trade-joined-users-list">
            ${
              users.length
                ? users
                    .map(
                      (item) => `
                        <div class="trade-joined-user-row">
                          <div>
                            <strong>${escapeHtml(item.name || "User")}</strong>
                            <p class="muted-copy">${escapeHtml(item.email || "")}</p>
                          </div>
                          <div>
                            <strong>${formatUsdtUnit(item.amountUsdt || 0)}</strong>
                            <p class="muted-copy">${item.joinedAt ? new Date(item.joinedAt).toLocaleString() : ""}</p>
                          </div>
                        </div>
                      `
                    )
                    .join("")
                : `<p class="muted-copy">No user has joined this trade yet.</p>`
            }
          </div>
          <div class="modal-actions single">
            <button class="button-primary shimmer-button" id="action-modal-cancel-btn" type="button">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "withdraw-blocked") {
    const activeCount = getWithdrawalBlockingInvestmentRecords().length;
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Withdraw</p>
          <h3>Stop open trades first</h3>
          <p class="modal-text">Please stop ${activeCount > 1 ? "all open trades" : "your open trade"} before withdrawal.</p>
          <div class="modal-actions">
            <button class="button-secondary" id="action-modal-cancel-btn" type="button">Close</button>
            <button class="button-primary shimmer-button" id="withdraw-blocked-signal-btn" type="button">View trades</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "message-reply") {
    const notification = state.actionModal.notification || (state.notifications || []).find((item) => item.id === state.actionModal.notificationId);
    if (!notification) {
      return "";
    }
    const isAdmin = state.user?.role === "admin";
    const conversationUserId = getNotificationConversationUserId(notification);
    const targetUser = isAdmin ? state.users.find((user) => user.id === conversationUserId) : null;
    const heading = isAdmin
      ? `Reply ${targetUser?.name || "user"}`
      : "Reply admin";
    const message = String(notification.message || "");
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card message-reply-modal">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Message</p>
          <h3>${escapeHtml(heading)}</h3>
          <div class="reply-thread-card">
            <strong>${escapeHtml(notification.title || "Message")}</strong>
            <p>${escapeHtml(message)}</p>
            <span>${notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}</span>
          </div>
          <form id="notification-reply-form" class="stack-form" data-reply-notification="${escapeHtml(notification.id)}">
            <label class="stack-label">
              <span>Reply</span>
              <textarea name="message" rows="4" placeholder="Type reply" required></textarea>
            </label>
            <div class="modal-actions">
              <button class="button-secondary" id="action-modal-cancel-btn" type="button">Cancel</button>
              <button class="button-primary shimmer-button" type="submit">${icon("contact")} Send</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "withdrawal-support") {
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card message-reply-modal">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Support</p>
          <h3>Account name review</h3>
          <p class="modal-text">Send admin the account details you want reviewed.</p>
          <form id="withdrawal-support-message-form" class="stack-form">
            <label class="stack-label">
              <span>Message</span>
              <textarea name="message" rows="4" placeholder="Type message" required>${escapeHtml(state.actionModal.message || "")}</textarea>
            </label>
            <div class="modal-actions">
              <button class="button-secondary" id="action-modal-cancel-btn" type="button">Cancel</button>
              <button class="button-primary shimmer-button" type="submit">${icon("contact")} Send</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "admin-users") {
    const totalUsers = Number(state.users?.length || 0);
    const filteredUsers = getFilteredAdminUsers();
    const query = String(state.adminUserSearch || "");
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card admin-users-modal">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Users</p>
          <h3>${totalUsers.toLocaleString()} registered</h3>
          <div class="admin-user-search">
            <span>${icon("profile")}</span>
            <input id="admin-user-search-input" type="search" value="${escapeHtml(query)}" placeholder="Search users" autocomplete="off" />
          </div>
          <div class="admin-users-table-head">
            <span>User</span>
            <span>Balance</span>
            <span>Edit</span>
          </div>
          <div class="admin-users-modal-list">
            ${filteredUsers.map((user) => renderAdminUserCard(user)).join("") || `<p class="muted-copy">No matching users.</p>`}
          </div>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "admin-user-profile") {
    const user = state.users.find((item) => item.id === state.actionModal.userId) || state.actionModal.userSnapshot;
    if (!user) {
      return "";
    }
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card admin-profile-modal">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">User</p>
          <h3>Edit profile</h3>
          <form id="admin-user-profile-form" class="stack-form admin-profile-form" data-admin-profile-form="${escapeHtml(user.id)}">
            <label class="stack-label">
              <span>First name</span>
              <input name="firstName" value="${escapeHtml(user.firstName || String(user.name || "").split(" ")[0] || "")}" placeholder="First name" required />
            </label>
            <label class="stack-label">
              <span>Last name</span>
              <input name="lastName" value="${escapeHtml(user.lastName || String(user.name || "").split(" ").slice(1).join(" ") || "")}" placeholder="Last name" required />
            </label>
            <label class="stack-label">
              <span>Email</span>
              <input name="email" type="email" value="${escapeHtml(user.email || "")}" placeholder="Email" required />
            </label>
            <div class="modal-actions">
              <button class="button-secondary" id="action-modal-cancel-btn" type="button">Cancel</button>
              <button class="button-primary shimmer-button" type="submit">${icon("edit")} Save</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "admin-balance") {
    const user = state.users.find((item) => item.id === state.actionModal.userId);
    if (!user) {
      return "";
    }
    const financeSummary = user.financeSummary || {};
    const totalBalance = financeSummary.totalBalance || {};
    const liveUsdt = Number(totalBalance.liveUsdt || totalBalance.usdt || 0);
    const liveNgn = Number(totalBalance.liveNgnEquivalent || totalBalance.ngnEquivalent || 0);
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Balance</p>
          <h3>${escapeHtml(user.name || "User")}</h3>
          <div class="action-metric-stack">
            <div class="action-metric">
              <span>Live</span>
              <strong>${formatUsdtUnit(liveUsdt)}</strong>
            </div>
            <div class="action-metric">
              <span>Naira</span>
              <strong>${formatNaira(liveNgn)}</strong>
            </div>
          </div>
          <form id="admin-balance-modal-form" class="stack-form wallet-action-fields" data-admin-balance-form="${user.id}">
            <label class="stack-label">
              <span>Currency</span>
              <select name="currency" aria-label="Balance currency">
                <option value="USDT">USDT</option>
                <option value="NGN">Naira</option>
              </select>
            </label>
            <label class="stack-label">
              <span>Amount</span>
              <input name="amount" type="number" min="0" step="0.00000001" value="${formatDecimalInput(liveUsdt)}" placeholder="Set balance" required />
            </label>
            <label class="stack-label">
              <span>Note</span>
              <input name="note" type="text" placeholder="Reason" value="Balance updated" />
            </label>
            <div class="modal-actions">
              <button class="button-secondary" id="action-modal-cancel-btn" type="button">Cancel</button>
              <button class="button-primary shimmer-button" type="submit">${icon("edit")} Update</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "transfer") {
    return renderTransferModal();
  }

  if (state.actionModal.type === "digital-services") {
    return renderDigitalServiceBrowserModal();
  }

  if (state.actionModal.type === "digital-service-detail") {
    return renderDigitalServiceDetailModal();
  }

  if (state.actionModal.type === "digital-service-confirm") {
    return renderDigitalServiceConfirmModal();
  }

  if (state.actionModal.type === "digital-service-receipt") {
    return renderDigitalServiceReceiptModal();
  }

  if (state.actionModal.type === "vtu-airtime" || state.actionModal.type === "vtu-data") {
    return renderVtuServiceModal();
  }

  if (state.actionModal.type === "admin-manual-withdrawal") {
    return renderAdminManualWithdrawalModal();
  }

  if (state.actionModal.type === "vtu-confirm") {
    const isData = state.actionModal.productType === "data";
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card vtu-action-modal">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Confirm</p>
          <h3>${isData ? "Data Purchase" : "Airtime Purchase"}</h3>
          <div class="action-metric-stack">
            <div class="action-metric"><span>Phone</span><strong>${escapeHtml(state.actionModal.phone || "")}</strong></div>
            <div class="action-metric"><span>Network</span><strong>${escapeHtml(String(state.actionModal.network || "").toUpperCase())}</strong></div>
            ${isData ? `<div class="action-metric"><span>Plan</span><strong>${escapeHtml(state.actionModal.planName || "")}</strong></div>` : ""}
            <div class="action-metric"><span>Total</span><strong>${formatNaira(state.actionModal.amountCharged || 0)}</strong></div>
          </div>
          <div class="modal-actions">
            <button class="button-secondary" id="action-modal-cancel-btn" type="button">Cancel</button>
            <button class="button-primary shimmer-button" id="vtu-confirm-btn" type="button">${icon("check")} Pay</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "vtu-receipt") {
    const transaction = state.actionModal.transaction || {};
    const status = String(transaction.status || "processing").toUpperCase();
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card vtu-action-modal">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Receipt</p>
          <h3>${formatWalletRequestStatus(status)}</h3>
          <div class="action-metric-stack">
            <div class="action-metric"><span>Product</span><strong>${escapeHtml(String(transaction.productType || "VTU").toUpperCase())}</strong></div>
            <div class="action-metric"><span>Amount</span><strong>${formatNaira(transaction.amountCharged || 0)}</strong></div>
            <div class="action-metric"><span>Ref</span><strong>${escapeHtml(transaction.requestId || "")}</strong></div>
          </div>
          <div class="modal-actions">
            <button class="button-primary shimmer-button" id="action-modal-cancel-btn" type="button">Done</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "withdraw-review") {
    const payload = state.actionModal.withdrawalPayload || {};
    const currency = String(payload.currency || "USDT").toUpperCase();
    const amount = Number(payload.amount || 0);
    const settings = getFinancialSettings();
    const feeValue = currency === "NGN" ? Number(settings.withdrawal?.ngnFee || 100) : 0;
    const fee = Number.isFinite(feeValue) && feeValue > 0 ? feeValue : 0;
    const payout = Math.max(amount - fee, 0);
    const formatAmount = currency === "NGN" ? formatNaira : formatUsdtUnit;
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Withdrawal Review</p>
          <h3>Confirm withdrawal</h3>
          <div class="action-metric-stack">
            <div class="action-metric"><span>Wallet debit</span><strong>${formatAmount(amount)}</strong></div>
            <div class="action-metric"><span>Withdrawal fee</span><strong>${formatAmount(fee)}</strong></div>
            <div class="action-metric"><span>Sent for approval</span><strong>${formatAmount(payout)}</strong></div>
          </div>
          <div class="modal-actions">
            <button class="button-secondary" id="action-modal-cancel-btn" type="button">Cancel</button>
            <button class="button-primary shimmer-button" id="withdraw-review-confirm-btn" type="button">${icon("check")} Submit withdrawal</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "deposit" || state.actionModal.type === "withdraw") {
    const isDeposit = state.actionModal.type === "deposit";
    const isGiftRedeem = isDeposit && state.actionModal.depositMode === "gift";
    const settings = getFinancialSettings();
    const depositSettings = settings.deposit || {};
    const withdrawalSettings = settings.withdrawal || {};
    const rate = Number(settings.exchangeRate?.usdtToNgn || state.financialDashboard?.totalBalance?.usdtToNgnRate || 0);
    const usdtWallet = getFinancialWallet("USDT");
    const ngnWallet = getFinancialWallet("NGN");
    const savedBanks = getSavedBankAccounts();
    const savedBank = getSavedBankAccount();
    const bankMode = state.actionModal.bankMode || (savedBanks.length ? "saved" : "new");
    const selectedSavedBank = savedBanks.find((account) => account.id === state.actionModal.bankAccountId) || savedBanks[0] || null;
    const resolvedBank = state.resolvedBankAccount || (bankMode === "saved" ? selectedSavedBank : null);
    const currency = ["NGN", "USDT"].includes(state.actionModal.currency) ? state.actionModal.currency : "";
    const bankNameAccepted = currency !== "NGN" || isBankAccountNameAccepted(resolvedBank);
    const selectedBankCode = state.actionModal.bankCode || resolvedBank?.bankCode || savedBank.bankCode || "";
    const bankOptions = (state.paymentBanks || [])
      .map((bank) => `<option value="${escapeHtml(bank.code)}" ${selectedBankCode === bank.code ? "selected" : ""}>${escapeHtml(bank.name)}</option>`)
      .join("");
    const liveBalance = state.financialDashboard?.totalBalance || {};
    const liveAvailableUsdt = Number(liveBalance.liveUsdt || liveBalance.usdt || usdtWallet?.availableBalance || 0);
    const liveAvailableNgn = Number(liveBalance.liveNgnEquivalent || liveBalance.ngnEquivalent || ngnWallet?.availableBalance || 0);
    const minWithdrawalNgn = withdrawalSettings.minNgn || "500";
    const minWithdrawalUsdt = withdrawalSettings.minUsdt || "50";
    const ngnWithdrawalFee = withdrawalSettings.ngnFee || "100";
    const currencyLabel = currency === "NGN" ? "Naira" : currency;
    const title = isGiftRedeem ? "Redeem Gift Card" : isDeposit ? "Deposit" : "Withdraw";
    const eyebrow = isDeposit ? "Wallet" : "Cashout";
    const buttonLabel = isGiftRedeem ? "Redeem" : isDeposit ? "Submit deposit" : "Submit withdrawal";
    const note = isGiftRedeem
      ? "Enter 14 digits."
      : !currency
      ? "Choose currency."
      : isDeposit
        ? currency === "NGN"
          ? rate
            ? `Rate: ${formatNaira(rate)} / USDT.`
            : "Admin confirms Naira deposits."
          : `Network: ${depositSettings.usdtNetwork || "USDT"}.`
        : currency === "NGN"
          ? `Available ${formatNaira(liveAvailableNgn)} | Min ${formatNaira(minWithdrawalNgn)} | Fee ${formatNaira(ngnWithdrawalFee)}`
          : `Available: ${formatUsdtUnit(liveAvailableUsdt)} | Min ${formatUsdtUnit(minWithdrawalUsdt)}.`;
    const amountField = (label, step, min = "0") => `
      <label class="stack-label wallet-amount-field">
        <span>${label}</span>
        <input id="wallet-amount-input" class="wallet-amount-input" type="number" min="${min}" step="${step}" placeholder="${min === "0" ? "0.00" : min}" />
      </label>
      <p class="wallet-equivalent-preview" id="wallet-equivalent-preview">Equivalent: --</p>
    `;
    const currencyChoices = `
      <div class="wallet-choice-row" role="group" aria-label="${isDeposit ? "Deposit" : "Withdrawal"} currency">
        <button class="wallet-choice ${currency === "NGN" ? "active" : ""}" data-wallet-currency="NGN" type="button">Naira</button>
        <button class="wallet-choice ${currency === "USDT" ? "active" : ""}" data-wallet-currency="USDT" type="button">USDT</button>
      </div>
    `;
    const depositModeSwitch = isDeposit
      ? `
        <div class="wallet-choice-row">
          <button class="wallet-choice ${!isGiftRedeem ? "active" : ""}" id="wallet-manual-deposit-btn" type="button">Deposit</button>
          <button class="wallet-choice ${isGiftRedeem ? "active" : ""}" id="wallet-gift-redeem-btn" type="button">${icon("gift")} Gift Card</button>
        </div>
      `
      : "";
    const bankDetails = `
      <div class="wallet-instructions">
        <span>Bank</span>
        <strong>${escapeHtml(depositSettings.bankName || "Bank not configured")}</strong>
        <span>Account</span>
        <div class="copy-value-row">
          <code>${escapeHtml(depositSettings.accountNumber || "Not configured")}</code>
          ${renderCopyButton(depositSettings.accountNumber, "Copy account number")}
        </div>
        <span>Name</span>
        <strong>${escapeHtml(depositSettings.accountName || "Not configured")}</strong>
        ${depositSettings.bankNote ? `<p>${escapeHtml(depositSettings.bankNote)}</p>` : ""}
      </div>
    `;
    const depositForm = currency === "NGN"
      ? `
        ${bankDetails}
        ${amountField("Amount (Naira)", "1", depositSettings.minNgn || "0")}
        <label class="stack-label">
          <span>Sender name</span>
          <input id="wallet-sender-input" type="text" placeholder="Name on payment" value="${escapeHtml(state.user?.name || "")}" />
        </label>
        <label class="stack-label">
          <span>Reference</span>
          <input id="wallet-reference-input" type="text" placeholder="Payment reference" />
        </label>
      `
      : currency === "USDT"
        ? `
          ${amountField("Amount (USDT)", "0.00000001", depositSettings.minUsdt || "0")}
          <div class="wallet-instructions">
            <span>Send to</span>
            <div class="copy-value-row">
              <code>${escapeHtml(depositSettings.usdtAddress || "Deposit address not configured")}</code>
              ${renderCopyButton(depositSettings.usdtAddress, "Copy wallet address")}
            </div>
            <span>Network</span>
            <strong>${escapeHtml(depositSettings.usdtNetwork || "Not configured")}</strong>
          </div>
          <label class="stack-label">
            <span>Hash</span>
            <input id="wallet-tx-input" type="text" placeholder="Transaction hash" />
          </label>
        `
        : "";
    const savedBankList = savedBanks.length
      ? `
        <div class="saved-bank-list">
          ${savedBanks.map((account) => `
            <div class="saved-bank-row ${account.id === selectedSavedBank?.id ? "active" : ""}">
              <button class="saved-bank-option" data-saved-bank-id="${escapeHtml(account.id || "")}" type="button">
                <span>${escapeHtml(account.bankName || "Bank")}</span>
                <strong>${escapeHtml(account.accountName || "")}</strong>
                <code>${escapeHtml(account.maskedAccountNumber || account.accountNumber || "")}</code>
              </button>
              <button class="icon-btn danger saved-bank-remove" data-saved-bank-remove="${escapeHtml(account.id || "")}" type="button" aria-label="Remove saved account" title="Remove">${icon("trash")}</button>
            </div>
          `).join("")}
        </div>
      `
      : "";
    const selectedSavedBankCard = selectedSavedBank
      ? `
        <div class="wallet-instructions verified-bank-card">
          <span>${escapeHtml(selectedSavedBank.bankName || "Bank")}</span>
          <strong>${escapeHtml(selectedSavedBank.accountName || "")}</strong>
          <code>${escapeHtml(selectedSavedBank.maskedAccountNumber || selectedSavedBank.accountNumber || "")}</code>
          ${renderBankNameWarning(selectedSavedBank)}
        </div>
      `
      : "";
    const newBankForm = `
      ${amountField("Amount (Naira)", "1", minWithdrawalNgn)}
      <label class="stack-label">
        <span>Bank</span>
        <select id="wallet-bank-code-input">
          <option value="">Choose bank</option>
          ${bankOptions}
        </select>
      </label>
      <label class="stack-label">
        <span>Account number</span>
        <input id="wallet-account-input" type="text" inputmode="numeric" maxlength="10" placeholder="10 digits" value="${escapeHtml(bankMode === "new" ? (resolvedBank?.accountNumber || "") : "")}" />
      </label>
      <label class="save-account-row inline-check">
        <input id="wallet-save-bank-input" type="checkbox" checked />
        <span>Save account</span>
      </label>
      <button class="button-secondary shimmer-button wallet-resolve-primary" id="wallet-resolve-bank-btn" type="button">${icon("bank")} Resolve</button>
      ${
        bankMode === "new" && resolvedBank?.verified
          ? `
            <div class="wallet-instructions verified-bank-card">
              <span>${escapeHtml(resolvedBank.bankName || "Bank")}</span>
              <strong>${escapeHtml(resolvedBank.accountName || "")}</strong>
              <code>${escapeHtml(resolvedBank.maskedAccountNumber || resolvedBank.accountNumber || "")}</code>
              ${renderBankNameWarning(resolvedBank)}
            </div>
          `
          : `<p class="muted-copy">Resolve account to continue.</p>`
      }
      ${savedBanks.length ? `<button class="button-ghost compact-link" id="wallet-use-saved-bank-btn" type="button">Use saved account</button>` : ""}
    `;
    const withdrawalForm = currency === "NGN"
      ? bankMode === "saved" && savedBanks.length
        ? `
          ${savedBankList}
          ${selectedSavedBankCard}
          ${amountField("Amount (Naira)", "1", minWithdrawalNgn)}
          <button class="button-ghost compact-link" id="wallet-use-new-bank-btn" type="button">New account</button>
        `
        : newBankForm
      : currency === "USDT"
        ? `
          ${amountField("Amount (USDT)", "0.00000001", minWithdrawalUsdt)}
          <label class="stack-label">
            <span>Wallet address</span>
            <input id="wallet-address-input" type="text" placeholder="USDT address" />
          </label>
          <label class="stack-label">
            <span>Network</span>
            <input id="wallet-network-input" type="text" placeholder="TRC20" value="${escapeHtml(depositSettings.usdtNetwork || "TRC20")}" />
          </label>
        `
        : "";
    const giftRedeemForm = `
      <label class="stack-label wallet-amount-field">
        <span>Card number</span>
        <input id="gift-card-code-input" class="wallet-amount-input gift-card-code-input" type="text" inputmode="numeric" maxlength="17" placeholder="0000 0000 0000 00" />
      </label>
      <p class="wallet-equivalent-preview">One use only</p>
    `;
    const actionFields = isGiftRedeem ? giftRedeemForm : isDeposit ? depositForm : withdrawalForm;
    const canSubmit = isGiftRedeem || !!currency;
    const submitDisabled = !isGiftRedeem && !isDeposit && currency === "NGN" && !bankNameAccepted;
    const submitTitle = submitDisabled ? "Resolve a matching bank account first" : buttonLabel;
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">${eyebrow}</p>
          <h3>${currencyLabel ? `${title} ${currencyLabel}` : title}</h3>
          <p class="modal-text">${note}</p>
          ${depositModeSwitch}
          ${isGiftRedeem ? "" : currencyChoices}
          <div class="stack-form wallet-action-fields">
            ${actionFields}
          </div>
          ${
            canSubmit
              ? `
                <div class="modal-actions">
                  <button class="button-secondary" id="action-modal-cancel-btn" type="button">Cancel</button>
                  <button class="button-primary shimmer-button" id="wallet-submit-btn" data-wallet-mode="${isGiftRedeem ? "gift-card" : state.actionModal.type}" data-wallet-currency-selected="${currency}" type="button" title="${escapeHtml(submitTitle)}" ${submitDisabled ? "disabled" : ""}>${buttonLabel}</button>
                </div>
              `
              : ""
          }
        </div>
      </div>
    `;
  }

  const trade = state.trades.find((item) => item.id === state.actionModal.tradeId);
  if (!trade) {
    return "";
  }

  if (state.actionModal.type === "stop-investment") {
    const investment = trade.userInvestment || {};
    const amountUsdt = Number(investment.amountUsdt || 0);
    const pnlPercent = getUserInvestmentPnlPercent(trade);
    const pnlValue = getTradePnlValue(trade);
    const currentValue = Math.max(amountUsdt + pnlValue, 0);
    const currentPrice = Number(getTradeCurrentMarket(trade.symbol)?.price || 0);
    const pnlTone = pnlValue >= 0 ? "positive" : "negative";
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Stop Trade</p>
          <h3>Are you sure you want to stop this trade?</h3>
          <div class="action-metric-stack">
            <div class="action-metric">
              <span>Coin</span>
              <strong>${escapeHtml(trade.symbol || "Trade")}</strong>
            </div>
            <div class="action-metric">
              <span>Joined amount</span>
              <strong>${formatUsdtUnit(amountUsdt)}</strong>
            </div>
            <div class="action-metric">
              <span>Estimated value</span>
              <strong>${formatUsdtUnit(currentValue)}</strong>
            </div>
            <div class="action-metric">
              <span>Current price</span>
              <strong>${currentPrice ? formatNumber(currentPrice, 8) : "-"}</strong>
            </div>
            <div class="action-metric">
              <span>Estimated P&L</span>
              <strong class="${pnlTone}">${pnlValue >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(pnlValue))} (${pnlPercent >= 0 ? "+" : ""}${formatNumber(pnlPercent, 2)}%)</strong>
            </div>
          </div>
          <p class="modal-text">Stopping cancels this trade only for you. It stays active for other joined users and admin until they close or stop their own connection.</p>
          <div class="modal-actions">
            <button class="button-secondary" id="action-modal-cancel-btn" type="button">No</button>
            <button class="button-primary shimmer-button danger-action" id="confirm-stop-investment-btn" data-trade-id="${escapeHtml(trade.id || "")}" type="button">Yes, stop trade</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "sell") {
    const pnlPercent = getTradePnlPercent(trade);
    const pnlValue = getTradePnlValue(trade);
    const preview = state.actionModal.preview || null;
    const currentValue = Number(preview?.estimatedUsdt || getTradeCurrentValue(trade));
    const currentPrice = Number(preview?.currentPrice || getTradeCurrentMarket(trade.symbol)?.price || 0);
    const quantityText = preview?.quantity ? `${formatNumber(preview.quantity, 8)} ${preview.baseAsset || ""}`.trim() : "";
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Close Trade</p>
          <h3>Are you sure you want to close this trade?</h3>
          <div class="action-metric-stack">
            <div class="action-metric">
              <span>Pair</span>
              <strong>${trade.symbol}</strong>
            </div>
            <div class="action-metric">
              <span>Current trade value</span>
              <strong>${formatUsdtUnit(currentValue)}</strong>
            </div>
            ${
              quantityText
                ? `
                  <div class="action-metric">
                    <span>Max sell quantity</span>
                    <strong>${quantityText}</strong>
                  </div>
                `
                : ""
            }
            <div class="action-metric">
              <span>Current market price</span>
              <strong>${currentPrice ? formatNumber(currentPrice, 8) : "-"}</strong>
            </div>
            <div class="action-metric">
              <span>Current profit / loss</span>
              <strong class="${pnlPercent >= 0 ? "positive" : "negative"}">${pnlPercent >= 0 ? "+" : ""}${formatNumber(pnlPercent, 2)}%</strong>
            </div>
            <div class="action-metric">
              <span>Profit / loss in USDT</span>
              <strong class="${pnlValue >= 0 ? "positive" : "negative"}">${pnlValue >= 0 ? "+" : ""}${formatUsdtUnit(Math.abs(pnlValue))}</strong>
            </div>
          </div>
          <p class="modal-text">If you agree, the app will cancel any active take-profit order and sell all available ${preview?.baseAsset || trade.symbol.replace(/USDT$/, "")} into USDT at market price.</p>
          <div class="modal-actions">
            <button class="button-secondary" id="action-modal-cancel-btn" type="button">No</button>
            <button class="button-primary shimmer-button" id="confirm-sell-btn" data-trade-id="${trade.id}" type="button">Yes, close trade</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.actionModal.type === "tp") {
    const currentPrice = Number(getTradeCurrentMarket(trade.symbol)?.price || 0);
    const entryPrice = getTradeEntryPrice(trade);
    const targetPrice = state.actionModal.targetPrice || trade.takeProfitTargetPrice || "";
    const pnlPercent = getTradeTpPnlPercent(trade, targetPrice);
    const pnlValue = getTradeTpPnlValue(trade, targetPrice);
    return `
      <div class="modal-backdrop">
        <div class="modal-card action-modal-card">
          <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
          <p class="modal-eyebrow neutral">Take Profit</p>
          <h3>Update ${trade.symbol} TP</h3>
          <div class="action-metric-stack">
            <div class="action-metric">
              <span>Entry price</span>
              <strong>${entryPrice ? formatNumber(entryPrice, 8) : "Market"}</strong>
            </div>
            <div class="action-metric">
              <span>Current market price</span>
              <strong>${currentPrice ? formatNumber(currentPrice, 8) : "-"}</strong>
            </div>
          </div>
          <label class="stack-label">
            <span>TP target price</span>
            <input id="tp-modal-input" value="${targetPrice}" placeholder="Set take-profit price" inputmode="decimal" />
          </label>
          <div class="tp-preview-card">
            <p class="muted-copy">Estimated return at target</p>
            <strong id="tp-modal-preview" class="${pnlPercent >= 0 ? "positive" : "negative"}">${pnlPercent >= 0 ? "+" : ""}${formatNumber(pnlPercent, 2)}%</strong>
            <p id="tp-modal-preview-usdt" class="muted-copy ${pnlValue >= 0 ? "positive" : "negative"}">${pnlValue >= 0 ? "+" : ""}${formatUsdtUnit(Math.abs(pnlValue))}</p>
          </div>
          <p class="modal-text">This updates the stored TP target and replaces the active exchange TP order with the new value when the trade is open.</p>
          <div class="modal-actions">
            <button class="button-secondary" id="action-modal-cancel-btn" type="button">Cancel</button>
            <button class="button-primary shimmer-button" id="confirm-tp-btn" data-trade-id="${trade.id}" type="button">Save TP</button>
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

function renderLoader() {
  if (!state.isLoading) {
    return "";
  }
  return `
    <div class="loader-backdrop">
      <div class="loader-card">
        <div class="loader-orbit">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>Loading dashboard...</p>
      </div>
    </div>
  `;
}

function startSplashSequence(force = false) {
  clearTimeout(startSplashSequence.timeoutId);
  if (state.hasShownSplash && !force) {
    state.showSplash = false;
    render();
    return;
  }

  state.showSplash = true;
  render();
  startSplashSequence.timeoutId = setTimeout(() => {
    state.showSplash = false;
    state.hasShownSplash = true;
    render();
  }, 2600);
}

function renderAuthPane() {
  if (state.authTab === "register") {
    const referralCode = getPendingReferralCode();
    return `
      <form id="register-form" class="auth-form">
        ${referralCode ? `<div class="referral-signup-note">${icon("gift")} Referral code applied</div>` : ""}
        <input type="hidden" name="referralCode" value="${escapeHtml(referralCode)}" />
        <div class="auth-name-grid">
          <label>First name <input name="firstName" placeholder="First name" autocomplete="given-name" required /></label>
          <label>Last name <input name="lastName" placeholder="Last name" autocomplete="family-name" required /></label>
        </div>
        <label>Email <input name="email" type="email" placeholder="Email address" autocomplete="email" required /></label>
        ${renderPasswordField({
          label: "Password",
          name: "password",
          placeholder: "Create password",
          autocomplete: "new-password",
        })}
        <label>Sign up as
          <select name="role">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button class="button-primary shimmer-button" type="submit">Create account</button>
      </form>
      <p class="auth-footnote">Already a user? <button class="text-link inline-link" data-auth-mode="login" type="button">Sign in</button></p>
    `;
  }

  return `
    <form id="login-form" class="auth-form">
      <label>Email <input name="email" type="email" placeholder="Email address" autocomplete="email" required /></label>
      ${renderPasswordField({
        label: "Password",
        name: "password",
        placeholder: "Your password",
        autocomplete: "current-password",
      })}
      <label>Sign in as
        <select name="role">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label class="check-row auth-check"><input name="remember" type="checkbox" /> <span>Remember me</span></label>
      <button class="button-primary shimmer-button" type="submit">Sign in</button>
    </form>
    <p class="auth-footnote">Not a user? <button class="text-link inline-link" data-auth-mode="register" type="button">Signup</button></p>
  `;
}

function renderSplashScreen() {
  return `
    <section class="splash-screen">
      <div class="splash-aura splash-aura-one"></div>
      <div class="splash-aura splash-aura-two"></div>
      <div class="splash-logo-shell">
        <img class="splash-logo" src="/netruefi-logo.png" alt="NetrueFi logo" />
      </div>
      <div class="splash-copy">
        <p class="eyebrow">NetrueFi</p>
        <h2>Smart trading starts here</h2>
        <p class="muted-copy">Loading your secure trading gateway...</p>
      </div>
    </section>
  `;
}

function renderAuthLanding() {
  const isRegister = state.authTab === "register";
  return `
    <section class="auth-landing">
      <section class="auth-shell-card">
        <div class="auth-brand-block">
          <img class="auth-brand-logo" src="/netruefi-logo.png" alt="NetrueFi logo" />
          <div>
            <p class="eyebrow">NetrueFi</p>
            <h2>${isRegister ? "Create account" : "Welcome back"}</h2>
            <p class="muted-copy">${isRegister ? "Choose the account type you are requesting." : "Sign in with your account details."}</p>
          </div>
        </div>
        ${renderAuthPane()}
      </section>
    </section>
  `;
}

function renderLanding() {
  captureFormDrafts();
  app.innerHTML = `
    ${renderAuthLanding()}
    ${renderNotice()}
    ${renderErrorModal()}
    ${renderActionModal()}
    ${renderLoader()}
  `;
  restoreFormDrafts();
  bindFormDraftCapture();

  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.authTab = button.dataset.authTab;
      render();
    });
  });

  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.authTab = button.dataset.authMode === "register" ? "register" : "login";
      render();
    });
  });

  bindAuthForms();
  bindModalActions();
}

function renderTopbarActions() {
  const topbar = document.querySelector(".topbar");
  document.body.dataset.appShell = state.user ? "dashboard" : "guest";

  if (topbar) {
    topbar.style.display = "none";
  }
  topbarActions.innerHTML = "";
}

function bindModalActions() {
  const closeButton = document.getElementById("modal-close-btn");
  if (closeButton) {
    closeButton.addEventListener("click", clearError);
  }

  const actionCloseButton = document.getElementById("action-modal-close-btn");
  if (actionCloseButton) {
    actionCloseButton.addEventListener("click", clearActionModal);
  }

  const actionCancelButton = document.getElementById("action-modal-cancel-btn");
  if (actionCancelButton) {
    actionCancelButton.addEventListener("click", clearActionModal);
  }

  const blockedSignalButton = document.getElementById("withdraw-blocked-signal-btn");
  if (blockedSignalButton) {
    blockedSignalButton.addEventListener("click", () => {
      state.actionModal = null;
      state.activeTab = "signals";
      render();
    });
  }

  const adminUsersList = document.querySelector(".admin-users-modal-list");
  if (adminUsersList) {
    adminUsersList.addEventListener("scroll", () => {
      state.adminUsersModalScrollTop = adminUsersList.scrollTop;
    });
  }

  const adminUserSearchInput = document.getElementById("admin-user-search-input");
  if (adminUserSearchInput) {
    adminUserSearchInput.addEventListener("input", () => {
      state.adminUserSearch = adminUserSearchInput.value;
      state.adminUsersModalScrollTop = 0;
      if (adminUsersList) {
        adminUsersList.scrollTop = 0;
      }
      render();
    });
  }

  const notificationReplyForm = document.getElementById("notification-reply-form");
  if (notificationReplyForm) {
    notificationReplyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitNotificationReply(notificationReplyForm);
    });
  }

  const adminUserProfileForm = document.getElementById("admin-user-profile-form");
  if (adminUserProfileForm) {
    adminUserProfileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminProfileUpdate(adminUserProfileForm, adminUserProfileForm.dataset.adminProfileForm);
    });
  }

  const withdrawalSupportForm = document.getElementById("withdrawal-support-message-form");
  if (withdrawalSupportForm) {
    withdrawalSupportForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(withdrawalSupportForm).entries());
      await withLoading(async () => {
        await api("/api/support/messages", {
          method: "POST",
          body: JSON.stringify({
            title: "Withdrawal account review",
            message: data.message || "",
          }),
        });
        clearFormDraft(withdrawalSupportForm);
        clearActionModal();
        showNotice("Message sent to admin");
      }).catch((error) => showError(error.message));
    });
  }

  document.querySelectorAll("[data-open-withdrawal-support]").forEach((button) => {
    button.addEventListener("click", () => {
      state.actionModal = {
        type: "withdrawal-support",
        message: button.dataset.openWithdrawalSupport || "",
      };
      render();
    });
  });

  if (state.actionModal?.type === "signal-chart" && state.actionModal.chartPayload && window.SignalPage?.mountSignalChart) {
    window.SignalPage.mountSignalChart({
      payload: state.actionModal.chartPayload,
      theme: state.theme,
    });
    startSignalChartRefreshTimer();
  }

  const confirmSellButton = document.getElementById("confirm-sell-btn");
  if (confirmSellButton) {
    confirmSellButton.addEventListener("click", () => confirmMarketSell(confirmSellButton.dataset.tradeId));
  }

  const confirmStopInvestmentButton = document.getElementById("confirm-stop-investment-btn");
  if (confirmStopInvestmentButton) {
    confirmStopInvestmentButton.addEventListener("click", () => stopJoinedTrade(confirmStopInvestmentButton.dataset.tradeId));
  }

  const confirmTpButton = document.getElementById("confirm-tp-btn");
  if (confirmTpButton) {
    confirmTpButton.addEventListener("click", () => confirmTakeProfit(confirmTpButton.dataset.tradeId));
  }

  const tpInput = document.getElementById("tp-modal-input");
  if (tpInput) {
    tpInput.addEventListener("input", () => {
      const trade = state.trades.find((item) => item.id === state.actionModal?.tradeId);
      if (!trade) {
        return;
      }
      state.actionModal = {
        ...state.actionModal,
        targetPrice: tpInput.value,
      };
      const preview = document.getElementById("tp-modal-preview");
      const previewUsdt = document.getElementById("tp-modal-preview-usdt");
      if (preview) {
        const pnlPercent = getTradeTpPnlPercent(trade, tpInput.value);
        preview.textContent = `${pnlPercent >= 0 ? "+" : ""}${formatNumber(pnlPercent, 2)}%`;
        preview.classList.toggle("positive", pnlPercent >= 0);
        preview.classList.toggle("negative", pnlPercent < 0);
      }
      if (previewUsdt) {
        const pnlValue = getTradeTpPnlValue(trade, tpInput.value);
        previewUsdt.textContent = `${pnlValue >= 0 ? "+" : ""}${formatUsdtUnit(Math.abs(pnlValue))}`;
        previewUsdt.classList.toggle("positive", pnlValue >= 0);
        previewUsdt.classList.toggle("negative", pnlValue < 0);
      }
    });
  }
}

function bindPasswordVisibilityToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.closest(".password-field")?.querySelector("input");
      if (!input) {
        return;
      }
      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";
      button.innerHTML = icon(shouldShow ? "eyeOff" : "eye");
      button.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
      button.setAttribute("title", shouldShow ? "Hide password" : "Show password");
    });
  });
}

function bindAuthForms() {
  bindPasswordVisibilityToggles();

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await withLoading(async () => {
        const payload = Object.fromEntries(new FormData(loginForm).entries());
        const result = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setAuthSessionToken(result.sessionToken);
        state.user = normalizeUserPayload(result.user || await requireSessionUser());
        setSelectedExchange(state.user.activeExchange || "bybit");
        state.activeTab = "home";
        if (window.history?.replaceState) {
          window.history.replaceState({}, "", getTabRoute("home"));
        }
        await loadDashboardData();
        clearFormDraft(loginForm);
        showNotice(`Welcome back, ${state.user.name}`);
      }).catch((error) => showError(error.message));
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await withLoading(async () => {
        const payload = Object.fromEntries(new FormData(registerForm).entries());
        payload.name = `${payload.firstName || ""} ${payload.lastName || ""}`.replace(/\s+/g, " ").trim();
        payload.referralCode = payload.referralCode || getPendingReferralCode();
        const result = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setAuthSessionToken(result.sessionToken);
        state.user = normalizeUserPayload(result.user || await requireSessionUser());
        setSelectedExchange(state.user.activeExchange || "bybit");
        state.activeTab = "home";
        if (window.history?.replaceState) {
          window.history.replaceState({}, "", getTabRoute("home"));
        }
        await loadDashboardData();
        clearFormDraft(registerForm);
        clearPendingReferralCode();
        showNotice("Account created");
      }).catch((error) => showError(error.message));
    });
  }
}

function refreshWatchlistDom() {
  document.querySelectorAll("[data-watch-symbol]").forEach((row) => {
    const symbol = row.dataset.watchSymbol;
    const live = getSymbolData(symbol);
    const priceNode = row.querySelector("[data-watch-price]");
    const changeNode = row.querySelector("[data-watch-change]");
    if (priceNode) {
      priceNode.textContent = formatNumber(live.price, 8);
    }
    if (changeNode) {
      const positive = Number(live.changePercent || 0) >= 0;
      changeNode.textContent = `${positive ? "+" : ""}${formatNumber(live.changePercent, 2)}%`;
      changeNode.classList.toggle("positive", positive);
      changeNode.classList.toggle("negative", !positive);
    }
  });
}

function refreshAiSignalDom() {
  const host = document.querySelector("[data-ai-signal-host]");
  if (host) {
    host.innerHTML = renderAiSignalCard();
  }
  bindSignalCardActions();
}

function refreshSignalChartDom() {
  const host = document.querySelector("[data-signal-chart-host]");
  if (host) {
    host.innerHTML = renderSignalChartSection();
  }
  bindSignalChartActions();
}

async function loadSignalChart(symbol, options = {}) {
  const nextSymbol = String(symbol || "").trim().toUpperCase();
  if (!nextSymbol) {
    return;
  }

  if (!options.silent) {
    state.signalChart = {
      ...state.signalChart,
      symbol: nextSymbol,
      loading: true,
    };
    refreshSignalChartDom();
  }

  try {
    const payload = await api(
      `/api/market/chart?symbol=${encodeURIComponent(nextSymbol)}&interval=${encodeURIComponent(
        state.signalChart.interval || "15m"
      )}&limit=48`
    );
    const nextCandles = payload.candles || [];
    state.signalChart = {
      ...state.signalChart,
      symbol: nextSymbol,
      candles: nextCandles,
      guidePrice: Number(state.signalChart.guidePrice || 0) > 0 ? Number(state.signalChart.guidePrice) : getSignalGuidePrice(nextCandles),
      loading: false,
    };
  } catch {
    state.signalChart = {
      ...state.signalChart,
      symbol: nextSymbol,
      candles: [],
      guidePrice: null,
      loading: false,
    };
  }

  refreshSignalChartDom();
}

function bindSignalCardActions() {
  document.querySelectorAll("[data-signal-symbol]").forEach((button) => {
    button.onclick = () => {
      void loadSignalChart(button.dataset.signalSymbol);
    };
  });
}

function updateSignalGuideLine(price) {
  const chart = document.querySelector("[data-signal-chart-svg]");
  const line = document.querySelector("[data-signal-guide-line]");
  const pill = document.querySelector("[data-signal-guide-pill]");
  const current = document.querySelector("[data-signal-guide-price]");
  const guideChip = document.querySelector("[data-signal-guide-current]");
  const candles = state.signalChart.candles || [];
  if (!chart || !line || !pill || !current || !guideChip || !candles.length) {
    return;
  }

  const geometry = getSignalChartGeometry(candles);
  const clampedPrice = clampNumber(Number(price || 0), geometry.minPrice, geometry.maxPrice);
  const y = geometry.toY(clampedPrice);
  line.setAttribute("y1", y.toFixed(2));
  line.setAttribute("y2", y.toFixed(2));
  pill.setAttribute("y", Math.max(y - 10, 8).toFixed(2));
  current.textContent = formatNumber(clampedPrice, 8);
  guideChip.textContent = formatNumber(clampedPrice, 8);
  state.signalChart = {
    ...state.signalChart,
    guidePrice: clampedPrice,
  };
}

function bindSignalChartActions() {
  document.querySelectorAll("[data-signal-interval]").forEach((button) => {
    button.onclick = () => {
      const interval = button.dataset.signalInterval;
      if (!interval || interval === state.signalChart.interval) {
        return;
      }
      state.signalChart = {
        ...state.signalChart,
        interval,
      };
      refreshSignalChartDom();
      const symbol = getSelectedSignalSymbol();
      if (symbol) {
        void loadSignalChart(symbol);
      }
    };
  });

  document.querySelectorAll("[data-signal-chart-type]").forEach((button) => {
    button.onclick = () => {
      const chartType = button.dataset.signalChartType;
      if (!chartType || chartType === state.signalChart.chartType) {
        return;
      }
      state.signalChart = {
        ...state.signalChart,
        chartType,
      };
      refreshSignalChartDom();
    };
  });

  const surface = document.querySelector("[data-signal-drag-surface]");
  const svg = document.querySelector("[data-signal-chart-svg]");
  if (!surface || !svg || !(state.signalChart.candles || []).length) {
    return;
  }

  const updateFromPointer = (clientY) => {
    const rect = svg.getBoundingClientRect();
    if (!rect.height) {
      return;
    }
    const geometry = getSignalChartGeometry(state.signalChart.candles || []);
    const relativeY = clampNumber(((clientY - rect.top) / rect.height) * geometry.height, geometry.padding.top, geometry.height - geometry.padding.bottom);
    const priceRatio = 1 - (relativeY - geometry.padding.top) / geometry.usableHeight;
    const price = geometry.minPrice + priceRatio * (geometry.maxPrice - geometry.minPrice);
    updateSignalGuideLine(price);
  };

  surface.onpointerdown = (event) => {
    event.preventDefault();
    surface.dataset.dragging = "true";
    if (surface.setPointerCapture) {
      surface.setPointerCapture(event.pointerId);
    }
    updateFromPointer(event.clientY);
  };

  surface.onpointermove = (event) => {
    if (surface.dataset.dragging !== "true") {
      return;
    }
    updateFromPointer(event.clientY);
  };

  const stopDragging = () => {
    delete surface.dataset.dragging;
  };

  surface.onpointerup = stopDragging;
  surface.onpointercancel = stopDragging;
  surface.onpointerleave = stopDragging;
}

function refreshTradeDom() {
  document.querySelectorAll("[data-trade-symbol-row]").forEach((row) => {
    const symbol = row.dataset.tradeSymbolRow;
    const entry = Number(row.dataset.tradeEntry || 0);
    const side = row.dataset.tradeSide || "BUY";
    const isStaticPnl = row.dataset.tradePnlStatic === "true";
    const market = getTradeCurrentMarket(symbol);
    const current = Number(market.price || 0);
    const pnlNode = row.querySelector("[data-trade-pnl]");
    const currentNode = row.querySelector("[data-trade-current]");
    const entryNode = row.querySelector("[data-trade-entry]");
    const currentValueNodes = row.querySelectorAll("[data-trade-current-value]");

    if (entryNode) {
      entryNode.textContent = `Entry ${entry ? formatNumber(entry, 8) : "Market"}`;
    }
    if (currentNode) {
      currentNode.textContent = `Current ${current ? formatNumber(current, 8) : "-"}`;
    }
    currentValueNodes.forEach((node) => {
      const quantity = Number(
        row.dataset.tradeQuantity ||
          row.dataset.tradeRemainingQuantity ||
          0
      );
      node.textContent = formatUsdtUnit(quantity * current);
    });
    if (pnlNode && !isStaticPnl) {
      const multiplier = side === "SELL" ? -1 : 1;
      const pnl = entry && current ? ((current - entry) / entry) * 100 * multiplier : 0;
      pnlNode.textContent = `${pnl >= 0 ? "+" : ""}${formatNumber(pnl, 2)}%`;
      pnlNode.classList.toggle("positive", pnl >= 0);
      pnlNode.classList.toggle("negative", pnl < 0);
    }
  });
}

function statusClass(status) {
  const value = String(status || "").toUpperCase();
  if (value === "PENDING") {
    return "status-pending";
  }
  if (value === "OPEN") {
    return "status-open";
  }
  if (value === "CLOSED") {
    return "status-closed";
  }
  if (value === "CANCELLED" || value === "CANCELED") {
    return "status-canceled";
  }
  return "status-neutral";
}

function renderTradeStatusBadge(status) {
  return `<span class="trade-status-badge ${statusClass(status)}">${status}</span>`;
}

function renderExchangeBadge(exchange) {
  const label = getExchangeLabel(exchange);
  return `<span class="exchange-badge exchange-${escapeHtml(exchange)}">${label}</span>`;
}

function renderExchangeBadgeList(exchanges) {
  const badges = exchanges.map((exchange) => renderExchangeBadge(exchange.id || exchange)).join("");
  return badges || `<span class="exchange-badge">No exchange</span>`;
}

function getAdminPasswordDraft(userId) {
  return state.adminPasswordDrafts[userId] || "";
}

function updateUserInStateUsers(nextUser) {
  state.users = state.users.map((user) => (user.id === nextUser.id ? { ...user, ...nextUser } : user));
}

function applyUserFinancePayloadToState(payload = {}) {
  if (!payload.profile?.user?.id) {
    return;
  }
  updateUserInStateUsers({
    id: payload.profile.user.id,
    ledgerWallets: payload.profile.wallets || [],
    recentTransactions: payload.profile.recentTransactions || [],
    ...(payload.financeSummary ? { financeSummary: payload.financeSummary } : {}),
  });
}

async function refreshTradeStatusData() {
  if (!state.user) {
    return;
  }
  try {
    const payload = await api(`/api/trades?exchange=${encodeURIComponent(getActiveExchange())}`);
    const nextTrades = payload.trades || [];
    let nextOpenOrders = [];
    if (state.user.exchangeConnected) {
      const openOrdersPayload = await api(`/api/exchange/open-orders?exchange=${encodeURIComponent(getActiveExchange())}`);
      nextOpenOrders = openOrdersPayload.openOrders || [];
    }
    const tradesChanged = JSON.stringify(nextTrades) !== JSON.stringify(state.trades);
    const openOrdersChanged = JSON.stringify(nextOpenOrders) !== JSON.stringify(state.openOrders);
    state.trades = nextTrades;
    state.openOrders = nextOpenOrders;
    syncHistorySelection();
    const activeTradeIds = new Set(nextTrades.map((trade) => trade.id));
    const activeOpenOrderIds = new Set(nextOpenOrders.map((order) => String(order.orderId)));
    state.expandedTradeIds = state.expandedTradeIds.filter((id) => activeTradeIds.has(id));
    state.expandedPendingOrderIds = state.expandedPendingOrderIds.filter((id) => activeOpenOrderIds.has(id));
    if (tradesChanged || openOrdersChanged) {
      refreshTradeSectionsDom();
    }
  } catch {
    // keep last known trade snapshot
  }
}

function refreshTradeSectionsDom() {
  const homeHost = document.querySelector("[data-home-trades-host]");
  if (homeHost) {
    homeHost.innerHTML = state.user?.role === "user" ? renderHomeOpenTradeSection() : renderOpenOrdersSection();
  }

  const historyHost = document.querySelector("[data-history-host]");
  if (historyHost) {
    historyHost.innerHTML = renderHistoryContent();
  }

  bindTradeActionButtons();
  bindInvestmentTradeActions();
  bindTradeDisclosureToggles();
  bindHistoryActions();
  refreshTradeDom();
}

async function refreshTradeMarketData() {
  if (!state.user) {
    return;
  }
  const symbols = [...new Set([
    ...state.trades.map((trade) => trade.symbol),
    ...(state.openOrders || []).map((order) => order.symbol),
    ...getDetectedSpotHoldings().map((holding) => holding.symbol),
    state.user?.role === "admin" ? String(tradeDraft.symbol || "").trim().toUpperCase() : "",
  ].filter(Boolean))];
  if (!symbols.length) {
    return;
  }

  try {
    const payload = await api(buildMarketPricesPath(symbols));
    state.tradeMarketMap = Object.fromEntries(
      (payload.prices || []).map((item) => [
        item.symbol,
        {
          price: Number(item.price || 0),
          changePercent: Number(item.changePercent || 0),
        },
      ])
    );
    render();
  } catch {
    // keep the current snapshot if the lightweight live refresh fails
  }
}

function normalizeTradeSymbolValue(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function syncMarketBuySpendFromBalance({ force = false } = {}) {
  const summary = getCurrentTradeSummary();
  const available = Number(summary.usdtBalance || 0);
  if (tradeDraft.side !== "BUY" || tradeDraft.type !== "MARKET" || available <= 0) {
    return;
  }
  const currentSpend = Number(tradeDraft.quoteOrderQty || 0);
  if (!force && currentSpend > 0 && currentSpend <= available) {
    return;
  }
  updateTradeDraft({
    quantity: "",
    quoteOrderQty: formatMarketSpendInput(available, { fullBalance: true, quoteAsset: summary.quoteAsset }),
  });
}

function scheduleTradeSymbolMarketRefresh(symbol) {
  clearTimeout(tradeSymbolRefreshTimer);
  const normalizedSymbol = normalizeTradeSymbolValue(symbol);
  if (normalizedSymbol.length < 5) {
    return;
  }
  tradeSymbolRefreshTimer = setTimeout(() => {
    void refreshSingleMarketSymbol(normalizedSymbol, { fillSpend: true, fillPrice: true });
  }, 350);
}

async function refreshSingleMarketSymbol(symbol, { renderAfter = true, fillSpend = false, fillPrice = false, forcePrice = false } = {}) {
  const normalizedSymbol = String(symbol || "").trim().toUpperCase();
  if (!normalizedSymbol) {
    return;
  }
  try {
    const payload = await api(buildMarketPricesPath(normalizedSymbol));
    const price = (payload.prices || [])[0];
    if (!price?.symbol) {
      return;
    }
    state.tradeMarketMap = {
      ...state.tradeMarketMap,
      [price.symbol]: {
        price: Number(price.price || 0),
        changePercent: Number(price.changePercent || 0),
        volume24h: Number(price.volume24h || 0),
        turnover24h: Number(price.turnover24h || 0),
      },
    };
    if (normalizeTradeSymbolValue(tradeDraft.symbol) === price.symbol) {
      const draftPatch = {};
      if (fillPrice && Number(price.price || 0) > 0 && (forcePrice || !tradeDraft.price)) {
        draftPatch.price = String(price.price);
      }
      if (Object.keys(draftPatch).length) {
        updateTradeDraft(draftPatch);
      }
      if (fillSpend) {
        syncMarketBuySpendFromBalance({ force: true });
      }
    }
    if (renderAfter) {
      render();
    }
  } catch {
    // The backend validates the symbol again when the trade is submitted.
  }
}

function connectWatchSocket() {
  disconnectWatchSocket();
  hydrateWatchlistFromSeed();
  refreshWatchlistDom();
  state.socketRefreshTimer = setInterval(() => {
    if (!shouldRefreshWatchlistLive()) {
      return;
    }
    void refreshWatchlistFeed();
  }, WATCHLIST_REFRESH_INTERVAL_MS);
}

function disconnectWatchSocket() {
  clearInterval(state.socketRefreshTimer);
  state.socketRefreshTimer = null;
}

function startTradeRefreshTimer() {
  clearInterval(state.tradeRefreshTimer);
  const refreshIntervalMs = isFuturesMode() ? FUTURES_REFRESH_INTERVAL_MS : TRADE_REFRESH_INTERVAL_MS;
  state.tradeRefreshTimer = setInterval(() => {
    if (!shouldRefreshTradeLive()) {
      return;
    }
    void refreshDashboardLiveData();
  }, refreshIntervalMs);
}

function stopTradeRefreshTimer() {
  clearInterval(state.tradeRefreshTimer);
  state.tradeRefreshTimer = null;
}

async function loadWatchlistSeed() {
  try {
    const payload = await api(`/api/market/watchlist?exchange=${encodeURIComponent(getActiveExchange())}`);
    state.watchlistSeed = (payload.watchlist || []).map((item) => ({
      ...item,
      changePercent: Number(item.changePercent ?? item.priceChangePercent ?? 0),
      price: Number(item.price || 0),
      volume24h: Number(item.volume24h || 0),
      turnover24h: Number(item.turnover24h || 0),
      bybitAiInsight: item.bybitAiInsight || "",
      bybitAiSource: item.bybitAiSource || "",
    }));
  } catch {
    state.watchlistSeed = [];
  }
}

async function loadSpotSymbols({ force = false } = {}) {
  if (!state.user || state.user.role !== "admin") {
    state.spotSymbols = [];
    state.spotSymbolsLoadedAt = 0;
    return [];
  }
  const isFresh = state.spotSymbols.length && Date.now() - Number(state.spotSymbolsLoadedAt || 0) < 10 * 60 * 1000;
  if (!force && isFresh) {
    return state.spotSymbols;
  }
  const payload = await api(`/api/market/symbols?exchange=${encodeURIComponent(getActiveExchange())}`);
  state.spotSymbols = (payload.symbols || [])
    .map((item) => String(item.symbol || "").trim().toUpperCase())
    .filter(Boolean);
  state.spotSymbolsLoadedAt = Date.now();
  return state.spotSymbols;
}

function hydrateWatchlistFromSeed() {
  state.liveMap = Object.fromEntries(
    (state.watchlistSeed || []).map((item) => [
      item.symbol,
      {
        price: Number(item.price || 0),
        changePercent: Number(item.changePercent ?? item.priceChangePercent ?? 0),
        volume24h: Number(item.volume24h || 0),
        turnover24h: Number(item.turnover24h || 0),
      },
    ])
  );
}

async function refreshWatchlistFeed() {
  if (watchlistRefreshPromise) {
    return watchlistRefreshPromise;
  }

  if (!state.watchlistSeed.length) {
    state.loadingWatchlist = true;
    render();
  }

  watchlistRefreshPromise = loadWatchlistSeed()
    .then(() => {
      hydrateWatchlistFromSeed();
      refreshWatchlistDom();
      refreshAiSignalDom();
      const signalSymbol = getSelectedSignalSymbol();
      if (signalSymbol) {
        return loadSignalChart(signalSymbol, { silent: true });
      }
    })
    .catch(() => {
      state.watchlistSeed = [];
      hydrateWatchlistFromSeed();
      refreshWatchlistDom();
      refreshAiSignalDom();
      refreshSignalChartDom();
    })
    .finally(() => {
      const shouldRender = state.loadingWatchlist;
      state.loadingWatchlist = false;
      if (shouldRender) {
        render();
      }
      watchlistRefreshPromise = null;
    });

  return watchlistRefreshPromise;
}

async function refreshDashboardLiveData() {
  if (tradeRefreshPromise) {
    return tradeRefreshPromise;
  }

  const refreshTasks = isFuturesMode()
    ? [loadFuturesDashboard()]
    : state.user?.role === "admin"
      ? [
          loadFinancialDashboard(),
          loadAdminFinanceQueues(),
          api("/api/admin/users").then((payload) => {
            state.users = payload.users || [];
          }),
          refreshTradeStatusData(),
          refreshTradeMarketData(),
        ]
      : [refreshTradeMarketData(), refreshTradeStatusData(), loadFinancialDashboard()];
  tradeRefreshPromise = Promise.allSettled(refreshTasks).finally(() => {
    tradeRefreshPromise = null;
    if (state.activeTab === "settings") {
      refreshSettingsPaneDom();
    } else {
      render();
    }
  });

  return tradeRefreshPromise;
}

function applyAccountSnapshot(account) {
  if (account) {
    state.balances = account.balances || [];
    state.openOrders = account.openOrders || [];
    state.totalUsdt = Number(account.totalUsdt || 0);
    state.previousTotalUsdt = Number(account.previousTotalUsdt || 0);
    state.totalNgn = Number(account.totalNgn || 0);
    state.accountTotalAvailableBalance = Number(account.accountTotalAvailableBalance || account.availableBalance || 0);
    state.usdtNgnRate = Number(account.usdtNgnRate || 0);
    state.todayPnlValue = Number(account.todayPnlValue || 0);
    state.todayPnlPercent = Number(account.todayPnlPercent || 0);
    state.todayLabel = String(account.todayLabel || "");
    state.monthPnlValue = Number(account.monthPnlValue || 0);
    state.monthPnlPercent = Number(account.monthPnlPercent || 0);
    state.monthLabel = String(account.monthLabel || "");
    state.estimatedPnlValue = Number(account.estimatedPnlValue || 0);
    state.estimatedPnlPercent = Number(account.estimatedPnlPercent || 0);
    return;
  }

  state.balances = [];
  state.openOrders = [];
  state.totalUsdt = 0;
  state.previousTotalUsdt = 0;
  state.totalNgn = 0;
  state.accountTotalAvailableBalance = 0;
  state.usdtNgnRate = 0;
  state.todayPnlValue = 0;
  state.todayPnlPercent = 0;
  state.todayLabel = "";
  state.monthPnlValue = 0;
  state.monthPnlPercent = 0;
  state.monthLabel = "";
  state.estimatedPnlValue = 0;
  state.estimatedPnlPercent = 0;
}

function normalizeSignalAutoTradePayload(payload = {}) {
  const settings = payload.settings || {};
  const runtime = payload.runtime || {};
  return {
    settings: {
      enabled: !!settings.enabled,
      firstTradeBalancePercent: Number(settings.firstTradeBalancePercent || 50),
      secondTradeBalancePercent: Number(settings.secondTradeBalancePercent || 100),
      maxSimultaneousTrades: Number(settings.maxSimultaneousTrades || 2),
    },
    runtime: {
      exchange: String(runtime.exchange || "bybit"),
      activeTrades: Number(runtime.activeTrades || 0),
      remainingSlots: Number(runtime.remainingSlots || 0),
      nextAllocationPercent: Number(runtime.nextAllocationPercent || 0),
    },
    loaded: true,
  };
}

function getCachedAccountSnapshot(exchange = getActiveExchange()) {
  if (!state.user) {
    return null;
  }

  const snapshots = state.user.cachedAccountSnapshots || {};
  return snapshots[exchange] || state.user.cachedAccountSnapshot || null;
}

async function loadSavedExchangeSettings(exchange) {
  const targetExchange = exchange || getActiveExchange();
  if (!state.user) {
    state.settingsDraft = {
      apiKey: "",
      apiSecret: "",
      testnet: "false",
    };
    return;
  }

  try {
    const payload = await api(`/api/exchange/settings?exchange=${encodeURIComponent(targetExchange)}`);
    state.settingsDraft = {
      apiKey: payload.apiKey || "",
      apiSecret: payload.apiSecret || "",
      testnet: payload.testnet ? "true" : "false",
    };
  } catch {
    state.settingsDraft = {
      apiKey: "",
      apiSecret: "",
      testnet: "false",
    };
  }
}

async function loadSignalAutoTradeSettings() {
  if (!state.user || state.user.role !== "admin") {
    state.signalAutoTrade = getDefaultSignalAutoTradeState();
    return;
  }

  try {
    const payload = await api("/api/signals/auto-trade");
    state.signalAutoTrade = normalizeSignalAutoTradePayload(payload);
  } catch {
    state.signalAutoTrade = {
      ...getDefaultSignalAutoTradeState(),
      loaded: false,
    };
  }
}

async function loadFuturesDashboard(options = {}) {
  if (!state.user || !canUseFuturesMode()) {
    state.futuresAccount = null;
    state.futuresLastLoadedAt = 0;
    state.futuresError = "";
    state.loadingFutures = false;
    return;
  }

  const force = !!options.force;
  const hasFreshSnapshot =
    state.futuresAccount && Date.now() - Number(state.futuresLastLoadedAt || 0) < FUTURES_REFRESH_INTERVAL_MS;
  if (!force && hasFreshSnapshot) {
    return state.futuresAccount;
  }

  if (futuresRefreshPromise) {
    return futuresRefreshPromise;
  }

  state.loadingFutures = !state.futuresAccount;
  futuresRefreshPromise = api("/api/binance/futures/account")
    .then((account) => {
      state.futuresAccount = account;
      state.futuresLastLoadedAt = Date.now();
      state.futuresError = account.warning || "";
      return account;
    })
    .catch((error) => {
      state.futuresError = error.message || "Unable to refresh Binance futures right now.";
      throw error;
    })
    .finally(() => {
      state.loadingFutures = false;
      futuresRefreshPromise = null;
    });

  return futuresRefreshPromise;
}

async function loadDashboardData() {
  if (!state.user) {
    disconnectWatchSocket();
    disconnectSignalStream();
    disconnectSettingsUsersSocket();
    stopSignalChartRefreshTimer();
    stopTradeRefreshTimer();
    state.loadingWatchlist = false;
    render();
    return;
  }

  updateSignalNotificationPermission();
  void loadPushSettings().catch(() => undefined);
  ensureSignalAudioAutoUnlock();
  scheduleInstallPrompt();
  scheduleNotificationPrompt();
  connectSignalStream();
  if (state.activeTab === "settings") {
    connectSettingsUsersSocket();
  } else {
    disconnectSettingsUsersSocket();
  }
  void loadSignalsSnapshot({ silent: true }).catch(() => {
    updateSignalFeed({
      statusMessage: "Signal snapshot will appear as soon as the stream responds.",
    });
  });

  state.loadingWatchlist = !state.watchlistSeed.length;
  const accountConnected = state.user.role === "admin"
    ? !!(state.user.bybitConnected || state.user.binanceConnected || state.user.exchangeConnected)
    : !!state.user.exchangeConnected;
  state.loadingAccount = !!(accountConnected && !state.balances.length);
  state.loadingTrades = !state.trades.length;
  state.loadingUsers = !!(state.user.role === "admin" && !state.users.length);
  state.loadingFinancial = !state.financialDashboard;
  state.loadingAdminFinance = !!(state.user.role === "admin" && !state.adminDeposits.length && !state.adminWithdrawals.length);
  render();

  const financialPromise = loadFinancialDashboard()
    .then(() => {
      state.loadingFinancial = false;
      render();
    })
    .catch(() => {
      state.loadingFinancial = false;
      render();
    });
  const adminFinancePromise = loadAdminFinanceQueues()
    .then(() => {
      state.loadingAdminFinance = false;
      render();
    })
    .catch(() => {
      state.loadingAdminFinance = false;
      render();
    });
  const questPromise = (state.user.role === "admin" ? loadAdminQuestData() : loadQuestData())
    .then(() => {
      render();
    })
    .catch(() => {
      render();
    });
  const referralPromise = state.user.role === "user"
    ? loadReferralProfile().then(() => render()).catch(() => render())
    : loadAdminReferralData().then(() => render()).catch(() => render());
  const digitalProductsPromise = state.activeTab === "store" && state.user.role === "user"
    ? loadDigitalServiceProducts({ force: true }).then(() => render()).catch(() => render())
    : Promise.resolve();
  const settingsPromise = loadSavedExchangeSettings(getActiveExchange()).then(() => {
    render();
  });
  const paymentBanksPromise = state.activeTab === "settings" || state.actionModal?.type === "withdraw"
    ? loadPaymentBanks().then(() => {
        render();
      }).catch(() => [])
    : Promise.resolve();
  const signalAutoTradePromise = loadSignalAutoTradeSettings().then(() => {
    render();
  });
  const futuresPromise = isFuturesMode()
    ? loadFuturesDashboard()
        .then(() => {
          render();
        })
        .catch((error) => {
          state.loadingFutures = false;
          render();
          showError(error.message);
        })
    : Promise.resolve();
  const watchlistPromise = refreshWatchlistFeed()
    .then(() => {
      connectWatchSocket();
      render();
    })
    .catch(() => {
      state.watchlistSeed = [];
      hydrateWatchlistFromSeed();
      connectWatchSocket();
      render();
    });
  const spotSymbolsPromise = state.user.role === "admin"
    ? loadSpotSymbols()
        .then(() => {
          render();
        })
        .catch(() => {
          state.spotSymbols = [];
        })
    : Promise.resolve();

  const accountRefreshParam = state.user.role === "admin" ? "&refresh=1" : "";
  const accountExchange = state.user.role === "admin" ? getAdminDashboardExchange() : getActiveExchange();
  const cachedSnapshot = getCachedAccountSnapshot(accountExchange);
  applyAccountSnapshot(cachedSnapshot);
  const accountPromise = state.user.role === "admin"
    ? refreshTradingAccountSnapshot({ force: true, silent: true })
        .then(() => {
          state.loadingAccount = false;
          render();
        })
        .catch(() => {
          applyAccountSnapshot(cachedSnapshot);
          state.loadingAccount = false;
          render();
        })
    : accountConnected
    ? api(`/api/exchange/account?exchange=${encodeURIComponent(accountExchange)}${accountRefreshParam}`)
        .then((account) => {
          applyAccountSnapshot(account);
          state.user = {
            ...state.user,
            cachedAccountSnapshot: account,
            cachedAccountSnapshots: {
              ...(state.user.cachedAccountSnapshots || {}),
              [account.exchange || getActiveExchange()]: account,
            },
          };
          state.loadingAccount = false;
          render();
        })
        .catch(() => {
          applyAccountSnapshot(cachedSnapshot);
          state.loadingAccount = false;
          render();
        })
    : Promise.resolve().then(() => {
        state.loadingAccount = false;
      });
  const tradesPromise = api(`/api/trades?exchange=${encodeURIComponent(getActiveExchange())}`);
  const usersPromise = state.user.role === "admin"
    ? api("/api/admin/users")
    : Promise.resolve({ users: [] });

  const [tradesPayload, usersPayload] = await Promise.all([
    tradesPromise,
    usersPromise,
  ]);

  state.trades = tradesPayload.trades || [];
  state.users = usersPayload.users || [];
  state.loadingTrades = false;
  state.loadingUsers = false;
  const adminUserIds = new Set(state.users.map((user) => user.id));
  state.expandedAdminUserIds = state.expandedAdminUserIds.filter((id) => adminUserIds.has(id));
  state.revealedAdminPasswordIds = state.revealedAdminPasswordIds.filter((id) => adminUserIds.has(id));
  syncHistorySelection();
  render();
  if (shouldRefreshTradeLive()) {
    void refreshTradeMarketData();
  }
  startTradeRefreshTimer();
  void accountPromise;
  void settingsPromise;
  void paymentBanksPromise;
  void signalAutoTradePromise;
  void futuresPromise;
  void watchlistPromise;
  void spotSymbolsPromise;
  void financialPromise;
  void adminFinancePromise;
  void questPromise;
  void referralPromise;
  void digitalProductsPromise;
}

function bindHistoryActions() {
  const reportPeriodSelect = document.getElementById("pl-report-period");
  if (reportPeriodSelect) {
    reportPeriodSelect.addEventListener("change", () => {
      state.reportPeriod = reportPeriodSelect.value || "days";
      render();
    });
  }

  const downloadReportButton = document.getElementById("download-pl-report-btn");
  if (downloadReportButton) {
    downloadReportButton.addEventListener("click", downloadProfitLossReport);
  }

  document.querySelectorAll("[data-history-trade-id]").forEach((input) => {
    input.addEventListener("change", () => {
      const tradeId = input.dataset.historyTradeId;
      if (!tradeId) {
        return;
      }

      if (input.checked) {
        if (!state.selectedHistoryTradeIds.includes(tradeId)) {
          state.selectedHistoryTradeIds = [...state.selectedHistoryTradeIds, tradeId];
        }
      } else {
        state.selectedHistoryTradeIds = state.selectedHistoryTradeIds.filter((id) => id !== tradeId);
      }
      render();
    });
  });

  const selectAllButton = document.getElementById("history-select-all-btn");
  if (selectAllButton) {
    selectAllButton.addEventListener("click", () => {
      const trades = getHistoryTrades().filter(isTradeClearableFromHistory);
      const allTradeIds = trades.map((trade) => trade.id);
      const shouldClearSelection = allTradeIds.length && state.selectedHistoryTradeIds.length === allTradeIds.length;
      state.selectedHistoryTradeIds = shouldClearSelection ? [] : allTradeIds;
      render();
    });
  }

  const clearButton = document.getElementById("history-clear-btn");
  if (clearButton) {
    clearButton.addEventListener("click", async () => {
      const tradeIds = [...state.selectedHistoryTradeIds];
      if (!tradeIds.length) {
        showError("Select at least one trade to clear.");
        return;
      }

      const label = tradeIds.length === 1 ? "this trade history item" : `these ${tradeIds.length} trade history items`;
      if (!window.confirm(`Clear ${label}? This removes them from the saved app history.`)) {
        return;
      }

      await withLoading(async () => {
        const result = await api("/api/trades/history/clear", {
          method: "POST",
          body: JSON.stringify({ tradeIds }),
        });
        state.selectedHistoryTradeIds = [];
        await loadDashboardData();
        showNotice(`${result.clearedCount || tradeIds.length} history item${(result.clearedCount || tradeIds.length) === 1 ? "" : "s"} cleared`);
      }).catch((error) => showError(error.message));
    });
  }
}

function bindAdminUserDisclosureToggles() {
  document.querySelectorAll("[data-admin-user-id]").forEach((details) => {
    details.ontoggle = () => {
      const userId = details.dataset.adminUserId;
      if (!userId) {
        return;
      }

      if (details.open) {
        if (!state.expandedAdminUserIds.includes(userId)) {
          state.expandedAdminUserIds = [...state.expandedAdminUserIds, userId];
        }
        return;
      }

      state.expandedAdminUserIds = state.expandedAdminUserIds.filter((id) => id !== userId);
    };
  });
}

function setAdminPasswordDraft(userId, value) {
  state.adminPasswordDrafts = {
    ...state.adminPasswordDrafts,
    [userId]: value,
  };
}

function toggleAdminPasswordVisibility(userId) {
  if (state.revealedAdminPasswordIds.includes(userId)) {
    state.revealedAdminPasswordIds = state.revealedAdminPasswordIds.filter((id) => id !== userId);
  } else {
    state.revealedAdminPasswordIds = [...state.revealedAdminPasswordIds, userId];
  }
  render();
}

async function submitAdminPasswordReset(userId) {
  const password = getAdminPasswordDraft(userId);
  if (!password) {
    showError("Enter a new password for this user.");
    return;
  }

  await withLoading(async () => {
    const payload = await api(`/api/admin/users/${encodeURIComponent(userId)}/password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    updateUserInStateUsers(payload.user);
    setAdminPasswordDraft(userId, "");
    render();
    showNotice("User password updated");
  }).catch((error) => showError(error.message));
}

async function submitAdminEmailUpdate(form, userId) {
  const payload = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    const result = await api(`/api/admin/users/${encodeURIComponent(userId)}/email`, {
      method: "POST",
      body: JSON.stringify({ email: payload.email }),
    });
    updateUserInStateUsers(result.user);
    clearFormDraft(form);
    render();
    showNotice("User email updated");
  }).catch((error) => showError(error.message));
}

async function submitAdminProfileUpdate(form, userId) {
  const payload = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    const nameResult = await api(`/api/admin/users/${encodeURIComponent(userId)}/name`, {
      method: "POST",
      body: JSON.stringify({
        firstName: payload.firstName,
        lastName: payload.lastName,
      }),
    });
    let nextUser = nameResult.user;
    const currentEmail = String(nextUser?.email || "").trim().toLowerCase();
    const nextEmail = String(payload.email || "").trim().toLowerCase();
    if (nextEmail && nextEmail !== currentEmail) {
      const emailResult = await api(`/api/admin/users/${encodeURIComponent(userId)}/email`, {
        method: "POST",
        body: JSON.stringify({ email: payload.email }),
      });
      nextUser = emailResult.user;
    }
    updateUserInStateUsers(nextUser);
    clearFormDraft(form);
    state.actionModal = { type: "admin-users" };
    render();
    showNotice("User profile updated");
  }).catch((error) => showError(error.message));
}

async function updateAdminMirror(userId, enabled) {
  await withLoading(async () => {
    const payload = await api(`/api/admin/users/${encodeURIComponent(userId)}/mirror`, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
    updateUserInStateUsers(payload.user);
    render();
    showNotice(enabled ? "Mirror reconnected for user" : "Mirror disconnected for user");
  }).catch((error) => showError(error.message));
}

async function clearAdminUserReview(userId) {
  await withLoading(async () => {
    const payload = await api(`/api/admin/users/${encodeURIComponent(userId)}/fraud-review/clear`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (payload.user?.id) {
      updateUserInStateUsers(payload.user);
    } else {
      updateUserInStateUsers({ id: userId, fraudReview: payload.fraudReview || { status: "CLEARED" } });
    }
    await loadDashboardData();
    showNotice("Review cleared");
  }).catch((error) => showError(error.message));
}

async function deleteAdminUser(userId, name) {
  if (!window.confirm(`Delete ${name}? This removes the user account and signs the user out everywhere.`)) {
    return;
  }

  await withLoading(async () => {
    await api(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    state.users = state.users.filter((user) => user.id !== userId);
    state.expandedAdminUserIds = state.expandedAdminUserIds.filter((id) => id !== userId);
    const nextDrafts = { ...state.adminPasswordDrafts };
    delete nextDrafts[userId];
    state.adminPasswordDrafts = nextDrafts;
    state.revealedAdminPasswordIds = state.revealedAdminPasswordIds.filter((id) => id !== userId);
    await loadDashboardData();
    showNotice("User deleted");
  }).catch((error) => showError(error.message));
}

async function submitAdminFinanceAction(kind, id) {
  const actionMap = {
    approveDeposit: `/api/admin/deposits/${encodeURIComponent(id)}/approve`,
    rejectDeposit: `/api/admin/deposits/${encodeURIComponent(id)}/reject`,
    approveWithdrawal: `/api/admin/withdrawals/${encodeURIComponent(id)}/approve`,
    processWithdrawal: `/api/admin/withdrawals/${encodeURIComponent(id)}/process`,
    completeWithdrawal: `/api/admin/withdrawals/${encodeURIComponent(id)}/complete`,
    manualWithdrawal: `/api/admin/withdrawals/${encodeURIComponent(id)}/manual-complete`,
    rejectWithdrawal: `/api/admin/withdrawals/${encodeURIComponent(id)}/reject`,
  };
  const endpoint = actionMap[kind];
  if (!endpoint) {
    return;
  }

  await withLoading(async () => {
    const payload = await api(endpoint, {
      method: "POST",
      body: JSON.stringify({}),
    });
    applyUserFinancePayloadToState(payload);
    await Promise.all([loadFinancialDashboard(), loadAdminFinanceQueues()]);
    render();
    showNotice("Finance queue updated");
  }).catch((error) => showError(error.message));
}

async function submitAdminManualWithdrawal(id) {
  const manualReference = document.getElementById("manual-withdrawal-reference-input")?.value?.trim() || state.actionModal?.manualReference || "";
  const adminNote = document.getElementById("manual-withdrawal-note-input")?.value?.trim() || state.actionModal?.adminNote || "";
  await withLoading(async () => {
    const payload = await api(`/api/admin/withdrawals/${encodeURIComponent(id)}/manual-complete`, {
      method: "POST",
      body: JSON.stringify({
        manualReference,
        adminNote,
      }),
    });
    applyUserFinancePayloadToState(payload);
    state.actionModal = null;
    await Promise.all([loadFinancialDashboard(), loadAdminFinanceQueues()]);
    render();
    showNotice("Withdrawal marked successful");
  }).catch((error) => showError(error.message));
}

async function submitAdminGiftCard(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    await api("/api/admin/gift-cards", {
      method: "POST",
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency || "NGN",
        note: data.note || "",
        rewardPool: data.rewardPool || "standard",
        isQuestReward: data.rewardPool === "quest",
      }),
    });
    await Promise.all([loadAdminFinanceQueues(), loadAdminQuestData().catch(() => undefined)]);
    clearFormDraft(form);
    render();
    showNotice("Gift card generated");
  }).catch((error) => showError(error.message));
}

async function refreshQuestData() {
  await withLoading(async () => {
    await (state.user?.role === "admin" ? loadAdminQuestData() : loadQuestData());
    render();
  }).catch((error) => showError(error.message));
}

async function startQuest(questId) {
  await withLoading(async () => {
    const payload = await api(`/api/quest/${encodeURIComponent(questId)}/start`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    state.quest.status = {
      ...(state.quest.status || {}),
      activeQuest: payload.quest,
      activeSession: payload.session,
    };
    state.quest.selectedAnswer = "";
    state.quest.feedback = null;
    await loadQuestData();
    showNotice("Quest started");
    render();
  }).catch((error) => showError(error.message));
}

async function submitQuestAnswer() {
  const sessionId = state.quest.status?.activeSession?.id;
  const answer = getQuestAnswerInput();
  if (!sessionId || !answer) {
    showError("Choose an answer.");
    return;
  }
  await withLoading(async () => {
    const payload = await api(`/api/quest/session/${encodeURIComponent(sessionId)}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    });
    if (!payload.correct) {
      state.quest.feedback = { type: "wrong", text: payload.message || "Try again." };
      state.quest.selectedAnswer = "";
      render();
      return;
    }
    state.quest.selectedAnswer = "";
    await loadQuestData();
    state.quest.feedback = {
      type: "correct",
      text: payload.completed ? "Complete" : "Correct",
    };
    if (payload.completed) {
      showNotice("Quest complete. Unlock your reward.");
    }
    render();
  }).catch((error) => showError(error.message));
}

function getQuestAnswerInput() {
  const stage = state.quest.status?.activeSession?.currentStage || {};
  const raw = document.getElementById("quest-free-answer-input")?.value?.trim();
  if (raw) {
    if (stage.type === "sequence") {
      return raw.split(",").map((item) => item.trim()).filter(Boolean);
    }
    if (stage.type === "matching") {
      try {
        return JSON.parse(raw);
      } catch {
        showError("Enter matching answers as JSON.");
        return "";
      }
    }
    return raw;
  }
  return state.quest.selectedAnswer;
}

async function completeQuestReward() {
  const sessionId = state.quest.status?.activeSession?.id;
  if (!sessionId) {
    return;
  }
  await withLoading(async () => {
    await api(`/api/quest/session/${encodeURIComponent(sessionId)}/complete`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await loadQuestData();
    playQuestWinSound();
    showNotice("Reward unlocked");
    render();
  }).catch((error) => showError(error.message));
}

async function revealQuestReward() {
  const sessionId = state.quest.status?.activeSession?.id;
  if (!sessionId) {
    return;
  }
  await withLoading(async () => {
    await api(`/api/quest/session/${encodeURIComponent(sessionId)}/reveal`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await loadQuestData();
    playQuestWinSound();
    showNotice("Gift card revealed");
    render();
  }).catch((error) => showError(error.message));
}

async function redeemQuestReward() {
  const sessionId = state.quest.status?.activeSession?.id;
  if (!sessionId) {
    return;
  }
  await withLoading(async () => {
    await api(`/api/quest/session/${encodeURIComponent(sessionId)}/redeem`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await Promise.all([loadQuestData(), loadFinancialDashboard()]);
    showNotice("Reward added to wallet");
    render();
  }).catch((error) => showError(error.message));
}

function readAdminQuestStagesFromForm(form) {
  const rows = [...form.querySelectorAll("[data-admin-quest-stage]")];
  return rows.map((row) => {
    const index = row.dataset.adminQuestStage;
    const options = [...row.querySelectorAll(`[data-admin-quest-option="${index}"]`)]
      .map((input) => input.value.trim())
      .filter(Boolean);
    return {
      type: row.querySelector(`[name="stageType-${index}"]`)?.value || "multiple-choice",
      prompt: row.querySelector(`[name="stagePrompt-${index}"]`)?.value.trim() || "",
      options,
      correctAnswer: row.querySelector(`[name="stageAnswer-${index}"]`)?.value.trim() || options[0] || "",
      explanation: row.querySelector(`[name="stageExplanation-${index}"]`)?.value.trim() || "",
      hint: row.querySelector(`[name="stageHint-${index}"]`)?.value.trim() || "",
    };
  }).filter((stage) => stage.prompt && (stage.options.length || stage.correctAnswer));
}

function setAdminQuestDraftFromForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const stages = readAdminQuestStagesFromForm(form).map(normalizeQuestStage);
  state.quest.draft = {
    id: data.id || "",
    title: data.title || "",
    category: data.category || "crypto",
    difficulty: data.difficulty || "easy",
    description: data.description || "",
    active: data.active === "on",
    stages,
    stagesJson: JSON.stringify(stages, null, 2),
  };
}

async function submitAdminQuest(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const stages = readAdminQuestStagesFromForm(form);
  if (!stages.length) {
    showError("Add at least one question with an answer.");
    return;
  }
  const payload = {
    title: data.title,
    category: data.category,
    difficulty: data.difficulty,
    description: data.description,
    active: data.active === "on",
    stages,
  };
  const id = String(data.id || "").trim();
  await withLoading(async () => {
    await api(id ? `/api/admin/quests/${encodeURIComponent(id)}` : "/api/admin/quests", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    state.quest.draft = null;
    await loadAdminQuestData();
    clearFormDraft(form);
    showNotice(id ? "Quest saved" : "Quest created");
    render();
  }).catch((error) => showError(error.message));
}

async function adminQuestAction(action, questId, active = false) {
  const endpoint = action === "delete"
    ? `/api/admin/quests/${encodeURIComponent(questId)}`
    : `/api/admin/quests/${encodeURIComponent(questId)}/${action === "toggle" ? (active ? "activate" : "disable") : action}`;
  const method = action === "delete" ? "DELETE" : "POST";
  if (action === "delete" && !window.confirm("Delete this quest?")) {
    return;
  }
  await withLoading(async () => {
    await api(endpoint, {
      method,
      body: JSON.stringify({}),
    });
    await loadAdminQuestData();
    render();
    showNotice("Quest updated");
  }).catch((error) => showError(error.message));
}

async function submitAdminDepositSettings(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    const payload = await api("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({
        deposit: {
          bankName: data.bankName || "",
          accountName: data.accountName || "",
          accountNumber: data.accountNumber || "",
          bankNote: data.bankNote || "",
          usdtAddress: data.usdtAddress || "",
          usdtNetwork: data.usdtNetwork || "TRC20",
        },
        exchangeRate: {
          usdtToNgn: data.usdtToNgn || getUsdtToNgnRate(),
        },
        withdrawal: {
          minNgn: data.minWithdrawalNgn || "500",
          minUsdt: data.minWithdrawalUsdt || "50",
          ngnFee: data.ngnWithdrawalFee || "100",
        },
        trading: {
          minJoinUsdt: data.minTradeJoinUsdt || "1",
        },
        telegram: {
          channelUsername: data.telegramChannelUsername || "",
        },
      }),
    });
    state.financialDashboard = {
      ...(state.financialDashboard || {}),
      settings: payload.settings,
    };
    state.adminDepositSettingsDraft = null;
    clearFormDraft(form);
    render();
    showNotice("Deposit accounts saved");
  }).catch((error) => showError(error.message));
}

async function submitAdminReferralSettings(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    const payload = await api("/api/admin/referrals/settings", {
      method: "PATCH",
      body: JSON.stringify({
        enabled: data.enabled === "true",
        bonusAmountNgn: data.bonusAmountNgn || "0",
        minimumDepositNgn: data.minimumDepositNgn || "2000",
        minimumSpendNgn: data.minimumSpendNgn || "2000",
        minimumTrades: data.minimumTrades || "2",
        maximumEarningsNgn: data.maximumEarningsNgn || "100000",
        campaignMaximumNgn: data.campaignMaximumNgn || data.maximumEarningsNgn || "100000",
      }),
    });
    state.financialDashboard = {
      ...(state.financialDashboard || {}),
      settings: {
        ...(state.financialDashboard?.settings || {}),
        referral: payload.settings,
      },
    };
    await loadAdminReferralData();
    clearFormDraft(form);
    render();
    showNotice("Referral settings saved");
  }).catch((error) => showError(error.message));
}

async function submitAdminVtuSettings(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    const payload = await api("/api/admin/integrations/vtu/settings", {
      method: "PUT",
      body: JSON.stringify({
        username: data.username || "",
        password: data.password || "",
        pin: data.pin || "",
        airtimeEnabled: data.airtimeEnabled === "true",
        dataEnabled: data.dataEnabled === "true",
        airtimeMarkupPercent: data.airtimeMarkupPercent || "0",
        dataMarkupPercent: data.dataMarkupPercent || "0",
        minAirtimeAmount: data.minAirtimeAmount || "100",
        maxAirtimeAmount: data.maxAirtimeAmount || "50000",
        lowBalanceThreshold: data.lowBalanceThreshold || "5000",
      }),
    });
    state.vtuSettings = payload.settings;
    state.financialDashboard = {
      ...(state.financialDashboard || {}),
      settings: {
        ...(state.financialDashboard?.settings || {}),
        vtu: payload.settings,
      },
    };
    clearFormDraft(form);
    render();
    showNotice("VTU settings saved");
  }).catch((error) => showError(error.message));
}

async function refreshAdminVtuConnection(action = "test") {
  await withLoading(async () => {
    const endpoint = action === "balance" ? "/api/admin/integrations/vtu/balance" : "/api/admin/integrations/vtu/test";
    const payload = await api(endpoint, {
      method: action === "balance" ? "GET" : "POST",
      body: action === "balance" ? undefined : JSON.stringify({}),
    });
    state.vtuSettings = payload.settings;
    state.financialDashboard = {
      ...(state.financialDashboard || {}),
      settings: {
        ...(state.financialDashboard?.settings || {}),
        vtu: payload.settings,
      },
    };
    render();
    showNotice(`VTU balance ${formatNaira(payload.balance || payload.settings?.lastKnownBalance || 0)}`);
  }).catch((error) => showError(error.message));
}

async function submitAdminDigitalServicesSettings(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    const payload = await api("/api/admin/integrations/digital-services/settings", {
      method: "PUT",
      body: JSON.stringify({
        enabled: data.enabled === "true",
        globalMarkupPercent: data.globalMarkupPercent || "0",
        allowedImageDomains: String(data.allowedImageDomains || "akunding.shop")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });
    state.digitalServices.settings = payload.settings;
    state.digitalServices.admin = {
      ...(state.digitalServices.admin || {}),
      settings: payload.settings,
      supplier: payload.supplier || state.digitalServices.admin?.supplier,
    };
    state.financialDashboard = {
      ...(state.financialDashboard || {}),
      settings: {
        ...(state.financialDashboard?.settings || {}),
        digitalServices: payload.settings,
      },
    };
    clearFormDraft(form);
    render();
    showNotice("Digital Services settings saved");
  }).catch((error) => showError(error.message));
}

async function syncAdminDigitalServices() {
  await withLoading(async () => {
    const payload = await api("/api/admin/integrations/digital-services/sync", {
      method: "POST",
      body: JSON.stringify({}),
    });
    state.digitalServices.admin = {
      ...(state.digitalServices.admin || {}),
      products: payload.products || [],
      summary: payload.summary || state.digitalServices.admin?.summary,
    };
    state.digitalServices.products = payload.products || [];
    state.digitalServices.settings = payload.summary?.settings || state.digitalServices.settings;
    render();
    showNotice(`${(payload.products || []).length} products synced`);
  }).catch((error) => showError(error.message));
}

async function submitAdminDigitalProductOverride(form) {
  const productId = form.dataset.adminDigitalProductForm;
  if (!productId) {
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    const payload = await api(`/api/admin/integrations/digital-services/products/${encodeURIComponent(productId)}/override`, {
      method: "PATCH",
      body: JSON.stringify({
        enabled: data.enabled === "true",
        featured: data.featured === "true",
        displayName: data.displayName || "",
        customImageUrl: data.customImageUrl || "",
        markupMode: data.markupMode || "percentage",
        markupValue: data.markupValue || "0",
        customPriceNgn: data.customPriceNgn || "0",
        order: data.order || "0",
      }),
    });
    state.digitalServices.products = (state.digitalServices.products || []).map((product) =>
      product.id === productId ? payload.product : product
    );
    state.digitalServices.admin = {
      ...(state.digitalServices.admin || {}),
      products: (state.digitalServices.admin?.products || state.digitalServices.products || []).map((product) =>
        product.id === productId ? payload.product : product
      ),
      summary: payload.summary || state.digitalServices.admin?.summary,
    };
    render();
    showNotice("Product override saved");
  }).catch((error) => showError(error.message));
}

async function refreshAdminDigitalProductPrice(productId) {
  if (!productId) {
    return;
  }
  await withLoading(async () => {
    const payload = await api(`/api/admin/integrations/digital-services/products/${encodeURIComponent(productId)}/refresh`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    state.digitalServices.products = (state.digitalServices.products || []).map((product) =>
      product.id === productId ? payload.product : product
    );
    state.digitalServices.admin = {
      ...(state.digitalServices.admin || {}),
      products: (state.digitalServices.admin?.products || state.digitalServices.products || []).map((product) =>
        product.id === productId ? payload.product : product
      ),
      summary: payload.summary || state.digitalServices.admin?.summary,
    };
    render();
    showNotice(`API price updated: ${formatNaira(payload.product?.providerCostNgn || 0)}`);
  }).catch((error) => showError(error.message));
}

async function requeryAdminDigitalOrder(orderId) {
  if (!orderId) {
    return;
  }
  await withLoading(async () => {
    const payload = await api(`/api/admin/integrations/digital-services/orders/${encodeURIComponent(orderId)}/requery`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    state.digitalServices.orders = (state.digitalServices.orders || []).map((order) => order.id === orderId ? payload.order : order);
    state.digitalServices.admin = {
      ...(state.digitalServices.admin || {}),
      orders: (state.digitalServices.admin?.orders || state.digitalServices.orders || []).map((order) => order.id === orderId ? payload.order : order),
      summary: payload.summary || state.digitalServices.admin?.summary,
    };
    await loadFinancialDashboard();
    render();
    showNotice("Digital service order checked");
  }).catch((error) => showError(error.message));
}

async function requeryAdminVtuTransaction(transactionId) {
  if (!transactionId) {
    return;
  }
  await withLoading(async () => {
    await api(`/api/admin/integrations/vtu/transactions/${encodeURIComponent(transactionId)}/requery`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await Promise.all([loadFinancialDashboard(), loadAdminFinanceQueues()]);
    render();
    showNotice("VTU order checked");
  }).catch((error) => showError(error.message));
}

async function submitUserBankAccount(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const bank = (state.paymentBanks || []).find((item) => item.code === data.bankCode);
  if (!data.bankCode || !/^\d{10}$/.test(String(data.accountNumber || "").replace(/\D/g, ""))) {
    showError("Choose bank and enter 10-digit account number.");
    return;
  }
  await withLoading(async () => {
    const payload = await api("/api/user/bank-account", {
      method: "PUT",
      body: JSON.stringify({
        bankName: bank?.name || "",
        bankCode: data.bankCode || "",
        accountNumber: String(data.accountNumber || "").replace(/\D/g, ""),
      }),
    });
    state.financialDashboard = {
      ...(state.financialDashboard || {}),
      bankAccount: payload.bankAccount,
      bankAccounts: [
        payload.bankAccount,
        ...((state.financialDashboard?.bankAccounts || []).filter(
          (account) => account.id !== payload.bankAccount.id
        )),
      ],
    };
    state.resolvedBankAccount = payload.bankAccount;
    clearFormDraft(form);
    render();
    showNotice("Bank verified");
  }).catch((error) => showError(error.message));
}

async function removeSavedBankAccount(bankAccountId) {
  const accountId = String(bankAccountId || "").trim();
  if (!accountId) {
    return;
  }
  if (!window.confirm("Remove this saved account?")) {
    return;
  }
  await withLoading(async () => {
    const payload = await api(`/api/user/bank-account/${encodeURIComponent(accountId)}`, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
    const nextAccounts = payload.bankAccounts || [];
    state.financialDashboard = {
      ...(state.financialDashboard || {}),
      bankAccount: payload.bankAccount || nextAccounts[0] || null,
      bankAccounts: nextAccounts,
    };
    const nextSaved = getSavedBankAccounts();
    state.resolvedBankAccount = nextSaved[0] || null;
    state.actionModal = state.actionModal
      ? {
          ...state.actionModal,
          bankMode: nextSaved.length ? "saved" : "new",
          bankAccountId: nextSaved[0]?.id || "",
        }
      : state.actionModal;
    showNotice("Saved account removed");
    render();
  }).catch((error) => showError(error.message));
}

async function resolveSelectedBankAccount() {
  const bankCode = document.getElementById("wallet-bank-code-input")?.value || "";
  const accountNumber = document.getElementById("wallet-account-input")?.value?.replace(/\D/g, "").trim() || "";
  const bank = (state.paymentBanks || []).find((item) => item.code === bankCode);
  if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
    showError("Choose bank and enter 10-digit account number.");
    return;
  }
  await withLoading(async () => {
    const payload = await api("/api/payments/resolve-account", {
      method: "POST",
      body: JSON.stringify({
        bankName: bank?.name || "",
        bankCode,
        accountNumber,
        saveBankAccount: document.getElementById("wallet-save-bank-input")?.checked !== false,
      }),
    });
    const resolvedAccount = {
      ...(payload.bankAccount || {}),
      nameMatch: payload.nameMatch ?? payload.bankAccount?.nameMatch,
      nameMatchWarning: payload.nameMatchWarning || payload.bankAccount?.nameMatchWarning || "",
      matchedNameCount: payload.matchedNameCount ?? payload.bankAccount?.matchedNameCount,
    };
    state.resolvedBankAccount = resolvedAccount;
    const nextBankAccounts = payload.saved && resolvedAccount?.id
      ? [
          resolvedAccount,
          ...((state.financialDashboard?.bankAccounts || []).filter(
            (account) => account.id !== resolvedAccount.id
          )),
        ]
      : (state.financialDashboard?.bankAccounts || []);
    state.financialDashboard = {
      ...(state.financialDashboard || {}),
      bankAccount: payload.saved ? resolvedAccount : state.financialDashboard?.bankAccount,
      bankAccounts: nextBankAccounts,
    };
    state.actionModal = {
      ...state.actionModal,
      bankMode: payload.saved ? "saved" : "new",
      bankAccountId: payload.saved ? resolvedAccount?.id || "" : "",
      bankCode,
    };
    render();
    showNotice("Account resolved");
  }).catch((error) => showError(error.message));
}

async function joinTradeNow(tradeId) {
  await withLoading(async () => {
    await api(`/api/trades/${encodeURIComponent(tradeId)}/join`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    state.actionModal = null;
    await loadDashboardData();
    showNotice("Trade joined");
  }).catch((error) => showError(error.message));
}

async function stopJoinedTrade(tradeId) {
  await withLoading(async () => {
    await api(`/api/trades/${encodeURIComponent(tradeId)}/stop`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    clearActionModal();
    await loadDashboardData();
    showNotice("Trade stopped");
  }).catch((error) => showError(error.message));
}

function reviewStopJoinedTrade(tradeId) {
  const trade = state.trades.find((item) => item.id === tradeId);
  if (!trade?.userInvestment || trade.userInvestment.status !== "ACTIVE") {
    showError("No active joined trade found.");
    return;
  }
  showActionModal({
    type: "stop-investment",
    tradeId,
  });
}

async function hideStoppedTrade(tradeId) {
  await withLoading(async () => {
    await api(`/api/trades/${encodeURIComponent(tradeId)}/hide`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await loadDashboardData();
    showNotice("Trade removed from your view");
  }).catch((error) => showError(error.message));
}

async function submitReviewedWithdrawal(payload = state.actionModal?.withdrawalPayload || {}) {
  await withLoading(async () => {
    const headers = { "Idempotency-Key": `withdraw-${Date.now()}-${Math.random().toString(16).slice(2)}` };
    await api("/api/withdrawals", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    await loadFinancialDashboard();
    clearWalletDrafts();
    clearActionModal();
    showNotice("Withdrawal submitted. Funds are locked while admin reviews it.");
    render();
  }).catch((error) => showError(error.message));
}

async function submitAdminUserBonus(form, userId) {
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    const payload = await api(`/api/admin/users/${encodeURIComponent(userId)}/bonus`, {
      method: "POST",
      body: JSON.stringify({
        currency: data.currency || "USDT",
        amount: data.amount,
        note: data.note || "Bonus",
      }),
    });
    applyUserFinancePayloadToState(payload);
    await Promise.all([loadFinancialDashboard(), loadAdminFinanceQueues()]);
    clearFormDraft(form);
    render();
    showNotice("Bonus added");
  }).catch((error) => showError(error.message));
}

async function submitAdminUserBalance(form, userId) {
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    const payload = await api(`/api/admin/users/${encodeURIComponent(userId)}/balance`, {
      method: "POST",
      body: JSON.stringify({
        currency: data.currency || "USDT",
        amount: data.amount,
        note: data.note || "Balance updated",
      }),
    });
    applyUserFinancePayloadToState(payload);
    clearFormDraft(form);
    state.actionModal = null;
    await Promise.all([loadFinancialDashboard(), loadAdminFinanceQueues()]);
    render();
    showNotice("Balance updated");
  }).catch((error) => showError(error.message));
}

async function submitAdminUserMessage(form, userId) {
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    await api(`/api/admin/users/${encodeURIComponent(userId)}/message`, {
      method: "POST",
      body: JSON.stringify({
        title: data.title || "Admin message",
        message: data.message || "",
      }),
    });
    clearFormDraft(form);
    form.reset();
    render();
    showNotice("Message sent");
  }).catch((error) => showError(error.message));
}

async function submitUserPasswordChange(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const newPassword = String(data.newPassword || "").trim();
  const confirmPassword = String(data.confirmPassword || "").trim();
  if (newPassword !== confirmPassword) {
    showError("New passwords do not match.");
    return;
  }
  await withLoading(async () => {
    await api("/api/user/password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: data.currentPassword || "",
        newPassword,
      }),
    });
    clearFormDraft(form);
    form.reset();
    render();
    showNotice("Password updated");
  }).catch((error) => showError(error.message));
}

async function submitUserSupportMessage(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  await withLoading(async () => {
    await api("/api/support/messages", {
      method: "POST",
      body: JSON.stringify({
        title: "Support message",
        message: data.message || "",
      }),
    });
    clearFormDraft(form);
    form.reset();
    render();
    showNotice("Message sent to admin");
  }).catch((error) => showError(error.message));
}

async function submitNotificationReply(form) {
  const notificationId = form.dataset.replyNotification;
  const modalNotification = state.actionModal?.notificationId === notificationId ? state.actionModal.notification : null;
  const notification = modalNotification || (state.notifications || []).find((item) => item.id === notificationId);
  if (!notification) {
    showError("Message not found.");
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  const message = String(data.message || "").trim();
  if (!message) {
    showError("Message is required.");
    return;
  }

  await withLoading(async () => {
    if (state.user?.role === "admin") {
      const conversationUserId = getNotificationConversationUserId(notification);
      if (!conversationUserId) {
        throw new Error("Message user was not found.");
      }
      await api(`/api/admin/users/${encodeURIComponent(conversationUserId)}/message`, {
        method: "POST",
        body: JSON.stringify({
          title: "Admin reply",
          message,
        }),
      });
    } else {
      await api("/api/support/messages", {
        method: "POST",
        body: JSON.stringify({
          title: "User reply",
          message,
        }),
      });
    }
    clearFormDraft(form);
    state.actionModal = null;
    await loadFinancialDashboard();
    render();
    showNotice("Reply sent");
  }).catch((error) => showError(error.message));
}

async function submitAdminUserTradeJoin(form, userId) {
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.tradeId) {
    showError("Select an open trade.");
    return;
  }

  await withLoading(async () => {
    const payload = await api(`/api/admin/users/${encodeURIComponent(userId)}/trades/${encodeURIComponent(data.tradeId)}/join`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (payload.user?.id) {
      updateUserInStateUsers(payload.user);
    }
    clearFormDraft(form);
    await loadDashboardData();
    showNotice("User added to trade");
  }).catch((error) => showError(error.message));
}

function toggleFinanceHistorySelection(kind, id, selected) {
  const key = financeHistoryKey(kind, id);
  const next = new Set(state.selectedFinanceHistoryIds);
  if (selected) {
    next.add(key);
  } else {
    next.delete(key);
  }
  state.selectedFinanceHistoryIds = [...next];
  render();
}

function updateWalletEquivalentPreview(amountInput, currency) {
  const preview = document.getElementById("wallet-equivalent-preview");
  if (!preview) {
    return;
  }
  const equivalent = formatEquivalentAmount(amountInput?.value || 0, currency);
  preview.textContent = equivalent ? `Equivalent: ${equivalent}` : "Equivalent: --";
}

function isBankAccountNameAccepted(account) {
  if (!account) {
    return false;
  }
  if (account.nameMatch === true) {
    return true;
  }
  return Number(account.matchedNameCount || 0) >= 2;
}

function renderBankNameWarning(account) {
  if (!account || isBankAccountNameAccepted(account)) {
    return "";
  }
  const accountName = account.accountName ? ` (${account.accountName})` : "";
  const message = `Withdrawal account name review needed${accountName}. My registered name is ${state.user?.name || ""}.`;
  return `
    <div class="bank-name-warning">
      <p>${escapeHtml(account.nameMatchWarning || "Resolved account name does not match your registered name. Please use your own account or contact support.")}</p>
      <button class="bank-warning-support" data-open-withdrawal-support="${escapeHtml(message)}" type="button">
        ${icon("contact")} Support
      </button>
    </div>
  `;
}

function getTabRoute(tab) {
  if (tab === "referral") {
    return "/?tab=referral";
  }
  if (tab === "quest") {
    return "/?tab=quest";
  }
  if (tab === "adminQuests") {
    return "/?tab=adminQuests";
  }
  if (["home", "settings", "signals", "store", "history"].includes(tab)) {
    return `/?tab=${encodeURIComponent(tab)}`;
  }
  return "/?tab=home";
}

function getNotificationTarget(notification) {
  const route = String(notification?.route || notification?.metadata?.route || "").trim();
  if (route.includes("tab=signals")) {
    return { tab: "signals", section: "signals" };
  }
  if (route.includes("tab=quest")) {
    return { tab: "quest", section: "quest" };
  }
  if (route.includes("tab=referral")) {
    return { tab: "referral", section: "referral" };
  }
  if (route.includes("tab=store") || route.includes("tab=services")) {
    return { tab: "store", section: "store" };
  }
  if (route.includes("tab=history")) {
    return { tab: "history", section: "finance" };
  }
  const type = String(notification?.type || "").toUpperCase();
  const entityType = String(notification?.entityType || "").toUpperCase();
  if (state.user?.role === "admin" && ["DEPOSIT", "WITHDRAWAL"].includes(entityType || type)) {
    return { tab: "history", section: "finance" };
  }
  if (type === "MESSAGE") {
    return { modal: "message-reply" };
  }
  return { tab: "home", section: "wallet" };
}

async function openNotification(notificationId) {
  const notification = (state.notifications || []).find((item) => item.id === notificationId);
  if (!notification) {
    return;
  }
  const target = getNotificationTarget(notification);
  try {
    const payload = await api(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    state.notifications = state.notifications.map((item) =>
      item.id === notificationId
        ? { ...item, readAt: payload.notification?.readAt || new Date().toISOString() }
        : item
    ).filter((item) => item.id !== notificationId);
    updateAppBadge();
  } catch (error) {
    showError(error.message);
    return;
  }
  state.showNotifications = false;
  if (target.modal === "message-reply") {
    state.actionModal = {
      type: "message-reply",
      notificationId,
      notification: {
        ...notification,
        readAt: new Date().toISOString(),
      },
    };
    render();
    return;
  }
  state.activeTab = target.tab;
  if (window.history?.pushState) {
    window.history.pushState({}, "", getTabRoute(target.tab));
  }
  if (target.tab === "settings") {
    connectSettingsUsersSocket();
  } else {
    disconnectSettingsUsersSocket();
  }
  render();
  requestAnimationFrame(() => {
    document.querySelector(`[data-section="${target.section}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

async function dismissNotification(notificationId) {
  if (!notificationId) {
    return;
  }
  try {
    await api(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  } catch {
    // The message may have expired on the server; remove it locally either way.
  }
  state.notifications = (state.notifications || []).filter((item) => item.id !== notificationId);
  updateAppBadge();
  render();
}

async function deleteSelectedFinanceHistory() {
  const selected = state.selectedFinanceHistoryIds;
  if (!selected.length) {
    showError("Select history to delete.");
    return;
  }
  if (!window.confirm(`Delete ${selected.length} finance record${selected.length === 1 ? "" : "s"}?`)) {
    return;
  }
  const payload = {
    depositIds: [],
    withdrawalIds: [],
    transactionIds: [],
    vtuTransactionIds: [],
  };
  selected.forEach((key) => {
    const [kind, id] = key.split(":");
    if (kind === "deposit") {
      payload.depositIds.push(id);
    }
    if (kind === "withdrawal") {
      payload.withdrawalIds.push(id);
    }
    if (kind === "transaction") {
      payload.transactionIds.push(id);
    }
    if (kind === "vtu") {
      payload.vtuTransactionIds.push(id);
    }
  });
  await withLoading(async () => {
    const result = await api("/api/admin/finance-history/delete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.selectedFinanceHistoryIds = [];
    await Promise.all([loadFinancialDashboard(), loadAdminFinanceQueues()]);
    render();
    showNotice(`${result.deletedCount || selected.length} record${(result.deletedCount || selected.length) === 1 ? "" : "s"} deleted`);
  }).catch((error) => showError(error.message));
}

function openVtuModal(productType) {
  const product = String(productType || "").trim().toLowerCase();
  state.actionModal = {
    type: product === "data" ? "vtu-data" : "vtu-airtime",
    phone: "",
    network: "",
    amount: "",
    variationId: "",
    packageSheet: false,
    packageCategory: "Daily",
  };
  state.vtuDataPlans = [];
  state.vtuDataPlansNetwork = "";
  render();
}

function openTransferModal() {
  state.actionModal = {
    type: "transfer",
    email: "",
    currency: "NGN",
    amount: "",
    note: "",
  };
  render();
}

async function openGiftCardRedeemModal() {
  await openWalletActionModal("deposit");
  if (state.actionModal?.type === "deposit") {
    state.actionModal = {
      ...state.actionModal,
      currency: "NGN",
      depositMode: "gift",
    };
    render();
  }
}

async function openDigitalServicesModal({ force = false } = {}) {
  state.menuSheetOpen = false;
  state.actionModal = {
    type: "digital-services",
  };
  render();
  await loadDigitalServiceProducts({ force }).catch((error) => showError(error.message));
  await loadDigitalServicesSnapshot().catch(() => undefined);
  render();
}

async function loadDigitalServicesSnapshot({ force = false } = {}) {
  if (!state.user) {
    state.digitalServices = {
      settings: null,
      products: [],
      categories: [],
      orders: [],
      query: "",
      category: "",
      loading: false,
      admin: null,
    };
    return;
  }
  if (state.user.role === "admin") {
    const payload = await api("/api/admin/integrations/digital-services").catch(() => null);
    if (payload) {
      state.digitalServices.admin = payload;
      state.digitalServices.settings = payload.settings || payload.summary?.settings || state.digitalServices.settings;
      state.digitalServices.products = payload.products || state.digitalServices.products || [];
      state.digitalServices.orders = payload.orders || state.digitalServices.orders || [];
      state.digitalServices.categories = [...new Set((state.digitalServices.products || []).map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    }
    return;
  }
  const [statusPayload, ordersPayload] = await Promise.all([
    api("/api/digital-services/status").catch(() => ({ settings: null })),
    api("/api/digital-services/orders?limit=20").catch(() => ({ orders: [] })),
  ]);
  state.digitalServices.settings = statusPayload.settings || null;
  state.digitalServices.orders = ordersPayload.orders || [];
}

async function loadDigitalServiceProducts({ force = false } = {}) {
  if (!state.user || state.user.role !== "user") {
    return [];
  }
  const query = String(state.digitalServices.query || "").trim();
  const category = String(state.digitalServices.category || "").trim();
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (force) params.set("refresh", "1");
  state.digitalServices.loading = true;
  try {
    const payload = await api(`/api/digital-services/products${params.toString() ? `?${params}` : ""}`);
    state.digitalServices.products = payload.products || [];
    state.digitalServices.categories = payload.categories || [];
    state.digitalServices.settings = {
      ...(state.digitalServices.settings || {}),
      ...(payload.status?.settings || payload.status || {}),
    };
    return state.digitalServices.products;
  } finally {
    state.digitalServices.loading = false;
  }
}

function readVtuModalFields(productType) {
  const product = String(productType || "").trim().toLowerCase();
  const phone = document.getElementById("vtu-phone-input")?.value?.trim() || state.actionModal?.phone || "";
  const network = state.actionModal?.network || "";
  const variationId = state.actionModal?.variationId || "";
  const amount = document.getElementById("vtu-amount-input")?.value?.trim() || state.actionModal?.amount || "";
  const selectedPlan = getSelectedVtuPlan();
  return {
    productType: product,
    phone,
    network,
    variationId,
    amount,
    selectedPlan,
    amountCharged: product === "data" ? selectedPlan?.sellingPrice || "" : amount,
    planName: selectedPlan?.name || "",
  };
}

function saveVtuModalDraft(productType) {
  const values = readVtuModalFields(productType);
  state.actionModal = {
    ...state.actionModal,
    phone: values.phone,
    network: values.network,
    amount: values.amount,
    variationId: values.variationId,
  };
}

function reviewVtuPurchase(productType) {
  const values = readVtuModalFields(productType);
  if (!values.phone || !values.network) {
    showError("Enter phone and network.");
    return;
  }
  if (values.productType === "data" && !values.selectedPlan) {
    showError("Select a data plan.");
    return;
  }
  if (values.productType === "airtime" && (!values.amount || Number(values.amount) <= 0)) {
    showError("Enter airtime amount.");
    return;
  }
  state.actionModal = {
    type: "vtu-confirm",
    ...values,
    amountCharged: values.amountCharged,
    returnModal: {
      type: values.productType === "data" ? "vtu-data" : "vtu-airtime",
      phone: values.phone,
      network: values.network,
      amount: values.amount,
      variationId: values.variationId,
      packageCategory: state.actionModal?.packageCategory || "Daily",
    },
  };
  render();
}

function saveTransferModalDraft() {
  if (state.actionModal?.type !== "transfer") {
    return;
  }
  state.actionModal = {
    ...state.actionModal,
    email: document.getElementById("transfer-email-input")?.value?.trim() || "",
    currency: document.getElementById("transfer-currency-input")?.value || state.actionModal.currency || "NGN",
    amount: document.getElementById("transfer-amount-input")?.value?.trim() || "",
    note: document.getElementById("transfer-note-input")?.value?.trim() || "",
  };
}

function updateVtuReviewButtonState() {
  const button = document.getElementById("vtu-review-btn");
  if (!button) {
    return;
  }
  const productType = button.dataset.vtuProduct;
  const values = readVtuModalFields(productType);
  const ready = values.productType === "data"
    ? !!(values.phone && values.network && values.selectedPlan)
    : !!(values.phone && values.network && values.amount && Number(values.amount) > 0);
  button.disabled = !ready;
}

function updateTransferButtonState() {
  const button = document.getElementById("transfer-submit-btn");
  if (!button) {
    return;
  }
  saveTransferModalDraft();
  button.disabled = !(state.actionModal?.email && state.actionModal?.amount && Number(state.actionModal.amount) > 0);
}

async function submitInAppTransfer() {
  saveTransferModalDraft();
  const modal = state.actionModal || {};
  await withLoading(async () => {
    const payload = await api("/api/user/transfer", {
      method: "POST",
      headers: { "Idempotency-Key": `transfer-${Date.now()}-${Math.random().toString(16).slice(2)}` },
      body: JSON.stringify({
        email: modal.email,
        currency: modal.currency || "NGN",
        amount: modal.amount,
        note: modal.note || "Transfer",
      }),
    });
    if (payload.profile) {
      state.financialDashboard = {
        ...(state.financialDashboard || {}),
        wallets: payload.profile.wallets || state.financialDashboard?.wallets || [],
        recentTransactions: payload.profile.recentTransactions || state.financialDashboard?.recentTransactions || [],
        ...(payload.financeSummary || {}),
      };
    }
    state.actionModal = null;
    await loadFinancialDashboard();
    render();
    showNotice("Transfer sent");
  }).catch((error) => showError(error.message));
}

async function submitVtuPurchase() {
  const modal = state.actionModal || {};
  const productType = String(modal.productType || "").trim().toLowerCase();
  if (!["airtime", "data"].includes(productType)) {
    showError("Select airtime or data.");
    return;
  }
  await withLoading(async () => {
    const endpoint = productType === "data" ? "/api/vtu/data" : "/api/vtu/airtime";
    const body = productType === "data"
      ? { phone: modal.phone, network: modal.network, variationId: modal.variationId }
      : { phone: modal.phone, network: modal.network, amount: modal.amount };
    const response = await api(endpoint, {
      method: "POST",
      headers: { "Idempotency-Key": `vtu-${productType}-${Date.now()}-${Math.random().toString(16).slice(2)}` },
      body: JSON.stringify(body),
    });
    state.actionModal = {
      type: "vtu-receipt",
      transaction: response.transaction,
    };
    await loadFinancialDashboard();
    render();
    showNotice(productType === "data" ? "Data order submitted." : "Airtime order submitted.");
  }).catch((error) => showError(error.message));
}

function getMenuSheetItems() {
  const isAdmin = state.user?.role === "admin";
  if (isAdmin) {
    return [
      { id: "history", label: "History", iconName: "profile", tab: "history" },
      { id: "settings", label: "Settings", iconName: "settings", tab: "settings" },
      { id: "adminQuests", label: "Quest", iconName: "star", tab: "adminQuests" },
      { id: "users", label: "Users", iconName: "users", action: "users" },
    ];
  }
  return [
    { id: "store", label: "Store", iconName: "gift", tab: "store" },
    { id: "signals", label: "Signals", iconName: "signals", tab: "signals" },
    { id: "history", label: "History", iconName: "profile", tab: "history" },
    { id: "referral", label: "Refer", iconName: "gift", tab: "referral" },
    { id: "quest", label: "Quest", iconName: "star", tab: "quest" },
    { id: "settings", label: "Settings", iconName: "settings", tab: "settings" },
    { id: "deposit", label: "Deposit", iconName: "bank", action: "deposit" },
    { id: "withdraw", label: "Withdraw", iconName: "send", action: "withdraw" },
    { id: "transfer", label: "Transfer", iconName: "send", action: "transfer" },
    { id: "airtime", label: "Airtime", iconName: "phone", action: "airtime" },
    { id: "data", label: "Data", iconName: "wifi", action: "data" },
    { id: "gift-card", label: "Gift Card", iconName: "gift", action: "gift-card" },
  ];
}

function reviewDigitalServicePurchase() {
  const product = getDigitalServiceProductById(state.actionModal?.productId) || state.actionModal?.product;
  if (!product) {
    showError("Select a digital service.");
    return;
  }
  const quantity = Math.max(1, Math.min(Number(document.getElementById("digital-service-quantity-input")?.value || state.actionModal.quantity || 1), 1000));
  state.actionModal = {
    type: "digital-service-confirm",
    productId: product.id,
    product,
    quantity,
    returnTo: state.actionModal?.returnTo || (state.activeTab === "store" ? "store" : "modal"),
  };
  render();
}

async function submitDigitalServicePurchase() {
  const product = getDigitalServiceProductById(state.actionModal?.productId) || state.actionModal?.product;
  if (!product) {
    showError("Select a digital service.");
    return;
  }
  const quantity = Math.max(1, Math.min(Number(state.actionModal.quantity || 1), 1000));
  await withLoading(async () => {
    const response = await api("/api/digital-services/orders", {
      method: "POST",
      headers: { "Idempotency-Key": `digital-${product.id}-${Date.now()}-${Math.random().toString(16).slice(2)}` },
      body: JSON.stringify({
        productId: product.id,
        quantity,
      }),
    });
    state.actionModal = {
      type: "digital-service-receipt",
      order: response.order,
    };
    await Promise.all([loadFinancialDashboard(), loadDigitalServicesSnapshot()]);
    render();
    showNotice("Digital service order submitted.");
  }).catch((error) => showError(error.message));
}

function renderMenuSheet() {
  if (!state.menuSheetOpen) {
    return "";
  }
  return `
    <div class="quick-menu-layer" role="presentation">
      <button class="quick-menu-backdrop" data-menu-close type="button" aria-label="Close menu"></button>
      <section class="quick-menu-sheet" role="dialog" aria-modal="true" aria-label="Menu">
        <span class="quick-menu-handle" aria-hidden="true"></span>
        <div class="quick-menu-grid">
          ${getMenuSheetItems().map((item) => `
            <button class="quick-menu-item" ${item.tab ? `data-menu-tab="${escapeHtml(item.tab)}"` : `data-menu-action="${escapeHtml(item.action)}"`} type="button">
              <span>${icon(item.iconName)}</span>
              <strong>${escapeHtml(item.label)}</strong>
            </button>
          `).join("")}
        </div>
        <button class="quick-menu-close" data-menu-close type="button" aria-label="Close menu">
          ${icon("x")}
          <span>Close</span>
        </button>
      </section>
    </div>
  `;
}

function getDigitalServiceProductById(productId) {
  const id = String(productId || "").trim();
  return (state.digitalServices.products || []).find((product) => String(product.id) === id) || null;
}

function renderDigitalServiceImage(product = {}, className = "digital-service-img") {
  const src = product.imageUrl || "/services/default-digital-service.png";
  return `<img class="${className}" src="${escapeHtml(src)}" alt="${escapeHtml(product.name || "Digital service")}" loading="lazy" onerror="this.onerror=null;this.src='/services/default-digital-service.png';" />`;
}

function renderDigitalServiceBrowserModal() {
  const settings = state.digitalServices.settings || {};
  const products = state.digitalServices.products || [];
  const orders = state.digitalServices.orders || [];
  const categories = state.digitalServices.categories || [];
  const query = state.digitalServices.query || "";
  const activeCategory = state.digitalServices.category || "";
  const availableBalance = Number(getFinancialWallet("NGN")?.availableBalance || 0);
  return `
    <div class="modal-backdrop vtu-screen-backdrop">
      <div class="vtu-phone-screen digital-services-screen">
        <header class="vtu-screen-header">
          <button class="vtu-back-btn" id="action-modal-cancel-btn" type="button">${icon("arrowLeft")}</button>
          <strong>Digital Services</strong>
          <button class="vtu-sheet-close" data-digital-services-refresh type="button" aria-label="Refresh services">${icon("refresh")}</button>
        </header>
        <section class="digital-services-hero">
          <div>
            <h3>Digital Services</h3>
            <p>Premium digital tools at affordable prices.</p>
          </div>
          <span>${icon("gift")}</span>
        </section>
        ${
          settings.enabled === false
            ? `<p class="warning-copy">Digital Services is not available now.</p>`
            : `
              <div class="digital-search">
                <span>${icon("signals")}</span>
                <input id="digital-service-search-input" type="search" value="${escapeHtml(query)}" placeholder="Search services..." autocomplete="off" />
              </div>
              <div class="digital-category-row">
                <button class="${activeCategory ? "" : "active"}" data-digital-service-category="" type="button">All</button>
                ${categories.map((category) => `<button class="${activeCategory === category ? "active" : ""}" data-digital-service-category="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`).join("")}
              </div>
              ${state.digitalServices.loading ? renderSectionLoadingOverlay("Loading services", "Checking available digital tools") : ""}
              <div class="digital-product-grid">
                ${products.map((product) => `
                  <button class="digital-product-card" data-digital-service-product="${escapeHtml(product.id)}" type="button">
                    ${renderDigitalServiceImage(product)}
                    <strong>${escapeHtml(product.name)}</strong>
                    <span>${escapeHtml(product.category || "Digital")}</span>
                    <b>${formatNaira(product.price || product.sellingPrice || 0).replace(".00", "")}</b>
                  </button>
                `).join("") || `<p class="vtu-empty-state">No digital service found.</p>`}
              </div>
              <section class="digital-orders-panel">
                <div class="section-head compact">
                  <div>
                    <h3>My Purchases</h3>
                    <p class="muted-copy">Balance: ${formatNaira(availableBalance)}</p>
                  </div>
                </div>
                <div class="compact-list">
                  ${orders.slice(0, 4).map(renderDigitalServiceOrderRow).join("") || `<p class="muted-copy">No digital service purchase yet.</p>`}
                </div>
              </section>
            `
        }
      </div>
    </div>
  `;
}

function renderDigitalServiceOrderRow(order = {}) {
  const status = String(order.status || "processing").toUpperCase();
  const deliveryLink = getDigitalDeliveryLink(order.delivery);
  return `
    <div class="asset-card digital-order-row">
      <div>
        <strong>${escapeHtml(order.productName || "Digital service")}</strong>
        <p class="muted-copy">
          <span class="wallet-status-badge ${walletStatusClass(status)}">${escapeHtml(formatWalletRequestStatus(status))}</span>
          ${order.createdAt ? `<span>${new Date(order.createdAt).toLocaleString()}</span>` : ""}
        </p>
        ${deliveryLink ? `<p class="muted-copy">Activation link ready.</p>` : order.delivery ? `<p class="muted-copy">Delivery available in receipt.</p>` : ""}
      </div>
      <div class="asset-values">
        <strong>${formatNaira(order.amountCharged || 0)}</strong>
        <p class="muted-copy">${escapeHtml(order.requestId || "")}</p>
        <button class="text-link compact-link" data-digital-service-order-receipt="${escapeHtml(order.id || order.requestId || "")}" type="button">View</button>
      </div>
    </div>
  `;
}

function getDigitalServiceOrderById(orderId) {
  const id = String(orderId || "");
  return (state.digitalServices.orders || []).find((order) => String(order.id || order.requestId || "") === id || String(order.requestId || "") === id) || null;
}

function getDigitalDeliveryLink(delivery) {
  if (!delivery) {
    return "";
  }
  if (typeof delivery === "string") {
    return extractFirstUrl(delivery);
  }
  const keys = [
    "activationLink",
    "activation_link",
    "activationUrl",
    "activation_url",
    "inviteLink",
    "invite_link",
    "inviteUrl",
    "invite_url",
    "planLink",
    "plan_link",
    "redeemLink",
    "redeem_link",
    "accessLink",
    "access_link",
    "orderLink",
    "order_link",
    "downloadLink",
    "download_link",
    "geminiLink",
    "gemini_link",
    "link",
    "url",
  ];
  for (const key of keys) {
    const link = extractFirstUrl(delivery[key]);
    if (link) {
      return link;
    }
  }
  return extractFirstUrl(delivery);
}

function extractFirstUrl(value) {
  if (typeof value === "string") {
    const text = value.trim();
    if (/^https?:\/\//i.test(text)) {
      return text;
    }
    const match = text.match(/https?:\/\/[^\s"'<>]+/i);
    return match ? match[0] : "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const link = extractFirstUrl(item);
      if (link) {
        return link;
      }
    }
    return "";
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const link = extractFirstUrl(item);
      if (link) {
        return link;
      }
    }
  }
  return "";
}

function renderDigitalServiceDelivery(delivery) {
  const link = getDigitalDeliveryLink(delivery);
  if (!delivery) {
    return `<p class="muted-copy">Delivery is processing. You will get a notification when it is ready.</p>`;
  }
  if (!link) {
    return `<pre class="digital-delivery-box">${escapeHtml(JSON.stringify(delivery, null, 2))}</pre>`;
  }
  return `
    <section class="digital-delivery-card">
      <p class="modal-eyebrow neutral">Activation link</p>
      <a class="digital-delivery-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link)}</a>
      <div class="modal-actions inline-modal-actions">
        <a class="button-primary shimmer-button" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${icon("send")} Open link</a>
        <button class="button-secondary" data-copy-text="${escapeHtml(link)}" type="button">${icon("copy")} Copy link</button>
      </div>
      <ol class="digital-delivery-steps">
        <li>Click or copy this link to your browser.</li>
        <li>Click on activate after the next page opens.</li>
        <li>Enjoy.</li>
      </ol>
    </section>
  `;
}

function renderDigitalServiceDetailModal() {
  const product = getDigitalServiceProductById(state.actionModal.productId) || state.actionModal.product || {};
  const quantity = Math.max(1, Number(state.actionModal.quantity || 1));
  const unitPrice = Number(product.price || product.sellingPrice || 0);
  const total = unitPrice * quantity;
  const available = Number(getFinancialWallet("NGN")?.availableBalance || 0);
  return `
    <div class="modal-backdrop">
      <div class="modal-card action-modal-card digital-service-detail-modal">
        <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
        ${renderDigitalServiceImage(product, "digital-service-detail-img")}
        <p class="modal-eyebrow neutral">${escapeHtml(product.category || "Digital")}</p>
        <h3>${escapeHtml(product.name || "Digital Service")}</h3>
        <p class="modal-text">${escapeHtml(product.description || "Premium digital access delivered after purchase.")}</p>
        <div class="action-metric-stack">
          ${product.planLabel ? `<div class="action-metric"><span>Plan</span><strong>${escapeHtml(product.planLabel)}</strong></div>` : ""}
          <div class="action-metric"><span>Delivery</span><strong>${escapeHtml(product.deliveryLabel || "After purchase")}</strong></div>
          <div class="action-metric"><span>Stock</span><strong>${Number(product.stock || 0).toLocaleString()}</strong></div>
          <div class="action-metric"><span>Total</span><strong>${formatNaira(total)}</strong></div>
        </div>
        <label class="stack-label">
          <span>Quantity</span>
          <input id="digital-service-quantity-input" type="number" min="1" max="1000" step="1" value="${escapeHtml(quantity)}" />
        </label>
        <p class="muted-copy">Wallet balance ${formatNaira(available)}</p>
        <div class="modal-actions">
          <button class="button-secondary" data-digital-services-back type="button">Back</button>
          <button class="button-primary shimmer-button" id="digital-service-review-btn" type="button" ${total > 0 && available >= total ? "" : "disabled"}>${icon("check")} Buy now</button>
        </div>
      </div>
    </div>
  `;
}

function renderDigitalServiceConfirmModal() {
  const product = getDigitalServiceProductById(state.actionModal.productId) || state.actionModal.product || {};
  const quantity = Math.max(1, Number(state.actionModal.quantity || 1));
  const total = Number(product.price || product.sellingPrice || 0) * quantity;
  return `
    <div class="modal-backdrop">
      <div class="modal-card action-modal-card">
        <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
        <p class="modal-eyebrow neutral">Confirm</p>
        <h3>Buy digital service</h3>
        <div class="action-metric-stack">
          <div class="action-metric"><span>Service</span><strong>${escapeHtml(product.name || "")}</strong></div>
          <div class="action-metric"><span>Quantity</span><strong>${quantity.toLocaleString()}</strong></div>
          <div class="action-metric"><span>Wallet debit</span><strong>${formatNaira(total)}</strong></div>
        </div>
        <div class="modal-actions">
          <button class="button-secondary" data-digital-services-back-detail type="button">Cancel</button>
          <button class="button-primary shimmer-button" id="digital-service-confirm-btn" type="button">${icon("check")} Pay</button>
        </div>
      </div>
    </div>
  `;
}

function renderDigitalServiceReceiptModal() {
  const order = state.actionModal.order || {};
  const delivery = order.delivery || null;
  return `
    <div class="modal-backdrop">
      <div class="modal-card action-modal-card digital-service-receipt-modal">
        <button class="modal-close" id="action-modal-close-btn" type="button">x</button>
        <p class="modal-eyebrow neutral">Receipt</p>
        <h3>${escapeHtml(formatWalletRequestStatus(order.status || "processing"))}</h3>
        <div class="action-metric-stack">
          <div class="action-metric"><span>Service</span><strong>${escapeHtml(order.productName || "")}</strong></div>
          <div class="action-metric"><span>Amount</span><strong>${formatNaira(order.amountCharged || 0)}</strong></div>
          <div class="action-metric"><span>Ref</span><strong>${escapeHtml(order.requestId || "")}</strong></div>
        </div>
        ${renderDigitalServiceDelivery(delivery)}
        <div class="modal-actions single">
          <button class="button-primary shimmer-button" id="action-modal-cancel-btn" type="button">Done</button>
        </div>
      </div>
    </div>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="Primary">
      <button class="nav-button nav-side ${state.activeTab === "store" ? "active" : ""}" data-tab="store" type="button">
        ${icon("gift")}
        <span>Store</span>
      </button>
      <button class="nav-home-button ${state.activeTab === "home" ? "active" : ""}" data-tab="home" type="button" aria-label="Home">
        <span class="nav-home-orb">${icon("home")}</span>
      </button>
      <button class="nav-button nav-side ${state.menuSheetOpen ? "active" : ""}" data-menu-toggle type="button" aria-expanded="${state.menuSheetOpen ? "true" : "false"}">
        ${icon("menu")}
        <span>Menu</span>
      </button>
    </nav>
  `;
}

function renderMarketModeSwitch() {
  return "";
}

function renderSummaryCard() {
  const isAdmin = state.user?.role === "admin";
  const adminStats = state.financialDashboard || {};
  const adminAccountSnapshot = isAdmin ? state.financialDashboard?.accountSnapshot : null;
  const futuresAccount = state.futuresAccount || {};
  const portfolioBalance = isFuturesMode()
    ? Number(futuresAccount.totalMarginBalance || futuresAccount.totalWalletBalance || 0)
    : isAdmin && adminAccountSnapshot
      ? Number(adminAccountSnapshot.totalUsdt || 0)
    : Number(state.totalUsdt || 0);
  const usdtWallet = getFinancialWallet("USDT");
  const ngnWallet = getFinancialWallet("NGN");
  const ledgerUsdt = Number(usdtWallet?.availableBalance || 0);
  const ledgerNgn = Number(ngnWallet?.availableBalance || 0);
  const configuredRate = getUsdtToNgnRate();
  const baseInvestmentNgn = Number(state.financialDashboard?.totalBalance?.ngnEquivalent || ledgerNgn + (configuredRate ? ledgerUsdt * configuredRate : 0));
  const baseInvestmentUsdt = Number(state.financialDashboard?.totalBalance?.usdt || ledgerUsdt + (configuredRate ? ledgerNgn / configuredRate : 0));
  const userDynamicPnlUsdt = getUserDynamicPnlUsdt();
  const lockedInvestmentUsdt = getUserLockedInvestmentUsdt();
  const liveInvestmentNgn = Number(state.financialDashboard?.totalBalance?.liveNgnEquivalent ?? baseInvestmentNgn + (configuredRate ? userDynamicPnlUsdt * configuredRate : 0));
  const liveInvestmentUsdt = Number(state.financialDashboard?.totalBalance?.liveUsdt ?? baseInvestmentUsdt + userDynamicPnlUsdt);
  const investmentNgn = isAdmin ? baseInvestmentNgn : liveInvestmentNgn;
  const investmentUsdt = isAdmin ? baseInvestmentUsdt : liveInvestmentUsdt;
  const accountLoading = state.loadingAccount;
  const exchangeLabel = getExchangeLabel(getActiveExchange());
  const todayValue = isFuturesMode()
    ? Number(futuresAccount.totalUnrealizedProfit || 0)
    : isAdmin && adminAccountSnapshot
      ? Number(adminAccountSnapshot.todayPnlValue || 0)
    : Number(state.todayPnlValue || 0);
  const todayPercent = isFuturesMode()
    ? (portfolioBalance ? (todayValue / portfolioBalance) * 100 : 0)
    : isAdmin && adminAccountSnapshot
      ? Number(adminAccountSnapshot.todayPnlPercent || 0)
    : Number(state.todayPnlPercent || 0);
  const todayTone = todayValue > 0 ? "positive" : todayValue < 0 ? "negative" : "neutral";
  const userMirroredPnlPercentage = Number(state.financialDashboard?.performance?.todayPercentage || 0);
  const userBalanceTone = userDynamicPnlUsdt < 0 ? "balance-main-loss" : "balance-main-profit";
  const userCardPnlTone = userDynamicPnlUsdt > 0 ? "card-pnl-profit" : userDynamicPnlUsdt < 0 ? "card-pnl-loss" : "card-pnl-neutral";
  const userDynamicPnlNgn = configuredRate ? userDynamicPnlUsdt * configuredRate : 0;

  if (isAdmin) {
    const adminBalanceNgn = configuredRate ? portfolioBalance * configuredRate : Number(state.totalNgn || 0);
    const adminPnlNgn = configuredRate ? todayValue * configuredRate : 0;
    const adminWalletLinked = !!(state.user.bybitConnected || state.user.exchangeConnected || adminAccountSnapshot);
    const adminExchangeLabel = getExchangeLabel(adminAccountSnapshot?.exchange || getAdminDashboardExchange());
    return `
      <section class="balance-carousel" data-section="wallet">
        <article class="summary-hero balance-slide fintech-card">
          ${state.loadingFinancial || accountLoading ? renderSectionLoadingOverlay("Loading wallet", `Syncing ${adminExchangeLabel}`) : ""}
          <div class="fintech-card-pattern" aria-hidden="true"></div>
          <div class="fintech-card-top">
            <span class="card-icon">${icon("card")}</span>
            <span>Admin Wallet</span>
          </div>
          <h2>${adminWalletLinked ? formatUsdt(portfolioBalance) : "--"}</h2>
          <div class="fintech-balance-row">
            <span>${adminExchangeLabel}</span>
            <span>${formatNaira(adminBalanceNgn)}</span>
          </div>
          <p class="muted-bright">
            P&L <span class="${todayTone}">${todayValue >= 0 ? "+" : "-"}${formatUsdt(Math.abs(todayValue))} ${todayPercent >= 0 ? "+" : ""}${formatNumber(todayPercent, 2)}%</span>
          </p>
          <p class="muted-bright">Mirrored ${adminPnlNgn >= 0 ? "+" : "-"}${formatNaira(Math.abs(adminPnlNgn))}</p>
          <div class="hero-chip-row">
            <span class="hero-chip">${Number(adminStats.totalUsers || 0).toLocaleString()} users</span>
            <span class="hero-chip">Deposits ${Number(adminStats.pendingDeposits || 0)}</span>
            <span class="hero-chip">Withdrawals ${Number(adminStats.pendingWithdrawals || 0)}</span>
          </div>
        </article>
      </section>
    `;
  }

  return `
      <section class="balance-carousel" data-section="wallet">
        <article class="summary-hero balance-slide fintech-card">
          ${state.loadingFinancial ? renderSectionLoadingOverlay("Loading investment view", "Pulling your ledger wallet") : ""}
          <div class="fintech-card-pattern" aria-hidden="true"></div>
          <div class="fintech-card-top">
            <span class="card-icon">${icon("card")}</span>
            <span>Investment</span>
          </div>
          <div class="fintech-investment-grid">
            <button
              class="fintech-pnl-stack balance-privacy-toggle ${state.hideBalanceAmounts ? "is-hidden" : ""}"
              data-balance-privacy-toggle
              type="button"
              aria-label="${state.hideBalanceAmounts ? "Show balance" : "Hide balance"}"
              aria-pressed="${state.hideBalanceAmounts ? "true" : "false"}"
            >
              <h2 class="${userBalanceTone}">${formatSignedNaira(investmentNgn)}</h2>
              <p class="fintech-subline">
                <span>${investmentUsdt < 0 ? "-" : ""}${formatUsdtUnit(Math.abs(investmentUsdt))}</span>
                <span class="fintech-pnl-chip ${userCardPnlTone}">
                  ${userMirroredPnlPercentage > 0 ? "+" : ""}${formatNumber(userMirroredPnlPercentage, 2)}% | ${formatSignedNaira(userDynamicPnlNgn, { positiveSign: userDynamicPnlNgn > 0 })}
                </span>
              </p>
            </button>
            <div class="locked-investment-box">
              <span class="lock-badge">${icon("lock")}</span>
              <small>Locked</small>
              <strong>${formatUsdtUnit(lockedInvestmentUsdt)}</strong>
              ${configuredRate ? `<span>${formatNaira(lockedInvestmentUsdt * configuredRate)}</span>` : ""}
            </div>
          </div>
          <div class="hero-actions">
            <button class="hero-action-btn" id="netrue-deposit-btn" type="button">${icon("bank")} Deposit</button>
            <button class="hero-action-btn ghost" id="netrue-withdraw-btn" type="button">${icon("download")} Withdraw</button>
          </div>
        </article>
      </section>
  `;
}

function renderAdminHomeDashboard() {
  const stats = state.financialDashboard || {};
  const pendingDeposits = Number(stats.pendingDeposits || 0);
  const pendingWithdrawals = Number(stats.pendingWithdrawals || 0);
  const openTrades = (state.trades || []).filter((trade) => ["OPEN", "PENDING"].includes(String(trade.lifecycleStatus || "").toUpperCase())).length;
  const exchangeLabel = getExchangeLabel(getAdminDashboardExchange());
  return `
    <section class="admin-dashboard-rail" aria-label="Admin overview">
      <button class="admin-stat-tile" data-admin-users-open type="button">
        <span class="card-icon">${icon("profile")}</span>
        <strong>${Number(stats.totalUsers || state.users?.length || 0).toLocaleString()}</strong>
        <small>Users</small>
      </button>
      <button class="admin-stat-tile" data-tab="history" type="button">
        <span class="card-icon">${icon("bank")}</span>
        <strong>${pendingDeposits.toLocaleString()}</strong>
        <small>Deposits</small>
      </button>
      <button class="admin-stat-tile" data-tab="history" type="button">
        <span class="card-icon">${icon("download")}</span>
        <strong>${pendingWithdrawals.toLocaleString()}</strong>
        <small>Withdrawals</small>
      </button>
      <div class="admin-stat-tile passive">
        <span class="card-icon">${icon("signals")}</span>
        <strong>${openTrades.toLocaleString()}</strong>
        <small>Open trades</small>
      </div>
    </section>
    <section class="admin-dashboard-section admin-trade-desk">
      <div class="section-head">
        <div>
          <h3>Trade Desk</h3>
          <p class="muted-copy">${exchangeLabel} spot execution</p>
        </div>
      </div>
      ${renderTradeTicket()}
    </section>
    <div class="admin-dashboard-columns">
      <section class="admin-dashboard-section">
        <div class="section-head">
          <div>
            <h3>Portfolio</h3>
            <p class="muted-copy">Live balances</p>
          </div>
        </div>
        ${renderBalancesSection()}
      </section>
      <section class="admin-dashboard-section">
        <div class="section-head">
          <div>
            <h3>Orders</h3>
            <p class="muted-copy">Open queue</p>
          </div>
        </div>
        <div data-home-trades-host>${renderOpenOrdersSection()}</div>
      </section>
    </div>
  `;
}

function renderTradeTicket() {
  const summary = getCurrentTradeSummary();
  const livePositive = Number(summary.live.changePercent || 0) >= 0;
  const symbolSuggestions = getTradeSymbolSuggestions();
  const livePrice = Number(summary.live.price || 0);
  const quoteBalance = Number(summary.usdtBalance || 0);
  const exchangeLabel = getExchangeLabel(getActiveExchange());

  return `
    <section class="trade-ticket">
      <div class="ticket-head">
        <div>
          <input id="trade-symbol" class="ticket-symbol" list="trade-symbol-list" value="${tradeDraft.symbol}" placeholder="Search ${exchangeLabel} spot pair" />
          <datalist id="trade-symbol-list">
            ${symbolSuggestions.map((symbol) => `<option value="${escapeHtml(symbol)}"></option>`).join("")}
          </datalist>
          <p class="ticket-change ${livePositive ? "positive" : "negative"}">${livePositive ? "+" : ""}${formatNumber(summary.live.changePercent, 2)}%</p>
          <p class="muted-copy">Live ${livePrice ? formatNumber(livePrice, 8) : "-"} | Avail ${formatNumber(quoteBalance, 8)} ${summary.quoteAsset}</p>
        </div>
        <span class="ticket-badge">Admin</span>
      </div>
      <div class="segmented">
        <button class="segment ${tradeDraft.side === "BUY" ? "active buy" : ""}" data-side="BUY" type="button">Buy</button>
        <button class="segment ${tradeDraft.side === "SELL" ? "active sell" : ""}" data-side="SELL" type="button">Sell</button>
      </div>
      <label class="ticket-select-wrap">
        <span>Order Type</span>
        <select id="trade-type" class="ticket-select">
          <option value="LIMIT" ${tradeDraft.type === "LIMIT" ? "selected" : ""}>Limit</option>
          <option value="MARKET" ${tradeDraft.type === "MARKET" ? "selected" : ""}>Market</option>
        </select>
      </label>
      <div class="ticket-grid">
        <label class="ticket-box">
          <span>Price (${summary.quoteAsset})</span>
          <div class="step-input">
            <button type="button" class="step-btn" data-step-field="price" data-step-dir="-1">-</button>
            <input id="trade-price" value="${tradeDraft.price}" placeholder="${summary.live.price ? formatNumber(summary.live.price, 8) : "0.00000000"}" />
            <button type="button" class="step-btn" data-step-field="price" data-step-dir="1">+</button>
          </div>
        </label>
        <button class="ticket-side-btn" id="use-live-price-btn" type="button">BBO</button>
      </div>
      <label class="ticket-box">
        <span>Amount (${summary.baseAsset})</span>
        <div class="step-input">
          <button type="button" class="step-btn" data-step-field="quantity" data-step-dir="-1">-</button>
          <input id="trade-quantity" value="${tradeDraft.quantity}" placeholder="Enter quantity" />
          <button type="button" class="step-btn" data-step-field="quantity" data-step-dir="1">+</button>
        </div>
      </label>
      <div class="slider-row">
        ${[25, 50, 75, 100].map((value) => `<button type="button" class="slider-pill" data-alloc="${value}">${value}%</button>`).join("")}
      </div>
      <label class="ticket-box">
        <span>Total (${summary.quoteAsset})</span>
        <input id="trade-total" value="${tradeDraft.quoteOrderQty || (summary.total ? summary.total.toFixed(8) : "")}" placeholder="Auto calculated" />
      </label>
      <label class="ticket-box soft">
        <span>Take Profit (${summary.quoteAsset})</span>
        <input id="trade-tp" value="${tradeDraft.takeProfitPrice}" placeholder="Optional take profit price" />
      </label>
      <button id="trade-submit-btn" class="button-primary shimmer-button ticket-submit" type="button">Place Spot Trade</button>
    </section>
  `;
}

function renderBalancesSection() {
  const balances = getDisplayedBalances();
  const exchangeLabel = getExchangeLabel(getActiveExchange());
  return `
    <section class="mobile-card${loadingClass(state.loadingAccount)}">
      ${state.loadingAccount ? renderSectionLoadingOverlay("Loading assets", `Pulling your connected ${exchangeLabel} balances`) : ""}
      <div class="section-head">
        <div>
          <h3>Connected ${exchangeLabel} Balances</h3>
          <p class="muted-copy">Top coins first, with live USDT value.</p>
        </div>
        <button id="toggle-balances-btn" class="text-link" type="button">${state.showAllBalances ? "See less" : "See more"}</button>
      </div>
      <div class="card-list">
        ${balances
          .map(
            (balance) => `
              <div class="asset-card">
                <div>
                  <strong>${balance.asset}</strong>
                  <p class="muted-copy">Qty ${formatNumber(balance.total)}</p>
                </div>
                <div class="asset-values">
                  <strong>${formatUsdt(balance.usdtValue)}</strong>
                  <p class="muted-copy ${Number(balance.changePercent || 0) >= 0 ? "positive" : "negative"}">
                    24h PnL ${Number(balance.changePercent || 0) >= 0 ? "+" : ""}${formatNumber(balance.changePercent, 2)}%
                    (${Number(balance.estimatedPnlValue || 0) >= 0 ? "+" : "-"}${formatUsdt(Math.abs(balance.estimatedPnlValue || 0))})
                  </p>
                </div>
              </div>
            `
          )
          .join("") || `<p class="muted-copy">Connect ${exchangeLabel} in settings to load balances.</p>`}
      </div>
    </section>
  `;
}

function renderWatchlistSection() {
  const watchlist = getDisplayedWatchlist();
  return `
    <section class="mobile-card${loadingClass(state.loadingWatchlist)}">
      ${state.loadingWatchlist ? renderSectionLoadingOverlay("Loading watchlist", "Refreshing live market movers") : ""}
      <div class="section-head">
        <div>
          <h3>Hot Spot Coins</h3>
          <p class="muted-copy">Top 10 by live ${getExchangeLabel(getActiveExchange())} spot activity.</p>
        </div>
      </div>
      <div class="compact-list" data-watchlist-host="dashboard">${renderWatchlistRows(watchlist)}</div>
    </section>
  `;
}

function renderFuturesBalanceGrid(account) {
  const balances = (account?.balances || []).slice(0, 6);
  return `
    <section class="mobile-card${loadingClass(state.loadingFutures)}">
      ${state.loadingFutures ? renderSectionLoadingOverlay("Loading futures", "Syncing Binance futures account") : ""}
      <div class="section-head">
        <div>
          <h3>Binance Futures Balance</h3>
          <p class="muted-copy">USDT-M futures wallet and margin snapshot.</p>
          ${
            account?.warning || state.futuresError
              ? `<p class="muted-copy warning-copy">${account?.warning || state.futuresError}</p>`
              : ""
          }
        </div>
      </div>
      <div class="metric-grid futures-metric-grid">
        <div class="trade-detail-pill">
          <span>Wallet</span>
          <strong>${formatUsdtUnit(account?.totalWalletBalance || 0)}</strong>
        </div>
        <div class="trade-detail-pill">
          <span>Available</span>
          <strong>${formatUsdtUnit(account?.availableBalance || 0)}</strong>
        </div>
        <div class="trade-detail-pill">
          <span>Margin</span>
          <strong>${formatUsdtUnit(account?.totalMarginBalance || 0)}</strong>
        </div>
        <div class="trade-detail-pill">
          <span>Unrealized P/L</span>
          <strong class="${Number(account?.totalUnrealizedProfit || 0) > 0 ? "positive" : Number(account?.totalUnrealizedProfit || 0) < 0 ? "negative" : "neutral"}">${Number(account?.totalUnrealizedProfit || 0) >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(Number(account?.totalUnrealizedProfit || 0)))}</strong>
        </div>
      </div>
      <div class="card-list">
        ${balances
          .map(
            (balance) => `
              <div class="asset-card">
                <div>
                  <strong>${balance.asset}</strong>
                  <p class="muted-copy">Wallet ${formatUsdtUnit(balance.walletBalance)}</p>
                </div>
                <div class="asset-values">
                  <strong>${formatUsdtUnit(balance.availableBalance)}</strong>
                  <p class="muted-copy ${Number(balance.unrealizedProfit || 0) > 0 ? "positive" : Number(balance.unrealizedProfit || 0) < 0 ? "negative" : "neutral"}">P/L ${Number(balance.unrealizedProfit || 0) >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(Number(balance.unrealizedProfit || 0)))}</p>
                </div>
              </div>
            `
          )
          .join("") || `<p class="muted-copy">No Binance futures balance was returned.</p>`}
      </div>
    </section>
  `;
}

function renderFuturesPosition(position) {
  const key = `${position.symbol}:${position.positionSide}`;
  const isExpanded = state.expandedFuturesPositionIds.includes(key);
  const pnlValue = Number(position.unrealizedProfit || 0);
  const amount = Math.abs(Number(position.positionAmt || 0));
  return `
    <details class="trade-disclosure trade-row-rich" data-futures-position-id="${key}" ${isExpanded ? "open" : ""}>
      <summary class="trade-summary-row">
        <div>
          <strong>${position.symbol}</strong>
          <p class="muted-copy">${position.side} ${position.positionSide} | ${formatNumber(amount, 8)}</p>
        </div>
        <div class="asset-values">
          ${renderTradeStatusBadge("OPEN")}
          <strong class="${pnlValue > 0 ? "positive" : pnlValue < 0 ? "negative" : "neutral"}">${pnlValue >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(pnlValue))}</strong>
        </div>
      </summary>
      <div class="trade-disclosure-body">
        <div class="trade-detail-grid">
          <div class="trade-detail-pill">
            <span>Entry</span>
            <strong>${formatNumber(position.entryPrice, 8)}</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Mark</span>
            <strong>${formatNumber(position.markPrice, 8)}</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Leverage</span>
            <strong>${formatNumber(position.leverage, 0)}x</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Liq.</span>
            <strong>${formatNumber(position.liquidationPrice, 8)}</strong>
          </div>
        </div>
        <div class="trade-actions-inline trade-actions-stack reveal-actions">
          <button class="micro-btn danger" data-close-futures-position="${position.symbol}" data-position-side="${position.positionSide}" data-position-quantity="${amount}" type="button">Close position</button>
        </div>
      </div>
    </details>
  `;
}

function renderFuturesOrder(order) {
  const key = String(order.orderId || "");
  const isExpanded = state.expandedFuturesOrderIds.includes(key);
  return `
    <details class="trade-disclosure trade-row-rich" data-futures-order-id="${key}" ${isExpanded ? "open" : ""}>
      <summary class="trade-summary-row">
        <div>
          <strong>${order.symbol}</strong>
          <p class="muted-copy">${order.side} ${order.type} | ${order.positionSide}</p>
        </div>
        <div class="asset-values">
          ${renderTradeStatusBadge("PENDING")}
          <strong>${formatNumber(order.origQty, 8)}</strong>
        </div>
      </summary>
      <div class="trade-disclosure-body">
        <div class="trade-detail-grid">
          <div class="trade-detail-pill">
            <span>Order ID</span>
            <strong>${String(order.orderId || "").slice(-8) || "--"}</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Price</span>
            <strong>${formatNumber(order.price, 8)}</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Filled</span>
            <strong>${formatNumber(order.executedQty, 8)}</strong>
          </div>
        </div>
        <div class="trade-actions-inline trade-actions-stack reveal-actions">
          <button class="micro-btn danger" data-cancel-futures-order="${order.orderId}" data-order-symbol="${order.symbol}" type="button">Cancel order</button>
        </div>
      </div>
    </details>
  `;
}

function renderFuturesDashboard() {
  if (!canUseFuturesMode()) {
    return `
      <section class="mobile-card">
        <div class="section-head">
          <div>
            <h3>Binance Futures</h3>
            <p class="muted-copy">Connect Binance in Settings before switching to futures.</p>
          </div>
        </div>
      </section>
    `;
  }

  const account = state.futuresAccount || {};
  const positions = account.positions || [];
  const openOrders = account.openOrders || [];
  return `
    ${renderFuturesBalanceGrid(account)}
    <section class="mobile-card${loadingClass(state.loadingFutures)}">
      ${state.loadingFutures ? renderSectionLoadingOverlay("Loading futures trades", "Checking positions and open orders") : ""}
      <div class="section-head">
        <div>
          <h3>Futures Trades</h3>
          <p class="muted-copy">Open Binance futures positions and orders you can manage remotely.</p>
        </div>
      </div>
      <div class="split-card futures-split">
        <div>
          <h4>Positions</h4>
          <div class="compact-list">
            ${positions.map(renderFuturesPosition).join("") || `<p class="muted-copy">No open futures positions.</p>`}
          </div>
        </div>
        <div>
          <h4>Open Orders</h4>
          <div class="compact-list">
            ${openOrders.map(renderFuturesOrder).join("") || `<p class="muted-copy">No open futures orders.</p>`}
          </div>
        </div>
      </div>
    </section>
  `;
}

function getAiRecommendations() {
  const list = [...(state.watchlistSeed || [])]
    .map((item) => ({
      symbol: item.symbol,
      price: Number(item.price || 0),
      changePercent: Number(item.changePercent ?? item.priceChangePercent ?? 0),
      volume24h: Number(item.volume24h || 0),
      turnover24h: Number(item.turnover24h || 0),
      bybitAiInsight: item.bybitAiInsight || "",
      bybitAiSource: item.bybitAiSource || "",
    }))
    .filter((item) => item.price > 0);
  if (!list.length) {
    return { topPump: null, topDip: null };
  }

  const topPump = [...list].sort((a, b) => {
    const changeDiff = Number(b.changePercent || 0) - Number(a.changePercent || 0);
    return changeDiff || Number(b.turnover24h || 0) - Number(a.turnover24h || 0);
  })[0] || null;
  const topDip = [...list].sort((a, b) => {
    const changeDiff = Number(a.changePercent || 0) - Number(b.changePercent || 0);
    return changeDiff || Number(b.turnover24h || 0) - Number(a.turnover24h || 0);
  })[0] || null;
  return { topPump, topDip };
}

function buildAiTradingHint(coin, mode) {
  if (!coin) {
    return "Waiting for market data.";
  }

  const trend = Number(coin.changePercent || 0);
  const turnover = Number(coin.turnover24h || 0);
  const turnoverText = turnover > 0 ? `${formatUsdt(turnover)} 24h turnover` : "light 24h turnover";

  if (mode === "pump") {
    if (trend >= 8) {
      return `Live read: strong upside pressure with ${turnoverText}. Watch for continuation only if buyers keep defending pullbacks.`;
    }
    if (trend >= 0) {
      return `Live read: buyers still control this tape and ${turnoverText} supports continuation.`;
    }
    return `Live read: turnover is active, but the move is no longer a clean pump.`;
  }

  if (trend <= -8) {
    return `Live read: heavy downside pressure with ${turnoverText}. This is the sharpest dip in the active watchlist.`;
  }
  if (trend < 0) {
    return `Live read: sellers still have the edge and ${turnoverText} confirms the weakness.`;
  }
  return `Live read: downside is fading, so the dip signal weakens if buyers reclaim price.`;
}

function renderAiSignalCard() {
  const { topPump, topDip } = getAiRecommendations();
  return `
    <section class="mobile-card ai-card${loadingClass(state.loadingWatchlist)}">
      ${state.loadingWatchlist ? renderSectionLoadingOverlay("Loading AI signals", "Reading market direction from live data") : ""}
      <div class="section-head">
        <div>
          <h3>Bybit Market Pulse</h3>
          <p class="muted-copy">Top pump and top dip with live Bybit analysis layered on the active spot market read.</p>
        </div>
      </div>
      <div class="ai-grid">
        <div class="ai-pick">
          <p class="eyebrow">Top Pump</p>
          <h4>${topPump ? `<button class="signal-link" data-signal-symbol="${topPump.symbol}" type="button">${topPump.symbol}</button>` : "--"}</h4>
          <p class="muted-copy">${topPump ? `${formatNumber(topPump.changePercent, 2)}% move with ${formatUsdt(topPump.turnover24h)} turnover.` : "Waiting for market data."}</p>
          <p class="muted-copy">${topPump?.bybitAiInsight || buildAiTradingHint(topPump, "pump")}</p>
        </div>
        <div class="ai-pick dip">
          <p class="eyebrow">Top Dip</p>
          <h4>${topDip ? `<button class="signal-link" data-signal-symbol="${topDip.symbol}" type="button">${topDip.symbol}</button>` : "--"}</h4>
          <p class="muted-copy">${topDip ? `${formatNumber(topDip.changePercent, 2)}% move with ${formatUsdt(topDip.turnover24h)} turnover.` : "Waiting for market data."}</p>
          <p class="muted-copy">${topDip?.bybitAiInsight || buildAiTradingHint(topDip, "dip")}</p>
        </div>
      </div>
    </section>
  `;
}

function renderSignalChartSection() {
  const symbol = getSelectedSignalSymbol();
  const candles = state.signalChart.candles || [];
  const geometry = candles.length ? getSignalChartGeometry(candles) : null;
  const summary = candles.length ? getSignalChartSummary(candles) : null;
  const guidePrice = geometry ? clampNumber(getSignalGuidePrice(candles), geometry.minPrice, geometry.maxPrice) : 0;
  const guideY = geometry ? geometry.toY(guidePrice) : 0;
  const linePath = geometry ? buildSignalLinePath(candles, geometry) : "";
  const candleMarkup = geometry ? buildSignalCandleMarkup(candles, geometry) : "";

  return `
    <section class="mobile-card signal-chart-card${state.signalChart.loading ? " is-section-loading" : ""}">
      ${state.signalChart.loading ? renderSectionLoadingOverlay("Loading chart", "Pulling live candles from the active exchange") : ""}
      <div class="section-head">
        <div>
          <h3>Signal Chart</h3>
          <p class="muted-copy">${symbol ? `${symbol} ${state.signalChart.interval} live candles from ${getExchangeLabel(getActiveExchange())}.` : "Tap Top Pump or Top Dip to load a live chart."}</p>
        </div>
      </div>
      <div class="signal-toolbar">
        <div class="signal-segmented">
          ${SIGNAL_INTERVAL_OPTIONS.map((interval) => `
            <button class="signal-mini-btn ${state.signalChart.interval === interval ? "active" : ""}" data-signal-interval="${interval}" type="button">${interval}</button>
          `).join("")}
        </div>
        <div class="signal-segmented">
          ${SIGNAL_CHART_TYPES.map((chartType) => `
            <button class="signal-mini-btn ${state.signalChart.chartType === chartType.id ? "active" : ""}" data-signal-chart-type="${chartType.id}" type="button">${chartType.label}</button>
          `).join("")}
        </div>
      </div>
      ${
        symbol && geometry
          ? `
            <div class="signal-chart-shell">
              <svg viewBox="0 0 320 180" class="signal-chart" role="img" aria-label="${symbol} live chart" data-signal-chart-svg>
                <rect x="0" y="0" width="320" height="180" rx="18" class="signal-chart-backdrop"></rect>
                <line x1="${geometry.padding.left}" y1="${guideY.toFixed(2)}" x2="${(320 - geometry.padding.right).toFixed(2)}" y2="${guideY.toFixed(2)}" class="signal-guide-line" data-signal-guide-line></line>
                ${
                  state.signalChart.chartType === "line"
                    ? `<path d="${linePath}" class="signal-chart-line ${Number(summary?.movePercent || 0) >= 0 ? "positive" : "negative"}"></path>`
                    : candleMarkup
                }
                <rect x="0" y="0" width="320" height="180" rx="18" class="signal-drag-surface" data-signal-drag-surface></rect>
                <rect x="228" y="${Math.max(guideY - 10, 8).toFixed(2)}" width="84" height="20" rx="10" class="signal-guide-pill" data-signal-guide-pill></rect>
                <text x="270" y="${Math.max(guideY + 4, 22).toFixed(2)}" text-anchor="middle" class="signal-guide-text" data-signal-guide-price>${formatNumber(guidePrice, 8)}</text>
              </svg>
              <div class="signal-price-grid">
                <div class="signal-price-chip">
                  <span>Last</span>
                  <strong>${summary?.currentPrice ? formatNumber(summary.currentPrice, 8) : "--"}</strong>
                </div>
                <div class="signal-price-chip">
                  <span>High</span>
                  <strong>${summary?.highPrice ? formatNumber(summary.highPrice, 8) : "--"}</strong>
                </div>
                <div class="signal-price-chip">
                  <span>Low</span>
                  <strong>${summary?.lowPrice ? formatNumber(summary.lowPrice, 8) : "--"}</strong>
                </div>
                <div class="signal-price-chip">
                  <span>Guide</span>
                  <strong data-signal-guide-current>${guidePrice ? formatNumber(guidePrice, 8) : "--"}</strong>
                </div>
              </div>
              <div class="signal-chart-meta">
                <strong>${symbol}</strong>
                <p class="muted-copy">Last ${summary?.currentPrice ? formatNumber(summary.currentPrice, 8) : "--"} | ${Number(summary?.movePercent || 0) >= 0 ? "+" : ""}${formatNumber(summary?.movePercent || 0, 2)}%</p>
              </div>
              <p class="muted-copy signal-guide-copy">Drag the horizontal guide line to monitor any price level on the chart.</p>
            </div>
          `
          : `<p class="muted-copy">No chart loaded yet.</p>`
      }
    </section>
  `;
}

function getPendingOrderRemainingQuantity(order) {
  const origQty = Number(order.origQty || 0);
  const executedQty = Number(order.executedQty || 0);
  return Math.max(origQty - executedQty, 0) || origQty;
}

function renderPendingOrderDisclosure(order, options = {}) {
  const { showCancel = false } = options;
  const currentPrice = Number(getTradeCurrentMarket(order.symbol).price || 0);
  const remainingQty = getPendingOrderRemainingQuantity(order);
  const entryPrice = Number(order.rawPrice || order.price || 0);
  const pnlPercent = entryPrice && currentPrice
    ? ((currentPrice - entryPrice) / entryPrice) * 100 * (order.side === "SELL" ? -1 : 1)
    : 0;
  const isExpanded = state.expandedPendingOrderIds.includes(order.orderId);
  const canCancel = showCancel && ACTIVE_API_ORDER_STATUSES.has(String(order.status || "").toUpperCase());

  return `
    <details class="trade-disclosure trade-row-rich" data-pending-order-id="${order.orderId}" data-trade-symbol-row="${order.symbol}" data-trade-entry="${entryPrice}" data-trade-side="${order.side}" data-trade-quantity="${remainingQty}" ${isExpanded ? "open" : ""}>
      <summary class="trade-summary-row">
        <div>
          <strong>${order.symbol}</strong>
          <p class="muted-copy">${renderExchangeBadge(getActiveExchange())}</p>
          <p class="muted-copy">${order.side} ${order.type} | Remaining ${formatNumber(remainingQty, 8)}</p>
        </div>
        <div class="asset-values">
          ${renderTradeStatusBadge("PENDING")}
          <strong class="${pnlPercent >= 0 ? "positive" : "negative"}" data-trade-pnl>${pnlPercent >= 0 ? "+" : ""}${formatNumber(pnlPercent, 2)}%</strong>
        </div>
      </summary>
      <div class="trade-disclosure-body">
        <div class="trade-detail-grid">
          <div class="trade-detail-pill">
            <span>Order ID</span>
            <strong>${String(order.orderId || "").slice(-8) || "--"}</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Original Qty</span>
            <strong>${formatNumber(order.origQty, 8)}</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Filled Qty</span>
            <strong>${formatNumber(order.executedQty, 8)}</strong>
          </div>
        </div>
        <div class="trade-detail-lines">
          <p class="muted-copy trade-meta-line" data-trade-entry>Entry ${entryPrice ? formatNumber(entryPrice, 8) : "Market"}</p>
          <p class="muted-copy trade-meta-line" data-trade-current>Current ${currentPrice ? formatNumber(currentPrice, 8) : "-"}</p>
          <p class="muted-copy">Live value <span data-trade-current-value>${formatUsdtUnit(remainingQty * currentPrice)}</span></p>
          <p class="muted-copy">Time in force ${order.timeInForce || "Exchange default"}</p>
          <p class="muted-copy">Status ${order.status || "NEW"}</p>
        </div>
        ${
          canCancel
            ? `
              <div class="trade-actions-inline trade-actions-stack reveal-actions">
                <button class="micro-btn danger" data-cancel-open-order="${order.orderId}" data-order-symbol="${order.symbol}" type="button">Cancel order</button>
              </div>
            `
            : ""
        }
      </div>
    </details>
  `;
}

function renderExternalHoldingDisclosure(holding) {
  const isExpanded = state.expandedTradeIds.includes(holding.id);
  return `
    <details class="trade-disclosure trade-row-rich" data-trade-id="${holding.id}" data-trade-symbol-row="${holding.symbol}" data-trade-entry="${holding.currentPrice}" data-trade-side="BUY" data-trade-quantity="${holding.quantity}" ${isExpanded ? "open" : ""}>
      <summary class="trade-summary-row">
        <div>
          <strong>${holding.symbol}</strong>
          <p class="muted-copy">${renderExchangeBadge(holding.exchange)}</p>
          <p class="muted-copy" data-trade-current-value>${formatUsdtUnit(holding.currentValue)}</p>
        </div>
        <div class="asset-values">
          ${renderTradeStatusBadge("OPEN")}
          <strong class="${holding.changePercent >= 0 ? "positive" : "negative"}">${holding.changePercent >= 0 ? "+" : ""}${formatNumber(holding.changePercent, 2)}%</strong>
        </div>
      </summary>
      <div class="trade-disclosure-body">
        <div class="trade-detail-grid">
          <div class="trade-detail-pill">
            <span>Source</span>
            <strong>Exchange</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Quantity</span>
            <strong>${formatNumber(holding.quantity, 8)}</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Asset</span>
            <strong>${holding.asset}</strong>
          </div>
        </div>
        <div class="trade-detail-lines">
          <p class="muted-copy">Detected from your live ${getExchangeLabel(holding.exchange)} balance even without an app-created trade record.</p>
          <p class="muted-copy">Current ${holding.currentPrice ? formatNumber(holding.currentPrice, 8) : "-"}</p>
          <p class="muted-copy">Live value ${formatUsdtUnit(holding.currentValue)}</p>
        </div>
      </div>
    </details>
  `;
}

function renderOpenOrdersSection() {
    const visibleTrades = state.trades.filter(isTradeVisibleOnHome);
    const openTrades = state.user?.role === "admin" ? sortRecent(visibleTrades) : visibleTrades.slice(0, 5);
    const detectedHoldings = state.user?.role === "user" ? [] : getDetectedSpotHoldings();
    const openTradeLimit = isListExpanded("home-open-trades") ? openTrades.length : 3;
    const visibleOpenTrades = openTrades.slice(0, openTradeLimit);
    const remainingOpenSlots = isListExpanded("home-open-trades") ? detectedHoldings.length : Math.max(0, 3 - visibleOpenTrades.length);
    const visibleDetectedHoldings = detectedHoldings.slice(0, remainingOpenSlots);
    const openOrders = sortRecent(state.openOrders || []);
    const visibleOpenOrders = getPreviewRecords(openOrders, "home-open-orders");
    const canManageTrades = state.user?.role === "admin";
    return `
      <section class="mobile-card split-card${loadingClass(state.loadingTrades)}">
        ${state.loadingTrades ? renderSectionLoadingOverlay("Loading trades", "Checking your open trades and orders") : ""}
        <div>
        <div class="section-head">
          <div>
            <h3>Open Trades</h3>
            <p class="muted-copy">${state.user?.role === "user" ? "Joined trade investments." : "Live spot positions you are managing."}</p>
          </div>
          ${renderListToggle("home-open-trades", openTrades.length + detectedHoldings.length)}
        </div>
        <div class="compact-list">
            ${visibleOpenTrades
              .map(
                (trade) => {
                  const pnlPercent = getTradePnlPercent(trade);
                  const currentValue = getTradeCurrentValue(trade);
                  const currentPrice = Number(getTradeCurrentMarket(trade.symbol).price || 0);
                  const targetPrice = trade.takeProfitTargetPrice || "";
                  const targetPnl = getTradeTpPnlPercent(trade, targetPrice);
                  const isJoinedInvestment = state.user?.role === "user" && trade.userInvestment?.status === "ACTIVE";
                  const isExpanded = state.expandedTradeIds.includes(trade.id);
                  return `
                    <details class="trade-disclosure trade-row-rich" data-trade-id="${trade.id}" data-trade-symbol-row="${trade.symbol}" data-trade-entry="${getTradeEntryPrice(trade)}" data-trade-side="${trade.side}" data-trade-quantity="${getTradeRemainingQuantity(trade)}" ${isExpanded ? "open" : ""}>
                      <summary class="trade-summary-row">
                        <div>
                          <strong>${trade.symbol}</strong>
                          <p class="muted-copy">${renderExchangeBadge(trade.exchange || getActiveExchange())}</p>
                          <p class="muted-copy" data-trade-current-value>${formatUsdtUnit(currentValue)}</p>
                        </div>
                        <div class="asset-values">
                          ${renderTradeStatusBadge(trade.lifecycleStatus)}
                          <strong class="${pnlPercent >= 0 ? "positive" : "negative"}" data-trade-pnl>${pnlPercent >= 0 ? "+" : ""}${formatNumber(pnlPercent, 2)}%</strong>
                          ${canManageTrades ? renderTradeJoinedUsersButton(trade) : ""}
                        </div>
                      </summary>
                      <div class="trade-disclosure-body">
                        <div class="trade-detail-grid">
                          <div class="trade-detail-pill">
                            <span>Side</span>
                            <strong>${trade.side}</strong>
                          </div>
                          <div class="trade-detail-pill">
                            <span>Type</span>
                            <strong>${trade.type}</strong>
                          </div>
                          <div class="trade-detail-pill">
                            <span>${isJoinedInvestment ? "Amount" : "Quantity"}</span>
                            <strong>${isJoinedInvestment ? formatUsdtUnit(trade.userInvestment.amountUsdt || 0) : formatNumber(getTradeRemainingQuantity(trade), 8)}</strong>
                          </div>
                        </div>
                        <div class="trade-detail-lines">
                          <p class="muted-copy trade-meta-line" data-trade-entry>Entry ${getTradeEntryPrice(trade) ? formatNumber(getTradeEntryPrice(trade), 8) : "Market"}</p>
                          <p class="muted-copy trade-meta-line" data-trade-current>Current ${currentPrice ? formatNumber(currentPrice, 8) : "-"}</p>
                          <p class="muted-copy">Live value <span data-trade-current-value>${formatUsdtUnit(currentValue)}</span></p>
                          ${
                            targetPrice
                              ? `<p class="muted-copy">TP ${formatNumber(targetPrice, 8)} <span class="${targetPnl >= 0 ? "positive" : "negative"}">${targetPnl >= 0 ? "+" : ""}${formatNumber(targetPnl, 2)}%</span></p>`
                              : `<p class="muted-copy">TP not set yet.</p>`
                          }
                        </div>
                        ${
                          canManageTrades || isJoinedInvestment
                            ? `
                              <div class="trade-actions-inline trade-actions-stack reveal-actions">
                                ${canManageTrades ? `<button class="micro-btn" data-sell-trade="${trade.id}" type="button">Sell</button>` : ""}
                                ${canManageTrades ? `<button class="micro-btn primary" data-tp-trade="${trade.id}" type="button">TP</button>` : ""}
                                ${isJoinedInvestment ? `<button class="micro-btn danger" data-stop-trade-investment="${trade.id}" type="button">Stop</button>` : ""}
                              </div>
                            `
                            : ""
                        }
                      </div>
                    </details>
                  `;
                }
              )
            .join("")}
            ${visibleDetectedHoldings.map((holding) => renderExternalHoldingDisclosure(holding)).join("")}
            ${!openTrades.length && !detectedHoldings.length ? `<p class="muted-copy">No open trades yet.</p>` : ""}
        </div>
      </div>
      <div>
        <div class="section-head">
          <div>
            <h3>Open Orders</h3>
            <p class="muted-copy">Live ${getExchangeLabel(getActiveExchange())} spot orders that are still waiting to fill.</p>
          </div>
          ${renderListToggle("home-open-orders", openOrders.length)}
        </div>
        <div class="compact-list">
          ${visibleOpenOrders.map((order) => renderPendingOrderDisclosure(order, { showCancel: true })).join("") || `<p class="muted-copy">No open orders.</p>`}
        </div>
      </div>
    </section>
  `;
}

function getAdminTradeOptionsForUsers() {
  return (state.trades || [])
    .filter((trade) => ["OPEN", "PENDING"].includes(String(trade.lifecycleStatus || "").toUpperCase()))
    .map((trade) => {
      const lifecycleStatus = String(trade.lifecycleStatus || "").toUpperCase();
      const pnlPercent = getTradePnlPercent(trade);
      const isJoinable = lifecycleStatus === "OPEN" && pnlPercent >= 0;
      return {
        ...trade,
        isJoinable,
        joinLabel: isJoinable ? "Open" : lifecycleStatus === "PENDING" ? "Queue" : "Hold",
      };
    })
    .sort((a, b) => Number(b.isJoinable) - Number(a.isJoinable));
}

function renderAdminUserCard(user) {
  const isExpanded = state.expandedAdminUserIds.includes(user.id);
  const isSuspicious = String(user.fraudReview?.status || "").toUpperCase() === "SUSPICIOUS";
  const fraudReasons = Array.isArray(user.fraudReview?.reasons) && user.fraudReview.reasons.length
    ? user.fraudReview.reasons
    : [user.fraudReview?.reason].filter(Boolean);
  const connectedExchanges = getConnectedExchanges(user);
  const revealPassword = state.revealedAdminPasswordIds.includes(user.id);
  const passwordDraft = getAdminPasswordDraft(user.id);
  const usdtWallet = getWalletFromList(user.ledgerWallets, "USDT");
  const ngnWallet = getWalletFromList(user.ledgerWallets, "NGN");
  const financeSummary = user.financeSummary || {};
  const totalBalance = financeSummary.totalBalance || {};
  const liveUsdt = Number(totalBalance.liveUsdt || totalBalance.usdt || usdtWallet.availableBalance || 0);
  const liveNgn = Number(totalBalance.liveNgnEquivalent || totalBalance.ngnEquivalent || ngnWallet.availableBalance || 0);
  const livePnl = Number(financeSummary.performance?.todayUsdt || financeSummary.mirrorPnl?.amountUsdt || 0);
  const recentTransactions = user.recentTransactions || [];
  const tradeOptions = getAdminTradeOptionsForUsers();
  return `
    <details class="trade-disclosure admin-user-card ${isSuspicious ? "fraud-review-card" : ""}" data-admin-user-id="${user.id}" ${isExpanded ? "open" : ""}>
      <summary class="trade-summary-row">
        <div>
          <strong>${escapeHtml(user.name || "User")}</strong>
          <p class="muted-copy">${escapeHtml(user.email || "")}</p>
          ${isSuspicious ? `<span class="fraud-review-badge">Review</span>` : ""}
          <div class="exchange-pill-row">${renderExchangeBadgeList(connectedExchanges)}</div>
        </div>
        <div class="admin-user-summary-actions">
          <div class="asset-values">
            <strong>${formatUsdtUnit(liveUsdt)}</strong>
            <p class="muted-copy">${formatNaira(liveNgn)}</p>
          </div>
          <button class="micro-btn icon-only-btn" data-admin-profile-open="${escapeHtml(user.id)}" type="button" aria-label="Edit profile" title="Edit profile">${icon("profile")}</button>
          <button class="micro-btn icon-only-btn" data-admin-balance-open="${escapeHtml(user.id)}" type="button" aria-label="Edit balance" title="Edit balance">${icon("edit")}</button>
        </div>
      </summary>
      <div class="trade-disclosure-body">
        ${
          isSuspicious
            ? `
              <div class="fraud-review-note">
                <div>
                  <strong>Review flag</strong>
                  <p>${escapeHtml(fraudReasons.map((reason) => String(reason || "").replace(/_/g, " ")).join(", ") || "Similar account details")}</p>
                  ${user.fraudReview?.relatedUserIds?.length ? `<p>${user.fraudReview.relatedUserIds.length} related account${user.fraudReview.relatedUserIds.length === 1 ? "" : "s"}</p>` : ""}
                </div>
                <button class="micro-btn" data-admin-review-clear="${escapeHtml(user.id)}" type="button">${icon("check")} Clear</button>
              </div>
            `
            : ""
        }
        <div class="trade-detail-grid">
          <div class="trade-detail-pill">
            <span>Live balance</span>
            <strong>${formatUsdtUnit(liveUsdt)}</strong>
          </div>
          <div class="trade-detail-pill">
            <span>P&L</span>
            <strong class="${livePnl > 0 ? "positive" : livePnl < 0 ? "negative" : "neutral"}">${livePnl >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(livePnl))}</strong>
          </div>
          <div class="trade-detail-pill">
            <span>Locked</span>
            <strong>${formatUsdtUnit(usdtWallet.lockedBalance)} / ${formatNaira(ngnWallet.lockedBalance)}</strong>
          </div>
        </div>
        <div class="trade-detail-lines">
          <p class="muted-copy">${user.mirrorEnabled ? "Mirror active" : "Mirror off"} | ${getExchangeLabel(user.activeExchange || "bybit")} | ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}</p>
          <p class="muted-copy">Connected: ${connectedExchanges.length ? connectedExchanges.map((exchange) => exchange.label).join(" and ") : "None"}</p>
          ${renderWalletDetailsList(user.walletDetails || [], "This user's connected wallet balances will show here once they sync.")}
          <div class="mini-ledger-list">
            ${recentTransactions
              .slice(0, 3)
              .map(
                (transaction) => `
                  <div class="mini-ledger-row">
                    <span>${escapeHtml(transaction.type || "TX")}</span>
                    <strong>${formatCurrencyAmount(transaction.amount, transaction.currency)}</strong>
                  </div>
                `
              )
              .join("") || `<p class="muted-copy">No ledger history yet.</p>`}
          </div>
          <form class="inline-admin-form" data-admin-bonus-form="${user.id}">
            <select name="currency" aria-label="Bonus currency">
              <option value="USDT">USDT</option>
              <option value="NGN">Naira</option>
            </select>
            <input name="amount" type="number" min="0" step="0.00000001" placeholder="Bonus" required />
            <input name="note" type="text" placeholder="Note" />
            <button class="micro-btn primary" type="submit">${icon("gift")} Add</button>
          </form>
          <form class="inline-admin-form" data-admin-user-trade-form="${user.id}">
            <select name="tradeId" aria-label="Trade">
              ${
                tradeOptions.length
                  ? tradeOptions
                      .map(
                        (trade) => `
                          <option value="${trade.id}" ${trade.isJoinable ? "" : "disabled"}>
                            ${trade.symbol} ${trade.joinLabel}
                          </option>
                        `
                      )
                      .join("")
                  : `<option value="">No open trade</option>`
              }
            </select>
            <button class="micro-btn primary" type="submit" ${tradeOptions.some((trade) => trade.isJoinable) ? "" : "disabled"}>${icon("signals")} Join</button>
          </form>
          <form class="inline-admin-form message-form" data-admin-message-form="${user.id}">
            <input name="title" type="text" placeholder="Title" value="Admin message" />
            <textarea name="message" rows="2" placeholder="Message" required></textarea>
            <button class="micro-btn" type="submit">${icon("bell")} Send</button>
          </form>
          <label>
            New password
            <input data-admin-password-input="${user.id}" type="${revealPassword ? "text" : "password"}" value="${escapeHtml(passwordDraft)}" placeholder="Set a new password" />
          </label>
        </div>
        <div class="trade-actions-inline admin-user-actions">
          <button class="micro-btn" data-admin-password-visibility="${user.id}" type="button">${revealPassword ? "Hide password" : "Show password"}</button>
          <button class="micro-btn primary" data-admin-password-save="${user.id}" type="button">Update password</button>
        </div>
        <div class="trade-actions-inline admin-user-actions">
          <button class="micro-btn ${user.mirrorEnabled ? "danger" : ""}" data-admin-toggle-mirror="${user.id}" data-admin-mirror-enabled="${user.mirrorEnabled ? "false" : "true"}" type="button">${user.mirrorEnabled ? "Disconnect mirror" : "Reconnect mirror"}</button>
          <button class="micro-btn danger" data-admin-delete-user="${user.id}" data-admin-user-name="${escapeHtml(user.name)}" type="button">Delete user</button>
        </div>
        <p class="muted-copy">Disconnecting mirror stops future admin trades from syncing into this account. Existing exchange orders stay untouched until you manage them directly.</p>
      </div>
    </details>
  `;
}

function renderWalletDetailsList(walletDetails, emptyCopy) {
  if (!(walletDetails || []).length) {
    return `<p class="muted-copy">${emptyCopy}</p>`;
  }

  return `
    <div class="wallet-detail-list">
      ${(walletDetails || [])
        .map(
          (wallet) => `
            <div class="wallet-detail-card">
              <div class="wallet-detail-head">
                <strong>${wallet.label}</strong>
                <span class="muted-copy">${wallet.error ? "Sync issue" : `${wallet.assetCount || 0} assets`}</span>
              </div>
              ${
                wallet.error
                  ? `<p class="muted-copy">${wallet.error}</p>`
                  : `
                    <p class="muted-copy">Wallet balance ${formatUsdt(wallet.totalUsdt || 0)}${Number(wallet.totalNgn || 0) > 0 ? ` | ${formatNaira(wallet.totalNgn || 0)}` : ""}</p>
                    <p class="muted-copy">Top assets ${(wallet.topAssets || []).map((asset) => `${asset.asset} ${formatUsdt(asset.usdtValue || 0)}`).join(", ") || "None yet"}</p>
                    ${
                      Number(wallet.referenceMinTradeUsdt || 0) > 0
                        ? `
                          <p class="muted-copy ${wallet.belowReferenceMinTrade ? "warning-copy" : ""}">
                            Mirror buy balance ${formatUsdtUnit(wallet.availableQuoteUsdt || 0)} stablecoin available. ${wallet.label} guide starts around ${formatUsdtUnit(wallet.referenceMinTradeUsdt || 0)} before symbol-level checks.
                          </p>
                          <p class="muted-copy">${wallet.minimumTradeNote || ""}</p>
                        `
                        : ""
                    }
                  `
              }
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderMirrorMinimumNotice() {
  const activeExchange = getActiveExchange();
  const activeExchangeLabel = getExchangeLabel(activeExchange);
  const activeGuidance = getSpotMirrorGuidance(activeExchange);
  const activeBalance = getStablecoinBuyingBalance(state.balances || []);
  const hasActiveConnection = !!state.user?.exchangeAccounts?.[activeExchange];
  let activeStatusCopy = `Connect ${activeExchangeLabel} to show a live mirror-buy balance check here.`;

  if (hasActiveConnection) {
    activeStatusCopy =
      activeBalance < activeGuidance.referenceMinUsdt
        ? `${activeExchangeLabel} stablecoin buying balance is ${formatUsdtUnit(activeBalance)}. That is below the ${formatUsdtUnit(activeGuidance.referenceMinUsdt)} guide, so mirror buys can be skipped when the symbol minimum is higher than your free balance.`
        : `${activeExchangeLabel} stablecoin buying balance is ${formatUsdtUnit(activeBalance)}. That is above the ${formatUsdtUnit(activeGuidance.referenceMinUsdt)} guide, but the live symbol rule still decides whether each mirror order can be placed.`;
  }

  return `
    <div class="mirror-guide-card">
      <div class="mirror-guide-head">
        <strong>Mirror Spot Minimums</strong>
        <span class="muted-copy">Pair rules still win</span>
      </div>
      <p class="muted-copy ${hasActiveConnection && activeBalance < activeGuidance.referenceMinUsdt ? "warning-copy" : ""}">
        ${activeStatusCopy}
      </p>
      <div class="mirror-guide-grid">
        ${EXCHANGE_OPTIONS.map((exchange) => {
          const guidance = getSpotMirrorGuidance(exchange.id);
          return `
            <div class="mirror-guide-pill">
              <strong>${exchange.label}</strong>
              <p class="muted-copy">Guide ${formatUsdtUnit(guidance.referenceMinUsdt)} for many USDT spot buys.</p>
              <p class="muted-copy">Live rule: ${guidance.ruleLabel}</p>
            </div>
          `;
        }).join("")}
      </div>
      <p class="muted-copy">If your free quote balance or normalized quantity falls below the live exchange minimum for the symbol being mirrored, the app skips that mirror order instead of forcing a rejected spot trade.</p>
    </div>
  `;
}

function renderCurrentUserWalletSummary() {
  const activeExchange = getActiveExchange();
  const activeExchangeLabel = getExchangeLabel(activeExchange);
  const activeGuidance = getSpotMirrorGuidance(activeExchange);
  const activeStablecoinBalance = getStablecoinBuyingBalance(state.balances || []);
  const connectedWallets = (state.user?.exchangeAccounts ? EXCHANGE_OPTIONS : [])
    .filter((exchange) => state.user?.exchangeAccounts?.[exchange.id])
    .map((exchange) => {
      if (exchange.id === activeExchange) {
        return {
          label: exchange.label,
          totalUsdt: state.totalUsdt,
          totalNgn: state.totalNgn,
          assetCount: (state.balances || []).length,
          topAssets: (state.balances || []).slice(0, 3),
          availableQuoteUsdt: activeStablecoinBalance,
          referenceMinTradeUsdt: activeGuidance.referenceMinUsdt,
          minimumTradeNote: activeGuidance.copy,
          belowReferenceMinTrade: activeStablecoinBalance < activeGuidance.referenceMinUsdt,
          error: null,
        };
      }

      return {
        label: exchange.label,
        totalUsdt: 0,
        totalNgn: 0,
        assetCount: 0,
        topAssets: [],
        error: `Switch the active exchange to ${exchange.label} to load its live wallet balance here.`,
      };
    });

  return `
    <div class="asset-card">
      <div>
        <strong>${state.user.name}</strong>
        <p class="muted-copy">${state.user.email}</p>
        <p class="muted-copy">${renderExchangeBadge(activeExchange)}</p>
      </div>
      <div class="asset-values">
        <strong>${state.user.exchangeConnected ? `${activeExchangeLabel} linked` : `No ${activeExchangeLabel} linked`}</strong>
        <p class="muted-copy">${state.user.mirrorEnabled ? "Mirroring enabled" : "Mirroring disabled"}</p>
      </div>
    </div>
    ${renderWalletDetailsList(connectedWallets, `Connect ${activeExchangeLabel} to load your wallet balance.`)}
  `;
}

function renderVtuQuickActions() {
  if (state.user?.role !== "user") {
    return "";
  }
  const settings = state.vtuSettings || getFinancialSettings().vtu || {};
  const digitalSettings = state.digitalServices.settings || getFinancialSettings().digitalServices || {};
  if (!digitalSettings.enabled && (!settings.configured || (!settings.airtimeEnabled && !settings.dataEnabled))) {
    return "";
  }
  return `
    <section class="mobile-card vtu-service-strip" data-section="vtu">
      <div class="section-head compact">
        <div>
          <h3>Services</h3>
          <p class="muted-copy">Digital tools, transfer, airtime and data</p>
        </div>
      </div>
      <div class="vtu-action-grid">
        <button class="service-action-btn digital-service-entry" data-tab="store" type="button" ${digitalSettings.enabled === false ? "disabled" : ""}>
          <span>${icon("gift")}</span>
          <strong>Store</strong>
        </button>
        <button class="service-action-btn" data-transfer-open type="button">
          <span>${icon("bank")}</span>
          <strong>Transfer</strong>
        </button>
        <button class="service-action-btn" data-vtu-open="airtime" type="button" ${settings.airtimeEnabled ? "" : "disabled"}>
          <span>${icon("phone")}</span>
          <strong>Airtime</strong>
        </button>
        <button class="service-action-btn" data-vtu-open="data" type="button" ${settings.dataEnabled ? "" : "disabled"}>
          <span>${icon("wifi")}</span>
          <strong>Internet</strong>
        </button>
      </div>
    </section>
  `;
}

function renderAdminDepositCard(deposit) {
  const currency = deposit.currency || "USDT";
  const reference = deposit.transactionHash || deposit.bankReference || "";
  const equivalent = formatRecordEquivalent(deposit, currency);
  const historyKey = financeHistoryKey("deposit", deposit.id);
  return `
    <div class="asset-card admin-finance-card">
      <label class="history-checkbox finance-history-checkbox" aria-label="Select deposit">
        <input type="checkbox" data-finance-history-kind="deposit" data-finance-history-id="${deposit.id}" ${
          state.selectedFinanceHistoryIds.includes(historyKey) ? "checked" : ""
        } />
        <span></span>
      </label>
      <div>
        <strong>${escapeHtml(deposit.user?.name || "Unknown user")}</strong>
        <p class="muted-copy">${escapeHtml(deposit.user?.email || "")}</p>
        <p class="muted-copy">${formatCurrencyAmount(deposit.amount, currency)}${deposit.network ? ` | ${escapeHtml(deposit.network)}` : ""}</p>
        ${equivalent ? `<p class="muted-copy">Eq ${equivalent}</p>` : ""}
        <p class="muted-copy">Ref: ${escapeHtml(reference || "Not provided")}</p>
      </div>
      <div class="asset-values">
        <strong>${escapeHtml(deposit.status)}</strong>
        <p class="muted-copy">${deposit.submittedAt ? new Date(deposit.submittedAt).toLocaleString() : ""}</p>
        ${
          deposit.status === "PENDING"
            ? `
              <div class="trade-actions-inline admin-user-actions">
                <button class="micro-btn primary" data-admin-deposit-approve="${deposit.id}" type="button">Approve</button>
                <button class="micro-btn danger" data-admin-deposit-reject="${deposit.id}" type="button">Reject</button>
              </div>
            `
            : ""
        }
      </div>
    </div>
  `;
}

function renderAdminWithdrawalCard(withdrawal) {
  const destination = withdrawal.bank || withdrawal.destination || {};
  const fraudReview = withdrawal.fraudReview || {};
  const isSuspicious = String(fraudReview.status || "").toUpperCase() === "SUSPICIOUS";
  const destinationCopy = destination.type === "NGN_BANK"
    ? `${destination.bankName || ""} ${destination.maskedAccountNumber || destination.accountNumber || ""}`.trim()
    : `${destination.network || ""} ${destination.address || ""}`.trim();
  const fundingCopy = (withdrawal.fundingSources || [])
    .map((source) => formatCurrencyAmount(source.amount, source.currency))
    .join(" + ");
  const equivalent = formatRecordEquivalent(withdrawal, withdrawal.currency);
  const debitedAmount = withdrawal.requestedAmount || withdrawal.amount;
  const feeAmount = withdrawal.fee || "0";
  const payoutAmount = withdrawal.netAmount || withdrawal.amount;
  const historyKey = financeHistoryKey("withdrawal", withdrawal.id);
  const isNgnBankWithdrawal = withdrawal.currency === "NGN" && destination.type === "NGN_BANK";
  const status = String(withdrawal.status || "").trim().toUpperCase();
  const paystackMeta = withdrawal.metadata || {};
  const legacyUnpaidReviewedSuccess = isNgnBankWithdrawal && status === "SUCCESS" && paystackMeta.reviewedApprovalAt && !paystackMeta.paystackStatus && !withdrawal.paystackTransferCode;
  const canApprove = isNgnBankWithdrawal && (["PENDING", "APPROVED", "PROCESSING"].includes(status) || legacyUnpaidReviewedSuccess);
  const approveCopy = status === "PENDING" ? "Approve" : status === "PROCESSING" ? "Sync" : "Retry";
  const canProcess = status === "PENDING" && !isNgnBankWithdrawal;
  const canFinalize = ["PENDING", "PROCESSING"].includes(status) && !isNgnBankWithdrawal;
  const canReject = status === "PENDING" || (status === "APPROVED" && !paystackMeta.paystackTransferAttemptedAt && !withdrawal.paystackTransferCode);
  return `
    <div class="asset-card admin-finance-card ${isSuspicious ? "fraud-review-card" : ""}" data-finance-withdrawal-id="${escapeHtml(withdrawal.id || "")}">
      <label class="history-checkbox finance-history-checkbox" aria-label="Select withdrawal">
        <input type="checkbox" data-finance-history-kind="withdrawal" data-finance-history-id="${withdrawal.id}" ${
          state.selectedFinanceHistoryIds.includes(historyKey) ? "checked" : ""
        } />
        <span></span>
      </label>
      <div>
        <strong>${escapeHtml(withdrawal.user?.name || "Unknown user")}</strong>
        <p class="muted-copy">${escapeHtml(withdrawal.user?.email || "")}</p>
        <p class="muted-copy">${withdrawal.currency === "NGN" ? `Debited ${formatNaira(debitedAmount)}` : formatUsdtUnit(withdrawal.amount)}</p>
        ${withdrawal.currency === "NGN" ? `<p class="muted-copy">Pay ${formatNaira(payoutAmount)} | Fee ${formatNaira(feeAmount)}</p>` : ""}
        ${isSuspicious ? `<p class="fraud-review-line">Name mismatch${fraudReview.relatedUserIds?.length ? ` | ${fraudReview.relatedUserIds.length} related` : ""}</p>` : ""}
        ${equivalent ? `<p class="muted-copy">Eq ${equivalent}</p>` : ""}
        ${fundingCopy ? `<p class="muted-copy">From ${fundingCopy}</p>` : ""}
        <p class="muted-copy">${escapeHtml(destinationCopy || "Destination unavailable")}</p>
      </div>
      <div class="asset-values">
        ${isSuspicious ? `<span class="fraud-review-badge">Fraud review</span>` : ""}
        <span class="wallet-status-badge ${walletStatusClass(withdrawal.status)}">${escapeHtml(formatWalletRequestStatus(withdrawal.status))}</span>
        <p class="muted-copy">${withdrawal.submittedAt ? new Date(withdrawal.submittedAt).toLocaleString() : ""}</p>
        ${
          canApprove || canProcess || canFinalize || canReject
            ? `
              <div class="trade-actions-inline admin-user-actions">
                ${canApprove ? `<button class="micro-btn primary" data-admin-withdrawal-approve="${withdrawal.id}" type="button">${approveCopy}</button>` : ""}
                ${canProcess ? `<button class="micro-btn" data-admin-withdrawal-process="${withdrawal.id}" type="button">Process</button>` : ""}
                ${canFinalize ? `<button class="micro-btn primary" data-admin-withdrawal-complete="${withdrawal.id}" type="button">Complete</button>` : ""}
                ${canReject ? `<button class="micro-btn danger" data-admin-withdrawal-reject="${withdrawal.id}" type="button">Reject</button>` : ""}
              </div>
            `
            : ""
        }
      </div>
      <button class="withdrawal-detail-toggle" data-admin-withdrawal-details="${escapeHtml(withdrawal.id || "")}" type="button">
        <span>Details</span>
        ${icon("chevronDown")}
      </button>
    </div>
  `;
}

function renderAdminTransactionCard(transaction) {
  const historyKey = financeHistoryKey("transaction", transaction.id);
  const equivalent = formatRecordEquivalent(transaction, transaction.currency);
  return `
    <div class="asset-card admin-finance-card">
      <label class="history-checkbox finance-history-checkbox" aria-label="Select transaction">
        <input type="checkbox" data-finance-history-kind="transaction" data-finance-history-id="${transaction.id}" ${
          state.selectedFinanceHistoryIds.includes(historyKey) ? "checked" : ""
        } />
        <span></span>
      </label>
      <div>
        <strong>${escapeHtml(transaction.user?.name || "Unknown user")}</strong>
        <p class="muted-copy">${escapeHtml(transaction.type || "Transaction")} | ${escapeHtml(transaction.status || "")}</p>
        ${equivalent ? `<p class="muted-copy">Eq ${equivalent}</p>` : ""}
        <p class="muted-copy">${escapeHtml(transaction.description || transaction.reference || "")}</p>
      </div>
      <div class="asset-values">
        <strong>${formatCurrencyAmount(transaction.amount, transaction.currency)}</strong>
        <p class="muted-copy">${transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : ""}</p>
      </div>
    </div>
  `;
}

function renderAdminVtuTransactionCard(transaction) {
  const historyKey = financeHistoryKey("vtu", transaction.id);
  const status = String(transaction.status || "processing").toUpperCase();
  const product = String(transaction.productType || "vtu").toUpperCase();
  const canRequery = ["INITIATED", "PROCESSING"].includes(status);
  return `
    <div class="asset-card admin-finance-card">
      <label class="history-checkbox finance-history-checkbox" aria-label="Select VTU transaction">
        <input type="checkbox" data-finance-history-kind="vtu" data-finance-history-id="${transaction.id}" ${
          state.selectedFinanceHistoryIds.includes(historyKey) ? "checked" : ""
        } />
        <span></span>
      </label>
      <div>
        <strong>${escapeHtml(transaction.user?.name || "Unknown user")}</strong>
        <p class="muted-copy">${product} | ${escapeHtml(String(transaction.network || "").toUpperCase())} ${escapeHtml(transaction.phone || "")}</p>
        <p class="muted-copy">${escapeHtml(transaction.planName || transaction.requestId || "")}</p>
      </div>
      <div class="asset-values">
        <strong>${formatNaira(transaction.amountCharged || 0)}</strong>
        <span class="wallet-status-badge ${walletStatusClass(status)}">${escapeHtml(formatWalletRequestStatus(status))}</span>
        <p class="muted-copy">${transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : ""}</p>
        ${canRequery ? `<button class="micro-btn" data-admin-vtu-requery="${escapeHtml(transaction.id)}" type="button">${icon("refresh")} Check</button>` : ""}
      </div>
    </div>
  `;
}

function formatGiftCardCode(code) {
  return String(code || "").replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function renderAdminGiftCardCard(card) {
  const used = String(card.status || "").toUpperCase() === "USED";
  return `
    <div class="asset-card admin-finance-card gift-card-row">
      <div>
        <strong>${formatCurrencyAmount(card.amount, card.currency || "NGN")}</strong>
        <p class="muted-copy">${escapeHtml(card.note || "Netrue Gift Card")}</p>
        <div class="copy-value-row">
          <code>${escapeHtml(formatGiftCardCode(card.code))}</code>
          ${renderCopyButton(card.code, "Copy gift card number")}
        </div>
        ${card.isQuestReward || card.rewardPool === "quest" ? `<p class="muted-copy">Quest pool${card.pin ? ` | PIN ${escapeHtml(card.pin)}` : ""}</p>` : ""}
      </div>
      <div class="asset-values">
        <span class="wallet-status-badge ${used ? "wallet-status-success" : "wallet-status-pending"}">${used ? "Used" : "Unused"}</span>
        <p class="muted-copy">${used ? escapeHtml(card.redeemedByName || card.redeemedByEmail || "Redeemed") : "Ready"}</p>
      </div>
    </div>
  `;
}

function renderAdminGiftCardsPanel() {
  const usedCount = (state.adminGiftCards || []).filter((card) => String(card.status || "").toUpperCase() === "USED").length;
  const cards = sortRecent(state.adminGiftCards || []);
  const visibleCards = getPreviewRecords(cards, "admin-gift-cards");
  return `
    <div class="admin-gift-card-panel">
      <div class="section-head compact">
        <div>
          <p class="eyebrow">Gift Cards</p>
          <p class="muted-copy">${usedCount}/${state.adminGiftCards.length} used.</p>
        </div>
        ${renderListToggle("admin-gift-cards", cards.length)}
      </div>
      <form class="inline-admin-form" id="admin-gift-card-form">
        <select name="currency" aria-label="Gift card currency">
          <option value="NGN">Naira</option>
          <option value="USDT">USDT</option>
        </select>
        <select name="rewardPool" aria-label="Gift card pool">
          <option value="standard">Standard</option>
          <option value="quest">Quest reward</option>
        </select>
        <input name="amount" type="number" min="1" step="0.00000001" placeholder="Amount" required />
        <input name="note" type="text" placeholder="Note" />
        <button class="micro-btn primary" type="submit">${icon("gift")} Generate</button>
      </form>
      <div class="compact-list">
        ${visibleCards.map(renderAdminGiftCardCard).join("") || `<p class="muted-copy">No gift cards yet.</p>`}
      </div>
    </div>
  `;
}

function renderAdminDigitalServicesPanel() {
  const adminPayload = state.digitalServices.admin || {};
  const settings = adminPayload.settings || state.digitalServices.settings || {};
  const summary = adminPayload.summary || {};
  const products = adminPayload.products || state.digitalServices.products || [];
  const orders = adminPayload.orders || state.digitalServices.orders || [];
  const supplier = adminPayload.supplier || {};
  return `
    <div class="admin-digital-panel">
      <form id="admin-digital-services-settings-form" class="stack-form subtle-form progressive-settings-form">
        <div class="settings-status-grid">
          <span class="wallet-status-badge ${supplier.configured ? "wallet-status-success" : "wallet-status-pending"}">${supplier.configured ? "Supplier ready" : "API key missing"}</span>
          <span class="muted-copy">${Number(summary.productCount || products.length || 0).toLocaleString()} products</span>
        </div>
        <label>
          Digital Services
          <select name="enabled">
            <option value="true" ${settings.enabled ? "selected" : ""}>Enabled</option>
            <option value="false" ${!settings.enabled ? "selected" : ""}>Disabled</option>
          </select>
        </label>
        <label>Global markup % <input name="globalMarkupPercent" type="number" min="0" max="100" step="0.01" value="${escapeHtml(settings.globalMarkupPercent || "0")}" /></label>
        <label>Allowed image domains <input name="allowedImageDomains" value="${escapeHtml((settings.allowedImageDomains || ["akunding.shop"]).join(", "))}" placeholder="akunding.shop" /></label>
        <div class="modal-actions inline-modal-actions">
          <button class="button-secondary" id="admin-digital-services-sync-btn" type="button">${icon("refresh")} Sync products</button>
          <button class="button-primary shimmer-button" type="submit">${icon("settings")} Save</button>
        </div>
      </form>
      <div class="admin-digital-summary">
        <div><span>Today</span><strong>${Number(summary.ordersToday || 0).toLocaleString()}</strong></div>
        <div><span>Revenue</span><strong>${formatNaira(summary.revenue || 0)}</strong></div>
        <div><span>Profit</span><strong>${formatNaira(summary.profit || 0)}</strong></div>
      </div>
      <details class="settings-disclosure nested-disclosure" open>
        <summary><span>${icon("gift")}</span><strong>Product Overrides</strong></summary>
        <div class="admin-digital-product-list">
          ${products.slice(0, 20).map(renderAdminDigitalProductForm).join("") || `<p class="muted-copy">Sync products to manage Digital Services.</p>`}
        </div>
      </details>
      <details class="settings-disclosure nested-disclosure">
        <summary><span>${icon("profile")}</span><strong>Recent Orders</strong></summary>
        <div class="compact-list">
          ${orders.slice(0, 12).map(renderAdminDigitalOrderRow).join("") || `<p class="muted-copy">No Digital Services order yet.</p>`}
        </div>
      </details>
    </div>
  `;
}

function renderAdminDigitalProductForm(product = {}) {
  const override = product.override || {};
  const supplierCurrency = String(product.supplierCurrency || product.currency || "NGN").toUpperCase();
  const sourcePrice = product.providerCost && supplierCurrency !== "NGN"
    ? ` (${escapeHtml(product.providerCost)} ${escapeHtml(supplierCurrency)})`
    : "";
  const supplierStatus = product.supplierAvailable === false ? "Supplier unavailable" : "Supplier available";
  return `
    <form class="admin-digital-product-card" data-admin-digital-product-form="${escapeHtml(product.id || "")}">
      ${renderDigitalServiceImage(product)}
      <div class="admin-digital-product-main">
        <strong>${escapeHtml(product.name || "Digital Service")}</strong>
        <div class="admin-digital-price-row">
          <span><small>API cost</small><b>${formatNaira(product.providerCostNgn || 0)}${sourcePrice}</b></span>
          <span><small>Store price</small><b>${formatNaira(product.sellingPrice || product.price || 0)}</b></span>
          <em class="${product.supplierAvailable === false ? "warning-copy" : "success-copy"}">${supplierStatus}</em>
        </div>
        <div class="admin-digital-product-grid">
          <label>Name <input name="displayName" value="${escapeHtml(override.displayName || "")}" placeholder="${escapeHtml(product.name || "")}" /></label>
          <label>Image <input name="customImageUrl" value="${escapeHtml(override.customImageUrl || "")}" placeholder="https://..." /></label>
          <label>Status
            <select name="enabled">
              <option value="true" ${override.enabled !== false ? "selected" : ""}>Enabled</option>
              <option value="false" ${override.enabled === false ? "selected" : ""}>Disabled</option>
            </select>
          </label>
          <label>Featured
            <select name="featured">
              <option value="false" ${!override.featured ? "selected" : ""}>No</option>
              <option value="true" ${override.featured ? "selected" : ""}>Yes</option>
            </select>
          </label>
          <label>Markup mode
            <select name="markupMode">
              ${["percentage", "fixed", "custom"].map((mode) => `<option value="${mode}" ${String(override.markupMode || "percentage") === mode ? "selected" : ""}>${mode}</option>`).join("")}
            </select>
          </label>
          <label>Markup value <input name="markupValue" type="number" min="0" step="0.01" value="${escapeHtml(override.markupValue || "0")}" /></label>
          <label>Custom price <input name="customPriceNgn" type="number" min="0" step="1" value="${escapeHtml(override.customPriceNgn || "0")}" /></label>
          <label>Order <input name="order" type="number" min="0" step="1" value="${escapeHtml(override.order || "0")}" /></label>
        </div>
        <div class="modal-actions inline-modal-actions admin-digital-product-actions">
          <button class="button-secondary" data-admin-digital-product-refresh="${escapeHtml(product.id || "")}" type="button">${icon("refresh")} Fetch API price</button>
          <button class="micro-btn primary" type="submit">${icon("check")} Save product</button>
        </div>
      </div>
    </form>
  `;
}

function renderAdminDigitalOrderRow(order = {}) {
  const status = String(order.status || "processing").toUpperCase();
  const canRequery = ["PAYMENT_RESERVED", "SUBMITTED", "PROCESSING"].includes(status) && order.supplierOrderId;
  return `
    <div class="asset-card admin-finance-card">
      <div>
        <strong>${escapeHtml(order.productName || "Digital service")}</strong>
        <p class="muted-copy">${escapeHtml(order.user?.name || "User")} | ${escapeHtml(order.user?.email || "")}</p>
        <p class="muted-copy">Ref: ${escapeHtml(order.requestId || "")}</p>
      </div>
      <div class="asset-values">
        <span class="wallet-status-badge ${walletStatusClass(status)}">${escapeHtml(formatWalletRequestStatus(status))}</span>
        <strong>${formatNaira(order.amountCharged || 0)}</strong>
        ${canRequery ? `<button class="micro-btn" data-admin-digital-order-requery="${escapeHtml(order.id || "")}" type="button">${icon("refresh")} Requery</button>` : ""}
      </div>
    </div>
  `;
}

function renderAdminReferralPanel() {
  const payload = state.adminReferrals || state.financialDashboard?.referral || {};
  const settings = payload.settings || getReferralSettings();
  const stats = payload.stats || {};
  const referrals = payload.referrals || [];
  const total = Number(payload.total || referrals.length || 0);
  const limit = Number(payload.limit || 25);
  const offset = Number(payload.offset || 0);
  const previousOffset = Math.max(0, offset - limit);
  const nextOffset = offset + limit;
  const progressAmount = (progress = {}) => `${formatNaira(progress.amount || 0).replace(".00", "")} / ${formatNaira(progress.required || 0).replace(".00", "")}`;
  return `
    <div class="admin-referral-panel">
      <div class="admin-referral-stats">
        <div><span>Total Referrals</span><strong>${Number(stats.totalReferrals || 0).toLocaleString()}</strong></div>
        <div><span>Qualified</span><strong>${Number(stats.qualifiedReferrals || 0).toLocaleString()}</strong></div>
        <div><span>Pending</span><strong>${Number(stats.pendingReferrals || 0).toLocaleString()}</strong></div>
        <div><span>Rewards Paid</span><strong>${Number(stats.rewardsPaid || 0).toLocaleString()}</strong></div>
        <div><span>Total Payout</span><strong>${formatNaira(stats.totalReferralPayout || 0)}</strong></div>
      </div>
      <form id="admin-referral-settings-form" class="stack-form subtle-form progressive-settings-form">
        <label>Referral Program
          <select name="enabled">
            <option value="true" ${settings.enabled !== false ? "selected" : ""}>Enabled</option>
            <option value="false" ${settings.enabled === false ? "selected" : ""}>Disabled</option>
          </select>
        </label>
        <label>Referral Bonus Amount <input name="bonusAmountNgn" type="number" min="0" step="1" value="${escapeHtml(settings.bonusAmountNgn || "500")}" /></label>
        <label>Minimum Deposit <input name="minimumDepositNgn" type="number" min="0" step="1" value="${escapeHtml(settings.minimumDepositNgn || "2000")}" /></label>
        <label>Minimum Airtime/Data Spend <input name="minimumSpendNgn" type="number" min="0" step="1" value="${escapeHtml(settings.minimumSpendNgn || "2000")}" /></label>
        <label>Minimum Joined Trades <input name="minimumTrades" type="number" min="0" step="1" value="${escapeHtml(settings.minimumTrades ?? 2)}" /></label>
        <label>Maximum Referral Earnings <input name="maximumEarningsNgn" type="number" min="0" step="1" value="${escapeHtml(settings.maximumEarningsNgn || "100000")}" /></label>
        <label>Campaign Display Maximum <input name="campaignMaximumNgn" type="number" min="0" step="1" value="${escapeHtml(settings.campaignMaximumNgn || settings.maximumEarningsNgn || "100000")}" /></label>
        <button class="button-primary shimmer-button" type="submit">${icon("settings")} Save Referral Settings</button>
      </form>
      <div class="admin-referral-table-wrap">
        <table class="admin-referral-table">
          <thead>
            <tr>
              <th>Referrer</th>
              <th>Referred User</th>
              <th>Deposit</th>
              <th>Spend</th>
              <th>Trades</th>
              <th>Status</th>
              <th>Reward</th>
              <th>Dates</th>
            </tr>
          </thead>
          <tbody>
            ${
              referrals.map((referral) => `
                <tr>
                  <td><strong>${escapeHtml(referral.referrer?.name || "User")}</strong><small>${escapeHtml(referral.referrer?.email || "")}</small></td>
                  <td><strong>${escapeHtml(referral.referredUser?.name || "User")}</strong><small>${escapeHtml(referral.referredUser?.email || "")}</small></td>
                  <td>${progressAmount(referral.depositProgress)}</td>
                  <td>${progressAmount(referral.spendProgress)}</td>
                  <td>${Number(referral.tradeProgress?.count || 0)} / ${Number(referral.tradeProgress?.required || 0)}</td>
                  <td><span class="wallet-status-badge ${walletStatusClass(referral.status)}">${escapeHtml(formatReferralStatus(referral.status))}</span></td>
                  <td>${formatNaira(referral.rewardAmount || 0)}</td>
                  <td><small>${referral.rewardedAt ? `Rewarded ${new Date(referral.rewardedAt).toLocaleDateString()}` : "Not rewarded"}</small><small>Created ${referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : "-"}</small></td>
                </tr>
              `).join("") || `<tr><td colspan="8">No referrals yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>
      <div class="referral-pagination">
        <button class="button-secondary" data-admin-referral-page="${previousOffset}" type="button" ${offset <= 0 ? "disabled" : ""}>Previous</button>
        <span>${total ? `${offset + 1}-${Math.min(total, offset + limit)} of ${total}` : "0 referrals"}</span>
        <button class="button-secondary" data-admin-referral-page="${nextOffset}" type="button" ${nextOffset >= total ? "disabled" : ""}>Next</button>
      </div>
    </div>
  `;
}

function renderAdminSettingsOverview() {
  if (state.user.role !== "admin") {
    return "";
  }
  const totalUsers = Number(state.users?.length || 0);
  const pendingDeposits = (state.adminDeposits || []).filter((item) => String(item.status || "").toUpperCase() === "PENDING").length;
  const pendingWithdrawals = (state.adminWithdrawals || []).filter((item) => ["PENDING", "PROCESSING"].includes(String(item.status || "").toUpperCase())).length;
  const activeGiftCards = (state.adminGiftCards || []).filter((card) => String(card.status || "").toUpperCase() !== "USED").length;
  const referralStats = state.adminReferrals?.stats || state.financialDashboard?.referral?.stats || {};
  return `
    <section class="mobile-card settings-card admin-settings-overview">
      <div class="section-head">
        <div>
          <h3>Admin Controls</h3>
          <p class="muted-copy">Fast access</p>
        </div>
      </div>
      <div class="admin-control-grid">
        <button class="admin-control-tile" data-admin-users-open type="button">
          <span class="card-icon">${icon("profile")}</span>
          <strong>${totalUsers.toLocaleString()}</strong>
          <small>Users</small>
        </button>
        <button class="admin-control-tile" data-tab="history" type="button">
          <span class="card-icon">${icon("bank")}</span>
          <strong>${(pendingDeposits + pendingWithdrawals).toLocaleString()}</strong>
          <small>Finance</small>
        </button>
        <div class="admin-control-tile passive">
          <span class="card-icon">${icon("gift")}</span>
          <strong>${activeGiftCards.toLocaleString()}</strong>
          <small>Gift cards</small>
        </div>
        <div class="admin-control-tile passive">
          <span class="card-icon">${icon("users")}</span>
          <strong>${Number(referralStats.rewardsPaid || 0).toLocaleString()}</strong>
          <small>Referral rewards</small>
        </div>
        <button class="admin-control-tile" data-tab="adminQuests" type="button">
          <span class="card-icon">${icon("star")}</span>
          <strong>Quest</strong>
          <small>Rewards</small>
        </button>
        <div class="admin-control-tile passive">
          <span class="card-icon">${icon("settings")}</span>
          <strong>${getExchangeLabel(getAdminDashboardExchange())}</strong>
          <small>Exchange</small>
        </div>
      </div>
    </section>
  `;
}

function renderQuestPromoBanner() {
  if (state.user?.role !== "user") {
    return "";
  }
  const status = state.quest.status || {};
  const cooldown = Number(status.cooldownRemainingMs || 0);
  const cooldownHours = cooldown > 0 ? Math.ceil(cooldown / (60 * 60 * 1000)) : 0;
  const label = status.canStart ? "Play now" : cooldownHours ? `${cooldownHours}h left` : status.activeSession ? "Resume" : "Check";
  return `
    <button class="quest-ad-card" data-open-quest type="button" aria-label="Open Netrue Quest">
      <img src="/netrue-quest-ad.png" alt="Netrue Quest. Play to win Netrue gift cards." />
      <span>${label}</span>
    </button>
  `;
}

function renderQuestRewardCard(reward = {}) {
  const revealed = !!reward.code;
  const used = ["USED", "REDEEMED"].includes(String(reward.status || "").toUpperCase());
  return `
    <section class="quest-prize-stage">
      <div class="quest-confetti" aria-hidden="true">
        ${Array.from({ length: 18 }).map((_, index) => `<i style="--i:${index};"></i>`).join("")}
      </div>
      <div class="quest-ribbon-wrap" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div class="quest-congrats-panel">
        <span>${icon("star")}</span>
        <strong>${revealed ? "Prize Revealed" : "You Won"}</strong>
        <small>${revealed ? "Scratch complete" : "Scratch the PIN area"}</small>
      </div>
      <div class="quest-gift-card ${revealed ? "revealed" : ""}">
        <div class="quest-gift-card-band">
          <span>NetrueFi</span>
          <b>Gift Card</b>
        </div>
        <div class="quest-gift-card-body">
          <p>${escapeHtml(reward.note || "Quest Reward")}</p>
          <strong>${formatCurrencyAmount(reward.amount || "0", reward.currency || "NGN")}</strong>
        </div>
        <div class="quest-gift-card-code">
          <span>Card Number</span>
          <b>${revealed ? escapeHtml(formatGiftCardCode(reward.code)) : "---- ---- ---- --"}</b>
        </div>
        ${
          revealed
            ? `
              <div class="quest-pin-revealed">
                <span>PIN</span>
                <b>${escapeHtml(reward.pin || "------")}</b>
              </div>
            `
            : `
              <button class="quest-scratch-mask" data-quest-reveal type="button">
                <span>Scratch PIN</span>
              </button>
            `
        }
      </div>
      <div class="quest-actions">
        ${!revealed ? `<button class="button-primary shimmer-button" type="button" disabled>${icon("gift")} Add to wallet</button>` : ""}
        ${revealed && !used ? `<button class="button-primary shimmer-button" data-quest-redeem type="button">${icon("gift")} Add to wallet</button>` : ""}
        ${used ? `<span class="wallet-status-badge wallet-status-success">Credited</span>` : ""}
      </div>
    </section>
  `;
}

function renderQuestStage(session) {
  const stage = session?.currentStage;
  const feedback = state.quest.feedback || null;
  if (!stage) {
    return `
      <section class="mobile-card quest-card quest-card-win">
        <div class="quest-win-burst">${icon("star")}</div>
        <h3>Quest complete</h3>
        <button class="button-primary shimmer-button" data-quest-complete type="button">${icon("gift")} Unlock reward</button>
      </section>
    `;
  }
  const selected = state.quest.selectedAnswer;
  const choiceOptions = stage.type === "true-false"
    ? (stage.options?.length ? stage.options : ["True", "False"])
    : (stage.options || []);
  const needsFreeAnswer = ["matching", "sequence"].includes(stage.type) || !choiceOptions.length;
  return `
    <section class="mobile-card quest-card quest-game-card ${feedback ? `quest-feedback-${feedback.type}` : ""}">
      <div class="quest-stage-meta">
        <span>${session.currentStageIndex + 1}/${session.totalStages}</span>
        <span>${escapeHtml(stage.type || "quiz")}</span>
      </div>
      <h3>${escapeHtml(stage.prompt || "Quest stage")}</h3>
      ${feedback ? `<div class="quest-feedback-label">${escapeHtml(feedback.text || "")}</div>` : ""}
      ${
        needsFreeAnswer
          ? `<textarea id="quest-free-answer-input" class="quest-answer-input" rows="3" placeholder="${stage.type === "sequence" ? "A, B, C" : stage.type === "matching" ? "{\"A\":\"B\"}" : "Answer"}">${escapeHtml(selected)}</textarea>`
          : `
            <div class="quest-option-grid">
              ${choiceOptions.map((option) => `
                <button class="quest-option ${selected === option ? "active" : ""}" data-quest-answer="${escapeHtml(option)}" type="button">
                  ${escapeHtml(option)}
                </button>
              `).join("")}
            </div>
          `
      }
      <button class="button-primary shimmer-button" data-quest-submit-answer type="button" ${selected || needsFreeAnswer ? "" : "disabled"}>${icon("play")} Submit</button>
    </section>
  `;
}

function formatCountdownTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function renderQuestCountdownCard(ms) {
  return `
    <section class="quest-countdown-screen">
      <div class="quest-countdown-ring">
        <span>${formatCountdownTime(ms)}</span>
      </div>
      <h2>More quest will be available for you after</h2>
      <button class="button-secondary shimmer-button" data-quest-refresh type="button">Refresh</button>
    </section>
  `;
}

function renderQuestUnavailablePopup() {
  return `
    <section class="quest-unavailable-screen">
      <div class="quest-unavailable-card">
        <span>${icon("lock")}</span>
        <h2>Quest not available now</h2>
        <p>Check back later.</p>
        <button class="button-secondary shimmer-button" data-quest-refresh type="button">Refresh</button>
      </div>
    </section>
  `;
}

function renderQuestHistoryList(view = "all") {
  const rewards = state.quest.rewards || [];
  const history = state.quest.history || [];
  return `
    ${view !== "history" ? `<section class="mobile-card">
      <div class="section-head compact">
        <div>
          <h3>Rewards</h3>
          <p class="muted-copy">${rewards.length} earned.</p>
        </div>
      </div>
      <div class="compact-list">
        ${rewards.slice(0, 8).map((reward) => `
          <div class="asset-card">
            <div>
              <strong>${formatCurrencyAmount(reward.amount || "0", reward.currency || "NGN")}</strong>
              <p class="muted-copy">${reward.redeemedAt ? "Credited" : formatWalletRequestStatus(reward.status)}</p>
            </div>
            <span class="wallet-status-badge ${reward.redeemedAt ? "wallet-status-success" : "wallet-status-pending"}">${reward.redeemedAt ? "Used" : "Open"}</span>
          </div>
        `).join("") || `<p class="muted-copy">No rewards yet.</p>`}
      </div>
    </section>` : ""}
    ${view !== "rewards" ? `<section class="mobile-card">
      <div class="section-head compact">
        <div>
          <h3>Quest History</h3>
          <p class="muted-copy">Recent plays.</p>
        </div>
      </div>
      <div class="compact-list">
        ${history.slice(0, 8).map((item) => `
          <div class="asset-card">
            <div>
              <strong>${escapeHtml(item.questTitle || "Quest")}</strong>
              <p class="muted-copy">${item.startedAt ? new Date(item.startedAt).toLocaleString() : ""}</p>
            </div>
            <span class="wallet-status-badge ${item.status === "REDEEMED" ? "wallet-status-success" : "wallet-status-pending"}">${escapeHtml(formatWalletRequestStatus(item.status))}</span>
          </div>
        `).join("") || `<p class="muted-copy">No quest history yet.</p>`}
      </div>
    </section>` : ""}
  `;
}

function renderQuestPane() {
  const status = state.quest.status;
  const view = state.quest.view || "play";
  const renderQuestNav = () => `
    <div class="quest-pill-nav">
      <button class="${view === "play" ? "active" : ""}" data-quest-view="play" type="button">Play</button>
      <button class="${view === "rewards" ? "active" : ""}" data-quest-view="rewards" type="button">Rewards</button>
      <button class="${view === "history" ? "active" : ""}" data-quest-view="history" type="button">History</button>
    </div>
  `;
  if (["rewards", "history"].includes(state.quest.view)) {
    return `
      <section class="quest-playfield quest-view-${escapeHtml(view)}">
        <div class="quest-playfield-bg" aria-hidden="true"></div>
        <div class="quest-hero">
          <div>
            <p class="eyebrow">Netrue Quest</p>
            <h2>${state.quest.view === "rewards" ? "Rewards" : "History"}</h2>
          </div>
          ${renderQuestNav()}
        </div>
        <div class="quest-view-panel">
          ${renderQuestHistoryList(view)}
        </div>
      </section>
    `;
  }
  if (!status) {
    return `
      <section class="quest-playfield">
        <div class="quest-playfield-bg" aria-hidden="true"></div>
        <div class="quest-loading-card">
          <span>${icon("star")}</span>
          <h2>Netrue Quest</h2>
          <p>Loading rewards.</p>
          <button class="button-secondary shimmer-button" data-quest-refresh type="button">Refresh</button>
        </div>
      </section>
    `;
  }
  const activeSession = status.activeSession;
  const reward = state.quest.rewards.find((item) => item.id === status.reward?.id) || status.reward;
  const cooldown = Number(status.cooldownRemainingMs || 0);
  const mainContent = !activeSession && cooldown > 0
    ? renderQuestCountdownCard(cooldown)
    : !activeSession && !status.canStart && !cooldown
      ? renderQuestUnavailablePopup()
      : `
        ${
          !activeSession && status.canStart
            ? `
              <section class="quest-start-card">
                <span>${icon("play")}</span>
                <h3>${escapeHtml(status.activeQuest?.title || "Daily Quest")}</h3>
                <p>${escapeHtml(status.activeQuest?.description || "One play every 12 hours.")}</p>
                <button class="button-primary shimmer-button" data-quest-start="${escapeHtml(status.activeQuest?.id || "")}" type="button">${icon("play")} Start quest</button>
              </section>
            `
            : ""
        }
        ${activeSession && ["IN_PROGRESS", "STARTED"].includes(String(activeSession.status || "").toUpperCase()) ? renderQuestStage(activeSession) : ""}
        ${activeSession && String(activeSession.status || "").toUpperCase() === "COMPLETED" ? renderQuestStage(activeSession) : ""}
        ${activeSession && ["REWARD_ASSIGNED", "REVEALED", "REDEEMED"].includes(String(activeSession.status || "").toUpperCase()) ? renderQuestRewardCard(reward || {}) : ""}
      `;
  return `
    <section class="quest-playfield quest-view-play">
      <div class="quest-playfield-bg" aria-hidden="true"></div>
      <div class="quest-hero">
        <div>
          <p class="eyebrow">Netrue Quest</p>
          <h2>Choose. Win. Credit.</h2>
        </div>
        ${renderQuestNav()}
      </div>
      <div class="quest-world-grid" aria-hidden="true">
        <span>Tech</span><span>AI</span><span>Farm</span><span>Crypto</span>
      </div>
      <div class="quest-play-zone">
        ${mainContent}
      </div>
    </section>
  `;
}

function renderAdminQuestStageBuilder(stages = []) {
  const normalizedStages = (stages.length ? stages : [normalizeQuestStage()]).map(normalizeQuestStage);
  return `
    <div class="admin-quest-builder">
      ${normalizedStages.map((stage, index) => {
        const answerOptions = [...new Set([...stage.options.filter(Boolean), stage.correctAnswer].filter(Boolean))];
        return `
          <section class="admin-quest-stage-card" data-admin-quest-stage="${index}">
            <div class="admin-quest-stage-head">
              <strong>Question ${index + 1}</strong>
              <button class="icon-btn danger" data-admin-quest-remove-stage="${index}" type="button" title="Remove question" ${normalizedStages.length <= 1 ? "disabled" : ""}>${icon("trash")}</button>
            </div>
            <label>Question
              <textarea name="stagePrompt-${index}" rows="2" placeholder="Type the question" required>${escapeHtml(stage.prompt)}</textarea>
            </label>
            <div class="admin-quest-stage-grid">
              <label>Type
                <select name="stageType-${index}">
                  ${["multiple-choice", "true-false"].map((type) => `<option value="${type}" ${stage.type === type ? "selected" : ""}>${type === "true-false" ? "True / False" : "Multiple choice"}</option>`).join("")}
                </select>
              </label>
              <label>Correct Answer
                <select name="stageAnswer-${index}">
                  ${answerOptions.map((option) => `<option value="${escapeHtml(option)}" ${stage.correctAnswer === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("") || `<option value="">Add options first</option>`}
                </select>
              </label>
            </div>
            <div class="admin-quest-options-grid">
              ${stage.options.map((option, optionIndex) => `
                <label>Option ${optionIndex + 1}
                  <input name="stageOption-${index}-${optionIndex}" data-admin-quest-option="${index}" value="${escapeHtml(option)}" placeholder="Answer option" />
                </label>
              `).join("")}
            </div>
            <label>Hint <input name="stageHint-${index}" value="${escapeHtml(stage.hint || "")}" placeholder="Optional hint" /></label>
            <label>Explanation <textarea name="stageExplanation-${index}" rows="2" placeholder="Shown after answer">${escapeHtml(stage.explanation || "")}</textarea></label>
          </section>
        `;
      }).join("")}
      <button class="button-secondary" data-admin-quest-add-stage type="button">${icon("plus")} Add Question</button>
    </div>
  `;
}

function renderAdminQuestPane() {
  const payload = state.quest.admin || {};
  const quests = payload.quests || [];
  const vault = payload.rewardVault || {};
  const stats = payload.statistics || {};
  const draft = getQuestDraft();
  return `
    <section class="mobile-card quest-admin-hero">
      <div>
        <p class="eyebrow">Quest Admin</p>
        <h3>${Number(vault.available || 0)} cards ready</h3>
        <p class="muted-copy">${Number(stats.totalCompleted || 0)} completed. ${vault.lowInventory ? "Low inventory." : "Inventory healthy."}</p>
      </div>
      <button class="micro-btn" data-tab="settings" type="button">${icon("settings")} Settings</button>
    </section>
    <section class="mobile-card">
      <div class="section-head compact">
        <div>
          <h3>${draft.id ? "Edit Quest" : "Create Quest"}</h3>
          <p class="muted-copy">Answers stay server-side.</p>
        </div>
        ${draft.id ? `<button class="text-link" data-admin-quest-new type="button">New</button>` : ""}
      </div>
      <form id="admin-quest-form" class="stack-form subtle-form">
        <input type="hidden" name="id" value="${escapeHtml(draft.id || "")}" />
        <label>Title <input name="title" value="${escapeHtml(draft.title)}" placeholder="Quest title" required /></label>
        <label>
          Category
          <select name="category">
            ${["technology", "AI", "IoT", "agriculture", "animals", "plants", "crypto"].map((category) => `<option value="${category}" ${draft.category === category ? "selected" : ""}>${category}</option>`).join("")}
          </select>
        </label>
        <label>Difficulty <input name="difficulty" value="${escapeHtml(draft.difficulty)}" placeholder="easy" /></label>
        <label>Description <textarea name="description" rows="2">${escapeHtml(draft.description)}</textarea></label>
        ${renderAdminQuestStageBuilder(draft.stages || [])}
        <label class="inline-check"><input name="active" type="checkbox" ${draft.active ? "checked" : ""} /> Active</label>
        <button class="button-primary shimmer-button" type="submit">${icon("star")} ${draft.id ? "Save quest" : "Create quest"}</button>
      </form>
    </section>
    <section class="mobile-card">
      <div class="section-head compact">
        <div>
          <h3>Quest List</h3>
          <p class="muted-copy">${quests.length} configured.</p>
        </div>
      </div>
      <div class="compact-list">
        ${quests.map((quest) => `
          <div class="asset-card admin-quest-row">
            <div>
              <strong>${escapeHtml(quest.title)}</strong>
              <p class="muted-copy">${escapeHtml(quest.category)} | ${(quest.stages || []).length} stages</p>
            </div>
            <div class="admin-quest-actions">
              <span class="wallet-status-badge ${quest.active ? "wallet-status-success" : "wallet-status-pending"}">${quest.active ? "Active" : "Off"}</span>
              <button class="icon-btn" data-admin-quest-edit="${escapeHtml(quest.id)}" type="button" title="Edit">${icon("edit")}</button>
              <button class="icon-btn" data-admin-quest-toggle="${escapeHtml(quest.id)}" data-admin-quest-active="${quest.active ? "false" : "true"}" type="button" title="${quest.active ? "Disable" : "Activate"}">${icon("play")}</button>
              <button class="icon-btn" data-admin-quest-duplicate="${escapeHtml(quest.id)}" type="button" title="Duplicate">${icon("copyPlus")}</button>
              <button class="icon-btn danger" data-admin-quest-delete="${escapeHtml(quest.id)}" type="button" title="Delete">${icon("trash")}</button>
            </div>
          </div>
        `).join("") || `<p class="muted-copy">No quests yet.</p>`}
      </div>
    </section>
  `;
}

function renderAdminFinancePanel() {
  if (state.user.role !== "admin") {
    return "";
  }
  const historyKeys = getFinanceHistoryKeys();
  const selectedCount = state.selectedFinanceHistoryIds.length;
  const allSelected = !!historyKeys.length && selectedCount === historyKeys.length;
  const deposits = sortRecent(state.adminDeposits || []);
  const withdrawals = sortRecent(state.adminWithdrawals || []);
  const transactions = sortRecent(state.adminTransactions || []);
  const vtuTransactions = sortRecent(state.adminVtuTransactions || []);
  const visibleDeposits = getPreviewRecords(deposits, "admin-deposits");
  const visibleWithdrawals = getPreviewRecords(withdrawals, "admin-withdrawals");
  const visibleTransactions = getPreviewRecords(transactions, "admin-ledger");
  const visibleVtuTransactions = getPreviewRecords(vtuTransactions, "admin-vtu");
  return `
    <section class="mobile-card settings-card${loadingClass(state.loadingAdminFinance)}" data-section="finance">
      ${state.loadingAdminFinance ? renderSectionLoadingOverlay("Loading finance queue", "Checking pending deposits and withdrawals") : ""}
      <div class="section-head">
        <div>
          <h3>Finance History</h3>
          <p class="muted-copy">Approve, review, clear records.</p>
        </div>
      </div>
      <div class="history-toolbar admin-finance-toolbar">
        <p class="muted-copy">${selectedCount ? `${selectedCount} selected.` : "Select history to delete."}</p>
        <div class="history-toolbar-actions">
          <button id="finance-history-select-all-btn" class="text-link" type="button">${allSelected ? "Clear" : "Select all"}</button>
          <button id="finance-history-delete-btn" class="mini-action danger" type="button" ${selectedCount ? "" : "disabled"}>Delete</button>
        </div>
      </div>
      <div class="card-list">
        <div>
          <div class="list-section-head">
            <p class="eyebrow">Deposits</p>
            ${renderListToggle("admin-deposits", deposits.length)}
          </div>
          ${visibleDeposits.map(renderAdminDepositCard).join("") || `<p class="muted-copy">No deposits yet.</p>`}
        </div>
        <div>
          <div class="list-section-head">
            <p class="eyebrow">Withdrawals</p>
            ${renderListToggle("admin-withdrawals", withdrawals.length)}
          </div>
          ${visibleWithdrawals.map(renderAdminWithdrawalCard).join("") || `<p class="muted-copy">No withdrawals yet.</p>`}
        </div>
        <div>
          <div class="list-section-head">
            <p class="eyebrow">Ledger</p>
            ${renderListToggle("admin-ledger", transactions.length)}
          </div>
          ${visibleTransactions.map(renderAdminTransactionCard).join("") || `<p class="muted-copy">No ledger records yet.</p>`}
        </div>
        <div>
          <div class="list-section-head">
            <p class="eyebrow">Airtime & Data</p>
            ${renderListToggle("admin-vtu", vtuTransactions.length)}
          </div>
          ${visibleVtuTransactions.map(renderAdminVtuTransactionCard).join("") || `<p class="muted-copy">No VTU orders yet.</p>`}
        </div>
      </div>
    </section>
  `;
}

function isSettingsDisclosureOpen(key, fallback = false) {
  if (!key) {
    return fallback;
  }
  if (Object.prototype.hasOwnProperty.call(state.settingsDisclosureOpen || {}, key)) {
    return !!state.settingsDisclosureOpen[key];
  }
  return fallback;
}

function renderSettingsDisclosure({ key, title, subtitle = "", iconName = "settings", content = "", open = false, extraClass = "", section = "" }) {
  const isOpen = isSettingsDisclosureOpen(key, open);
  return `
    <details class="mobile-card settings-card settings-disclosure ${escapeHtml(extraClass)}" data-settings-disclosure="${escapeHtml(key || title)}" ${section ? `data-section="${escapeHtml(section)}"` : ""} ${isOpen ? "open" : ""}>
      <summary class="settings-disclosure-summary">
        <span class="card-icon">${icon(iconName)}</span>
        <span>
          <strong>${escapeHtml(title)}</strong>
          ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
        </span>
        <span class="settings-disclosure-chevron">${icon("chevronDown")}</span>
      </summary>
      <div class="settings-disclosure-body">
        ${content}
      </div>
    </details>
  `;
}

function renderSettingsPane() {
  const settingsDraft = state.settingsDraft || { apiKey: "", apiSecret: "", testnet: "false" };
  const activeExchange = getActiveExchange();
  const activeExchangeLabel = getExchangeLabel(activeExchange);
  const settingsLiveLabel = state.settingsLive.connected ? "Live via websocket" : state.settingsLive.statusMessage;
  const signalAutoTrade = state.signalAutoTrade || getDefaultSignalAutoTradeState();
  const signalAutoTradeSettings = signalAutoTrade.settings || {};
  const signalAutoTradeRuntime = signalAutoTrade.runtime || {};
  const financeSettings = getFinancialSettings();
  const depositSettings = financeSettings.deposit || {};
  const withdrawalSettings = financeSettings.withdrawal || {};
  const tradingSettings = financeSettings.trading || {};
  const exchangeRateSettings = financeSettings.exchangeRate || {};
  const telegramSettings = financeSettings.telegram || {};
  const vtuSettings = state.vtuSettings || financeSettings.vtu || {};
  const digitalServiceSettings = state.digitalServices.settings || financeSettings.digitalServices || {};
  const adminDepositSettingsDraft = state.adminDepositSettingsDraft || {};
  const savedBank = getSavedBankAccount();
  const settingsBankOptions = (state.paymentBanks || [])
    .map((bank) => `<option value="${escapeHtml(bank.code)}" ${savedBank.bankCode === bank.code ? "selected" : ""}>${escapeHtml(bank.name)}</option>`)
    .join("");
  const depositSettingValue = (key, fallback = "") =>
    adminDepositSettingsDraft[key] !== undefined ? adminDepositSettingsDraft[key] : fallback;
  if (state.user.role === "admin") {
    const appearancePanel = `
      <div class="theme-toggle">
        <button class="theme-btn ${state.theme === "light" ? "active" : ""}" data-theme-mode="light" type="button">Light</button>
        <button class="theme-btn ${state.theme === "dark" ? "active" : ""}" data-theme-mode="dark" type="button">Dark</button>
      </div>
    `;
    const exchangePanel = `
      ${state.loadingUsers ? renderSectionLoadingOverlay("Loading users", "Pulling linked account details") : ""}
      <form id="exchange-select-form" class="stack-form subtle-form progressive-settings-form">
        <label>
          Active exchange
          <select name="exchange">
            ${EXCHANGE_OPTIONS.map((exchange) => `<option value="${exchange.id}" ${activeExchange === exchange.id ? "selected" : ""}>${exchange.label}</option>`).join("")}
          </select>
        </label>
      </form>
      <form id="exchange-connect-form" class="stack-form progressive-settings-form">
        <input type="hidden" name="exchange" value="${activeExchange}" />
        <label>API key <input name="apiKey" value="${escapeHtml(settingsDraft.apiKey)}" placeholder="${activeExchangeLabel} API key" required /></label>
        ${renderPasswordField({
          label: "API secret",
          name: "apiSecret",
          placeholder: `${activeExchangeLabel} API secret`,
          autocomplete: "off",
          value: settingsDraft.apiSecret,
        })}
        <label>
          Environment
          <select name="testnet">
            <option value="false" ${settingsDraft.testnet !== "true" ? "selected" : ""}>Mainnet</option>
            <option value="true" ${settingsDraft.testnet === "true" ? "selected" : ""}>Testnet</option>
          </select>
        </label>
        <button class="button-primary shimmer-button" type="submit">${icon("settings")} Connect</button>
      </form>
    `;
    const depositPanel = `
      <form id="admin-deposit-settings-form" class="stack-form subtle-form progressive-settings-form">
        <label>Bank <input name="bankName" value="${escapeHtml(depositSettingValue("bankName", depositSettings.bankName || ""))}" placeholder="Bank name" /></label>
        <label>Account name <input name="accountName" value="${escapeHtml(depositSettingValue("accountName", depositSettings.accountName || ""))}" placeholder="Account name" /></label>
        <label>Account number <input name="accountNumber" value="${escapeHtml(depositSettingValue("accountNumber", depositSettings.accountNumber || ""))}" placeholder="Account number" inputmode="numeric" /></label>
        <label>USDT address <input name="usdtAddress" value="${escapeHtml(depositSettingValue("usdtAddress", depositSettings.usdtAddress || ""))}" placeholder="Wallet address" /></label>
        <label>USDT network <input name="usdtNetwork" value="${escapeHtml(depositSettingValue("usdtNetwork", depositSettings.usdtNetwork || "TRC20"))}" placeholder="TRC20" /></label>
        <label>USDT to Naira <input name="usdtToNgn" type="number" min="1" step="0.01" value="${escapeHtml(depositSettingValue("usdtToNgn", exchangeRateSettings.usdtToNgn || getUsdtToNgnRate() || ""))}" placeholder="1600" /></label>
        <label>Min trade join (USDT) <input name="minTradeJoinUsdt" type="number" min="0.00000001" step="0.00000001" value="${escapeHtml(depositSettingValue("minTradeJoinUsdt", tradingSettings.minJoinUsdt || "1"))}" placeholder="1" /></label>
        <label>Min NGN withdrawal <input name="minWithdrawalNgn" type="number" min="1" step="1" value="${escapeHtml(depositSettingValue("minWithdrawalNgn", withdrawalSettings.minNgn || "500"))}" placeholder="500" /></label>
        <label>Min USDT withdrawal <input name="minWithdrawalUsdt" type="number" min="0.00000001" step="0.00000001" value="${escapeHtml(depositSettingValue("minWithdrawalUsdt", withdrawalSettings.minUsdt || "50"))}" placeholder="50" /></label>
        <label>NGN withdrawal fee <input name="ngnWithdrawalFee" type="number" min="0" step="1" value="${escapeHtml(depositSettingValue("ngnWithdrawalFee", withdrawalSettings.ngnFee || "100"))}" placeholder="100" /></label>
        <label>Telegram channel <input name="telegramChannelUsername" value="${escapeHtml(depositSettingValue("telegramChannelUsername", telegramSettings.channelUsername || "netruesignal"))}" placeholder="netruesignal" /></label>
        <label>Bank note <textarea name="bankNote" rows="2" placeholder="Short note">${escapeHtml(depositSettingValue("bankNote", depositSettings.bankNote || ""))}</textarea></label>
        <button class="button-secondary shimmer-button" type="submit">${icon("bank")} Save</button>
      </form>
    `;
    const vtuLowBalance = Number(vtuSettings.lastKnownBalance || 0) > 0
      && Number(vtuSettings.lowBalanceThreshold || 0) > 0
      && Number(vtuSettings.lastKnownBalance || 0) <= Number(vtuSettings.lowBalanceThreshold || 0);
    const vtuPanel = `
      <form id="admin-vtu-settings-form" class="stack-form subtle-form progressive-settings-form">
        <div class="settings-status-grid">
          <span class="wallet-status-badge ${vtuSettings.configured ? "wallet-status-success" : "wallet-status-pending"}">${vtuSettings.configured ? "Connected" : "Not set"}</span>
          <span class="muted-copy">${vtuSettings.lastKnownBalance !== null && vtuSettings.lastKnownBalance !== undefined ? `VTU ${formatNaira(vtuSettings.lastKnownBalance)}` : "Balance not checked"}</span>
        </div>
        ${vtuLowBalance ? `<p class="warning-copy">VTU wallet low. Current ${formatNaira(vtuSettings.lastKnownBalance)}.</p>` : ""}
        <label>Username <input name="username" value="" placeholder="${escapeHtml(vtuSettings.username || "VTU.ng username or email")}" autocomplete="off" /></label>
        ${renderPasswordField({
          label: "Password",
          name: "password",
          placeholder: vtuSettings.hasPassword ? "Saved password" : "VTU.ng password",
          autocomplete: "new-password",
          required: false,
        })}
        ${renderPasswordField({
          label: "Webhook PIN",
          name: "pin",
          placeholder: vtuSettings.hasPin ? "Saved PIN" : "VTU.ng PIN",
          autocomplete: "new-password",
          required: false,
        })}
        <label>
          Airtime
          <select name="airtimeEnabled">
            <option value="true" ${vtuSettings.airtimeEnabled ? "selected" : ""}>Enabled</option>
            <option value="false" ${!vtuSettings.airtimeEnabled ? "selected" : ""}>Disabled</option>
          </select>
        </label>
        <label>
          Data
          <select name="dataEnabled">
            <option value="true" ${vtuSettings.dataEnabled ? "selected" : ""}>Enabled</option>
            <option value="false" ${!vtuSettings.dataEnabled ? "selected" : ""}>Disabled</option>
          </select>
        </label>
        <label>Airtime markup % <input name="airtimeMarkupPercent" type="number" min="0" max="100" step="0.01" value="${escapeHtml(vtuSettings.airtimeMarkupPercent || "0")}" /></label>
        <label>Data markup % <input name="dataMarkupPercent" type="number" min="0" max="100" step="0.01" value="${escapeHtml(vtuSettings.dataMarkupPercent || "0")}" /></label>
        <label>Min airtime <input name="minAirtimeAmount" type="number" min="1" step="1" value="${escapeHtml(vtuSettings.minAirtimeAmount || "100")}" /></label>
        <label>Max airtime <input name="maxAirtimeAmount" type="number" min="1" step="1" value="${escapeHtml(vtuSettings.maxAirtimeAmount || "50000")}" /></label>
        <label>Low balance alert <input name="lowBalanceThreshold" type="number" min="0" step="1" value="${escapeHtml(vtuSettings.lowBalanceThreshold || "5000")}" /></label>
        <div class="copy-value-row">
          <code>${escapeHtml(`${API_BASE_URL || window.location.origin}/api/webhooks/vtu`)}</code>
          ${renderCopyButton(`${API_BASE_URL || window.location.origin}/api/webhooks/vtu`, "Copy webhook URL")}
        </div>
        <div class="modal-actions inline-modal-actions">
          <button class="button-secondary" id="admin-vtu-test-btn" type="button">${icon("refresh")} Test</button>
          <button class="button-secondary" id="admin-vtu-balance-btn" type="button">${icon("bank")} Balance</button>
          <button class="button-primary shimmer-button" type="submit">${icon("settings")} Save</button>
        </div>
      </form>
    `;
    const signalPanel = `
      <form id="signal-auto-trade-form" class="stack-form subtle-form progressive-settings-form">
        <label>
          Auto trade
          <select name="enabled">
            <option value="true" ${signalAutoTradeSettings.enabled ? "selected" : ""}>Enabled</option>
            <option value="false" ${!signalAutoTradeSettings.enabled ? "selected" : ""}>Disabled</option>
          </select>
        </label>
        <p class="muted-copy">
          ${signalAutoTrade.loaded
            ? `Runtime: ${String(signalAutoTradeRuntime.exchange || "bybit").toUpperCase()} | Active ${signalAutoTradeRuntime.activeTrades || 0}/${signalAutoTradeSettings.maxSimultaneousTrades || 2} | Next ${signalAutoTradeRuntime.nextAllocationPercent || 0}%`
            : "Runtime details are loading..."}
        </p>
        <button class="button-secondary shimmer-button" type="submit">${icon("signals")} Save</button>
      </form>
    `;
    const supportPanel = `
      <form id="user-password-form" class="stack-form subtle-form progressive-settings-form">
        ${renderPasswordField({
          label: "Current password",
          name: "currentPassword",
          placeholder: "Current password",
          autocomplete: "current-password",
        })}
        ${renderPasswordField({
          label: "New password",
          name: "newPassword",
          placeholder: "New password",
          autocomplete: "new-password",
        })}
        ${renderPasswordField({
          label: "Confirm password",
          name: "confirmPassword",
          placeholder: "Confirm password",
          autocomplete: "new-password",
        })}
        <button class="button-secondary shimmer-button" type="submit">${icon("lock")} Update</button>
      </form>
      <div class="contact-card compact-contact-card">
        <p><strong>Email:</strong> support@trade.local</p>
        <button id="logout-btn" class="button-secondary shimmer-button" type="button">Logout</button>
      </div>
    `;
    return `
      ${renderAdminSettingsOverview()}
      ${renderSettingsDisclosure({ key: "appearance", title: "Appearance", subtitle: "Theme", iconName: "settings", content: appearancePanel })}
      ${renderSettingsDisclosure({ key: "exchange", title: "Exchange", subtitle: activeExchangeLabel, iconName: "card", content: exchangePanel, extraClass: loadingClass(state.loadingUsers) })}
      ${renderSettingsDisclosure({ key: "deposit-channel", title: "Wallet Rules", subtitle: "Bank, fees, minimums", iconName: "bank", content: depositPanel, open: true })}
      ${renderSettingsDisclosure({ key: "vtu", title: "Airtime & Data", subtitle: vtuSettings.configured ? "VTU.ng" : "Setup", iconName: "wifi", content: vtuPanel })}
      ${renderSettingsDisclosure({ key: "digital-services", title: "Digital Services", subtitle: digitalServiceSettings.enabled ? "Akunding" : "Disabled", iconName: "gift", content: renderAdminDigitalServicesPanel() })}
      ${renderSettingsDisclosure({ key: "signal-auto-trade", title: "Signal Auto Trade", subtitle: signalAutoTradeSettings.enabled ? "Enabled" : "Disabled", iconName: "signals", content: signalPanel })}
      ${renderSettingsDisclosure({ key: "gift-cards", title: "Gift Cards", subtitle: "Generate and track", iconName: "gift", content: renderAdminGiftCardsPanel(), extraClass: "admin-gift-card-section" })}
      ${renderSettingsDisclosure({ key: "referrals", title: "Referral Management", subtitle: "Rewards and progress", iconName: "users", content: renderAdminReferralPanel(), extraClass: "admin-referral-section" })}
      ${renderSettingsDisclosure({ key: "app", title: "App", subtitle: state.pwa.isStandalone ? "Installed" : "Install and alerts", iconName: "download", content: renderPwaSettingsContent(), section: "app" })}
      ${renderSettingsDisclosure({ key: "security", title: "Security", subtitle: "Password and logout", iconName: "lock", content: supportPanel, section: "support" })}
    `;
  }
  if (state.user.role === "user") {
    const appearancePanel = `
      <div class="theme-toggle">
        <button class="theme-btn ${state.theme === "light" ? "active" : ""}" data-theme-mode="light" type="button">Light</button>
        <button class="theme-btn ${state.theme === "dark" ? "active" : ""}" data-theme-mode="dark" type="button">Dark</button>
      </div>
    `;
    const exchangePanel = `
      ${state.loadingUsers ? renderSectionLoadingOverlay("Loading account", "Pulling linked account details") : ""}
      <form id="exchange-select-form" class="stack-form subtle-form progressive-settings-form">
        <label>
          Active exchange
          <select name="exchange">
            ${EXCHANGE_OPTIONS.map((exchange) => `<option value="${exchange.id}" ${activeExchange === exchange.id ? "selected" : ""}>${exchange.label}</option>`).join("")}
          </select>
        </label>
      </form>
      <form id="exchange-connect-form" class="stack-form progressive-settings-form">
        <input type="hidden" name="exchange" value="${activeExchange}" />
        <label>API key <input name="apiKey" value="${escapeHtml(settingsDraft.apiKey)}" placeholder="${activeExchangeLabel} API key" required /></label>
        ${renderPasswordField({
          label: "API secret",
          name: "apiSecret",
          placeholder: `${activeExchangeLabel} API secret`,
          autocomplete: "off",
          value: settingsDraft.apiSecret,
        })}
        <label>
          Environment
          <select name="testnet">
            <option value="false" ${settingsDraft.testnet !== "true" ? "selected" : ""}>Mainnet</option>
            <option value="true" ${settingsDraft.testnet === "true" ? "selected" : ""}>Testnet</option>
          </select>
        </label>
        <button class="button-primary shimmer-button" type="submit">${icon("settings")} Connect</button>
      </form>
      <form id="mirror-form" class="stack-form subtle-form progressive-settings-form">
        <label>
          Mirror trades
          <select name="enabled">
            <option value="true" ${state.user.mirrorEnabled ? "selected" : ""}>Enabled</option>
            <option value="false" ${!state.user.mirrorEnabled ? "selected" : ""}>Disabled</option>
          </select>
        </label>
        <button class="button-secondary shimmer-button" type="submit">${icon("signals")} Save</button>
      </form>
      ${renderMirrorMinimumNotice()}
    `;
    const bankPanel = `
      <form id="user-bank-account-form" class="stack-form subtle-form progressive-settings-form">
        <label>
          Bank
          <select name="bankCode">
            <option value="">Choose bank</option>
            ${settingsBankOptions}
          </select>
        </label>
        <label>Account number <input name="accountNumber" value="${escapeHtml(savedBank.accountNumber || "")}" placeholder="10 digits" inputmode="numeric" maxlength="10" /></label>
        ${savedBank.verified ? `<p class="muted-copy">Verified: ${escapeHtml(savedBank.accountName || "")} | ${escapeHtml(savedBank.maskedAccountNumber || savedBank.accountNumber || "")}</p>` : ""}
        <button class="button-secondary shimmer-button" type="submit">${icon("bank")} Verify</button>
      </form>
    `;
    const accountPanel = `
      <div class="card-list">
        ${renderCurrentUserWalletSummary()}
      </div>
      <p class="muted-copy">${escapeHtml(settingsLiveLabel)}</p>
    `;
    const supportPanel = `
      <form id="user-password-form" class="stack-form subtle-form progressive-settings-form">
        ${renderPasswordField({
          label: "Current password",
          name: "currentPassword",
          placeholder: "Current password",
          autocomplete: "current-password",
        })}
        ${renderPasswordField({
          label: "New password",
          name: "newPassword",
          placeholder: "New password",
          autocomplete: "new-password",
        })}
        ${renderPasswordField({
          label: "Confirm password",
          name: "confirmPassword",
          placeholder: "Confirm password",
          autocomplete: "new-password",
        })}
        <button class="button-secondary shimmer-button" type="submit">${icon("lock")} Update</button>
      </form>
      <div class="support-action-grid">
        <a class="support-action-card whatsapp" href="https://wa.me/2347062671100" target="_blank" rel="noopener noreferrer">
          ${icon("whatsapp")}
          <span>WhatsApp</span>
        </a>
        <form id="user-support-message-form" class="support-message-card">
          <label>
            <span>Message admin</span>
            <textarea name="message" rows="3" placeholder="Type message" required></textarea>
          </label>
          <button class="button-primary shimmer-button" type="submit">${icon("contact")} Send</button>
        </form>
      </div>
      <div class="contact-card compact-contact-card">
        <p><strong>Email:</strong> support@trade.local</p>
        <button id="logout-btn" class="button-secondary shimmer-button" type="button">Logout</button>
      </div>
    `;
    return `
      ${renderSettingsDisclosure({ key: "user-appearance", title: "Appearance", subtitle: "Theme", iconName: "settings", content: appearancePanel })}
      ${renderSettingsDisclosure({ key: "user-exchange", title: "Exchange", subtitle: activeExchangeLabel, iconName: "card", content: exchangePanel, open: true, extraClass: loadingClass(state.loadingUsers) })}
      ${renderSettingsDisclosure({ key: "user-bank", title: "Withdrawal Bank", subtitle: savedBank.verified ? "Verified" : "Add account", iconName: "bank", content: bankPanel })}
      ${renderSettingsDisclosure({ key: "user-account", title: "Account", subtitle: state.user.mirrorEnabled ? "Mirror active" : "Mirror off", iconName: "profile", content: accountPanel })}
      ${renderSettingsDisclosure({ key: "user-app", title: "App", subtitle: state.pwa.isStandalone ? "Installed" : "Install and alerts", iconName: "download", content: renderPwaSettingsContent(), section: "app" })}
      ${renderSettingsDisclosure({ key: "user-support", title: "Support", subtitle: "Password and help", iconName: "contact", content: supportPanel, section: "support" })}
    `;
  }
  return `
      <section class="mobile-card settings-card">
        <div class="section-head">
          <div>
            <h3>Appearance</h3>
            <p class="muted-copy">Light mode is default. Switch the whole app anytime.</p>
          </div>
        </div>
        <div class="theme-toggle">
          <button class="theme-btn ${state.theme === "light" ? "active" : ""}" data-theme-mode="light" type="button">Light</button>
          <button class="theme-btn ${state.theme === "dark" ? "active" : ""}" data-theme-mode="dark" type="button">Dark</button>
        </div>
      </section>
      <section class="mobile-card settings-card${loadingClass(state.loadingUsers)}">
        ${state.loadingUsers ? renderSectionLoadingOverlay("Loading users", "Pulling linked account details") : ""}
        <div class="section-head">
          <div>
            <h3>Exchange Connection</h3>
          <p class="muted-copy">Choose the active exchange for this dashboard, then connect its API keys.</p>
        </div>
      </div>
      <form id="exchange-select-form" class="stack-form subtle-form">
        <label>
          Active exchange
          <select name="exchange">
            ${EXCHANGE_OPTIONS.map((exchange) => `<option value="${exchange.id}" ${activeExchange === exchange.id ? "selected" : ""}>${exchange.label}</option>`).join("")}
          </select>
        </label>
      </form>
      <form id="exchange-connect-form" class="stack-form">
        <input type="hidden" name="exchange" value="${activeExchange}" />
        ${
          state.user.exchangeAccounts?.[activeExchange]
            ? `<p class="muted-copy">Saved ${activeExchangeLabel} API credentials are linked. Secrets are never shown again; paste both values only when replacing the connection.</p>`
            : `<p class="muted-copy">Connect ${activeExchangeLabel} once and the app will remember it for future logins.</p>`
        }
        <label>API key <input name="apiKey" value="${escapeHtml(settingsDraft.apiKey)}" placeholder="Paste ${activeExchangeLabel} API key" required /></label>
        ${renderPasswordField({
          label: "API secret",
          name: "apiSecret",
          placeholder: `Paste ${activeExchangeLabel} API secret`,
          autocomplete: "off",
          value: settingsDraft.apiSecret,
        })}
        <label>
          Environment
          <select name="testnet">
            <option value="false" ${settingsDraft.testnet !== "true" ? "selected" : ""}>Mainnet</option>
            <option value="true" ${settingsDraft.testnet === "true" ? "selected" : ""}>Testnet</option>
          </select>
        </label>
        <button class="button-primary shimmer-button" type="submit">Connect ${activeExchangeLabel}</button>
      </form>
        ${
          state.user.role === "user"
            ? `
              <form id="mirror-form" class="stack-form subtle-form">
              <label>
                Mirror admin spot trades
                <select name="enabled">
                  <option value="true" ${state.user.mirrorEnabled ? "selected" : ""}>Enabled</option>
                  <option value="false" ${!state.user.mirrorEnabled ? "selected" : ""}>Disabled</option>
                </select>
              </label>
              <button class="button-secondary shimmer-button" type="submit">Save preference</button>
            </form>
            ${renderMirrorMinimumNotice()}
            `
            : ""
        }
      </section>
      ${
        state.user.role === "user"
          ? `
            <section class="mobile-card settings-card">
              <div class="section-head">
                <div>
                  <h3>Withdrawal Bank</h3>
                  <p class="muted-copy">Saved for fast Naira withdrawals.</p>
                </div>
              </div>
              <form id="user-bank-account-form" class="stack-form subtle-form">
                <label>
                  Bank
                  <select name="bankCode">
                    <option value="">Choose bank</option>
                    ${settingsBankOptions}
                  </select>
                </label>
                <label>Account number <input name="accountNumber" value="${escapeHtml(savedBank.accountNumber || "")}" placeholder="10 digits" inputmode="numeric" maxlength="10" /></label>
                ${savedBank.verified ? `<p class="muted-copy">Verified: ${escapeHtml(savedBank.accountName || "")} | ${escapeHtml(savedBank.maskedAccountNumber || savedBank.accountNumber || "")}</p>` : ""}
                <button class="button-secondary shimmer-button" type="submit">${icon("bank")} Verify</button>
              </form>
            </section>
          `
          : ""
      }
      ${
        state.user.role === "admin"
          ? `
            <section class="mobile-card settings-card">
              <div class="section-head">
                <div>
                  <h3>Deposit Accounts</h3>
                  <p class="muted-copy">Details shown on user deposit forms.</p>
                </div>
              </div>
              <form id="admin-deposit-settings-form" class="stack-form subtle-form">
                <label>Bank <input name="bankName" value="${escapeHtml(depositSettingValue("bankName", depositSettings.bankName || ""))}" placeholder="Bank name" /></label>
                <label>Account name <input name="accountName" value="${escapeHtml(depositSettingValue("accountName", depositSettings.accountName || ""))}" placeholder="Account name" /></label>
                <label>Account number <input name="accountNumber" value="${escapeHtml(depositSettingValue("accountNumber", depositSettings.accountNumber || ""))}" placeholder="Account number" inputmode="numeric" /></label>
                <label>Bank note <textarea name="bankNote" rows="2" placeholder="Short note">${escapeHtml(depositSettingValue("bankNote", depositSettings.bankNote || ""))}</textarea></label>
                <label>USDT address <input name="usdtAddress" value="${escapeHtml(depositSettingValue("usdtAddress", depositSettings.usdtAddress || ""))}" placeholder="Wallet address" /></label>
                <label>USDT network <input name="usdtNetwork" value="${escapeHtml(depositSettingValue("usdtNetwork", depositSettings.usdtNetwork || "TRC20"))}" placeholder="TRC20" /></label>
                <label>USDT to Naira <input name="usdtToNgn" type="number" min="1" step="0.01" value="${escapeHtml(depositSettingValue("usdtToNgn", exchangeRateSettings.usdtToNgn || getUsdtToNgnRate() || ""))}" placeholder="1600" /></label>
                <label>Min trade join (USDT) <input name="minTradeJoinUsdt" type="number" min="0.00000001" step="0.00000001" value="${escapeHtml(depositSettingValue("minTradeJoinUsdt", tradingSettings.minJoinUsdt || "1"))}" placeholder="1" /></label>
                <label>Min NGN withdrawal <input name="minWithdrawalNgn" type="number" min="1" step="1" value="${escapeHtml(depositSettingValue("minWithdrawalNgn", withdrawalSettings.minNgn || "500"))}" placeholder="500" /></label>
                <label>Min USDT withdrawal <input name="minWithdrawalUsdt" type="number" min="0.00000001" step="0.00000001" value="${escapeHtml(depositSettingValue("minWithdrawalUsdt", withdrawalSettings.minUsdt || "50"))}" placeholder="50" /></label>
                <label>NGN withdrawal fee <input name="ngnWithdrawalFee" type="number" min="0" step="1" value="${escapeHtml(depositSettingValue("ngnWithdrawalFee", withdrawalSettings.ngnFee || "100"))}" placeholder="100" /></label>
                <label>Telegram channel <input name="telegramChannelUsername" value="${escapeHtml(depositSettingValue("telegramChannelUsername", telegramSettings.channelUsername || "netruesignal"))}" placeholder="netruesignal" /></label>
                <button class="button-secondary shimmer-button" type="submit">${icon("bank")} Save</button>
              </form>
            </section>
            <section class="mobile-card settings-card">
              <div class="section-head">
                <div>
                  <h3>Signal Auto Trade</h3>
                  <p class="muted-copy">When enabled, the signal bot places BUY entries automatically: first slot uses 50% of available balance, second slot uses 100% of remaining balance. Maximum two open/pending auto trades.</p>
                </div>
              </div>
              <form id="signal-auto-trade-form" class="stack-form subtle-form">
                <label>
                  Auto trade from signal engine
                  <select name="enabled">
                    <option value="true" ${signalAutoTradeSettings.enabled ? "selected" : ""}>Enabled</option>
                    <option value="false" ${!signalAutoTradeSettings.enabled ? "selected" : ""}>Disabled</option>
                  </select>
                </label>
                <p class="muted-copy">
                  ${signalAutoTrade.loaded
                    ? `Runtime: ${String(signalAutoTradeRuntime.exchange || "bybit").toUpperCase()} | Active auto trades ${signalAutoTradeRuntime.activeTrades || 0}/${signalAutoTradeSettings.maxSimultaneousTrades || 2} | Next allocation ${signalAutoTradeRuntime.nextAllocationPercent || 0}%`
                    : "Runtime details are loading..."}
                </p>
                <button class="button-secondary shimmer-button" type="submit">Save signal auto-trade setting</button>
              </form>
            </section>
          `
          : ""
      }
      ${
        state.user.role === "admin"
          ? `
            ${renderAdminSettingsOverview()}
            <section class="mobile-card settings-card admin-gift-card-section">
              ${renderAdminGiftCardsPanel()}
            </section>
            <section class="mobile-card settings-card admin-referral-section">
              <div class="section-head">
                <div>
                  <h3>Referral Management</h3>
                  <p class="muted-copy">Rewards, thresholds, and referral progress.</p>
                </div>
              </div>
              ${renderAdminReferralPanel()}
            </section>
          `
          : `
            <section class="mobile-card settings-card">
              <div class="section-head">
                <div>
                  <h3>Account Summary</h3>
                  <p class="muted-copy">Your linked account and mirror status.</p>
                  <p class="muted-copy">${settingsLiveLabel}</p>
                </div>
              </div>
              <div class="card-list">
                ${renderCurrentUserWalletSummary()}
              </div>
            </section>
          `
      }
      ${renderPwaSettingsCard()}
      <section class="mobile-card settings-card" data-section="support">
        <div class="section-head">
          <div>
            <h3>Support</h3>
            <p class="muted-copy">Security and help.</p>
          </div>
        </div>
        <form id="user-password-form" class="stack-form subtle-form">
          ${renderPasswordField({
            label: "Current password",
            name: "currentPassword",
            placeholder: "Current password",
            autocomplete: "current-password",
          })}
          ${renderPasswordField({
            label: "New password",
            name: "newPassword",
            placeholder: "New password",
            autocomplete: "new-password",
          })}
          ${renderPasswordField({
            label: "Confirm password",
            name: "confirmPassword",
            placeholder: "Confirm password",
            autocomplete: "new-password",
          })}
          <button class="button-secondary shimmer-button" type="submit">${icon("lock")} Update password</button>
        </form>
        <div class="support-action-grid">
          <a class="support-action-card whatsapp" href="https://wa.me/2347062671100" target="_blank" rel="noopener noreferrer">
            ${icon("whatsapp")}
            <span>WhatsApp</span>
          </a>
          ${
            state.user.role === "user"
              ? `
                <form id="user-support-message-form" class="support-message-card">
                  <label>
                    <span>Message admin</span>
                    <textarea name="message" rows="3" placeholder="Type message" required></textarea>
                  </label>
                  <button class="button-primary shimmer-button" type="submit">${icon("contact")} Send</button>
                </form>
              `
              : ""
          }
        </div>
        <div class="contact-card">
          <p><strong>Email:</strong> support@trade.local</p>
          <p><strong>Hours:</strong> 09:00 - 18:00</p>
          <button id="logout-btn" class="button-secondary shimmer-button" type="button">Logout</button>
        </div>
      </section>
    `;
}

function renderSignalsPane() {
  return window.SignalPage?.renderSignalPage
    ? `
      <div id="signal-page-shell-host">
        ${window.SignalPage.renderSignalPage({
          signalFeed: state.signalFeed,
          trades: state.trades,
          user: state.user,
          formatNumber,
          formatUsdtUnit,
          getTradePnlPercent,
          getTradeCurrentValue,
          getTradeEntryPrice,
          getTradeCurrentMarket,
          renderExchangeBadge,
          renderTradeJoinedUsersButton,
          minTradeJoinUsdt: getMinimumTradeJoinUsdt(),
          tradeJoinBalanceUsdt: getTradeJoinBalanceUsdt(),
        })}
      </div>
    `
    : `<section class="mobile-card"><p class="muted-copy">Signal dashboard is loading...</p></section>`;
}

function renderHomeOpenTradeSection() {
  return window.SignalPage?.renderOpenTradeInvestmentBoard
    ? window.SignalPage.renderOpenTradeInvestmentBoard({
        trades: state.trades,
        user: state.user,
        formatNumber,
        formatUsdtUnit,
        getTradePnlPercent,
        getTradeCurrentValue,
        getTradeEntryPrice,
        getTradeCurrentMarket,
        renderExchangeBadge,
        renderTradeJoinedUsersButton,
        minTradeJoinUsdt: getMinimumTradeJoinUsdt(),
        tradeJoinBalanceUsdt: getTradeJoinBalanceUsdt(),
        title: "Open Trades",
        description: "Live entries",
        layout: "carousel",
        limit: 10,
        showMore: true,
      })
    : `<section class="mobile-card"><p class="muted-copy">Open trades are loading...</p></section>`;
}

function renderProfitLossReportCard() {
  const rows = getProfitLossReportRows(state.reportPeriod);
  const visibleRows = isListExpanded("profit-loss-report") ? rows : rows.slice(0, 3);
  const monthValue = Number(state.monthPnlValue || 0);
  const reportTotal = rows.reduce((sum, row) => sum + row.pnlValue, 0);
  return `
    <section class="mobile-card profit-report-card">
      <div class="section-head">
        <div>
          <h3>This Month Profit / Loss</h3>
          <p class="muted-copy">${formatMonthLabel(state.monthLabel)}: <span class="${monthValue > 0 ? "positive" : monthValue < 0 ? "negative" : "neutral"}">${monthValue >= 0 ? "+" : "-"}${formatUsdt(Math.abs(monthValue))} ${state.monthPnlPercent >= 0 ? "+" : ""}${formatNumber(state.monthPnlPercent, 2)}%</span></p>
        </div>
        <button id="download-pl-report-btn" class="icon-action" type="button" title="Download PDF report" aria-label="Download PDF report">
          ${icon("download")}
        </button>
      </div>
      <div class="history-toolbar report-toolbar">
        <label>
          Report
          <select id="pl-report-period">
            <option value="days" ${state.reportPeriod === "days" ? "selected" : ""}>By days</option>
            <option value="weeks" ${state.reportPeriod === "weeks" ? "selected" : ""}>By weeks</option>
            <option value="months" ${state.reportPeriod === "months" ? "selected" : ""}>By months</option>
          </select>
        </label>
        <strong class="${reportTotal > 0 ? "positive" : reportTotal < 0 ? "negative" : "neutral"}">${reportTotal >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(reportTotal))}</strong>
        ${renderListToggle("profit-loss-report", rows.length)}
      </div>
      <div class="compact-list report-list">
        ${visibleRows
          .map(
            (row) => `
              <div class="asset-card report-row">
                <div>
                  <strong>${row.key}</strong>
                  <p class="muted-copy">${row.trades} trade${row.trades === 1 ? "" : "s"} | ${row.wins} win${row.wins === 1 ? "" : "s"} | ${row.losses} loss${row.losses === 1 ? "" : "es"}</p>
                </div>
                <div class="asset-values">
                  <strong class="${row.pnlValue > 0 ? "positive" : row.pnlValue < 0 ? "negative" : "neutral"}">${row.pnlValue >= 0 ? "+" : "-"}${formatUsdtUnit(Math.abs(row.pnlValue))}</strong>
                </div>
              </div>
            `
          )
          .join("") || `<p class="muted-copy">No profit/loss history yet.</p>`}
      </div>
    </section>
  `;
}

function renderWalletHistoryRow(item) {
  const amount = Number(item.amount || 0);
  const currency = item.currency || "USDT";
  const equivalent = formatRecordEquivalent(item, currency);
  const tone = amount > 0 ? "positive" : amount < 0 ? "negative" : "neutral";
  const statusLabel = formatWalletRequestStatus(item.status);
  return `
    <div class="asset-card wallet-history-row">
      <div>
        <strong>${escapeHtml(item.description || item.type || "Wallet")}</strong>
        <p class="muted-copy">
          ${statusLabel ? `<span class="wallet-status-badge ${walletStatusClass(item.status)}">${escapeHtml(statusLabel)}</span>` : ""}
          ${item.createdAt ? `<span>${new Date(item.createdAt).toLocaleString()}</span>` : ""}
        </p>
        ${equivalent ? `<p class="muted-copy">Eq ${equivalent}</p>` : ""}
      </div>
      <div class="asset-values">
        <strong class="${tone}">${amount >= 0 ? "+" : "-"}${formatCurrencyAmount(Math.abs(amount), currency)}</strong>
        <p class="muted-copy">${escapeHtml(item.kind || "")}</p>
      </div>
    </div>
  `;
}

function walletStatusClass(status) {
  const value = String(status || "").toUpperCase();
  if (["APPROVED", "COMPLETED", "SUCCESSFUL", "SUCCESS"].includes(value)) {
    return "wallet-status-success";
  }
  if (value === "PROCESSING") {
    return "wallet-status-processing";
  }
  if (value === "REVERSED") {
    return "wallet-status-reversed";
  }
  if (value === "REJECTED" || value === "FAILED" || value === "CANCELLED" || value === "CANCELED") {
    return "wallet-status-rejected";
  }
  return "wallet-status-pending";
}

function formatWalletRequestStatus(status) {
  const value = String(status || "").toUpperCase();
  if (["APPROVED", "COMPLETED", "SUCCESSFUL", "SUCCESS"].includes(value)) {
    return "Successful";
  }
  if (value === "PROCESSING") {
    return "Processing";
  }
  if (value === "FAILED") {
    return "Failed";
  }
  if (value === "REVERSED") {
    return "Reversed";
  }
  if (value === "REJECTED") {
    return "Rejected";
  }
  if (value === "CANCELLED" || value === "CANCELED") {
    return "Cancelled";
  }
  return value ? "Pending" : "";
}

function applyRouteTarget() {
  const pathname = String(window.location?.pathname || "");
  const params = new URLSearchParams(window.location?.search || "");
  if (params.get("tab") === "referral" || /^\/referral\/?$/.test(pathname)) {
    state.activeTab = "referral";
    return;
  }
  if (params.get("tab") === "quest") {
    state.activeTab = "quest";
    const view = String(params.get("questView") || "play").trim();
    state.quest.view = ["play", "rewards", "history"].includes(view) ? view : "play";
    return;
  }
  if (/^\/quest\/?$/.test(pathname)) {
    state.activeTab = "quest";
    state.quest.view = "play";
    return;
  }
  if (/^\/quest\/rewards\/?$/.test(pathname)) {
    state.activeTab = "quest";
    state.quest.view = "rewards";
    return;
  }
  if (/^\/quest\/history\/?$/.test(pathname)) {
    state.activeTab = "quest";
    state.quest.view = "history";
    return;
  }
  if (/^\/admin\/quests\/?$/.test(pathname) && state.user?.role === "admin") {
    state.activeTab = "adminQuests";
    return;
  }
  if (params.get("tab") === "adminQuests" && state.user?.role === "admin") {
    state.activeTab = "adminQuests";
    return;
  }
  if (/^\/admin\/withdrawals\/[^/]+\/?$/.test(pathname) && state.user?.role === "admin") {
    state.activeTab = "history";
    state.routeScrollSection = "finance";
    return;
  }
  if (params.get("tab") === "signals") {
    const tradeId = String(params.get("trade") || "").trim();
    state.activeTab = "signals";
    if (tradeId) {
      state.expandedTradeIds = [...new Set([...state.expandedTradeIds, tradeId])];
      state.routeScrollSection = `trade:${tradeId}`;
    }
    return;
  }
  if (params.get("tab") === "history" && state.user?.role === "admin") {
    const withdrawalId = String(params.get("withdrawal") || "").trim();
    state.activeTab = "history";
    if (withdrawalId) {
      state.expandedListKeys = [...new Set([...state.expandedListKeys, "admin-withdrawals"])];
      state.routeScrollSection = `finance-withdrawal:${withdrawalId}`;
      return;
    }
    state.routeScrollSection = String(params.get("section") || "finance").trim() || "finance";
    return;
  }
  if (params.get("tab") === "services") {
    state.activeTab = "store";
    return;
  }
  if (["home", "settings", "history", "signals", "store"].includes(params.get("tab"))) {
    state.activeTab = params.get("tab");
  }
}

function scrollToRouteSection() {
  const section = state.routeScrollSection;
  if (!section) {
    return;
  }
  requestAnimationFrame(() => {
    if (section.startsWith("trade:")) {
      const tradeId = section.slice("trade:".length);
      const target = document.querySelector(`[data-trade-id="${tradeId}"]`);
      if (!target) {
        return;
      }
      state.routeScrollSection = "";
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (section.startsWith("finance-withdrawal:")) {
      const withdrawalId = section.slice("finance-withdrawal:".length);
      const escapedWithdrawalId = window.CSS?.escape ? CSS.escape(withdrawalId) : withdrawalId.replace(/"/g, '\\"');
      const target = document.querySelector(`[data-finance-withdrawal-id="${escapedWithdrawalId}"]`);
      if (target) {
        state.routeScrollSection = "";
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        target.classList.add("history-row-focus");
        setTimeout(() => target.classList.remove("history-row-focus"), 1800);
        return;
      }
    }
    const target = document.querySelector(`[data-section="${section}"]`);
    if (!target) {
      return;
    }
    state.routeScrollSection = "";
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function isWalletRequestHistoryItem(item) {
  const kind = String(item?.kind || item?.type || "").toUpperCase();
  return ["DEPOSIT", "WITHDRAWAL", "VTU", "VTU_AIRTIME", "VTU_DATA"].includes(kind);
}

function renderWalletHistorySection({
  limit = 80,
  title = "Wallet History",
  description = "Deposits, withdrawals, and ledger updates.",
  requestsOnly = false,
  showMore = false,
  showToggle = false,
  listKey = "wallet-history",
} = {}) {
  const source = (state.financialDashboard?.walletHistory || [])
    .filter((item) => !requestsOnly || isWalletRequestHistoryItem(item));
  const sortedSource = sortRecent(source);
  const walletHistory = showToggle
    ? getPreviewRecords(sortedSource, listKey, 3)
    : sortedSource.slice(0, limit);
  if (!walletHistory.length) {
    return "";
  }
  return `
    <section class="mobile-card">
      <div class="section-head">
        <div>
          <h3>${title}</h3>
          <p class="muted-copy">${description}</p>
        </div>
        ${showMore ? `<button class="text-link" data-tab="history" type="button">See more</button>` : ""}
        ${showToggle ? renderListToggle(listKey, sortedSource.length, 3) : ""}
      </div>
      <div class="compact-list">
        ${walletHistory.map(renderWalletHistoryRow).join("")}
      </div>
    </section>
  `;
}

function renderHistoryContent() {
  const trades = getHistoryTrades();
  const canClearHistory = state.user?.role === "admin";
  const pendingOrders = sortRecent(state.openOrders || []);
  const visiblePendingOrders = getPreviewRecords(pendingOrders, "pending-orders-history");
  const visibleTrades = getPreviewRecords(trades, "trade-timeline-history");
  return `
    <div class="card-list">
      ${renderWalletHistorySection({ showToggle: true, listKey: "wallet-history-page", limit: 3 })}
      <section class="mobile-card">
        <div class="section-head">
          <div>
            <h3>Pending Orders</h3>
            <p class="muted-copy">All live exchange orders still waiting to fill or cancel.</p>
          </div>
          ${renderListToggle("pending-orders-history", pendingOrders.length)}
        </div>
        <div class="compact-list">
          ${visiblePendingOrders.map((order) => renderPendingOrderDisclosure(order, { showCancel: true })).join("") || `<p class="muted-copy">No pending orders right now.</p>`}
        </div>
      </section>
      <section class="mobile-card">
        <div class="section-head">
          <div>
            <h3>Trade Timeline</h3>
            <p class="muted-copy">Open, pending, canceled, and closed trades all stay visible here.</p>
          </div>
          ${renderListToggle("trade-timeline-history", trades.length)}
        </div>
      ${visibleTrades
        .map((trade) => {
          const canSelectTrade = canClearHistory && isTradeClearableFromHistory(trade);
          const entryPrice = getTradeEntryPrice(trade);
          const currentPrice = Number(getTradeCurrentMarket(trade.symbol).price || 0);
          const remainingQuantity = getTradeRemainingQuantity(trade);
          const currentValue = (remainingQuantity || getTradeExecutedQuantity(trade)) * currentPrice;
          const useStaticPnl = ["CANCELED", "CLOSED"].includes(String(trade.lifecycleStatus || "").toUpperCase());
          const pnlPercent = useStaticPnl ? getTradeStaticPnlPercent(trade) : (entryPrice && currentPrice ? getTradePnlPercent(trade) : 0);
          const canHideStoppedTrade = state.user?.role === "user" && trade.userInvestment?.status === "STOPPED";
          return `
            <div class="asset-card history-row" data-trade-id="${escapeHtml(trade.id || "")}" data-trade-symbol-row="${trade.symbol}" data-trade-entry="${entryPrice}" data-trade-side="${trade.side}" data-trade-quantity="${remainingQuantity || getTradeExecutedQuantity(trade)}" data-trade-pnl-static="${useStaticPnl ? "true" : "false"}">
              ${
                canClearHistory
                  ? `
                    <label class="history-checkbox">
                      <input type="checkbox" data-history-trade-id="${trade.id}" ${
                        state.selectedHistoryTradeIds.includes(trade.id) ? "checked" : ""
                      } ${canSelectTrade ? "" : "disabled"} />
                      <span></span>
                    </label>
                  `
                  : ""
              }
              <div>
                <strong>${trade.symbol}</strong>
                <p class="muted-copy">${renderExchangeBadge(trade.exchange || getActiveExchange())}</p>
                <p class="muted-copy">${trade.side} ${trade.type} | ${new Date(trade.createdAt).toLocaleString()}</p>
                <p class="muted-copy trade-meta-line" data-trade-current>Current ${currentPrice ? formatNumber(currentPrice, 8) : "-"}</p>
                <p class="muted-copy">Live value <span data-trade-current-value>${formatUsdtUnit(currentValue)}</span></p>
              </div>
              <div class="asset-values">
                ${renderTradeStatusBadge(trade.lifecycleStatus)}
                <strong class="${pnlPercent >= 0 ? "positive" : "negative"}" data-trade-pnl>${pnlPercent >= 0 ? "+" : ""}${formatNumber(pnlPercent, 2)}%</strong>
                <p class="muted-copy trade-meta-line" data-trade-entry>Entry ${entryPrice ? formatNumber(entryPrice, 8) : "Market"}</p>
                ${canHideStoppedTrade ? `<button class="micro-btn" data-hide-stopped-trade="${escapeHtml(trade.id || "")}" type="button">Remove</button>` : ""}
              </div>
            </div>
          `;
        })
        .join("") || `<p class="muted-copy">No trade history yet.</p>`}
      </section>
    </div>
  `;
}

function renderHistoryPane() {
  const trades = getHistoryTrades();
  const clearableTrades = trades.filter(isTradeClearableFromHistory);
  const canClearHistory = state.user?.role === "admin";
  const selectedCount = state.selectedHistoryTradeIds.length;
  const allSelected = !!clearableTrades.length && selectedCount === clearableTrades.length;
  return `
    ${renderProfitLossReportCard()}
    ${canClearHistory ? renderAdminFinancePanel() : ""}
    <section class="mobile-card${loadingClass(state.loadingTrades)}">
      ${state.loadingTrades ? renderSectionLoadingOverlay("Loading history", "Syncing your saved trade timeline") : ""}
      <div class="section-head">
        <div>
          <h3>Trade History</h3>
          <p class="muted-copy">Recent spot trades and execution state.</p>
        </div>
      </div>
      ${
        canClearHistory
          ? `
            <div class="history-toolbar">
              <p class="muted-copy">${
                selectedCount
                  ? `${selectedCount} selected for clearing.`
                  : clearableTrades.length
                    ? "Select saved trades to clear them."
                    : "Open and pending trades stay protected here."
              }</p>
              <div class="history-toolbar-actions">
                <button id="history-select-all-btn" class="text-link" type="button">${
                  allSelected ? "Clear selection" : "Select all"
                }</button>
                <button id="history-clear-btn" class="mini-action danger" type="button" ${
                  selectedCount ? "" : "disabled"
                }>Clear selected</button>
              </div>
            </div>
          `
          : ""
      }
      <div data-history-host>${renderHistoryContent()}</div>
    </section>
  `;
}

function renderReferralBanner() {
  const settings = getReferralSettings();
  const maximum = Number(settings.campaignMaximumNgn || settings.maximumEarningsNgn || 0);
  const headline = maximum > 0 ? `Earn up to ${formatNaira(maximum).replace(".00", "")}` : "Earn rewards";
  return `
    <button class="referral-promo-banner" data-tab="referral" type="button">
      <span class="referral-promo-copy">
        <small>Refer & Earn</small>
        <strong>${escapeHtml(headline)}</strong>
        <span>Invite friends and earn when they complete 2 simple tasks.</span>
        <em>Refer now</em>
      </span>
      <span class="referral-promo-art" aria-hidden="true">
        <span class="referral-gift-box">N</span>
        <span class="referral-coin coin-one"></span>
        <span class="referral-coin coin-two"></span>
        <span class="referral-user-orbit">${icon("users")}</span>
      </span>
    </button>
  `;
}

function renderHomePromoSlider() {
  if (state.user?.role !== "user") {
    return "";
  }
  const slides = [
    { id: "quest", content: renderQuestPromoBanner() },
    { id: "referral", content: renderReferralBanner() },
  ].filter((slide) => slide.content);
  if (!slides.length) {
    return "";
  }
  const activeSlide = Math.min(Math.max(Number(state.homePromoSlide || 0), 0), slides.length - 1);
  state.homePromoSlide = activeSlide;
  return `
    <section class="home-promo-slider" aria-label="Promotions">
      <div class="home-promo-viewport">
        <div class="home-promo-track" data-home-promo-track style="transform: translateX(-${activeSlide * 100}%);">
          ${slides.map((slide) => `<div class="home-promo-slide">${slide.content}</div>`).join("")}
        </div>
      </div>
      <div class="home-promo-dots" aria-label="Promotion slider">
        ${slides.map((slide, index) => `
          <button class="${index === activeSlide ? "active" : ""}" data-home-promo-slide="${index}" type="button" aria-label="Show ${escapeHtml(slide.id)} banner"></button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderReferralProgressLine(referral) {
  const spend = referral.spendProgress || {};
  const trades = referral.tradeProgress || {};
  const activityDone = referral.spendQualified || referral.tradeQualified;
  const activityText = referral.spendQualified
    ? `Spend ${formatNaira(spend.amount || 0).replace(".00", "")}`
    : `Activity ${Number(trades.count || 0)}/${Number(trades.required || 0)} trades`;
  return `
    <article class="referral-list-card">
      <div>
        <strong>${escapeHtml(referral.referredUser?.label || "User ****")}</strong>
        <p class="muted-copy">${escapeHtml(formatReferralStatus(referral.status))}</p>
      </div>
      <div class="referral-progress-tags">
        <span>${renderReferralCheck(referral.depositQualified)} Deposit</span>
        <span>${renderReferralCheck(activityDone)} ${escapeHtml(activityText)}</span>
        <span>${renderReferralCheck(!!referral.rewardedAt)} Rewarded</span>
      </div>
    </article>
  `;
}

function renderReferralPane() {
  const profile = state.referralProfile || {};
  const settings = getReferralSettings();
  const stats = profile.stats || {};
  const link = getReferralLink(profile);
  const referrals = profile.referrals || [];
  return `
    <section class="referral-page${loadingClass(state.loadingReferral)}">
      ${state.loadingReferral ? renderSectionLoadingOverlay("Loading referrals", "Checking reward progress") : ""}
      <section class="referral-hero mobile-card">
        <div>
          <p class="eyebrow">Refer & Earn</p>
          <h2>Invite your friends to NetrueFi and earn rewards when they become active users.</h2>
        </div>
        <div class="referral-bonus-chip">
          <span>Referral Bonus</span>
          <strong>${formatNaira(settings.bonusAmountNgn || 0)}</strong>
        </div>
      </section>
      <section class="referral-stats-grid">
        <div><span>Total Referrals</span><strong>${Number(stats.totalReferrals || 0).toLocaleString()}</strong></div>
        <div><span>Qualified</span><strong>${Number(stats.qualifiedReferrals || 0).toLocaleString()}</strong></div>
        <div><span>Pending</span><strong>${Number(stats.pendingReferrals || 0).toLocaleString()}</strong></div>
        <div><span>Total Earnings</span><strong>${formatNaira(stats.totalReferralEarnings || 0)}</strong></div>
      </section>
      <section class="mobile-card referral-link-card">
        <div class="section-head">
          <div>
            <h3>Your Referral Link</h3>
            <p class="muted-copy">${escapeHtml(profile.referralCode || "Loading code")}</p>
          </div>
        </div>
        <div class="referral-link-box">${escapeHtml(link || "Preparing link")}</div>
        <div class="referral-actions">
          <button class="button-secondary" data-copy-text="${escapeHtml(link)}" type="button">${icon("copy")} Copy link</button>
          <button class="button-primary shimmer-button" id="referral-share-btn" type="button">${icon("send")} Share</button>
        </div>
      </section>
      <section class="mobile-card referral-steps-card">
        <div class="section-head">
          <div>
            <h3>How To Earn Your Referral Bonus</h3>
            <p class="muted-copy">Once both steps are completed, your reward is automatically credited.</p>
          </div>
        </div>
        <div class="referral-step-list">
          <div><span>1</span><strong>Fund Account</strong><p>Your referred friend must deposit ${formatNaira(settings.minimumDepositNgn || 0)} or more.</p></div>
          <div><span>2</span><strong>Use NetrueFi</strong><p>Your friend must either spend ${formatNaira(settings.minimumSpendNgn || 0)} or more on airtime/data OR successfully join at least ${Number(settings.minimumTrades || 0)} eligible trades.</p></div>
        </div>
      </section>
      <section class="mobile-card referral-list-section">
        <div class="section-head">
          <div>
            <h3>Your Referrals</h3>
            <p class="muted-copy">Progress is shown without exposing private details.</p>
          </div>
        </div>
        ${referrals.map(renderReferralProgressLine).join("") || `<p class="muted-copy">No referrals yet.</p>`}
      </section>
    </section>
  `;
}

function renderHomePane() {
    const userHomeContent = `
      ${renderHomePromoSlider()}
      ${renderVtuQuickActions()}
      ${renderWalletHistorySection({
        limit: 3,
        title: "Transactions",
        description: "Recent activity",
        requestsOnly: true,
        showMore: true,
      })}
      <div data-home-trades-host>${renderHomeOpenTradeSection()}</div>
    `;

    return `
      ${renderMarketModeSwitch()}
      ${renderSummaryCard()}
      ${
        state.user.role === "user"
          ? userHomeContent
          : isFuturesMode()
          ? renderFuturesDashboard()
          : renderAdminHomeDashboard()
      }
    `;
}

function renderDigitalServicesPane() {
  const settings = state.digitalServices.settings || {};
  const orders = state.digitalServices.orders || [];
  const products = state.digitalServices.products || [];
  const categories = state.digitalServices.categories || [];
  const query = state.digitalServices.query || "";
  const activeCategory = state.digitalServices.category || "";
  const balance = Number(getFinancialWallet("NGN")?.availableBalance || 0);
  return `
    <section class="mobile-card digital-services-page" data-section="store">
      <div class="section-head">
        <div>
          <h3>Store</h3>
          <p class="muted-copy">Premium digital tools at affordable prices.</p>
        </div>
        <button class="text-link" data-digital-services-page-refresh type="button">Refresh</button>
      </div>
      <div class="digital-services-hero inline-hero">
        <div>
          <h3>${settings.enabled === false ? "Currently unavailable" : "Ready to shop"}</h3>
          <p>Wallet balance ${formatNaira(balance)}</p>
        </div>
        <span>${icon("gift")}</span>
      </div>
    </section>
    ${
      settings.enabled === false
        ? `<section class="mobile-card"><p class="warning-copy">Store is not available now.</p></section>`
        : `
          <section class="mobile-card store-catalog-card${loadingClass(state.digitalServices.loading)}">
            ${state.digitalServices.loading ? renderSectionLoadingOverlay("Loading store", "Fetching available tools") : ""}
            <div class="digital-search">
              <span>${icon("signals")}</span>
              <input id="store-search-input" type="search" value="${escapeHtml(query)}" placeholder="Search services..." autocomplete="off" />
            </div>
            <div class="digital-category-row">
              <button class="${activeCategory ? "" : "active"}" data-store-category="" type="button">All</button>
              ${categories.map((category) => `<button class="${activeCategory === category ? "active" : ""}" data-store-category="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`).join("")}
            </div>
            <div class="digital-product-grid store-product-grid">
              ${products.map((product) => `
                <button class="digital-product-card" data-digital-service-product="${escapeHtml(product.id)}" type="button">
                  ${renderDigitalServiceImage(product)}
                  <strong>${escapeHtml(product.name)}</strong>
                  <span>${escapeHtml(product.category || "Digital")}</span>
                  <b>${formatNaira(product.price || product.sellingPrice || 0).replace(".00", "")}</b>
                </button>
              `).join("") || `<p class="vtu-empty-state">No digital tool found.</p>`}
            </div>
          </section>
        `
    }
    <section class="mobile-card">
      <div class="section-head">
        <div>
          <h3>My Purchases</h3>
          <p class="muted-copy">Your digital service orders and delivery status.</p>
        </div>
      </div>
      <div class="compact-list">
        ${orders.map(renderDigitalServiceOrderRow).join("") || `<p class="muted-copy">No digital service purchase yet.</p>`}
      </div>
    </section>
  `;
}

async function navigateToTab(nextTab) {
  if (!nextTab) {
    return;
  }
  state.menuSheetOpen = false;
  if (window.history?.pushState) {
    window.history.pushState({}, "", getTabRoute(nextTab));
  }
  if (nextTab === "home") {
    state.activeTab = "home";
    disconnectSettingsUsersSocket();
    render();
    await withLoading(loadDashboardData);
    showNotice("Home refreshed");
    return;
  }
  state.activeTab = nextTab;
  render();
  if (nextTab === "settings") {
    connectSettingsUsersSocket();
  } else {
    disconnectSettingsUsersSocket();
  }
  if (nextTab === "quest") {
    await withLoading(loadQuestData).catch((error) => showError(error.message));
  }
  if (nextTab === "referral") {
    await withLoading(loadReferralProfile).catch((error) => showError(error.message));
  }
  if (nextTab === "store") {
    await withLoading(async () => {
      await loadDigitalServicesSnapshot({ force: true });
      await loadDigitalServiceProducts({ force: true });
    }).catch((error) => showError(error.message));
  }
  if (nextTab === "adminQuests") {
    await withLoading(loadAdminQuestData).catch((error) => showError(error.message));
  }
}

function renderDashboardShell() {
  captureFormDrafts();
  captureVolatileFieldDrafts();
  const focusedFieldSnapshot = getFocusedFieldSnapshot();
  const adminUsersList = document.querySelector(".admin-users-modal-list");
  const adminUsersSearch = document.getElementById("admin-user-search-input");
  const restoreAdminUsersModal = state.actionModal?.type === "admin-users"
    ? {
        scrollTop: adminUsersList ? adminUsersList.scrollTop : state.adminUsersModalScrollTop,
        searchFocused: document.activeElement === adminUsersSearch,
        selectionStart: adminUsersSearch?.selectionStart ?? null,
        selectionEnd: adminUsersSearch?.selectionEnd ?? null,
      }
    : null;
  if (adminUsersList) {
    state.adminUsersModalScrollTop = adminUsersList.scrollTop;
  }

  const paneMap = {
    home: renderHomePane(),
    store: renderDigitalServicesPane(),
    settings: renderSettingsPane(),
    signals: renderSignalsPane(),
    history: renderHistoryPane(),
    referral: renderReferralPane(),
    quest: renderQuestPane(),
    adminQuests: renderAdminQuestPane(),
  };

  app.innerHTML = `
    <section class="app-shell">
      ${renderDashboardTopBar()}
      <section class="app-screen app-screen-${escapeHtml(state.activeTab || "home")}">
        ${paneMap[state.activeTab] || paneMap.home}
      </section>
      ${renderBottomNav()}
    </section>
    ${renderMenuSheet()}
    ${renderNotice()}
    ${renderMessageNotificationPopup()}
    ${renderErrorModal()}
    ${renderActionModal()}
    ${renderPwaLayer()}
    ${renderLoader()}
  `;
  restoreFormDrafts();
  restoreVolatileFieldDrafts();
  bindFormDraftCapture();
  restoreFocusedField(focusedFieldSnapshot);

  bindDashboardActions();
  bindModalActions();
  if (restoreAdminUsersModal) {
    requestAnimationFrame(() => {
      const nextList = document.querySelector(".admin-users-modal-list");
      if (nextList) {
        nextList.scrollTop = restoreAdminUsersModal.scrollTop || 0;
        state.adminUsersModalScrollTop = nextList.scrollTop;
      }
      const nextSearch = document.getElementById("admin-user-search-input");
      if (nextSearch && restoreAdminUsersModal.searchFocused) {
        nextSearch.focus();
        if (restoreAdminUsersModal.selectionStart !== null && restoreAdminUsersModal.selectionEnd !== null) {
          nextSearch.setSelectionRange(restoreAdminUsersModal.selectionStart, restoreAdminUsersModal.selectionEnd);
        }
      }
    });
  }
  scrollToRouteSection();
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigateToTab(button.dataset.tab);
    });
  });
}

function bindInvestmentTradeActions() {
  document.querySelectorAll("[data-open-trade-joined-users]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showActionModal({
        type: "trade-joined-users",
        tradeId: button.dataset.openTradeJoinedUsers,
      });
    });
  });

  document.querySelectorAll("[data-join-trade]").forEach((button) => {
    button.addEventListener("click", () => joinTradeNow(button.dataset.joinTrade));
  });

  document.querySelectorAll("[data-stop-trade-investment]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      reviewStopJoinedTrade(button.dataset.stopTradeInvestment);
    });
  });

  document.querySelectorAll("[data-hide-stopped-trade]").forEach((button) => {
    button.addEventListener("click", () => hideStoppedTrade(button.dataset.hideStoppedTrade));
  });
}

function bindDashboardActions() {
  bindPasswordVisibilityToggles();
  bindPwaActions();
  bindMarketModeActions();
  bindHistoryActions();
  bindFuturesActions();
  bindAdminUserDisclosureToggles();
  bindSignalFeedActions();
  bindInvestmentTradeActions();

  const notificationButton = document.getElementById("notification-toggle-btn");
  if (notificationButton) {
    notificationButton.addEventListener("click", () => {
          state.showNotifications = !state.showNotifications;
          if (state.showNotifications) {
            updateAppBadge();
          }
          render();
        });
      }

  document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      state.menuSheetOpen = !state.menuSheetOpen;
      render();
    });
  });

  document.querySelectorAll("[data-menu-close]").forEach((button) => {
    button.addEventListener("click", () => {
      state.menuSheetOpen = false;
      render();
    });
  });

  document.querySelectorAll("[data-menu-tab]").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigateToTab(button.dataset.menuTab);
    });
  });

  document.querySelectorAll("[data-menu-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.menuAction || "";
      state.menuSheetOpen = false;
      render();
      if (action === "deposit") {
        await openWalletActionModal("deposit");
      }
      if (action === "withdraw") {
        await openWalletActionModal("withdraw");
      }
      if (action === "transfer") {
        openTransferModal();
      }
      if (action === "digital-services") {
        openDigitalServicesModal();
      }
      if (action === "airtime") {
        openVtuModal("airtime");
      }
      if (action === "data") {
        openVtuModal("data");
      }
      if (action === "gift-card") {
        await openGiftCardRedeemModal();
      }
      if (action === "users") {
        showActionModal({ type: "admin-users" });
      }
    });
  });

  document.querySelectorAll("[data-balance-privacy-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      state.hideBalanceAmounts = !state.hideBalanceAmounts;
      localStorage.setItem(BALANCE_PRIVACY_STORAGE_KEY, state.hideBalanceAmounts ? "true" : "false");
      render();
    });
  });

  document.querySelectorAll("[data-settings-disclosure]").forEach((details) => {
    details.addEventListener("toggle", () => {
      const key = details.dataset.settingsDisclosure;
      if (!key) {
        return;
      }
      state.settingsDisclosureOpen = {
        ...(state.settingsDisclosureOpen || {}),
        [key]: details.open,
      };
    });
  });

  document.querySelectorAll("[data-notification-open]").forEach((button) => {
    button.addEventListener("click", () => {
      openNotification(button.dataset.notificationOpen);
    });
  });

  document.querySelectorAll("[data-message-popup-open]").forEach((button) => {
    button.addEventListener("click", () => {
      openNotification(button.dataset.messagePopupOpen);
    });
  });

  document.querySelectorAll("[data-message-popup-dismiss]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      dismissNotification(button.dataset.messagePopupDismiss);
    });
  });

  document.querySelectorAll("[data-open-quest]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.activeTab = "quest";
      if (window.history?.pushState) {
        window.history.pushState({}, "", "/?tab=quest");
      }
      render();
      await refreshQuestData();
    });
  });

  document.querySelectorAll("[data-quest-refresh]").forEach((button) => {
    button.addEventListener("click", refreshQuestData);
  });

  document.querySelectorAll("[data-quest-start]").forEach((button) => {
    button.addEventListener("click", () => startQuest(button.dataset.questStart));
  });

  document.querySelectorAll("[data-quest-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      state.quest.selectedAnswer = button.dataset.questAnswer || "";
      state.quest.feedback = null;
      render();
    });
  });

  const questFreeAnswerInput = document.getElementById("quest-free-answer-input");
  if (questFreeAnswerInput) {
    questFreeAnswerInput.addEventListener("input", () => {
      state.quest.selectedAnswer = questFreeAnswerInput.value;
      state.quest.feedback = null;
    });
  }

  document.querySelectorAll("[data-quest-submit-answer]").forEach((button) => {
    button.addEventListener("click", submitQuestAnswer);
  });

  document.querySelectorAll("[data-quest-complete]").forEach((button) => {
    button.addEventListener("click", completeQuestReward);
  });

  document.querySelectorAll("[data-quest-reveal]").forEach((button) => {
    button.addEventListener("click", revealQuestReward);
  });

  document.querySelectorAll("[data-quest-redeem]").forEach((button) => {
    button.addEventListener("click", redeemQuestReward);
  });

  document.querySelectorAll("[data-quest-view]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.quest.view = button.dataset.questView || "play";
      if (window.history?.pushState) {
        const nextPath = state.quest.view === "rewards"
          ? "/?tab=quest&questView=rewards"
          : state.quest.view === "history"
            ? "/?tab=quest&questView=history"
            : "/?tab=quest";
        window.history.pushState({}, "", nextPath);
      }
      render();
      await refreshQuestData();
    });
  });

  const adminQuestForm = document.getElementById("admin-quest-form");
  if (adminQuestForm) {
    adminQuestForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminQuest(adminQuestForm);
    });
    adminQuestForm.querySelectorAll("[data-admin-quest-option], [name^='stagePrompt-'], [name^='stageAnswer-'], [name^='stageExplanation-'], [name^='stageHint-']").forEach((field) => {
      field.addEventListener("change", () => {
        setAdminQuestDraftFromForm(adminQuestForm);
        render();
      });
    });
    adminQuestForm.querySelectorAll("[name^='stageType-']").forEach((field) => {
      field.addEventListener("change", () => {
        setAdminQuestDraftFromForm(adminQuestForm);
        const index = field.name.replace("stageType-", "");
        const stages = state.quest.draft?.stages || [];
        if (field.value === "true-false" && stages[index]) {
          stages[index] = {
            ...stages[index],
            type: "true-false",
            options: ["True", "False", "", ""],
            correctAnswer: stages[index].correctAnswer === "False" ? "False" : "True",
          };
        }
        render();
      });
    });
    const addStageButton = adminQuestForm.querySelector("[data-admin-quest-add-stage]");
    if (addStageButton) {
      addStageButton.addEventListener("click", () => {
        setAdminQuestDraftFromForm(adminQuestForm);
        state.quest.draft = {
          ...state.quest.draft,
          stages: [...(state.quest.draft?.stages || []), normalizeQuestStage()],
        };
        render();
      });
    }
    adminQuestForm.querySelectorAll("[data-admin-quest-remove-stage]").forEach((button) => {
      button.addEventListener("click", () => {
        setAdminQuestDraftFromForm(adminQuestForm);
        const removeIndex = Number(button.dataset.adminQuestRemoveStage || 0);
        const stages = (state.quest.draft?.stages || []).filter((_, index) => index !== removeIndex);
        state.quest.draft = {
          ...state.quest.draft,
          stages: stages.length ? stages : [normalizeQuestStage()],
        };
        render();
      });
    });
  }

  document.querySelectorAll("[data-admin-quest-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const quest = (state.quest.admin?.quests || []).find((item) => item.id === button.dataset.adminQuestEdit);
      if (quest) {
        setQuestDraftFromQuest(quest);
        render();
      }
    });
  });

  document.querySelectorAll("[data-admin-quest-new]").forEach((button) => {
    button.addEventListener("click", () => {
      state.quest.draft = null;
      render();
    });
  });

  document.querySelectorAll("[data-admin-quest-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      adminQuestAction("toggle", button.dataset.adminQuestToggle, button.dataset.adminQuestActive === "true");
    });
  });

  document.querySelectorAll("[data-admin-quest-duplicate]").forEach((button) => {
    button.addEventListener("click", () => adminQuestAction("duplicate", button.dataset.adminQuestDuplicate));
  });

  document.querySelectorAll("[data-admin-quest-delete]").forEach((button) => {
    button.addEventListener("click", () => adminQuestAction("delete", button.dataset.adminQuestDelete));
  });

  document.querySelectorAll("[data-list-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.listToggle;
      if (!key) {
        return;
      }
      state.expandedListKeys = isListExpanded(key)
        ? state.expandedListKeys.filter((item) => item !== key)
        : [...new Set([...state.expandedListKeys, key])];
      render();
    });
  });

  document.querySelectorAll("[data-home-promo-slide]").forEach((button) => {
    button.addEventListener("click", () => {
      state.homePromoSlide = Number(button.dataset.homePromoSlide || 0);
      render();
    });
  });

  document.querySelectorAll("[data-copy-text]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await copyTextToClipboard(button.dataset.copyText).then(() => showNotice("Copied")).catch((error) => showError(error.message || "Copy failed"));
    });
  });

  const referralShareButton = document.getElementById("referral-share-btn");
  if (referralShareButton) {
    referralShareButton.addEventListener("click", async () => {
      const link = getReferralLink();
      if (!link) {
        showError("Referral link is still loading.");
        return;
      }
      if (navigator.share) {
        await navigator.share({
          title: "Join NetrueFi",
          text: "Join me on NetrueFi and complete 2 simple tasks.",
          url: link,
        }).catch(() => undefined);
        return;
      }
      await copyTextToClipboard(link).then(() => showNotice("Referral link copied")).catch((error) => showError(error.message || "Share failed"));
    });
  }

  const exchangeSelectForm = document.getElementById("exchange-select-form");
  if (exchangeSelectForm) {
    const exchangeSelect = exchangeSelectForm.querySelector('select[name="exchange"]');
    if (exchangeSelect) {
      exchangeSelect.addEventListener("change", async () => {
        await withLoading(async () => {
          const result = await api("/api/users/preferred-exchange", {
            method: "POST",
            body: JSON.stringify({ exchange: exchangeSelect.value }),
          });
          state.user = normalizeUserPayload(result.user);
          setSelectedExchange(state.user.activeExchange || exchangeSelect.value);
          await loadDashboardData();
          showNotice(`${getExchangeLabel(getActiveExchange())} is now active`);
        }).catch((error) => showError(error.message));
      });
    }
  }

  const connectForm = document.getElementById("exchange-connect-form");
  if (connectForm) {
    connectForm.querySelectorAll("input, select").forEach((field) => {
      field.addEventListener("input", () => {
        state.settingsDraft = {
          ...state.settingsDraft,
          [field.name]: field.value,
        };
      });
      field.addEventListener("change", () => {
        state.settingsDraft = {
          ...state.settingsDraft,
          [field.name]: field.value,
        };
      });
    });

    connectForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await withLoading(async () => {
        const data = Object.fromEntries(new FormData(connectForm).entries());
        const result = await api("/api/exchange/connect", {
          method: "POST",
          body: JSON.stringify({
            exchange: data.exchange || getActiveExchange(),
            apiKey: data.apiKey,
            apiSecret: data.apiSecret,
            testnet: data.testnet === "true",
          }),
        });
        state.user = normalizeUserPayload(result.user);
        setSelectedExchange(state.user.activeExchange || data.exchange || getActiveExchange());
        clearFormDraft(connectForm);
        state.settingsDraft = {
          apiKey: "",
          apiSecret: "",
          testnet: data.testnet === "true" ? "true" : "false",
        };
        await loadDashboardData();
        showNotice(`${getExchangeLabel(getActiveExchange())} connected successfully`);
      }).catch((error) => showError(error.message));
    });
  }

  const mirrorForm = document.getElementById("mirror-form");
  if (mirrorForm) {
    mirrorForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await withLoading(async () => {
        const data = Object.fromEntries(new FormData(mirrorForm).entries());
        const result = await api("/api/users/mirror", {
          method: "POST",
          body: JSON.stringify({ enabled: data.enabled === "true" }),
        });
        state.user = normalizeUserPayload(result.user);
        clearFormDraft(mirrorForm);
        render();
        showNotice("Mirror preference updated");
      }).catch((error) => showError(error.message));
    });
  }

  const userPasswordForm = document.getElementById("user-password-form");
  if (userPasswordForm) {
    userPasswordForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitUserPasswordChange(userPasswordForm);
    });
  }

  const userSupportMessageForm = document.getElementById("user-support-message-form");
  if (userSupportMessageForm) {
    userSupportMessageForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitUserSupportMessage(userSupportMessageForm);
    });
  }

  const userBankAccountForm = document.getElementById("user-bank-account-form");
  if (userBankAccountForm) {
    userBankAccountForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitUserBankAccount(userBankAccountForm);
    });
  }

  const signalAutoTradeForm = document.getElementById("signal-auto-trade-form");
  if (signalAutoTradeForm) {
    signalAutoTradeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await withLoading(async () => {
        const data = Object.fromEntries(new FormData(signalAutoTradeForm).entries());
        const payload = await api("/api/signals/auto-trade", {
          method: "POST",
          body: JSON.stringify({
            enabled: data.enabled === "true",
          }),
        });
        state.signalAutoTrade = normalizeSignalAutoTradePayload(payload);
        clearFormDraft(signalAutoTradeForm);
        render();
        showNotice(`Signal auto trade ${state.signalAutoTrade.settings.enabled ? "enabled" : "disabled"}`);
      }).catch((error) => showError(error.message));
    });
  }

  const adminDepositSettingsForm = document.getElementById("admin-deposit-settings-form");
  if (adminDepositSettingsForm) {
    const updateAdminDepositSettingsDraft = () => {
      state.adminDepositSettingsDraft = Object.fromEntries(new FormData(adminDepositSettingsForm).entries());
    };
    adminDepositSettingsForm.addEventListener("input", updateAdminDepositSettingsDraft);
    adminDepositSettingsForm.addEventListener("change", updateAdminDepositSettingsDraft);
    adminDepositSettingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminDepositSettings(adminDepositSettingsForm);
    });
  }

  const adminReferralSettingsForm = document.getElementById("admin-referral-settings-form");
  if (adminReferralSettingsForm) {
    adminReferralSettingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminReferralSettings(adminReferralSettingsForm);
    });
  }

  document.querySelectorAll("[data-admin-referral-page]").forEach((button) => {
    button.addEventListener("click", async () => {
      const offset = Number(button.dataset.adminReferralPage || 0);
      await withLoading(() => loadAdminReferralData(offset).then(() => render())).catch((error) => showError(error.message));
    });
  });

  const adminVtuSettingsForm = document.getElementById("admin-vtu-settings-form");
  if (adminVtuSettingsForm) {
    adminVtuSettingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminVtuSettings(adminVtuSettingsForm);
    });
  }

  const adminVtuTestButton = document.getElementById("admin-vtu-test-btn");
  if (adminVtuTestButton) {
    adminVtuTestButton.addEventListener("click", () => refreshAdminVtuConnection("test"));
  }

  const adminVtuBalanceButton = document.getElementById("admin-vtu-balance-btn");
  if (adminVtuBalanceButton) {
    adminVtuBalanceButton.addEventListener("click", () => refreshAdminVtuConnection("balance"));
  }

  document.querySelectorAll("[data-admin-vtu-requery]").forEach((button) => {
    button.addEventListener("click", () => requeryAdminVtuTransaction(button.dataset.adminVtuRequery));
  });

  const adminDigitalServicesForm = document.getElementById("admin-digital-services-settings-form");
  if (adminDigitalServicesForm) {
    adminDigitalServicesForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminDigitalServicesSettings(adminDigitalServicesForm);
    });
  }

  const adminDigitalServicesSyncButton = document.getElementById("admin-digital-services-sync-btn");
  if (adminDigitalServicesSyncButton) {
    adminDigitalServicesSyncButton.addEventListener("click", syncAdminDigitalServices);
  }

  document.querySelectorAll("[data-admin-digital-product-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminDigitalProductOverride(form);
    });
  });

  document.querySelectorAll("[data-admin-digital-product-refresh]").forEach((button) => {
    button.addEventListener("click", () => refreshAdminDigitalProductPrice(button.dataset.adminDigitalProductRefresh));
  });

  document.querySelectorAll("[data-admin-digital-order-requery]").forEach((button) => {
    button.addEventListener("click", () => requeryAdminDigitalOrder(button.dataset.adminDigitalOrderRequery));
  });

  document.querySelectorAll("[data-admin-bonus-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminUserBonus(form, form.dataset.adminBonusForm);
    });
  });

  document.querySelectorAll("[data-admin-balance-open]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showActionModal({ type: "admin-balance", userId: button.dataset.adminBalanceOpen });
    });
  });

  document.querySelectorAll("[data-admin-profile-open]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const userId = button.dataset.adminProfileOpen;
      showActionModal({
        type: "admin-user-profile",
        userId,
        userSnapshot: state.users.find((user) => user.id === userId) || null,
        returnModal: { type: "admin-users" },
      });
    });
  });

  document.querySelectorAll("[data-admin-review-clear]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearAdminUserReview(button.dataset.adminReviewClear);
    });
  });

  document.querySelectorAll("[data-admin-users-open]").forEach((button) => {
    button.addEventListener("click", () => {
      showActionModal({ type: "admin-users" });
    });
  });

  document.querySelectorAll("[data-admin-balance-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminUserBalance(form, form.dataset.adminBalanceForm);
    });
  });

  document.querySelectorAll("[data-admin-message-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminUserMessage(form, form.dataset.adminMessageForm);
    });
  });

  document.querySelectorAll("[data-admin-email-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminEmailUpdate(form, form.dataset.adminEmailForm);
    });
  });

  document.querySelectorAll("[data-admin-user-trade-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminUserTradeJoin(form, form.dataset.adminUserTradeForm);
    });
  });

  document.querySelectorAll("[data-finance-history-id]").forEach((input) => {
    input.addEventListener("change", () => {
      toggleFinanceHistorySelection(input.dataset.financeHistoryKind, input.dataset.financeHistoryId, input.checked);
    });
  });

  const financeHistorySelectAllButton = document.getElementById("finance-history-select-all-btn");
  if (financeHistorySelectAllButton) {
    financeHistorySelectAllButton.addEventListener("click", () => {
      const keys = getFinanceHistoryKeys();
      state.selectedFinanceHistoryIds = state.selectedFinanceHistoryIds.length === keys.length ? [] : keys;
      render();
    });
  }

  const financeHistoryDeleteButton = document.getElementById("finance-history-delete-btn");
  if (financeHistoryDeleteButton) {
    financeHistoryDeleteButton.addEventListener("click", () => {
      deleteSelectedFinanceHistory();
    });
  }

  const adminGiftCardForm = document.getElementById("admin-gift-card-form");
  if (adminGiftCardForm) {
    adminGiftCardForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAdminGiftCard(adminGiftCardForm);
    });
  }

  const balancesToggle = document.getElementById("toggle-balances-btn");
  if (balancesToggle) {
    balancesToggle.addEventListener("click", () => {
      state.showAllBalances = !state.showAllBalances;
      render();
    });
  }

  const watchlistToggle = document.getElementById("toggle-watchlist-btn");
  if (watchlistToggle) {
    watchlistToggle.addEventListener("click", () => {
      state.showAllWatchlist = !state.showAllWatchlist;
      render();
    });
  }

  const depositButton = document.getElementById("netrue-deposit-btn");
  if (depositButton) {
    depositButton.addEventListener("click", () => openWalletActionModal("deposit"));
  }

  const withdrawButton = document.getElementById("netrue-withdraw-btn");
  if (withdrawButton) {
    withdrawButton.addEventListener("click", () => openWalletActionModal("withdraw"));
  }

  document.querySelectorAll("[data-vtu-open]").forEach((button) => {
    button.addEventListener("click", () => openVtuModal(button.dataset.vtuOpen));
  });

  document.querySelectorAll("[data-digital-services-open]").forEach((button) => {
    button.addEventListener("click", () => openDigitalServicesModal());
  });

  document.querySelectorAll("[data-digital-services-refresh]").forEach((button) => {
    button.addEventListener("click", () => openDigitalServicesModal({ force: true }));
  });

  const digitalSearchInput = document.getElementById("digital-service-search-input");
  if (digitalSearchInput) {
    digitalSearchInput.addEventListener("input", () => {
      state.digitalServices.query = digitalSearchInput.value;
      window.clearTimeout(state.digitalServices.searchTimer);
      state.digitalServices.searchTimer = window.setTimeout(() => {
        void loadDigitalServiceProducts().then(() => render()).catch((error) => showError(error.message));
      }, 250);
    });
  }

  const storeSearchInput = document.getElementById("store-search-input");
  if (storeSearchInput) {
    storeSearchInput.addEventListener("input", () => {
      state.digitalServices.query = storeSearchInput.value;
      window.clearTimeout(state.digitalServices.searchTimer);
      state.digitalServices.searchTimer = window.setTimeout(() => {
        void loadDigitalServiceProducts().then(() => render()).catch((error) => showError(error.message));
      }, 250);
    });
  }

  document.querySelectorAll("[data-digital-service-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.digitalServices.category = button.dataset.digitalServiceCategory || "";
      void loadDigitalServiceProducts().then(() => render()).catch((error) => showError(error.message));
      render();
    });
  });

  document.querySelectorAll("[data-store-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.digitalServices.category = button.dataset.storeCategory || "";
      void loadDigitalServiceProducts().then(() => render()).catch((error) => showError(error.message));
      render();
    });
  });

  document.querySelectorAll("[data-digital-services-page-refresh]").forEach((button) => {
    button.addEventListener("click", () => {
      void loadDigitalServiceProducts({ force: true }).then(() => render()).catch((error) => showError(error.message));
      render();
    });
  });

  document.querySelectorAll("[data-digital-service-order-receipt]").forEach((button) => {
    button.addEventListener("click", () => {
      const order = getDigitalServiceOrderById(button.dataset.digitalServiceOrderReceipt);
      if (!order) {
        showError("Purchase receipt is not available yet.");
        return;
      }
      state.actionModal = {
        type: "digital-service-receipt",
        order,
      };
      render();
    });
  });

  document.querySelectorAll("[data-digital-service-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = getDigitalServiceProductById(button.dataset.digitalServiceProduct);
      if (!product) {
        return;
      }
      state.actionModal = {
        type: "digital-service-detail",
        productId: product.id,
        product,
        quantity: 1,
        returnTo: state.activeTab === "store" ? "store" : "modal",
      };
      render();
    });
  });

  document.querySelectorAll("[data-digital-services-back]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.actionModal?.returnTo === "store") {
        state.actionModal = null;
        render();
        return;
      }
      openDigitalServicesModal();
    });
  });

  document.querySelectorAll("[data-digital-services-back-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      state.actionModal = {
        type: "digital-service-detail",
        productId: state.actionModal?.productId,
        product: state.actionModal?.product,
        quantity: state.actionModal?.quantity || 1,
        returnTo: state.actionModal?.returnTo || (state.activeTab === "store" ? "store" : "modal"),
      };
      render();
    });
  });

  const digitalQuantityInput = document.getElementById("digital-service-quantity-input");
  if (digitalQuantityInput) {
    digitalQuantityInput.addEventListener("input", () => {
      state.actionModal = {
        ...state.actionModal,
        quantity: Math.max(1, Math.min(Number(digitalQuantityInput.value || 1), 1000)),
      };
      render();
    });
  }

  const digitalReviewButton = document.getElementById("digital-service-review-btn");
  if (digitalReviewButton) {
    digitalReviewButton.addEventListener("click", reviewDigitalServicePurchase);
  }

  const digitalConfirmButton = document.getElementById("digital-service-confirm-btn");
  if (digitalConfirmButton) {
    digitalConfirmButton.addEventListener("click", submitDigitalServicePurchase);
  }

  const transferOpenButton = document.querySelector("[data-transfer-open]");
  if (transferOpenButton) {
    transferOpenButton.addEventListener("click", openTransferModal);
  }

  document.querySelectorAll("[data-vtu-network]").forEach((button) => {
    button.addEventListener("click", () => {
      const productType = state.actionModal?.type === "vtu-data" ? "data" : "airtime";
      saveVtuModalDraft(productType);
      const nextNetwork = button.dataset.vtuNetwork || "";
      if (productType === "data") {
        state.actionModal = {
          ...state.actionModal,
          network: nextNetwork,
          variationId: "",
          amount: "",
        };
        void loadVtuDataPlans(nextNetwork, { force: true })
          .then(() => render())
          .catch((error) => showError(error.message));
      } else {
        state.actionModal = {
          ...state.actionModal,
          network: nextNetwork,
        };
      }
      render();
    });
  });

  document.querySelectorAll("[data-vtu-recent]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = (state.vtuTransactions || []).find((transaction) => transaction.id === button.dataset.vtuRecent);
      if (!item) {
        return;
      }
      state.actionModal = {
        ...state.actionModal,
        phone: item.phone || state.actionModal.phone || "",
        network: item.network || state.actionModal.network || "",
        amount: item.productType === "airtime" ? String(item.faceValue || item.amountCharged || "") : state.actionModal.amount || "",
        variationId: "",
      };
      if (state.actionModal.type === "vtu-data" && state.actionModal.network) {
        void loadVtuDataPlans(state.actionModal.network, { force: false })
          .then(() => render())
          .catch((error) => showError(error.message));
      }
      render();
    });
  });

  const vtuPhoneInput = document.getElementById("vtu-phone-input");
  if (vtuPhoneInput) {
    vtuPhoneInput.addEventListener("input", () => {
      saveVtuModalDraft(state.actionModal?.type === "vtu-data" ? "data" : "airtime");
      updateVtuReviewButtonState();
    });
  }

  const vtuAmountInput = document.getElementById("vtu-amount-input");
  if (vtuAmountInput) {
    vtuAmountInput.addEventListener("input", () => {
      saveVtuModalDraft("airtime");
      updateVtuReviewButtonState();
    });
  }

  const vtuPlanInput = document.getElementById("vtu-plan-input");
  if (vtuPlanInput) {
    vtuPlanInput.addEventListener("change", () => {
      saveVtuModalDraft("data");
      render();
    });
  }

  const vtuPackageOpenButton = document.getElementById("vtu-package-open-btn");
  if (vtuPackageOpenButton) {
    vtuPackageOpenButton.addEventListener("click", () => {
      saveVtuModalDraft("data");
      state.actionModal = {
        ...state.actionModal,
        packageSheet: true,
      };
      render();
    });
  }

  const vtuPackageCloseButton = document.getElementById("vtu-package-close-btn");
  if (vtuPackageCloseButton) {
    vtuPackageCloseButton.addEventListener("click", () => {
      state.actionModal = {
        ...state.actionModal,
        packageSheet: false,
      };
      render();
    });
  }

  document.querySelectorAll("[data-vtu-plan-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.actionModal = {
        ...state.actionModal,
        packageCategory: button.dataset.vtuPlanCategory || "Daily",
      };
      render();
    });
  });

  document.querySelectorAll("[data-vtu-plan-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const plan = (state.vtuDataPlans || []).find((item) => item.id === button.dataset.vtuPlanSelect || item.variationId === button.dataset.vtuPlanSelect);
      state.actionModal = {
        ...state.actionModal,
        variationId: button.dataset.vtuPlanSelect || "",
        amount: plan?.sellingPrice || "",
        packageSheet: false,
      };
      render();
    });
  });

  document.querySelectorAll("[data-vtu-airtime-amount]").forEach((button) => {
    button.addEventListener("click", () => {
      state.actionModal = {
        ...state.actionModal,
        amount: button.dataset.vtuAirtimeAmount,
      };
      render();
    });
  });

  const transferSubmitButton = document.getElementById("transfer-submit-btn");
  if (transferSubmitButton) {
    const updateTransferDraft = (shouldRender = false) => {
      saveTransferModalDraft();
      updateTransferButtonState();
      if (shouldRender) {
        render();
      }
    };
    ["transfer-email-input", "transfer-amount-input", "transfer-note-input"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () => updateTransferDraft(false));
      }
    });
    const transferCurrencyInput = document.getElementById("transfer-currency-input");
    if (transferCurrencyInput) {
      transferCurrencyInput.addEventListener("change", () => updateTransferDraft(true));
    }
    transferSubmitButton.addEventListener("click", submitInAppTransfer);
  }

  const vtuReviewButton = document.getElementById("vtu-review-btn");
  if (vtuReviewButton) {
    vtuReviewButton.addEventListener("click", () => reviewVtuPurchase(vtuReviewButton.dataset.vtuProduct));
  }

  const vtuConfirmButton = document.getElementById("vtu-confirm-btn");
  if (vtuConfirmButton) {
    vtuConfirmButton.addEventListener("click", submitVtuPurchase);
  }

  const withdrawReviewConfirmButton = document.getElementById("withdraw-review-confirm-btn");
  if (withdrawReviewConfirmButton) {
    withdrawReviewConfirmButton.addEventListener("click", () => submitReviewedWithdrawal());
  }

  const manualDepositButton = document.getElementById("wallet-manual-deposit-btn");
  if (manualDepositButton) {
    manualDepositButton.addEventListener("click", () => {
      state.actionModal = {
        ...state.actionModal,
        depositMode: "manual",
      };
      render();
    });
  }

  const giftRedeemButton = document.getElementById("wallet-gift-redeem-btn");
  if (giftRedeemButton) {
    giftRedeemButton.addEventListener("click", () => {
      state.actionModal = {
        ...state.actionModal,
        depositMode: "gift",
        currency: "",
      };
      render();
    });
  }

  document.querySelectorAll("[data-wallet-currency]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextCurrency = button.dataset.walletCurrency;
      const savedBanks = getSavedBankAccounts();
      const nextModal = {
        ...state.actionModal,
        currency: nextCurrency,
      };
      if (state.actionModal?.type === "withdraw" && nextCurrency === "NGN") {
        nextModal.bankMode = savedBanks.length ? "saved" : "new";
        nextModal.bankAccountId = savedBanks[0]?.id || "";
        state.resolvedBankAccount = savedBanks[0] || null;
      }
      if (state.actionModal?.type === "withdraw" && nextCurrency !== "NGN") {
        state.resolvedBankAccount = null;
      }
      state.actionModal = {
        ...nextModal,
      };
      if (nextCurrency === "NGN" && state.actionModal?.type === "withdraw") {
        void loadPaymentBanks().then(() => render()).catch((error) => showError(error.message));
      }
      render();
    });
  });

  document.querySelectorAll("[data-saved-bank-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const savedBank = getSavedBankAccounts().find((account) => account.id === button.dataset.savedBankId);
      if (!savedBank) {
        return;
      }
      state.resolvedBankAccount = savedBank;
      state.actionModal = {
        ...state.actionModal,
        bankMode: "saved",
        bankAccountId: savedBank.id,
      };
      render();
    });
  });

  document.querySelectorAll("[data-saved-bank-remove]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeSavedBankAccount(button.dataset.savedBankRemove);
    });
  });

  const useNewBankButton = document.getElementById("wallet-use-new-bank-btn");
  if (useNewBankButton) {
    useNewBankButton.addEventListener("click", () => {
      state.resolvedBankAccount = null;
      state.actionModal = {
        ...state.actionModal,
        bankMode: "new",
        bankAccountId: "",
        bankCode: "",
      };
      void loadPaymentBanks().then(() => render()).catch((error) => showError(error.message));
      render();
    });
  }

  const useSavedBankButton = document.getElementById("wallet-use-saved-bank-btn");
  if (useSavedBankButton) {
    useSavedBankButton.addEventListener("click", () => {
      const savedBanks = getSavedBankAccounts();
      state.resolvedBankAccount = savedBanks[0] || null;
      state.actionModal = {
        ...state.actionModal,
        bankMode: "saved",
        bankAccountId: savedBanks[0]?.id || "",
      };
      render();
    });
  }

  const bankCodeInput = document.getElementById("wallet-bank-code-input");
  if (bankCodeInput) {
    bankCodeInput.addEventListener("change", () => {
      state.resolvedBankAccount = null;
      state.actionModal = {
        ...state.actionModal,
        bankMode: "new",
        bankCode: bankCodeInput.value,
      };
      render();
    });
  }

  const walletSubmitButton = document.getElementById("wallet-submit-btn");
  const accountInput = document.getElementById("wallet-account-input");
  if (accountInput && walletSubmitButton?.dataset.walletCurrencySelected === "NGN") {
    accountInput.addEventListener("input", () => {
      state.resolvedBankAccount = null;
    });
  }

  const resolveBankButton = document.getElementById("wallet-resolve-bank-btn");
  if (resolveBankButton) {
    resolveBankButton.addEventListener("click", resolveSelectedBankAccount);
  }

  if (walletSubmitButton) {
    const amountInput = document.getElementById("wallet-amount-input");
    updateWalletEquivalentPreview(amountInput, walletSubmitButton.dataset.walletCurrencySelected || state.actionModal?.currency || "USDT");
    if (amountInput) {
      amountInput.addEventListener("input", () => {
        updateWalletEquivalentPreview(amountInput, walletSubmitButton.dataset.walletCurrencySelected || state.actionModal?.currency || "USDT");
      });
    }
    const giftCodeInput = document.getElementById("gift-card-code-input");
    if (giftCodeInput) {
      giftCodeInput.addEventListener("input", () => {
        const digits = giftCodeInput.value.replace(/\D/g, "").slice(0, 14);
        giftCodeInput.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
      });
    }
    walletSubmitButton.addEventListener("click", async () => {
      const mode = walletSubmitButton.dataset.walletMode || "deposit";
      const currency = walletSubmitButton.dataset.walletCurrencySelected || state.actionModal?.currency || "USDT";
      const amount = amountInput?.value?.trim();

      if (mode === "gift-card") {
        const code = document.getElementById("gift-card-code-input")?.value?.replace(/\D/g, "").trim() || "";
        if (!/^\d{14}$/.test(code)) {
          showError("Enter a valid 14 digit gift card number.");
          return;
        }
        await withLoading(async () => {
          const headers = { "Idempotency-Key": `gift-card-${Date.now()}-${Math.random().toString(16).slice(2)}` };
          await api("/api/gift-cards/redeem", {
            method: "POST",
            headers,
            body: JSON.stringify({ code }),
          });
          await loadFinancialDashboard();
          clearWalletDrafts();
          clearActionModal();
          showNotice("Gift card redeemed.");
          render();
        }).catch((error) => showError(error.message));
        return;
      }

      const depositPayload = {
        currency,
        amount,
        transactionHash: document.getElementById("wallet-tx-input")?.value?.trim()
          || document.getElementById("wallet-reference-input")?.value?.trim()
          || "",
        depositorName: document.getElementById("wallet-sender-input")?.value?.trim() || "",
      };
      const destination = currency === "USDT"
        ? {
            address: document.getElementById("wallet-address-input")?.value?.trim() || "",
            network: document.getElementById("wallet-network-input")?.value?.trim() || "",
          }
        : null;

      if (!amount || Number(amount) <= 0) {
        showError("Enter a valid amount.");
        return;
      }
      if (mode === "withdraw") {
        const settings = getFinancialSettings();
        const minimum = Number(currency === "NGN" ? settings.withdrawal?.minNgn || 500 : settings.withdrawal?.minUsdt || 50);
        if (Number(amount) < minimum) {
          showError(`Minimum withdrawal is ${currency === "NGN" ? formatNaira(minimum) : formatUsdtUnit(minimum)}.`);
          return;
        }
        const fee = Number(currency === "NGN" ? settings.withdrawal?.ngnFee || 100 : 0);
        if (Number.isFinite(fee) && fee > 0 && Number(amount) <= fee) {
          showError(`Withdrawal amount must be greater than the ${currency === "NGN" ? formatNaira(fee) : formatUsdtUnit(fee)} fee.`);
          return;
        }
      }
      if (mode === "withdraw" && currency === "USDT" && (!destination.address || !destination.network)) {
        showError("Enter wallet address and network.");
        return;
      }
      const savedBank = getSavedBankAccounts().find((account) => account.id === state.actionModal?.bankAccountId);
      const bankAccount = state.resolvedBankAccount || savedBank || null;
      const withdrawalPayload = {
        currency,
        amount,
        destination,
      };
      if (mode === "withdraw" && currency === "NGN") {
        const useSavedBank = state.actionModal?.bankMode !== "new" && savedBank?.id;
        const bankCode = document.getElementById("wallet-bank-code-input")?.value || bankAccount?.bankCode || "";
        const accountNumber = document.getElementById("wallet-account-input")?.value?.replace(/\D/g, "").trim()
          || bankAccount?.accountNumber
          || "";
        if (!isBankAccountNameAccepted(bankAccount)) {
          showError("Resolve a bank account that matches your registered first and last name.");
          return;
        }
        if (useSavedBank) {
          withdrawalPayload.bankAccountId = savedBank.id;
        } else {
          if (!bankAccount?.verified || !bankCode || !/^\d{10}$/.test(accountNumber)) {
            showError("Resolve your bank account first.");
            return;
          }
          withdrawalPayload.bankName = bankAccount.bankName || "";
          withdrawalPayload.bankCode = bankCode;
          withdrawalPayload.accountNumber = accountNumber;
          withdrawalPayload.saveBankAccount = document.getElementById("wallet-save-bank-input")?.checked !== false;
        }
      }

      if (mode === "withdraw") {
        state.actionModal = {
          type: "withdraw-review",
          withdrawalPayload,
        };
        render();
        return;
      }

      await withLoading(async () => {
        const headers = { "Idempotency-Key": `${mode}-${Date.now()}-${Math.random().toString(16).slice(2)}` };
        if (mode === "deposit") {
          await api("/api/deposits", {
            method: "POST",
            headers,
            body: JSON.stringify(depositPayload),
          });
          await loadFinancialDashboard();
          clearWalletDrafts();
          clearActionModal();
          showNotice("Deposit submitted. Waiting for admin confirmation.");
          render();
          return;
        }

      }).catch((error) => showError(error.message));
    });
  }

  document.querySelectorAll("[data-theme-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.themeMode;
      applyTheme();
      render();
      showNotice(`${state.theme === "dark" ? "Dark" : "Light"} mode enabled`);
    });
  });

  document.querySelectorAll("[data-admin-deposit-approve]").forEach((button) => {
    button.addEventListener("click", () => submitAdminFinanceAction("approveDeposit", button.dataset.adminDepositApprove));
  });

  document.querySelectorAll("[data-admin-deposit-reject]").forEach((button) => {
    button.addEventListener("click", () => submitAdminFinanceAction("rejectDeposit", button.dataset.adminDepositReject));
  });

  document.querySelectorAll("[data-admin-withdrawal-process]").forEach((button) => {
    button.addEventListener("click", () => submitAdminFinanceAction("processWithdrawal", button.dataset.adminWithdrawalProcess));
  });

  document.querySelectorAll("[data-admin-withdrawal-approve]").forEach((button) => {
    button.addEventListener("click", () => submitAdminFinanceAction("approveWithdrawal", button.dataset.adminWithdrawalApprove));
  });

  document.querySelectorAll("[data-admin-withdrawal-details]").forEach((button) => {
    button.addEventListener("click", () => {
      const withdrawalId = button.dataset.adminWithdrawalDetails;
      if (!withdrawalId) {
        return;
      }
      state.actionModal = {
        type: "admin-manual-withdrawal",
        withdrawalId,
      };
      render();
    });
  });

  document.querySelectorAll("[data-admin-withdrawal-manual]").forEach((button) => {
    button.addEventListener("click", () => submitAdminManualWithdrawal(button.dataset.adminWithdrawalManual));
  });

  const manualReferenceInput = document.getElementById("manual-withdrawal-reference-input");
  if (manualReferenceInput) {
    manualReferenceInput.addEventListener("input", () => {
      state.actionModal = {
        ...(state.actionModal || {}),
        manualReference: manualReferenceInput.value,
      };
    });
  }

  const manualNoteInput = document.getElementById("manual-withdrawal-note-input");
  if (manualNoteInput) {
    manualNoteInput.addEventListener("input", () => {
      state.actionModal = {
        ...(state.actionModal || {}),
        adminNote: manualNoteInput.value,
      };
    });
  }

  document.querySelectorAll("[data-admin-withdrawal-complete]").forEach((button) => {
    button.addEventListener("click", () => submitAdminFinanceAction("completeWithdrawal", button.dataset.adminWithdrawalComplete));
  });

  document.querySelectorAll("[data-admin-withdrawal-reject]").forEach((button) => {
    button.addEventListener("click", () => submitAdminFinanceAction("rejectWithdrawal", button.dataset.adminWithdrawalReject));
  });

  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
      clearAuthSessionToken();
      disconnectWatchSocket();
      disconnectSignalStream();
      disconnectSettingsUsersSocket();
      stopSignalChartRefreshTimer();
      if (window.SignalPage?.destroyActiveChart) {
        window.SignalPage.destroyActiveChart();
      }
      stopTradeRefreshTimer();
      seenSignalIds.clear();
      state.user = null;
      state.activeTab = "home";
      state.actionModal = null;
      state.balances = [];
      state.openOrders = [];
      state.trades = [];
      state.futuresAccount = null;
      state.dashboardMarketMode = "spot";
      state.expandedFuturesPositionIds = [];
      state.expandedFuturesOrderIds = [];
      state.users = [];
      state.adminDeposits = [];
      state.adminWithdrawals = [];
      state.adminTransactions = [];
      state.financialDashboard = null;
      state.notifications = [];
      state.showNotifications = false;
      state.totalUsdt = 0;
      state.previousTotalUsdt = 0;
      state.totalNgn = 0;
      state.usdtNgnRate = 0;
      state.todayPnlValue = 0;
      state.todayPnlPercent = 0;
      state.todayLabel = "";
      state.monthPnlValue = 0;
      state.monthPnlPercent = 0;
      state.monthLabel = "";
      state.estimatedPnlValue = 0;
      state.estimatedPnlPercent = 0;
      state.signalChart = {
        symbol: "",
        interval: "15m",
        chartType: "candles",
        candles: [],
        guidePrice: null,
        loading: false,
      };
      state.tradeMarketMap = {};
      state.settingsDraft = {
        apiKey: "",
        apiSecret: "",
        testnet: "false",
      };
      state.signalAutoTrade = getDefaultSignalAutoTradeState();
      state.signalFeed = {
        pairs: [],
        timeframe: "15m",
        supportedTimeframes: ["15m", "1h", "1d"],
        signals: [],
        streamConnected: false,
        statusMessage: "Connecting to the live signal engine...",
        notificationPermission: typeof Notification === "undefined" ? "unsupported" : Notification.permission,
        audioEnabled: localStorage.getItem(SIGNAL_AUDIO_ENABLED_STORAGE_KEY) !== "false",
        audioUnlocked: false,
        selectedIds: [],
        deleting: false,
        switchingTimeframe: false,
      };
      state.expandedTradeIds = [];
      state.expandedPendingOrderIds = [];
      state.expandedAdminUserIds = [];
      state.selectedHistoryTradeIds = [];
      state.selectedFinanceHistoryIds = [];
      state.adminPasswordDrafts = {};
      state.revealedAdminPasswordIds = [];
      state.showSplash = false;
      tradeDraft = getTradeFormDefaults();
      if (window.history?.replaceState) {
        window.history.replaceState({}, "", getTabRoute("home"));
      }
      render();
    });
  }

  document.querySelectorAll("[data-admin-password-input]").forEach((input) => {
    input.addEventListener("input", () => {
      setAdminPasswordDraft(input.dataset.adminPasswordInput, input.value);
    });
  });

  document.querySelectorAll("[data-admin-password-visibility]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleAdminPasswordVisibility(button.dataset.adminPasswordVisibility);
    });
  });

  document.querySelectorAll("[data-admin-password-save]").forEach((button) => {
    button.addEventListener("click", () => {
      submitAdminPasswordReset(button.dataset.adminPasswordSave);
    });
  });

  document.querySelectorAll("[data-admin-toggle-mirror]").forEach((button) => {
    button.addEventListener("click", () => {
      updateAdminMirror(button.dataset.adminToggleMirror, button.dataset.adminMirrorEnabled === "true");
    });
  });

  document.querySelectorAll("[data-admin-delete-user]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteAdminUser(button.dataset.adminDeleteUser, button.dataset.adminUserName || "this user");
    });
  });
}

function bindSignalFeedActions() {
  const enableAlertsButton = document.getElementById("signal-alert-enable-btn");
  if (enableAlertsButton) {
    enableAlertsButton.addEventListener("click", () => {
      void enableSignalAlerts().catch(() => {
        showError("The browser blocked audio or notification permission for signal alerts.");
      });
    });
  }

  const selectAllButton = document.getElementById("signal-select-all-btn");
  if (selectAllButton) {
    selectAllButton.addEventListener("click", () => {
      toggleSelectAllSignals();
    });
  }

  const deleteButton = document.getElementById("signal-delete-btn");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      void deleteSelectedSignals();
    });
  }

  document.querySelectorAll("[data-signal-timeframe]").forEach((button) => {
    button.addEventListener("click", () => {
      void updateSignalTimeframe(button.dataset.signalTimeframe);
    });
  });

  document.querySelectorAll("[data-signal-select]").forEach((input) => {
    input.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    input.addEventListener("change", () => {
      toggleSignalSelection(input.dataset.signalSelect);
    });
  });

  document.querySelectorAll("[data-open-signal]").forEach((button) => {
    button.addEventListener("click", () => {
      openSignalModal(button.dataset.openSignal);
    });
  });

}

function updateTradeDraft(patch) {
  tradeDraft = {
    ...tradeDraft,
    ...patch,
  };

  if (tradeDraft.type === "LIMIT" || tradeDraft.side === "SELL") {
    tradeDraft.quoteOrderQty = "";
  }
}

function updateTradeSymbol(symbol) {
  const normalizedSymbol = normalizeTradeSymbolValue(symbol);
  const previousSymbol = normalizeTradeSymbolValue(tradeDraft.symbol);
  if (normalizedSymbol && normalizedSymbol !== previousSymbol) {
    updateTradeDraft({
      symbol: normalizedSymbol,
      price: "",
      quantity: "",
      quoteOrderQty: "",
      takeProfitPrice: "",
    });
    return normalizedSymbol;
  }

  updateTradeDraft({ symbol: normalizedSymbol });
  return normalizedSymbol;
}

async function applyAllocation(percent) {
  const symbol = normalizeTradeSymbolValue(tradeDraft.symbol);
  if (symbol) {
    await Promise.allSettled([
      refreshSingleMarketSymbol(symbol, {
        renderAfter: false,
        fillPrice: true,
        forcePrice: !tradeDraft.price,
      }),
      refreshTradingAccountSnapshot({ force: true, silent: true }),
    ]);
  }
  const summary = getCurrentTradeSummary();
  const livePrice = Number(summary.live.price || 0);
  const price = Number(tradeDraft.price || livePrice || 0);
  const draftPatch = {};
  if (livePrice && !tradeDraft.price) {
    draftPatch.price = String(livePrice);
  }
  if (tradeDraft.side === "BUY") {
    const budget = summary.usdtBalance * (percent / 100);
    if (budget <= 0) {
      render();
      const exchange = state.user?.role === "admin" ? getAdminDashboardExchange() : getActiveExchange();
      showError(`No available ${summary.quoteAsset} balance was found. Refresh or reconnect ${getExchangeLabel(exchange)}.`);
      return;
    }
    if (tradeDraft.type === "MARKET") {
      updateTradeDraft({
        ...draftPatch,
        quantity: "",
        quoteOrderQty: formatMarketSpendInput(budget, {
          fullBalance: percent >= 100 || budget >= summary.usdtBalance,
          quoteAsset: summary.quoteAsset,
        }),
      });
    } else if (price) {
      updateTradeDraft({
        ...draftPatch,
        quantity: String(budget / price),
        quoteOrderQty: "",
      });
    } else {
      showError(`Live price for ${summary.baseAsset}${summary.quoteAsset} is not ready yet.`);
      return;
    }
  } else {
    if (Number(summary.baseBalance || 0) <= 0) {
      render();
      showError(`No available ${summary.baseAsset} balance was found for this sell order.`);
      return;
    }
    updateTradeDraft({
      ...draftPatch,
      quantity: String(summary.baseBalance * (percent / 100)),
      quoteOrderQty: "",
    });
  }
  render();
}

function bumpField(field, direction) {
  const summary = getCurrentTradeSummary();
  const current = Number(tradeDraft[field] || 0);
  const priceStep = Math.max(Number(summary.live.price || 0) * 0.01, 0.00000001);
  const qtyStep = Math.max((summary.baseBalance || 1) * 0.05, 1);
  const step = field === "price" ? priceStep : qtyStep;
  const next = Math.max(current + step * direction, 0);
  updateTradeDraft({ [field]: next ? String(next) : "" });
  render();
}

async function submitTrade() {
  const symbol = String(tradeDraft.symbol || "").trim().toUpperCase();
  await refreshSingleMarketSymbol(symbol, {
    renderAfter: false,
    fillSpend: tradeDraft.side === "BUY" && tradeDraft.type === "MARKET",
    fillPrice: true,
  });
  const summary = getCurrentTradeSummary();
  const marketSpend = tradeDraft.side === "BUY" && tradeDraft.type === "MARKET" && Number(tradeDraft.quoteOrderQty || 0) > 0
    ? formatMarketSpendInput(tradeDraft.quoteOrderQty, {
        fullBalance: Number(tradeDraft.quoteOrderQty || 0) >= Number(summary.usdtBalance || 0),
        quoteAsset: summary.quoteAsset,
      })
    : "";
  const fallbackSpend = tradeDraft.side === "BUY" && tradeDraft.type === "MARKET" && !Number(tradeDraft.quoteOrderQty || 0)
    ? formatMarketSpendInput(summary.usdtBalance, { fullBalance: true, quoteAsset: summary.quoteAsset })
    : "";
  const payload = {
    symbol,
    side: tradeDraft.side,
    type: tradeDraft.type,
    quantity: tradeDraft.quantity,
    quoteOrderQty: tradeDraft.type === "MARKET" && tradeDraft.side === "BUY" ? marketSpend || fallbackSpend : "",
    price: tradeDraft.type === "LIMIT" ? tradeDraft.price : "",
    takeProfitPrice: tradeDraft.takeProfitPrice,
  };

  await withLoading(async () => {
    await api("/api/trades", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    tradeDraft = getTradeFormDefaults();
    await loadDashboardData();
    showNotice("Spot trade placed");
  }).catch((error) => showError(error.message));
}

function submitQuickTakeProfit(tradeId) {
  const trade = state.trades.find((item) => item.id === tradeId);
  if (!trade) {
    showError("Trade not found.");
    return;
  }
  const fallbackPrice = Number(getTradeCurrentMarket(trade.symbol)?.price || 0);
  showActionModal({
    type: "tp",
    tradeId,
    targetPrice: trade.takeProfitTargetPrice || (fallbackPrice ? String(fallbackPrice) : ""),
  });
}

async function submitQuickSell(tradeId) {
  await withLoading(async () => {
    const payload = await api(`/api/trades/${tradeId}/sell-preview`);
    showActionModal({
      type: "sell",
      tradeId,
      preview: payload.preview || null,
    });
  }).catch((error) => showError(error.message));
}

async function confirmTakeProfit(tradeId) {
  const price = document.getElementById("tp-modal-input")?.value?.trim();
  if (!price) {
    showError("Take-profit price is required.");
    return;
  }
  await withLoading(async () => {
    await api(`/api/trades/${tradeId}/take-profit`, {
      method: "POST",
      body: JSON.stringify({ price }),
    });
    clearActionModal();
    await loadDashboardData();
    showNotice("Take profit updated");
  }).catch((error) => showError(error.message));
}

async function confirmMarketSell(tradeId) {
  await withLoading(async () => {
    await api(`/api/trades/${tradeId}/sell`, {
      method: "POST",
      body: JSON.stringify({ type: "MARKET" }),
    });
    clearActionModal();
    await loadDashboardData();
    showNotice("Trade closed at market price");
  }).catch((error) => showError(error.message));
}

async function cancelPendingOrder(orderId, symbol) {
  await withLoading(async () => {
    await api(`/api/exchange/open-orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ symbol, exchange: getActiveExchange() }),
    });
    await loadDashboardData();
    showNotice(`Order ${String(orderId).slice(-8)} canceled`);
  }).catch((error) => showError(error.message));
}

async function cancelFuturesOrder(orderId, symbol) {
  await withLoading(async () => {
    await api(`/api/binance/futures/open-orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ symbol }),
    });
    state.futuresLastLoadedAt = 0;
    await loadFuturesDashboard({ force: true });
    render();
    showNotice(`Futures order ${String(orderId).slice(-8)} canceled`);
  }).catch((error) => showError(error.message));
}

async function closeFuturesPosition(symbol, positionSide, quantity) {
  if (!window.confirm(`Close the ${symbol} ${positionSide || "BOTH"} futures position at market price?`)) {
    return;
  }

  await withLoading(async () => {
    await api("/api/binance/futures/positions/close", {
      method: "POST",
      body: JSON.stringify({ symbol, positionSide, quantity }),
    });
    state.futuresLastLoadedAt = 0;
    await loadFuturesDashboard({ force: true });
    render();
    showNotice(`${symbol} futures position close order sent`);
  }).catch((error) => showError(error.message));
}

function bindMarketModeActions() {
  document.querySelectorAll("[data-market-mode]").forEach((button) => {
    button.onclick = async () => {
      const nextMode = button.dataset.marketMode || "spot";
      setDashboardMarketMode(nextMode);
      render();
      startTradeRefreshTimer();
      if (isFuturesMode()) {
        await loadFuturesDashboard({ force: !state.futuresAccount }).catch((error) => showError(error.message));
        render();
      }
    };
  });
}

function bindFuturesActions() {
  bindFuturesDisclosureToggles();

  document.querySelectorAll("[data-close-futures-position]").forEach((button) => {
    button.onclick = () =>
      closeFuturesPosition(
        button.dataset.closeFuturesPosition,
        button.dataset.positionSide,
        Number(button.dataset.positionQuantity || 0)
      );
  });

  document.querySelectorAll("[data-cancel-futures-order]").forEach((button) => {
    button.onclick = () => cancelFuturesOrder(button.dataset.cancelFuturesOrder, button.dataset.orderSymbol);
  });
}

function bindTradeTicketActions() {
  const symbolInput = document.getElementById("trade-symbol");
  const typeInput = document.getElementById("trade-type");
  const priceInput = document.getElementById("trade-price");
  const quantityInput = document.getElementById("trade-quantity");
  const totalInput = document.getElementById("trade-total");
  const takeProfitInput = document.getElementById("trade-tp");
  const submitButton = document.getElementById("trade-submit-btn");
  const bboButton = document.getElementById("use-live-price-btn");

  if (symbolInput) symbolInput.addEventListener("change", () => {
    const symbol = updateTradeSymbol(symbolInput.value);
    symbolInput.value = symbol;
    void refreshSingleMarketSymbol(symbol, { fillSpend: true, fillPrice: true });
  });
  if (symbolInput) symbolInput.addEventListener("input", () => {
    const symbol = updateTradeSymbol(symbolInput.value);
    symbolInput.value = symbol;
    scheduleTradeSymbolMarketRefresh(symbol);
  });
  if (typeInput) typeInput.addEventListener("change", () => {
    const nextType = typeInput.value === "MARKET" ? "MARKET" : "LIMIT";
    updateTradeDraft({
      type: nextType,
      quoteOrderQty: "",
      ...(nextType === "MARKET" ? { quantity: "" } : {}),
    });
    if (nextType === "MARKET") {
      syncMarketBuySpendFromBalance({ force: true });
    }
    render();
  });
  if (priceInput) priceInput.addEventListener("input", () => updateTradeDraft({ price: priceInput.value, quoteOrderQty: "" }));
  if (quantityInput) quantityInput.addEventListener("input", () => updateTradeDraft({ quantity: quantityInput.value, quoteOrderQty: "" }));
  if (totalInput) totalInput.addEventListener("input", () => {
    const summary = getCurrentTradeSummary();
    const total = Number(totalInput.value || 0);
    const price = Number(tradeDraft.price || summary.live.price || 0);

    if (tradeDraft.type === "MARKET" && tradeDraft.side === "BUY") {
      updateTradeDraft({ quoteOrderQty: totalInput.value });
    } else {
      updateTradeDraft({
        quantity: price ? String(total / price) : tradeDraft.quantity,
        quoteOrderQty: "",
      });
    }
  });
  if (takeProfitInput) takeProfitInput.addEventListener("input", () => updateTradeDraft({ takeProfitPrice: takeProfitInput.value }));
  if (submitButton) submitButton.addEventListener("click", submitTrade);
  if (bboButton) bboButton.addEventListener("click", async () => {
    await Promise.allSettled([
      refreshSingleMarketSymbol(tradeDraft.symbol, { renderAfter: false, fillSpend: true, fillPrice: true, forcePrice: true }),
      refreshTradingAccountSnapshot({ force: true, silent: true }),
    ]);
    const live = getSymbolData(tradeDraft.symbol);
    updateTradeDraft({ price: live.price ? String(live.price) : tradeDraft.price });
    syncMarketBuySpendFromBalance({ force: true });
    render();
  });

  document.querySelectorAll("[data-side]").forEach((button) => {
    button.addEventListener("click", () => {
      updateTradeDraft({ side: button.dataset.side, quoteOrderQty: "" });
      syncMarketBuySpendFromBalance({ force: button.dataset.side === "BUY" });
      render();
    });
  });

  document.querySelectorAll("[data-alloc]").forEach((button) => {
    button.addEventListener("click", () => {
      void applyAllocation(Number(button.dataset.alloc));
    });
  });

  document.querySelectorAll("[data-step-field]").forEach((button) => {
    button.addEventListener("click", () => bumpField(button.dataset.stepField, Number(button.dataset.stepDir)));
  });

  bindTradeActionButtons();
}

function bindTradeActionButtons() {
  bindTradeDisclosureToggles();
  bindPendingOrderDisclosureToggles();

  document.querySelectorAll("[data-sell-trade]").forEach((button) => {
    button.onclick = () => submitQuickSell(button.dataset.sellTrade);
  });

  document.querySelectorAll("[data-tp-trade]").forEach((button) => {
    button.onclick = () => submitQuickTakeProfit(button.dataset.tpTrade);
  });

  document.querySelectorAll("[data-cancel-open-order]").forEach((button) => {
    button.onclick = () => cancelPendingOrder(button.dataset.cancelOpenOrder, button.dataset.orderSymbol);
  });
}

function bindTradeDisclosureToggles() {
  document.querySelectorAll("[data-trade-id]").forEach((details) => {
    details.ontoggle = () => {
      const tradeId = details.dataset.tradeId;
      if (!tradeId) {
        return;
      }

      if (details.open) {
        if (!state.expandedTradeIds.includes(tradeId)) {
          state.expandedTradeIds = [...state.expandedTradeIds, tradeId];
        }
        return;
      }

      state.expandedTradeIds = state.expandedTradeIds.filter((id) => id !== tradeId);
    };
  });
}

function bindPendingOrderDisclosureToggles() {
  document.querySelectorAll("[data-pending-order-id]").forEach((details) => {
    details.ontoggle = () => {
      const orderId = details.dataset.pendingOrderId;
      if (!orderId) {
        return;
      }

      if (details.open) {
        if (!state.expandedPendingOrderIds.includes(orderId)) {
          state.expandedPendingOrderIds = [...state.expandedPendingOrderIds, orderId];
        }
        return;
      }

      state.expandedPendingOrderIds = state.expandedPendingOrderIds.filter((id) => id !== orderId);
    };
  });
}

function bindFuturesDisclosureToggles() {
  document.querySelectorAll("[data-futures-position-id]").forEach((details) => {
    details.ontoggle = () => {
      const id = details.dataset.futuresPositionId;
      if (!id) {
        return;
      }
      state.expandedFuturesPositionIds = details.open
        ? [...new Set([...state.expandedFuturesPositionIds, id])]
        : state.expandedFuturesPositionIds.filter((item) => item !== id);
    };
  });

  document.querySelectorAll("[data-futures-order-id]").forEach((details) => {
    details.ontoggle = () => {
      const id = details.dataset.futuresOrderId;
      if (!id) {
        return;
      }
      state.expandedFuturesOrderIds = details.open
        ? [...new Set([...state.expandedFuturesOrderIds, id])]
        : state.expandedFuturesOrderIds.filter((item) => item !== id);
    };
  });
}

function render() {
  applyTheme();
  document.body.dataset.activeTab = state.user ? state.activeTab : "guest";
  renderTopbarActions();
  if (!state.user) {
    syncHomePromoSliderTimer();
    renderLanding();
    refreshWatchlistDom();
    return;
  }
  renderDashboardShell();
  syncQuestCountdownTimer();
  syncHomePromoSliderTimer();
  bindTradeTicketActions();
  refreshWatchlistDom();
  refreshTradeDom();
}

async function bootstrap() {
  applyTheme();
  captureReferralCodeFromUrl();
  beginLoading();
  try {
    const me = await api("/api/auth/me");
    state.user = normalizeUserPayload(me.user);
    if (state.user?.activeExchange) {
      setSelectedExchange(state.user.activeExchange);
    }
    if (state.user) {
      applyRouteTarget();
      await loadDashboardData();
    } else {
      clearAuthSessionToken();
      disconnectWatchSocket();
      disconnectSignalStream();
      disconnectSettingsUsersSocket();
      stopSignalChartRefreshTimer();
      if (window.SignalPage?.destroyActiveChart) {
        window.SignalPage.destroyActiveChart();
      }
      stopTradeRefreshTimer();
      render();
    }
  } catch {
    state.user = null;
    clearAuthSessionToken();
    disconnectWatchSocket();
    disconnectSignalStream();
    disconnectSettingsUsersSocket();
    stopSignalChartRefreshTimer();
    if (window.SignalPage?.destroyActiveChart) {
      window.SignalPage.destroyActiveChart();
    }
    stopTradeRefreshTimer();
    seenSignalIds.clear();
    render();
  } finally {
    endLoading();
  }
}

initPwaExperience();
bootstrap();
