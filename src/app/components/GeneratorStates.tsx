'use client';

import { useState } from 'react';
import type { GameMetrics } from '../../lib/lottery-math';

export type GeneratorStateObject = {
  intensity: 'balanced' | 'aggressive' | 'surpresa' | 'delayed';
  setIntensity: (v: 'balanced' | 'aggressive' | 'surpresa' | 'delayed') => void;
  gameQuantity: number;
  setGameQuantity: (v: number) => void;
  filtersMap: Record<number, 'fixed' | 'excluded' | 'none'>;
  setFiltersMap: (v: Record<number, 'fixed' | 'excluded' | 'none'>) => void;
  generatedGames: { numbers: number[]; metrics: GameMetrics }[];
  setGeneratedGames: (v: { numbers: number[]; metrics: GameMetrics }[]) => void;
  selectedForPool: string[];
  setSelectedForPool: (v: string[]) => void;
  bolaoText: string;
  setBolaoText: (v: string) => void;
  bolaoShareUrl: string;
  setBolaoShareUrl: (v: string) => void;
  bolaoCotas: string;
  setBolaoCotas: (v: string) => void;
  bolaoTaxa: string;
  setBolaoTaxa: (v: string) => void;
  copyFeedback: string;
  setCopyFeedback: (v: string) => void;
  avoidConsecutive: boolean;
  setAvoidConsecutive: (v: boolean) => void;
  customSumMin: string;
  setCustomSumMin: (v: string) => void;
  customSumMax: string;
  setCustomSumMax: (v: string) => void;
  maxRepeats: string;
  setMaxRepeats: (v: string) => void;
  showTutorial: boolean;
  setShowTutorial: (v: boolean) => void;
  tutorialStep: number;
  setTutorialStep: (v: number) => void;
  showExportImport: boolean;
  setShowExportImport: (v: boolean) => void;
  showCamera: boolean;
  setShowCamera: (v: boolean) => void;
  wheelSelectedNums: number[];
  setWheelSelectedNums: (v: number[]) => void;
  wheelGuarantee: 'full' | 'quadra' | 'quina';
  setWheelGuarantee: (v: 'full' | 'quadra' | 'quina') => void;
  wheelGeneratedGames: number[][];
  setWheelGeneratedGames: (v: number[][]) => void;
  showRateio: boolean;
  setShowRateio: (v: boolean) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
};

interface GeneratorStatesProps {
  children: (state: GeneratorStateObject) => React.ReactNode;
  playSound: (type: 'click' | 'success' | 'delete') => void;
}

export default function GeneratorStates({ children }: GeneratorStatesProps) {
  const [intensity, setIntensity] = useState<
    'balanced' | 'aggressive' | 'surpresa' | 'delayed'
  >('balanced');
  const [gameQuantity, setGameQuantity] = useState<number>(1);
  const [filtersMap, setFiltersMap] = useState<
    Record<number, 'fixed' | 'excluded' | 'none'>
  >({});
  const [generatedGames, setGeneratedGames] = useState<
    { numbers: number[]; metrics: GameMetrics }[]
  >([]);
  const [selectedForPool, setSelectedForPool] = useState<string[]>([]);
  const [bolaoText, setBolaoText] = useState<string>('');
  const [bolaoShareUrl, setBolaoShareUrl] = useState<string>('');
  const [bolaoCotas, setBolaoCotas] = useState<string>('5');
  const [bolaoTaxa, setBolaoTaxa] = useState<string>('0');
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const [avoidConsecutive, setAvoidConsecutive] = useState<boolean>(false);
  const [customSumMin, setCustomSumMin] = useState<string>('');
  const [customSumMax, setCustomSumMax] = useState<string>('');
  const [maxRepeats, setMaxRepeats] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [showExportImport, setShowExportImport] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [wheelSelectedNums, setWheelSelectedNums] = useState<number[]>([]);
  const [wheelGuarantee, setWheelGuarantee] = useState<
    'full' | 'quadra' | 'quina'
  >('full');
  const [wheelGeneratedGames, setWheelGeneratedGames] = useState<number[][]>(
    []
  );
  const [showRateio, setShowRateio] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  return (
    <>
      {children({
        intensity,
        setIntensity,
        gameQuantity,
        setGameQuantity,
        filtersMap,
        setFiltersMap,
        generatedGames,
        setGeneratedGames,
        selectedForPool,
        setSelectedForPool,
        bolaoText,
        setBolaoText,
        bolaoShareUrl,
        setBolaoShareUrl,
        bolaoCotas,
        setBolaoCotas,
        bolaoTaxa,
        setBolaoTaxa,
        copyFeedback,
        setCopyFeedback,
        avoidConsecutive,
        setAvoidConsecutive,
        customSumMin,
        setCustomSumMin,
        customSumMax,
        setCustomSumMax,
        maxRepeats,
        setMaxRepeats,
        showTutorial,
        setShowTutorial,
        tutorialStep,
        setTutorialStep,
        showExportImport,
        setShowExportImport,
        showCamera,
        setShowCamera,
        wheelSelectedNums,
        setWheelSelectedNums,
        wheelGuarantee,
        setWheelGuarantee,
        wheelGeneratedGames,
        setWheelGeneratedGames,
        showRateio,
        setShowRateio,
        showFilters,
        setShowFilters,
      })}
    </>
  );
}
