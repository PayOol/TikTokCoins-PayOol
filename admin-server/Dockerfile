# Admin TikTok Coins : image d'exécution, sans dépendance npm.
# La base et la clé de chiffrement sont dans /data (volume hors dépôt).
FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
