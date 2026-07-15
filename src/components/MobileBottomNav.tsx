import { Coins, CreditCard, Gamepad2, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navItems = [
  { path: '/pieces-tiktok', labelKey: 'services.coinsShort', icon: Coins, aliases: ['/'] },
  { path: '/comptes-tiktok', labelKey: 'services.accountsShort', icon: Users, aliases: [] },
  { path: '/cartes-virtuelles', labelKey: 'services.cardsShort', icon: CreditCard, aliases: [] },
  { path: '/pieces-efootball', labelKey: 'services.efootballShort', icon: Gamepad2, aliases: [] },
];

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="mobile-bottom-navigation" aria-label={t('mobileNavigation')}>
      <div className="mx-auto grid max-w-2xl grid-cols-4">
        {navItems.map(({ path, labelKey, icon: Icon, aliases }) => {
          const isActive = location.pathname === path || aliases.includes(location.pathname);

          return (
            <Link
              key={path}
              to={path}
              className={`mobile-bottom-navigation__item ${isActive ? 'is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
