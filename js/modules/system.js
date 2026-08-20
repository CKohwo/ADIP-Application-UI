const SOURCE_GROUPS = [
  ["api_product", "Product Intelligence", "API"],
  ["api_brand", "Brand Intelligence", "API"],
  ["scraper_brand", "Brand Intelligence", "Web Scraper"],
  ["api_seller", "Seller Intelligence", "API"],
  ["scraper_category", "Category Intelligence", "Web Scraper"]
];
const ASSETS = [["features", "Features"], ["timeseries", "Timeseries"], ["llm_insight", "AI Insight"]];

function safeText(value) {
  if (value === null || value === undefined || value === "") return "Unavailable";
  if (typeof value === "object") return null;
  return String(value);
}

function appendText(parent, tag, className, value) {
  const content = safeText(value);
  if (content === null) return null;
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = content;
  parent.append(element);
  return element;
}

function sourceState(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return "not-reported";
  const values = ASSETS.map(([field]) => source[field]);
  const reported = values.filter((value) => typeof value === "boolean");
  if (!reported.length) return "not-reported";
  if (reported.length === ASSETS.length && reported.every(Boolean)) return "available";
  if (reported.some(Boolean)) return "partial";
  if (reported.length === ASSETS.length && reported.every((value) => value === false)) return "unavailable";
  return "partial";
}

function stateLabel(value) {
  return { available: "Available", partial: "Partial availability", unavailable: "Unavailable", "not-reported": "Not reported" }[value] || "Not reported";
}

function renderHealth(root, state) {
  const health = state.health;
  const status = root.querySelector("[data-system-health-status]");
  if (status) {
    status.replaceChildren();
    status.className = `system-state system-state-${health.status}`;
    const label = health.status === "checking" ? "Refreshing status" : health.status === "success" ? "Health received" : health.status === "error" ? "Health request failed" : "Not checked";
    const dot = document.createElement("span");
    dot.className = "state-dot";
    dot.setAttribute("aria-hidden", "true");
    status.append(dot);
    appendText(status, "span", null, label);
  }
  const notice = root.querySelector("[data-system-health-notice]");
  if (notice) {
    notice.replaceChildren();
    notice.className = health.status === "error" ? "system-notice error-notice" : health.status === "checking" ? "system-notice loading-notice" : "system-notice";
    if (health.status === "checking") notice.textContent = "Retrieving the current system health…";
    if (health.status === "error") notice.textContent = health.error || "Unable to retrieve the current system health.";
  }
  ["status", "service", "version"].forEach((field) => { const target = root.querySelector(`[data-health-field="${field}"]`); if (target) { target.replaceChildren(); const value = health.status === "success" ? safeText(health.data?.[field]) : "Unavailable"; target.textContent = value === null ? "Unavailable" : value; } });
  const refresh = root.querySelector("[data-system-action=refresh]");
  if (refresh) refresh.disabled = health.status === "checking";
}

function renderReadiness(root, state) {
  const target = root.querySelector("[data-system-readiness]");
  if (!target) return;
  target.replaceChildren();
  const sources = state.health.status === "success" && state.health.data?.sources && typeof state.health.data.sources === "object" && !Array.isArray(state.health.data.sources) ? state.health.data.sources : null;
  const reportedGroups = SOURCE_GROUPS.filter(([key]) => Object.prototype.hasOwnProperty.call(sources || {}, key));
  let availableAssets = 0; let reportedAssets = 0; let fullyAvailable = 0;
  reportedGroups.forEach(([key]) => { const source = sources[key]; const booleans = source && typeof source === "object" && !Array.isArray(source) ? ASSETS.map(([field]) => source[field]).filter((value) => typeof value === "boolean") : []; reportedAssets += booleans.length; availableAssets += booleans.filter(Boolean).length; if (sourceState(source) === "available") fullyAvailable += 1; });
  const summary = document.createElement("div"); summary.className = "system-readiness-summary";
  [["Source groups", `${reportedGroups.length} of ${SOURCE_GROUPS.length} expected groups reported`], ["Fully available", `${fullyAvailable} of ${SOURCE_GROUPS.length} groups fully available`], ["Reported assets", `${availableAssets} of ${reportedAssets} available`]].forEach(([label, value]) => { const item = document.createElement("div"); item.className = "system-summary-item"; appendText(item, "span", null, label); appendText(item, "strong", null, value); summary.append(item); });
  target.append(summary);
  if (state.health.status !== "success") { appendText(target, "p", "system-empty", state.health.status === "checking" ? "Readiness details will appear with the health response." : "Readiness details are unavailable until a health response is received."); return; }
  const list = document.createElement("div"); list.className = "system-source-list";
  SOURCE_GROUPS.forEach(([key, moduleName, sourceName]) => { const card = document.createElement("article"); card.className = "system-source-card"; const heading = document.createElement("div"); heading.className = "system-source-heading"; appendText(heading, "h4", null, moduleName); appendText(heading, "span", "system-source-label", sourceName); card.append(heading); const source = sources?.[key]; const availability = sourceState(source); const badge = appendText(card, "div", `system-availability system-availability-${availability}`, stateLabel(availability)); if (badge) badge.setAttribute("role", "status"); const assetList = document.createElement("div"); assetList.className = "system-asset-list"; ASSETS.forEach(([field, label]) => { const item = document.createElement("div"); item.className = "system-asset-item"; appendText(item, "span", null, label); const value = source && typeof source[field] === "boolean" ? (source[field] ? "Available" : "Unavailable") : "Not reported"; appendText(item, "strong", `asset-${value.toLowerCase().replace(" ", "-")}`, value); assetList.append(item); }); card.append(assetList); const technical = appendText(card, "p", "system-technical-key", key); if (technical) technical.setAttribute("aria-label", `Backend source key ${key}`); list.append(card); });
  target.append(list);
}

function renderControl(root, state) {
  const pipeline = state.pipeline;
  const button = root.querySelector("[data-system-action=run]");
  if (button) button.disabled = pipeline.status === "starting";
  const status = root.querySelector("[data-system-operation-status]");
  if (!status) return;
  status.replaceChildren();
  if (pipeline.status === "starting") appendText(status, "p", "system-operation-loading", "Starting application request…");
  else if (pipeline.status === "accepted") { appendText(status, "p", "system-operation-success", "Application request accepted by the backend."); const message = safeText(pipeline.data?.message); if (message) appendText(status, "p", "system-operation-message", message); }
  else if (pipeline.status === "error") appendText(status, "p", "system-operation-error", pipeline.error || "The application request failed.");
  else appendText(status, "p", "system-operation-idle", "No application request has been made from this workspace.");
}

export function renderSystem(state) {
  return `<section class="content system-content" aria-labelledby="system-page-title"><div class="content-header system-header"><div><div class="module-kicker">Operations</div><h2 id="system-page-title">System Operations</h2><p class="content-intro">Detailed observability, intelligence asset readiness, and explicit application control.</p></div><span data-system-health-status></span></div><section class="product-section system-section" aria-labelledby="system-health-title"><div class="section-heading"><div><span class="card-kicker">Observability</span><h3 id="system-health-title">System Health</h3></div><p>Values below are reported by the ADIP health endpoint.</p></div><div data-system-health-notice role="status"></div><div class="system-health-grid"><div class="system-health-item"><span>Status</span><strong data-health-field="status"></strong></div><div class="system-health-item"><span>Service</span><strong data-health-field="service"></strong></div><div class="system-health-item"><span>Version</span><strong data-health-field="version"></strong></div></div><button class="button-secondary system-action" type="button" data-system-action="refresh">Refresh System Status</button></section><section class="product-section system-section" aria-labelledby="system-readiness-title"><div class="section-heading"><div><span class="card-kicker">Asset readiness</span><h3 id="system-readiness-title">Intelligence Asset Readiness</h3></div><p>Availability reflects only the boolean assets returned by the health response.</p></div><div data-system-readiness></div></section><section class="product-section system-section" aria-labelledby="system-control-title"><div class="section-heading"><div><span class="card-kicker">Application control</span><h3 id="system-control-title">Run ADIP Application</h3></div><p>This sends the documented application-run request to FastAPI; acceptance is not a claim of completion.</p></div><button class="button-primary system-action" type="button" data-system-action="run">Run ADIP Application</button><div data-system-operation-status role="status"></div></section></section>`;
}

export function renderSystemData(root, state) { renderHealth(root, state); renderReadiness(root, state); renderControl(root, state); }

export function bindSystemControls(root, actions) { root.querySelector("[data-system-action=refresh]")?.addEventListener("click", actions.onRefresh); root.querySelector("[data-system-action=run]")?.addEventListener("click", actions.onRun); }
