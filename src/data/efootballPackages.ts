export type EFootballPlatform = 'mobile' | 'steam';

export interface EFootballPackage {
  id: string;
  coins: number;
  price: number;
}

export interface EFootballCatalog {
  platform: EFootballPlatform;
  packages: EFootballPackage[];
}

export const efootballCatalogs: EFootballCatalog[] = [
  {
    platform: 'mobile',
    packages: [
      { id: 'mobile-137', coins: 137, price: 1428 },
      { id: 'mobile-315', coins: 315, price: 3228 },
      { id: 'mobile-578', coins: 578, price: 5748 },
      { id: 'mobile-788', coins: 788, price: 7788 },
      { id: 'mobile-1092', coins: 1092, price: 10548 },
      { id: 'mobile-2237', coins: 2237, price: 21588 },
      { id: 'mobile-3413', coins: 3413, price: 32388 },
      { id: 'mobile-5985', coins: 5985, price: 52788 },
      { id: 'mobile-13440', coins: 13440, price: 112788 },
      { id: 'mobile-32200', coins: 32200, price: 263988 },
    ],
  },
  {
    platform: 'steam',
    packages: [
      { id: 'steam-105', coins: 105, price: 1200 },
      { id: 'steam-546', coins: 546, price: 5988 },
      { id: 'steam-1103', coins: 1103, price: 11988 },
      { id: 'steam-2258', coins: 2258, price: 23988 },
      { id: 'steam-3465', coins: 3465, price: 35988 },
      { id: 'steam-6090', coins: 6090, price: 59988 },
      { id: 'steam-12600', coins: 12600, price: 119988 },
      { id: 'steam-32600', coins: 32600, price: 299988 },
    ],
  },
];
