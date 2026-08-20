import { CONFIG } from "./config.js";
import { getState, updateState } from "./state.js";
import { navigate, startRouter } from "./router.js";
import { renderPlaceholder } from "./modules/placeholder.js";
import { api } from "./api.js";
import { bindHomeActions, renderHome } from "./modules/home.js";
import { bindCatalogControls, bindProductControls, renderProductIntegrated, renderProductInsight, updateCatalogView, updateProductSearchResults } from "./modules/product.js";
import { bindBrandControls, renderBrand, renderBrandInsight } from "./modules/brand.js";
import { bindSellerControls, renderSeller, renderSellerData } from "./modules/seller.js";
import { bindCategoryControls, renderCategory, renderCategoryData } from "./modules/category.js";
import { bindSystemControls, renderSystem, renderSystemData } from "./modules/system.js";

const app = document.querySelector("#app");
const navItems = [
  ["home", "⌂", "Home"], ["product", "◈", "Product Intelligence"], ["brand", "◇", "Brand Intelligence"],
  ["seller", "◌", "Seller Intelligence"], ["category", "▦", "Category Intelligence"], ["system", "⚙", "System Operations"]
];

function renderLanding() {
  app.innerHTML = `<main class="landing"><section class="landing-card" aria-labelledby="landing-title">
    <div class="eyebrow">Automated Intelligence Platform</div>
    <h1 id="landing-title">Marketplace intelligence, made actionable.</h1>
    <p class="landing-copy">ADIP is an autonomous intelligence platform that transforms raw marketplace data into structured, AI-generated strategic insight across multiple domains.</p>
    <div class="landing-footer"><button class="button-primary" type="button" data-action="enter">Enter workspace <span aria-hidden="true">→</span></button><span class="muted-note">Evidence-led intelligence for the modern marketplace.</span></div>
  </section></main>`;
  app.querySelector("[data-action=enter]").addEventListener("click", () => { updateState({ hasEntered: true }); navigate("home"); render("home"); });
}

function renderWorkspace(route) {
  const { sidebarCollapsed, mobileNavOpen, health } = getState();
  app.innerHTML = `<div class="workspace">
    <aside class="sidebar ${sidebarCollapsed ? "is-collapsed" : ""} ${mobileNavOpen ? "is-open" : ""}" aria-label="Primary navigation">
      <a class="brand" href="#/home" aria-label="ADIP home"><span class="brand-mark">AI</span><span class="brand-name">ADIP Intelligence</span></a>
      <div class="nav-label">Workspace</div><nav><ul class="nav-list">${navItems.map(([id, icon, label]) => `<li><a class="nav-link" href="#/${id}" ${route === id ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${icon}</span><span class="nav-text">${label}</span></a></li>`).join("")}</ul></nav>
    </aside>
    <div class="main-column"><header class="topbar"><div class="topbar-leading"><button class="icon-button" type="button" data-action="toggle-sidebar" aria-label="Toggle sidebar" aria-expanded="${!sidebarCollapsed}">☰</button><span class="page-context">Workspace / ${navItems.find(([id]) => id === route)?.[2] || "Home"}</span></div><div class="topbar-meta"><span class="status-badge"><span class="status-dot" aria-hidden="true"></span>Awaiting service connection</span></div></header><main id="view">${renderPlaceholder(route)}</main></div>
  </div>`;
  const topbarStatus = app.querySelector(".status-badge");
  const statusText = health.status === "checking" ? "Checking service" : health.status === "success" ? "Service reachable" : health.status === "error" ? "Status check failed" : "Status not checked";
  const statusClass = health.status === "success" ? "state-success" : health.status === "error" ? "state-error" : health.status === "checking" ? "state-checking" : "state-unknown";
  topbarStatus.className = `status-badge ${statusClass}`;
  topbarStatus.innerHTML = `<span class="status-dot" aria-hidden="true"></span>${statusText}`;
  app.querySelector("#view").innerHTML = route === "home" ? renderHome(getState()) : route === "product" ? renderProductIntegrated(getState()) : route === "brand" ? renderBrand(getState()) : route === "seller" ? renderSeller(getState()) : route === "category" ? renderCategory(getState()) : route === "system" ? renderSystem(getState()) : renderPlaceholder(route);
  app.querySelector("[data-action=toggle-sidebar]").addEventListener("click", () => {
    const currentState = getState();
    if (window.innerWidth <= 640) {
      updateState({ mobileNavOpen: !currentState.mobileNavOpen });
    } else {
      updateState({ sidebarCollapsed: !currentState.sidebarCollapsed, mobileNavOpen: false });
    }
    renderWorkspace(currentState.currentRoute);
  });
  app.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => { if (window.innerWidth <= 640) updateState({ mobileNavOpen: false }); }));
  if (route === "home") bindHomeActions(app, { onCheckSystem: checkSystem, onRunPipeline: runPipeline });
  if (route === "product") {
    bindProductControls(app, { onRetry: loadProductData, onMarketMetricChange: changeProductMetric, onTrendMetricChange: changeProductTrendMetric, onSearch: searchProducts, onSelectProduct: selectProduct });
    renderProductInsight(app, getState().product);
    bindCatalogControls(app, catalogActions());
  }
  if (route === "brand") { bindBrandControls(app, { onSource: changeBrandSource, onSearch: searchBrands, onSelect: selectBrand, onHistoricalMetric: changeBrandHistoricalMetric, onCatalogSearch: searchBrandCatalog, onCatalogFilter: filterBrandCatalog, onCatalogSort: sortBrandCatalog, onCatalogDirection: changeBrandCatalogDirection, onCatalogPage: changeBrandCatalogPage, onRetry: loadBrandData }); renderBrandInsight(app, getState()); }
  if (route === "seller") { renderSellerData(app, getState(), selectSeller); bindSellerControls(app, { onSearch: searchSellers, onHistoricalMetric: changeSellerHistoricalMetric, onCatalogSearch: searchSellerCatalog, onCatalogFilter: filterSellerCatalog, onCatalogSort: sortSellerCatalog, onCatalogDirection: changeSellerCatalogDirection, onCatalogPage: changeSellerCatalogPage }); }
  if (route === "category") { renderCategoryData(app, getState(), selectCategory); bindCategoryControls(app, { onSearch: searchCategories, onHistoricalMetric: changeCategoryHistoricalMetric, onCatalogSearch: searchCategoryCatalog, onCatalogFilter: filterCategoryCatalog, onCatalogSort: sortCategoryCatalog, onCatalogDirection: changeCategoryCatalogDirection, onCatalogPage: changeCategoryCatalogPage }); }
  if (route === "system") { renderSystemData(app, getState()); bindSystemControls(app, { onRefresh: checkSystem, onRun: () => runPipeline(true) }); }
}

async function loadSellerData() {
  const seller = getState().seller;
  if (seller.status === "loading" || seller.status === "success") return;
  updateState({ seller: { ...seller, status: "loading", error: null } });
  refreshWorkspace();
  try {
    const data = await api.getSeller();
    if (!data || !Array.isArray(data.features) || !Array.isArray(data.timeseries)) throw new Error("Seller response did not include the documented features and timeseries components.");
    updateState({ seller: { ...getState().seller, status: "success", data, error: null } });
  } catch (error) {
    updateState({ seller: { ...getState().seller, status: "error", data: null, error: error.message || "The Seller Intelligence request failed." } });
  }
  refreshWorkspace();
}

function searchSellers(query) {
  updateState({ seller: { ...getState().seller, search: query } });
  refreshWorkspace();
}

function selectSeller(sellerName) {
  updateState({ seller: { ...getState().seller, selectedSeller: sellerName } });
  refreshWorkspace();
  document.querySelector("#seller-profile-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function changeSellerHistoricalMetric(metric) {
  const seller = getState().seller;
  updateState({ seller: { ...seller, historicalMetric: metric } });
  refreshWorkspace();
}

function updateSellerCatalog(changes) {
  const seller = getState().seller;
  updateState({ seller: { ...seller, ...changes } });
  refreshWorkspace();
}

function searchSellerCatalog(query) { updateSellerCatalog({ catalogQuery: query, catalogPage: 1 }); }
function filterSellerCatalog(priceTier) { updateSellerCatalog({ catalogPriceTier: priceTier, catalogPage: 1 }); }
function sortSellerCatalog(sortKey) { updateSellerCatalog({ catalogSortKey: sortKey }); }
function changeSellerCatalogDirection(direction) { updateSellerCatalog({ catalogSortDirection: direction }); }
function changeSellerCatalogPage(page) { updateSellerCatalog({ catalogPage: Math.max(1, Number(page) || 1) }); }

async function loadCategoryData() {
  const category = getState().category;
  if (category.status === "loading" || category.status === "success") return;
  updateState({ category: { ...category, status: "loading", error: null } });
  refreshWorkspace();
  try {
    const data = await api.getCategory();
    if (!data || !Array.isArray(data.features) || !Array.isArray(data.timeseries)) throw new Error("Category response did not include the documented features and timeseries components.");
    updateState({ category: { ...getState().category, status: "success", data, error: null } });
  } catch (error) {
    updateState({ category: { ...getState().category, status: "error", data: null, error: error.message || "The Category Intelligence request failed." } });
  }
  refreshWorkspace();
}

function searchCategories(query) {
  updateState({ category: { ...getState().category, search: query } });
  refreshWorkspace();
}

function selectCategory(categoryName) {
  updateState({ category: { ...getState().category, selectedCategory: categoryName } });
  refreshWorkspace();
  document.querySelector("#category-profile-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function changeCategoryHistoricalMetric(metric) {
  updateState({ category: { ...getState().category, historicalMetric: metric } });
  refreshWorkspace();
}

function updateCategoryCatalog(changes, resetPage = true) {
  const category = getState().category;
  updateState({ category: { ...category, ...changes, ...(resetPage ? { catalogPage: 1 } : {}) } });
  refreshWorkspace();
}

function searchCategoryCatalog(query) { updateCategoryCatalog({ catalogQuery: query }); }
function filterCategoryCatalog(priceTier) { updateCategoryCatalog({ catalogPriceTier: priceTier }); }
function sortCategoryCatalog(sortKey) { updateCategoryCatalog({ catalogSortKey: sortKey }, false); }
function changeCategoryCatalogDirection(direction) { updateCategoryCatalog({ catalogSortDirection: direction }, false); }
function changeCategoryCatalogPage(page) { updateCategoryCatalog({ catalogPage: Math.max(1, Number(page) || 1) }, false); }

async function loadBrandData(source = getState().brand.activeSource) {
  const sourceState = getState().brand[source];
  if (!sourceState || sourceState.status === "loading" || sourceState.status === "success") return;
  updateState({ brand: { ...getState().brand, [source]: { ...sourceState, status: "loading", error: null } } });
  refreshWorkspace();
  try {
    const data = await api.getBrand(source);
    if (!data || !Array.isArray(data.features) || !Array.isArray(data.timeseries)) throw new Error("Brand response did not include the documented features and timeseries components.");
    const latest = getState().brand[source];
    updateState({ brand: { ...getState().brand, [source]: { ...latest, status: "success", data, error: null } } });
  } catch (error) {
    const latest = getState().brand[source];
    updateState({ brand: { ...getState().brand, [source]: { ...latest, status: "error", data: null, error: error.message || "The Brand Intelligence request failed." } } });
  }
  refreshWorkspace();
}

function changeBrandSource(source) {
  if (source !== "api" && source !== "scraper") return;
  updateState({ brand: { ...getState().brand, activeSource: source } });
  refreshWorkspace();
  loadBrandData(source);
}

function searchBrands(query) {
  const brand = getState().brand;
  const source = brand.activeSource;
  updateState({ brand: { ...brand, [source]: { ...brand[source], searchQuery: query } } });
  refreshWorkspace();
}

function selectBrand(brandName, focusProfile = false) {
  const brand = getState().brand;
  const source = brand.activeSource;
  updateState({ brand: { ...brand, [source]: { ...brand[source], selectedBrand: brandName } } });
  refreshWorkspace();
  if (focusProfile) document.querySelector("#brand-profile-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function changeBrandHistoricalMetric(metric) {
  const brand = getState().brand;
  const source = brand.activeSource;
  updateState({ brand: { ...brand, [source]: { ...brand[source], historicalMetric: metric } } });
  refreshWorkspace();
}

function updateBrandCatalog(changes, resetPage = true) {
  const brand = getState().brand;
  const source = brand.activeSource;
  const catalog = { ...brand[source].catalog, ...changes, ...(resetPage ? { page: 1 } : {}) };
  updateState({ brand: { ...brand, [source]: { ...brand[source], catalog } } });
  refreshWorkspace();
}

function searchBrandCatalog(query) { updateBrandCatalog({ query }); }
function filterBrandCatalog(priceTier) { updateBrandCatalog({ priceTier }); }
function sortBrandCatalog(sortKey) { updateBrandCatalog({ sortKey }, false); }
function changeBrandCatalogDirection(sortDirection) { updateBrandCatalog({ sortDirection }, false); }
function changeBrandCatalogPage(direction) { const catalog = getState().brand[getState().brand.activeSource].catalog; updateBrandCatalog({ page: Math.max(1, catalog.page + (direction === "next" ? 1 : -1)) }, false); }

function refreshWorkspace() {
  if (getState().hasEntered) renderWorkspace(getState().currentRoute);
}

async function checkSystem() {
  if (getState().health.status === "checking") return;
  updateState({ health: { status: "checking", data: null, error: null } });
  refreshWorkspace();
  try {
    const data = await api.getHealth();
    if (!data || typeof data.sources !== "object" || data.sources === null) throw new Error("Health response did not include documented source availability.");
    updateState({ health: { status: "success", data, error: null } });
  } catch (error) {
    updateState({ health: { status: "error", data: null, error: error.message || "The health check failed." } });
  }
  refreshWorkspace();
}

async function runPipeline(refreshHealth = false) {
  if (getState().pipeline.status === "starting") return;
  updateState({ pipeline: { status: "starting", data: null, error: null } });
  refreshWorkspace();
  try {
    const data = await api.runApplication();
    updateState({ pipeline: { status: "accepted", data, error: null } });
    if (refreshHealth) await checkSystem();
  } catch (error) {
    updateState({ pipeline: { status: "error", data: null, error: error.message || "The pipeline request failed." } });
  }
  refreshWorkspace();
}

async function loadProductData() {
  const currentProduct = getState().product;
  if (currentProduct.status === "loading" || currentProduct.status === "success") return;
  updateState({ product: { ...currentProduct, status: "loading", data: null, error: null } });
  refreshWorkspace();
  try {
    const data = await api.getProduct();
    if (!data || !Array.isArray(data.features) || !Array.isArray(data.timeseries)) {
      throw new Error("Product response did not include the documented features and timeseries components.");
    }
    updateState({ product: { ...getState().product, status: "success", data, error: null } });
  } catch (error) {
    updateState({ product: { ...getState().product, status: "error", data: null, error: error.message || "The Product Intelligence request failed." } });
  }
  refreshWorkspace();
}

function changeProductMetric(metric) {
  updateState({ product: { ...getState().product, marketMetric: metric } });
  refreshWorkspace();
}

function changeProductTrendMetric(metric) {
  updateState({ product: { ...getState().product, trendMetric: metric } });
  refreshWorkspace();
}

function searchProducts(query) {
  const product = { ...getState().product, searchQuery: query };
  updateState({ product });
  updateProductSearchResults(app, getState(), selectProduct);
}

function catalogActions() {
  return { onSearch: searchCatalog, onSource: changeCatalogSource, onPriceTier: changeCatalogPriceTier, onSortKey: changeCatalogSortKey, onSortDirection: changeCatalogSortDirection, onPage: changeCatalogPage, onSelectProduct: (productId) => selectProduct(productId, true) };
}

function updateCatalogControls(changes, resetPage = true) {
  const current = getState().product;
  const catalog = { ...current.catalog, ...changes, ...(resetPage ? { page: 1 } : {}) };
  updateState({ product: { ...current, catalog } });
}

function searchCatalog(query) {
  updateCatalogControls({ query });
  updateCatalogView(app, getState(), catalogActions());
}

function changeCatalogSource(source) {
  updateCatalogControls({ source });
  refreshWorkspace();
}

function changeCatalogPriceTier(priceTier) {
  updateCatalogControls({ priceTier });
  refreshWorkspace();
}

function changeCatalogSortKey(sortKey) {
  updateCatalogControls({ sortKey }, false);
  refreshWorkspace();
}

function changeCatalogSortDirection(sortDirection) {
  updateCatalogControls({ sortDirection }, false);
  refreshWorkspace();
}

function changeCatalogPage(direction) {
  const current = getState().product;
  const page = Math.max(1, current.catalog.page + (direction === "next" ? 1 : -1));
  updateCatalogControls({ page }, false);
  updateCatalogView(app, getState(), catalogActions());
}

function selectProduct(productId, focusProfile = false) {
  updateState({ product: { ...getState().product, selectedProductId: productId } });
  refreshWorkspace();
  if (focusProfile) document.querySelector("#profile-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function render(route = getState().currentRoute) {
  updateState({ currentRoute: route });
  if (!getState().hasEntered) renderLanding(); else renderWorkspace(route);
  if (getState().hasEntered && route === "product" && getState().product.status === "idle") loadProductData();
  if (getState().hasEntered && route === "brand" && getState().brand[getState().brand.activeSource].status === "idle") loadBrandData();
  if (getState().hasEntered && route === "seller" && getState().seller.status === "idle") loadSellerData();
  if (getState().hasEntered && route === "category" && getState().category.status === "idle") loadCategoryData();
  if (getState().hasEntered && route === "system" && getState().health.status === "unchecked") checkSystem();
}

startRouter((route) => render(route));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && getState().mobileNavOpen) {
    updateState({ mobileNavOpen: false });
    renderWorkspace(getState().currentRoute);
  }
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 640 && getState().mobileNavOpen) {
    updateState({ mobileNavOpen: false });
    renderWorkspace(getState().currentRoute);
  }
});

// Keep the configuration imported at the application boundary for future shell diagnostics.
void CONFIG;
