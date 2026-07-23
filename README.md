# Maysanté Admin

Plateforme d'administration de Maysanté, accessible sur [admin.maysante.be](https://admin.maysante.be). L'application tourne sur le **port 3001**.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **MySQL** via `mysql2` (base partagée avec le site maysante.be)
- **Resend** pour l'envoi d'emails
- **Anthropic SDK** pour la génération IA d'articles
- **recharts** pour les graphiques de statistiques
- **node-cron** pour la planification interne

## Fonctionnalités

- **Demandes** : gestion des demandes de contact et de rappel téléphonique reçues via le site.
- **Statistiques** : statistiques de visite maison basées sur la table `analytics_events`, partagée avec le site public.
- **Blog** : gestion des articles avec éditeur TipTap ; génération IA quotidienne via un cron interne (07:00 Europe/Brussels) avec option de publication automatique.
- **Emails** : gestion des adresses de notification.
- **Admins** : gestion des comptes administrateurs (invitation par email, réinitialisation de mot de passe).

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run create-admin         # créer le premier compte admin
npm run dev                  # http://localhost:3001
```

## Déploiement

```bash
npm run build
npm start
```

En production, l'application est gérée par PM2 (ex. `pm2 start npm --name maysante-admin -- start`).

## Variables d'environnement

| Variable | Description |
| --- | --- |
| `DB_HOST` | Hôte du serveur MySQL |
| `DB_PORT` | Port MySQL (3306 par défaut) |
| `DB_USER` | Utilisateur MySQL |
| `DB_PASSWORD` | Mot de passe MySQL |
| `DB_NAME` | Nom de la base de données |
| `JWT_SECRET` | Secret de signature des sessions (`openssl rand -hex 32`) |
| `RESEND_API_KEY` | Clé API Resend pour l'envoi d'emails |
| `RESEND_FROM_EMAIL` | Adresse expéditrice des emails |
| `CORP_LOGO_URL` | URL du logo utilisé dans les emails |
| `ADMIN_BASE_URL` | URL publique de la plateforme admin |
| `NEXT_PUBLIC_APP_URL` | URL utilisée dans les emails d'invitation/réinitialisation (obligatoire) |
| `ANTHROPIC_API_KEY` | Clé API Anthropic pour la génération d'articles |
| `ANTHROPIC_MODEL` | Modèle Anthropic utilisé (ex. `claude-opus-4-8`) |
| `BLOG_GENERATE_SECRET` | Secret pour un déclencheur externe optionnel de génération (`Authorization: Bearer <secret>`) |
| `BLOG_CRON_DISABLED` | Mettre à `1` pour désactiver le cron interne (ex. en dev) |
