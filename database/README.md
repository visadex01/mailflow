# 📧 MailFlow - Base de Données MySQL

## 🗄️ Structure de la Base de Données

Cette base de données MySQL contient toute la structure nécessaire pour l'application MailFlow de gestion numérique des courriers.

## 📋 Installation

### 1. Prérequis
- MySQL 8.0+ ou MariaDB 10.5+
- Accès administrateur MySQL

### 2. Installation de la base de données

```bash
# Se connecter à MySQL en tant qu'administrateur
mysql -u root -p

# Exécuter le script de création
source /chemin/vers/mailflow_structure.sql

# Ou importer directement
mysql -u root -p < mailflow_structure.sql
```

### 3. Paramètres de connexion

```
Host: localhost
Port: 3306
Database: mailflow
User: mailflow
Password: mailflow
```

## 🔑 Comptes par défaut

### Administrateur de l'application
```
Email: admin@admin.com
Mot de passe: admin123
```

## 📊 Tables de la base de données

### 👥 `users`
Gestion des utilisateurs et authentification
- `id` - Identifiant unique (UUID)
- `email` - Adresse email (unique)
- `password` - Mot de passe haché (bcrypt)
- `display_name` - Nom d'affichage
- `role` - Rôle (admin, manager, user)
- `permissions` - Permissions JSON
- `is_active` - Statut actif
- `last_login` - Dernière connexion
- `created_at` - Date de création

### 📁 `categories`
Catégories de classification des courriers
- `id` - Identifiant unique (UUID)
- `name` - Nom de la catégorie (unique)
- `description` - Description
- `color` - Couleur d'affichage (hex)
- `is_active` - Statut actif
- `created_at` - Date de création
- `created_by` - Créé par (référence users)

### 🏷️ `tags`
Tags pour l'étiquetage des courriers
- `id` - Identifiant unique (UUID)
- `name` - Nom du tag
- `type` - Type (nature, priority, status)
- `color` - Couleur d'affichage (hex)
- `is_active` - Statut actif
- `created_at` - Date de création
- `created_by` - Créé par (référence users)

### 👤 `senders`
Expéditeurs des courriers
- `id` - Identifiant unique (UUID)
- `name` - Nom de l'expéditeur
- `email` - Adresse email
- `phone` - Téléphone
- `fax` - Fax
- `organization` - Organisation
- `is_active` - Statut actif
- `created_at` - Date de création
- `created_by` - Créé par (référence users)

### 📨 `incoming_mails`
Courriers d'arrivée
- `id` - Identifiant unique (UUID)
- `reference` - Référence unique
- `subject` - Objet du courrier
- `summary` - Résumé
- `category_id` - Catégorie (référence categories)
- `sender_id` - Expéditeur (référence senders)
- `arrival_date` - Date d'arrivée
- `priority` - Priorité (low, normal, high, urgent)
- `scan_url` - URL du scan
- `is_processed` - Statut traité
- `created_at` - Date de création
- `created_by` - Créé par (référence users)

### 📤 `outgoing_mails`
Courriers de départ
- `id` - Identifiant unique (UUID)
- `reference` - Référence unique
- `subject` - Objet du courrier
- `content` - Contenu
- `category_id` - Catégorie (référence categories)
- `send_date` - Date d'envoi
- `priority` - Priorité (low, normal, high, urgent)
- `scan_url` - URL du scan
- `is_processed` - Statut traité
- `created_at` - Date de création
- `created_by` - Créé par (référence users)

### 🔗 `mail_tags`
Relation many-to-many entre courriers et tags
- `id` - Identifiant unique (UUID)
- `mail_id` - ID du courrier
- `mail_type` - Type (incoming, outgoing)
- `tag_id` - Tag (référence tags)
- `created_at` - Date de création

### ⚙️ `settings`
Paramètres de l'application
- `id` - Identifiant unique (UUID)
- `key` - Clé du paramètre (unique)
- `value` - Valeur JSON
- `description` - Description
- `created_at` - Date de création
- `updated_at` - Date de modification

## 🔐 Sécurité

### Contraintes d'intégrité
- Clés étrangères pour maintenir la cohérence
- Contraintes d'unicité sur les champs critiques
- Index pour optimiser les performances

### Permissions
- Utilisateur `mailflow` avec accès complet à la base `mailflow`
- Mots de passe hachés avec bcrypt (12 rounds)
- Authentification JWT côté application

## 📈 Données initiales

### Utilisateur administrateur
- Email: `admin@admin.com`
- Mot de passe: `admin123`
- Rôle: `admin`
- Permissions complètes

### Catégories par défaut
1. **Administratif** (#3B82F6) - Documents administratifs
2. **Commercial** (#10B981) - Correspondances commerciales
3. **Juridique** (#EF4444) - Documents juridiques
4. **Technique** (#8B5CF6) - Documentation technique
5. **RH** (#F59E0B) - Ressources humaines

### Tags par défaut
**Priorité:**
- Urgent (#EF4444)
- Normal (#3B82F6)
- Faible (#6B7280)

**Nature:**
- Confidentiel (#8B5CF6)
- Public (#10B981)

**Statut:**
- En cours (#F59E0B)
- Terminé (#10B981)

### Paramètres par défaut
- Nom de l'application: "MailFlow"
- Renommage automatique: activé
- Dossiers de stockage configurés
- Notifications activées

## 🛠️ Maintenance

### Sauvegarde
```bash
mysqldump -u mailflow -p mailflow > mailflow_backup_$(date +%Y%m%d).sql
```

### Restauration
```bash
mysql -u mailflow -p mailflow < mailflow_backup_YYYYMMDD.sql
```

### Optimisation
```sql
OPTIMIZE TABLE users, categories, tags, senders, incoming_mails, outgoing_mails, mail_tags, settings;
```

---

**MailFlow v1.0** - Système de gestion numérique des courriers