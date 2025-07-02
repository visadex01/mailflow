-- =====================================================
-- MailFlow - Structure de base de données MySQL
-- Version: 1.0
-- Date: 2025
-- =====================================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS mailflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mailflow;

-- =====================================================
-- TABLE: users
-- Gestion des utilisateurs et authentification
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: categories
-- Catégories de classification des courriers
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    
    INDEX idx_name (name),
    INDEX idx_active (is_active),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: tags
-- Tags pour l'étiquetage des courriers
-- =====================================================
CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('nature', 'priority', 'status') NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    
    INDEX idx_name (name),
    INDEX idx_type (type),
    INDEX idx_active (is_active),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_name_type (name, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: senders
-- Expéditeurs des courriers
-- =====================================================
CREATE TABLE IF NOT EXISTS senders (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    fax VARCHAR(50),
    organization VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    
    INDEX idx_name (name),
    INDEX idx_email (email),
    INDEX idx_organization (organization),
    INDEX idx_active (is_active),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: incoming_mails
-- Courriers d'arrivée
-- =====================================================
CREATE TABLE IF NOT EXISTS incoming_mails (
    id VARCHAR(36) PRIMARY KEY,
    reference VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    summary TEXT,
    category_id VARCHAR(36),
    sender_id VARCHAR(36),
    arrival_date DATE NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    scan_url VARCHAR(500),
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    
    INDEX idx_reference (reference),
    INDEX idx_subject (subject),
    INDEX idx_arrival_date (arrival_date),
    INDEX idx_priority (priority),
    INDEX idx_processed (is_processed),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    FULLTEXT(subject, summary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: outgoing_mails
-- Courriers de départ
-- =====================================================
CREATE TABLE IF NOT EXISTS outgoing_mails (
    id VARCHAR(36) PRIMARY KEY,
    reference VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT,
    category_id VARCHAR(36),
    send_date DATE NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    scan_url VARCHAR(500),
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    
    INDEX idx_reference (reference),
    INDEX idx_subject (subject),
    INDEX idx_send_date (send_date),
    INDEX idx_priority (priority),
    INDEX idx_processed (is_processed),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    FULLTEXT(subject, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: mail_tags
-- Relation many-to-many entre courriers et tags
-- =====================================================
CREATE TABLE IF NOT EXISTS mail_tags (
    id VARCHAR(36) PRIMARY KEY,
    mail_id VARCHAR(36) NOT NULL,
    mail_type ENUM('incoming', 'outgoing') NOT NULL,
    tag_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_mail (mail_id, mail_type),
    INDEX idx_tag (tag_id),
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_mail_tag (mail_id, mail_type, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: settings
-- Paramètres de l'application
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `key` VARCHAR(255) UNIQUE NOT NULL,
    `value` JSON NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Utilisateur administrateur par défaut
INSERT IGNORE INTO users (id, email, password, display_name, role, permissions) VALUES (
    UUID(),
    'admin@admin.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', -- admin123
    'Administrateur',
    'admin',
    JSON_ARRAY(
        JSON_OBJECT('module', 'dashboard', 'actions', JSON_ARRAY('read')),
        JSON_OBJECT('module', 'incoming', 'actions', JSON_ARRAY('read', 'write', 'delete')),
        JSON_OBJECT('module', 'outgoing', 'actions', JSON_ARRAY('read', 'write', 'delete')),
        JSON_OBJECT('module', 'search', 'actions', JSON_ARRAY('read')),
        JSON_OBJECT('module', 'categories', 'actions', JSON_ARRAY('read', 'write', 'delete')),
        JSON_OBJECT('module', 'tags', 'actions', JSON_ARRAY('read', 'write', 'delete')),
        JSON_OBJECT('module', 'users', 'actions', JSON_ARRAY('read', 'write', 'delete')),
        JSON_OBJECT('module', 'activity', 'actions', JSON_ARRAY('read')),
        JSON_OBJECT('module', 'settings', 'actions', JSON_ARRAY('read', 'write'))
    )
);

-- Catégories par défaut
INSERT IGNORE INTO categories (id, name, description, color, created_by) VALUES
(UUID(), 'Administratif', 'Documents administratifs et officiels', '#3B82F6', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
(UUID(), 'Commercial', 'Correspondances commerciales et contrats', '#10B981', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
(UUID(), 'Juridique', 'Documents juridiques et légaux', '#EF4444', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
(UUID(), 'Technique', 'Documentation technique et support', '#8B5CF6', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
(UUID(), 'RH', 'Ressources humaines et personnel', '#F59E0B', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1));

-- Tags par défaut
INSERT IGNORE INTO tags (id, name, type, color, created_by) VALUES
-- Priorité
(UUID(), 'Urgent', 'priority', '#EF4444', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
(UUID(), 'Normal', 'priority', '#3B82F6', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
(UUID(), 'Faible', 'priority', '#6B7280', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
-- Nature
(UUID(), 'Confidentiel', 'nature', '#8B5CF6', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
(UUID(), 'Public', 'nature', '#10B981', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
-- Statut
(UUID(), 'En cours', 'status', '#F59E0B', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1)),
(UUID(), 'Terminé', 'status', '#10B981', (SELECT id FROM users WHERE email = 'admin@admin.com' LIMIT 1));

-- Paramètres par défaut
INSERT IGNORE INTO settings (`key`, `value`, description) VALUES
('appName', '"MailFlow"', 'Nom de l\'application'),
('autoRename', 'true', 'Renommage automatique des fichiers'),
('fileNamingPattern', '"{type}_{reference}_{date}_{subject}"', 'Format de nommage des fichiers'),
('storageFolders', '{"incoming": "./uploads/courriers/arrivee", "outgoing": "./uploads/courriers/depart"}', 'Dossiers de stockage'),
('notifications', '{"email": true, "browser": true, "urgentOnly": false}', 'Paramètres de notification'),
('version', '"1.0"', 'Version de l\'application'),
('lastBackup', 'null', 'Date de la dernière sauvegarde');

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour les statistiques rapides
CREATE OR REPLACE VIEW mail_statistics AS
SELECT 
    (SELECT COUNT(*) FROM incoming_mails) as total_incoming,
    (SELECT COUNT(*) FROM outgoing_mails) as total_outgoing,
    (SELECT COUNT(*) FROM incoming_mails WHERE DATE(arrival_date) = CURDATE()) as today_incoming,
    (SELECT COUNT(*) FROM outgoing_mails WHERE DATE(send_date) = CURDATE()) as today_outgoing,
    (SELECT COUNT(*) FROM incoming_mails WHERE priority = 'urgent' AND is_processed = FALSE) as urgent_pending;

-- Vue pour les courriers avec leurs détails complets
CREATE OR REPLACE VIEW incoming_mails_detailed AS
SELECT 
    im.*,
    c.name as category_name,
    c.color as category_color,
    s.name as sender_name,
    s.email as sender_email,
    s.organization as sender_organization,
    u.display_name as created_by_name
FROM incoming_mails im
LEFT JOIN categories c ON im.category_id = c.id
LEFT JOIN senders s ON im.sender_id = s.id
LEFT JOIN users u ON im.created_by = u.id;

CREATE OR REPLACE VIEW outgoing_mails_detailed AS
SELECT 
    om.*,
    c.name as category_name,
    c.color as category_color,
    u.display_name as created_by_name
FROM outgoing_mails om
LEFT JOIN categories c ON om.category_id = c.id
LEFT JOIN users u ON om.created_by = u.id;

-- =====================================================
-- PROCÉDURES STOCKÉES
-- =====================================================

DELIMITER //

-- Procédure pour nettoyer les données anciennes
CREATE PROCEDURE CleanOldData(IN days_to_keep INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Supprimer les courriers traités de plus de X jours
    DELETE FROM mail_tags 
    WHERE mail_id IN (
        SELECT id FROM incoming_mails 
        WHERE is_processed = TRUE 
        AND created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY)
    );
    
    DELETE FROM incoming_mails 
    WHERE is_processed = TRUE 
    AND created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    DELETE FROM mail_tags 
    WHERE mail_id IN (
        SELECT id FROM outgoing_mails 
        WHERE is_processed = TRUE 
        AND created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY)
    );
    
    DELETE FROM outgoing_mails 
    WHERE is_processed = TRUE 
    AND created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    COMMIT;
END //

-- Fonction pour générer une référence unique
CREATE FUNCTION GenerateMailReference(mail_type VARCHAR(10), category_name VARCHAR(255))
RETURNS VARCHAR(255)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE ref_prefix VARCHAR(10);
    DECLARE ref_number INT;
    DECLARE ref_year VARCHAR(4);
    DECLARE new_reference VARCHAR(255);
    
    SET ref_year = YEAR(NOW());
    SET ref_prefix = CASE 
        WHEN mail_type = 'incoming' THEN 'IN'
        WHEN mail_type = 'outgoing' THEN 'OUT'
        ELSE 'MAIL'
    END;
    
    -- Obtenir le prochain numéro de séquence
    SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(reference, '-', -1) AS UNSIGNED)), 0) + 1
    INTO ref_number
    FROM (
        SELECT reference FROM incoming_mails WHERE reference LIKE CONCAT(ref_prefix, '-', ref_year, '-%')
        UNION ALL
        SELECT reference FROM outgoing_mails WHERE reference LIKE CONCAT(ref_prefix, '-', ref_year, '-%')
    ) AS all_refs;
    
    SET new_reference = CONCAT(ref_prefix, '-', ref_year, '-', LPAD(ref_number, 4, '0'));
    
    RETURN new_reference;
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour automatiquement updated_at
DELIMITER //

CREATE TRIGGER users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

CREATE TRIGGER settings_updated_at 
    BEFORE UPDATE ON settings 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- =====================================================
-- INDEX SUPPLÉMENTAIRES POUR LES PERFORMANCES
-- =====================================================

-- Index composites pour les recherches fréquentes
CREATE INDEX idx_incoming_date_priority ON incoming_mails(arrival_date, priority);
CREATE INDEX idx_outgoing_date_priority ON outgoing_mails(send_date, priority);
CREATE INDEX idx_incoming_category_date ON incoming_mails(category_id, arrival_date);
CREATE INDEX idx_outgoing_category_date ON outgoing_mails(category_id, send_date);

-- Index pour les recherches de texte
CREATE INDEX idx_incoming_subject_ref ON incoming_mails(subject, reference);
CREATE INDEX idx_outgoing_subject_ref ON outgoing_mails(subject, reference);

-- =====================================================
-- PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- Créer l'utilisateur de l'application
CREATE USER IF NOT EXISTS 'mailflow'@'localhost' IDENTIFIED BY 'mailflow';

-- Accorder les permissions nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON mailflow.* TO 'mailflow'@'localhost';
GRANT EXECUTE ON mailflow.* TO 'mailflow'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- =====================================================
-- VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier l'intégrité des données
SELECT 'Installation terminée avec succès!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'mailflow';
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_tags FROM tags;
SELECT COUNT(*) as total_settings FROM settings;

-- Afficher les informations de connexion
SELECT 
    'Informations de connexion:' as info,
    'Host: localhost:3306' as host,
    'Database: mailflow' as database,
    'User: mailflow' as user,
    'Password: mailflow' as password;

-- Afficher le compte administrateur
SELECT 
    'Compte administrateur:' as info,
    email,
    'admin123' as password,
    display_name,
    role
FROM users WHERE email = 'admin@admin.com';