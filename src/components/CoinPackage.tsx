// Suppression de l'import React non utilisé
import { Coins, Sparkles, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CoinPackage as CoinPackageType } from '../types';

interface Props {
  package: CoinPackageType;
  onSelect: (pkg: CoinPackageType) => void;
}

export function CoinPackage({ package: pkg, onSelect }: Props) {
  const { t } = useTranslation();
  
  // Calculer le pourcentage de bonus si présent
  const bonusPercentage = pkg.bonus ? Math.round((pkg.bonus / pkg.amount) * 100) : 0;
  
  // Déterminer si c'est une offre populaire (pour les packages avec bonus)
  const isPopular = pkg.bonus && pkg.bonus > 0;
  
  return (
    <div 
      onClick={() => onSelect(pkg)}
      className="card-hover-effect bg-[var(--card-bg)] rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-sm)] relative overflow-hidden border border-[var(--border-dark)]"
    >
      {/* Badge populaire si applicable */}
      {isPopular && (
        <div className="absolute -right-10 top-5 bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white px-10 py-1 rotate-45 text-xs font-bold shadow-md">
          {t('popular', 'POPULAIRE')}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--tiktok-blue)] to-[var(--tiktok-red)] flex items-center justify-center">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="block text-sm text-[var(--text-secondary)]">TikTok</span>
            <span className="block font-bold">Coins</span>
          </div>
        </div>
        <span className="text-3xl font-extrabold tiktok-gradient-text">{pkg.amount.toLocaleString()}</span>
      </div>
      
      {/* Prix avec animation au survol */}
      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold">{pkg.price.toLocaleString()} FCFA</div>
          {pkg.bonus && pkg.bonus > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="w-4 h-4 text-[var(--tiktok-red)]" />
              <span className="text-sm font-medium text-[var(--tiktok-red)]">
                +{pkg.bonus} {t('freeCoins', 'coins gratuits')}
              </span>
            </div>
          )}
        </div>
        
        {bonusPercentage > 0 && (
          <div className="flex items-center gap-1 bg-green-900 bg-opacity-30 dark-mode-bonus px-2 py-1 rounded-full text-sm font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+{bonusPercentage}%</span>
          </div>
        )}
      </div>
      
      {/* Bouton d'achat qui apparaît au survol */}
      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="w-full py-2 bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white rounded-full font-medium">
          {t('buyNow', 'Acheter maintenant')}
        </button>
      </div>
    </div>
  );
}