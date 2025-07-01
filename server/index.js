const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'mailflow',
  password: 'mailflow',
  database: 'mailflow',
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

let pool = null;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

const executeQuery = async (query, params = []) => {
  const currentPool = createPool();
  try {
    const [results] = await currentPool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Erreur SQL:', error);
    throw error;
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const query = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
    const users = await executeQuery(query, [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }
    
    // Mettre à jour la dernière connexion
    await executeQuery('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, displayName: user.display_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
      },
      token
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// USERS ROUTES
// =====================================================

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT id, email, display_name, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC';
    const users = await executeQuery(query);
    res.json(users);
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { email, password, displayName, role, permissions } = req.body;
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (id, email, password, display_name, role, permissions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await executeQuery(query, [
      id,
      email,
      hashedPassword,
      displayName,
      role,
      JSON.stringify(permissions)
    ]);
    
    res.json({ id, message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, role, permissions, isActive } = req.body;
    
    const updates = [];
    const params = [];
    
    if (displayName) {
      updates.push('display_name = ?');
      params.push(displayName);
    }
    
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    
    if (permissions) {
      updates.push('permissions = ?');
      params.push(JSON.stringify(permissions));
    }
    
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (updates.length > 0) {
      params.push(id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(query, params);
    }
    
    res.json({ message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// CATEGORIES ROUTES
// =====================================================

app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM categories WHERE is_active = 1 ORDER BY name';
    const categories = await executeQuery(query);
    res.json(categories);
  } catch (error) {
    console.error('Erreur lors du chargement des catégories:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description, color, createdBy } = req.body;
    const id = uuidv4();
    const query = 'INSERT INTO categories (id, name, description, color, created_by) VALUES (?, ?, ?, ?, ?)';
    await executeQuery(query, [id, name, description, color, createdBy]);
    res.json({ id, message: 'Catégorie créée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const query = 'UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ?';
    await executeQuery(query, [name, description, color, id]);
    res.json({ message: 'Catégorie mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// TAGS ROUTES
// =====================================================

app.get('/api/tags', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM tags WHERE is_active = 1 ORDER BY type, name';
    const tags = await executeQuery(query);
    res.json(tags);
  } catch (error) {
    console.error('Erreur lors du chargement des tags:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/tags', authenticateToken, async (req, res) => {
  try {
    const { name, type, color, createdBy } = req.body;
    const id = uuidv4();
    const query = 'INSERT INTO tags (id, name, type, color, created_by) VALUES (?, ?, ?, ?, ?)';
    await executeQuery(query, [id, name, type, color, createdBy]);
    res.json({ id, message: 'Tag créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création du tag:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.put('/api/tags/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color } = req.body;
    const query = 'UPDATE tags SET name = ?, type = ?, color = ? WHERE id = ?';
    await executeQuery(query, [name, type, color, id]);
    res.json({ message: 'Tag mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du tag:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.delete('/api/tags/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM tags WHERE id = ?', [id]);
    res.json({ message: 'Tag supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du tag:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// SENDERS ROUTES
// =====================================================

app.get('/api/senders', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM senders WHERE is_active = 1 ORDER BY name';
    const senders = await executeQuery(query);
    res.json(senders);
  } catch (error) {
    console.error('Erreur lors du chargement des expéditeurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/senders', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, fax, organization, createdBy } = req.body;
    const id = uuidv4();
    const query = 'INSERT INTO senders (id, name, email, phone, fax, organization, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)';
    await executeQuery(query, [id, name, email, phone, fax, organization, createdBy]);
    res.json({ id, message: 'Expéditeur créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création de l\'expéditeur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.put('/api/senders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, fax, organization } = req.body;
    const query = 'UPDATE senders SET name = ?, email = ?, phone = ?, fax = ?, organization = ? WHERE id = ?';
    await executeQuery(query, [name, email, phone, fax, organization, id]);
    res.json({ message: 'Expéditeur mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'expéditeur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// INCOMING MAILS ROUTES
// =====================================================

app.get('/api/incoming-mails', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        im.*,
        c.name as category_name,
        c.color as category_color,
        s.name as sender_name,
        s.email as sender_email,
        GROUP_CONCAT(t.id) as tag_ids,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM incoming_mails im
      LEFT JOIN categories c ON im.category_id = c.id
      LEFT JOIN senders s ON im.sender_id = s.id
      LEFT JOIN mail_tags mt ON im.id = mt.mail_id AND mt.mail_type = 'incoming'
      LEFT JOIN tags t ON mt.tag_id = t.id
      GROUP BY im.id
      ORDER BY im.arrival_date DESC
    `;
    
    const results = await executeQuery(query);
    const mails = results.map((mail) => ({
      ...mail,
      tags: mail.tag_ids ? mail.tag_ids.split(',').map((id, index) => ({
        id,
        name: mail.tag_names.split(',')[index],
        color: mail.tag_colors.split(',')[index]
      })) : []
    }));
    
    res.json(mails);
  } catch (error) {
    console.error('Erreur lors du chargement des courriers d\'arrivée:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/incoming-mails', authenticateToken, async (req, res) => {
  try {
    const { reference, subject, summary, categoryId, senderId, tags, arrivalDate, priority, scanUrl, createdBy } = req.body;
    const id = uuidv4();
    
    const mailQuery = `
      INSERT INTO incoming_mails (id, reference, subject, summary, category_id, sender_id, arrival_date, priority, scan_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(mailQuery, [
      id, reference, subject, summary, categoryId, senderId, arrivalDate, priority, scanUrl, createdBy
    ]);
    
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await executeQuery(
          'INSERT INTO mail_tags (id, mail_id, mail_type, tag_id) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, 'incoming', tagId]
        );
      }
    }
    
    res.json({ id, message: 'Courrier d\'arrivée créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création du courrier d\'arrivée:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.put('/api/incoming-mails/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reference, subject, summary, categoryId, senderId, tags, arrivalDate, priority, scanUrl } = req.body;
    
    const query = `
      UPDATE incoming_mails 
      SET reference = ?, subject = ?, summary = ?, category_id = ?, sender_id = ?, 
          arrival_date = ?, priority = ?, scan_url = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      reference, subject, summary, categoryId, senderId, arrivalDate, priority, scanUrl, id
    ]);
    
    if (tags !== undefined) {
      await executeQuery('DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = ?', [id, 'incoming']);
      
      for (const tagId of tags) {
        await executeQuery(
          'INSERT INTO mail_tags (id, mail_id, mail_type, tag_id) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, 'incoming', tagId]
        );
      }
    }
    
    res.json({ message: 'Courrier d\'arrivée mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du courrier d\'arrivée:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.delete('/api/incoming-mails/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = ?', [id, 'incoming']);
    await executeQuery('DELETE FROM incoming_mails WHERE id = ?', [id]);
    res.json({ message: 'Courrier d\'arrivée supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du courrier d\'arrivée:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// OUTGOING MAILS ROUTES
// =====================================================

app.get('/api/outgoing-mails', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        om.*,
        c.name as category_name,
        c.color as category_color,
        GROUP_CONCAT(t.id) as tag_ids,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM outgoing_mails om
      LEFT JOIN categories c ON om.category_id = c.id
      LEFT JOIN mail_tags mt ON om.id = mt.mail_id AND mt.mail_type = 'outgoing'
      LEFT JOIN tags t ON mt.tag_id = t.id
      GROUP BY om.id
      ORDER BY om.send_date DESC
    `;
    
    const results = await executeQuery(query);
    const mails = results.map((mail) => ({
      ...mail,
      tags: mail.tag_ids ? mail.tag_ids.split(',').map((id, index) => ({
        id,
        name: mail.tag_names.split(',')[index],
        color: mail.tag_colors.split(',')[index]
      })) : []
    }));
    
    res.json(mails);
  } catch (error) {
    console.error('Erreur lors du chargement des courriers de départ:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/outgoing-mails', authenticateToken, async (req, res) => {
  try {
    const { reference, subject, content, categoryId, tags, sendDate, priority, scanUrl, createdBy } = req.body;
    const id = uuidv4();
    
    const mailQuery = `
      INSERT INTO outgoing_mails (id, reference, subject, content, category_id, send_date, priority, scan_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(mailQuery, [
      id, reference, subject, content, categoryId, sendDate, priority, scanUrl, createdBy
    ]);
    
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await executeQuery(
          'INSERT INTO mail_tags (id, mail_id, mail_type, tag_id) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, 'outgoing', tagId]
        );
      }
    }
    
    res.json({ id, message: 'Courrier de départ créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création du courrier de départ:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.put('/api/outgoing-mails/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reference, subject, content, categoryId, tags, sendDate, priority, scanUrl } = req.body;
    
    const query = `
      UPDATE outgoing_mails 
      SET reference = ?, subject = ?, content = ?, category_id = ?, 
          send_date = ?, priority = ?, scan_url = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      reference, subject, content, categoryId, sendDate, priority, scanUrl, id
    ]);
    
    if (tags !== undefined) {
      await executeQuery('DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = ?', [id, 'outgoing']);
      
      for (const tagId of tags) {
        await executeQuery(
          'INSERT INTO mail_tags (id, mail_id, mail_type, tag_id) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, 'outgoing', tagId]
        );
      }
    }
    
    res.json({ message: 'Courrier de départ mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du courrier de départ:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.delete('/api/outgoing-mails/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = ?', [id, 'outgoing']);
    await executeQuery('DELETE FROM outgoing_mails WHERE id = ?', [id]);
    res.json({ message: 'Courrier de départ supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du courrier de départ:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// SEARCH ROUTES
// =====================================================

app.post('/api/search', authenticateToken, async (req, res) => {
  try {
    const { searchTerm, mailType, categoryId, priority, dateFrom, dateTo } = req.body;
    
    let query = `
      SELECT 'incoming' as mail_type, id, reference, subject, summary as content, arrival_date as mail_date, priority, category_id, sender_id, scan_url
      FROM incoming_mails WHERE 1=1
    `;
    let params = [];
    
    if (searchTerm) {
      query += ' AND (reference LIKE ? OR subject LIKE ? OR summary LIKE ?)';
      const term = `%${searchTerm}%`;
      params.push(term, term, term);
    }
    
    if (categoryId) {
      query += ' AND category_id = ?';
      params.push(categoryId);
    }
    
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    
    if (dateFrom) {
      query += ' AND arrival_date >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ' AND arrival_date <= ?';
      params.push(dateTo);
    }
    
    if (mailType === 'outgoing') {
      query = query.replace('incoming_mails', 'outgoing_mails')
                   .replace('arrival_date', 'send_date')
                   .replace('summary', 'content')
                   .replace("'incoming'", "'outgoing'");
    } else if (mailType === 'all') {
      const outgoingQuery = query.replace('incoming_mails', 'outgoing_mails')
                                 .replace('arrival_date', 'send_date')
                                 .replace('summary', 'content')
                                 .replace("'incoming'", "'outgoing'");
      query += ' UNION ALL ' + outgoingQuery;
      params = [...params, ...params];
    }
    
    query += ' ORDER BY mail_date DESC LIMIT 100';
    
    const results = await executeQuery(query, params);
    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// STATISTICS ROUTES
// =====================================================

app.get('/api/statistics', authenticateToken, async (req, res) => {
  try {
    const queries = [
      'SELECT COUNT(*) as totalIncoming FROM incoming_mails',
      'SELECT COUNT(*) as totalOutgoing FROM outgoing_mails',
      'SELECT COUNT(*) as todayIncoming FROM incoming_mails WHERE DATE(arrival_date) = CURDATE()',
      'SELECT COUNT(*) as todayOutgoing FROM outgoing_mails WHERE DATE(send_date) = CURDATE()'
    ];
    
    const results = await Promise.all(queries.map(q => executeQuery(q)));
    
    const statistics = {
      totalIncoming: results[0][0].totalIncoming,
      totalOutgoing: results[1][0].totalOutgoing,
      totalToday: results[2][0].todayIncoming + results[3][0].todayOutgoing
    };
    
    res.json(statistics);
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// =====================================================
// SETTINGS ROUTES
// =====================================================

app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const results = await executeQuery('SELECT `key`, `value` FROM settings');
    const settings = {};
    
    for (const row of results) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settingsData = req.body;
    
    for (const [key, value] of Object.entries(settingsData)) {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      await executeQuery(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, jsonValue]
      );
    }
    
    res.json({ message: 'Paramètres mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Serveur API démarré sur le port ${PORT}`);
});