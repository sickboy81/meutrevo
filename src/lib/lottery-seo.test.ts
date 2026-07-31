import { describe, expect, it } from 'vitest';
import {
  createLotteryMetadata,
  isLotterySeoId,
  LOTTERY_SEO_CONFIGS,
  LOTTERY_SEO_LIST,
} from './lottery-seo';

describe('lottery SEO catalog', () => {
  it('cobre as 11 modalidades com caminhos únicos', () => {
    expect(LOTTERY_SEO_LIST).toHaveLength(11);
    expect(new Set(LOTTERY_SEO_LIST.map((item) => item.path)).size).toBe(11);
    expect(LOTTERY_SEO_CONFIGS.loteca.path).toBe('/loteca');
    expect(LOTTERY_SEO_CONFIGS.loteriafederal.path).toBe('/loteriafederal');
  });

  it('aceita apenas identificadores próprios do catálogo', () => {
    expect(isLotterySeoId('megasena')).toBe(true);
    expect(isLotterySeoId('toString')).toBe(false);
    expect(isLotterySeoId('__proto__')).toBe(false);
  });

  it.each(LOTTERY_SEO_LIST)('mantém snippets concisos para $name', (config) => {
    expect(`${config.title} | Meu Trevo`.length).toBeLessThanOrEqual(60);
    expect(config.description.length).toBeGreaterThanOrEqual(110);
    expect(config.description.length).toBeLessThanOrEqual(160);
  });

  it('gera canonical e imagem social 1200x630 por modalidade', () => {
    const metadata = createLotteryMetadata('megasena');
    const image = metadata.openGraph?.images;

    expect(metadata.alternates?.canonical).toBe('/megasena');
    expect(Array.isArray(image)).toBe(true);
    if (!Array.isArray(image)) throw new Error('Open Graph image ausente');
    expect(image[0]).toMatchObject({
      url: '/og/megasena',
      width: 1200,
      height: 630,
    });
  });
});
