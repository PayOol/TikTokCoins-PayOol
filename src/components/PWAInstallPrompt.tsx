import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, Smartphone, Monitor, Apple } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Détecter si l'app est déjà installée en mode standalone (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      console.log('PWA: App déjà installée en mode standalone');
      return;
    }

    // Vérifier si l'utilisateur a déjà installé l'app (marqueur permanent)
    const hasInstalled = localStorage.getItem('pwa-installed');
    if (hasInstalled === 'true') {
      console.log('PWA: Utilisateur a marqué comme installé');
      return;
    }

    // Vérifier si on a déjà affiché la modale aujourd'hui
    const lastPromptDate = localStorage.getItem('pwa-install-prompt-date');
    const today = new Date().toDateString();
    
    if (lastPromptDate === today) {
      console.log('PWA: Déjà affiché aujourd\'hui');
      return;
    }

    // Détecter le type d'appareil
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    console.log('PWA: Détection appareil - iOS:', isIOSDevice, 'Android:', isAndroidDevice);

    // Écouter l'événement beforeinstallprompt (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt reçu');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Toujours afficher la modale après un délai
    const timer = setTimeout(() => {
      console.log('PWA: Affichage de la modale');
      setShowPrompt(true);
      localStorage.setItem('pwa-install-prompt-date', today);
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Utiliser l'API native d'installation
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Fermer la modale (l'utilisateur suivra les instructions manuelles)
      setShowPrompt(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  const handleNeverShow = () => {
    localStorage.setItem('pwa-installed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 fade-in">
      <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] p-6 w-full max-w-md shadow-[var(--shadow-lg)] slide-up border border-[var(--border-dark)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--tiktok-cyan)] to-[var(--tiktok-red)] flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {t('installApp', 'Installer l\'application')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                PayOol & TikTok Coins
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-[var(--background-elevated-2)] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Description */}
        <p className="text-[var(--text-secondary)] text-sm mb-5">
          {t('installAppDescription', 'Installez l\'application pour un accès rapide et une utilisation hors ligne.')}
        </p>

        {/* Instructions selon l'appareil */}
        <div className="bg-[var(--background-elevated-2)] rounded-[var(--radius-md)] p-4 mb-5">
          {isIOS ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <Apple className="w-5 h-5" />
                <span>{t('iosInstructions', 'Instructions pour iPhone/iPad')}</span>
              </div>
              <ol className="text-sm text-[var(--text-secondary)] space-y-2 list-decimal list-inside">
                <li>{t('iosStep1', 'Appuyez sur le bouton de partage')}<span className="ml-1">⬆️</span></li>
                <li>{t('iosStep2', 'Faites défiler et appuyez sur "Sur l\'écran d\'accueil"')}</li>
                <li>{t('iosStep3', 'Appuyez sur "Ajouter"')}</li>
              </ol>
            </div>
          ) : isAndroid && !deferredPrompt ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <Smartphone className="w-5 h-5" />
                <span>{t('androidInstructions', 'Instructions pour Android')}</span>
              </div>
              <ol className="text-sm text-[var(--text-secondary)] space-y-2 list-decimal list-inside">
                <li>{t('androidStep1', 'Appuyez sur le menu ⋮ en haut à droite')}</li>
                <li>{t('androidStep2', 'Sélectionnez "Ajouter à l\'écran d\'accueil"')}</li>
                <li>{t('androidStep3', 'Confirmez en appuyant sur "Ajouter"')}</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <Monitor className="w-5 h-5" />
                <span>{t('desktopInstructions', 'Installation rapide')}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('desktopDescription', 'Cliquez sur le bouton ci-dessous pour installer l\'application sur votre appareil.')}
              </p>
            </div>
          )}
        </div>

        {/* Avantages */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center p-3 bg-[var(--background-elevated-2)] rounded-[var(--radius-md)]">
            <div className="text-lg mb-1">⚡</div>
            <div className="text-xs text-[var(--text-secondary)]">{t('fastAccess', 'Accès rapide')}</div>
          </div>
          <div className="text-center p-3 bg-[var(--background-elevated-2)] rounded-[var(--radius-md)]">
            <div className="text-lg mb-1">📴</div>
            <div className="text-xs text-[var(--text-secondary)]">{t('offlineMode', 'Mode hors ligne')}</div>
          </div>
          <div className="text-center p-3 bg-[var(--background-elevated-2)] rounded-[var(--radius-md)]">
            <div className="text-lg mb-1">🔔</div>
            <div className="text-xs text-[var(--text-secondary)]">{t('notifications', 'Notifications')}</div>
          </div>
        </div>

        {/* Boutons */}
        <div className="space-y-3">
          {deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="tiktok-button w-full flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {t('installNow', 'Installer maintenant')}
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="tiktok-button w-full"
            >
              {t('understood', 'J\'ai compris')}
            </button>
          )}
          
          <button
            onClick={handleNeverShow}
            className="w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2"
          >
            {t('dontShowAgain', 'Ne plus afficher')}
          </button>
        </div>
      </div>
    </div>
  );
}
