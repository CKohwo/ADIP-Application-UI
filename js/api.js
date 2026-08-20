import { CONFIG } from "./config.js";

async function request(path, options = {}) {
  const response = await fetch(`${CONFIG.API_BASE}${path}`, {
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    throw new Error(`ADIP API request failed (${response.status})`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("ADIP API returned invalid JSON");
  }
}

export const api = Object.freeze({
  getHealth: () => request("/health"),
  runApplication: () => request("/run-application", { method: "POST" }),
  getProduct: () => request("/dashboard/product"),
  getBrand: (source) => request(`/dashboard/brand?source=${encodeURIComponent(source)}`),
  getSeller: () => request("/dashboard/seller"),
  getCategory: () => request("/dashboard/category")
});
