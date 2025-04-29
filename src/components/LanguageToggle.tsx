import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get current language
  const currentLanguage = i18n.language.startsWith('fr') ? 'fr' : 'en';
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Change language
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-toggle')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="language-toggle relative">
      <button 
        onClick={toggleDropdown}
        className="flex items-center gap-1.5 text-sm bg-[var(--background-elevated-2)] px-3 py-1.5 rounded-full hover:bg-[var(--background-elevated-3)] transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage === 'fr' ? 'FR' : 'EN'}</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-[var(--background-elevated)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-[var(--border-dark)] z-10">
          <div className="p-2">
            <div className="text-xs text-[var(--text-secondary)] px-2 py-1">
              {t('language')}
            </div>
            <button
              onClick={() => changeLanguage('en')}
              className={`w-full text-left px-2 py-1.5 rounded-[var(--radius-sm)] text-sm ${currentLanguage === 'en' ? 'bg-[var(--background-elevated-2)] font-medium' : 'hover:bg-[var(--background-elevated-2)]'}`}
            >
              {t('english')}
            </button>
            <button
              onClick={() => changeLanguage('fr')}
              className={`w-full text-left px-2 py-1.5 rounded-[var(--radius-sm)] text-sm ${currentLanguage === 'fr' ? 'bg-[var(--background-elevated-2)] font-medium' : 'hover:bg-[var(--background-elevated-2)]'}`}
            >
              {t('french')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
