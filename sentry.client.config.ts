import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV,
  enableLogs: true,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  beforeSend(event) {
    // Não enviar erros em desenvolvimento sem DSN
    if (
      !process.env.NEXT_PUBLIC_SENTRY_DSN &&
      process.env.NODE_ENV !== 'production'
    ) {
      return null;
    }
    return event;
  },
});
