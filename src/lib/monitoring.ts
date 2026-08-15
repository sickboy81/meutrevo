import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

const SAFE_CONTEXT_KEYS = new Set([
  'provider',
  'operation',
  'lottery',
  'statusCode',
  'eventType',
  'contest',
  'environment',
]);

type MonitoringValue = string | number | boolean;

export function getMonitoringContext(
  context: Record<string, unknown>
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(context).filter(
      ([key, value]) =>
        SAFE_CONTEXT_KEYS.has(key) &&
        (typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean')
    )
  ) as Record<string, string | number | boolean>;
}

export function reportServerDuration(
  operation: string,
  durationMs: number,
  context: Record<string, unknown> = {}
): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  const safeContext = getMonitoringContext({ ...context, operation });
  Sentry.metrics.distribution('meutrevo.operation.duration', durationMs, {
    unit: 'millisecond',
    attributes: safeContext as Record<string, MonitoringValue>,
  });
}

export function reportServerError(
  error: unknown,
  context: Record<string, unknown>
): void {
  const safeContext = getMonitoringContext(context);
  logger.error('Erro monitorado', safeContext);

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.metrics.count('meutrevo.server.errors', 1, {
      attributes: safeContext as Record<string, MonitoringValue>,
    });
    Sentry.logger.error('Erro monitorado', safeContext);
    Sentry.captureException(error, {
      tags: Object.fromEntries(
        Object.entries(safeContext).filter(
          ([, value]) => typeof value === 'string'
        )
      ) as Record<string, string>,
      extra: safeContext,
    });
  }
}
