import * as Sentry from '@sentry/nextjs';

const ALLOWED_EVENTS = new Set([
  'planning_started',
  'planning_completed',
  'generator_opened',
  'games_generated',
  'game_saved',
  'conference_opened',
  'pool_created',
  'pool_shared',
]);

export function trackProductEvent(
  event: string,
  attributes: Record<string, string | number | boolean> = {}
): void {
  if (!ALLOWED_EVENTS.has(event)) return;
  try {
    Sentry.metrics.count(`meutrevo.product.${event}`, 1, { attributes });
  } catch {
    // Product analytics must never block the user flow.
  }
}
