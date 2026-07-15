import {
  ArrowRight,
  BadgeDollarSign,
  CircleDollarSign,
  Headphones,
  Monitor,
  Rocket,
  ShieldCheck,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  efootballCatalogs,
  EFootballPackage,
  EFootballPlatform,
} from '../data/efootballPackages';

const platformIcons = {
  mobile: Smartphone,
  steam: Monitor,
};

const trustItems = [
  { key: 'reliable', icon: ShieldCheck },
  { key: 'fast', icon: Rocket },
  { key: 'support', icon: Headphones },
  { key: 'prices', icon: BadgeDollarSign },
] as const;

interface EFootballServiceProps {
  onSelect: (platform: EFootballPlatform, pkg: EFootballPackage) => void;
}

export function EFootballService({ onSelect }: EFootballServiceProps) {
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language.startsWith('fr');
  const locale = isFrench ? 'fr-FR' : 'en-US';

  const formatNumber = (value: number) => value.toLocaleString(locale);

  const getPlatformLabel = (platform: EFootballPlatform) => (
    t(`efootball.platforms.${platform}`)
  );

  return (
    <div className="page-fade-in space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <h1 className="text-lg font-bold sm:text-xl md:text-2xl">{t('efootball.title')}</h1>
        <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-[var(--background-elevated-2)] px-2 py-1.5 text-xs sm:px-3 sm:text-sm">
          <Sparkles className="h-3 w-3 text-[var(--tiktok-red)] sm:h-4 sm:w-4" />
          <span>{t('securePayment')}</span>
        </div>
      </div>

      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6" aria-label={t('efootball.catalogAriaLabel')}>
        {efootballCatalogs.map((catalog) => {
          const PlatformIcon = platformIcons[catalog.platform];

          return (
            <article
              key={catalog.platform}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-dark)] bg-[var(--background-elevated)] shadow-[var(--shadow-md)]"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--border-dark)] bg-[var(--background-elevated-2)] px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white">
                    <PlatformIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold sm:text-xl">
                      {getPlatformLabel(catalog.platform)}
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {catalog.packages.length} {t('efootball.packages')}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[var(--background-main)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {t('efootball.available')}
                </span>
              </header>

              <div className="grid grid-cols-2 border-b border-[var(--border-dark)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] sm:px-5">
                <span>{t('efootball.quantity')}</span>
                <span className="text-right">{t('efootball.price')}</span>
              </div>

              <ul className="divide-y divide-[var(--border-dark)]">
                {catalog.packages.map((pkg) => (
                  <li key={pkg.id} className="w-full">
                    <button
                      type="button"
                      onClick={() => onSelect(catalog.platform, pkg)}
                      className="group grid min-h-16 w-full appearance-none grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-[var(--background-elevated-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--tiktok-blue)] sm:px-5"
                      aria-label={t('efootball.orderAriaLabel', {
                        coins: formatNumber(pkg.coins),
                        platform: getPlatformLabel(catalog.platform),
                        price: formatNumber(pkg.price),
                      })}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <CircleDollarSign className="h-5 w-5 shrink-0 text-[var(--tiktok-blue)]" />
                        <span className="min-w-0">
                          <span className="block text-sm text-[var(--text-primary)] sm:text-base">
                            <strong>{formatNumber(pkg.coins)}</strong> Coins
                          </span>
                          <span className="block text-xs text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--tiktok-blue)]">
                            {t('efootball.order')}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center justify-end gap-1.5 whitespace-nowrap text-sm font-bold text-[var(--text-primary)] sm:text-base">
                        {formatNumber(pkg.price)} F
                        <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--tiktok-red)]" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--border-dark)] bg-[var(--background-elevated)] p-4 shadow-[var(--shadow-md)] sm:p-5">
        <div className="flex items-start gap-3 border-b border-[var(--border-dark)] pb-4">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[var(--tiktok-blue)]" />
          <div>
            <h2 className="font-bold uppercase tracking-wide text-[var(--text-primary)]">
              {t('efootball.serviceTitle')}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t('efootball.paymentPath')}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {trustItems.map(({ key, icon: TrustIcon }) => (
            <div key={key} className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--background-elevated-2)] p-3">
              <TrustIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--tiktok-red)]" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--text-primary)]">
                  {t(`efootball.trust.${key}.title`)}
                </h3>
                <p className="mt-0.5 text-xs leading-4 text-[var(--text-secondary)]">
                  {t(`efootball.trust.${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
