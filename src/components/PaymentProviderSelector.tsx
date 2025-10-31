import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';
import { PaymentProviderType, getEnabledProviders } from '../utils/paymentProviders';

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
    [PaymentProviderType.SOLEASPAY]: 'SoleasPay',
    [PaymentProviderType.LYGOSPAY]: 'LygosPay'
  };

  return (
    <div className="mb-6 p-4 bg-[var(--background-elevated)] rounded-[var(--radius-lg)] border border-[var(--border-dark)]">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-5 h-5 text-[var(--tiktok-red)]" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {t('paymentProvider.title', 'Méthode de paiement')}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {enabledProviders.map((provider) => (
          <button
            key={provider}
            onClick={() => onProviderChange(provider)}
            className={`
              p-4 rounded-[var(--radius-md)] border-2 transition-all duration-200 relative
              ${selectedProvider === provider
                ? 'border-[var(--tiktok-red)] bg-[var(--background-elevated-2)] shadow-md'
                : 'border-[var(--border-dark)] bg-[var(--background-elevated)] hover:border-[var(--tiktok-red)] hover:shadow-sm'
              }
            `}
          >
            {/* Badge Recommandé pour LygosPay */}
            {provider === PaymentProviderType.LYGOSPAY && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[var(--tiktok-red)] to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                {t('paymentProvider.recommended', 'Recommandé')}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo du fournisseur */}
                {provider === PaymentProviderType.LYGOSPAY && (
                  <img 
                    src="https://cdn.prod.website-files.com/67a678b7cdc4172cac2e3441/67a678b7cdc4172cac2e346f_Logo.svg" 
                    alt="LygosPay Logo" 
                    className="h-8 w-auto object-contain"
                  />
                )}
                {provider === PaymentProviderType.SOLEASPAY && (
                  <img 
                    src="https://soleaspay.com/images/Logo/sopay.png" 
                    alt="SoleasPay Logo" 
                    className="h-8 w-auto object-contain"
                  />
                )}
                
                <span className={`font-medium ${
                  selectedProvider === provider ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}>
                  {providerNames[provider]}
                </span>
              </div>
              {selectedProvider === provider && (
                <div className="w-5 h-5 rounded-full bg-[var(--tiktok-red)] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {t('paymentProvider.description', 'Sélectionnez votre méthode de paiement préférée')}
      </p>
    </div>
  );
}
