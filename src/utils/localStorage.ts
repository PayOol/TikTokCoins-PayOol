import { Purchase, User, TransactionStatus } from '../types';

// Clés pour le stockage local
const STORAGE_KEYS = {
  USER: 'tiktok_user',
  PURCHASE_HISTORY: 'purchaseHistory',
  TOTAL_COINS: 'totalCoins'
};

/**
 * Sauvegarde les données utilisateur dans le localStorage
 */
export const saveUserData = (user: User): void => {
  // Ne compter que les transactions réussies pour le solde total
  const successfulCoins = user.purchaseHistory
    .filter(purchase => purchase.status === 'success')
    .reduce((total, purchase) => total + purchase.amount, 0);
  
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.TOTAL_COINS, successfulCoins.toString());
  localStorage.setItem(STORAGE_KEYS.PURCHASE_HISTORY, JSON.stringify(user.purchaseHistory));
};

/**
 * Récupère les données utilisateur depuis le localStorage
 */
export const getUserData = (): User => {
  const userString = localStorage.getItem(STORAGE_KEYS.USER);
  
  if (userString) {
    try {
      const user = JSON.parse(userString) as User;
      
      // S'assurer que les dates sont des objets Date
      if (user.purchaseHistory) {
        user.purchaseHistory = user.purchaseHistory.map(purchase => ({
          ...purchase,
          date: new Date(purchase.date)
        }));
      }
      
      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
    }
  }
  
  // Retourner un utilisateur par défaut si aucune donnée n'est trouvée
  return {
    balance: 0,
    purchaseHistory: []
  };
};

/**
 * Ajoute un nouvel achat à l'historique et met à jour le solde si la transaction est réussie
 */
export const addPurchase = (purchase: Purchase): User => {
  const user = getUserData();
  
  // Mettre à jour le solde uniquement si la transaction est réussie
  const updatedBalance = purchase.status === 'success' 
    ? user.balance + purchase.amount 
    : user.balance;
  
  const updatedUser = {
    balance: updatedBalance,
    purchaseHistory: [purchase, ...user.purchaseHistory]
  };
  
  // Sauvegarder les données mises à jour
  saveUserData(updatedUser);
  
  return updatedUser;
};

/**
 * Récupère l'historique des achats
 */
export const getPurchaseHistory = (): Purchase[] => {
  const historyString = localStorage.getItem(STORAGE_KEYS.PURCHASE_HISTORY);
  
  if (historyString) {
    try {
      const history = JSON.parse(historyString) as Purchase[];
      
      // S'assurer que les dates sont des objets Date et que le statut existe
      return history.map(purchase => ({
        ...purchase,
        date: new Date(purchase.date),
        status: purchase.status || 'pending' // Assurer la compatibilité avec les anciennes données
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des achats:', error);
    }
  }
  
  return [];
};

/**
 * Récupère le nombre total de pièces (uniquement des transactions réussies)
 */
export const getTotalCoins = (): number => {
  const totalCoinsString = localStorage.getItem(STORAGE_KEYS.TOTAL_COINS);
  
  if (totalCoinsString) {
    return parseInt(totalCoinsString, 10);
  }
  
  // Si aucune valeur n'est stockée, calculer à partir de l'historique
  const user = getUserData();
  const successfulCoins = user.purchaseHistory
    .filter(purchase => purchase.status === 'success')
    .reduce((total, purchase) => total + purchase.amount, 0);
  
  return successfulCoins;
};

/**
 * Efface toutes les données utilisateur du localStorage
 */
export const clearUserData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.PURCHASE_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.TOTAL_COINS);
};

/**
 * Met à jour le statut d'une transaction
 */
export const updateTransactionStatus = (orderId: string, status: TransactionStatus, errorMessage?: string): User => {
  const user = getUserData();
  
  // Trouver la transaction et mettre à jour son statut
  const updatedPurchaseHistory = user.purchaseHistory.map(purchase => {
    if (purchase.id === orderId) {
      return {
        ...purchase,
        status,
        errorMessage
      };
    }
    return purchase;
  });
  
  // Recalculer le solde en fonction des transactions réussies
  const successfulCoins = updatedPurchaseHistory
    .filter(purchase => purchase.status === 'success')
    .reduce((total, purchase) => total + purchase.amount, 0);
  
  const updatedUser = {
    balance: successfulCoins,
    purchaseHistory: updatedPurchaseHistory
  };
  
  // Sauvegarder les données mises à jour
  saveUserData(updatedUser);
  
  return updatedUser;
};
