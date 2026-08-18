export interface ShareLink {
  id: string;
  share_code: string;
  user_id: string;
  lottery_id: string;
  contest_num: string | null;
  games_snapshot: Array<{ numbers: string; lottery: string }>;
  cotas: number;
  taxa: number;
  summary_text: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
  expires_at: string | null;
}

export interface PublicShareData {
  lottery_id: string;
  lottery_name: string;
  contest_num: string | null;
  games: Array<{ numbers: string }>;
  cotas: number;
  taxa: number;
  summary: string;
  created_at: string;
}

/**
 * Gera um código de compartilhamento URL-safe de 22 caracteres
 * usando crypto.randomUUID() sem hífens.
 */
export function generateShareCode(): string {
  const uuid = globalThis.crypto.randomUUID();
  return uuid.replace(/-/g, '').slice(0, 22);
}

/**
 * Retorna a URL absoluta de compartilhamento para um dado código.
 */
export function getShareUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://www.meutrevo.com';
  return `${base}/bolao/${code}`;
}

/**
 * Valida uma URL para uso em QR code scanner.
 * Bloqueia esquemas perigosos, detecta links do Meu Trevo,
 * e retorna uma URL de exibição sanitizada (sem params de tracking).
 */
export function validateShareUrl(url: string): {
  safe: boolean;
  isMeuTrevo: boolean;
  displayUrl: string;
} {
  const safe = !blockDangerousSchemes(url);

  let isMeuTrevo = false;
  try {
    const parsed = new URL(url);
    isMeuTrevo =
      parsed.hostname === 'www.meutrevo.com' ||
      parsed.hostname === 'meutrevo.com' ||
      parsed.hostname.endsWith('.meutrevo.com');
  } catch {
    isMeuTrevo = false;
  }

  let displayUrl = url;
  try {
    const parsed = new URL(url);
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
      'source',
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    displayUrl = parsed.toString();
  } catch {
    displayUrl = url;
  }

  return { safe, isMeuTrevo, displayUrl };
}

/**
 * Retorna true se a URL usa um esquema perigoso (javascript:, data:, file:, ftp:, etc).
 * Apenas http e https são permitidos.
 */
export function blockDangerousSchemes(url: string): boolean {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.toLowerCase();
    return protocol !== 'http:' && protocol !== 'https:';
  } catch {
    // Se não conseguir parsear como URL, considera perigoso
    return true;
  }
}
