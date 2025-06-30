# 📧 MailFlow - Gestion Numérique des Courriers

## 🎯 Vue d'Ensemble

MailFlow est une application web moderne de gestion numérique des courriers, entièrement construite avec **MySQL** comme base de données principale. L'application permet de gérer efficacement les courriers d'arrivée et de départ avec un système complet de catégorisation, étiquetage et recherche.

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- Authentification JWT sécurisée
- Gestion des rôles (Admin, Manager, Utilisateur)
- Système de permissions granulaires
- Hachage des mots de passe avec bcrypt

### 📧 Gestion des Courriers
- **Courriers d'arrivée** : Enregistrement, suivi et traitement
- **Courriers de départ** : Création et archivage
- Upload et stockage des scans de documents
- Système de références uniques

### 🏷️ Organisation
- **Catégories** : Classification par type de document
- **Tags** : Étiquetage par nature, priorité et statut
- **Expéditeurs** : Base de données des contacts
- Système de priorités (Faible, Normal, Élevé, Urgent)

### 🔍 Recherche & Rapports
- Recherche avancée multi-critères
- Filtrage par date, catégorie, priorité
- Statistiques en temps réel
- Tableau de bord interactif

### ⚙️ Administration
- Gestion des utilisateurs
- Configuration des paramètres système
- Interface d'administration complète
- Notifications en temps réel

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Tailwind CSS** pour le design
- **Lucide React** pour les icônes
- **React Router** pour la navigation
- **Date-fns** pour la gestion des dates

### Backend & Base de Données
- **MySQL 8.0+** comme base de données principale
- **mysql2** pour la connectivité Node.js
- **bcryptjs** pour le hachage des mots de passe
- **jsonwebtoken** pour l'authentification JWT
- **uuid** pour la génération d'identifiants uniques

### Outils de Développement
- **Vite** comme bundler
- **ESLint** pour la qualité du code
- **TypeScript** pour la sécurité des types
- **PostCSS** et **Autoprefixer**

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+
- MySQL 8.0+ ou MariaDB 10.5+
- npm ou yarn

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de la base de données

#### Créer la base de données MySQL
```sql
CREATE DATABASE mailflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mailflow'@'localhost' IDENTIFIED BY 'mailflow';
GRANT ALL PRIVILEGES ON mailflow.* TO 'mailflow'@'localhost';
FLUSH PRIVILEGES;
```

#### Importer la structure
```bash
mysql -u mailflow -p mailflow < database/mailflow_structure.sql
```

### 3. Configuration de l'environnement

Le fichier `.env` est déjà configuré avec les paramètres par défaut :

```env
DATABASE_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=mailflow
DB_PASSWORD=mailflow
DB_NAME=mailflow
JWT_SECRET=MailFlow2025SecretKey!
```

### 4. Test et démarrage

```bash
# Test de la connexion MySQL
npm run mysql:test

# Démarrage de l'application
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🔑 Connexion par Défaut

### Compte Administrateur
- **Email** : `admin@admin.com`
- **Mot de passe** : `admin123`

### Base de Données MySQL
- **Host** : `localhost:3306`
- **Utilisateur** : `mailflow`
- **Mot de passe** : `mailflow`
- **Base** : `mailflow`

## 📊 Structure de la Base de Données

### Tables Principales
- `users` - Utilisateurs et authentification
- `categories` - Catégories de documents
- `tags` - Étiquettes de classification
- `senders` - Expéditeurs et contacts
- `incoming_mails` - Courriers d'arrivée
- `outgoing_mails` - Courriers de départ
- `mail_tags` - Relations courriers-tags
- `settings` - Paramètres système

### Données Initiales
- 1 utilisateur administrateur
- 5 catégories par défaut
- 7 tags par défaut
- Paramètres système de base

## 🎨 Interface Utilisateur

### Design System
- Design moderne et responsive
- Palette de couleurs cohérente
- Animations et micro-interactions
- Interface intuitive et accessible

### Composants Principaux
- Dashboard avec statistiques en temps réel
- Formulaires de saisie optimisés
- Tables de données interactives
- Système de notifications
- Modales et overlays

## 🔧 Scripts Disponibles

```bash
npm run dev          # Démarrage en mode développement
npm run build        # Construction pour la production
npm run preview      # Aperçu de la version de production
npm run lint         # Vérification du code
npm run mysql:test   # Test de connexion MySQL
```

## 📁 Structure du Projet

```
mailflow/
├── src/
│   ├── components/          # Composants React
│   │   ├── Admin/          # Modules d'administration
│   │   ├── Auth/           # Authentification
│   │   ├── Dashboard/      # Tableau de bord
│   │   ├── Layout/         # Mise en page
│   │   ├── Mail/           # Gestion des courriers
│   │   ├── Search/         # Recherche
│   │   └── Settings/       # Paramètres
│   ├── config/             # Configuration
│   ├── hooks/              # Hooks React personnalisés
│   ├── services/           # Services et API
│   ├── types/              # Types TypeScript
│   └── utils/              # Utilitaires
├── database/               # Scripts SQL
├── scripts/                # Scripts de maintenance
├── uploads/                # Dossiers d'upload
└── public/                 # Fichiers statiques
```

## 🔒 Sécurité

### Mesures Implémentées
- Authentification JWT avec expiration
- Hachage des mots de passe avec bcrypt (12 rounds)
- Validation des entrées utilisateur
- Protection contre les injections SQL
- Gestion des permissions par rôle
- Sessions sécurisées

### Bonnes Pratiques
- Mots de passe forts requis
- Tokens d'authentification avec expiration
- Validation côté client et serveur
- Logs d'activité pour l'audit

## 🚀 Déploiement

### Version de Production

1. **Build de l'application**
```bash
npm run build
```

2. **Configuration de production**
- Modifier les variables d'environnement
- Configurer un serveur web (Nginx, Apache)
- Sécuriser la base de données MySQL
- Configurer HTTPS

3. **Optimisations**
- Compression des assets
- Cache des ressources statiques
- Monitoring des performances
- Sauvegarde automatique

## 📈 Performance

### Optimisations Incluses
- Pool de connexions MySQL configuré
- Requêtes SQL optimisées avec index
- Lazy loading des composants
- Compression des images
- Cache des données fréquentes

### Métriques
- Temps de chargement < 2s
- Requêtes SQL optimisées
- Interface responsive sur tous les appareils
- Support des navigateurs modernes

## 🤝 Contribution

### Standards de Code
- TypeScript strict activé
- ESLint pour la qualité du code
- Prettier pour le formatage
- Conventions de nommage cohérentes

### Workflow de Développement
1. Fork du projet
2. Création d'une branche feature
3. Développement avec tests
4. Pull request avec description

## 📞 Support

### Résolution des Problèmes
- Vérifier la connexion MySQL
- Consulter les logs de l'application
- Tester avec `npm run mysql:test`
- Vérifier les permissions de fichiers

### Logs et Débogage
- Console du navigateur pour les erreurs frontend
- Logs MySQL pour les erreurs de base de données
- Variables d'environnement pour la configuration

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🎉 Remerciements

Merci à tous les contributeurs et à la communauté open source pour les outils et bibliothèques utilisés dans ce projet.

---

**MailFlow v1.0** - Gestion Numérique des Courriers avec MySQL