import { getSimpleBetPrice } from './lottery-prices';

export function normalizeContestCount(value: number | string): number {
  return Math.min(100, Math.max(1, Number(value) || 1));
}

export function calculateGamePlanCost(
  lottery: string,
  games: number,
  contests: number | string
) {
  const normalizedContests = normalizeContestCount(contests);
  const costPerContest = getSimpleBetPrice(lottery) * Math.max(0, games);

  return {
    contests: normalizedContests,
    costPerContest,
    total: costPerContest * normalizedContests,
  };
}
