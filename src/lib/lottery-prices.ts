export const LOTTERY_SIMPLE_BET_PRICES: Record<string, number> = {
  megasena: 6,
  lotofacil: 3.5,
  quina: 3,
  lotomania: 3,
  diadesorte: 2.5,
  timemania: 3.5,
  loteca: 4,
  duplasena: 3,
  supersete: 2.5,
  maismilionaria: 6,
};

export function getSimpleBetPrice(lottery: string): number {
  return LOTTERY_SIMPLE_BET_PRICES[lottery] ?? 0;
}

export function getLotteryGamesCost(lottery: string, games: number): number {
  return getSimpleBetPrice(lottery) * games;
}
