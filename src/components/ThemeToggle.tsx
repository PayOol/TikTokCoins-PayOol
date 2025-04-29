import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  // Récupérer le thème initial depuis localStorage ou utiliser le thème sombre par défaut
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  });

  // Appliquer le thème au chargement du composant
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Fonction pour appliquer le thème
  const applyTheme = (newTheme: 'dark' | 'light') => {
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', newTheme);
  };

  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full hover:bg-[var(--background-elevated-2)] transition-colors ${className}`}
      aria-label={`Basculer vers le thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
      title={`Basculer vers le thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
    >
      {theme === 'dark' ? (
        <Sun size={20} className="text-[var(--text-secondary)] hover:text-[var(--tiktok-blue)]" />
      ) : (
        <Moon size={20} className="text-[var(--text-secondary)] hover:text-[var(--tiktok-blue)]" />
      )}
    </button>
  );
}
