import { VirtualCardPackage } from '../types';

export const virtualCardPackages: VirtualCardPackage[] = [
  {
    id: 1,
    name: {
      fr: 'VISA BASIQUE',
      en: 'BASIC VISA',
    },
    description: {
      fr: 'Parfait pour commencer - Carte virtuelle prépayée sans frais mensuels',
      en: 'Perfect to get started - Prepaid virtual card with no monthly fees',
    },
    price: 5000,
    currency: 'XAF',
    variant: 'visa-basic',
    validity: {
      fr: 'Validité: 3 ans',
      en: 'Validity: 3 years',
    },
    brand: 'visa',
    features: [
      { fr: 'Carte prépayée', en: 'Prepaid card' },
      { fr: '3D Secure', en: '3D Secure' },
      { fr: 'Sans vérification KYC', en: 'No KYC verification' },
      { fr: 'Sans frais mensuels', en: 'No monthly fees' },
      { fr: '3 années de validité', en: '3 years validity' },
      { fr: 'Idéal pour les achats en ligne', en: 'Ideal for online purchases' },
    ],
    bonus: {
      fr: '1$ de solde gratuit (offert !)',
      en: '$1 free balance included',
    },
  },
  {
    id: 2,
    name: {
      fr: 'MASTERCARD BASIQUE',
      en: 'BASIC MASTERCARD',
    },
    description: {
      fr: 'Notre option la plus populaire - Offre le meilleur rapport qualité/prix',
      en: 'Our most popular option - Best value for money',
    },
    price: 6000,
    currency: 'XAF',
    variant: 'mastercard-basic',
    popular: true,
    validity: {
      fr: 'Validité: 3 ans',
      en: 'Validity: 3 years',
    },
    brand: 'mastercard',
    features: [
      { fr: 'Carte prépayée', en: 'Prepaid card' },
      { fr: '3D Secure', en: '3D Secure' },
      { fr: 'Sans vérification KYC', en: 'No KYC verification' },
      { fr: 'Sans frais mensuels', en: 'No monthly fees' },
      { fr: '3 années de validité', en: '3 years validity' },
      { fr: 'Acceptée partout', en: 'Accepted everywhere' },
    ],
    bonus: {
      fr: '1$ de solde gratuit (offert !)',
      en: '$1 free balance included',
    },
  },
  {
    id: 3,
    name: {
      fr: 'MASTERCARD PREMIUM',
      en: 'PREMIUM MASTERCARD',
    },
    description: {
      fr: 'Fonctionnalités avancées - Idéal pour des achats plus importants',
      en: 'Advanced features - Ideal for larger purchases',
    },
    price: 8500,
    currency: 'XAF',
    variant: 'mastercard-premium',
    validity: {
      fr: 'Validité: 3 ans',
      en: 'Validity: 3 years',
    },
    brand: 'mastercard',
    features: [
      { fr: 'Carte de débit', en: 'Debit card' },
      { fr: '3D Secure', en: '3D Secure' },
      { fr: 'Achats sur Amazon', en: 'Amazon purchases' },
      { fr: 'Achats sur Alibaba', en: 'Alibaba purchases' },
      { fr: 'Retraits possibles', en: 'Withdrawals possible' },
      { fr: 'Compatible PayPal', en: 'PayPal compatible' },
    ],
    unavailableFeatures: [
      { fr: 'Ne prend pas en charge les retraits PayPal', en: 'Does not support PayPal withdrawals' },
    ],
    bonus: {
      fr: '1$ de solde gratuit (offert !)',
      en: '$1 free balance included',
    },
  },
  {
    id: 4,
    name: {
      fr: 'MASTERCARD PLATINIUM',
      en: 'PLATINUM MASTERCARD',
    },
    description: {
      fr: 'Expérience premium - Sans limite avec des avantages exclusifs',
      en: 'Premium experience - No limits with exclusive benefits',
    },
    price: 10000,
    currency: 'XAF',
    variant: 'mastercard-platinum',
    validity: {
      fr: 'Validité: 3 ans',
      en: 'Validity: 3 years',
    },
    brand: 'mastercard',
    features: [
      { fr: 'Carte de débit', en: 'Debit card' },
      { fr: '3D Secure', en: '3D Secure' },
      { fr: 'Aucun plafond sur les recharges', en: 'No recharge ceiling' },
      { fr: 'Compatible Google Pay', en: 'Google Pay compatible' },
      { fr: 'Compatible Apple Pay', en: 'Apple Pay compatible' },
      { fr: 'Bonus de 3$ offert', en: '$3 bonus included' },
    ],
    bonus: {
      fr: 'Bonus de 3$ offert',
      en: '$3 bonus included',
    },
  },
];
