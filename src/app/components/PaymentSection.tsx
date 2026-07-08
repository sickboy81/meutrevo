'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithCsrf } from '@/lib/fetch';
import type { User } from '../types';
import UpgradeModal from './UpgradeModal';

interface PaymentSectionProps {
  user: User | null;
  isPro: boolean;
  playSound: (type: 'click' | 'success' | 'delete') => void;
  onPaymentSuccess: () => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (v: boolean) => void;
}

export default function PaymentSection({
  user,
  isPro,
  playSound,
  onPaymentSuccess,
  showUpgradeModal,
  setShowUpgradeModal,
}: PaymentSectionProps) {
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState<{
    payment_id: string;
    qr_image_url: string;
    qr_code: string;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [priceMonthly, setPriceMonthly] = useState<number>(14.9);
  const [priceAnnual, setPriceAnnual] = useState<number>(129.9);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch pricing on mount
  useEffect(() => {
    fetchWithCsrf('/api/config')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.config) {
          setPriceMonthly(parseFloat(d.config.price_monthly) || 14.9);
          setPriceAnnual(parseFloat(d.config.price_annual) || 129.9);
        }
      })
      .catch(() => {});
  }, []);

  const startPollingPayment = useCallback(
    (id: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);

      const interval = setInterval(async () => {
        try {
          const res = await fetchWithCsrf(`/api/payments/status?id=${id}`);
          if (res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
              const status = result.data.status;
              setPaymentStatus(status);
              if (status === 'completed') {
                clearInterval(interval);
                pollingRef.current = null;
                playSound('success');
                onPaymentSuccess();
                setTimeout(() => {
                  setShowUpgradeModal(false);
                  setPaymentData(null);
                  setPaymentStatus(null);
                }, 3000);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 4000);
      pollingRef.current = interval;
    },
    [playSound, onPaymentSuccess, setShowUpgradeModal]
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleStartCheckout = async (provider: 'pixgo' | 'stripe') => {
    if (!user) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    setPaymentData(null);
    setPaymentStatus('pending');
    try {
      const res = await fetchWithCsrf('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: isAnnual ? 'annual' : 'monthly',
          provider,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success && result.data) {
        if (provider === 'stripe' && result.data.checkout_url) {
          window.location.assign(result.data.checkout_url);
          return;
        }
        setPaymentData(result.data);
        startPollingPayment(result.data.payment_id);
      } else {
        setCheckoutError(
          result.error || 'Não foi possível iniciar o checkout.'
        );
      }
    } catch (e) {
      console.error(e);
      setCheckoutError('Erro de conexão ao iniciar o pagamento.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSimulatePaymentConfirm = async () => {
    if (!paymentData) return;
    try {
      const res = await fetchWithCsrf(
        `/api/payments/status?id=${paymentData.payment_id}&confirm=true`
      );
      if (res.ok) {
        const result = await res.json();
        if (
          result.success &&
          result.data &&
          result.data.status === 'completed'
        ) {
          setPaymentStatus('completed');
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          playSound('success');
          onPaymentSuccess();
          setTimeout(() => {
            setShowUpgradeModal(false);
            setPaymentData(null);
            setPaymentStatus(null);
          }, 3000);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPix = (text: string) => {
    navigator.clipboard.writeText(text);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleCloseModal = () => {
    setShowUpgradeModal(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPaymentData(null);
    setPaymentStatus(null);
    setCheckoutError(null);
  };

  if (!showUpgradeModal) return null;

  return (
    <UpgradeModal
      priceMonthly={priceMonthly}
      checkoutLoading={checkoutLoading}
      checkoutError={checkoutError}
      paymentData={paymentData}
      paymentStatus={paymentStatus}
      pixCopied={pixCopied}
      onStartPixCheckout={() => handleStartCheckout('pixgo')}
      onStartStripeCheckout={() => handleStartCheckout('stripe')}
      onSimulatePayment={handleSimulatePaymentConfirm}
      onCopyPix={handleCopyPix}
      onClose={handleCloseModal}
    />
  );
}
