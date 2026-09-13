const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isQueuedTrade,
  isOpenTrade,
  isClosedTrade,
  shouldUserSeeTrade,
} = require("../public/trade-classification");

function trade(overrides = {}) {
  return {
    id: "trade_1",
    symbol: "BTCUSDT",
    side: "BUY",
    lifecycleStatus: "PENDING",
    adminExecution: {
      status: "NEW",
      orderId: "order_1",
    },
    ...overrides,
  };
}

test("unfilled BUY is admin queue only and visible to users", () => {
  const item = trade({ side: "BUY", lifecycleStatus: "PENDING", adminExecution: { status: "NEW" } });
  assert.equal(isQueuedTrade(item), true);
  assert.equal(isOpenTrade(item), false);
  assert.equal(shouldUserSeeTrade(item), true);
});

test("unfilled SELL is admin queue only and hidden from users", () => {
  const item = trade({ side: "SELL", lifecycleStatus: "PENDING", adminExecution: { status: "PARTIALLY_FILLED" } });
  assert.equal(isQueuedTrade(item), true);
  assert.equal(isOpenTrade(item), false);
  assert.equal(shouldUserSeeTrade(item), false);
});

test("opened BUY is open only and visible to users", () => {
  const item = trade({ side: "BUY", lifecycleStatus: "OPEN", adminExecution: { status: "FILLED" } });
  assert.equal(isQueuedTrade(item), false);
  assert.equal(isOpenTrade(item), true);
  assert.equal(shouldUserSeeTrade(item), true);
});

test("opened SELL follows the existing lifecycle model", () => {
  const openedSell = trade({ side: "SELL", lifecycleStatus: "OPEN", adminExecution: { status: "FILLED" } });
  const closedSell = trade({ side: "SELL", lifecycleStatus: "CLOSED", adminExecution: { status: "FILLED" } });
  assert.equal(isOpenTrade(openedSell), true);
  assert.equal(shouldUserSeeTrade(openedSell), true);
  assert.equal(isClosedTrade(closedSell), true);
  assert.equal(isOpenTrade(closedSell), false);
});

test("cancelled and closed trades are not active queue or open trades", () => {
  for (const lifecycleStatus of ["CANCELED", "CANCELLED", "CLOSED"]) {
    const item = trade({ lifecycleStatus, adminExecution: { status: lifecycleStatus === "CLOSED" ? "FILLED" : "CANCELED" } });
    assert.equal(isClosedTrade(item), true);
    assert.equal(isQueuedTrade(item), false);
    assert.equal(isOpenTrade(item), false);
    assert.equal(shouldUserSeeTrade(item), false);
  }
});

test("queued to open transition moves sections without duplication", () => {
  const queued = trade({ side: "BUY", lifecycleStatus: "PENDING", adminExecution: { status: "NEW" } });
  const opened = trade({ ...queued, lifecycleStatus: "OPEN", adminExecution: { status: "FILLED" } });
  assert.deepEqual([isQueuedTrade(queued), isOpenTrade(queued)], [true, false]);
  assert.deepEqual([isQueuedTrade(opened), isOpenTrade(opened)], [false, true]);
});
