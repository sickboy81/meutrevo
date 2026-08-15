import { captureException } from '@sentry/nextjs';
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

export function reportServerError(
  error: unknown,
  context: Record<string, unknown>
): void {
  const safeContext = getMonitoringContext(context);
  logger.error('Erro monitorado', safeContext);

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    captureException(error, {
      tags: Object.fromEntries(
        Object.entries(safeContext).filter(
          ([, value]) => typeof value === 'string'
        )
      ) as Record<string, string>,
      extra: safeContext,
    });
  }
}
