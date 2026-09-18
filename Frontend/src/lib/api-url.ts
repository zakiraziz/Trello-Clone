/**
 * Single source of truth for the backend URLs used by the SPA.
 *
 * Blueprint deployments (render.yaml) can only inject the raw service URL, so
 * `VITE_API_URL` may arrive either with or without the trailing `/api`
 * segment. It is normalised here instead of at every call site.
 */
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '')

export const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`

/** Socket.IO connects to the server root, not to the REST `/api` prefix. */
export const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '')
).replace(/\/+$/, '')
