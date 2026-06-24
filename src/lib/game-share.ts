// Game sharing: export/import via JSON, QR Code, and URL

export interface ShareableGame {
  v: number; // version
  lottery: string;
  numbers: string[];
  label?: string;
  ts: number; // timestamp
}

export function encodeGame(game: ShareableGame): string {
  return btoa(JSON.stringify(game));
}

export function decodeGame(encoded: string): ShareableGame | null {
  try {
    const decoded = JSON.parse(atob(encoded));
    if (decoded.v && decoded.lottery && decoded.numbers) {
      return decoded as ShareableGame;
    }
    return null;
  } catch {
    return null;
  }
}

export function createShareableGame(
  lottery: string,
  numbers: string[],
  label?: string
): ShareableGame {
  return {
    v: 1,
    lottery,
    numbers: numbers.map((n) => String(n).padStart(2, '0')),
    label,
    ts: Date.now(),
  };
}

export function generateGameURL(game: ShareableGame): string {
  const encoded = encodeGame(game);
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://meutrevo.com.br';
  return `${base}/jogo?g=${encoded}`;
}

export function generateWhatsAppText(game: ShareableGame): string {
  const nums = game.numbers.join(' - ');
  const lotteryName = getLotteryFullName(game.lottery);
  return `🍀 *Meu Trevo* 🍀\n\n📊 *${lotteryName}*\n🎰 Números: ${nums}${game.label ? `\n📝 ${game.label}` : ''}\n\nMonte o seu em: meutrevo.com.br`;
}

export function generateCSV(games: ShareableGame[]): string {
  const header = 'Loteria,Números,Label,Data';
  const rows = games.map((g) => {
    const date = new Date(g.ts).toLocaleDateString('pt-BR');
    return `${g.lottery},"${g.numbers.join(';')}",${g.label || ''},${date}`;
  });
  return [header, ...rows].join('\n');
}

function getLotteryFullName(key: string): string {
  const map: Record<string, string> = {
    megasena: 'Mega-Sena',
    lotofacil: 'Lotofácil',
    quina: 'Quina',
    lotomania: 'Lotomania',
    diadesorte: 'Dia de Sorte',
    timemania: 'Timemania',
    loteca: 'Loteca',
    duplasena: 'Dupla Sena',
    lotogol: 'LotoGol',
    supersete: 'Super Sete',
    maismilionaria: '+Milionária',
  };
  return map[key] || key;
}
