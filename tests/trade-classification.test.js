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

test("Quest reward mobile layout uses dynamic viewport and keeps wallet CTA reachable", () => {
  const app = readPublicFile("app.js");
  const styles = readPublicFile("styles.css");
  assert.match(app, /<h2>Quest Reward<\/h2>/);
  assert.match(app, /data-quest-redeem/);
  assert.match(app, /Add to wallet/);
  assert.match(styles, /body\[data-active-tab="quest"\] \.dashboard-topbar\s*{\s*display:\s*none;/);
  assert.match(styles, /\.app-screen-quest\s*{[^}]*min-height:\s*100svh/s);
  assert.match(styles, /\.app-screen-quest\s*{[^}]*min-height:\s*100dvh/s);
  assert.match(styles, /\.quest-playfield\s*{[^}]*overflow-x:\s*hidden/s);
  assert.match(styles, /\.quest-play-zone,[\s\S]*\.quest-view-panel\s*{[^}]*max-height:\s*calc\(100dvh - 128px\)/s);
  assert.match(styles, /\.quest-playfield \.quest-actions\s*{[^}]*position:\s*sticky[^}]*bottom:\s*max\(10px, env\(safe-area-inset-bottom\)\)/s);
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
  assert.match(app, /function getDigitalProductStoreBadgeLabel\(product = {}\)/);
  assert.match(app, /return "Emma Store"/);
  assert.match(app, /class="store-origin-badge">\$\{escapeHtml\(getDigitalProductStoreBadgeLabel\(product\)\)\}/);
  assert.match(app, /<em class="store-stock-badge">\$\{escapeHtml\(getDigitalProductAvailabilityLabel\(product\)\)\}<\/em>/);
  assert.doesNotMatch(app, /green UNAVAILABLE/i);
  assert.match(app, /renderAdminDigitalSuppliersSection/);
  assert.match(app, /data-admin-digital-supplier-add/);
  assert.match(app, /data-admin-digital-supplier-preview/);
  assert.match(app, /data-admin-digital-supplier-import-form/);
  assert.match(app, /Custom headers JSON/);
  assert.match(app, /Idempotency supported/);
  assert.match(app, /supplier\.supplierBalance/);
});

test("iOS PWA settings use platform states and preserve Android install prompt", () => {
  const app = readPublicFile("app.js");
  const styles = readPublicFile("styles.css");
  assert.match(app, /function getPwaInstallStatusLabel\(\)/);
  assert.match(app, /function getPwaNotificationStatusLabel\(\)/);
  assert.match(app, /Install App First/);
  assert.match(app, /Permission Denied/);
  assert.match(app, /Not Supported/);
  assert.match(app, /Notification\.requestPermission\(\)/);
  assert.match(app, /state\.pwa\.isIos && !state\.pwa\.isStandalone/);
  assert.match(app, /beforeinstallprompt/);
  assert.match(app, /pwa-update-check-btn/);
  assert.match(styles, /\.pwa-sheet\s*{[^}]*max-height:\s*calc\(100dvh - 28px/s);
  assert.match(styles, /\.pwa-backdrop\s*{[^}]*env\(safe-area-inset-bottom\)/s);
});

test("Admin settings expose category navigation and danger zone separation", () => {
  const app = readPublicFile("app.js");
  const styles = readPublicFile("styles.css");
  assert.match(app, /admin-settings-category-grid/);
  assert.match(app, /data-settings-jump/);
  assert.match(app, /data-settings-category/);
  assert.match(app, /Danger Zone/);
  assert.match(app, /settings-danger-zone/);
  assert.match(app, /Choose a category, then expand only what you need/);
  assert.match(styles, /\.admin-settings-category-grid\s*{[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(150px, 1fr\)\)/s);
  assert.match(styles, /\.settings-danger-zone\s*{[^}]*border-color:\s*rgba\(255, 77, 109, 0\.35\)/s);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.admin-settings-category-grid,[\s\S]*\.pwa-settings-grid\s*{[\s\S]*grid-template-columns:\s*1fr/s);
});

test("Admin store orders show action required for supplier configuration failures", () => {
  const app = readPublicFile("app.js");
  assert.match(app, /const configurationFailure = \["configuration_error", "manual_review"\]\.includes\(fulfillmentStatus\)/);
  assert.match(app, /supplier_endpoint_unavailable/);
  assert.match(app, /supplier_method_not_allowed/);
  assert.match(app, /Action required/);
  assert.match(app, /Payment: \$\{escapeHtml\(String\(order\.paymentStatus/);
  assert.match(app, /Error: \$\{escapeHtml\(order\.lastFulfillmentError\)\}/);
  assert.match(app, /canRetryFulfillment[\s\S]*&& !configurationFailure/);
});

test("Emma delivery receipts preserve raw items and admin can recover missing delivery", () => {
  const app = readPublicFile("app.js");
  assert.match(app, /Array\.isArray\(delivery\.delivery_items\)/);
  assert.match(app, /rawItem:\s*item\.trim\(\)/);
  assert.match(app, /const match = item\.match/);
  assert.match(app, /match\[3\]\.trim\(\)/);
  assert.match(app, /Details", item\.value \|\| \(!item\.email && !item\.password \? item\.rawItem : ""\)/);
  assert.match(app, /recoverAdminDigitalOrderDelivery/);
  assert.match(app, /\/recover-delivery/);
  assert.match(app, /data-admin-digital-order-recover-delivery/);
  assert.match(app, /Recover Delivery/);
});

test("Efem and manual store admin workflows are fully wired", () => {
  const app = readPublicFile("app.js");
  const styles = readPublicFile("styles.css");
  assert.match(app, /return "Efem Store"/);
  assert.match(app, /return product\.storefrontLabel \|\| product\.storeName \|\| "Manual Store"/);
  assert.match(app, /data-admin-digital-product-add/);
  assert.match(app, /type: "admin-digital-product-create"/);
  assert.match(app, /data-admin-digital-product-create-form/);
  assert.match(app, /Automatic API products must be imported from a supplier/);
  assert.match(app, /function isSafeProductImageUrl/);
  assert.match(app, /\["http:", "https:"\]\.includes\(parsed\.protocol\)/);
  assert.match(app, /data-admin-manual-product-form/);
  assert.match(app, /data-admin-digital-order-manual-fulfill/);
  assert.match(app, /data-admin-manual-fulfill-form/);
  assert.match(app, /data-admin-manual-item-add/);
  assert.match(app, /data-admin-manual-item-remove/);
  assert.match(app, /\["emma", "efem"\]\.includes\(provider\)/);
  assert.match(app, /provider === "emma" \|\| !!order\.supplierOrderId/);
  assert.match(app, /selectedProductIds/);
  assert.match(styles, /\.admin-digital-edit-modal\s*{[^}]*100dvh[^}]*safe-area-inset-bottom/s);
  assert.match(styles, /\.admin-digital-edit-modal \.modal-actions\s*{[^}]*position:\s*sticky/s);
});

test("Shop summary shortcuts reuse filtered My Orders history", () => {
  const app = readPublicFile("app.js");
  assert.match(app, /data-store-orders-open="all"/);
  assert.match(app, /data-store-orders-open="pending"/);
  assert.match(app, /data-store-orders-open="ready"/);
  assert.match(app, /function renderDigitalOrderHistoryModal/);
  assert.match(app, /state\.digitalServices\.orderFilter/);
  assert.match(app, /orders\.map\(renderDigitalServiceOrderRow\)/);
});

test("Structured post-payment and global Order Ready flows remain separate from fulfillment", () => {
  const app = readPublicFile("app.js");
  assert.match(app, /function readPostPaymentExperience/);
  assert.match(app, /function renderPostPaymentBlocks/);
  assert.match(app, /\^https\?:\\\/\\\//);
  assert.match(app, /type: "digital-post-payment"/);
  assert.match(app, /type: "digital-order-ready"/);
  assert.match(app, /readyNotificationPending === true/);
  assert.match(app, /ready-acknowledge/);
  assert.match(app, /data-admin-digital-order-view-delivery/);
  assert.match(app, /data-delivery-secret-toggle/);
});

test("Manual order history opens the successful delivery and OTP experience", () => {
  const app = readPublicFile("app.js");
  assert.match(app, /function renderDigitalManualOrderSuccessModal/);
  assert.match(app, /isManualDigitalServiceOrder\(order\)/);
  assert.match(app, /type: "digital-manual-order-success"/);
  assert.match(app, /renderDigitalServiceDelivery\(order\.delivery, order\)/);
  assert.match(app, /data-digital-otp-request/);
});

test("Responsive shop histories forms and transactional modals support narrow phones", () => {
  const styles = readPublicFile("styles.css");
  assert.match(styles, /\.store-stat-strip\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.digital-order-row, \.admin-store-order-row\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(styles, /max-height:\s*calc\(100dvh - 16px\)/);
  assert.match(styles, /\.post-payment-builder\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(styles, /@media \(max-width: 339px\)[\s\S]*\.store-product-grid\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(styles, /overflow-wrap:\s*anywhere/);
});
