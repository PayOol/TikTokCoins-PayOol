import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Composant qui gère les mises à jour du Service Worker
 * Force le rechargement de la page quand une nouvelle version est disponible
 */
export function ServiceWorkerUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered');
      // Vérifier les mises à jour toutes les 60 secondes
      r && setInterval(() => {
        r.update();
      }, 60000);
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    // Si une mise à jour est disponible, la forcer immédiatement
    if (needRefresh) {
      console.log('Nouvelle version détectée - Rechargement forcé...');
      // Forcer la mise à jour du service worker
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  // Composant invisible - ne rend rien à l'écran
  return null;
}
