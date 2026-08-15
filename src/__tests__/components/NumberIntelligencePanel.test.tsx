import { render, screen } from '@testing-library/react';
import type { NumberTemperature } from '@/schemas/game-intelligence';
import NumberIntelligencePanel from '@/app/components/NumberIntelligencePanel';

const temperatures: NumberTemperature[] = [
  {
    number: 3,
    classification: 'quente',
    frequency: 18,
    recentFrequency: 5,
    delay: 1,
    lastOccurrence: 2788,
  },
  {
    number: 12,
    classification: 'neutra',
    frequency: 10,
    recentFrequency: 2,
    delay: 4,
    lastOccurrence: 2785,
  },
  {
    number: 27,
    classification: 'fria',
    frequency: 3,
    recentFrequency: 0,
    delay: 22,
    lastOccurrence: null,
  },
];

describe('NumberIntelligencePanel', () => {
  it('agrupa as dezenas selecionadas por temperatura e informa seus indicadores', () => {
    render(
      <NumberIntelligencePanel
        selectedNumbers={[3, 12, 27, 42]}
        numberTemperatures={temperatures}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Inteligência das dezenas' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Quentes (1)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Neutras (1)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Frias (2)' })
    ).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Frequência: 18')).toBeInTheDocument();
    expect(screen.getByText('Atraso: 1 concurso')).toBeInTheDocument();
    expect(
      screen.getByText('Última ocorrência: concurso 2788')
    ).toBeInTheDocument();
    expect(screen.getByText('Frequência: indisponível')).toBeInTheDocument();
    expect(screen.getByText('Atraso: indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Última ocorrência: indisponível')).toHaveLength(
      2
    );
    expect(
      screen.getByText(
        'Analise historica descritiva; nao representa previsao de premio.'
      )
    ).toBeInTheDocument();
  });
});
