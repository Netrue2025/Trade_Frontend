"use strict";

(function attachDashboardLoader(root, factory) {
  const loader = factory();
  if (typeof module === "object" && module.exports) module.exports = loader;
  if (root) root.DashboardLoader = loader;
}(typeof globalThis === "object" ? globalThis : this, function createDashboardLoader() {
  async function loadDashboardCollections({ loadTrades, loadUsers, onTrades, onUsers, onError }) {
    const settle = async (collection, load, onSuccess) => {
      try {
        const value = await load();
        onSuccess(value);
        return { status: "fulfilled", value };
      } catch (reason) {
        onError(collection, reason);
        return { status: "rejected", reason };
      }
    };
    const [tradesResult, usersResult] = await Promise.all([
      settle("trades", loadTrades, onTrades),
      settle("users", loadUsers, onUsers),
    ]);
    return { tradesResult, usersResult };
  }

  return { loadDashboardCollections };
}));
