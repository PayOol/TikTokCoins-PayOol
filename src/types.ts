export interface CoinPackage {
  id: number;
  amount: number;
  price: number;
  bonus?: number;
  isCustom?: boolean;
}

export interface User {
  balance: number;
  purchaseHistory: Purchase[];
}

export interface Purchase {
  id: string;
  packageId: number;
  amount: number;
  price: number;
  date: Date;
}

export interface TikTokForm {
  username: string;
  userId: string; // On garde le même nom de propriété pour éviter des changements en cascade
}