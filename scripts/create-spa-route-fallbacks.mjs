import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const routes = [
  'pieces-tiktok',
  'comptes-tiktok',
  'cartes-virtuelles',
  'pieces-efootball',
  'payment/confirmation',
  'payment/success',
  'payment/failure',
];

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(rootDir, 'dist');
const indexFile = join(distDir, 'index.html');

await Promise.all(
  routes.map(async (route) => {
    const routeDir = join(distDir, route);
    await mkdir(routeDir, { recursive: true });
    await copyFile(indexFile, join(routeDir, 'index.html'));
  })
);
