const marketMetrics = [["avg_price", "Average Price"], ["observation_count", "Observation Count"], ["avg_rating", "Average Rating"], ["stock_qty", "Stock"]];
const trendMetrics = [["avg_price", "Price"], ["avg_rating", "Rating"], ["stock_qty", "Stock"], ["observation_count", "Observations"]];
const deferredTrendMetrics = trendMetrics;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function displayValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "Unavailable";
  const number = numeric(value);
  if (number !== null) return `${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
  return escapeHtml(value);
}

function displayDate(value) {
  if (value === null || value === undefined || value === "") return "Unavailable";
  const date = new Date(typeof value === "number" || /^\d+$/.test(String(value)) ? Number(value) : value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function metricOptions(metrics) {
  return metrics.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

function featureRecords(data) {
  return Array.isArray(data?.features) ? data.features : [];
}

function deriveOrientation(data) {
  const features = featureRecords(data);
  const timeseries = Array.isArray(data?.timeseries) ? data.timeseries : [];
  const ids = new Set(features.map((record) => record.product_id).filter((id) => id !== null && id !== undefined));
  const observations = features.reduce((total, record) => total + (numeric(record.observation_count) ?? 0), 0);
  const dates = timeseries.map((record) => new Date(record.day)).filter((date) => !Number.isNaN(date.getTime())).sort((a, b) => a - b);
  const sources = [...new Set([...features, ...timeseries].map((record) => record.source).filter(Boolean))];
  return {
    products: ids.size,
    observations,
    earliest: dates[0],
    latest: dates[dates.length - 1],
    sources
  };
}

function rankedProducts(features, metric) {
  return features.filter((record) => typeof record.product_name === "string" && record.product_name.trim() && numeric(record[metric]) !== null)
    .map((record) => ({ record, value: numeric(record[metric]) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
}

function historicalRecords(data, productId) {
  if (productId === null || productId === undefined) return [];
  return (Array.isArray(data?.timeseries) ? data.timeseries : [])
    .filter((record) => String(record.product_id) === String(productId))
    .slice()
    .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
}

function usableMetricValue(record, metric) {
  const value = numeric(record[metric]);
  if (value === null) return null;
  if (metric === "avg_rating") {
    const coverage = numeric(record.rating_coverage_pct);
    const reviewCount = numeric(record.total_rating_count);
    if ((coverage !== null && coverage <= 0) || (reviewCount !== null && reviewCount <= 0)) return null;
  }
  return value;
}

function usableHistory(records, metric) {
  return records.map((record) => ({ record, value: usableMetricValue(record, metric) })).filter(({ record, value }) => value !== null && !Number.isNaN(new Date(record.day).getTime()));
}

function renderHistoricalChart(records, metric) {
  const label = trendMetrics.find(([value]) => value === metric)?.[1] || "Selected measure";
  const usable = usableHistory(records, metric);
  if (records.length === 0) return `<div class="visual-empty" role="status"><strong>No historical records are available for this product.</strong><span>The selected product has no matching timeseries records.</span></div>`;
  if (usable.length < 2) return `<div class="visual-empty" role="status"><strong>Insufficient usable ${escapeHtml(label.toLowerCase())} history.</strong><span>At least two valid chronological observations are required for this visualization.</span></div>`;
  const width = 760;
  const height = 280;
  const left = 48;
  const right = 18;
  const top = 22;
  const bottom = 48;
  const values = usable.map(({ value }) => value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  const xStep = (width - left - right) / Math.max(usable.length - 1, 1);
  const points = usable.map(({ value }, index) => `${left + (index * xStep)},${top + ((maximum - value) / range) * (height - top - bottom)}`).join(" ");
  const first = usable[0].record;
  const middle = usable[Math.floor((usable.length - 1) / 2)].record;
  const last = usable[usable.length - 1].record;
  const xLabels = [[left, first], [left + (Math.floor((usable.length - 1) / 2) * xStep), middle], [left + ((usable.length - 1) * xStep), last]];
  const circles = usable.map(({ record, value }, index) => { const x = left + (index * xStep); const y = top + ((maximum - value) / range) * (height - top - bottom); return `<circle cx="${x}" cy="${y}" r="4" class="trend-point"><title>${escapeHtml(displayDate(record.day))}: ${escapeHtml(displayValue(value))}</title></circle>`; }).join("");
  return `<div class="trend-chart-wrap"><svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)} over time for selected product"><line x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}" class="chart-axis"/><line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" class="chart-axis"/><text x="8" y="${top + 4}" class="chart-label">${escapeHtml(displayValue(maximum))}</text><text x="8" y="${height - bottom + 4}" class="chart-label">${escapeHtml(displayValue(minimum))}</text><polyline points="${points}" class="trend-line" fill="none"/>${circles}${xLabels.map(([x, record]) => `<text x="${x}" y="${height - 18}" text-anchor="middle" class="chart-label">${escapeHtml(displayDate(record.day))}</text>`).join("")}</svg><p class="chart-note">Showing ${usable.length} usable ${escapeHtml(label.toLowerCase())} observations; records without a usable value are omitted.</p></div>`;
}

function direction(first, last) {
  if (last > first) return "increased";
  if (last < first) return "decreased";
  return "did not change";
}

function deterministicFindings(record, records) {
  const findings = [];
  const categories = [
    ["Price evidence", "avg_price", "average price"],
    ["Rating evidence", "avg_rating", "average rating"],
    ["Stock evidence", "stock_qty", "stock quantity"],
    ["Observation evidence", "observation_count", "observation count"]
  ];
  categories.forEach(([title, metric, label]) => {
    const usable = usableHistory(records, metric);
    if (usable.length < 2) { findings.push({ title, text: `Insufficient usable historical ${label} values are available for a comparison.` }); return; }
    const first = usable[0];
    const last = usable[usable.length - 1];
    const values = usable.map(({ value }) => value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    let text = `${label[0].toUpperCase()}${label.slice(1)} ${direction(first.value, last.value)} from ${displayValue(first.value)} on ${displayDate(first.record.day)} to ${displayValue(last.value)} on ${displayDate(last.record.day)}.`;
    if (metric === "avg_price" && numeric(record.current_price) !== null) text += ` Current feature price is ${displayValue(record.current_price)}; historical average across usable records is ${displayValue(values.reduce((sum, value) => sum + value, 0) / values.length)}.`;
    if (metric === "avg_rating" && numeric(record.current_rating) !== null) text += ` Current feature rating is ${displayValue(record.current_rating)}.`;
    text += ` Observed range: ${displayValue(minimum)} to ${displayValue(maximum)}.`;
    findings.push({ title, text });
  });
  return findings;
}

function renderDeterministicInterpretation(record, records) {
  if (!record) return `<div class="empty-panel compact" role="status"><strong>No product selected.</strong><span>Deterministic observations will appear after a product is selected.</span></div>`;
  const findings = deterministicFindings(record, records);
  return `<div class="interpretation-list">${findings.map(({ title, text }) => `<article class="interpretation-item"><span class="card-kicker">${title}</span><p>${escapeHtml(text)}</p></article>`).join("")}</div><p class="data-note">Observations are derived only from the selected feature record and matching timeseries records.</p>`;
}

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text == null || text === "" ? "Unavailable" : String(text);
  return element;
}

function insightMessage(container, message) {
  container.replaceChildren(textElement("p", "insight-empty", message));
}

function renderInsightArray(container, items, type) {
  container.replaceChildren();
  if (!Array.isArray(items) || items.length === 0) {
    insightMessage(container, type === "opportunity" ? "No opportunity statements were provided." : type === "risk" ? "No risk statements were provided." : "No key findings were provided.");
    return;
  }
  const list = document.createElement("div");
  list.className = "insight-list";
  items.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = `insight-item insight-${type}`;
    article.append(textElement("h4", "insight-item-title", `${type === "finding" ? "Finding" : type === "opportunity" ? "Opportunity" : "Risk"} ${index + 1}`));
    const primaryKey = type === "finding" ? "finding" : type;
    if (item && typeof item === "object") {
      if (item[primaryKey]) article.append(textElement("p", "insight-primary", item[primaryKey]));
      if (item.evidence) article.append(textElement("p", "insight-evidence", `Evidence: ${item.evidence}`));
      if (item.rationale) article.append(textElement("p", "insight-evidence", `Rationale: ${item.rationale}`));
      if (item.confidence) article.append(textElement("p", "insight-meta", `Confidence: ${item.confidence}`));
      if (item.confidence_reason) article.append(textElement("p", "insight-meta", `Confidence basis: ${item.confidence_reason}`));
      if (Array.isArray(item.products) && item.products.length) {
        const products = document.createElement("ul");
        products.className = "insight-products";
        item.products.forEach((product) => products.append(textElement("li", null, product)));
        article.append(textElement("p", "insight-label", "Referenced products"), products);
      }
    } else {
      article.append(textElement("p", "insight-primary", item));
    }
    list.append(article);
  });
  container.append(list);
}

function renderEntitySpotlights(container, spotlights) {
  container.replaceChildren();
  if (!spotlights || typeof spotlights !== "object" || Array.isArray(spotlights) || Object.keys(spotlights).length === 0) {
    insightMessage(container, "No entity spotlights were provided.");
    return;
  }
  const list = document.createElement("div");
  list.className = "insight-list";
  Object.entries(spotlights).forEach(([name, value]) => {
    const article = document.createElement("article");
    article.className = "insight-item insight-spotlight";
    article.append(textElement("h4", "insight-item-title", name.replaceAll("_", " ")));
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.entries(value).forEach(([key, detail]) => article.append(textElement("p", "insight-evidence", `${key.replaceAll("_", " ")}: ${detail}`)));
    } else {
      article.append(textElement("p", "insight-primary", value));
    }
    list.append(article);
  });
  container.append(list);
}

const catalogPageSize = 25;
const catalogSortFields = [["product_name", "Product Name"], ["avg_price", "Average Price"], ["current_price", "Current Price"], ["avg_rating", "Average Rating"], ["stock_qty", "Stock Quantity"], ["observation_count", "Observation Count"], ["days_active", "Days Active"]];

function catalogState(productState) {
  return productState.catalog || { query: "", source: "", priceTier: "", sortKey: "product_name", sortDirection: "asc", page: 1 };
}

function catalogOptions(features, field) {
  return [...new Set(features.map((record) => record[field]).filter((value) => value !== null && value !== undefined && value !== ""))].sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
}

function catalogView(productState) {
  const features = featureRecords(productState.data);
  const controls = catalogState(productState);
  const query = controls.query.trim().toLowerCase();
  const filtered = features.filter((record) => {
    const matchesSearch = !query || [record.product_name, record.brand, record.seller_name].some((value) => String(value ?? "").toLowerCase().includes(query));
    const matchesSource = !controls.source || String(record.source ?? "") === controls.source;
    const matchesTier = !controls.priceTier || String(record.price_tier ?? "") === controls.priceTier;
    return matchesSearch && matchesSource && matchesTier;
  });
  const sorted = filtered.slice().sort((a, b) => {
    const left = a[controls.sortKey];
    const right = b[controls.sortKey];
    const leftNumber = numeric(left);
    const rightNumber = numeric(right);
    if (leftNumber !== null && rightNumber !== null) return (leftNumber - rightNumber) * (controls.sortDirection === "desc" ? -1 : 1);
    if (leftNumber === null && rightNumber !== null) return 1;
    if (leftNumber !== null && rightNumber === null) return -1;
    return String(left ?? "").localeCompare(String(right ?? ""), undefined, { sensitivity: "base" }) * (controls.sortDirection === "desc" ? -1 : 1);
  });
  const totalPages = Math.ceil(sorted.length / catalogPageSize);
  const page = totalPages ? Math.min(Math.max(controls.page, 1), totalPages) : 1;
  return { features, sorted, rows: sorted.slice((page - 1) * catalogPageSize, page * catalogPageSize), totalPages, page, controls };
}

function renderCatalogRows(view) {
  if (!view.sorted.length) return `<div class="catalog-empty" role="status"><strong>No products match the current catalog view.</strong><span>Adjust the search or filters to continue exploring the loaded feature records.</span></div>`;
  return `<div class="catalog-table-wrap"><table class="catalog-table"><caption class="sr-only">Product catalog results</caption><thead><tr><th scope="col">Product</th><th scope="col">Brand</th><th scope="col">Seller</th><th scope="col">Source</th><th scope="col">Average Price</th><th scope="col">Current Price</th><th scope="col">Average Rating</th><th scope="col">Stock</th><th scope="col">Observations</th><th scope="col">Days Active</th></tr></thead><tbody>${view.rows.map((record) => `<tr><td><button class="catalog-product-button" type="button" data-catalog-select="${escapeHtml(record.product_id)}">${escapeHtml(record.product_name || "Unavailable")}</button></td><td>${escapeHtml(record.brand || "Unavailable")}</td><td>${escapeHtml(record.seller_name || "Unavailable")}</td><td>${escapeHtml(record.source || "Unavailable")}</td><td>${displayValue(record.avg_price)}</td><td>${displayValue(record.current_price)}</td><td>${displayValue(record.avg_rating)}</td><td>${displayValue(record.stock_qty)}</td><td>${displayValue(record.observation_count)}</td><td>${displayValue(record.days_active)}</td></tr>`).join("")}</tbody></table></div>`;
}

function renderCatalogPagination(view) {
  if (!view.sorted.length) return `<div class="catalog-pagination" aria-live="polite"><span>0 products</span></div>`;
  return `<div class="catalog-pagination" aria-label="Catalog pagination"><span>Page ${view.page} of ${view.totalPages} · ${view.sorted.length.toLocaleString()} products</span><div><button class="button-secondary" type="button" data-catalog-page="previous" ${view.page <= 1 ? "disabled" : ""}>Previous</button><button class="button-secondary" type="button" data-catalog-page="next" ${view.page >= view.totalPages ? "disabled" : ""}>Next</button></div></div>`;
}

function renderCatalogSection(productState) {
  if (productState.status !== "success") return `<section class="product-section catalog-section" aria-labelledby="catalog-title"><div class="section-heading"><div><span class="card-kicker">Explore and compare</span><h3 id="catalog-title">Product Catalog</h3></div><p>Catalog becomes available after Product feature data loads.</p></div><div class="empty-panel compact" role="status"><strong>${productState.status === "loading" ? "Catalog data is loading." : productState.status === "error" ? "Catalog unavailable." : "Catalog data is not loaded."}</strong><span>No catalog rows are rendered without a valid Product payload.</span></div></section>`;
  const view = catalogView(productState);
  const sourceOptions = catalogOptions(view.features, "source");
  const tierOptions = catalogOptions(view.features, "price_tier");
  const controls = view.controls;
  return `<section class="product-section catalog-section" aria-labelledby="catalog-title"><div class="section-heading"><div><span class="card-kicker">Explore and compare</span><h3 id="catalog-title">Product Catalog</h3></div><p>Search, filter, sort, and inspect 25 products at a time.</p></div><div class="catalog-toolbar"><label class="field-label" for="catalog-search">Search catalog</label><input id="catalog-search" type="search" placeholder="Product name, brand, or seller" value="${escapeHtml(controls.query)}"><label class="field-label" for="catalog-source">Source<select id="catalog-source"><option value="">All sources</option>${sourceOptions.map((value) => `<option value="${escapeHtml(value)}" ${controls.source === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></label><label class="field-label" for="catalog-tier">Price tier<select id="catalog-tier"><option value="">All price tiers</option>${tierOptions.map((value) => `<option value="${escapeHtml(value)}" ${controls.priceTier === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></label><label class="field-label" for="catalog-sort">Sort by<select id="catalog-sort">${catalogSortFields.map(([value, label]) => `<option value="${value}" ${controls.sortKey === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="field-label" for="catalog-direction">Order<select id="catalog-direction"><option value="asc" ${controls.sortDirection === "asc" ? "selected" : ""}>Ascending</option><option value="desc" ${controls.sortDirection === "desc" ? "selected" : ""}>Descending</option></select></label></div><div data-catalog-results>${renderCatalogRows(view)}</div><div data-catalog-pagination>${renderCatalogPagination(view)}</div></section>`;
}

export function updateCatalogView(root, productState, actions) {
  const view = catalogView(productState);
  const results = root.querySelector("[data-catalog-results]");
  const pagination = root.querySelector("[data-catalog-pagination]");
  if (results) results.innerHTML = renderCatalogRows(view);
  if (pagination) pagination.innerHTML = renderCatalogPagination(view);
  if (actions) bindCatalogView(root, actions);
}

export function renderProductInsight(root, productState) {
  const section = root.querySelector("[data-ai-insight]");
  if (!section) return;
  const summary = section.querySelector("[data-insight-summary]");
  const findings = section.querySelector("[data-insight-findings]");
  const opportunities = section.querySelector("[data-insight-opportunities]");
  const risks = section.querySelector("[data-insight-risks]");
  const spotlights = section.querySelector("[data-insight-spotlights]");
  const insight = productState.status === "success" && productState.data?.insight && typeof productState.data.insight === "object" && !Array.isArray(productState.data.insight) ? productState.data.insight : null;
  if (productState.status === "loading") {
    [summary, findings, opportunities, risks, spotlights].forEach((container) => insightMessage(container, "Product intelligence is loading."));
    return;
  }
  if (!insight) {
    [summary, findings, opportunities, risks, spotlights].forEach((container) => insightMessage(container, "This insight section was not provided by the backend."));
    return;
  }
  summary.replaceChildren();
  if (typeof insight.executive_summary === "string" && insight.executive_summary.trim()) summary.append(textElement("p", "insight-summary-text", insight.executive_summary));
  else insightMessage(summary, "No executive summary was provided.");
  renderInsightArray(findings, insight.key_findings, "finding");
  renderInsightArray(opportunities, insight.opportunities, "opportunity");
  renderInsightArray(risks, insight.risks, "risk");
  renderEntitySpotlights(spotlights, insight.entity_spotlights);
}

function renderRanking(data, metric) {
  const features = featureRecords(data);
  const ranked = rankedProducts(features, metric);
  const label = marketMetrics.find(([value]) => value === metric)?.[1] || "Selected metric";
  if (!ranked.length) return `<div class="visual-empty" role="status"><strong>No numeric ${escapeHtml(label)} records are available.</strong><span>The ranking cannot be calculated from the returned data.</span></div>`;
  const maximum = Math.max(...ranked.map(({ value }) => value));
  return `<div class="ranking-list" aria-label="Top products by ${escapeHtml(label)}">${ranked.map(({ record, value }, index) => {
    const width = maximum > 0 ? Math.max(3, (value / maximum) * 100) : 3;
    return `<div class="ranking-item"><div class="ranking-label"><span class="ranking-number">${index + 1}</span><span class="ranking-name" title="${escapeHtml(record.product_name)}">${escapeHtml(record.product_name)}</span><strong>${displayValue(value)}</strong></div><div class="ranking-track" aria-hidden="true"><span class="ranking-fill" style="width:${width}%"></span></div></div>`;
  }).join("")}</div>`;
}

function searchResults(features, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return features.filter((record) => [record.product_name, record.brand, record.seller_name].some((value) => String(value ?? "").toLowerCase().includes(normalized))).slice(0, 8);
}

function renderSearchResults(features, query) {
  if (!query.trim()) return `<p class="empty-copy">Start typing to discover products by name, brand, or seller.</p>`;
  const results = searchResults(features, query);
  if (!results.length) return `<p class="empty-copy">No products match this search.</p>`;
  return `<div class="search-results" role="listbox" aria-label="Product search results">${results.map((record) => `<button class="search-result" type="button" role="option" data-product-select="${escapeHtml(record.product_id)}"><strong>${escapeHtml(record.product_name)}</strong><span>${escapeHtml(record.brand || "Unknown brand")} · ${escapeHtml(record.seller_name || "Unknown seller")}</span></button>`).join("")}</div>`;
}

function renderProfile(record) {
  if (!record) return `<div class="empty-panel" role="status"><strong>No product selected.</strong><span>Select a product through discovery to view identity, source, activity, and observation context.</span></div>`;
  const details = [["Product name", record.product_name], ["Brand", record.brand], ["Seller", record.seller_name], ["Source", record.source], ["Price tier", record.price_tier], ["First seen", displayDate(record.first_seen)], ["Last seen", displayDate(record.last_seen)], ["Days active", displayValue(record.days_active)], ["Observations", displayValue(record.observation_count)]];
  return `<div class="profile-grid">${details.map(([label, value]) => `<div class="profile-item"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>`;
}

function renderSignals(record) {
  if (!record) return `<div class="empty-panel compact" role="status"><strong>No product selected.</strong><span>Current feature signals will appear after a product is selected.</span></div>`;
  const signals = [["Average price", displayValue(record.avg_price)], ["Current price", displayValue(record.current_price)], ["Average rating", displayValue(record.avg_rating)], ["Current rating", displayValue(record.current_rating)], ["Total rating count", displayValue(record.total_rating_count)], ["Stock quantity", displayValue(record.stock_qty)], ["Days active", displayValue(record.days_active)], ["Observation count", displayValue(record.observation_count)], ["Price tier", escapeHtml(record.price_tier || "Unavailable")]];
  return `<div class="signal-grid">${signals.map(([label, value]) => `<div class="signal-item"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div><p class="data-note">Measured / deterministic values from the selected Product feature record.</p>`;
}

function statusMessage(product) {
  if (product.status === "loading") return `<div class="product-notice loading-notice" role="status"><span class="state-dot" aria-hidden="true"></span>Requesting Product Intelligence data from the configured FastAPI service…</div>`;
  if (product.status === "error") return `<div class="product-notice error-notice" role="alert"><strong>Unable to load Product Intelligence.</strong><span>${escapeHtml(product.error || "The Product request failed.")}</span><button class="button-secondary" type="button" data-product-action="retry">Retry</button></div>`;
  return "";
}

function renderProductFoundation(state) {
  const product = state.product;
  const data = product.data;
  const orientation = deriveOrientation(data);
  const selected = featureRecords(data).find((record) => String(record.product_id) === String(product.selectedProductId));
  const loaded = product.status === "success";
  const marketMetric = product.marketMetric || "avg_price";
  const orientationValues = loaded ? [["Unique products", displayValue(orientation.products)], ["Observation coverage", displayValue(orientation.observations) + " observations"], ["Date coverage", orientation.earliest && orientation.latest ? `${displayDate(orientation.earliest)} – ${displayDate(orientation.latest)}` : "Unavailable"], ["Available source", orientation.sources.length ? orientation.sources.map(escapeHtml).join(", ") : "Unavailable"]] : [["Unique products", "Loading"], ["Observation coverage", "Loading"], ["Date coverage", "Loading"], ["Available source", "Loading"]];
  return `<section class="content product-content" aria-labelledby="product-page-title">
    <div class="content-header product-header"><div><div class="module-kicker">Intelligence module</div><h2 id="product-page-title">Product Intelligence</h2><p class="content-intro">Understand the product landscape, compare observed signals, discover and investigate products, then review their measured evidence.</p></div><span class="module-state state-${product.status}"><span class="state-dot" aria-hidden="true"></span>${product.status === "idle" ? "Not loaded" : product.status === "loading" ? "Loading data" : product.status === "success" ? "Data loaded" : "Load failed"}</span></div>
    ${statusMessage(product)}
    <section class="product-section orientation-section" aria-labelledby="orientation-title"><div class="section-heading"><div><span class="card-kicker">Dataset orientation</span><h3 id="orientation-title">Know the landscape before investigating a product</h3></div><p>These values are derived from the returned feature and timeseries records.</p></div><div class="orientation-grid">${orientationValues.map(([label, value]) => `<div class="orientation-item"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div></section>
    <section class="product-section" aria-labelledby="market-title"><div class="section-heading"><div><span class="card-kicker">Market-level intelligence</span><h3 id="market-title">Market Landscape</h3></div><p>Which products stand out according to the selected feature metric?</p></div><div class="visual-card"><div class="visual-toolbar"><label for="market-metric">Rank by<select id="market-metric" data-product-control="market-metric">${metricOptions(marketMetrics)}</select></label></div>${loaded ? renderRanking(data, marketMetric) : `<div class="visual-empty" role="status"><strong>${product.status === "error" ? "Ranking unavailable." : "Product intelligence data is not loaded."}</strong><span>${product.status === "loading" ? "Real feature records are being requested." : "No ranking is calculated until real feature records are available."}</span></div>`}</div></section>
    <section class="product-section discovery-section" aria-labelledby="discovery-title"><div class="section-heading"><div><span class="card-kicker">Discover</span><h3 id="discovery-title">Product Discovery</h3></div><p>Search by product name, brand, or seller without needing an internal identifier.</p></div><div class="discovery-panel"><label class="field-label" for="product-search">Search products</label><div class="search-row"><input id="product-search" type="search" placeholder="Product name, brand, or seller" value="${escapeHtml(product.searchQuery)}" ${loaded ? "" : "disabled"} /><span class="search-count">${loaded ? "Results limited to 8" : "Unavailable"}</span></div><div data-product-results>${loaded ? renderSearchResults(featureRecords(data), product.searchQuery) : `<p class="empty-copy">${product.status === "loading" ? "Product records are being requested." : "Product intelligence data has not been loaded. No products are available to search."}</p>`}</div></div></section>
    <section class="product-section profile-section" aria-labelledby="profile-title"><div class="section-heading"><div><span class="card-kicker">Investigate</span><h3 id="profile-title">Selected Product Profile</h3></div><p>Context for the product currently under investigation.</p></div>${loaded ? renderProfile(selected) : `<div class="empty-panel" role="status"><strong>No product selected.</strong><span>Product profile is unavailable until Product data is loaded.</span></div>`}</section>
    <div class="product-detail-grid"><section class="product-section" aria-labelledby="signals-title"><div class="section-heading"><div><span class="card-kicker">Measured evidence</span><h3 id="signals-title">Current Feature Signals</h3></div></div>${loaded ? renderSignals(selected) : `<div class="empty-panel compact" role="status"><strong>Feature signals unavailable.</strong><span>Measured values will appear after Product data is loaded and a product is selected.</span></div>`}</section>
      <section class="product-section" aria-labelledby="interpretation-title"><div class="section-heading"><div><span class="card-kicker">Traceable evidence</span><h3 id="interpretation-title">Deterministic Interpretation</h3></div></div><div class="empty-panel compact" role="status"><strong>Deferred to the interpretation phase.</strong><span>No conclusions are generated in this data integration phase.</span></div></section></div>
    <section class="product-section" aria-labelledby="trends-title"><div class="section-heading"><div><span class="card-kicker">Historical evidence</span><h3 id="trends-title">Historical Product Trends</h3></div><p>Historical visualization is deferred to the next implementation phase.</p></div><div class="visual-card"><div class="visual-toolbar"><label for="trend-metric">Measure<select id="trend-metric" disabled>${metricOptions(deferredTrendMetrics)}</select></label></div><div class="visual-empty" role="status"><span class="visual-mark" aria-hidden="true">◌</span><strong>Historical rendering deferred.</strong><span>Timeseries records are loaded into the shared payload but are not rendered in this phase.</span></div></div></section>
    <section class="product-section ai-section" aria-labelledby="ai-title"><div class="section-heading"><div><span class="card-kicker ai-kicker">AI-generated interpretation</span><h3 id="ai-title">AI Executive Insight</h3></div><p>AI interpretation remains distinct from measured Product data.</p></div><div class="ai-empty" role="status"><strong>AI insight rendering deferred.</strong><span>The documented insight payload is stored with the Product response and will be presented in the next phase.</span></div></section>
    ${renderCatalogSection(product)}
  </section>`;
}

export function renderProductIntegrated(state) {
  const product = state.product;
  const data = product.data;
  const orientation = deriveOrientation(data);
  const selected = featureRecords(data).find((record) => String(record.product_id) === String(product.selectedProductId));
  const records = historicalRecords(data, product.selectedProductId);
  const loaded = product.status === "success";
  const marketMetric = product.marketMetric || "avg_price";
  const trendMetric = product.trendMetric || "avg_price";
  const orientationValues = loaded ? [["Unique products", displayValue(orientation.products)], ["Feature observations", `${displayValue(orientation.observations)} observations`], ["Date coverage", orientation.earliest && orientation.latest ? `${displayDate(orientation.earliest)} – ${displayDate(orientation.latest)}` : "Unavailable"], ["Available source", orientation.sources.length ? orientation.sources.map(escapeHtml).join(", ") : "Unavailable"]] : [["Unique products", "Loading"], ["Feature observations", "Loading"], ["Date coverage", "Loading"], ["Available source", "Loading"]];
  const historyContent = !loaded || !selected ? `<div class="visual-empty" role="status"><strong>${selected ? "Historical data is not loaded." : "No product selected."}</strong><span>${selected ? "Historical records will appear after Product data is available." : "Select a product to inspect its historical evidence."}</span></div>` : renderHistoricalChart(records, trendMetric);
  const interpretation = loaded ? renderDeterministicInterpretation(selected, records) : `<div class="empty-panel compact" role="status"><strong>Interpretation unavailable.</strong><span>Measured data must be loaded before deterministic observations can be derived.</span></div>`;
  return `<section class="content product-content" aria-labelledby="product-page-title">
    <div class="content-header product-header"><div><div class="module-kicker">Intelligence module</div><h2 id="product-page-title">Product Intelligence</h2><p class="content-intro">Understand the product landscape, compare observed signals, discover and investigate products, then review their measured evidence.</p></div><span class="module-state state-${product.status}"><span class="state-dot" aria-hidden="true"></span>${product.status === "idle" ? "Not loaded" : product.status === "loading" ? "Loading data" : product.status === "success" ? "Data loaded" : "Load failed"}</span></div>
    ${statusMessage(product)}
    <section class="product-section orientation-section" aria-labelledby="orientation-title"><div class="section-heading"><div><span class="card-kicker">Dataset orientation</span><h3 id="orientation-title">Know the landscape before investigating a product</h3></div><p>Feature observations are summed from the returned product records; dates and sources come from the returned timeseries and feature records.</p></div><div class="orientation-grid">${orientationValues.map(([label, value]) => `<div class="orientation-item"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div></section>
    <section class="product-section" aria-labelledby="market-title"><div class="section-heading"><div><span class="card-kicker">Market-level intelligence</span><h3 id="market-title">Market Landscape</h3></div><p>Which products stand out according to the selected feature metric?</p></div><div class="visual-card"><div class="visual-toolbar"><label for="market-metric">Rank by<select id="market-metric" data-product-control="market-metric">${metricOptions(marketMetrics)}</select></label></div>${loaded ? renderRanking(data, marketMetric) : `<div class="visual-empty" role="status"><strong>${product.status === "error" ? "Ranking unavailable." : "Product intelligence data is not loaded."}</strong><span>${product.status === "loading" ? "Real feature records are being requested." : "No ranking is calculated until real feature records are available."}</span></div>`}</div></section>
    <section class="product-section discovery-section" aria-labelledby="discovery-title"><div class="section-heading"><div><span class="card-kicker">Discover</span><h3 id="discovery-title">Product Discovery</h3></div><p>Search by product name, brand, or seller without needing an internal identifier.</p></div><div class="discovery-panel"><label class="field-label" for="product-search">Search products</label><div class="search-row"><input id="product-search" type="search" placeholder="Product name, brand, or seller" value="${escapeHtml(product.searchQuery)}" ${loaded ? "" : "disabled"} /><span class="search-count">${loaded ? "Results limited to 8" : "Unavailable"}</span></div><div data-product-results>${loaded ? renderSearchResults(featureRecords(data), product.searchQuery) : `<p class="empty-copy">${product.status === "loading" ? "Product records are being requested." : "Product intelligence data has not been loaded. No products are available to search."}</p>`}</div></div></section>
    <section class="product-section profile-section" aria-labelledby="profile-title"><div class="section-heading"><div><span class="card-kicker">Investigate</span><h3 id="profile-title">Selected Product Profile</h3></div><p>Context for the product currently under investigation.</p></div>${loaded ? renderProfile(selected) : `<div class="empty-panel" role="status"><strong>No product selected.</strong><span>Product profile is unavailable until Product data is loaded.</span></div>`}</section>
    <div class="product-detail-grid"><section class="product-section" aria-labelledby="signals-title"><div class="section-heading"><div><span class="card-kicker">Measured evidence</span><h3 id="signals-title">Current Feature Signals</h3></div></div>${loaded ? renderSignals(selected) : `<div class="empty-panel compact" role="status"><strong>Feature signals unavailable.</strong><span>Measured values will appear after Product data is loaded and a product is selected.</span></div>`}</section><section class="product-section" aria-labelledby="interpretation-title"><div class="section-heading"><div><span class="card-kicker">Traceable evidence</span><h3 id="interpretation-title">Deterministic Interpretation</h3></div></div>${interpretation}</section></div>
    <section class="product-section" aria-labelledby="trends-title"><div class="section-heading"><div><span class="card-kicker">Historical evidence</span><h3 id="trends-title">Historical Product Trends</h3></div><p>Matching records are filtered by product ID and sorted chronologically before rendering.</p></div><div class="visual-card"><div class="visual-toolbar"><label for="trend-metric">Measure<select id="trend-metric" data-product-control="trend-metric" ${loaded && selected ? "" : "disabled"}>${metricOptions(trendMetrics)}</select></label></div>${historyContent}</div></section>
    <section class="product-section ai-section" aria-labelledby="ai-title"><div class="section-heading"><div><span class="card-kicker ai-kicker">AI-generated interpretation</span><h3 id="ai-title">AI Executive Insight</h3></div><p>Backend-generated interpretation remains distinct from measured Product data.</p></div><div class="ai-insight-body" data-ai-insight><div class="insight-block"><span class="card-kicker">Executive summary</span><div data-insight-summary></div></div><div class="insight-block"><span class="card-kicker">Key findings</span><div data-insight-findings></div></div><div class="insight-block"><span class="card-kicker">Opportunities</span><div data-insight-opportunities></div></div><div class="insight-block"><span class="card-kicker">Risks</span><div data-insight-risks></div></div><div class="insight-block"><span class="card-kicker">Entity spotlights</span><div data-insight-spotlights></div></div></div></section>
    ${renderCatalogSection(product)}
  </section>`;
}

export function updateProductSearchResults(root, state, onSelectProduct) {
  const results = root.querySelector("[data-product-results]");
  if (!results) return;
  results.innerHTML = renderSearchResults(featureRecords(state.product.data), state.product.searchQuery);
  bindSearchResults(results, onSelectProduct);
}

function bindSearchResults(root, onSelectProduct) {
  if (!root) return;
  root.querySelectorAll("[data-product-select]").forEach((button) => button.addEventListener("click", () => onSelectProduct(button.dataset.productSelect)));
}

function bindCatalogView(root, actions) {
  root.querySelectorAll("[data-catalog-select]").forEach((button) => button.addEventListener("click", () => actions.onSelectProduct(button.dataset.catalogSelect)));
  root.querySelectorAll("[data-catalog-page]").forEach((button) => button.addEventListener("click", () => actions.onPage(button.dataset.catalogPage)));
}

export function bindCatalogControls(root, actions) {
  root.querySelector("#catalog-search")?.addEventListener("input", (event) => actions.onSearch(event.target.value));
  root.querySelector("#catalog-source")?.addEventListener("change", (event) => actions.onSource(event.target.value));
  root.querySelector("#catalog-tier")?.addEventListener("change", (event) => actions.onPriceTier(event.target.value));
  root.querySelector("#catalog-sort")?.addEventListener("change", (event) => actions.onSortKey(event.target.value));
  root.querySelector("#catalog-direction")?.addEventListener("change", (event) => actions.onSortDirection(event.target.value));
  bindCatalogView(root, actions);
}

export function bindProductControls(root, actions) {
  root.querySelector("[data-product-action=retry]")?.addEventListener("click", actions.onRetry);
  root.querySelector("[data-product-control=market-metric]")?.addEventListener("change", (event) => actions.onMarketMetricChange(event.target.value));
  root.querySelector("[data-product-control=trend-metric]")?.addEventListener("change", (event) => actions.onTrendMetricChange(event.target.value));
  root.querySelector("#product-search")?.addEventListener("input", (event) => actions.onSearch(event.target.value));
  bindSearchResults(root.querySelector("[data-product-results]"), actions.onSelectProduct);
}
