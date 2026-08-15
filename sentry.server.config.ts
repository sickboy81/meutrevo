import * as Sentry from '@sentry/nextjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV,
  enableLogs: true,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profileSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  profileLifecycle: 'trace',
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    nodeProfilingIntegration(),
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
