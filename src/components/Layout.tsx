import React, { ReactNode, useEffect, useState } from 'react';
import { Coins, Menu, X, User, History, LogOut, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTotalCoins } from '../utils/localStorage';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { WhatsAppButton } from './WhatsAppButton';

interface LayoutProps {
  children: ReactNode;
  balance: number;
  hideBalance?: boolean;
}

export function Layout({ children, balance: propBalance, hideBalance = false }: LayoutProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [balance, setBalance] = useState(propBalance);
  const location = useLocation();
  const { t } = useTranslation();
  
  // Mettre à jour le solde depuis le localStorage
  useEffect(() => {
    const storedBalance = getTotalCoins();
    if (storedBalance > 0) {
      setBalance(storedBalance);
    } else if (propBalance > 0) {
      setBalance(propBalance);
    }
  }, [propBalance, location]);
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  
  return (
    <div className="min-h-screen bg-[var(--background-main)] text-[var(--text-primary)] relative">
      {/* Header avec animation gradient */}
      <header className="bg-[var(--background-elevated)] sticky top-0 z-30 shadow-md border-b border-[var(--border-dark)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleMenu}
                className="lg:hidden p-2 rounded-full hover:bg-[var(--background-elevated-2)] transition-colors"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <Link to="/" className="text-2xl font-bold flex items-center gap-2">
                <Coins className="w-7 h-7 text-[var(--tiktok-red)]" />
                <span className="tiktok-gradient-text">TikTok Coins</span>
                <span className="text-sm font-normal text-[var(--text-secondary)]">by PayOol™</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Bouton de basculement de langue */}
              <LanguageToggle />
              
              {/* Bouton de basculement de thème */}
              <ThemeToggle />
              
              {!hideBalance && (
                <>
                  <div className="hidden md:flex items-center gap-1 bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white px-4 py-2 rounded-full">
                    <Coins className="w-5 h-5" />
                    <span className="font-medium">{balance.toLocaleString()}</span>
                  </div>
                  
                  <div className="md:hidden flex items-center gap-1 bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white p-2 rounded-full">
                    <Coins className="w-5 h-5" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 bg-black bg-opacity-70 z-40 transition-opacity duration-300 lg:hidden ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={toggleMenu}>
      </div>
      
      <div className={`fixed top-0 left-0 h-full w-64 bg-[var(--background-elevated)] shadow-lg z-50 transform transition-transform duration-300 lg:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-[var(--border-dark)]">
          <h2 className="text-xl font-bold tiktok-gradient-text">TikTok Coins</h2>
        </div>
        
        <nav className="p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-dark)]">
            <span className="text-sm text-[var(--text-secondary)]">{t('language')}</span>
            <LanguageToggle />
          </div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-dark)]">
            <span className="text-sm text-[var(--text-secondary)]">Thème</span>
            <ThemeToggle />
          </div>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-elevated-2)] transition-colors">
                <Home size={20} />
                <span>{t('backToHome')}</span>
              </Link>
            </li>
            <li>
              <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-elevated-2)] transition-colors">
                <User size={20} />
                <span>{t('myAccount', 'Mon compte')}</span>
              </Link>
            </li>
            <li>
              <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-elevated-2)] transition-colors">
                <History size={20} />
                <span>{t('purchaseHistory')}</span>
              </Link>
            </li>
            <li>
              <button 
                onClick={() => {
                  // Effacer les données utilisateur (pour la démo)
                  localStorage.removeItem('tiktok_user');
                  localStorage.removeItem('purchaseHistory');
                  localStorage.removeItem('totalCoins');
                  window.location.href = import.meta.env.BASE_URL || '/';
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-elevated-2)] transition-colors text-[var(--tiktok-red)]"
              >
                <LogOut size={20} />
                <span>{t('reset', 'Réinitialiser')}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-[var(--background-elevated)] border-t border-[var(--border-dark)] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[var(--tiktok-red)]" />
              <span className="font-medium">TikTok Coins by PayOol™</span>
            </div>
            
            <div className="text-sm text-[var(--text-secondary)]">
              &copy; {new Date().getFullYear()} PayOol™. {t('allRightsReserved', 'Tous droits réservés.')}
            </div>
          </div>
        </div>
      </footer>

      {/* Bouton WhatsApp flottant */}
      <WhatsAppButton
        whatsappUrl="https://wa.me/message/2TWDCSUY65YGA1"
      />
    </div>
  );
}
