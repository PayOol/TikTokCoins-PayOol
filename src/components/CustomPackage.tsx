import React, { useState, useEffect } from 'react';
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
    <div className={`card-hover-effect bg-[var(--card-bg)] rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-sm)] relative overflow-hidden border border-[var(--border-dark)] ${isAnimating ? 'animate-pulse' : ''}`}>
      {/* En-tête avec icône et titre */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-[var(--tiktok-red)] flex items-center justify-center">
          <Edit3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="block text-sm text-[var(--text-secondary)]">Montant</span>
          <span className="block font-bold text-lg">Personnalisé</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="customAmount" className="tiktok-label flex items-center gap-2">
            <Coins className="w-4 h-4 text-[var(--tiktok-red)]" />
            <span>Nombre de pièces</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="customAmount"
              min="70"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tiktok-input pr-12"
              placeholder="Minimum 70 pièces"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              coins
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
            <Calculator className="w-3 h-3" />
            <span>Prix unitaire: {PRICE_PER_COIN.toFixed(2)} FCFA / coin</span>
          </p>
        </div>

        {/* Affichage du prix calculé avec animation */}
        <div className="bg-[var(--background-elevated-2)] p-4 rounded-[var(--radius-md)] transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)]">Total à payer:</span>
            <span className={`text-2xl font-bold tiktok-gradient-text transition-all duration-300 ${price > 0 ? 'scale-100' : 'scale-95 opacity-50'}`}>
              {price > 0 ? price.toLocaleString() : '0'} FCFA
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="tiktok-button w-full flex items-center justify-center gap-2"
          disabled={!amount || parseInt(amount, 10) < 70}
        >
          <span>Acheter maintenant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}