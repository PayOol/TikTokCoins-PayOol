import React from 'react';
import { Mail, ArrowLeft, ArrowRight, X, ShieldCheck } from 'lucide-react';

interface Props {
  onSubmit: (email: string) => void;
  onCancel: () => void;
}

export function EmailFormModal({ onSubmit, onCancel }: Props) {
  const [email, setEmail] = React.useState('');
  const [isValid, setIsValid] = React.useState(false);

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
    if (isValid) {
      onSubmit(email);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 fade-in">
      <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)]">
        {/* En-tête avec dégradé */}
        <div className="bg-gradient-to-r from-[var(--tiktok-red)] to-purple-600 p-6 relative">
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30 transition-colors"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-1">Confirmation de paiement</h2>
          <p className="text-white text-opacity-80 text-sm">
            Une dernière étape avant de finaliser votre achat
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="email" className="tiktok-label flex items-center gap-2">
              <Mail className="w-4 h-4 text-[var(--tiktok-red)]" />
              <span>Votre adresse email</span>
            </label>
            
            <input
              type="email"
              id="email"
              required
              className={`tiktok-input ${isValid ? 'border-green-500' : ''}`}
              value={email}
              onChange={handleChange}
              placeholder="exemple@email.com"
            />
            
            <p className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mt-2">
              <ShieldCheck className="w-3 h-3 text-[var(--text-tertiary)]" />
              <span>Cet email sera utilisé pour la confirmation de votre recharge</span>
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="tiktok-button w-full flex items-center justify-center gap-2"
              disabled={!isValid}
            >
              <span>Procéder au paiement</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-center py-2 flex items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
