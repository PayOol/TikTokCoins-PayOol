import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';
import { PaymentProviderType, getEnabledProviders, getProviderConfig } from '../utils/paymentProviders';

interface PaymentProviderSelectorProps {
  selectedProvider: PaymentProviderType;
  onProviderChange: (provider: PaymentProviderType) => void;
}

export function PaymentProviderSelector({ selectedProvider, onProviderChange }: PaymentProviderSelectorProps) {
  const { t } = useTranslation();
  const enabledProviders = getEnabledProviders();

  // Afficher le sélecteur même s'il n'y a qu'un seul fournisseur
  // (pour que l'utilisateur voie toujours quelle méthode de paiement est utilisée)
  if (enabledProviders.length === 0) {
    return null; // Ne rien afficher si aucun fournisseur n'est activé
  }

  const providerNames: Record<PaymentProviderType, string> = {
    [PaymentProviderType.LEEKPAY]: 'LeekPay',
    [PaymentProviderType.SOLEASPAY]: 'SoleasPay',
    [PaymentProviderType.BKAPAY]: 'BkaPay',
    [PaymentProviderType.SEBPAY]: 'SebPay',
    [PaymentProviderType.AFRIBAPAY]: 'AfribaPay'
  };

  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[var(--background-elevated)] rounded-[var(--radius-lg)] border border-[var(--border-dark)]">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--tiktok-red)]" />
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
          {t('paymentProvider.title', 'Méthode de paiement')}
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {enabledProviders.map((provider) => (
          <button
            type="button"
            key={provider}
            onClick={() => onProviderChange(provider)}
            className={`
              p-3 sm:p-4 rounded-[var(--radius-md)] border-2 transition-all duration-200 relative
              ${selectedProvider === provider
                ? 'border-[var(--tiktok-red)] bg-[var(--background-elevated-2)] shadow-md'
                : 'border-[var(--border-dark)] bg-[var(--background-elevated)] hover:border-[var(--tiktok-red)] hover:shadow-sm'
              }
            `}
          >
            {/* Badge Recommandé */}
            {getProviderConfig(provider)?.recommended && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[var(--tiktok-red)] to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                {t('paymentProvider.recommended', 'Recommandé')}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Logo du fournisseur */}
                {provider === PaymentProviderType.LEEKPAY && (
                  <img 
                    src="https://www.leekpay.me/_nuxt/Logo_de_LeekPay_png_sans_arri%C3%A8re-plan.X8ssEAW3.png" 
                    alt="LeekPay Logo" 
                    className="h-6 sm:h-8 w-auto object-contain"
                  />
                )}
                {provider === PaymentProviderType.SOLEASPAY && (
                  <img 
                    src="https://soleaspay.com/images/Logo/sopay.png" 
                    alt="SoleasPay Logo" 
                    className="h-6 sm:h-8 w-auto object-contain"
                  />
                )}
                {provider === PaymentProviderType.BKAPAY && (
                  <img 
                    src="https://bkapay.com/assets/bkapay-logo-DMJXxtlJ.png" 
                    alt="BkaPay Logo" 
                    className="h-6 sm:h-8 w-auto object-contain"
                  />
                )}
                {provider === PaymentProviderType.SEBPAY && (
                  <img
                    src="https://new.sebpay.bj/sebpay.svg"
                    alt="SebPay Logo"
                    className="h-6 sm:h-8 w-auto object-contain"
                  />
                )}
                {provider === PaymentProviderType.AFRIBAPAY && (
                  <img
                    src="https://www.afribapay.com/wp-content/uploads/2023/12/favicon-300x300-1.png"
                    alt="AfribaPay Logo"
                    className="h-6 sm:h-8 w-auto object-contain rounded-sm"
                    onError={(e) => {
                      // Fallback au logo générique de carte bancaire
                      (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/7479/7479736.png";
                    }}
                  />
                )}
                
                <span className={`text-sm sm:text-base font-medium ${
                  selectedProvider === provider ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}>
                  {providerNames[provider]}
                </span>
              </div>
              {selectedProvider === provider && (
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--tiktok-red)] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <p className="mt-3 text-xs sm:text-sm text-[var(--text-secondary)]">
        {t('paymentProvider.description', 'Sélectionnez votre méthode de paiement préférée')}
      </p>
    </div>
  );
}
