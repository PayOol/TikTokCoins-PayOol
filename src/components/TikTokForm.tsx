import React from 'react';
import { useTranslation } from 'react-i18next';
import { TikTokCredentials } from '../types';
import { User, Lock, X, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  onSubmit: (data: TikTokCredentials) => void;
  onCancel: () => void;
}

export function TikTokFormModal({ onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState<TikTokCredentials>({
    username: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 fade-in">
      <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)]">
        {/* En-tête avec dégradé */}
        <div className="bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] p-6 relative">
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30 transition-colors"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-1">{t('tiktokForm.title')}</h2>
          <p className="text-white text-opacity-80 text-sm">
            {t('tiktokForm.subtitle')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="username" className="tiktok-label flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--tiktok-red)]" />
              <span>{t('tiktokForm.usernameLabel')}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                required
                className="tiktok-input pl-10"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder={t('tiktokForm.usernamePlaceholder')}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                @
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="tiktok-label flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--tiktok-red)]" />
              <span>{t('tiktokForm.passwordLabel')}</span>
            </label>
            <input
              type="password"
              id="password"
              required
              className="tiktok-input"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={t('tiktokForm.passwordPlaceholder')}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="tiktok-button w-full flex items-center justify-center gap-2"
            >
              {t('tiktokForm.nextButton')}
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-center mt-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}