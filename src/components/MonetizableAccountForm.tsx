import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowRight, Mail, Phone, User } from 'lucide-react';
import { MonetizableAccountForm } from '../types';

interface Props {
  onSubmit: (data: MonetizableAccountForm) => void;
  onCancel: () => void;
  packageName: string;
  packagePrice: number;
}

// Mapping des codes pays vers les préfixes téléphoniques
const countryPhonePrefixes: Record<string, string> = {
  CM: '+237', SN: '+221', CI: '+225', ML: '+223', BF: '+226',
  GN: '+224', TG: '+228', BJ: '+229', NE: '+227', MG: '+261',
  CD: '+243', CG: '+242', GA: '+241', TD: '+235', CF: '+236',
  RW: '+250', BI: '+257', DJ: '+253', ET: '+251', KE: '+254',
  UG: '+256', TZ: '+255', ZA: '+27', NG: '+234', GH: '+233',
  MA: '+212', DZ: '+213', TN: '+216', EG: '+20', FR: '+33',
  BE: '+32', CH: '+41', CA: '+1', US: '+1',
};

export function MonetizableAccountFormModal({ onSubmit, onCancel, packageName, packagePrice }: Props) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<MonetizableAccountForm>({
    email: '',
    whatsapp: '',
    desiredUsername: ''
  });
  const [countryPrefix, setCountryPrefix] = useState<string>('+237');
  const [isLoadingPrefix, setIsLoadingPrefix] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof MonetizableAccountForm, string>>>({});

  // Détecter le pays via l'IP
  useEffect(() => {
    let lastCountryCode: string | null = null;
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;
        if (countryCode !== lastCountryCode && countryPhonePrefixes[countryCode]) {
          lastCountryCode = countryCode;
          setCountryPrefix(countryPhonePrefixes[countryCode]);
        }
      } catch (error) {
        console.error('Erreur lors de la détection du pays:', error);
      } finally {
        setIsLoadingPrefix(false);
      }
    };
    detectCountry();
    const intervalId = setInterval(detectCountry, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MonetizableAccountForm, string>> = {};

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('invalidEmail');
    }
    if (!formData.whatsapp || !/^[0-9]{8,15}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = t('tiktokForm.whatsappInvalid', 'Numéro WhatsApp invalide');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        whatsapp: `${countryPrefix}${formData.whatsapp}`
      });
    }
  };

  const handleChange = (field: keyof MonetizableAccountForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 fade-in">
      <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)] max-h-[90vh] overflow-y-auto">
        {/* En-tête avec dégradé */}
        <div className="bg-gradient-to-r from-[var(--tiktok-blue)] to-purple-600 p-4 sm:p-6 relative">
          <button
            onClick={onCancel}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30 transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {t('accountForm.title', 'Création de compte')}
          </h2>
          <p className="text-white text-opacity-80 text-xs sm:text-sm">
            {t('accountForm.subtitle', 'Forfait')} {packageName} — {packagePrice.toLocaleString()} FCFA
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t('emailForm.emailLabel')}
            </label>
            <input
              type="email"
              required
              className={`tiktok-input text-sm sm:text-base ${errors.email ? 'border-red-500' : ''}`}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={t('emailForm.emailPlaceholder')}
            />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t('tiktokForm.whatsappLabel')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="tiktok-input w-20 sm:w-24 text-center text-sm sm:text-base"
                value={countryPrefix}
                onChange={(e) => setCountryPrefix(e.target.value)}
                disabled={isLoadingPrefix}
                placeholder="+---"
              />
              <input
                type="tel"
                required
                className={`tiktok-input flex-1 text-sm sm:text-base ${errors.whatsapp ? 'border-red-500' : ''}`}
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder={t('tiktokForm.whatsappPlaceholder')}
              />
            </div>
            {errors.whatsapp && <p className="text-xs text-red-400 mt-1">{errors.whatsapp}</p>}
            <p className="text-xs text-[var(--text-secondary)] mt-1">{t('tiktokForm.whatsappHint')}</p>
          </div>

          {/* Pseudo souhaité */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('accountForm.desiredUsername', 'Pseudo souhaité (optionnel)')}
            </label>
            <input
              type="text"
              className="tiktok-input text-sm sm:text-base"
              value={formData.desiredUsername}
              onChange={(e) => handleChange('desiredUsername', e.target.value)}
              placeholder={t('accountForm.desiredUsernamePlaceholder', 'Ex: @monCompteTikTok')}
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="tiktok-button w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <span>{t('accountForm.submit', 'Passer commande')} — {packagePrice.toLocaleString()} FCFA</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full text-center py-2 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
