import { LOTTERY_CONFIGS } from './lottery-math';
import { getSimpleBetPrice } from './lottery-prices';

/**
 * Download generated games as a TXT file.
 */
export function downloadTXT(
  gamesList: number[][],
  activeLottery: string,
  playSound: (type: 'click' | 'success' | 'delete') => void,
  nameSuffix = 'jogos'
) {
  playSound('success');
  const textContent = gamesList
    .map(
      (game, idx) =>
        `Jogo ${idx + 1}: ${game.map((n) => String(n).padStart(2, '0')).join(' - ')}`
    )
    .join('\n');

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meu-trevo-${activeLottery}-${nameSuffix}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download generated games as a styled PDF (opens print dialog).
 */
export function downloadPDF(
  gamesList: number[][],
  activeLottery: string,
  playSound: (type: 'click' | 'success' | 'delete') => void,
  title = 'Jogos Gerados'
) {
  playSound('success');
  const lotName =
    LOTTERY_CONFIGS[activeLottery]?.name || activeLottery.toUpperCase();
  const lotColor = LOTTERY_CONFIGS[activeLottery]?.color || '#209869';
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const gamesHtml = gamesList
    .map(
      (game, idx) => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #ddd;border-radius:8px;page-break-inside:avoid;">
      <div style="font-weight:bold;color:#666;min-width:40px;">#${idx + 1}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${game.map((n) => `<span style="width:36px;height:36px;border-radius:50%;border:2px solid ${lotColor};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;color:${lotColor};">${String(n).padStart(2, '0')}</span>`).join('')}
      </div>
    </div>`
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>${title} - Meu Trevo</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#333;}
      h1{font-size:18px;margin-bottom:4px;}h2{font-size:13px;color:#666;margin-bottom:20px;font-weight:normal;}
      .footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center;}
    </style></head><body>
    <h1>Meu Trevo - ${lotName}</h1>
    <h2>${title} • Gerado em ${new Date().toLocaleDateString('pt-BR')}</h2>
    <div style="display:flex;flex-direction:column;gap:8px;">${gamesHtml}</div>
    <div class="footer">Meu Trevo © ${new Date().getFullYear()} • Gerado automaticamente • Aviso: loteria é jogo de azar</div>
    </body></html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}

/**
 * Print generated games (styled ticket cards).
 */
export function printGames(
  gamesList: number[][],
  activeLottery: string,
  playSound: (type: 'click' | 'success' | 'delete') => void
) {
  playSound('success');
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const lotName =
    LOTTERY_CONFIGS[activeLottery]?.name || activeLottery.toUpperCase();
  const lotColor = LOTTERY_CONFIGS[activeLottery]?.color || '#209869';

  const gamesHtml = gamesList
    .map(
      (game, idx) => `
    <div class="ticket-card">
      <div class="ticket-header">
        <span class="ticket-title">JOGO ${String(idx + 1).padStart(2, '0')}</span>
        <span class="ticket-badge" style="background-color: ${lotColor};">${lotName}</span>
      </div>
      <div class="ticket-balls">
        ${game
          .map(
            (n) =>
              `<span class="ticket-ball" style="border-color: ${lotColor}; background-color: ${lotColor}15; color: ${lotColor};">${String(n).padStart(2, '0')}</span>`
          )
          .join('')}
      </div>
    </div>`
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>${lotName} - Meu Trevo</title>
    <style>
      body { font-family: 'Inter', sans-serif; background: #f4f4f5; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .ticket-card { background: white; border-radius: 12px; border: 2px solid #e5e7eb; padding: 16px; width: 100%; max-width: 400px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); page-break-inside: avoid; }
      .ticket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #e5e7eb; }
      .ticket-title { font-size: 14px; font-weight: 700; color: #1f2937; letter-spacing: 0.05em; }
      .ticket-badge { font-size: 10px; color: white; padding: 3px 8px; border-radius: 9999px; font-weight: 600; text-transform: uppercase; }
      .ticket-balls { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
      .ticket-ball { width: 40px; height: 40px; border-radius: 50%; border: 2px solid; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; }
      .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; text-align: center; }
    </style></head><body>
    <h1 style="font-family: 'Orbitron', sans-serif; color: #1f2937; font-size: 24px; margin-bottom: 8px;">Meu Trevo</h1>
    <h2 style="font-size: 16px; color: #6b7280; font-weight: 400; margin-bottom: 20px;">${lotName} • ${gamesList.length} Jogos Otimizados</h2>
    ${gamesHtml}
    <div class="footer">Meu Trevo © ${new Date().getFullYear()} • Gerado em ${new Date().toLocaleDateString('pt-BR')} • Aviso: loteria é jogo de azar. Jogue com responsabilidade.</div>
    </body></html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}

/**
 * Copy text to clipboard with feedback.
 */
export function copyToClipboard(
  text: string,
  playSound: (type: 'click' | 'success' | 'delete') => void
): void {
  playSound('click');
  navigator.clipboard.writeText(text);
}

import type { SavedGame } from '../app/types';

/**
 * Build Bolão/Pool sharing text for WhatsApp.
 */
export function buildBolaoText(
  selectedGames: SavedGame[],
  cotas: string,
  taxa: string,
  isPro: boolean
): { text: string; shareUrl: string } {
  let totalCost = 0;
  let text = `🍀 *BOLÃO MEU TREVO - JOGOS OTIMIZADOS* 🍀\n`;
  text += `Abaixo estão nossos jogos gerados matematicamente no Meu Trevo:\n\n`;

  selectedGames.forEach((game, idx) => {
    const cfg = LOTTERY_CONFIGS[game.lottery];
    const price = getSimpleBetPrice(game.lottery);
    totalCost += price;
    text += `${idx + 1}. *[${cfg?.name || game.lottery.toUpperCase()}]* \n`;
    text += `👉 \` ${game.numbers.replace(/,/g, ' - ')} \` \n\n`;
  });

  const cotasNum = parseInt(cotas, 10) || 1;
  const taxaPct = parseFloat(taxa) || 0;
  const totalWithTax = totalCost * (1 + taxaPct / 100);
  const pricePerCota = totalWithTax / cotasNum;

  text += `💰 *Custo Total dos Volantes:* R$ ${totalCost.toFixed(2).replace('.', ',')}\n`;
  if (isPro && (cotasNum > 1 || taxaPct > 0)) {
    text += `👥 *Total de Cotas:* ${cotasNum}\n`;
    if (taxaPct > 0) text += `⚙️ *Taxa de Organização:* ${taxaPct}%\n`;
    text += `💵 *Valor por Cota:* R$ ${pricePerCota.toFixed(2).replace('.', ',')}\n\n`;
  } else {
    text += `\n`;
  }
  text += `🤖 Gerado de forma inteligente com IA. Vamos ganhar juntos!`;

  return {
    text,
    shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
  };
}
