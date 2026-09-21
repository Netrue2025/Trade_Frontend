const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");

test("one live-state manager owns the conservative visible fallback", () => {
  assert.match(app, /LIVE_STATE_FALLBACK_INTERVAL_MS = 30000/);
  assert.match(app, /api\("\/api\/live-state"\)/);
  assert.match(app, /new WebSocket\(toWebSocketUrl\("\/ws\/live-state"\)\)/);
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

test("navigation fetches page data and logout clears live resources", () => {
  assert.match(app, /nextTab === "history"[\s\S]*?loadFinancialDashboard\(\)/);
  assert.match(app, /nextTab === "signals"[\s\S]*?loadSignalsSnapshot/);
  assert.match(app, /nextTab === "store"[\s\S]*?loadDigitalServicesSnapshot/);
  assert.match(app, /disconnectLiveState\(\)[\s\S]*?disconnectSignalStream\(\)/);
});
