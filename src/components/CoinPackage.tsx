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
      onClick={() => !pkg.disabled && onSelect(pkg)}
      className={`card-hover-effect bg-[var(--card-bg)] rounded-[var(--radius-md)] p-4 sm:p-6 shadow-[var(--shadow-sm)] relative overflow-hidden border border-[var(--border-dark)] group ${
        pkg.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {/* Badge populaire */}
      {!pkg.disabled && isPopular && (
        <div className="absolute -right-8 sm:-right-10 top-4 sm:top-5 bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white px-6 sm:px-10 py-0.5 sm:py-1 rotate-45 text-xs font-bold shadow-md">
          {t('popular', 'POPULAIRE')}
        </div>
      )}
      
      {/* Badge indisponible au centre-bas */}
      {pkg.disabled && (
        <div className="absolute inset-x-0 bottom-8 pointer-events-none">
          <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-2 text-center text-sm font-bold shadow-lg">
            {t('unavailable', 'INDISPONIBLE')}
          </div>
        </div>
      )}
      
      <div className={`flex items-center justify-between mb-4 sm:mb-6 ${pkg.disabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[var(--tiktok-blue)] to-[var(--tiktok-red)] flex items-center justify-center">
            <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <span className="block text-xs sm:text-sm text-[var(--text-secondary)]">TikTok</span>
            <span className="block text-sm sm:text-base font-bold">Coins</span>
          </div>
        </div>
        <span className="text-2xl sm:text-3xl font-extrabold tiktok-gradient-text">{pkg.amount.toLocaleString()}</span>
      </div>
      
      {/* Prix avec animation au survol */}
      <div className={`mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 ${pkg.disabled ? 'opacity-50' : ''}`}>
        <div>
          <div className="text-xl sm:text-2xl font-bold">{pkg.price.toLocaleString()} FCFA</div>
          {pkg.bonus && pkg.bonus > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
              <span className="text-xs sm:text-sm font-medium text-[var(--tiktok-red)]">
                +{pkg.bonus} {t('freeCoins', 'coins gratuits')}
              </span>
            </div>
          )}
        </div>
        
        {bonusPercentage > 0 && (
          <div className="flex items-center gap-1 bg-green-900 bg-opacity-30 dark-mode-bonus px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+{bonusPercentage}%</span>
          </div>
        )}
      </div>
      
      {/* Bouton d'achat */}
      <div className="mt-3 sm:mt-4">
        <button className="w-full py-2 bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white rounded-full font-medium text-sm sm:text-base">
          {t('buyNow', 'Acheter maintenant')}
        </button>
      </div>
    </div>
  );
}