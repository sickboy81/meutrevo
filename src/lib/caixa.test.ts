import { describe, expect, it } from 'vitest';
import {
  canServeCachedLatest,
  normalizeMirrorLotteryResult,
  parseLotecaMirrorHtml,
  parseLotecaNewsHtml,
} from './caixa';

describe('lottery result provider fallbacks', () => {
  it('does not trust a recently rewritten cache entry without source provenance', () => {
    expect(canServeCachedLatest(10_000, undefined)).toBe(false);
    expect(canServeCachedLatest(10_000, 'mirror')).toBe(true);
    expect(canServeCachedLatest(6 * 60_000, 'caixa')).toBe(false);
  });

  it('normalizes the numeric-lottery mirror to the Caixa response shape', () => {
    const result = normalizeMirrorLotteryResult('maismilionaria', {
      loteria: 'maismilionaria',
      concurso: 366,
      data: '25/06/2026',
      local: 'Espaco da Sorte em SAO PAULO, SP',
      dezenasOrdemSorteio: ['25', '22', '14', '01', '11', '37', '05', '02'],
      dezenas: ['01', '11', '14', '22', '25', '37'],
      trevos: ['2', '5'],
      premiacoes: [
        {
          descricao: '6 acertos + 2 trevos',
          faixa: 1,
          ganhadores: 0,
          valorPremio: 0,
        },
      ],
      acumulou: true,
      proximoConcurso: 367,
      dataProximoConcurso: '27/06/2026',
      valorEstimadoProximoConcurso: 190_000_000,
    });

    expect(result).toMatchObject({
      numero: 366,
      numeroConcursoProximo: 367,
      dataApuracao: '25/06/2026',
      dataProximoConcurso: '27/06/2026',
      listaDezenas: ['01', '11', '14', '22', '25', '37'],
      dezenasSorteadasOrdemSorteio: ['25', '22', '14', '01', '11', '37'],
      trevosSorteados: ['2', '5'],
      acumulado: true,
      valorEstimadoProximoConcurso: 190_000_000,
      listaRateioPremio: [
        {
          descricaoFaixa: '6 acertos + 2 trevos',
          faixa: 1,
          numeroDeGanhadores: 0,
          valorPremio: 0,
        },
      ],
    });
  });

  it('keeps only the first draw in Dupla Sena listaDezenas', () => {
    const result = normalizeMirrorLotteryResult('duplasena', {
      concurso: 2975,
      data: '26/06/2026',
      dezenas: [
        '07',
        '08',
        '22',
        '25',
        '42',
        '44',
        '16',
        '20',
        '24',
        '34',
        '39',
        '43',
      ],
      dezenasOrdemSorteio: [
        '07',
        '42',
        '44',
        '08',
        '25',
        '22',
        '20',
        '39',
        '34',
        '16',
        '43',
        '24',
      ],
      acumulou: true,
      proximoConcurso: 2976,
      dataProximoConcurso: '29/06/2026',
      valorEstimadoProximoConcurso: 5_800_000,
    });

    expect(result.listaDezenas).toEqual(['07', '08', '22', '25', '42', '44']);
    expect(result.listaDezenasSegundoSorteio).toEqual([
      '16',
      '20',
      '24',
      '34',
      '39',
      '43',
    ]);
  });

  it('extracts the latest Loteca contest and official display date', () => {
    const result = parseLotecaMirrorHtml(`
      <script type="application/ld+json">
        {"name":"Sorteio da Loteca - Concurso 1257"}
      </script>
      <p>Sorteio realizado em: <strong>25/06/2026</strong></p>
      <p>Proximo sorteio: <strong>29/06/2026</strong></p>
    `);

    expect(result).toMatchObject({
      numero: 1257,
      dataApuracao: '25/06/2026',
      dataProximoConcurso: '29/06/2026',
      numeroConcursoProximo: 1258,
      listaDezenas: [],
    });
  });

  it('extracts Loteca from the secondary news mirror markup', () => {
    const result = parseLotecaNewsHtml(`
      Concurso <span id="span_numero_concurso">1257</span> -
      <span class="date">
        <span id="span_dia_semana_concurso">25/06/2026</span>
      </span>
    `);

    expect(result).toMatchObject({
      numero: 1257,
      dataApuracao: '25/06/2026',
      numeroConcursoProximo: 1258,
      fonteDados: 'mirror',
    });
  });
});
