const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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

function readPublicFile(name) {
  return fs.readFileSync(path.join(__dirname, "..", "public", name), "utf8");
}

test("service worker keeps API data out of app-shell cache and versions owned caches", () => {
  const worker = readPublicFile("service-worker.js");
  assert.match(worker, /NETRUE_CACHE_PREFIX\s*=\s*"netruefi-app"/);
  assert.match(worker, /OWNED_CACHE_PREFIXES\s*=\s*\[NETRUE_CACHE_PREFIX,\s*"netruefi-pwa"\]/);
  assert.match(worker, /SERVICE_WORKER_VERSION\s*=\s*new URL\(self\.location\.href\)\.searchParams\.get\("v"\)/);
  assert.match(worker, /OWNED_CACHE_PREFIXES\.some\(\(prefix\) => key\.startsWith\(`\$\{prefix\}-`\)\)/);
  assert.match(worker, /url\.pathname\.startsWith\("\/api"\)/);
  assert.match(worker, /event\.respondWith\(fetch\(request\)\)/);
  assert.match(worker, /networkFirstNavigation\(request\)/);
  assert.match(worker, /cache:\s*"no-store"/);
  assert.doesNotMatch(worker, /netruefi-pwa-v18/);
});

test("PWA update prompt uses waiting worker and one-time reload guard", () => {
  const app = readPublicFile("app.js");
  assert.match(app, /register\(`\/service-worker\.js\?v=\$\{encodeURIComponent\(getPwaBuildId\(\)\)\}`\)/);
  assert.match(app, /PWA_UPDATE_RELOAD_GUARD_KEY/);
  assert.match(app, /controllerchange/);
  assert.match(app, /sessionStorage\.setItem\(PWA_UPDATE_RELOAD_GUARD_KEY,\s*reloadKey\)/);
  assert.match(app, /state\.pwa\.waitingWorker \|\| registration\?\.waiting/);
  assert.match(app, /checkForPwaUpdate/);
  assert.match(app, /visibilitychange/);
});

test("Quest reward mobile layout hides chrome scrollbars and keeps wallet CTA rendered", () => {
  const app = readPublicFile("app.js");
  const styles = readPublicFile("styles.css");
  assert.match(app, /<h2>Quest Reward<\/h2>/);
  assert.match(app, /data-quest-redeem/);
  assert.match(app, /Add to wallet/);
  assert.match(styles, /body\[data-active-tab="quest"\] \.dashboard-topbar\s*{\s*display:\s*none;/);
  assert.match(styles, /\.app-screen-quest::-webkit-scrollbar\s*{\s*display:\s*none;/);
  assert.match(styles, /\.quest-play-zone::-webkit-scrollbar/);
  assert.match(styles, /scrollbar-width:\s*none/);
  assert.match(styles, /\.quest-playfield \.quest-actions\s*{[^}]*position:\s*sticky/s);
});

test("Shop products sort by availability before randomized display", () => {
  const app = readPublicFile("app.js");
  assert.match(app, /function normalizeDigitalProductAvailability\(product = {}\)/);
  assert.match(app, /function sortDigitalProductsForDisplay\(products = \[\], \{ shuffle = false \} = {}\)/);
  assert.match(app, /groups\[rank\]\.push\(\{ product, index \}\)/);
  assert.match(app, /return \(shuffle \? shuffleList\(sorted\) : sorted\)\.map\(\(item\) => item\.product\)/);
  assert.match(app, /state\.digitalServices\.allProducts = sortDigitalProductsForDisplay\(payload\.products \|\| \[\], \{ shuffle: true \}\)/);
});

test("Shop cards show one unavailable badge and admin supplier controls are present", () => {
  const app = readPublicFile("app.js");
  assert.match(app, /<em class="store-stock-badge">\$\{escapeHtml\(getDigitalProductAvailabilityLabel\(product\)\)\}<\/em>/);
  assert.doesNotMatch(app, /green UNAVAILABLE/i);
  assert.match(app, /renderAdminDigitalSuppliersSection/);
  assert.match(app, /data-admin-digital-supplier-add/);
  assert.match(app, /data-admin-digital-supplier-preview/);
  assert.match(app, /data-admin-digital-supplier-import-form/);
  assert.match(app, /Custom headers JSON/);
});
