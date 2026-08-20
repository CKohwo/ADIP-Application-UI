const moduleContent = {
  home: { kicker: "Mission control", title: "Home", intro: "A clear operating view for ADIP system state, validation, and intelligence modules.", cards: ["System state", "Pipeline operations", "Explore intelligence"] },
  product: { kicker: "Intelligence module", title: "Product Intelligence", intro: "Discover products, understand their evidence, and investigate market context.", cards: ["Product discovery", "Feature evidence", "Historical and AI insight"] },
  brand: { kicker: "Intelligence module", title: "Brand Intelligence", intro: "Brand-level intelligence will make market signals easier to understand and compare.", cards: ["Brand discovery", "Market signals", "AI interpretation"] },
  seller: { kicker: "Intelligence module", title: "Seller Intelligence", intro: "Seller-level signals and comparisons will be organized here.", cards: ["Seller discovery", "Performance signals", "AI interpretation"] },
  category: { kicker: "Intelligence module", title: "Category Intelligence", intro: "Category-level market signals and trends will be organized here.", cards: ["Category discovery", "Market signals", "AI interpretation"] },
  system: { kicker: "Operations", title: "System Operations", intro: "Verified system health and backend-supported operations will appear here.", cards: ["Service health", "Artifact availability", "Pipeline controls"] }
};

export function renderPlaceholder(route) {
  const content = moduleContent[route] || moduleContent.home;
  return `<section class="content" aria-labelledby="page-title">
    <div class="content-header">
      <div><div class="module-kicker">${content.kicker}</div><h2 id="page-title">${content.title}</h2><p class="content-intro">${content.intro}</p></div>
    </div>
    <div class="placeholder-grid">
      ${content.cards.map((card) => `<article class="placeholder-card"><h3>${card}</h3><p>This foundation view is ready for its verified backend data experience.</p><span class="placeholder-tag">Module foundation</span></article>`).join("")}
    </div>
  </section>`;
}
