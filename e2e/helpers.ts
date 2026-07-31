export function generateValidCpf(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const base = String(hash % 1_000_000_000)
    .padStart(9, '0')
    .split('')
    .map(Number);

  if (base.every((digit) => digit === base[0])) {
    base[8] = (base[8] + 1) % 10;
  }

  const calculateDigit = (digits: number[]) => {
    const sum = digits.reduce(
      (total, digit, index) => total + digit * (digits.length + 1 - index),
      0
    );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstDigit = calculateDigit(base);
  const secondDigit = calculateDigit([...base, firstDigit]);
  return [...base, firstDigit, secondDigit].join('');
}
