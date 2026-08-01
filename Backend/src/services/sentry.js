/**
 * Sentry error monitoring service.
 * Gracefully handles missing '@sentry/node' package (development/testing).
 */
let Sentry = null;
let ProfilingIntegration = null;

try {
  Sentry = require('@sentry/node');
  try {
    ProfilingIntegration = require('@sentry/profiling-node').ProfilingIntegration;
  } catch (e) {
    // Profiling is optional
  }
} catch (e) {
  console.warn('@sentry/node not installed - error monitoring disabled (development mode)');
}

let initialized = false;

// Initialize Sentry
function initSentry() {
  if (!Sentry) {
    console.log('Sentry package not available - skipping initialization');
    return null;
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) {
    console.log('Sentry not initialized (not in production or missing DSN)');
    return null;
  }

  const integrations = [];
  if (ProfilingIntegration) {
    integrations.push(new ProfilingIntegration());
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.GIT_COMMIT || '1.0.0',

    // Performance monitoring
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1,
    profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE || 0.1,

    // Integrations
    integrations,

    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove sensitive request body data
      if (event.request?.data) {
        const sensitiveFields = ['password', 'password_confirmation', 'credit_card', 'ssn'];
        sensitiveFields.forEach((field) => {
          if (event.request.data[field]) {
            event.request.data[field] = '[REDACTED]';
          }
        });
      }

      return event;
    },

    // Ignore common errors
    ignoreErrors: [
      'NetworkError',
      'Network request failed',
      'Request failed with status code 404',
      'Request failed with status code 401',
    ],
  });

  initialized = true;
  console.log('Sentry initialized');
  return Sentry;
}

// Get Sentry instance
function getSentry() {
  return Sentry;
}

// Capture exception with context
function captureException(error, context = {}) {
  if (!Sentry || !initialized) return;

  Sentry.withScope((scope) => {
    // Add context
    Object.entries(context).forEach(([key, value]) => {
      scope.setContext(key, value);
    });

    // Add user context if available
    if (context.user) {
      scope.setUser(context.user);
    }

    Sentry.captureException(error);
  });
}

// Capture message
function captureMessage(message, level = 'info', context = {}) {
  if (!Sentry || !initialized) return;

  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setContext(key, value);
    });

    Sentry.captureMessage(message, level);
  });
}

// Set user context
function setUser(user) {
  if (!Sentry || !initialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

// Clear user context
function clearUser() {
  if (!Sentry || !initialized) return;

  Sentry.setUser(null);
}

// Add breadcrumb
function addBreadcrumb(breadcrumb) {
  if (!Sentry || !initialized) return;

  Sentry.addBreadcrumb({
    ...breadcrumb,
    timestamp: Date.now() / 1000,
  });
}

// Start transaction for performance monitoring
function startTransaction(name, op) {
  if (!Sentry || !initialized) return null;

  return Sentry.startTransaction({
    name,
    op,
  });
}

// Flush pending events
async function flush(timeout = 2000) {
  if (!Sentry || !initialized) return true;

  return await Sentry.close(timeout);
}

module.exports = {
  initSentry,
  getSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
  flush,
};