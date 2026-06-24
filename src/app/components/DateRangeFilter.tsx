'use client';

interface DateRangeFilterProps {
  dateStart: string;
  dateEnd: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  contestStart?: string;
  contestEnd?: string;
  onContestStartChange?: (val: string) => void;
  onContestEndChange?: (val: string) => void;
}

export default function DateRangeFilter({
  dateStart,
  dateEnd,
  onStartChange,
  onEndChange,
  contestStart,
  contestEnd,
  onContestStartChange,
  onContestEndChange,
}: DateRangeFilterProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '8px',
        border: '1px solid var(--glass-border)',
      }}
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Filtrar por:
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Data início:
        </span>
        <input
          type="date"
          value={dateStart}
          onChange={(e) => onStartChange(e.target.value)}
          style={{
            padding: '0.3rem 0.5rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            color: 'white',
            fontSize: '0.75rem',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Data fim:
        </span>
        <input
          type="date"
          value={dateEnd}
          onChange={(e) => onEndChange(e.target.value)}
          style={{
            padding: '0.3rem 0.5rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            color: 'white',
            fontSize: '0.75rem',
          }}
        />
      </div>

      {onContestStartChange && (
        <>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Concurso de:
            </span>
            <input
              type="number"
              value={contestStart || ''}
              onChange={(e) => onContestStartChange?.(e.target.value)}
              placeholder="Ex: 2500"
              style={{
                padding: '0.3rem 0.5rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.75rem',
                width: '80px',
              }}
            />
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              até:
            </span>
            <input
              type="number"
              value={contestEnd || ''}
              onChange={(e) => onContestEndChange?.(e.target.value)}
              placeholder="Ex: 2600"
              style={{
                padding: '0.3rem 0.5rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.75rem',
                width: '80px',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
