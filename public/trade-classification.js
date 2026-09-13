(function attachTradeClassification(root) {
  const QUEUE_EXECUTION_STATUSES = new Set([
    "NEW",
    "PENDING",
    "PENDING_NEW",
    "PLACED",
    "QUEUED",
    "PARTIALLY_FILLED",
    "PARTIALLY-FILLED",
  ]);
  const OPEN_LIFECYCLE_STATUSES = new Set(["OPEN", "ACTIVE"]);
  const QUEUE_LIFECYCLE_STATUSES = new Set(["PENDING", "QUEUED", "PLACED", "NEW", "PARTIALLY_FILLED", "PARTIALLY-FILLED"]);
  const CLOSED_LIFECYCLE_STATUSES = new Set(["CLOSED", "CANCELED", "CANCELLED", "ERROR", "REJECTED", "EXPIRED"]);
  const CLOSED_EXECUTION_STATUSES = new Set(["CANCELED", "CANCELLED", "ERROR", "REJECTED", "EXPIRED"]);

  function normalizeStatus(value) {
    return String(value || "").trim().toUpperCase();
  }

  function getExecutionStatus(trade = {}) {
    return normalizeStatus(
      trade.adminExecution?.status ||
        trade.execution?.status ||
        trade.orderStatus ||
        trade.status
    );
  }

  function getLifecycleStatus(trade = {}) {
    return normalizeStatus(trade.lifecycleStatus || trade.actualLifecycleStatus);
  }

  function isClosedTrade(trade = {}) {
    const lifecycle = getLifecycleStatus(trade);
    const execution = getExecutionStatus(trade);
    return CLOSED_LIFECYCLE_STATUSES.has(lifecycle) || CLOSED_EXECUTION_STATUSES.has(execution);
  }

  function isQueuedTrade(trade = {}) {
    if (isClosedTrade(trade)) {
      return false;
    }
    const lifecycle = getLifecycleStatus(trade);
    const execution = getExecutionStatus(trade);
    return QUEUE_LIFECYCLE_STATUSES.has(lifecycle) || QUEUE_EXECUTION_STATUSES.has(execution);
  }

  function isOpenTrade(trade = {}) {
    if (isClosedTrade(trade) || isQueuedTrade(trade)) {
      return false;
    }
    const lifecycle = getLifecycleStatus(trade);
    return OPEN_LIFECYCLE_STATUSES.has(lifecycle);
  }

  function shouldUserSeeTrade(trade = {}) {
    if (isClosedTrade(trade)) {
      return false;
    }
    if (isQueuedTrade(trade)) {
      return normalizeStatus(trade.side) === "BUY";
    }
    return isOpenTrade(trade);
  }

  const api = {
    normalizeStatus,
    getExecutionStatus,
    getLifecycleStatus,
    isQueuedTrade,
    isOpenTrade,
    isClosedTrade,
    shouldUserSeeTrade,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.TradeClassification = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
