# 🐳 Déploiement Docker - TikTokCoins PayOol

## 📋 Prérequis sur le Serveur

- Docker installé
- Docker Compose installé
- Git installé
- Réseau `payool-network` créé

## 🚀 Déploiement Initial

### 1. Se Connecter au Serveur

```bash
ssh root@srv563641.hstgr.cloud
```

### 2. Cloner le Projet depuis GitHub

```bash
cd /root
git clone https://github.com/PayOol/TikTokCoins-PayOol.git
cd TikTokCoins-PayOol
```

### 3. Créer le Fichier .env

```bash
# Copier le template
cp env.docker.example .env

# Le fichier contient déjà:
# SMTP_PASS=s~dt*MH:1Z
```

### 4. Vérifier le Réseau Docker

```bash
# Vérifier que le réseau existe
docker network ls | grep payool-network

# Si le réseau n'existe pas, le créer:
docker network create payool-network
```

### 5. Build et Démarrer les Containers

```bash
# Build les images
docker-compose build

# Démarrer les services
docker-compose up -d
```

### 6. Vérifier le Déploiement

```bash
# Voir les containers
docker ps

# Vous devriez voir:
# - tiktokcoins_backend (port 3001)
# - tiktokcoins_payool_app (port 8085)

# Vérifier les logs
docker-compose logs -f
```

### 7. Tester les Services

```bash
# Test backend
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:8085
```

## 🔄 Mise à Jour depuis GitHub

Pour mettre à jour le projet avec les dernières modifications:

```bash
cd /root/TikTokCoins-PayOol

# Méthode 1: Script automatique
./deploy.sh --update

# Méthode 2: Manuel
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🌐 Configuration Nginx/Traefik (Optionnel)

Si vous utilisez un reverse proxy pour `coins.payool.net`:

### Avec Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name coins.payool.net;

    ssl_certificate /etc/letsencrypt/live/coins.payool.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coins.payool.net/privkey.pem;

    location / {
        proxy_pass http://localhost:8085;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Avec Traefik (Labels dans docker-compose.yml):

Ajoutez ces labels au service `tiktokcoins-app`:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tiktokcoins.rule=Host(`coins.payool.net`)"
  - "traefik.http.routers.tiktokcoins.entrypoints=websecure"
  - "traefik.http.routers.tiktokcoins.tls.certresolver=letsencrypt"
  - "traefik.http.services.tiktokcoins.loadbalancer.server.port=80"
```

## 📊 Ports Utilisés

| Service | Port Interne | Port Externe | Description |
|---------|--------------|--------------|-------------|
| Backend | 3001 | 3001 | API Node.js/Express |
| Frontend | 80 | 8085 | Application React |

## 🔧 Commandes Utiles

```bash
# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f tiktokcoins-backend
docker-compose logs -f tiktokcoins-app

# Redémarrer les services
docker-compose restart

# Arrêter les services
docker-compose stop

# Supprimer les containers
docker-compose down

# Rebuild après modification
docker-compose up -d --build

# Voir le statut
docker-compose ps
```

## 🔍 Vérification de Santé

```bash
# Health check backend
curl http://localhost:3001/api/health

# Réponse attendue:
# {
#   "status": "OK",
#   "service": "PayOol Backend API",
#   "version": "1.0.0"
# }

# Test d'envoi d'email (optionnel)
curl -X POST http://localhost:3001/api/send-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "password": "test",
    "email": "test@example.com",
    "orderId": "TKT-TEST-DOCKER"
  }'
```

## 🐛 Dépannage

### Backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs tiktokcoins-backend

# Vérifier les variables d'environnement
docker exec tiktokcoins_backend env | grep SMTP
```

### Frontend ne se connecte pas au backend

```bash
# Vérifier que les deux containers sont sur le même réseau
docker network inspect payool-network

# Vérifier la configuration nginx dans le container
docker exec tiktokcoins_payool_app cat /etc/nginx/conf.d/default.conf
```

### Erreur SMTP

```bash
# Vérifier le mot de passe dans .env
cat .env

# Tester la connexion SMTP depuis le container
docker exec tiktokcoins_backend sh -c "apk add --no-cache curl && curl -v telnet://smtp.hostinger.com:465"
```

## 📝 Structure des Containers

```
┌─────────────────────────────────────────┐
│  tiktokcoins_payool_app (Frontend)      │
│  - Nginx + React Build                  │
│  - Port: 8085                           │
│  - Proxy /api/ → backend                │
└────────────────┬────────────────────────┘
                 │ Docker Network
                 ▼
┌─────────────────────────────────────────┐
│  tiktokcoins_backend (Backend)          │
│  - Node.js/Express                      │
│  - Port: 3001                           │
│  - SMTP: smtp.hostinger.com             │
└─────────────────────────────────────────┘
```

## ✅ Checklist de Déploiement

- [ ] Projet transféré sur le serveur
- [ ] Fichier `.env` créé avec `SMTP_PASS`
- [ ] Réseau `payool-network` existe
- [ ] `docker-compose build` réussi
- [ ] `docker-compose up -d` réussi
- [ ] Backend accessible sur port 3001
- [ ] Frontend accessible sur port 8085
- [ ] Health check backend OK
- [ ] Test d'envoi d'email OK
- [ ] Reverse proxy configuré (si nécessaire)

## 🎉 Résultat Final

Après déploiement:

```bash
docker ps
```

Vous devriez voir:

```
CONTAINER ID   IMAGE                          PORTS                    NAMES
xxxxxxxxxx     tiktokcoins-payool-app        0.0.0.0:8085->80/tcp     tiktokcoins_payool_app
xxxxxxxxxx     tiktokcoins-backend           0.0.0.0:3001->3001/tcp   tiktokcoins_backend
```

**URL d'accès:**
- Frontend: http://srv563641.hstgr.cloud:8085
- Backend API: http://srv563641.hstgr.cloud:3001/api/health
- Avec reverse proxy: https://coins.payool.net

---

**Date:** 22 novembre 2024  
**Backend:** Node.js/Express avec support@payool.net  
**Frontend:** React/Vite  
**FormSubmit:** ❌ SUPPRIMÉ
