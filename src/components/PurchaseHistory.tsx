import { Coins, CalendarDays, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Purchase, TransactionStatus } from '../types';

interface PurchaseHistoryProps {
  purchases: Purchase[];
}

export const PurchaseHistory = ({ purchases }: PurchaseHistoryProps) => {
  // Fonctions utilitaires pour les styles en fonction du statut
  const getStatusBorderColor = (status: TransactionStatus): string => {
    switch (status) {
      case 'success':
        return 'border-green-900 border-opacity-30';
      case 'failed':
        return 'border-red-900 border-opacity-30';
      default:
        return 'border-[var(--border-dark)]';
    }
  };

  const getStatusBackgroundColor = (status: TransactionStatus): string => {
    switch (status) {
      case 'success':
        return 'bg-gradient-to-br from-green-600 to-green-800';
      case 'failed':
        return 'bg-gradient-to-br from-red-600 to-red-800';
      case 'pending':
        return 'bg-gradient-to-br from-yellow-500 to-yellow-700';
      default:
        return 'bg-gradient-to-br from-[var(--tiktok-blue)] to-[var(--tiktok-red)]';
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'success':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 bg-opacity-20 text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Réussi</span>
          </span>
        );
      case 'failed':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-900 bg-opacity-20 text-red-400 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Échoué</span>
          </span>
        );
      case 'pending':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900 bg-opacity-20 text-yellow-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>En attente</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (purchases.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] rounded-[var(--radius-md)] p-6 sm:p-8 text-center shadow-[var(--shadow-sm)] border border-[var(--border-dark)]">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-[var(--background-elevated-2)] flex items-center justify-center">
          <CalendarDays className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="text-base sm:text-lg font-medium mb-1">Aucun historique</h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
          Vous n'avez pas encore effectué d'achat de pièces TikTok.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {purchases.map((purchase) => (
        <div key={purchase.id} className={`bg-[var(--card-bg)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 border ${getStatusBorderColor(purchase.status)}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusBackgroundColor(purchase.status)}`}>
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-medium">{purchase.amount} pièces</span>
                {getStatusBadge(purchase.status)}
              </div>
              <div className="text-xs sm:text-sm text-[var(--text-secondary)]">{formatDate(purchase.date)}</div>
              {purchase.status === 'failed' && purchase.errorMessage && (
                <div className="text-xs text-red-400 mt-1">{purchase.errorMessage}</div>
              )}
            </div>
          </div>
          <span className="text-sm sm:text-base font-bold text-right">{purchase.price.toLocaleString()} FCFA</span>
        </div>
      ))}
    </div>
  );
}