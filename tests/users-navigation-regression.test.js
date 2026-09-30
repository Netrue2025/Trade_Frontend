"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadDashboardCollections } = require("../public/dashboard-loader");

const app = fs.readFileSync(path.join(__dirname, "../public/app.js"), "utf8");

test("users load when the trades request fails", async () => {
  let users;
  const errors = [];
  await loadDashboardCollections({
    loadTrades: async () => { throw new Error("trades unavailable"); },
    loadUsers: async () => ({ users: [{ id: "user-1" }] }),
    onTrades: () => assert.fail("failed trades should not replace trade data"),
    onUsers: (payload) => { users = payload.users; },
    onError: (route, error) => errors.push([route, error.message]),
  });
  assert.deepEqual(users, [{ id: "user-1" }]);
  assert.deepEqual(errors, [["trades", "trades unavailable"]]);
});

test("trades load when the users request fails and the users error is retryable", async () => {
  const cachedUsers = [{ id: "cached-user" }];
  let trades;
  let usersError;
  await loadDashboardCollections({
    loadTrades: async () => ({ trades: [{ id: "trade-1" }] }),
    loadUsers: async () => { throw new Error("users unavailable"); },
    onTrades: (payload) => { trades = payload.trades; },
    onUsers: () => assert.fail("failed users request must preserve prior state"),
    onError: (route, error) => { if (route === "users") usersError = error.message; },
  });
  assert.deepEqual(trades, [{ id: "trade-1" }]);
  assert.deepEqual(cachedUsers, [{ id: "cached-user" }]);
  assert.equal(usersError, "users unavailable");
  assert.match(app, /data-admin-users-retry/);
});

test("dashboard fetch preserves cookie credentials and catches each collection independently", () => {
  assert.match(app, /credentials: "include"/);
  assert.match(app, /window\.DashboardLoader\.loadDashboardCollections/);
  assert.doesNotMatch(app, /Promise\.all\(\[\s*tradesPromise\s*,\s*usersPromise/);
});

test("history navigation handles trade API failure without rejecting sibling page loads", () => {
  const navigation = app.match(/async function navigateToTab\(nextTab\) \{[\s\S]*?\n\}/)?.[0] || "";
  assert.match(navigation, /nextTab === "history"/);
  assert.match(navigation, /Promise\.allSettled\(/);
  assert.match(navigation, /state\.tradesLoadError/);
  assert.match(app, /console\.warn\("\[api\] request failed", \{ route, status:/);
});

test("admin balance display reads the actual NGN and USDT wallet rows independently", () => {
  const helper = app.match(/function getWalletFromList\(wallets, currency\) \{[\s\S]*?\n\}/)?.[0] || "";
  assert.ok(helper);
  const getWalletFromList = new Function(`${helper}; return getWalletFromList;`)();
  const wallets = [
    { currency: "NGN", availableBalance: "12000", lockedBalance: "500" },
    { currency: "USDT", availableBalance: "8.25", lockedBalance: "1" },
  ];
  assert.equal(getWalletFromList(wallets, "NGN").availableBalance, "12000");
  assert.equal(getWalletFromList(wallets, "USDT").availableBalance, "8.25");
  const card = app.match(/function renderAdminUserCard\(user\) \{[\s\S]*?\n\}/)?.[0] || "";
  assert.match(card, /USDT wallet[\s\S]*?formatUsdtUnit\(usdtWallet\.availableBalance\)/);
  assert.match(card, /NGN wallet[\s\S]*?formatNaira\(ngnWallet\.availableBalance\)/);
});

test("MIXED transaction display is read-only and is never offered as a balance-edit currency", () => {
  assert.match(app, /String\(transaction\.currency \|\| ""\)\.toUpperCase\(\) === "MIXED"[\s\S]*?formatMixedCurrencyBreakdown\(transaction\)/);
  const balanceModal = app.match(/if \(state\.actionModal\.type === "admin-balance"\) \{[\s\S]*?\n  \}/)?.[0] || "";
  assert.match(balanceModal, /<option value="USDT">USDT<\/option>/);
  assert.match(balanceModal, /<option value="NGN">Naira<\/option>/);
  assert.doesNotMatch(balanceModal, /value="MIXED"/);
  assert.match(app, /function formatMixedCurrencyBreakdown\([\s\S]*?\.filter\(\(source\) => \["NGN", "USDT"\]/);
});

test("Users modal preserves loaded rows and avoids a false zero count on fetch failure", () => {
  const loader = app.match(/async function loadAdminUsers\([\s\S]*?\n\}/)?.[0] || "";
  const modal = app.match(/if \(state\.actionModal\.type === "admin-users"\) \{[\s\S]*?\n  \}/)?.[0] || "";
  assert.match(loader, /state\.users = Array\.isArray\(payload\.users\)/);
  assert.match(loader, /catch \(error\) \{\s*state\.adminUsersError/);
  assert.doesNotMatch(loader, /state\.users\s*=\s*\[\]\s*;/);
  assert.match(modal, /state\.adminUsersTotal \|\| state\.users\.length/);
  assert.match(modal, /state\.adminUsersError && totalUsers === 0[\s\S]*?"Users"/);
});
