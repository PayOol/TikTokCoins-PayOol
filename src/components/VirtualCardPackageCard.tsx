import { useTranslation } from 'react-i18next';
import { BadgeCheck, Check, Clock3, Shield, X, Zap } from 'lucide-react';
import { LocalizedText, VirtualCardPackage } from '../types';

interface Props {
  package: VirtualCardPackage;
  onSelect: (pkg: VirtualCardPackage) => void;
}

interface VariantStyle {
  header: string;
  button: string;
  ring: string;
}

const variantStyles: Record<VirtualCardPackage['variant'], VariantStyle> = {
  'visa-basic': {
    header: 'from-blue-500 via-blue-600 to-indigo-800',
    button: 'from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800',
    ring: 'ring-blue-300/70',
  },
  'mastercard-basic': {
    header: 'from-teal-500 via-teal-700 to-slate-800',
    button: 'from-teal-500 to-teal-800 hover:from-teal-600 hover:to-teal-900',
    ring: 'ring-cyan-300/80',
  },
  'mastercard-premium': {
    header: 'from-emerald-500 via-emerald-700 to-teal-900',
    button: 'from-emerald-500 to-emerald-800 hover:from-emerald-600 hover:to-emerald-900',
    ring: 'ring-emerald-300/70',
  },
  'mastercard-platinum': {
    header: 'from-slate-600 via-slate-800 to-slate-950',
    button: 'from-slate-600 to-slate-950 hover:from-slate-700 hover:to-black',
    ring: 'ring-slate-500/50',
  },
};

const getLocalizedText = (value: LocalizedText, language: string) => (
  language.startsWith('fr') ? value.fr : value.en
);

const MastercardMark = () => (
  <div className="relative h-5 w-9">
    <span className="absolute left-1 top-0 h-5 w-5 rounded-full bg-red-500" />
    <span className="absolute right-1 top-0 h-5 w-5 rounded-full bg-amber-400 mix-blend-screen" />
  </div>
);

const VisaMark = () => (
  <div className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-black text-white">
    VISA
  </div>
);

export function VirtualCardPackageCard({ package: pkg, onSelect }: Props) {
  const { t, i18n } = useTranslation();
  const cardName = getLocalizedText(pkg.name, i18n.language);
  const style = variantStyles[pkg.variant];
  const unavailableFeatures = pkg.unavailableFeatures || [];

  return (
    <div className="group relative transition-transform duration-300 hover:-translate-y-1">
      {pkg.popular && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-cyan-100 px-4 py-1 text-xs font-semibold text-teal-800 shadow-sm">
          <BadgeCheck className="h-3.5 w-3.5" />
          <span>{t('virtualCards.mostPopular', 'Plus populaire')}</span>
        </div>
      )}

      <article
        className={`relative flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-dark)] bg-[var(--card-bg)] shadow-[var(--shadow-lg)] ring-1 ${style.ring} transition-colors group-hover:bg-[var(--card-hover)] ${
          pkg.popular ? 'ring-2' : ''
        }`}
      >
      <header className={`relative min-h-[144px] overflow-hidden bg-gradient-to-br ${style.header} p-4 text-white xl:min-h-[158px]`}>
        <div className="absolute -right-8 -top-12 h-28 w-28 rounded-full bg-white/10 xl:h-32 xl:w-32" />
        <div className="absolute -bottom-12 left-5 h-24 w-24 rounded-full bg-black/10 xl:h-28 xl:w-28" />
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="max-w-[10rem] text-lg font-black leading-tight xl:max-w-[11rem] xl:text-xl">
              {cardName}
            </h3>
            {pkg.brand === 'visa' ? <VisaMark /> : <MastercardMark />}
          </div>

          <p className="text-xs font-semibold leading-snug text-white/85 xl:text-[13px]">
            {getLocalizedText(pkg.description, i18n.language)}
          </p>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5 pt-3">
            <div className="flex min-w-0 items-end gap-2">
              <span className="text-[1.65rem] font-black leading-none xl:text-[1.875rem]">
                {pkg.price.toLocaleString('fr-FR')}
              </span>
              <span className="pb-1 text-xs font-medium text-white/75">{pkg.currency}</span>
            </div>
            <span className="mb-1 flex max-w-full items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm">
              <Clock3 className="h-3 w-3" />
              {getLocalizedText(pkg.validity, i18n.language)}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col bg-[var(--card-bg)] p-4 transition-colors">
        <div className="mb-3 flex items-center gap-2 border-b border-[var(--border-dark)] pb-2.5 text-[13px] font-bold text-[var(--text-primary)]">
          <Shield className="h-3.5 w-3.5 text-blue-500" />
          <span>{t('virtualCards.featuresTitle', 'Caractéristiques')}</span>
        </div>

        <ul className="space-y-2">
          {pkg.features.map((feature, index) => (
            <li key={`${cardName}-feature-${index}`} className="flex items-start gap-2 text-[13px] leading-snug text-[var(--text-secondary)]">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span>{getLocalizedText(feature, i18n.language)}</span>
            </li>
          ))}
          {unavailableFeatures.map((feature, index) => (
            <li key={`${cardName}-unavailable-${index}`} className="flex items-start gap-2 text-[13px] leading-snug text-[var(--text-secondary)]">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
              <span>{getLocalizedText(feature, i18n.language)}</span>
            </li>
          ))}
        </ul>

        <div className="pt-3">
          <button
            type="button"
            onClick={() => onSelect(pkg)}
            className={`flex h-9 w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] bg-gradient-to-r ${style.button} px-4 text-xs font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg xl:h-10 xl:text-sm`}
          >
            <Zap className="h-4 w-4" />
            <span>{t('virtualCards.buyNow', 'Acheter maintenant')}</span>
          </button>
        </div>
      </div>
      </article>
    </div>
  );
}
