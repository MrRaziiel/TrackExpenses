const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Register a new user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<void>}
 * @throws {Error} if registration fails
 */
export async function signin(email, password) {
  const res = await fetch(`${API_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Registration failed');
  }
}

/**
 * Log in a user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} the authenticated user data
 * @throws {Error} if login fails
 */
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include', // send HttpOnly cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Login failed');
  }

  return res.json();
}

/**
 * Refresh the current session, obtaining a fresh user object if authenticated.
 * @returns {Promise<Object>} the refreshed user data
 * @throws {Error} if session is invalid or expired
 */
export async function refresh() {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Session refresh failed');
  }

  return res.json();
}

/**
 * Log out the current user, clearing authentication cookies.
 * @returns {Promise<void>}
 * @throws {Error} if logout fails
 */
export async function logout() {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Logout failed');
  }
}
