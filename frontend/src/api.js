const BASE_URL = "http://localhost:8000";

/**
 * Wraps fetch, adds Content-Type and Authorization headers,
 * returns parsed JSON, and throws an Error with the detail message on non-2xx.
 *
 * @param {string} path - API path, e.g. "/auth/login"
 * @param {RequestInit} options - standard fetch options
 * @returns {Promise<any>} - parsed JSON response
 */
export async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Try to parse JSON regardless of status
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.detail ?? `HTTP error ${response.status}`;
    throw new Error(message);
  }

  return data;
}
