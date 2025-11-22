# 🚀 Déploiement Rapide - TikTokCoins PayOol

## ⚡ Installation en 5 Minutes

### Sur le Serveur VPS

```bash
# 1. Cloner le projet
cd /root
git clone https://github.com/PayOol/TikTokCoins-PayOol.git
cd TikTokCoins-PayOol

# 2. Configurer l'environnement
cp env.docker.example .env
nano .env  # Vérifier SMTP_PASS=s~dt*MH:1Z

# 3. Créer le réseau Docker (si nécessaire)
docker network create payool-network

# 4. Déployer
chmod +x deploy.sh
./deploy.sh
```

## 📦 Ce qui sera déployé

- **Backend:** `tiktokcoins_backend` sur port 3001
- **Frontend:** `tiktokcoins_payool_app` sur port 8085

## 🔄 Mise à Jour

```bash
cd /root/TikTokCoins-PayOol
./deploy.sh --update
```

## ✅ Vérification

```bash
# Voir les containers
docker ps | grep tiktokcoins

# Test backend
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:8085
```

## 🌐 Accès

- **Local:** http://srv563641.hstgr.cloud:8085
- **Avec reverse proxy:** https://coins.payool.net

## 📊 Commandes Utiles

```bash
# Logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Arrêter
docker-compose stop

# Supprimer
docker-compose down
```

## 🆘 Problème?

Consultez `DEPLOIEMENT_DOCKER.md` pour le guide complet.
