#!/bin/bash

# Script de déploiement Docker pour TikTokCoins PayOol
# Usage: ./deploy.sh [--update]

set -e

echo "========================================="
echo "  Déploiement TikTokCoins PayOol"
echo "========================================="
echo ""

# Mise à jour depuis GitHub si demandé
if [ "$1" == "--update" ]; then
    echo "Mise à jour depuis GitHub..."
    git pull origin main
    echo "✅ Code mis à jour"
    echo ""
fi

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env manquant"
    echo "Création depuis env.docker.example..."
    cp env.docker.example .env
    echo "✅ Fichier .env créé"
    echo "⚠️  IMPORTANT: Éditez .env et configurez SMTP_PASS"
    echo ""
    read -p "Appuyez sur Entrée après avoir configuré .env..."
fi

# Vérifier le réseau Docker
echo "Vérification du réseau Docker..."
if ! docker network inspect payool-network >/dev/null 2>&1; then
    echo "Création du réseau payool-network..."
    docker network create payool-network
    echo "✅ Réseau créé"
else
    echo "✅ Réseau payool-network existe"
fi
echo ""

# Arrêter les anciens containers
echo "Arrêt des anciens containers..."
docker-compose down 2>/dev/null || true
echo ""

# Build les images
echo "Build des images Docker..."
docker-compose build --no-cache
echo "✅ Build terminé"
echo ""

# Démarrer les services
echo "Démarrage des services..."
docker-compose up -d
echo "✅ Services démarrés"
echo ""

# Attendre que les services soient prêts
echo "Attente du démarrage des services..."
sleep 5

# Vérifier le statut
echo ""
echo "========================================="
echo "  Statut des Containers"
echo "========================================="
docker-compose ps
echo ""

# Test de santé
echo "========================================="
echo "  Tests de Santé"
echo "========================================="
echo ""

echo "Test Backend..."
if curl -s http://localhost:3001/api/health | grep -q "OK"; then
    echo "✅ Backend OK"
else
    echo "❌ Backend KO"
fi
echo ""

echo "Test Frontend..."
if curl -s http://localhost:8085 | grep -q "html"; then
    echo "✅ Frontend OK"
else
    echo "❌ Frontend KO"
fi
echo ""

# Afficher les logs
echo "========================================="
echo "  Logs (Ctrl+C pour quitter)"
echo "========================================="
echo ""
docker-compose logs -f
