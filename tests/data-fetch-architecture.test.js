const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");

test("one live-state manager owns the conservative visible fallback", () => {
  assert.match(app, /LIVE_STATE_FALLBACK_INTERVAL_MS = 30000/);
  assert.match(app, /api\("\/api\/live-state"\)/);
  assert.match(app, /window\.io\(`\$\{API_BASE_URL\}\/signals`/);
  assert.match(app, /socket\.on\("live_state_changed"/);
  assert.doesNotMatch(app, /\/ws\/live-state/);
  assert.doesNotMatch(app, /new WebSocket/);
  assert.match(app, /!state\.liveState\.connected && isDocumentVisible\(\)/);
  assert.match(app, /visibilitychange[\s\S]*?refreshLiveState\(\)/);
  assert.match(app, /window\.addEventListener\("online"[\s\S]*?refreshLiveState\(\)/);
});

test("broad feature polling is removed from home and chart refresh", () => {
  const dashboard = app.match(/async function loadFinancialDashboard\(\)[\s\S]*?\n}/)?.[0] || "";
  assert.doesNotMatch(dashboard, /loadVtuSnapshot|loadDigitalServicesSnapshot/);
  const chartTimer = app.match(/function startSignalChartRefreshTimer\(\)[\s\S]*?\n}/)?.[0] || "";
  assert.doesNotMatch(chartTimer, /setInterval/);
  const watchSocket = app.match(/function connectWatchSocket\(\)[\s\S]*?\n}/)?.[0] || "";
  assert.doesNotMatch(watchSocket, /setInterval/);
});

test("pending deposit and digital order polling is targeted and pauses while hidden", () => {
  assert.match(app, /isDocumentVisible\(\)\) void refreshDepositFlowStatus/);
  assert.match(app, /digital-services\/orders\/\$\{encodeURIComponent\(pendingOrder\.id\)\}\/status/);
  assert.doesNotMatch(app, /digitalOtpPollTimer = setInterval\(\(\) => loadDigitalServicesSnapshot/);
});

test("navigation fetches page data and logout clears the unified connection", () => {
  assert.match(app, /nextTab === "history"[\s\S]*?loadFinancialDashboard\(\)/);
  assert.match(app, /nextTab === "signals"[\s\S]*?loadSignalsSnapshot/);
  assert.match(app, /nextTab === "store"[\s\S]*?loadDigitalServicesSnapshot/);
  assert.match(app, /disconnectSignalStream\(\)/);
  assert.doesNotMatch(app, /connectLiveState|disconnectLiveState/);
});

test("live events coalesce and socket connectivity exclusively owns fallback polling", () => {
  assert.match(app, /liveStateEventTimer = setTimeout\([\s\S]*?200\)/);
  assert.match(app, /socket\.on\("connect"[\s\S]*?stopTradeRefreshTimer\(\)/);
  assert.match(app, /socket\.on\("disconnect"[\s\S]*?startTradeRefreshTimer\(\)/);
  assert.match(app, /if \(state\.signalSocket\)[\s\S]*?return;/);
});

test("admin users and trade participants load explicitly without polling", () => {
  assert.match(app, /async function loadAdminUsers/);
  assert.match(app, /\/api\/admin\/users\?\$\{params\}/);
  assert.match(app, /async function openAdminUsersModal/);
  assert.match(app, /Loading users\.\.\./);
  assert.match(app, /data-admin-users-retry/);
  assert.match(app, /async function openTradeParticipantsModal/);
  assert.match(app, /\/api\/admin\/trades\/\$\{encodeURIComponent\(tradeId\)\}\/participants/);
  assert.match(app, /Loading participants\.\.\./);
  assert.doesNotMatch(app, /setInterval\([^)]*loadAdminUsers/);
  assert.doesNotMatch(app, /setInterval\([^)]*openTradeParticipantsModal/);
});
