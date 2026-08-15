import { render, screen } from '@testing-library/react';
import type { GameScore } from '@/schemas/game-intelligence';
import GameScoreCard from '@/app/components/GameScoreCard';

const score: GameScore = {
  total: 78,
  label: 'Boa aderencia',
  criteria: [
    {
      id: 'paridade',
      title: 'Paridade',
      points: 18,
      maxPoints: 25,
      explanation: 'A distribuicao de pares e impares esta na faixa analisada.',
    },
  ],
  disclaimer:
    'Score de aderencia historica; nao representa previsao de premio.',
};

describe('GameScoreCard', () => {
  it('exibe o score, cada criterio e o aviso historico nao preditivo', () => {
    render(<GameScoreCard score={score} />);

    expect(
      screen.getByRole('heading', { name: 'Aderência histórica' })
    ).toBeInTheDocument();
    expect(screen.getByText('78/100')).toBeInTheDocument();
    expect(screen.getByText('Boa aderencia')).toBeInTheDocument();
    expect(screen.getByText('Paridade')).toBeInTheDocument();
    expect(screen.getByText('18/25 pontos')).toBeInTheDocument();
    expect(
      screen.getByText(
        'A distribuicao de pares e impares esta na faixa analisada.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Score de aderencia historica; nao representa previsao de premio.'
      )
    ).toBeInTheDocument();
  });
});
