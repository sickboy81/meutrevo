'use client';

import React from 'react';

interface VolanteGridProps {
  mode: 'filter' | 'wheeling' | 'simulator';
  minNum: number;
  maxNum: number;
  selectedList: number[];
  filtersMap?: Record<number, 'fixed' | 'excluded' | 'none'>;
  onSelect: (num: number) => void;
}

export default function VolanteGrid({
  mode,
  minNum,
  maxNum,
  selectedList,
  filtersMap,
  onSelect,
}: VolanteGridProps) {
  const balls = [];
  const isCompact = maxNum - minNum + 1 <= 31;

  for (let i = minNum; i <= maxNum; i++) {
    let extraClass = '';
    let style: React.CSSProperties = {};

    if (mode === 'filter' && filtersMap) {
      const status = filtersMap[i] || 'none';
      if (status === 'fixed') {
        extraClass = 'selected';
        style = {
          '--active-color': '#00e676',
          '--active-glow': 'rgba(0, 230, 118, 0.4)',
        } as React.CSSProperties;
      } else if (status === 'excluded') {
        extraClass = 'selected';
        style = {
          '--active-color': '#ff1744',
          '--active-glow': 'rgba(255, 23, 68, 0.4)',
        } as React.CSSProperties;
      }
    } else {
      if (selectedList.includes(i)) {
        extraClass = 'selected';
      }
    }

    balls.push(
      <button
        key={i}
        className={`volante-ball ${extraClass}`}
        style={style}
        onClick={() => onSelect(i)}
      >
        {String(i).padStart(2, '0')}
      </button>
    );
  }

  return (
    <div className={`volante-grid ${isCompact ? 'compact' : ''}`}>{balls}</div>
  );
}
