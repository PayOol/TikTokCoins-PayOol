import React from 'react';
import { TikTokForm as TikTokFormData } from '../types';

interface Props {
  onSubmit: (data: TikTokFormData) => void;
  onCancel: () => void;
}

export function TikTokFormModal({ onSubmit, onCancel }: Props) {
  const [formData, setFormData] = React.useState<TikTokFormData>({
    username: '',
    userId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Identifiants TikTok</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur TikTok
            </label>
            <input
              type="text"
              id="username"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe TikTok
            </label>
            <input
              type="password"
              id="userId"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              value={formData.userId}
              onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
            />
          </div>



          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              Continuer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}