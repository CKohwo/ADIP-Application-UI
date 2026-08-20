const sourceDefinitions = [
  { label: "Product Intelligence", sources: ["api_product"], route: "product" },
  { label: "Brand Intelligence", sources: ["api_brand", "scraper_brand"], route: "brand" },
  { label: "Seller Intelligence", sources: ["api_seller"], route: "seller" },
  { label: "Category Intelligence", sources: ["scraper_category"], route: "category" }
];

function sourceState(source) {
  if (!source) return "not-reported";
  const flags = [source.features, source.timeseries, source.llm_insight];
  if (flags.every((flag) => flag === true)) return "available";
  if (flags.some((flag) => flag === true)) return "partial";
  return "unavailable";
}

function moduleAvailability(health, sources) {
  if (health.status !== "success" || !health.data?.sources) return "unknown";
  const states = sources.map((key) => sourceState(health.data.sources[key]));
  if (states.includes("available")) return "available";
  if (states.includes("partial")) return "partial";
  if (states.every((state) => state === "unavailable")) return "unavailable";
  return "not-reported";
}

const availabilityLabels = {
  available: "Available", partial: "Partial availability", unavailable: "Unavailable",
  "not-reported": "Not reported", unknown: "Check system first"
};

export function renderHome(state) {
  const health = state.health;
  const pipeline = state.pipeline;
  const healthLabels = { unchecked: "Status not checked", checking: "Checking service", success: "Service responded", error: "Check failed" };
  const pipelineLabels = { ready: "Ready", starting: "Starting", accepted: "Accepted", error: "Request failed" };
  const healthCopy = {
    unchecked: "No request has been made. Check the service when you are ready to validate its current state.",
    checking: "Requesting the documented health endpoint now.",
    success: "The service responded. Artifact availability is reported below from the health response.",
    error: "The health check could not be completed. The service state is not known."
  }[health.status];
  const pipelineCopy = pipeline.status === "accepted"
    ? "The backend accepted the run and reported that it is running in the background. Completion is not exposed by this contract."
    : "Explicitly start the backend intelligence pipeline. This action confirms only when the run has been accepted.";

  return `<section class="content home-content" aria-labelledby="page-title">
    <div class="content-header mission-header"><div><div class="module-kicker">Mission Control</div><h2 id="page-title">Home</h2><p class="content-intro">An operational view of ADIP system state, intelligence availability, and the backend actions you choose to initiate.</p></div></div>
    <div class="home-grid">
      <article class="operation-card" aria-labelledby="system-state-title"><div class="card-heading"><div><span class="card-kicker">System state</span><h3 id="system-state-title">Service health</h3></div><span class="state-chip state-${health.status}" role="status"><span class="state-dot" aria-hidden="true"></span>${healthLabels[health.status]}</span></div><p class="card-copy">${healthCopy}</p>${health.status === "error" ? `<p class="inline-error" role="alert">${health.error}</p>` : ""}<button class="button-secondary" type="button" data-home-action="check-system" ${health.status === "checking" ? "disabled" : ""}>${health.status === "checking" ? "Checking system…" : "Check System"}</button>${health.status === "success" ? `<div class="health-summary"><span>Reported artifact availability</span><strong>Health response received</strong></div>` : ""}</article>
      <article class="operation-card" aria-labelledby="pipeline-title"><div class="card-heading"><div><span class="card-kicker">Pipeline operations</span><h3 id="pipeline-title">Run intelligence pipeline</h3></div><span class="state-chip state-${pipeline.status}" role="status"><span class="state-dot" aria-hidden="true"></span>${pipelineLabels[pipeline.status]}</span></div><p class="card-copy">${pipelineCopy}</p>${pipeline.status === "accepted" ? `<p class="success-note" role="status">Run accepted and scheduled in the background.</p>` : ""}${pipeline.status === "error" ? `<p class="inline-error" role="alert">${pipeline.error}</p>` : ""}<button class="button-secondary" type="button" data-home-action="run-pipeline" ${pipeline.status === "starting" ? "disabled" : ""}>${pipeline.status === "starting" ? "Requesting run…" : "Run Pipeline"}</button></article>
    </div>
    <section class="explore-section" aria-labelledby="explore-title"><div class="section-heading"><div><span class="card-kicker">Intelligence availability</span><h3 id="explore-title">Explore Intelligence</h3></div><p>Choose a domain to continue into its intelligence workspace.</p></div><div class="explore-grid">${sourceDefinitions.map(({ label, sources, route }) => { const status = moduleAvailability(health, sources); return `<a class="explore-card" href="#/${route}"><span class="explore-icon" aria-hidden="true">↗</span><span><strong>${label}</strong><small>${availabilityLabels[status]}</small></span><span class="explore-arrow" aria-hidden="true">→</span></a>`; }).join("")}</div></section>
  </section>`;
}

export function bindHomeActions(root, actions) {
  root.querySelector("[data-home-action=check-system]")?.addEventListener("click", actions.onCheckSystem);
  root.querySelector("[data-home-action=run-pipeline]")?.addEventListener("click", actions.onRunPipeline);
}
