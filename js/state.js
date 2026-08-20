const state = {
  hasEntered: false,
  currentRoute: "home",
  sidebarCollapsed: false,
  mobileNavOpen: false,
  health: { status: "unchecked", data: null, error: null },
  pipeline: { status: "ready", data: null, error: null },
  product: { status: "idle", data: null, error: null, marketMetric: "avg_price", trendMetric: "avg_price", searchQuery: "", selectedProductId: null, catalog: { query: "", source: "", priceTier: "", sortKey: "product_name", sortDirection: "asc", page: 1 } },
  seller: { status: "idle", data: null, error: null, selectedSeller: null, search: "", historicalMetric: "avg_price", catalogQuery: "", catalogPriceTier: "", catalogSortKey: "seller_name", catalogSortDirection: "asc", catalogPage: 1 },
  category: { status: "idle", data: null, error: null, selectedCategory: null, search: "", historicalMetric: "median_price", catalogQuery: "", catalogPriceTier: "", catalogSortKey: "category", catalogSortDirection: "asc", catalogPage: 1 },
  brand: {
    activeSource: "api",
    api: { status: "idle", data: null, error: null, selectedBrand: null, searchQuery: "", filters: {}, sorting: {}, page: 1, historicalMetric: "avg_price", catalog: { query: "", priceTier: "", sortKey: "brand", sortDirection: "asc", page: 1 } },
    scraper: { status: "idle", data: null, error: null, selectedBrand: null, searchQuery: "", filters: {}, sorting: {}, page: 1, historicalMetric: "median_price", catalog: { query: "", priceTier: "", sortKey: "brand", sortDirection: "asc", page: 1 } }
  }
};

const listeners = new Set();

export function getState() {
  return { ...state };
}

export function updateState(changes) {
  Object.assign(state, changes);
  listeners.forEach((listener) => listener(getState()));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
