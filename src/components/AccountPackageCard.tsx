import { useTranslation } from 'react-i18next';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { AccountPackage } from '../types';

interface Props {
  package: AccountPackage;
  onSelect: (pkg: AccountPackage) => void;
}

export function AccountPackageCard({ package: pkg, onSelect }: Props) {
  const { t } = useTranslation();
  const key = pkg.translationKey;

  const getIcon = () => {
    if (pkg.popular) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (pkg.id === 3) return <Star className="w-5 h-5 text-purple-400" />;
    return <Zap className="w-5 h-5 text-[var(--tiktok-blue)]" />;
  };

  const features = t(`accountPackagesList.${key}.features`, { returnObjects: true }) as string[];

  return (
    <div className={`tiktok-card relative flex flex-col h-full ${pkg.popular ? 'border-2 border-[var(--tiktok-red)]' : ''}`}>
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[var(--tiktok-red)] to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
          {t('popular')}
        </div>
      )}

      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3">
          {getIcon()}
          <h3 className="text-base sm:text-xl font-bold leading-tight">{t(`accountPackagesList.${key}.name`)}</h3>
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-2 sm:mb-4">
          {t(`accountPackagesList.${key}.description`)}
        </p>

        <div className="mb-2 sm:mb-4">
          <span className="text-xl sm:text-3xl font-bold">{pkg.price.toLocaleString()}</span>
          <span className="text-xs sm:text-sm text-[var(--text-secondary)] ml-1">FCFA</span>
        </div>

        <ul className="space-y-1 sm:space-y-2 mb-3 sm:mb-6 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-xs sm:text-sm leading-snug">
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-[var(--text-secondary)]">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelect(pkg)}
          className={`w-full py-2 sm:py-2.5 rounded-[var(--radius-md)] font-bold text-xs sm:text-base transition-all ${
            pkg.popular
              ? 'bg-gradient-to-r from-[var(--tiktok-red)] to-purple-600 text-white hover:opacity-90'
              : 'bg-[var(--background-elevated-2)] text-[var(--text-primary)] hover:bg-[var(--background-hover)]'
          }`}
        >
          {t('buyNow')}
        </button>
      </div>
    </div>
  );
}
