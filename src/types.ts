export interface CoinPackage {
  id: number;
  amount: number;
  price: number;
  bonus?: number;
  isCustom?: boolean;
  disabled?: boolean;
}

export interface User {
  balance: number;
  purchaseHistory: Purchase[];
}

export type TransactionStatus = 'success' | 'pending' | 'failed';

export interface Purchase {
  id: string;
  packageId: number;
  amount: number;
  price: number;
  date: Date;
  status: TransactionStatus;
  errorMessage?: string;
  serviceType?: 'coins' | 'accounts';
}

export interface TikTokForm {
  username: string;
  userId: string; // On garde le même nom de propriété pour éviter des changements en cascade
}

export interface TikTokCredentials {
  username: string;
  password: string;
  whatsapp: string;
}

export interface AccountPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  popular?: boolean;
  translationKey: string;
}

export interface MonetizableAccountForm {
  email: string;
  whatsapp: string;
  desiredUsername?: string;
}