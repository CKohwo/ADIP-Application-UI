const routes = new Set(["home", "product", "brand", "seller", "category", "system"]);

export function routeFromLocation() {
  const route = window.location.hash.replace(/^#\/?/, "") || "home";
  return routes.has(route) ? route : "home";
}

export function navigate(route) {
  if (routes.has(route)) window.location.hash = `/${route}`;
}

export function startRouter(onRouteChange) {
  const handleRouteChange = () => onRouteChange(routeFromLocation());
  window.addEventListener("hashchange", handleRouteChange);
  handleRouteChange();
  return () => window.removeEventListener("hashchange", handleRouteChange);
}
