import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV,
  enableLogs: true,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  beforeSend(event) {
    if (
      !process.env.NEXT_PUBLIC_SENTRY_DSN &&
      process.env.NODE_ENV !== 'production'
    ) {
      return null;
    }
    return event;
  },
});
