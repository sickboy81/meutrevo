import QRCode from 'qrcode';

export function createQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 240,
    margin: 2,
    color: {
      dark: '#111111',
      light: '#ffffff',
    },
  });
}
