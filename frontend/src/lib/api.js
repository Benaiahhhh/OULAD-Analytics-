/**
 * API client — handles auth tokens, request/response interceptors, and base URL.
 */

const BASE_URL = '/api/v1';

let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');
let onAuthError = null; // set by useAuth to trigger logout

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getAccessToken() {
  return accessToken;
}

export function setAuthErrorHandler(handler) {
  onAuthError = handler;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData (login uses OAuth2 form)
  if (!(options.body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  // Try token refresh on 401
  if (response.status === 401 && refreshToken && !endpoint.includes('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      onAuthError?.();
      throw new ApiError('Session expired', 401);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.detail || response.statusText, response.status, body);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh?refresh_token=${refreshToken}`, {
      method: 'POST',
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: new URLSearchParams({ username: email, password }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),

  register: (email, fullName, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, full_name: fullName, password }),
    }),

  me: () => request('/auth/me'),
};

// ── Students ────────────────────────────────────────────────────────────────
export const students = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, v);
    });
    return request(`/students?${query}`);
  },

  get: (studentId) => request(`/students/${studentId}`),

  create: (data) =>
    request('/students', { method: 'POST', body: JSON.stringify(data) }),

  filterOptions: () => request('/students/filters/options'),
};

// ── Predictions ─────────────────────────────────────────────────────────────
export const predictions = {
  single: (studentId, moduleCode, presentation) =>
    request('/predict/single', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        module_code: moduleCode,
        presentation,
      }),
    }),

  batch: (studentList) =>
    request('/predict/batch', {
      method: 'POST',
      body: JSON.stringify({ students: studentList }),
    }),

  history: (studentId) => request(`/predict/history/${studentId}`),
};

// ── Dashboard ───────────────────────────────────────────────────────────────
export const dashboard = {
  summary: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.set(k, v);
    });
    return request(`/dashboard/summary?${query}`);
  },
};

export { ApiError };
