import { describe, expect, it } from 'vitest';
import { decorateLotteryResult } from './lottery-results';

describe('Loteca result decoration', () => {
  it('converts the 14 official match scores into 1/X/2 results', () => {
    const result = decorateLotteryResult('loteca', {
      numero: 1263,
      dataApuracao: '23/07/2026',
      dataProximoConcurso: '',
      dezenasSorteadasOrdemSorteio: [],
      listaDezenas: [],
      valorEstimadoProximoConcurso: 1_200_000,
      acumulado: false,
      listaResultadoEquipeEsportiva: [
        ...Array.from({ length: 13 }, (_, index) => ({
          nuGolEquipeUm: index % 3,
          nuGolEquipeDois: index % 3,
        })),
        { nuGolEquipeUm: '4', nuGolEquipeDois: '1' },
      ],
    });

    expect(result?.listaDezenas).toHaveLength(14);
    expect(result?.listaDezenas.at(-1)).toBe('1');
    expect(result?.dezenasSorteadasOrdemSorteio).toEqual(result?.listaDezenas);
  });

  it('does not publish a result when a match score is incomplete', () => {
    const result = decorateLotteryResult('loteca', {
      numero: 1263,
      dataApuracao: '23/07/2026',
      dataProximoConcurso: '',
      dezenasSorteadasOrdemSorteio: [],
      listaDezenas: [],
      valorEstimadoProximoConcurso: 1_200_000,
      acumulado: false,
      listaResultadoEquipeEsportiva: [
        { nuGolEquipeUm: 1, nuGolEquipeDois: null },
      ],
    });

    expect(result?.listaDezenas).toEqual([]);
  });
});
