-- =====================================================
-- MAILFLOW - STRUCTURE MYSQL AVEC PARAMÈTRES PAR DÉFAUT
-- Compatible phpMyAdmin - Syntaxe MySQL 8.0+
-- Utilisateur: mailflow / Mot de passe: mailflow
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
-- CRÉATION DE L'UTILISATEUR PAR DÉFAUT
-- =====================================================

-- Créer l'utilisateur mailflow avec mot de passe mailflow
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
  `is_default_admin` tinyint(1) NOT NULL DEFAULT 0,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(36) DEFAULT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_active` (`is_active`),
  KEY `idx_users_email` (`email`)
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
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_categories_active` (`is_active`),
  KEY `fk_categories_created_by` (`created_by`),
  CONSTRAINT `fk_categories_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_type` (`name`, `type`),
  KEY `idx_tags_type` (`type`),
  KEY `idx_tags_active` (`is_active`),
  KEY `fk_tags_created_by` (`created_by`),
  CONSTRAINT `fk_tags_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
  `address` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_senders_name` (`name`),
  KEY `idx_senders_email` (`email`),
  KEY `idx_senders_active` (`is_active`),
  KEY `fk_senders_created_by` (`created_by`),
  CONSTRAINT `fk_senders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
  `scan_filename` varchar(255) DEFAULT NULL,
  `is_processed` tinyint(1) NOT NULL DEFAULT 0,
  `processed_at` timestamp NULL DEFAULT NULL,
  `processed_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `idx_incoming_reference` (`reference`),
  KEY `idx_incoming_subject` (`subject`),
  KEY `idx_incoming_arrival_date` (`arrival_date`),
  KEY `idx_incoming_priority` (`priority`),
  KEY `idx_incoming_processed` (`is_processed`),
  KEY `fk_incoming_category` (`category_id`),
  KEY `fk_incoming_sender` (`sender_id`),
  KEY `fk_incoming_created_by` (`created_by`),
  CONSTRAINT `fk_incoming_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_incoming_sender` FOREIGN KEY (`sender_id`) REFERENCES `senders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_incoming_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
  `scan_filename` varchar(255) DEFAULT NULL,
  `is_processed` tinyint(1) NOT NULL DEFAULT 0,
  `processed_at` timestamp NULL DEFAULT NULL,
  `processed_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(36) NOT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `idx_outgoing_reference` (`reference`),
  KEY `idx_outgoing_subject` (`subject`),
  KEY `idx_outgoing_send_date` (`send_date`),
  KEY `idx_outgoing_priority` (`priority`),
  KEY `idx_outgoing_processed` (`is_processed`),
  KEY `fk_outgoing_category` (`category_id`),
  KEY `fk_outgoing_created_by` (`created_by`),
  CONSTRAINT `fk_outgoing_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_outgoing_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: mail_tags (relation many-to-many)
-- =====================================================

CREATE TABLE `mail_tags` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `mail_id` varchar(36) NOT NULL,
  `mail_type` enum('incoming','outgoing') NOT NULL,
  `tag_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mail_tag_unique` (`mail_id`, `mail_type`, `tag_id`),
  KEY `idx_mail_tags_mail` (`mail_id`, `mail_type`),
  KEY `fk_mail_tags_tag` (`tag_id`),
  CONSTRAINT `fk_mail_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: settings
-- =====================================================

CREATE TABLE `settings` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `key` varchar(255) NOT NULL,
  `value` json DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `idx_settings_system` (`is_system`),
  KEY `fk_settings_updated_by` (`updated_by`),
  CONSTRAINT `fk_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: activity_logs
-- =====================================================

CREATE TABLE `activity_logs` (
  `id` varchar(36) NOT NULL DEFAULT (UUID()),
  `user_id` varchar(36) NOT NULL,
  `action` varchar(255) NOT NULL,
  `module` varchar(100) NOT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_user` (`user_id`),
  KEY `idx_activity_action` (`action`),
  KEY `idx_activity_module` (`module`),
  KEY `idx_activity_created` (`created_at`),
  CONSTRAINT `fk_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VUES POUR FACILITER LES REQUÊTES
-- =====================================================

-- Vue pour les courriers avec détails complets
CREATE VIEW `mail_overview` AS
SELECT 
    'incoming' as mail_type,
    im.id,
    im.reference,
    im.subject,
    im.summary as content,
    im.arrival_date as mail_date,
    im.priority,
    im.scan_url,
    im.is_processed,
    im.created_at,
    c.name as category_name,
    c.color as category_color,
    s.name as sender_name,
    s.email as sender_email,
    u.display_name as created_by_name,
    GROUP_CONCAT(t.name SEPARATOR ', ') as tags
FROM incoming_mails im
LEFT JOIN categories c ON im.category_id = c.id
LEFT JOIN senders s ON im.sender_id = s.id
LEFT JOIN users u ON im.created_by = u.id
LEFT JOIN mail_tags mt ON im.id = mt.mail_id AND mt.mail_type = 'incoming'
LEFT JOIN tags t ON mt.tag_id = t.id
GROUP BY im.id

UNION ALL

SELECT 
    'outgoing' as mail_type,
    om.id,
    om.reference,
    om.subject,
    om.content,
    om.send_date as mail_date,
    om.priority,
    om.scan_url,
    om.is_processed,
    om.created_at,
    c.name as category_name,
    c.color as category_color,
    NULL as sender_name,
    NULL as sender_email,
    u.display_name as created_by_name,
    GROUP_CONCAT(t.name SEPARATOR ', ') as tags
FROM outgoing_mails om
LEFT JOIN categories c ON om.category_id = c.id
LEFT JOIN users u ON om.created_by = u.id
LEFT JOIN mail_tags mt ON om.id = mt.mail_id AND mt.mail_type = 'outgoing'
LEFT JOIN tags t ON mt.tag_id = t.id
GROUP BY om.id;

-- Vue pour les permissions utilisateur
CREATE VIEW `user_permissions` AS
SELECT 
    u.id as user_id,
    u.email,
    u.display_name,
    u.role,
    u.is_active,
    u.last_login,
    JSON_EXTRACT(u.permissions, '$') as permissions_detail
FROM users u
WHERE u.is_active = 1;

-- =====================================================
-- PROCÉDURES STOCKÉES
-- =====================================================

DELIMITER $$

-- Procédure pour obtenir les statistiques
CREATE PROCEDURE `GetMailStatistics`()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM incoming_mails) as total_incoming,
        (SELECT COUNT(*) FROM outgoing_mails) as total_outgoing,
        (SELECT COUNT(*) FROM incoming_mails WHERE DATE(arrival_date) = CURDATE()) as incoming_today,
        (SELECT COUNT(*) FROM outgoing_mails WHERE DATE(send_date) = CURDATE()) as outgoing_today,
        (SELECT COUNT(*) FROM incoming_mails WHERE priority = 'urgent' AND is_processed = 0) as urgent_pending,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users,
        (SELECT COUNT(*) FROM categories WHERE is_active = 1) as active_categories,
        (SELECT COUNT(*) FROM tags WHERE is_active = 1) as active_tags;
END$$

-- Procédure pour rechercher des courriers
CREATE PROCEDURE `SearchMails`(
    IN search_term VARCHAR(255),
    IN mail_type VARCHAR(20),
    IN category_id VARCHAR(36),
    IN priority VARCHAR(20),
    IN date_from DATE,
    IN date_to DATE,
    IN limit_count INT
)
BEGIN
    SET @sql = 'SELECT * FROM mail_overview WHERE 1=1';
    
    IF search_term IS NOT NULL AND search_term != '' THEN
        SET @sql = CONCAT(@sql, ' AND (reference LIKE "%', search_term, '%" OR subject LIKE "%', search_term, '%" OR content LIKE "%', search_term, '%")');
    END IF;
    
    IF mail_type IS NOT NULL AND mail_type != '' AND mail_type != 'all' THEN
        SET @sql = CONCAT(@sql, ' AND mail_type = "', mail_type, '"');
    END IF;
    
    IF category_id IS NOT NULL AND category_id != '' THEN
        SET @sql = CONCAT(@sql, ' AND category_name = (SELECT name FROM categories WHERE id = "', category_id, '")');
    END IF;
    
    IF priority IS NOT NULL AND priority != '' THEN
        SET @sql = CONCAT(@sql, ' AND priority = "', priority, '"');
    END IF;
    
    IF date_from IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND mail_date >= "', date_from, '"');
    END IF;
    
    IF date_to IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND mail_date <= "', date_to, '"');
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY mail_date DESC');
    
    IF limit_count IS NOT NULL AND limit_count > 0 THEN
        SET @sql = CONCAT(@sql, ' LIMIT ', limit_count);
    END IF;
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Utilisateur administrateur par défaut
-- Mot de passe: admin123 (hash bcrypt)
INSERT INTO `users` (`id`, `email`, `password`, `display_name`, `role`, `permissions`, `is_active`, `is_default_admin`, `created_at`) VALUES
('admin-default-uuid-001', 'admin@admin.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', 'Administrateur Principal', 'admin', 
'[
  {"module": "dashboard", "actions": ["read"]},
  {"module": "incoming", "actions": ["read", "write", "delete"]},
  {"module": "outgoing", "actions": ["read", "write", "delete"]},
  {"module": "search", "actions": ["read"]},
  {"module": "categories", "actions": ["read", "write", "delete"]},
  {"module": "tags", "actions": ["read", "write", "delete"]},
  {"module": "users", "actions": ["read", "write", "delete"]},
  {"module": "activity", "actions": ["read"]},
  {"module": "settings", "actions": ["read", "write"]}
]', 1, 1, NOW());

-- Catégories par défaut
INSERT INTO `categories` (`id`, `name`, `description`, `color`, `created_by`) VALUES
('cat-admin-001', 'Administratif', 'Documents administratifs et officiels', '#3B82F6', 'admin-default-uuid-001'),
('cat-commercial-001', 'Commercial', 'Correspondances commerciales et contrats', '#10B981', 'admin-default-uuid-001'),
('cat-juridique-001', 'Juridique', 'Documents juridiques et légaux', '#EF4444', 'admin-default-uuid-001'),
('cat-technique-001', 'Technique', 'Documentation technique et support', '#8B5CF6', 'admin-default-uuid-001'),
('cat-rh-001', 'Ressources Humaines', 'Documents RH et personnel', '#F59E0B', 'admin-default-uuid-001');

-- Tags par défaut
INSERT INTO `tags` (`id`, `name`, `type`, `color`, `created_by`) VALUES
('tag-urgent-001', 'Urgent', 'priority', '#EF4444', 'admin-default-uuid-001'),
('tag-normal-001', 'Normal', 'priority', '#3B82F6', 'admin-default-uuid-001'),
('tag-faible-001', 'Faible', 'priority', '#6B7280', 'admin-default-uuid-001'),
('tag-confidentiel-001', 'Confidentiel', 'nature', '#8B5CF6', 'admin-default-uuid-001'),
('tag-public-001', 'Public', 'nature', '#10B981', 'admin-default-uuid-001'),
('tag-encours-001', 'En cours', 'status', '#F59E0B', 'admin-default-uuid-001'),
('tag-termine-001', 'Terminé', 'status', '#10B981', 'admin-default-uuid-001'),
('tag-attente-001', 'En attente', 'status', '#6B7280', 'admin-default-uuid-001');

-- Paramètres par défaut
INSERT INTO `settings` (`key`, `value`, `description`, `is_system`) VALUES
('app_name', '"MailFlow"', 'Nom de l\'application', 1),
('app_version', '"1.0.0"', 'Version de l\'application', 1),
('auto_rename', 'true', 'Renommage automatique des fichiers', 0),
('file_naming_pattern', '"{type}_{reference}_{date}_{subject}"', 'Format de nommage des fichiers', 0),
('storage_folders', '{"incoming": "./uploads/courriers/arrivee", "outgoing": "./uploads/courriers/depart"}', 'Dossiers de stockage', 0),
('notifications', '{"email": true, "browser": true, "urgentOnly": false}', 'Paramètres de notification', 0),
('auto_backup', '{"enabled": false, "frequency": "weekly", "service": "local"}', 'Sauvegarde automatique', 0);

-- =====================================================
-- INDEX SUPPLÉMENTAIRES POUR PERFORMANCE
-- =====================================================

-- Index composites pour les recherches fréquentes
CREATE INDEX `idx_incoming_search` ON `incoming_mails` (`subject`, `reference`, `arrival_date`);
CREATE INDEX `idx_outgoing_search` ON `outgoing_mails` (`subject`, `reference`, `send_date`);
CREATE INDEX `idx_mail_tags_lookup` ON `mail_tags` (`tag_id`, `mail_type`);
CREATE INDEX `idx_activity_user_date` ON `activity_logs` (`user_id`, `created_at`);

-- Index pour les statistiques
CREATE INDEX `idx_mails_stats` ON `incoming_mails` (`arrival_date`, `priority`, `is_processed`);
CREATE INDEX `idx_outgoing_stats` ON `outgoing_mails` (`send_date`, `priority`, `is_processed`);

-- =====================================================
-- FINALISATION
-- =====================================================

COMMIT;

-- Affichage des informations de création
SELECT 'Base de données MailFlow créée avec succès!' as message;
SELECT 'Utilisateur MySQL: mailflow / Mot de passe: mailflow' as mysql_user;
SELECT 'Utilisateur admin créé - Email: admin@admin.com, Mot de passe: admin123' as admin_info;
SELECT COUNT(*) as tables_created FROM information_schema.tables WHERE table_schema = 'mailflow';
SELECT COUNT(*) as views_created FROM information_schema.views WHERE table_schema = 'mailflow';

-- Vérification des contraintes
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM information_schema.table_constraints 
WHERE table_schema = 'mailflow' 
ORDER BY TABLE_NAME, CONSTRAINT_TYPE;