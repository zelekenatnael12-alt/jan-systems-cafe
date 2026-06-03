// apps/client/src/lib/venueResolver.js
// Centralised venue + auth resolution for the entire frontend.
// All components should use these helpers instead of raw localStorage access.

/**
 * Get auth headers for API calls.
 * Returns an object with Authorization header if user is logged in.
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('jan_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Get the current venue slug from URL path or localStorage.
 * URL patterns supported:
 *   /venue/buna-and-co  → 'buna-and-co'
 *   ?venue=buna-and-co  → 'buna-and-co'
 *   (fallback)          → localStorage 'jan_venue_slug' or null
 */
export function getVenueSlug() {
  // 1. Check URL path: /venue/:slug
  const pathMatch = window.location.pathname.match(/^\/venue\/([a-z0-9-]+)/i);
  if (pathMatch) return pathMatch[1];

  // 2. Check query param: ?venue=slug
  const params = new URLSearchParams(window.location.search);
  const querySlug = params.get('venue');
  if (querySlug) return querySlug;

  // 3. Fallback to localStorage (set after login)
  return localStorage.getItem('jan_venue_slug') || null;
}

/**
 * Get the current user from localStorage.
 */
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('jan_user') || 'null');
  } catch {
    return null;
  }
}

/**
 * Get venueId from the JWT token payload.
 */
export function getVenueIdFromToken() {
  const token = localStorage.getItem('jan_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.venueId || null;
  } catch {
    return null;
  }
}

/**
 * Store login credentials after successful auth.
 */
export function storeLogin(data) {
  localStorage.setItem('jan_token', data.token);
  localStorage.setItem('jan_refresh_token', data.refreshToken);
  localStorage.setItem('jan_user', JSON.stringify(data.user));
  if (data.venue?.slug) {
    localStorage.setItem('jan_venue_slug', data.venue.slug);
  }
}

/**
 * Clear all auth data (logout).
 */
export function clearLogin() {
  localStorage.removeItem('jan_token');
  localStorage.removeItem('jan_refresh_token');
  localStorage.removeItem('jan_user');
  localStorage.removeItem('jan_venue_slug');
}

/**
 * Resolve venue identification for API calls.
 * Returns { venueId, venueSlug, headers } — use whichever the API needs.
 */
export function resolveVenue() {
  const headers = getAuthHeaders();
  const venueId = getVenueIdFromToken();
  const venueSlug = getVenueSlug();
  return { venueId, venueSlug, headers };
}
