'use client';

interface UpgradeModalProps {
  priceMonthly: number;
  priceAnnual: number;
  isAnnual: boolean;
  onPlanChange: (annual: boolean) => void;
  checkoutLoading: boolean;
  checkoutError: string | null;
  paymentData: {
    payment_id: string;
    qr_image_url: string;
    qr_code: string;
  } | null;
  paymentStatus: string | null;
  pixCopied: boolean;
  onStartPixCheckout: () => void;
  onStartStripeCheckout: () => void;
  onSimulatePayment: () => void;
  onCopyPix: (text: string) => void;
  onClose: () => void;
}

export default function UpgradeModal({
  priceMonthly,
  priceAnnual,
  isAnnual,
  onPlanChange,
  checkoutLoading,
  checkoutError,
  paymentData,
  paymentStatus,
  pixCopied,
  onStartPixCheckout,
  onStartStripeCheckout,
  onSimulatePayment,
  onCopyPix,
  onClose,
}: UpgradeModalProps) {
  return (
    <div className="modal-overlay" role="presentation">
      <div
        className="modal-content-wrapper upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>

        <div className="upgrade-modal-header">
          <span className="upgrade-modal-mark" aria-hidden="true">
            PRO
          </span>
          <h2
            id="upgrade-modal-title"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.25rem',
              fontWeight: 900,
              background: 'linear-gradient(90deg, #ff007f, #ffd600)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginTop: '0.25rem',
            }}
          >
            MEU TREVO PRO
          </h2>
          <p className="upgrade-modal-subtitle">
            Mais controle para montar, analisar e acompanhar seus jogos.
          </p>
        </div>

        {!checkoutLoading && !paymentData && (
          <>
            <div className="upgrade-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span>
                  <strong>Desdobramentos Otimizados:</strong> Wheeling avançado
                  com garantias de Quina e Quadra.
                </span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span>
                  <strong>Gerador Alternativo:</strong> Combinações recreativas
                  com diferentes formas de seleção.
                </span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span>
                  <strong>Central Financeira:</strong> Gerenciador de despesas
                  de apostas e ROI.
                </span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span>
                  <strong>Temas Exclusivos:</strong> Cyberpunk, Matrix, Dracula
                  e Ice.
                </span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span>
                  <strong>Filtros Customizados:</strong> Análise de até 100
                  sorteios.
                </span>
              </div>
            </div>

            <div
              role="group"
              aria-label="Periodicidade da assinatura"
              className="upgrade-plans"
            >
              <button
                type="button"
                aria-pressed={!isAnnual}
                className={`upgrade-plan ${!isAnnual ? 'is-selected' : ''}`}
                onClick={() => onPlanChange(false)}
              >
                <span>Mensal</span>
                <small>flexível</small>
              </button>
              <button
                type="button"
                aria-pressed={isAnnual}
                className={`upgrade-plan ${isAnnual ? 'is-selected' : ''}`}
                onClick={() => onPlanChange(true)}
              >
                <span>Anual</span>
                <small>economize</small>
                <b>melhor valor</b>
              </button>
            </div>

            <div className="upgrade-price-panel">
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  display: 'block',
                }}
              >
                Acesso {isAnnual ? 'Anual' : 'Mensal'} Pro
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: '0.25rem',
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>R$</span>
                <span
                  style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: 'white',
                    fontFamily: 'var(--font-numbers)',
                  }}
                >
                  {(isAnnual ? priceAnnual : priceMonthly)
                    .toFixed(2)
                    .replace('.', ',')}
                </span>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                >
                  /{isAnnual ? 'ano' : 'mês'}
                </span>
              </div>
              {isAnnual && (
                <span style={{ fontSize: '0.7rem', color: '#00e676' }}>
                  Equivale a R${' '}
                  {(priceAnnual / 12).toFixed(2).replace('.', ',')} por mês
                </span>
              )}
            </div>

            {checkoutError && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#ff8a80',
                  background: 'rgba(255,68,102,0.08)',
                  border: '1px solid rgba(255,68,102,0.18)',
                  padding: '0.55rem 0.65rem',
                  borderRadius: '8px',
                }}
              >
                {checkoutError}
              </div>
            )}

            <div className="upgrade-payment-actions">
              <button
                className="btn-action upgrade-payment upgrade-payment-pix"
                onClick={onStartPixCheckout}
                style={{
                  background: 'linear-gradient(90deg, #ff007f, #ffd600)',
                  color: 'black',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(255, 0, 127, 0.3)',
                }}
              >
                ASSINAR COM PIX
              </button>
              <button
                className="btn-action upgrade-payment upgrade-payment-stripe"
                onClick={onStartStripeCheckout}
                style={{
                  background: 'rgba(99, 91, 255, 0.14)',
                  border: '1px solid rgba(99, 91, 255, 0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                ASSINAR COM STRIPE
              </button>
            </div>
          </>
        )}

        {checkoutLoading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem 0',
              gap: '1rem',
            }}
          >
            <div className="loading-spinner"></div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Preparando checkout seguro...
            </span>
          </div>
        )}

        {paymentData && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {paymentStatus === 'completed' ? (
              <div
                style={{ padding: '1.5rem 0', animation: 'fade-in 0.3s ease' }}
              >
                <span
                  style={{
                    fontSize: '3rem',
                    display: 'block',
                    animation:
                      'scale-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                >
                  ✅
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: '#00e676',
                    fontSize: '1.1rem',
                    margin: '0.5rem 0',
                  }}
                >
                  PAGAMENTO CONFIRMADO!
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Seja bem-vindo ao <strong>Plano Pro</strong>. Os recursos
                  premium foram liberados instantaneamente!
                </p>
              </div>
            ) : (
              <>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#ffd600',
                    fontWeight: 'bold',
                    marginBottom: '0.25rem',
                  }}
                >
                  PAGAMENTO DO ASSINANTE
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Escaneie o QR Code abaixo ou use o Pix Copia e Cola.
                </p>

                <div className="pix-qr-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentData.qr_image_url}
                    alt="Pix QR Code"
                    style={{
                      width: '150px',
                      height: '150px',
                      display: 'block',
                    }}
                  />
                </div>

                <div
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    marginTop: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      fontWeight: 'bold',
                    }}
                  >
                    Pix Copia e Cola:
                  </span>
                  <div className="pix-copia-cola-box">
                    <input
                      type="text"
                      autoComplete="off"
                      readOnly
                      value={paymentData.qr_code}
                      className="pix-input"
                    />
                    <button
                      className="pix-copy-btn"
                      onClick={() => onCopyPix(paymentData.qr_code)}
                    >
                      {pixCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="loading-spinner"
                    style={{ margin: 0, width: '16px', height: '16px' }}
                  ></span>
                  <span
                    style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                  >
                    Aguardando confirmação Pix...
                  </span>
                </div>

                {paymentData.payment_id.startsWith('mock_dep_') && (
                  <div
                    style={{
                      marginTop: '1rem',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      paddingTop: '0.75rem',
                      width: '100%',
                    }}
                  >
                    <span className="sandbox-badge">
                      MODO AMBIENTE DE TESTE
                    </span>
                    <button
                      onClick={onSimulatePayment}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 230, 118, 0.15)',
                        border: '1px solid #00e676',
                        color: '#00e676',
                        fontSize: '0.75rem',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginTop: '0.5rem',
                        transition: 'background 0.2s',
                      }}
                    >
                      💸 SIMULAR PAGAMENTO CONFIRMADO
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
