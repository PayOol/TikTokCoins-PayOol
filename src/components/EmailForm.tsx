import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, X, Loader2, ShieldCheck } from 'lucide-react';

interface Props {
  onSubmit: (email: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  packageAmount: number;
  packagePrice: number;
}

export function EmailFormModal({ onSubmit, onCancel, isLoading = false, packageAmount, packagePrice }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = React.useState('');
  const [isValid, setIsValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsValid(validateEmail(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isSubmitting && !isLoading) {
      setIsSubmitting(true);
      onSubmit(email);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 fade-in">
      <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)]">
        {/* En-tête avec dégradé */}
        <div className="bg-gradient-to-r from-[var(--tiktok-red)] to-purple-600 p-6 relative">
          <button 
            onClick={isSubmitting || isLoading ? undefined : onCancel}
            disabled={isSubmitting || isLoading}
            className={`absolute top-4 right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 ${(isSubmitting || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-30'} transition-colors`}
          >
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-1">{t('emailForm.title')}</h2>
          <p className="text-white text-opacity-80 text-sm">
            {t('emailForm.subtitle')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {t('emailForm.emailLabel')}
            </label>
            
            <input
              type="email"
              id="email"
              required
              className={`tiktok-input ${isValid ? 'border-green-500' : ''}`}
              value={email}
              onChange={handleChange}
              placeholder={t('emailForm.emailPlaceholder')}
            />
            
            <div className="bg-[var(--background-elevated-2)] p-4 rounded-[var(--radius-md)] mb-6">
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                {t('emailForm.packageInfo', { amount: packageAmount.toLocaleString(), price: packagePrice.toLocaleString() })}
              </p>
              <div className="flex items-start mt-3">
                <ShieldCheck className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-[var(--text-secondary)]">
                  {t('payment.securityMessage')}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="tiktok-button w-full flex items-center justify-center gap-2 relative"
              disabled={!isValid || isSubmitting || isLoading}
            >
              {(isSubmitting || isLoading) ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('processing')}</span>
                </>
              ) : (
                <>
                  <span>{t('proceedToPayment')} {packagePrice.toLocaleString()} FCFA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={isSubmitting || isLoading ? undefined : onCancel}
              disabled={isSubmitting || isLoading}
              className={`w-full text-center py-2 flex items-center justify-center gap-2 text-[var(--text-secondary)] ${(isSubmitting || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:text-[var(--text-primary)]'} transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('cancel')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
