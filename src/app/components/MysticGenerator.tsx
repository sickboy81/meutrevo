'use client';

import React, { useState } from 'react';
import { LOTTERY_CONFIGS } from '../../lib/lottery-math';

interface Props {
  activeLottery: string;
  onGenerated: (numbers: number[]) => void;
  playSound: (type: 'click' | 'success' | 'delete') => void;
}

const MYSTIC_CATEGORIES = [
  {
    key: 'astro',
    label: 'Astrologia',
    icon: '🌟',
    desc: 'Baseado no mapa astral — use sua data e hora de nascimento para gerar números únicos.',
  },
  {
    key: 'tarot',
    label: 'Tarô',
    icon: '🔮',
    desc: 'Carta do dia — selecione uma carta do Tarô para revelar seus números.',
  },
  {
    key: 'numerologia',
    label: 'Numerologia',
    icon: '🔢',
    desc: 'Vibração do nome — use seu nome completo e data de nascimento.',
  },
  {
    key: 'fenShui',
    label: 'Feng Shui',
    icon: '☯️',
    desc: 'Elemento vital — escolha seu elemento e gere harmonia numérica.',
  },
  {
    key: 'sonho',
    label: 'Sonho',
    icon: '🌙',
    desc: 'Interpretação onírica — descreva o que sonhou para gerar números.',
  },
  {
    key: 'sincronicidade',
    label: 'Sincronicidade',
    icon: '🎲',
    desc: 'O universo decide — números aleatórios com toque místico.',
  },
];

const TAROT_CARDS = [
  {
    name: 'O Louco',
    num: 0,
    meaning: 'Novos começos, espontaneidade',
    color: '#ffd600',
  },
  {
    name: 'O Mago',
    num: 1,
    meaning: 'Manifestação, poder pessoal',
    color: '#ff4444',
  },
  {
    name: 'A Sacerdotisa',
    num: 2,
    meaning: 'Intuição, mistério',
    color: '#93098f',
  },
  {
    name: 'A Imperatriz',
    num: 3,
    meaning: 'Abundância, fertilidade',
    color: '#00e676',
  },
  {
    name: 'O Imperador',
    num: 4,
    meaning: 'Estrutura, autoridade',
    color: '#ff6d00',
  },
  {
    name: 'O Hierofante',
    num: 5,
    meaning: 'Tradição, sabedoria',
    color: '#00b0ff',
  },
  {
    name: 'Os Enamorados',
    num: 6,
    meaning: 'Amor, escolhas',
    color: '#ff1744',
  },
  {
    name: 'O Carro',
    num: 7,
    meaning: 'Determinação, vitória',
    color: '#ffd600',
  },
  {
    name: 'A Força',
    num: 8,
    meaning: 'Coragem, controle interior',
    color: '#ff9100',
  },
  {
    name: 'O Eremita',
    num: 9,
    meaning: 'Introspecção, guia interior',
    color: '#78909c',
  },
  {
    name: 'A Roda da Fortuna',
    num: 10,
    meaning: 'Ciclos, destino',
    color: '#7c4dff',
  },
  {
    name: 'A Justiça',
    num: 11,
    meaning: 'Equilíbrio, verdade',
    color: '#00e676',
  },
  {
    name: 'O Enforcado',
    num: 12,
    meaning: 'Sacrifício, nova perspectiva',
    color: '#00b0ff',
  },
  {
    name: 'A Morte',
    num: 13,
    meaning: 'Transformação, fim de ciclo',
    color: '#212121',
  },
  {
    name: 'A Temperança',
    num: 14,
    meaning: 'Paciência, moderação',
    color: '#7c4dff',
  },
  {
    name: 'O Diabo',
    num: 15,
    meaning: 'Tentação, materialismo',
    color: '#ff1744',
  },
  {
    name: 'A Torre',
    num: 16,
    meaning: 'Reviravolta, liberdade',
    color: '#ff6d00',
  },
  {
    name: 'A Estrela',
    num: 17,
    meaning: 'Esperança, inspiração',
    color: '#00e5ff',
  },
  {
    name: 'A Lua',
    num: 18,
    meaning: 'Ilusão, subconsciente',
    color: '#b0bec5',
  },
  { name: 'O Sol', num: 19, meaning: 'Sucesso, vitalidade', color: '#ffd600' },
  {
    name: 'O Julgamento',
    num: 20,
    meaning: 'Renascimento, chamado',
    color: '#ff4444',
  },
  {
    name: 'O Mundo',
    num: 21,
    meaning: 'Conclusão, realização',
    color: '#00e676',
  },
];

const FENG_SHUI_ELEMENTS = [
  {
    key: 'madeira',
    label: 'Madeira 🌳',
    color: '#00e676',
    desc: 'Crescimento, vitalidade, novos projetos',
    seasons: 'Primavera',
    numbers: [1, 3, 8],
  },
  {
    key: 'fogo',
    label: 'Fogo 🔥',
    color: '#ff4444',
    desc: 'Paixão, energia, liderança',
    seasons: 'Verão',
    numbers: [2, 7, 9],
  },
  {
    key: 'terra',
    label: 'Terra 🏔️',
    color: '#ffd600',
    desc: 'Estabilidade, nutrição, harmonia',
    seasons: 'Transição',
    numbers: [5, 6, 8],
  },
  {
    key: 'metal',
    label: 'Metal ⚔️',
    color: '#b0bec5',
    desc: 'Precisão, clareza, riqueza',
    seasons: 'Outono',
    numbers: [4, 9],
  },
  {
    key: 'agua',
    label: 'Água 💧',
    color: '#00b0ff',
    desc: 'Sabedoria, flexibilidade, prosperidade',
    seasons: 'Inverno',
    numbers: [1, 6],
  },
];

const DREAM_DICTIONARY: Record<number, string> = {
  1: 'Cobra',
  2: 'Sapo',
  3: 'Barata',
  4: 'Gato',
  5: 'Caranguejo',
  6: 'Peixe',
  7: 'Pássaro',
  8: 'Onça',
  9: 'Cavalo',
  10: 'Borboleta',
  11: 'Carneiro',
  12: 'Coelho',
  13: 'Tigre',
  14: 'Macaco',
  15: 'Tartaruga',
  16: 'Golfinho',
  17: 'Águia',
  18: 'Cachorro',
  19: 'Elefante',
  20: 'Leão',
  21: 'Galo',
  22: 'Gavião',
  23: 'Pavão',
  24: 'Formiga',
  25: 'Baleia',
  26: 'Urso',
  27: 'Coruja',
  28: 'Touro',
  29: 'Gato Preto',
  30: 'Vaca',
};

const ZODIAC_SIGNS = [
  {
    name: 'Áries',
    dates: '21/3 - 19/4',
    element: 'Fogo',
    numbers: [1, 8, 15, 22, 29, 36, 43, 50, 57],
  },
  {
    name: 'Touro',
    dates: '20/4 - 20/5',
    element: 'Terra',
    numbers: [2, 9, 16, 23, 30, 37, 44, 51, 58],
  },
  {
    name: 'Gêmeos',
    dates: '21/5 - 20/6',
    element: 'Ar',
    numbers: [3, 10, 17, 24, 31, 38, 45, 52, 59],
  },
  {
    name: 'Câncer',
    dates: '21/6 - 22/7',
    element: 'Água',
    numbers: [4, 11, 18, 25, 32, 39, 46, 53, 60],
  },
  {
    name: 'Leão',
    dates: '23/7 - 22/8',
    element: 'Fogo',
    numbers: [5, 12, 19, 26, 33, 40, 47, 54],
  },
  {
    name: 'Virgem',
    dates: '23/8 - 22/9',
    element: 'Terra',
    numbers: [6, 13, 20, 27, 34, 41, 48, 55],
  },
  {
    name: 'Libra',
    dates: '23/9 - 22/10',
    element: 'Ar',
    numbers: [7, 14, 21, 28, 35, 42, 49, 56],
  },
  {
    name: 'Escorpião',
    dates: '23/10 - 21/11',
    element: 'Água',
    numbers: [8, 15, 22, 29, 36, 43, 50, 57],
  },
  {
    name: 'Sagitário',
    dates: '22/11 - 21/12',
    element: 'Fogo',
    numbers: [9, 16, 23, 30, 37, 44, 51, 58],
  },
  {
    name: 'Capricórnio',
    dates: '22/12 - 19/1',
    element: 'Terra',
    numbers: [3, 12, 21, 30, 39, 48, 57],
  },
  {
    name: 'Aquário',
    dates: '20/1 - 18/2',
    element: 'Ar',
    numbers: [4, 11, 18, 25, 32, 39, 46, 53, 60],
  },
  {
    name: 'Peixes',
    dates: '19/2 - 20/3',
    element: 'Água',
    numbers: [7, 14, 21, 28, 35, 42, 49, 56],
  },
];

function getZodiacSign(day: number, month: number): (typeof ZODIAC_SIGNS)[0] {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
    return ZODIAC_SIGNS[0];
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
    return ZODIAC_SIGNS[1];
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20))
    return ZODIAC_SIGNS[2];
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22))
    return ZODIAC_SIGNS[3];
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22))
    return ZODIAC_SIGNS[4];
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
    return ZODIAC_SIGNS[5];
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22))
    return ZODIAC_SIGNS[6];
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
    return ZODIAC_SIGNS[7];
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
    return ZODIAC_SIGNS[8];
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
    return ZODIAC_SIGNS[9];
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
    return ZODIAC_SIGNS[10];
  return ZODIAC_SIGNS[11];
}

function generateAstroNumbers(
  day: number,
  month: number,
  year: number,
  hour: number,
  minute: number,
  maxNum: number,
  drawCount: number
): {
  numbers: number[];
  zodiac: (typeof ZODIAC_SIGNS)[0];
  planetNums: number[];
} {
  const zodiac = getZodiacSign(day, month);
  const nums = new Set<number>();

  // Números do signo
  zodiac.numbers.forEach((n) => {
    if (n <= maxNum) nums.add(n);
  });

  // Números planetários baseados na hora
  const planets = [
    1, 3, 5, 7, 9, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59,
  ];
  const planetNums: number[] = [];
  for (let i = 0; i < 4; i++) {
    const p = planets[(hour + minute + i) % planets.length];
    if (p <= maxNum) {
      nums.add(p);
      planetNums.push(p);
    }
  }

  // Número de destino (soma de todos os dígitos da data)
  const destStr = `${day}${month}${year}`;
  let destNum = 0;
  for (const ch of destStr) destNum += parseInt(ch);
  while (destNum > maxNum) destNum = Math.floor(destNum / 10) + (destNum % 10);
  if (destNum >= 1 && destNum <= maxNum) nums.add(destNum);

  // Complementa se faltar
  const rng = seedRandom(day * 10000 + month * 100 + year + hour * 60 + minute);
  let attempts = 0;
  while (nums.size < drawCount && attempts < 200) {
    const n = Math.floor(rng() * maxNum) + 1;
    nums.add(n);
    attempts++;
  }

  return {
    numbers: Array.from(nums)
      .sort((a, b) => a - b)
      .slice(0, drawCount),
    zodiac,
    planetNums,
  };
}

function generateNumerologyNumbers(
  name: string,
  day: number,
  month: number,
  year: number,
  maxNum: number,
  drawCount: number
): {
  numbers: number[];
  lifePath: number;
  soulUrge: number;
  personalYear: number;
} {
  // Número do caminho de vida (Life Path)
  const dateStr = `${day}${month}${year}`;
  let lifePath = 0;
  for (const ch of dateStr) lifePath += parseInt(ch);
  while (
    lifePath > 9 &&
    lifePath !== 11 &&
    lifePath !== 22 &&
    lifePath !== 33
  ) {
    lifePath = Math.floor(lifePath / 10) + (lifePath % 10);
  }

  // Número da alma (Soul Urge) — soma das vogais do nome
  const vowels = 'aeiouáéíóúãõâêôàèìòùäëïöü';
  let soulUrge = 0;
  const nameLower = name.toLowerCase();
  for (const ch of nameLower) {
    if (vowels.includes(ch)) soulUrge += charToNum(ch);
  }
  while (soulUrge > 9 && soulUrge !== 11 && soulUrge !== 22) {
    soulUrge = Math.floor(soulUrge / 10) + (soulUrge % 10);
  }

  // Ano pessoal
  const now = new Date();
  let personalYear = lifePath + now.getFullYear();
  while (personalYear > 9 && personalYear !== 11 && personalYear !== 22) {
    personalYear = Math.floor(personalYear / 10) + (personalYear % 10);
  }

  const nums = new Set<number>();

  // Adiciona os números da numerologia
  [lifePath, soulUrge, personalYear].forEach((n) => {
    if (n >= 1 && n <= maxNum) nums.add(n);
  });

  // Gera números baseados nas vibrações
  const rng = seedRandom(lifePath * 100 + soulUrge * 10 + personalYear);

  // Usa o nome para criar offsets
  let nameHash = 0;
  for (let i = 0; i < name.length; i++) {
    nameHash = ((nameHash << 5) - nameHash + charToNum(name[i])) | 0;
  }

  const baseNums = [
    lifePath,
    soulUrge,
    personalYear,
    (Math.abs(nameHash) % maxNum) + 1,
  ];
  baseNums.forEach((n) => {
    const adjusted = ((n - 1 + Math.floor(rng() * 5)) % maxNum) + 1;
    if (adjusted >= 1 && adjusted <= maxNum) nums.add(adjusted);
  });

  let attempts = 0;
  while (nums.size < drawCount && attempts < 200) {
    const n = Math.floor(rng() * maxNum) + 1;
    nums.add(n);
    attempts++;
  }

  return {
    numbers: Array.from(nums)
      .sort((a, b) => a - b)
      .slice(0, drawCount),
    lifePath,
    soulUrge,
    personalYear,
  };
}

function charToNum(ch: string): number {
  const map: Record<string, number> = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: 5,
    f: 6,
    g: 7,
    h: 8,
    i: 9,
    j: 1,
    k: 2,
    l: 3,
    m: 4,
    n: 5,
    o: 6,
    p: 7,
    q: 8,
    r: 9,
    s: 1,
    t: 2,
    u: 3,
    v: 4,
    w: 5,
    x: 6,
    y: 7,
    z: 8,
    á: 1,
    é: 5,
    í: 9,
    ó: 6,
    ú: 3,
    ã: 1,
    õ: 6,
    â: 1,
    ê: 5,
    ô: 6,
    à: 1,
    è: 5,
    ì: 9,
    ò: 6,
    ù: 3,
    ä: 1,
    ë: 5,
    ï: 9,
    ö: 6,
    ü: 3,
  };
  return map[ch.toLowerCase()] || 1;
}

function generateFengShuiNumbers(
  element: string,
  maxNum: number,
  drawCount: number
): { numbers: number[]; element: (typeof FENG_SHUI_ELEMENTS)[0] } {
  const elem =
    FENG_SHUI_ELEMENTS.find((e) => e.key === element) || FENG_SHUI_ELEMENTS[0];
  const nums = new Set<number>();

  elem.numbers.forEach((n) => {
    if (n <= maxNum) nums.add(n);
    // Adiciona ciclos
    for (let cycle = 1; cycle <= 3; cycle++) {
      const cn = n + cycle * 9;
      if (cn <= maxNum) nums.add(cn);
    }
  });

  const rng = seedRandom(elem.numbers.reduce((a, b) => a + b, 0));
  while (nums.size < drawCount) {
    const n = elem.numbers[Math.floor(rng() * elem.numbers.length)];
    const variant = ((n - 1 + Math.floor(rng() * 9)) % maxNum) + 1;
    nums.add(variant);
  }

  return {
    numbers: Array.from(nums)
      .sort((a, b) => a - b)
      .slice(0, drawCount),
    element: elem,
  };
}

function generateDreamNumbers(
  dreamText: string,
  maxNum: number,
  drawCount: number
): number[] {
  const nums = new Set<number>();

  if (dreamText.trim().length > 0) {
    const text = dreamText.toLowerCase();
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    const rng = seedRandom(Math.abs(hash));

    // Hash do texto
    nums.add((Math.abs(hash) % maxNum) + 1);
    nums.add((Math.abs(hash >> 8) % maxNum) + 1);
    nums.add((Math.abs(hash >> 16) % maxNum) + 1);

    // Complementa com rng
    while (nums.size < drawCount) {
      nums.add(Math.floor(rng() * maxNum) + 1);
    }
  } else {
    const keys = Object.keys(DREAM_DICTIONARY).map(Number);
    keys.forEach((k) => {
      if (k <= maxNum) nums.add(k);
    });
    const rng = seedRandom(Date.now());
    while (nums.size < drawCount) {
      nums.add(Math.floor(rng() * maxNum) + 1);
    }
  }

  return Array.from(nums)
    .sort((a, b) => a - b)
    .slice(0, drawCount);
}

function seedRandom(seed: number): () => number {
  let s = Math.abs(seed) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export default function MysticGenerator({
  activeLottery,
  onGenerated,
  playSound,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('astro');
  const [generatedNums, setGeneratedNums] = useState<number[]>([]);
  const [mysticDesc, setMysticDesc] = useState('');
  const [revealPhase, setRevealPhase] = useState<0 | 1 | 2>(0);
  const [lastCard, setLastCard] = useState<(typeof TAROT_CARDS)[0] | null>(
    null
  );

  // Form states
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedElement, setSelectedElement] = useState('madeira');
  const [dreamText, setDreamText] = useState('');
  const [selectedTarotCard, setSelectedTarotCard] = useState<number | null>(
    null
  );

  const config = LOTTERY_CONFIGS[activeLottery as keyof typeof LOTTERY_CONFIGS];
  const maxNum = config?.maxNum || 60;
  const drawCount = config?.drawCount || 6;

  const handleGenerate = () => {
    playSound('click');
    setRevealPhase(1);
    setGeneratedNums([]);
    setMysticDesc('');
    setLastCard(null);

    const seed = Date.now();
    let nums: number[] = [];
    let desc = '';

    switch (selectedCategory) {
      case 'astro': {
        if (!birthDate) {
          setRevealPhase(0);
          return;
        }
        const [y, m, d] = birthDate.split('-').map(Number);
        const [h = 12, min = 0] = (birthTime || '12:00').split(':').map(Number);
        const result = generateAstroNumbers(d, m, y, h, min, maxNum, drawCount);
        nums = result.numbers;
        desc = `Seu signo é ${result.zodiac.name} (${result.zodiac.element}). Os planetas influenciaram seus números. Destino: reduza sua data para encontrar seu número vital.`;
        break;
      }
      case 'tarot': {
        if (selectedTarotCard === null) {
          setRevealPhase(0);
          return;
        }
        const card = TAROT_CARDS[selectedTarotCard];
        setLastCard(card);
        const rng = seedRandom(card.num * 100 + seed);
        nums = [card.num + 1];
        while (nums.length < drawCount) {
          const n = Math.floor(rng() * maxNum) + 1;
          if (!nums.includes(n)) nums.push(n);
        }
        nums.sort((a, b) => a - b);
        desc = `${card.name}: ${card.meaning}. Esta carta guia seus números com sua energia única.`;
        break;
      }
      case 'numerologia': {
        if (!fullName.trim() || !birthDate) {
          setRevealPhase(0);
          return;
        }
        const [y, m, d] = birthDate.split('-').map(Number);
        const result = generateNumerologyNumbers(
          fullName,
          d,
          m,
          y,
          maxNum,
          drawCount
        );
        nums = result.numbers;
        desc = `Caminho de Vida: ${result.lifePath}. Alma: ${result.soulUrge}. Ano Pessoal: ${result.personalYear}. Seu nome "${fullName}" vibra com estes números.`;
        break;
      }
      case 'fenShui': {
        const result = generateFengShuiNumbers(
          selectedElement,
          maxNum,
          drawCount
        );
        nums = result.numbers;
        desc = `Elemento ${result.element.label}: ${result.element.desc}. Os números do ${result.element.seasons} guiam sua sorte.`;
        break;
      }
      case 'sonho': {
        nums = generateDreamNumbers(dreamText, maxNum, drawCount);
        desc = dreamText.trim()
          ? `Seu sonho "${dreamText.slice(0, 40)}..." foi traduzido em números.`
          : 'O dicionário de sonhos revelou seus números ocultos.';
        break;
      }
      case 'sincronicidade': {
        const rng = seedRandom(seed);
        nums = [];
        while (nums.length < drawCount) {
          const n = Math.floor(rng() * maxNum) + 1;
          if (!nums.includes(n)) nums.push(n);
        }
        nums.sort((a, b) => a - b);
        desc = 'O universo enviou seus números. A sincronicidade está ativa.';
        break;
      }
    }

    if (nums.length === 0) {
      setRevealPhase(0);
      return;
    }

    setMysticDesc(desc);

    setTimeout(() => {
      setRevealPhase(2);
      setGeneratedNums(nums);
    }, 1800);
  };

  const handleSaveAndUse = () => {
    onGenerated(generatedNums);
    playSound('success');
  };

  const isFormValid = (): boolean => {
    switch (selectedCategory) {
      case 'astro':
        return !!birthDate;
      case 'tarot':
        return selectedTarotCard !== null;
      case 'numerologia':
        return fullName.trim().length > 0 && !!birthDate;
      case 'fenShui':
        return true;
      case 'sonho':
        return true;
      case 'sincronicidade':
        return true;
      default:
        return false;
    }
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.25rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: '0.75rem',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0,
          }}
        >
          <span>🔮</span> GERADOR MÍSTICO
        </h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.25rem',
          }}
        >
          Gere números baseados em temas místicos para diversão.
        </p>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          fontSize: '0.55rem',
          color: '#ffd600',
          lineHeight: 1.5,
          padding: '0.4rem 0.6rem',
          borderRadius: '6px',
          background: 'rgba(255,214,0,0.05)',
          border: '1px solid rgba(255,214,0,0.12)',
        }}
      >
        ⚠️ <strong>Diversão apenas:</strong> O Gerador Místico é entretenimento.
        Os números são gerados por algoritmos — não há base científica.
      </div>

      {/* Category selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.4rem',
        }}
      >
        {MYSTIC_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setSelectedCategory(cat.key);
              playSound('click');
              setRevealPhase(0);
              setGeneratedNums([]);
              setLastCard(null);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.5rem 0.2rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor:
                selectedCategory === cat.key
                  ? 'rgba(147,9,143,0.5)'
                  : 'rgba(255,255,255,0.05)',
              background:
                selectedCategory === cat.key
                  ? 'rgba(147,9,143,0.1)'
                  : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
            <span
              style={{
                fontSize: '0.55rem',
                color:
                  selectedCategory === cat.key ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Category description */}
      <div
        style={{
          background: 'rgba(147,9,143,0.05)',
          border: '1px solid rgba(147,9,143,0.12)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
        }}
      >
        <p
          style={{
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {MYSTIC_CATEGORIES.find((c) => c.key === selectedCategory)?.desc}
        </p>
      </div>

      {/* ========== FORMS POR CATEGORIA ========== */}

      {/* ASTROLOGIA */}
      {selectedCategory === 'astro' && (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <label
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Data de nascimento
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '0.5rem',
              color: 'white',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
          <label
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Hora de nascimento (aproximada)
          </label>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '0.5rem',
              color: 'white',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
            A hora é usada para calcular a posição planetária no momento do
            nascimento.
          </span>
          {birthDate &&
            (() => {
              const [, m, d] = birthDate.split('-').map(Number);
              const zodiac = getZodiacSign(d, m);
              return (
                <div
                  style={{
                    fontSize: '0.6rem',
                    color: '#ff007f',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(147,9,143,0.08)',
                    border: '1px solid rgba(147,9,143,0.15)',
                  }}
                >
                  Seu signo: <strong>{zodiac.name}</strong> ({zodiac.dates}) —
                  Elemento: {zodiac.element}
                </div>
              );
            })()}
        </div>
      )}

      {/* TARÔ */}
      {selectedCategory === 'tarot' && (
        <div>
          <label
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: '0.4rem',
              display: 'block',
            }}
          >
            Selecione uma carta que &quot;chama sua atenção&quot;:
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.3rem',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {TAROT_CARDS.map((card, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedTarotCard(i);
                  playSound('click');
                }}
                style={{
                  padding: '0.4rem 0.2rem',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor:
                    selectedTarotCard === i
                      ? card.color
                      : 'rgba(255,255,255,0.05)',
                  background:
                    selectedTarotCard === i
                      ? `${card.color}18`
                      : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '36px',
                    borderRadius: '3px',
                    margin: '0 auto 0.2rem',
                    background:
                      selectedTarotCard === i
                        ? `linear-gradient(135deg, ${card.color}40, ${card.color}15)`
                        : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                    border: `1px solid ${selectedTarotCard === i ? card.color : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    color:
                      selectedTarotCard === i
                        ? card.color
                        : 'var(--text-muted)',
                    fontFamily: 'var(--font-numbers)',
                  }}
                >
                  {card.num === 0 ? '0' : card.num}
                </div>
                <div
                  style={{
                    fontSize: '0.42rem',
                    color:
                      selectedTarotCard === i ? 'white' : 'var(--text-muted)',
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {card.name}
                </div>
              </button>
            ))}
          </div>
          {selectedTarotCard !== null && (
            <div
              style={{
                fontSize: '0.55rem',
                color: TAROT_CARDS[selectedTarotCard].color,
                marginTop: '0.4rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                background: `${TAROT_CARDS[selectedTarotCard].color}08`,
                border: `1px solid ${TAROT_CARDS[selectedTarotCard].color}20`,
              }}
            >
              <strong>{TAROT_CARDS[selectedTarotCard].name}</strong> —{' '}
              {TAROT_CARDS[selectedTarotCard].meaning}
            </div>
          )}
        </div>
      )}

      {/* NUMEROLOGIA */}
      {selectedCategory === 'numerologia' && (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <div>
            <label
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'block',
                marginBottom: '0.2rem',
              }}
            >
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Maria Silva Santos"
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '0.5rem',
                color: 'white',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
              O nome completo revela vibrações numéricas únicas.
            </span>
          </div>
          <div>
            <label
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'block',
                marginBottom: '0.2rem',
              }}
            >
              Data de nascimento
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '0.5rem',
                color: 'white',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
          </div>
          {fullName.trim() &&
            birthDate &&
            (() => {
              const [y, m, d] = birthDate.split('-').map(Number);
              const dateStr = `${d}${m}${y}`;
              let lp = 0;
              for (const ch of dateStr) lp += parseInt(ch);
              while (lp > 9 && lp !== 11 && lp !== 22 && lp !== 33)
                lp = Math.floor(lp / 10) + (lp % 10);
              const vowels = 'aeiouáéíóúãõâêô';
              let su = 0;
              for (const ch of fullName.toLowerCase()) {
                if (vowels.includes(ch)) su += charToNum(ch);
              }
              while (su > 9 && su !== 11 && su !== 22)
                su = Math.floor(su / 10) + (su % 10);
              return (
                <div
                  style={{
                    fontSize: '0.55rem',
                    color: '#ff007f',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(147,9,143,0.08)',
                    border: '1px solid rgba(147,9,143,0.15)',
                  }}
                >
                  Caminho de Vida: <strong>{lp}</strong> · Alma:{' '}
                  <strong>{su}</strong>
                </div>
              );
            })()}
        </div>
      )}

      {/* FENG SHUI */}
      {selectedCategory === 'fenShui' && (
        <div>
          <label
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: '0.4rem',
              display: 'block',
            }}
          >
            Escolha seu elemento vital:
          </label>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
          >
            {FENG_SHUI_ELEMENTS.map((elem) => (
              <button
                key={elem.key}
                onClick={() => {
                  setSelectedElement(elem.key);
                  playSound('click');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.7rem',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor:
                    selectedElement === elem.key
                      ? elem.color
                      : 'rgba(255,255,255,0.05)',
                  background:
                    selectedElement === elem.key
                      ? `${elem.color}10`
                      : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>
                  {elem.label.split(' ')[1]}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color:
                        selectedElement === elem.key
                          ? 'white'
                          : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {elem.label.split(' ')[0]}
                  </div>
                  <div
                    style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}
                  >
                    {elem.desc} · {elem.seasons}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SONHO */}
      {selectedCategory === 'sonho' && (
        <div>
          <label
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: '0.25rem',
              display: 'block',
            }}
          >
            Descreva o que você sonhou:
          </label>
          <textarea
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            placeholder="Ex: Vi uma cobra verde nadando em um rio azul com muita água..."
            maxLength={200}
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: 'white',
              fontSize: '0.8rem',
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-body)',
            }}
          />
          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
            Quanto mais detalhes, mais únicos os números. Se vazio, usa o
            dicionário de sonhos padrão.
          </span>
          {dreamText.trim().length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '0.3rem',
                flexWrap: 'wrap',
                marginTop: '0.3rem',
              }}
            >
              {dreamText
                .toLowerCase()
                .split('')
                .filter(
                  (c, i, arr) => arr.indexOf(c) === i && /[a-záéíóúãõ]/.test(c)
                )
                .slice(0, 6)
                .map((c, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.5rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      background: 'rgba(147,9,143,0.1)',
                      color: '#ff007f',
                      border: '1px solid rgba(147,9,143,0.2)',
                    }}
                  >
                    {c} = {charToNum(c)}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SINCRONICIDADE */}
      {selectedCategory === 'sincronicidade' && (
        <div
          style={{
            textAlign: 'center',
            padding: '0.75rem',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🎲</span>
          <p
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              margin: '0.5rem 0 0 0',
              lineHeight: 1.5,
            }}
          >
            A Sincronicidade é a &quot;lei do acaso significativo&quot;.
            <br />
            Clique em gerar e o universo escolherá seus números.
          </p>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={revealPhase === 1 || !isFormValid()}
        style={{
          width: '100%',
          padding: '0.7rem',
          borderRadius: '10px',
          border: 'none',
          background:
            revealPhase === 1 || !isFormValid()
              ? 'rgba(147,9,143,0.3)'
              : 'linear-gradient(90deg, #93098f, #ff007f)',
          color: 'white',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor:
            revealPhase === 1 || !isFormValid() ? 'not-allowed' : 'pointer',
          opacity: revealPhase === 1 || !isFormValid() ? 0.5 : 1,
        }}
      >
        {revealPhase === 1
          ? '🔮 Consultando os astros...'
          : '🔮 Gerar Números Místicos'}
      </button>

      {/* Mystical message */}
      {mysticDesc && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.7rem',
            color: '#ff007f',
            fontStyle: 'italic',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.5,
            animation: 'fadeIn 0.5s ease',
          }}
        >
          &ldquo;{mysticDesc}&rdquo;
        </div>
      )}

      {/* Tarot card reveal */}
      {lastCard && (
        <div
          style={{
            textAlign: 'center',
            padding: '0.75rem',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${lastCard.color}10, ${lastCard.color}05)`,
            border: `1px solid ${lastCard.color}30`,
          }}
        >
          <div
            style={{
              width: '50px',
              height: '68px',
              borderRadius: '4px',
              margin: '0 auto 0.4rem',
              background: `linear-gradient(135deg, ${lastCard.color}30, ${lastCard.color}10)`,
              border: `2px solid ${lastCard.color}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 900,
              color: lastCard.color,
              fontFamily: 'var(--font-numbers)',
              boxShadow: `0 0 20px ${lastCard.color}30`,
            }}
          >
            {lastCard.num}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: lastCard.color,
            }}
          >
            {lastCard.name}
          </div>
          <div
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              marginTop: '0.15rem',
            }}
          >
            {lastCard.meaning}
          </div>
        </div>
      )}

      {/* Generated numbers */}
      {generatedNums.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {generatedNums.map((num, i) => (
              <div
                key={i}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, rgba(147,9,143,0.3), rgba(255,0,127,0.2))',
                  border: '2px solid rgba(147,9,143,0.6)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(147,9,143,0.4)',
                  fontFamily: 'var(--font-numbers)',
                  animation: `fadeIn 0.3s ease ${i * 0.15}s both`,
                }}
              >
                {String(num).padStart(2, '0')}
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveAndUse}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(0,230,118,0.3)',
              background: 'rgba(0,230,118,0.1)',
              color: '#00e676',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✓ Usar Estes Números
          </button>

          <button
            onClick={() => {
              setRevealPhase(0);
              setGeneratedNums([]);
              setMysticDesc('');
              setLastCard(null);
              setSelectedTarotCard(null);
            }}
            style={{
              padding: '0.3rem 1rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.65rem',
              cursor: 'pointer',
            }}
          >
            🔄 Gerar Novamente
          </button>
        </div>
      )}
    </div>
  );
}
