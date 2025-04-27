import React from 'react';
import { Coins } from 'lucide-react';
import { CoinPackage as CoinPackageType } from '../types';

interface Props {
  package: CoinPackageType;
  onSelect: (pkg: CoinPackageType) => void;
}

export function CoinPackage({ package: pkg, onSelect }: Props) {
  return (
    <div 
      onClick={() => onSelect(pkg)}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-pink-500"
    >
      <div className="flex items-center justify-between mb-4">
        <Coins className="w-8 h-8 text-yellow-500" />
        <span className="text-2xl font-bold text-pink-500">{pkg.amount}</span>
      </div>
      
      {pkg.bonus && (
        <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm mb-3">
          +{pkg.bonus} bonus
        </div>
      )}
      
      <div className="text-xl font-bold">{pkg.price.toLocaleString()} FCFA</div>
    </div>
  );
}