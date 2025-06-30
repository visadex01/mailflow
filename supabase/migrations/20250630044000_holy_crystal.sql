-- =====================================================
-- MAILFLOW - STRUCTURE MYSQL PURE
-- Compatible phpMyAdmin - MySQL 8.0+
-- Paramètres: mailflow/mailflow/mailflow
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- CRÉATION DE LA BASE DE DONNÉES
-- =====================================================

CREATE DATABASE IF NOT EXISTS `mailflow` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `mailflow`;

-- =====================================================
-- CRÉATION DE L'UTILISATEUR
-- =====================================================

CREATE USER IF NOT EXISTS 'mailflow'@'localhost' IDENTIFIED BY 'mailflow';
GRANT ALL PRIVILEGES ON mailflow.* TO 'mailflow'@'localhost';
FLUSH PRIVILEGES;

-- =====================================================
-- TABLE: users
-- =====================================================

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `role` enum('admin','manager','user') NOT NULL DEFAULT 'user',
  `permissions` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: categories
-- =====================================================

CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#3B82F6',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `fk_categories_created_by` (`created_by`),
  CONSTRAINT `fk_categories_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: tags
-- =====================================================

CREATE TABLE `tags` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `name` varchar(255) NOT NULL,
  `type` enum('nature','priority','status') NOT NULL DEFAULT 'nature',
  `color` varchar(7) NOT NULL DEFAULT '#3B82F6',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_type` (`name`, `type`),
  KEY `fk_tags_created_by` (`created_by`),
  CONSTRAINT `fk_tags_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: senders
-- =====================================================

CREATE TABLE `senders` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `fax` varchar(50) DEFAULT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_senders_name` (`name`),
  KEY `fk_senders_created_by` (`created_by`),
  CONSTRAINT `fk_senders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: incoming_mails
-- =====================================================

CREATE TABLE `incoming_mails` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `reference` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `summary` text DEFAULT NULL,
  `category_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `arrival_date` date NOT NULL,
  `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `scan_url` varchar(1000) DEFAULT NULL,
  `is_processed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `fk_incoming_category` (`category_id`),
  KEY `fk_incoming_sender` (`sender_id`),
  KEY `fk_incoming_created_by` (`created_by`),
  CONSTRAINT `fk_incoming_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_incoming_sender` FOREIGN KEY (`sender_id`) REFERENCES `senders` (`id`),
  CONSTRAINT `fk_incoming_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: outgoing_mails
-- =====================================================

CREATE TABLE `outgoing_mails` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `reference` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `content` text DEFAULT NULL,
  `category_id` varchar(36) NOT NULL,
  `send_date` date NOT NULL,
  `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `scan_url` varchar(1000) DEFAULT NULL,
  `is_processed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `fk_outgoing_category` (`category_id`),
  KEY `fk_outgoing_created_by` (`created_by`),
  CONSTRAINT `fk_outgoing_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_outgoing_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: mail_tags
-- =====================================================

CREATE TABLE `mail_tags` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `mail_id` varchar(36) NOT NULL,
  `mail_type` enum('incoming','outgoing') NOT NULL,
  `tag_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mail_tag_unique` (`mail_id`, `mail_type`, `tag_id`),
  KEY `fk_mail_tags_tag` (`tag_id`),
  CONSTRAINT `fk_mail_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: settings
-- =====================================================

CREATE TABLE `settings` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `key` varchar(255) NOT NULL,
  `value` json DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Utilisateur administrateur (mot de passe: admin123)
INSERT INTO `users` (`id`, `email`, `password`, `display_name`, `role`, `permissions`) VALUES
('admin-001', 'admin@admin.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', 'Administrateur', 'admin', 
'[{"module": "dashboard", "actions": ["read"]}, {"module": "incoming", "actions": ["read", "write", "delete"]}, {"module": "outgoing", "actions": ["read", "write", "delete"]}, {"module": "search", "actions": ["read"]}, {"module": "categories", "actions": ["read", "write", "delete"]}, {"module": "tags", "actions": ["read", "write", "delete"]}, {"module": "users", "actions": ["read", "write", "delete"]}, {"module": "settings", "actions": ["read", "write"]}]');

-- Catégories par défaut
INSERT INTO `categories` (`id`, `name`, `description`, `color`, `created_by`) VALUES
('cat-001', 'Administratif', 'Documents administratifs', '#3B82F6', 'admin-001'),
('cat-002', 'Commercial', 'Correspondances commerciales', '#10B981', 'admin-001'),
('cat-003', 'Juridique', 'Documents juridiques', '#EF4444', 'admin-001'),
('cat-004', 'Technique', 'Documentation technique', '#8B5CF6', 'admin-001'),
('cat-005', 'RH', 'Ressources humaines', '#F59E0B', 'admin-001');

-- Tags par défaut
INSERT INTO `tags` (`id`, `name`, `type`, `color`, `created_by`) VALUES
('tag-001', 'Urgent', 'priority', '#EF4444', 'admin-001'),
('tag-002', 'Normal', 'priority', '#3B82F6', 'admin-001'),
('tag-003', 'Faible', 'priority', '#6B7280', 'admin-001'),
('tag-004', 'Confidentiel', 'nature', '#8B5CF6', 'admin-001'),
('tag-005', 'Public', 'nature', '#10B981', 'admin-001'),
('tag-006', 'En cours', 'status', '#F59E0B', 'admin-001'),
('tag-007', 'Terminé', 'status', '#10B981', 'admin-001');

-- Paramètres par défaut
INSERT INTO `settings` (`key`, `value`, `description`) VALUES
('app_name', '"MailFlow"', 'Nom de l\'application'),
('auto_rename', 'true', 'Renommage automatique des fichiers'),
('storage_folders', '{"incoming": "./uploads/courriers/arrivee", "outgoing": "./uploads/courriers/depart"}', 'Dossiers de stockage'),
('notifications', '{"email": true, "browser": true, "urgentOnly": false}', 'Paramètres de notification');

COMMIT;

SELECT 'Base de données MailFlow créée avec succès!' as message;
SELECT 'Utilisateur MySQL: mailflow / mailflow' as mysql_info;
SELECT 'Admin: admin@admin.com / admin123' as admin_info;