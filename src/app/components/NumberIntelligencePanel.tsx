import type { NumberTemperature } from '@/schemas/game-intelligence';

interface NumberIntelligencePanelProps {
  selectedNumbers: number[];
  numberTemperatures: NumberTemperature[];
}

type TemperatureClassification = NumberTemperature['classification'];

const groups: Array<{
  classification: TemperatureClassification;
  title: string;
}> = [
  { classification: 'quente', title: 'Quentes' },
  { classification: 'neutra', title: 'Neutras' },
  { classification: 'fria', title: 'Frias' },
];

function formatNumber(number: number) {
  return String(number).padStart(2, '0');
}

function formatDelay(delay: number) {
  return `Atraso: ${delay} ${delay === 1 ? 'concurso' : 'concursos'}`;
}

function NumberDetails({ temperature }: { temperature?: NumberTemperature }) {
  if (!temperature) {
    return (
      <dl style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        <div>
          <dt>Frequência</dt>
          <dd>Frequência: indisponível</dd>
        </div>
        <div>
          <dt>Atraso</dt>
          <dd>Atraso: indisponível</dd>
        </div>
        <div>
          <dt>Última ocorrência</dt>
          <dd>Última ocorrência: indisponível</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
      <div>
        <dt>Frequência</dt>
        <dd>Frequência: {temperature.frequency}</dd>
      </div>
      <div>
        <dt>Atraso</dt>
        <dd>{formatDelay(temperature.delay)}</dd>
      </div>
      <div>
        <dt>Última ocorrência</dt>
        <dd>
          {temperature.lastOccurrence === null
            ? 'Última ocorrência: indisponível'
            : `Última ocorrência: concurso ${temperature.lastOccurrence}`}
        </dd>
      </div>
    </dl>
  );
}

export default function NumberIntelligencePanel({
  selectedNumbers,
  numberTemperatures,
}: NumberIntelligencePanelProps) {
  const temperaturesByNumber = new Map(
    numberTemperatures.map((temperature) => [temperature.number, temperature])
  );

  return (
    <section
      aria-labelledby="number-intelligence-panel-title"
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        padding: '1rem',
        border: '1px solid var(--glass-border)',
        borderRadius: '0.75rem',
        background: 'var(--bg-secondary)',
      }}
    >
      <h2
        id="number-intelligence-panel-title"
        style={{ fontSize: '1rem', color: 'var(--text-main)' }}
      >
        Inteligência das dezenas
      </h2>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {groups.map((group) => {
          const numbers = selectedNumbers.filter(
            (number) =>
              temperaturesByNumber.get(number)?.classification ===
                group.classification ||
              (!temperaturesByNumber.has(number) &&
                group.classification === 'fria')
          );
          const headingId = `number-temperature-${group.classification}`;

          return (
            <section key={group.classification} aria-labelledby={headingId}>
              <h3 id={headingId} style={{ fontSize: '0.9375rem' }}>
                {group.title} ({numbers.length})
              </h3>
              {numbers.length === 0 ? (
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                  Nenhuma dezena selecionada nesta classificacao.
                </p>
              ) : (
                <ul
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                    listStyle: 'none',
                  }}
                >
                  {numbers.map((number) => {
                    const temperature = temperaturesByNumber.get(number);

                    return (
                      <li
                        key={number}
                        style={{
                          flex: '1 1 13rem',
                          minWidth: 0,
                          maxWidth: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-glow)',
                          borderRadius: '0.5rem',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        <strong
                          aria-label={`Dezena ${formatNumber(number)}`}
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: 'var(--accent-color)',
                            fontSize: '1.125rem',
                          }}
                        >
                          {formatNumber(number)}
                        </strong>
                        <NumberDetails temperature={temperature} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <p
        style={{
          marginTop: '1rem',
          color: 'var(--text-muted)',
          fontSize: '0.8125rem',
          overflowWrap: 'anywhere',
        }}
      >
        Analise historica descritiva; nao representa previsao de premio.
      </p>
    </section>
  );
}
