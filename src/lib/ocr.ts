import { LOTTERY_CONFIGS } from './lottery-math';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type OCRProgress =
  | 'preparing'
  | 'reading'
  | 'verifying'
  | 'done'
  | 'error';

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Aplica blur de caixa 3x3 (substituto de mediana) em um buffer RGBA.
 * Cada pixel e substituido pela media dos 9 vizinhos ao redor.
 */
function boxBlur3x3(
  src: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(new ArrayBuffer(src.length));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let count = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;

          const idx = (ny * width + nx) * 4;
          rSum += src[idx];
          gSum += src[idx + 1];
          bSum += src[idx + 2];
          count++;
        }
      }

      const idx = (y * width + x) * 4;
      out[idx] = Math.round(rSum / count);
      out[idx + 1] = Math.round(gSum / count);
      out[idx + 2] = Math.round(bSum / count);
      out[idx + 3] = src[idx + 3];
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Helpers de carregamento de imagem
// ---------------------------------------------------------------------------

function loadImageBitmap(
  source: string | File
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof File !== 'undefined' && source instanceof File) {
    return fileToImageBitmap(source);
  }
  return dataUrlToImage(source as string);
}

function fileToImageBitmap(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file)
        .then(resolve)
        .catch(() => {
          fileToImageViaUrl(file).then(resolve).catch(reject);
        });
    } else {
      fileToImageViaUrl(file).then(resolve).catch(reject);
    }
  });
}

function fileToImageViaUrl(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      createImageBitmap(img)
        .then((bmp) => {
          URL.revokeObjectURL(url);
          resolve(bmp);
        })
        .catch((err) => {
          URL.revokeObjectURL(url);
          reject(err);
        });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao carregar imagem a partir do File.'));
    };
    img.src = url;
  });
}

function dataUrlToImage(dataUrl: string): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    if (typeof createImageBitmap === 'function') {
      const img = new Image();
      img.onload = () => {
        createImageBitmap(img).then(resolve).catch(reject);
      };
      img.onerror = () =>
        reject(new Error('Falha ao carregar imagem a partir do data-URL.'));
      img.src = dataUrl;
    } else {
      reject(new Error('createImageBitmap nao disponivel neste ambiente.'));
    }
  });
}

// ---------------------------------------------------------------------------
// Funcoes publicas
// ---------------------------------------------------------------------------

/**
 * Pre-processa uma imagem para melhorar a qualidade do OCR.
 *
 * Pipeline:
 *  1. Redimensiona para largura maxima de 1500 px (preservando proporcao)
 *  2. Converte para escala de cinza
 *  3. Aplica aumento de contraste (multiplicador 1.5)
 *  4. Binariza (limiar 128)
 *  5. Reducao de ruido (blur de caixa 3x3)
 *
 * @param imageSource  Data-URL (base64) ou objeto File de imagem.
 * @returns Data-URL da imagem processada.
 */
export async function preprocessImage(
  imageSource: string | File
): Promise<string> {
  const bitmap = await loadImageBitmap(imageSource);

  const maxWidth = 1500;
  let targetW = bitmap.width;
  let targetH = bitmap.height;

  if (targetW > maxWidth) {
    const ratio = maxWidth / targetW;
    targetW = maxWidth;
    targetH = Math.round(targetH * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const imageData = ctx.getImageData(0, 0, targetW, targetH);
  const pixels = imageData.data;

  // Passo 1: Conversao para escala de cinza (luminancia ponderada)
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = Math.round(
      0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
    );
    pixels[i] = gray;
    pixels[i + 1] = gray;
    pixels[i + 2] = gray;
  }

  // Passo 2: Aumento de contraste (multiplicador 1.5 em torno de 128)
  for (let i = 0; i < pixels.length; i += 4) {
    const channel = pixels[i];
    const adjusted = Math.round((channel - 128) * 1.5 + 128);
    const clamped = Math.max(0, Math.min(255, adjusted));
    pixels[i] = clamped;
    pixels[i + 1] = clamped;
    pixels[i + 2] = clamped;
  }

  // Passo 3: Binarizacao (limiar 128)
  for (let i = 0; i < pixels.length; i += 4) {
    const value = pixels[i] >= 128 ? 255 : 0;
    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
  }

  // Passo 4: Reducao de ruido (blur de caixa 3x3)
  const blurred = boxBlur3x3(pixels, targetW, targetH);

  // Re-binariza apos o blur e copia para o buffer original
  for (let i = 0; i < blurred.length; i += 4) {
    const value = blurred[i] >= 128 ? 255 : 0;
    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
  }

  // Renderiza resultado final no canvas e retorna data-URL
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

/**
 * Extrai numeros candidatos de texto bruto do OCR.
 *
 * Utiliza regex para encontrar todos os numeros de 1 a 3 digitos.
 * Texto que nao contiver numeros e ignorado.
 *
 * @param ocrText  Texto bruto obtido de um motor de OCR.
 * @returns Array de numeros candidatos (nao normalizados).
 */
export function extractCandidateNumbers(ocrText: string): number[] {
  const matches = ocrText.match(/\b\d{1,3}\b/g);
  if (!matches) return [];
  return matches.map(function (m) {
    return parseInt(m, 10);
  });
}

/**
 * Normaliza numeros detectados: remove duplicatas, ordena e filtra para 0-99.
 *
 * @param numbers  Array de numeros candidatos brutos.
 * @returns Array unico, ordenado, contendo apenas numeros entre 0 e 99.
 */
export function normalizeDetectedNumbers(numbers: number[]): number[] {
  const seen: Record<number, boolean> = {};
  const result: number[] = [];

  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    if (n >= 0 && n <= 99 && !seen[n]) {
      seen[n] = true;
      result.push(n);
    }
  }

  result.sort(function (a, b) {
    return a - b;
  });
  return result;
}

/**
 * Valida numeros detectados contra as regras da loteria especificada.
 *
 * Verifica:
 *  - Se todos os numeros estao dentro da faixa minNum..maxNum
 *  - Se a quantidade de numeros e valida para o drawCount da loteria
 *
 * @param numbers    Numeros detectados e normalizados.
 * @param lotteryId  ID da loteria (ex: 'megasena', 'lotofacil').
 * @returns Objeto com indicador de validade e lista de erros descritivos.
 */
export function validateDetectedNumbers(
  numbers: number[],
  lotteryId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = LOTTERY_CONFIGS[lotteryId];

  if (!config) {
    return {
      valid: false,
      errors: ['Loteria "' + lotteryId + '" nao encontrada nas configuracoes.'],
    };
  }

  // Verifica se a quantidade de numeros e valida
  if (numbers.length < config.drawCount) {
    errors.push(
      'Quantidade insuficiente: ' +
        numbers.length +
        ' numero(s) detectado(s), ' +
        'mas a ' +
        config.name +
        ' exige exatamente ' +
        config.drawCount +
        '.'
    );
  } else if (numbers.length > config.drawCount) {
    errors.push(
      'Quantidade excedida: ' +
        numbers.length +
        ' numero(s) detectado(s), ' +
        'mas a ' +
        config.name +
        ' permite exatamente ' +
        config.drawCount +
        '.'
    );
  }

  // Verifica se todos os numeros estao dentro da faixa permitida
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    if (n < config.minNum || n > config.maxNum) {
      errors.push(
        'Numero ' +
          n +
          ' fora da faixa permitida para ' +
          config.name +
          ' (min: ' +
          config.minNum +
          ', max: ' +
          config.maxNum +
          ').'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

/**
 * Aplica correcoes manuais sobre numeros detectados.
 *
 * Adiciona novos numeros, remove os especificados e normaliza o resultado.
 *
 * @param detected  Numeros originalmente detectados pelo OCR.
 * @param added     Numeros que o usuario deseja incluir manualmente.
 * @param removed   Numeros que o usuario deseja excluir.
 * @returns Array final, normalizado e ordenado.
 */
export function mergeManualCorrections(
  detected: number[],
  added: number[],
  removed: number[]
): number[] {
  const removedSet: Record<number, boolean> = {};
  for (let i = 0; i < removed.length; i++) {
    removedSet[removed[i]] = true;
  }

  const merged: number[] = [];
  for (let j = 0; j < detected.length; j++) {
    if (!removedSet[detected[j]]) {
      merged.push(detected[j]);
    }
  }
  for (let k = 0; k < added.length; k++) {
    merged.push(added[k]);
  }

  return normalizeDetectedNumbers(merged);
}
