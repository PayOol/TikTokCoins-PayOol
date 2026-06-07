import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Coins, Edit3, Calculator, ArrowRight } from 'lucide-react';
import { CoinPackage } from '../types';

interface Props {
  onSelect: (pkg: CoinPackage) => void;
}

const PRICE_PER_COIN = 11.24; // Prix par pièce en FCFA

export function CustomPackage({ onSelect }: Props) {
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const { t } = useTranslation();
  
  // Mettre à jour le prix lorsque le montant change
  useEffect(() => {
    const coinAmount = parseInt(amount, 10);
    if (!isNaN(coinAmount) && coinAmount >= 70) {
      setPrice(Math.round(coinAmount * PRICE_PER_COIN));
    } else {
      setPrice(0);
    }
  }, [amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coinAmount = parseInt(amount, 10);
    if (coinAmount >= 70) { // Minimum 70 pièces
      setIsAnimating(true);
      
      // Animation avant de sélectionner
      setTimeout(() => {
        onSelect({
          id: 0,
          amount: coinAmount,
          price: Math.round(coinAmount * PRICE_PER_COIN),
          isCustom: true
        });
        setIsAnimating(false);
      }, 500);
    }
  };

  return (
        <div className={`card-hover-effect bg-[var(--card-bg)] rounded-[var(--radius-md)] p-4 sm:p-6 shadow-[var(--shadow-sm)] relative overflow-hidden border border-[var(--border-dark)] col-span-2 md:col-span-2 lg:col-span-3 ${isAnimating ? 'animate-pulse' : ''}`}>
      {/* En-tête avec icône et titre */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-[var(--tiktok-red)] flex items-center justify-center">
          <Edit3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">{t('customAmount')}</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{t('customPackage')}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div>
          <label htmlFor="customAmount" className="tiktok-label flex items-center gap-2">
            <label htmlFor="custom-amount" className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-2">
              {t('minimumCoins')}
            </label>
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
          </label>
          <div className="relative">
            <input
              type="number"
              id="customAmount"
              min="70"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tiktok-input pr-12 text-sm sm:text-base"
              placeholder={t('enterCustomAmount')}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-xs sm:text-sm">
              {t('coins')}
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
            <Calculator className="w-3 h-3" />
            <span>{t('unitPrice')}: {PRICE_PER_COIN.toFixed(2)} FCFA / {t('coins')}</span>
          </p>
        </div>

        {/* Affichage du prix calculé avec animation */}
        <div className="bg-[var(--background-elevated-2)] p-3 sm:p-4 rounded-[var(--radius-md)] transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-[var(--text-secondary)]">{t('totalToPay')}:</span>
            <span className={`text-xl sm:text-2xl font-bold tiktok-gradient-text transition-all duration-300 ${price > 0 ? 'scale-100' : 'scale-95 opacity-50'}`}>
              {price > 0 ? price.toLocaleString() : '0'} FCFA
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="tiktok-button w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
          disabled={!amount || parseInt(amount, 10) < 70}
        >
          <span>{t('buyNow')}</span>
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </form>
    </div>
  );
}