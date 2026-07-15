import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Gamepad2, KeyRound, Loader2, Phone, UserRound, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EFootballCredentials } from '../types';
import { detectCountryCallingCode } from '../utils/countryCallingCode';

interface EFootballCredentialsFormProps {
  packageLabel: string;
  packagePrice: number;
  onSubmit: (credentials: EFootballCredentials) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EFootballCredentialsForm({
  packageLabel,
  packagePrice,
  onSubmit,
  onCancel,
  isLoading = false,
}: EFootballCredentialsFormProps) {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState<EFootballCredentials>({
    konamiIdOrEmail: '',
    password: '',
    whatsapp: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [countryPrefix, setCountryPrefix] = useState('');
  const [callingCodeStatus, setCallingCodeStatus] = useState<'detecting' | 'detected' | 'unavailable'>('detecting');

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4000);
    let isActive = true;

    detectCountryCallingCode(controller.signal)
      .then((detection) => {
        if (!isActive) return;

        if (!detection) {
          setCallingCodeStatus('unavailable');
          return;
        }

        setCountryPrefix(current => current || detection.callingCode);
        setCallingCodeStatus('detected');
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const hasKonamiId = credentials.konamiIdOrEmail.trim().length > 0;
  const hasPassword = credentials.password.length > 0;
  const hasCountryPrefix = /^\+\d{1,4}$/.test(countryPrefix);
  const whatsappDigits = `${countryPrefix}${credentials.whatsapp}`.replace(/\D/g, '');
  const hasValidWhatsapp = hasCountryPrefix && /^[0-9]{8,15}$/.test(whatsappDigits);
  const isValid = hasKonamiId && hasPassword && hasValidWhatsapp;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    if (isValid && !isLoading) {
      onSubmit({
        konamiIdOrEmail: credentials.konamiIdOrEmail.trim(),
        password: credentials.password,
        whatsapp: whatsappDigits,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 modal-backdrop fade-in sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-dark)] bg-[var(--background-elevated)] shadow-[var(--shadow-lg)] slide-up">
        <div className="relative bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] p-5 text-white sm:p-6">
          <button
            type="button"
            onClick={isLoading ? undefined : onCancel}
            disabled={isLoading}
            className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50 sm:right-4 sm:top-4"
            aria-label={t('close')}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-white/20">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">{t('efootball.form.title')}</h2>
              <p className="mt-0.5 text-xs text-white/80 sm:text-sm">{t('efootball.form.subtitle')}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
          <div className="rounded-[var(--radius-md)] bg-[var(--background-elevated-2)] p-3 text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">{packageLabel}</span>
            <span className="mx-2">—</span>
            <span>{packagePrice.toLocaleString()} FCFA</span>
          </div>

          <div>
            <label htmlFor="konami-id" className="tiktok-label flex items-center gap-2 text-sm">
              <UserRound className="h-4 w-4 text-[var(--tiktok-blue)]" />
              <span>{t('efootball.form.konamiIdLabel')}</span>
            </label>
            <input
              id="konami-id"
              type="text"
              autoComplete="username"
              autoFocus
              value={credentials.konamiIdOrEmail}
              onChange={(event) => setCredentials(current => ({ ...current, konamiIdOrEmail: event.target.value }))}
              className={`tiktok-input ${submitted && !hasKonamiId ? 'border-red-500' : ''}`}
              placeholder={t('efootball.form.konamiIdPlaceholder')}
              aria-invalid={submitted && !hasKonamiId}
              required
            />
            {submitted && !hasKonamiId && (
              <p className="mt-1 text-xs text-red-400">{t('efootball.form.konamiIdRequired')}</p>
            )}
          </div>

          <div>
            <label htmlFor="efootball-password" className="tiktok-label flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4 text-[var(--tiktok-red)]" />
              <span>{t('efootball.form.passwordLabel')}</span>
            </label>
            <input
              id="efootball-password"
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(event) => setCredentials(current => ({ ...current, password: event.target.value }))}
              className={`tiktok-input ${submitted && !hasPassword ? 'border-red-500' : ''}`}
              placeholder={t('efootball.form.passwordPlaceholder')}
              aria-invalid={submitted && !hasPassword}
              required
            />
            {submitted && !hasPassword && (
              <p className="mt-1 text-xs text-red-400">{t('efootball.form.passwordRequired')}</p>
            )}
          </div>

          <div>
            <label htmlFor="efootball-whatsapp" className="tiktok-label flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-green-400" />
              <span>{t('efootball.form.whatsappLabel')}</span>
            </label>
            <div className="flex gap-2">
              <input
                id="efootball-country-prefix"
                type="tel"
                inputMode="tel"
                autoComplete="tel-country-code"
                value={countryPrefix}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
                  setCountryPrefix(digits ? `+${digits}` : '');
                  setCallingCodeStatus('unavailable');
                }}
                className={`tiktok-input !w-24 flex-none text-center ${submitted && !hasCountryPrefix ? 'border-red-500' : ''}`}
                placeholder="+---"
                aria-label={t('efootball.form.countryCodeLabel')}
                aria-invalid={submitted && !hasCountryPrefix}
                aria-describedby="efootball-whatsapp-detection"
                required
              />
              <input
                id="efootball-whatsapp"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={credentials.whatsapp}
                onChange={(event) => setCredentials(current => ({
                  ...current,
                  whatsapp: event.target.value.replace(/\D/g, '').slice(0, 15),
                }))}
                className={`tiktok-input min-w-0 flex-1 ${submitted && !hasValidWhatsapp ? 'border-red-500' : ''}`}
                placeholder={t('efootball.form.whatsappPlaceholder')}
                aria-invalid={submitted && !hasValidWhatsapp}
                aria-describedby="efootball-whatsapp-detection"
                required
              />
            </div>
            <p id="efootball-whatsapp-detection" className="mt-1 min-h-4 text-xs text-[var(--text-secondary)]" aria-live="polite">
              {callingCodeStatus === 'detecting' && t('efootball.form.countryCodeDetecting')}
              {callingCodeStatus === 'detected' && t('efootball.form.countryCodeDetected')}
            </p>
            {submitted && !hasValidWhatsapp && (
              <p className="mt-1 text-xs text-red-400">{t('efootball.form.whatsappInvalid')}</p>
            )}
          </div>

          <div className="space-y-3 pt-1">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="tiktok-button flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              <span>{t('continue')}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
