import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PurchaseInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function PurchaseInstructionsModal({ isOpen, onClose, onContinue }: PurchaseInstructionsModalProps) {
  const { t } = useTranslation();
  const [hasRead, setHasRead] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 fade-in">
      <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)]">
        {/* En-tête avec dégradé */}
        <div className="bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30 transition-colors"
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
          <h2 className="text-2xl font-bold text-white mb-1">{t('purchaseInstructions.title')}</h2>
          <p className="text-white text-opacity-80 text-sm">
            {t('purchaseInstructions.subtitle')}
          </p>
        </div>
        
        {/* Contenu */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-[var(--background-elevated-2)] rounded-[var(--radius-md)]">
              <div className="text-yellow-500 flex-shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-medium text-[var(--text-primary)] mb-1">
                  {t('purchaseInstructions.credentialsTitle')}
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('purchaseInstructions.credentialsText')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-[var(--background-elevated-2)] rounded-[var(--radius-md)]">
              <div className="text-blue-500 flex-shrink-0 mt-0.5">
                <Info size={20} />
              </div>
              <div>
                <h4 className="font-medium text-[var(--text-primary)] mb-1">
                  {t('purchaseInstructions.twoFactorTitle')}
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('purchaseInstructions.twoFactorText')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={hasRead}
                  onChange={(e) => setHasRead(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-dark)] text-[var(--tiktok-red)] focus:ring-[var(--tiktok-red)]"
                />
              </div>
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {t('purchaseInstructions.confirmText')}
              </span>
            </label>
          </div>
        </div>
        
        {/* Pied de page */}
        <div className="p-4 bg-[var(--background-elevated-2)] flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--background-hover)] rounded-md transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onContinue}
            disabled={!hasRead}
            className={`px-6 py-2 text-sm font-medium text-white rounded-md transition-all ${
              hasRead 
                ? 'bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] hover:opacity-90 shadow-md' 
                : 'bg-gray-400 cursor-not-allowed opacity-70'
            }`}
          >
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
