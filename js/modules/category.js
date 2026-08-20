const PROFILE_FIELDS = [
  ["Listing Volume", "listing_volume"],
  ["Product Variety", "product_variety_count"],
  ["Brand Count", "brand_count"],
  ["Top Brand", "top_brand"],
  ["Median Price", "median_price"],
  ["Price Tier", "price_tier"],
  ["Average Rating", "avg_rating"],
  ["Rating Coverage", "rating_coverage_pct"],
  ["Source", "source"]
];
const HISTORICAL_METRICS = [["listing_volume", "Listing Volume"], ["product_variety_count", "Product Variety"], ["brand_count", "Brand Count"], ["median_price", "Median Price"], ["avg_rating", "Average Rating"], ["rating_coverage_pct", "Rating Coverage"]];
const INTERPRETATION_METRICS = [["median_price", "Median price"], ["listing_volume", "Listing volume"], ["avg_rating", "Average rating"]];

function numeric(value) {
  if (value === null || value === undefined || value === "" || (typeof value === "string" && value.trim() === "")) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value) {
  return value === null || value === undefined || value === "" ? "Unavailable" : String(value);
}

function display(value, field = "") {
  const parsed = numeric(value);
  if (parsed === null) return text(value);
  const countFields = ["listing_volume", "product_variety_count", "brand_count"];
  const formatted = parsed.toLocaleString(undefined, { maximumFractionDigits: countFields.includes(field) ? 0 : 2 });
  return field === "rating_coverage_pct" ? `${formatted}%` : formatted;
}

function features(state) {
  return Array.isArray(state.category.data?.features) ? state.category.data.features : [];
}

function setText(root, selector, value) {
  const element = root.querySelector(selector);
  if (element) element.textContent = text(value);
}

export function renderCategory() {
  return `<section class="content category-content" aria-labelledby="category-page-title">
    <div class="content-header category-header">
      <div><div class="module-kicker">Intelligence module</div><h2 id="category-page-title">Category Intelligence</h2><p class="content-intro">Understand category-level marketplace measurements across listing volume, product variety, brands, pricing, ratings, and rating coverage.</p></div>
      <span class="module-state" data-category-status><span class="state-dot" aria-hidden="true"></span></span>
    </div>
    <div class="category-notice" data-category-notice role="status"></div>
    <section class="product-section orientation-section" aria-labelledby="category-orientation-title">
      <div class="section-heading"><div><span class="card-kicker">Dataset orientation</span><h3 id="category-orientation-title">Know the Category landscape</h3></div><p>These values describe the returned Category marketplace measurements.</p></div>
      <div class="orientation-grid"><div class="orientation-item"><span>Categories</span><strong data-category-orientation="categories"></strong></div><div class="orientation-item"><span>Timeseries records</span><strong data-category-orientation="timeseries"></strong></div><div class="orientation-item"><span>Source</span><strong data-category-orientation="source"></strong></div></div>
    </section>
    <section class="product-section" aria-labelledby="category-market-title">
      <div class="section-heading"><div><span class="card-kicker">Understand</span><h3 id="category-market-title">Market Overview</h3></div><p>Bounded ranking by the backend-measured median price.</p></div>
      <div class="visual-card" data-category-ranking></div>
    </section>
    <section class="product-section discovery-section" aria-labelledby="category-discovery-title">
      <div class="section-heading"><div><span class="card-kicker">Discover</span><h3 id="category-discovery-title">Category Discovery</h3></div><p>Search returned Category records by their exact backend category value.</p></div>
      <div class="discovery-panel"><label class="field-label" for="category-search">Search categories</label><div class="search-row"><input id="category-search" type="search" placeholder="Search by category" /><span class="search-count" data-category-search-count></span></div><div data-category-results></div></div>
    </section>
    <section class="product-section profile-section" aria-labelledby="category-profile-title">
      <div class="section-heading"><div><span class="card-kicker">Investigate</span><h3 id="category-profile-title">Selected Category Profile</h3></div><p>Direct measurements for the Category currently under investigation.</p></div>
      <div data-category-profile></div>
    </section>
    <section class="product-section category-history" aria-labelledby="category-history-title">
      <div class="section-heading"><div><span class="card-kicker">Historical evidence</span><h3 id="category-history-title">Historical Category Trends</h3></div><p>Actual chronological measurements for the selected Category.</p></div>
      <div class="visual-card category-history-chart"><div class="visual-toolbar category-history-controls"><label for="category-history-metric">Measure<select id="category-history-metric" disabled>${HISTORICAL_METRICS.map(([field, label]) => `<option value="${field}">${label}</option>`).join("")}</select></label></div><div data-category-history></div></div>
    </section>
    <section class="product-section category-interpretation" aria-labelledby="category-interpretation-title">
      <div class="section-heading"><div><span class="card-kicker">Traceable evidence</span><h3 id="category-interpretation-title">Deterministic Interpretation</h3></div><p>Direct observations from the active Category measurements.</p></div>
      <div data-category-interpretation></div>
    </section>
    <section class="product-section category-ai-section" aria-labelledby="category-ai-title">
      <div class="section-heading"><div><span class="card-kicker ai-kicker">Backend-generated interpretation</span><h3 id="category-ai-title">AI Executive Insight</h3></div><p>Market-level AI intelligence returned by the Category payload.</p></div>
      <div class="ai-insight-body category-ai-body" data-category-insight></div>
    </section>
    <section class="product-section category-catalog" aria-labelledby="category-catalog-title">
      <div class="section-heading"><div><span class="card-kicker">Explore</span><h3 id="category-catalog-title">Category Catalog</h3></div><p>Browse loaded Category feature records with bounded client-side controls.</p></div>
      <div data-category-catalog></div>
    </section>
  </section>`;
}

function renderRanking(root, state) {
  const target = root.querySelector("[data-category-ranking]");
  if (!target) return;
  target.replaceChildren();
  const rows = features(state).filter((record) => numeric(record.median_price) !== null).slice().sort((left, right) => numeric(right.median_price) - numeric(left.median_price)).slice(0, 6);
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "visual-empty";
    empty.setAttribute("role", "status");
    empty.textContent = features(state).length ? "No usable median price measurements are available." : "No Category records are available for ranking.";
    target.append(empty);
    return;
  }
  const maximum = Math.max(...rows.map((record) => numeric(record.median_price)), 1);
  const list = document.createElement("div");
  list.className = "ranking-list";
  list.setAttribute("aria-label", "Top categories by median price");
  rows.forEach((record, index) => {
    const item = document.createElement("div");
    item.className = "ranking-item";
    const label = document.createElement("div");
    label.className = "ranking-label";
    const number = document.createElement("span");
    number.className = "ranking-number";
    number.textContent = String(index + 1);
    const name = document.createElement("span");
    name.className = "ranking-name";
    name.textContent = text(record.category);
    const amount = document.createElement("strong");
    amount.textContent = display(record.median_price, "median_price");
    label.append(number, name, amount);
    const track = document.createElement("div");
    track.className = "ranking-track";
    const fill = document.createElement("span");
    fill.className = "ranking-fill";
    fill.style.width = `${Math.max(3, numeric(record.median_price) / maximum * 100)}%`;
    track.append(fill);
    item.append(label, track);
    list.append(item);
  });
  target.append(list);
}

function renderDiscovery(root, state, onSelect) {
  const target = root.querySelector("[data-category-results]");
  if (!target) return;
  target.replaceChildren();
  const query = String(state.category.search || "").trim().toLowerCase();
  const rows = features(state).filter((record) => String(record.category ?? "").toLowerCase().includes(query)).slice(0, 8);
  const count = root.querySelector("[data-category-search-count]");
  if (count) count.textContent = state.category.status === "success" ? `${rows.length} result${rows.length === 1 ? "" : "s"} shown` : "Unavailable";
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = state.category.status === "success" && features(state).length ? (query ? "No categories match this search." : "No Category records are available.") : "Category records are not available to search.";
    target.append(empty);
    return;
  }
  const list = document.createElement("div");
  list.className = "search-results";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Category search results");
  rows.forEach((record) => {
    const button = document.createElement("button");
    button.className = "search-result";
    button.type = "button";
    button.setAttribute("role", "option");
    const name = document.createElement("strong");
    name.textContent = text(record.category);
    const context = document.createElement("span");
    context.textContent = `Listing volume: ${display(record.listing_volume, "listing_volume")} · Median price: ${display(record.median_price, "median_price")}`;
    button.append(name, context);
    button.addEventListener("click", () => onSelect(record.category));
    list.append(button);
  });
  target.append(list);
}

function renderProfile(root, state) {
  const target = root.querySelector("[data-category-profile]");
  if (!target) return;
  target.replaceChildren();
  const record = features(state).find((item) => item.category === state.category.selectedCategory);
  if (!record) {
    const empty = document.createElement("div");
    empty.className = "empty-panel";
    empty.setAttribute("role", "status");
    empty.textContent = state.category.status === "success" ? "Select a Category through discovery to view its measured profile." : "Category profile is unavailable until Category data is loaded.";
    target.append(empty);
    return;
  }
  const grid = document.createElement("div");
  grid.className = "profile-grid";
  PROFILE_FIELDS.forEach(([label, field]) => {
    const item = document.createElement("div");
    item.className = "profile-item";
    const itemLabel = document.createElement("span");
    itemLabel.textContent = label;
    const itemValue = document.createElement("strong");
    itemValue.textContent = field === "category" || field === "top_brand" || field === "price_tier" || field === "source" ? text(record[field]) : display(record[field], field);
    item.append(itemLabel, itemValue);
    grid.append(item);
  });
  target.append(grid);
}

function historyRecords(state) {
  return (Array.isArray(state.category.data?.timeseries) ? state.category.data.timeseries : [])
    .filter((record) => record.category === state.category.selectedCategory && !Number.isNaN(new Date(record.day).getTime()))
    .slice()
    .sort((left, right) => new Date(left.day) - new Date(right.day));
}

function historyEmpty(target, message) {
  target.replaceChildren();
  const empty = document.createElement("div");
  empty.className = "visual-empty";
  empty.setAttribute("role", "status");
  empty.textContent = message;
  target.append(empty);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderHistory(root, state) {
  const target = root.querySelector("[data-category-history]");
  const select = root.querySelector("#category-history-metric");
  if (!target || !select) return;
  const loaded = state.category.status === "success";
  select.disabled = !loaded || !state.category.selectedCategory;
  select.value = state.category.historicalMetric;
  if (!state.category.selectedCategory) { historyEmpty(target, "Select a Category to view historical trends."); return; }
  if (state.category.status === "loading") { historyEmpty(target, "Category data is loading. Historical trends will appear after the request succeeds."); return; }
  if (state.category.status === "error") { historyEmpty(target, state.category.error || "Historical trends are unavailable because the Category request failed."); return; }
  const records = historyRecords(state);
  if (!records.length) { historyEmpty(target, "No historical records are available for the selected Category."); return; }
  const metric = HISTORICAL_METRICS.some(([field]) => field === state.category.historicalMetric) ? state.category.historicalMetric : "median_price";
  const label = HISTORICAL_METRICS.find(([field]) => field === metric)?.[1] || "Selected measure";
  const usable = records.map((record) => ({ record, value: numeric(record[metric]), date: new Date(record.day) })).filter(({ record, value, date }) => value !== null && !Number.isNaN(date.getTime()) && !(metric === "avg_rating" && numeric(record.rating_coverage_pct) === 0));
  if (!usable.length) { historyEmpty(target, metric === "avg_rating" ? "No usable Average Rating observations have sufficient rating coverage." : `No usable ${label.toLowerCase()} values are available for the selected Category.`); return; }
  const width = 760; const height = 280; const left = 58; const right = 18; const top = 24; const bottom = 50; const values = usable.map((item) => item.value); const minimum = Math.min(...values); const maximum = Math.max(...values); const range = maximum - minimum || 1; const step = usable.length === 1 ? 0 : (width - left - right) / (usable.length - 1); const points = usable.map((item, index) => `${left + index * step},${top + (maximum - item.value) / range * (height - top - bottom)}`).join(" ");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.classList.add("trend-chart"); svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${label} history for ${text(state.category.selectedCategory)}`);
  const axis = (x1, y1, x2, y2) => { const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.classList.add("chart-axis"); line.setAttribute("x1", x1); line.setAttribute("y1", y1); line.setAttribute("x2", x2); line.setAttribute("y2", y2); svg.append(line); }; axis(left, top, left, height - bottom); axis(left, height - bottom, width - right, height - bottom);
  if (usable.length > 1) { const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline"); polyline.classList.add("trend-line"); polyline.setAttribute("fill", "none"); polyline.setAttribute("points", points); svg.append(polyline); }
  usable.forEach((item, index) => { const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); const x = left + index * step; const y = top + (maximum - item.value) / range * (height - top - bottom); circle.classList.add("trend-point"); circle.setAttribute("cx", x); circle.setAttribute("cy", y); circle.setAttribute("r", "4"); const title = document.createElementNS("http://www.w3.org/2000/svg", "title"); title.textContent = `${formatDate(item.record.day)}: ${display(item.value, metric)}`; circle.append(title); svg.append(circle); });
  const addLabel = (x, y, value, anchor = "start") => { const labelNode = document.createElementNS("http://www.w3.org/2000/svg", "text"); labelNode.classList.add("chart-label"); labelNode.setAttribute("x", x); labelNode.setAttribute("y", y); labelNode.setAttribute("text-anchor", anchor); labelNode.textContent = value; svg.append(labelNode); }; addLabel(left, height - 18, formatDate(usable[0].record.day)); addLabel(width - right, height - 18, formatDate(usable[usable.length - 1].record.day), "end"); addLabel(left, 14, label);
  target.replaceChildren(); const wrap = document.createElement("div"); wrap.className = "trend-chart-wrap"; wrap.append(svg); const note = document.createElement("p"); note.className = "chart-note"; note.textContent = `${usable.length} valid observations shown; missing dates are not interpolated.`; wrap.append(note); target.append(wrap);
}

function renderInterpretation(root, state) {
  const target = root.querySelector("[data-category-interpretation]");
  if (!target) return;
  target.replaceChildren();
  if (!state.category.selectedCategory) { const empty = document.createElement("div"); empty.className = "empty-panel compact"; empty.setAttribute("role", "status"); empty.textContent = "Select a Category to derive direct historical observations."; target.append(empty); return; }
  if (state.category.status === "loading") { const empty = document.createElement("div"); empty.className = "empty-panel compact"; empty.setAttribute("role", "status"); empty.textContent = "Category data is loading. Deterministic interpretation will appear after the request succeeds."; target.append(empty); return; }
  if (state.category.status === "error") { const empty = document.createElement("div"); empty.className = "empty-panel compact"; empty.setAttribute("role", "alert"); empty.textContent = state.category.error || "Deterministic interpretation is unavailable because the Category request failed."; target.append(empty); return; }
  const records = historyRecords(state);
  if (!records.length) { const empty = document.createElement("div"); empty.className = "empty-panel compact"; empty.setAttribute("role", "status"); empty.textContent = "No matching historical records are available for the selected Category."; target.append(empty); return; }
  const observations = [];
  INTERPRETATION_METRICS.forEach(([field, label]) => {
    const usable = records.map((record) => ({ record, value: numeric(record[field]) })).filter(({ record, value }) => value !== null && !(field === "avg_rating" && numeric(record.rating_coverage_pct) === 0));
    if (!usable.length) return;
    const first = usable[0]; const latest = usable[usable.length - 1]; const firstDate = formatDate(first.record.day); const latestDate = formatDate(latest.record.day); let sentence;
    if (usable.length === 1) sentence = `Latest recorded ${label.toLowerCase()} was ${display(first.value, field)} on ${firstDate}.`;
    else if (first.value > latest.value) sentence = `${label} decreased from ${display(first.value, field)} on ${firstDate} to ${display(latest.value, field)} on ${latestDate}.`;
    else if (first.value < latest.value) sentence = `${label} increased from ${display(first.value, field)} on ${firstDate} to ${display(latest.value, field)} on ${latestDate}.`;
    else sentence = `${label} remained unchanged at ${display(first.value, field)} between ${firstDate} and ${latestDate}.`;
    observations.push(sentence);
  });
  if (!observations.length) { const empty = document.createElement("div"); empty.className = "empty-panel compact"; empty.setAttribute("role", "status"); empty.textContent = "No usable historical measurements are available for deterministic interpretation."; target.append(empty); return; }
  const list = document.createElement("div"); list.className = "interpretation-list"; observations.slice(0, 3).forEach((observation) => { const item = document.createElement("article"); item.className = "interpretation-item"; const paragraph = document.createElement("p"); paragraph.textContent = observation; item.append(paragraph); list.append(item); }); const note = document.createElement("p"); note.className = "data-note"; note.textContent = "Direct observations from Category measurements; no causal or strategic conclusions are applied."; target.append(list, note);
}

function insightText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  if (typeof value === "string" && (value.trim() === "" || value.trim().toLowerCase() === "nan")) return null;
  if (typeof value === "object") return null;
  return String(value);
}

function insightValue(value, field = "") {
  const content = insightText(value);
  if (content === null) return null;
  const numericFields = ["listing_volume", "brand_count", "avg_rating", "median_price", "product_variety_count"];
  if (!numericFields.includes(field)) return content;
  return numeric(value) === null ? content : display(value, field);
}

function appendInsightField(parent, label, value, field = "") {
  const content = insightValue(value, field);
  if (content === null) return false;
  const fieldNode = document.createElement("div");
  fieldNode.className = "insight-field";
  const fieldLabel = document.createElement("span");
  fieldLabel.className = "card-kicker";
  fieldLabel.textContent = label;
  const fieldValue = document.createElement("p");
  fieldValue.className = "insight-text";
  fieldValue.textContent = content;
  fieldNode.append(fieldLabel, fieldValue);
  parent.append(fieldNode);
  return true;
}

function appendInsightEmpty(parent, message) {
  const empty = document.createElement("p");
  empty.className = "insight-empty";
  empty.setAttribute("role", "status");
  empty.textContent = message;
  parent.append(empty);
}

function appendInsightSection(parent, title, renderContent) {
  const section = document.createElement("section");
  section.className = "insight-block";
  const heading = document.createElement("h4");
  heading.textContent = title;
  section.append(heading);
  renderContent(section);
  parent.append(section);
}

function appendAffectedCategories(parent, values) {
  if (!Array.isArray(values)) return false;
  const valid = values.map((value) => insightText(value)).filter((value) => value !== null);
  if (!valid.length) return false;
  const list = document.createElement("ul");
  list.className = "insight-products";
  valid.forEach((value) => { const item = document.createElement("li"); item.textContent = value; list.append(item); });
  const label = document.createElement("p");
  label.className = "insight-label";
  label.textContent = "Affected Categories";
  parent.append(label, list);
  return true;
}

function appendInsightItems(parent, items, fields, emptyMessage) {
  const list = document.createElement("div");
  list.className = "insight-list";
  let rendered = 0;
  if (Array.isArray(items)) items.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const card = document.createElement("article");
    card.className = "insight-item";
    const title = document.createElement("h5");
    title.textContent = `${fields[0][1]} ${index + 1}`;
    card.append(title);
    let fieldCount = 0;
    fields.forEach(([field, label, formatField]) => { if (appendInsightField(card, label, item[field], formatField || field)) fieldCount += 1; });
    if (fields.some(([field]) => field === "affected_categories") && appendAffectedCategories(card, item.affected_categories)) fieldCount += 1;
    if (fieldCount) { list.append(card); rendered += 1; }
  });
  if (!rendered) { appendInsightEmpty(parent, emptyMessage); return; }
  parent.append(list);
}

function appendSpotlightGroup(parent, group, title, fields, emptyMessage) {
  const wrapper = document.createElement("div");
  wrapper.className = "insight-list";
  const heading = document.createElement("h5");
  heading.className = "insight-item-title";
  heading.textContent = title;
  parent.append(heading);
  let rendered = 0;
  if (group && typeof group === "object" && !Array.isArray(group)) Object.entries(group).forEach(([categoryName, details]) => {
    if (!details || typeof details !== "object" || Array.isArray(details)) return;
    const card = document.createElement("article");
    card.className = "insight-item insight-spotlight";
    const name = document.createElement("h5");
    name.textContent = categoryName;
    card.append(name);
    let fieldCount = 0;
    fields.forEach(([field, label]) => { if (appendInsightField(card, label, details[field], field)) fieldCount += 1; });
    if (fieldCount) { wrapper.append(card); rendered += 1; }
  });
  if (!rendered) appendInsightEmpty(parent, emptyMessage);
  else parent.append(wrapper);
}

function renderCategoryInsight(root, state) {
  const target = root.querySelector("[data-category-insight]");
  if (!target) return;
  target.replaceChildren();
  if (state.category.status === "loading") { appendInsightEmpty(target, "AI executive insight will appear after Category data loads."); return; }
  if (state.category.status === "error") { appendInsightEmpty(target, "AI executive insight is unavailable because the Category request failed."); return; }
  const insight = state.category.status === "success" && state.category.data?.insight && typeof state.category.data.insight === "object" && !Array.isArray(state.category.data.insight) ? state.category.data.insight : null;
  if (!insight) { appendInsightEmpty(target, "AI executive insight is currently unavailable."); return; }
  appendInsightField(target, "Role", insight.role);
  appendInsightSection(target, "Executive Summary", (section) => { if (!appendInsightField(section, "Executive Summary", insight.executive_summary)) appendInsightEmpty(section, "Executive summary is unavailable."); });
  appendInsightSection(target, "Key Findings", (section) => appendInsightItems(section, insight.key_findings, [["finding", "Finding"], ["evidence", "Evidence"], ["confidence", "Confidence"], ["confidence_reason", "Confidence Reason"]], "No usable backend key findings are available."));
  appendInsightSection(target, "Opportunities", (section) => appendInsightItems(section, insight.opportunities, [["opportunity", "Opportunity"], ["rationale", "Rationale"], ["affected_categories", "Affected Categories"]], "No usable backend opportunities are available."));
  appendInsightSection(target, "Risks", (section) => appendInsightItems(section, insight.risks, [["risk", "Risk"], ["rationale", "Rationale"], ["affected_categories", "Affected Categories"]], "No usable backend risks are available."));
  appendInsightSection(target, "Category Spotlights", (section) => { const spotlights = insight.entity_spotlights; appendSpotlightGroup(section, spotlights?.largest_categories, "Largest Categories", [["listing_volume", "Listing Volume"], ["brand_count", "Brand Count"], ["avg_rating", "Average Rating"]], "No usable Largest Categories spotlights are available."); appendSpotlightGroup(section, spotlights?.premium_category, "Premium Category", [["median_price", "Median Price"], ["price_tier", "Price Tier"], ["avg_rating", "Average Rating"]], "No usable Premium Category spotlights are available."); appendSpotlightGroup(section, spotlights?.most_competitive_category, "Most Competitive Category", [["brand_count", "Brand Count"], ["product_variety_count", "Product Variety"], ["listing_volume", "Listing Volume"]], "No usable Most Competitive Category spotlights are available."); });
}

const CATALOG_PAGE_SIZE = 25;
const CATALOG_SORTS = [["category", "Category"], ["listing_volume", "Listing Volume"], ["product_variety_count", "Product Variety"], ["brand_count", "Brand Count"], ["median_price", "Median Price"], ["avg_rating", "Average Rating"], ["rating_coverage_pct", "Rating Coverage"], ["price_tier", "Price Tier"], ["top_brand", "Top Brand"]];
const CATALOG_COLUMNS = [["category", "Category"], ["listing_volume", "Listing Volume"], ["product_variety_count", "Product Variety"], ["brand_count", "Brand Count"], ["top_brand", "Top Brand"], ["median_price", "Median Price"], ["avg_rating", "Average Rating"], ["rating_coverage_pct", "Rating Coverage"], ["price_tier", "Price Tier"]];
const CATALOG_NUMERIC_FIELDS = new Set(["listing_volume", "product_variety_count", "brand_count", "median_price", "avg_rating", "rating_coverage_pct"]);
function catalogNumber(value) { return numeric(value); }
function catalogOptions(state) { return [...new Set(features(state).map((record) => record.price_tier).filter((value) => value !== null && value !== undefined && value !== ""))]; }
function catalogRows(state) { const query = String(state.category.catalogQuery || "").trim().toLowerCase(); const tier = state.category.catalogPriceTier || ""; const rows = features(state).filter((record) => !query || String(record.category ?? "").toLowerCase().includes(query)).filter((record) => !tier || String(record.price_tier ?? "") === String(tier)).slice(); const sortKey = CATALOG_SORTS.some(([field]) => field === state.category.catalogSortKey) ? state.category.catalogSortKey : "category"; const direction = state.category.catalogSortDirection === "desc" ? -1 : 1; rows.sort((left, right) => { if (CATALOG_NUMERIC_FIELDS.has(sortKey)) { const leftNumber = catalogNumber(left[sortKey]); const rightNumber = catalogNumber(right[sortKey]); if (leftNumber === null && rightNumber === null) return 0; if (leftNumber === null) return 1; if (rightNumber === null) return -1; return (leftNumber - rightNumber) * direction; } return String(left[sortKey] ?? "").localeCompare(String(right[sortKey] ?? ""), undefined, { sensitivity: "base" }) * direction; }); return rows; }
function catalogValue(record, field) { return CATALOG_NUMERIC_FIELDS.has(field) ? display(record[field], field) : text(record[field]); }
function renderCategoryCatalog(root, state, onSelect) { const target = root.querySelector("[data-category-catalog]"); if (!target) return; target.replaceChildren(); const toolbar = document.createElement("div"); toolbar.className = "catalog-toolbar category-catalog-toolbar"; const searchLabel = document.createElement("label"); searchLabel.className = "field-label"; searchLabel.textContent = "Search categories"; const search = document.createElement("input"); search.id = "category-catalog-search"; search.type = "search"; search.placeholder = "Search by category"; search.value = state.category.catalogQuery || ""; search.disabled = state.category.status !== "success"; searchLabel.append(search); const tierLabel = document.createElement("label"); tierLabel.className = "field-label"; tierLabel.textContent = "Price Tier"; const tier = document.createElement("select"); tier.id = "category-catalog-price-tier"; tier.disabled = state.category.status !== "success"; const all = document.createElement("option"); all.value = ""; all.textContent = "All tiers"; tier.append(all); catalogOptions(state).forEach((value) => { const option = document.createElement("option"); option.value = String(value); option.textContent = String(value); tier.append(option); }); tier.value = state.category.catalogPriceTier || ""; tierLabel.append(tier); const sortLabel = document.createElement("label"); sortLabel.className = "field-label"; sortLabel.textContent = "Sort by"; const sort = document.createElement("select"); sort.id = "category-catalog-sort"; sort.disabled = state.category.status !== "success"; CATALOG_SORTS.forEach(([field, label]) => { const option = document.createElement("option"); option.value = field; option.textContent = label; sort.append(option); }); sort.value = CATALOG_SORTS.some(([field]) => field === state.category.catalogSortKey) ? state.category.catalogSortKey : "category"; sortLabel.append(sort); const directionLabel = document.createElement("label"); directionLabel.className = "field-label"; directionLabel.textContent = "Order"; const direction = document.createElement("select"); direction.id = "category-catalog-direction"; direction.disabled = state.category.status !== "success"; [["asc", "Ascending"], ["desc", "Descending"]].forEach(([value, label]) => { const option = document.createElement("option"); option.value = value; option.textContent = label; direction.append(option); }); direction.value = state.category.catalogSortDirection === "desc" ? "desc" : "asc"; directionLabel.append(direction); toolbar.append(searchLabel, tierLabel, sortLabel, directionLabel); target.append(toolbar); if (state.category.status !== "success") { const empty = document.createElement("div"); empty.className = "catalog-empty"; empty.setAttribute("role", state.category.status === "error" ? "alert" : "status"); const title = document.createElement("strong"); title.textContent = state.category.status === "error" ? "Category Catalog unavailable." : "Category Catalog is not loaded."; const message = document.createElement("span"); message.textContent = state.category.status === "loading" ? "Category feature records are being requested." : state.category.error || "Load Category data to browse the catalog."; empty.append(title, message); target.append(empty); return; } const rows = catalogRows(state); const totalPages = Math.max(1, Math.ceil(rows.length / CATALOG_PAGE_SIZE)); const page = Math.min(Math.max(Number(state.category.catalogPage) || 1, 1), totalPages); if (!rows.length) { const empty = document.createElement("div"); empty.className = "catalog-empty"; empty.setAttribute("role", "status"); const title = document.createElement("strong"); title.textContent = "No Category records match the current view."; const message = document.createElement("span"); message.textContent = "Adjust the Category search or Price Tier filter."; empty.append(title, message); target.append(empty); return; } const pageRows = rows.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE); const wrap = document.createElement("div"); wrap.className = "catalog-table-wrap category-catalog-table-wrap"; const table = document.createElement("table"); table.className = "catalog-table category-catalog-table"; const caption = document.createElement("caption"); caption.className = "sr-only"; caption.textContent = "Category feature catalog"; table.append(caption); const head = document.createElement("thead"); const headerRow = document.createElement("tr"); CATALOG_COLUMNS.forEach(([, label]) => { const cell = document.createElement("th"); cell.scope = "col"; cell.textContent = label; headerRow.append(cell); }); head.append(headerRow); table.append(head); const body = document.createElement("tbody"); pageRows.forEach((record) => { const row = document.createElement("tr"); CATALOG_COLUMNS.forEach(([field]) => { const cell = document.createElement("td"); if (field === "category") { const button = document.createElement("button"); button.type = "button"; button.className = "catalog-product-button"; button.textContent = text(record.category); button.addEventListener("click", () => onSelect(record.category)); cell.append(button); } else cell.textContent = catalogValue(record, field); row.append(cell); }); body.append(row); }); table.append(body); wrap.append(table); target.append(wrap); const pagination = document.createElement("div"); pagination.className = "catalog-pagination"; const note = document.createElement("span"); note.textContent = `Page ${page} of ${totalPages} · ${rows.length.toLocaleString()} matching record${rows.length === 1 ? "" : "s"}`; const buttons = document.createElement("div"); const previous = document.createElement("button"); previous.type = "button"; previous.className = "button-secondary"; previous.dataset.categoryCatalogPage = String(page - 1); previous.textContent = "Previous"; previous.disabled = page <= 1; const next = document.createElement("button"); next.type = "button"; next.className = "button-secondary"; next.dataset.categoryCatalogPage = String(page + 1); next.textContent = "Next"; next.disabled = page >= totalPages; buttons.append(previous, next); pagination.append(note, buttons); target.append(pagination); }

export function renderCategoryData(root, state, onSelect) {
  const status = root.querySelector("[data-category-status]");
  if (status) {
    status.className = `module-state state-${state.category.status}`;
    const dot = status.querySelector(".state-dot");
    if (dot) dot.setAttribute("aria-hidden", "true");
    const label = state.category.status === "idle" ? "Not loaded" : state.category.status === "loading" ? "Loading data" : state.category.status === "success" ? "Data loaded" : "Load failed";
    const statusLabel = document.createElement("span");
    statusLabel.textContent = label;
    status.append(statusLabel);
  }
  const notice = root.querySelector("[data-category-notice]");
  if (notice) {
    notice.replaceChildren();
    notice.className = state.category.status === "error" ? "category-notice error-notice" : state.category.status === "loading" ? "category-notice loading-notice" : "category-notice";
    if (state.category.status === "loading") notice.textContent = "Requesting Category Intelligence data from the configured FastAPI service…";
    if (state.category.status === "error") notice.textContent = state.category.error || "The Category request failed.";
  }
  const loaded = state.category.status === "success";
  root.querySelector("#category-search")?.toggleAttribute("disabled", !loaded);
  setText(root, "[data-category-orientation=categories]", loaded ? features(state).length.toLocaleString() : "Loading");
  setText(root, "[data-category-orientation=timeseries]", loaded ? (Array.isArray(state.category.data.timeseries) ? state.category.data.timeseries.length : 0).toLocaleString() : "Loading");
  const sourceRecord = loaded ? features(state)[0] || state.category.data.timeseries?.[0] : null;
  setText(root, "[data-category-orientation=source]", loaded ? sourceRecord?.source : "Loading");
  renderRanking(root, state);
  renderDiscovery(root, state, onSelect);
  renderProfile(root, state);
  renderHistory(root, state);
  renderInterpretation(root, state);
  renderCategoryInsight(root, state);
  renderCategoryCatalog(root, state, onSelect);
}

export function bindCategoryControls(root, actions) {
  root.querySelector("#category-search")?.addEventListener("input", (event) => actions.onSearch(event.target.value));
  root.querySelector("#category-history-metric")?.addEventListener("change", (event) => actions.onHistoricalMetric(event.target.value));
  root.querySelector("#category-catalog-search")?.addEventListener("input", (event) => actions.onCatalogSearch(event.target.value));
  root.querySelector("#category-catalog-price-tier")?.addEventListener("change", (event) => actions.onCatalogFilter(event.target.value));
  root.querySelector("#category-catalog-sort")?.addEventListener("change", (event) => actions.onCatalogSort(event.target.value));
  root.querySelector("#category-catalog-direction")?.addEventListener("change", (event) => actions.onCatalogDirection(event.target.value));
  root.querySelectorAll("[data-category-catalog-page]").forEach((button) => button.addEventListener("click", () => actions.onCatalogPage(Number(button.dataset.categoryCatalogPage))));
}
