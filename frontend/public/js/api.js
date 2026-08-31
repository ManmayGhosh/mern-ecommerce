// Small fetch wrapper for talking to the backend API.
// Requests are made to /api/... which nginx proxies to the backend container.

const API_BASE = window.__API_BASE__ || "/api";

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function isLoggedIn() {
  return !!getToken();
}

async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no JSON body
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

const api = {
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id) => apiRequest(`/products/${id}`),
  getCategories: () => apiRequest(`/products/categories`),
  register: (payload) => apiRequest(`/auth/register`, { method: "POST", body: payload }),
  login: (payload) => apiRequest(`/auth/login`, { method: "POST", body: payload }),
  checkout: (payload) =>
    apiRequest(`/orders/checkout`, { method: "POST", body: payload, auth: true }),
  getOrders: () => apiRequest(`/orders`, { auth: true }),
};
