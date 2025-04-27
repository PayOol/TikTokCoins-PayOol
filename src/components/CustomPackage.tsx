import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { CoinPackage } from '../types';

interface Props {
  onSelect: (pkg: CoinPackage) => void;
}

const PRICE_PER_COIN = 11.24; // Prix par pièce en FCFA

export function CustomPackage({ onSelect }: Props) {
  const [amount, setAmount] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coinAmount = parseInt(amount, 10);
    if (coinAmount >= 70) { // Minimum 70 pièces
      onSelect({
        id: 0,
        amount: coinAmount,
        price: Math.round(coinAmount * PRICE_PER_COIN),
        isCustom: true
      });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-pink-200">
      <div className="flex items-center justify-between mb-4">
        <Coins className="w-8 h-8 text-pink-500" />
        <span className="text-lg font-medium text-gray-600">Montant personnalisé</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de pièces (min. 70)
          </label>
          <input
            type="number"
            id="customAmount"
            min="70"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Entrez le montant..."
            required
          />
        </div>

        {amount && parseInt(amount, 10) >= 70 && (
          <div className="text-right text-lg font-bold">
            {Math.round(parseInt(amount, 10) * PRICE_PER_COIN).toLocaleString()} FCFA
          </div>
        )}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!amount || parseInt(amount, 10) < 70}
        >
          Sélectionner
        </button>
      </form>
    </div>
  );
}