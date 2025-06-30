import { executeQuery, executeTransaction } from '../config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class MySQLService {
  
  // =====================================================
  // USERS
  // =====================================================
  
  static async getUsers(): Promise<any[]> {
    const query = `
      SELECT 
        id, email, display_name, role, permissions, 
        is_active, is_default_admin, last_login, 
        created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `;
    return await executeQuery(query);
  }

  static async getUserById(id: string): Promise<any> {
    const query = `
      SELECT 
        id, email, display_name, role, permissions, 
        is_active, is_default_admin, last_login, 
        created_at, updated_at
      FROM users 
      WHERE id = ?
    `;
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async getUserByEmail(email: string): Promise<any> {
    const query = `
      SELECT 
        id, email, password, display_name, role, permissions, 
        is_active, is_default_admin, last_login, 
        created_at, updated_at
      FROM users 
      WHERE email = ? AND is_active = 1
    `;
    const results = await executeQuery(query, [email]);
    return results[0] || null;
  }

  static async createUser(userData: any): Promise<string> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const query = `
      INSERT INTO users (
        id, email, password, display_name, role, permissions, 
        is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await executeQuery(query, [
      id,
      userData.email,
      hashedPassword,
      userData.displayName,
      userData.role || 'user',
      JSON.stringify(userData.permissions || []),
      userData.isActive !== false ? 1 : 0,
      userData.createdBy
    ]);
    
    return id;
  }

  static async updateUser(id: string, userData: any): Promise<void> {
    const updates = [];
    const params = [];
    
    if (userData.displayName !== undefined) {
      updates.push('display_name = ?');
      params.push(userData.displayName);
    }
    
    if (userData.role !== undefined) {
      updates.push('role = ?');
      params.push(userData.role);
    }
    
    if (userData.permissions !== undefined) {
      updates.push('permissions = ?');
      params.push(JSON.stringify(userData.permissions));
    }
    
    if (userData.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(userData.isActive ? 1 : 0);
    }
    
    if (userData.lastLogin !== undefined) {
      updates.push('last_login = ?');
      params.push(userData.lastLogin);
    }
    
    if (userData.updatedBy !== undefined) {
      updates.push('updated_by = ?');
      params.push(userData.updatedBy);
    }
    
    if (updates.length === 0) return;
    
    updates.push('updated_at = NOW()');
    params.push(id);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
  }

  static async deleteUser(id: string): Promise<void> {
    const query = 'DELETE FROM users WHERE id = ? AND is_default_admin = 0';
    await executeQuery(query, [id]);
  }

  static async verifyPassword(email: string, password: string): Promise<any> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    // Mettre à jour la dernière connexion
    await this.updateUser(user.id, { lastLogin: new Date() });
    
    // Retourner l'utilisateur sans le mot de passe
    delete user.password;
    return user;
  }

  // =====================================================
  // CATEGORIES
  // =====================================================
  
  static async getCategories(): Promise<any[]> {
    const query = `
      SELECT 
        c.*, u.display_name as created_by_name
      FROM categories c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.is_active = 1
      ORDER BY c.name
    `;
    return await executeQuery(query);
  }

  static async createCategory(categoryData: any): Promise<string> {
    const id = uuidv4();
    
    const query = `
      INSERT INTO categories (
        id, name, description, color, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    await executeQuery(query, [
      id,
      categoryData.name,
      categoryData.description || null,
      categoryData.color || '#3B82F6',
      categoryData.createdBy
    ]);
    
    return id;
  }

  static async updateCategory(id: string, categoryData: any): Promise<void> {
    const updates = [];
    const params = [];
    
    if (categoryData.name !== undefined) {
      updates.push('name = ?');
      params.push(categoryData.name);
    }
    
    if (categoryData.description !== undefined) {
      updates.push('description = ?');
      params.push(categoryData.description);
    }
    
    if (categoryData.color !== undefined) {
      updates.push('color = ?');
      params.push(categoryData.color);
    }
    
    if (categoryData.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(categoryData.isActive ? 1 : 0);
    }
    
    if (categoryData.updatedBy !== undefined) {
      updates.push('updated_by = ?');
      params.push(categoryData.updatedBy);
    }
    
    if (updates.length === 0) return;
    
    updates.push('updated_at = NOW()');
    params.push(id);
    
    const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
  }

  static async deleteCategory(id: string): Promise<void> {
    // Vérifier s'il y a des courriers associés
    const checkQuery = `
      SELECT COUNT(*) as count FROM (
        SELECT 1 FROM incoming_mails WHERE category_id = ?
        UNION ALL
        SELECT 1 FROM outgoing_mails WHERE category_id = ?
      ) as mail_count
    `;
    
    const [result] = await executeQuery(checkQuery, [id, id]);
    
    if (result.count > 0) {
      throw new Error('Impossible de supprimer une catégorie utilisée par des courriers');
    }
    
    const query = 'DELETE FROM categories WHERE id = ?';
    await executeQuery(query, [id]);
  }

  // =====================================================
  // TAGS
  // =====================================================
  
  static async getTags(): Promise<any[]> {
    const query = `
      SELECT 
        t.*, u.display_name as created_by_name
      FROM tags t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.is_active = 1
      ORDER BY t.type, t.name
    `;
    return await executeQuery(query);
  }

  static async createTag(tagData: any): Promise<string> {
    const id = uuidv4();
    
    const query = `
      INSERT INTO tags (
        id, name, type, color, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    await executeQuery(query, [
      id,
      tagData.name,
      tagData.type || 'nature',
      tagData.color || '#3B82F6',
      tagData.createdBy
    ]);
    
    return id;
  }

  static async updateTag(id: string, tagData: any): Promise<void> {
    const updates = [];
    const params = [];
    
    if (tagData.name !== undefined) {
      updates.push('name = ?');
      params.push(tagData.name);
    }
    
    if (tagData.type !== undefined) {
      updates.push('type = ?');
      params.push(tagData.type);
    }
    
    if (tagData.color !== undefined) {
      updates.push('color = ?');
      params.push(tagData.color);
    }
    
    if (tagData.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(tagData.isActive ? 1 : 0);
    }
    
    if (tagData.updatedBy !== undefined) {
      updates.push('updated_by = ?');
      params.push(tagData.updatedBy);
    }
    
    if (updates.length === 0) return;
    
    updates.push('updated_at = NOW()');
    params.push(id);
    
    const query = `UPDATE tags SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
  }

  static async deleteTag(id: string): Promise<void> {
    const query = 'DELETE FROM tags WHERE id = ?';
    await executeQuery(query, [id]);
  }

  // =====================================================
  // SENDERS
  // =====================================================
  
  static async getSenders(): Promise<any[]> {
    const query = `
      SELECT 
        s.*, u.display_name as created_by_name
      FROM senders s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.is_active = 1
      ORDER BY s.name
    `;
    return await executeQuery(query);
  }

  static async createSender(senderData: any): Promise<string> {
    const id = uuidv4();
    
    const query = `
      INSERT INTO senders (
        id, name, email, phone, fax, organization, address, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await executeQuery(query, [
      id,
      senderData.name,
      senderData.email || null,
      senderData.phone || null,
      senderData.fax || null,
      senderData.organization || null,
      senderData.address || null,
      senderData.createdBy
    ]);
    
    return id;
  }

  static async updateSender(id: string, senderData: any): Promise<void> {
    const updates = [];
    const params = [];
    
    if (senderData.name !== undefined) {
      updates.push('name = ?');
      params.push(senderData.name);
    }
    
    if (senderData.email !== undefined) {
      updates.push('email = ?');
      params.push(senderData.email);
    }
    
    if (senderData.phone !== undefined) {
      updates.push('phone = ?');
      params.push(senderData.phone);
    }
    
    if (senderData.fax !== undefined) {
      updates.push('fax = ?');
      params.push(senderData.fax);
    }
    
    if (senderData.organization !== undefined) {
      updates.push('organization = ?');
      params.push(senderData.organization);
    }
    
    if (senderData.address !== undefined) {
      updates.push('address = ?');
      params.push(senderData.address);
    }
    
    if (senderData.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(senderData.isActive ? 1 : 0);
    }
    
    if (senderData.updatedBy !== undefined) {
      updates.push('updated_by = ?');
      params.push(senderData.updatedBy);
    }
    
    if (updates.length === 0) return;
    
    updates.push('updated_at = NOW()');
    params.push(id);
    
    const query = `UPDATE senders SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
  }

  static async deleteSender(id: string): Promise<void> {
    // Vérifier s'il y a des courriers associés
    const checkQuery = 'SELECT COUNT(*) as count FROM incoming_mails WHERE sender_id = ?';
    const [result] = await executeQuery(checkQuery, [id]);
    
    if (result.count > 0) {
      throw new Error('Impossible de supprimer un expéditeur utilisé par des courriers');
    }
    
    const query = 'DELETE FROM senders WHERE id = ?';
    await executeQuery(query, [id]);
  }

  // =====================================================
  // INCOMING MAILS
  // =====================================================
  
  static async getIncomingMails(): Promise<any[]> {
    const query = `
      SELECT 
        im.*,
        c.name as category_name,
        c.color as category_color,
        s.name as sender_name,
        s.email as sender_email,
        u.display_name as created_by_name,
        GROUP_CONCAT(DISTINCT CONCAT(t.id, ':', t.name, ':', t.color) SEPARATOR '|') as tags_data
      FROM incoming_mails im
      LEFT JOIN categories c ON im.category_id = c.id
      LEFT JOIN senders s ON im.sender_id = s.id
      LEFT JOIN users u ON im.created_by = u.id
      LEFT JOIN mail_tags mt ON im.id = mt.mail_id AND mt.mail_type = 'incoming'
      LEFT JOIN tags t ON mt.tag_id = t.id
      GROUP BY im.id
      ORDER BY im.arrival_date DESC, im.created_at DESC
    `;
    
    const results = await executeQuery(query);
    
    // Traiter les tags
    return results.map(mail => ({
      ...mail,
      tags: mail.tags_data ? mail.tags_data.split('|').map((tagData: string) => {
        const [id, name, color] = tagData.split(':');
        return { id, name, color };
      }) : []
    }));
  }

  static async createIncomingMail(mailData: any): Promise<string> {
    const id = uuidv4();
    
    const queries = [
      {
        query: `
          INSERT INTO incoming_mails (
            id, reference, subject, summary, category_id, sender_id,
            arrival_date, priority, scan_url, scan_filename, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        params: [
          id,
          mailData.reference,
          mailData.subject,
          mailData.summary || null,
          mailData.categoryId,
          mailData.senderId,
          mailData.arrivalDate,
          mailData.priority || 'normal',
          mailData.scanUrl || null,
          mailData.scanFilename || null,
          mailData.createdBy
        ]
      }
    ];
    
    // Ajouter les tags
    if (mailData.tags && mailData.tags.length > 0) {
      for (const tagId of mailData.tags) {
        queries.push({
          query: `
            INSERT INTO mail_tags (id, mail_id, mail_type, tag_id, created_at)
            VALUES (?, ?, 'incoming', ?, NOW())
          `,
          params: [uuidv4(), id, tagId]
        });
      }
    }
    
    await executeTransaction(queries);
    return id;
  }

  static async updateIncomingMail(id: string, mailData: any): Promise<void> {
    const updates = [];
    const params = [];
    
    if (mailData.reference !== undefined) {
      updates.push('reference = ?');
      params.push(mailData.reference);
    }
    
    if (mailData.subject !== undefined) {
      updates.push('subject = ?');
      params.push(mailData.subject);
    }
    
    if (mailData.summary !== undefined) {
      updates.push('summary = ?');
      params.push(mailData.summary);
    }
    
    if (mailData.categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(mailData.categoryId);
    }
    
    if (mailData.senderId !== undefined) {
      updates.push('sender_id = ?');
      params.push(mailData.senderId);
    }
    
    if (mailData.arrivalDate !== undefined) {
      updates.push('arrival_date = ?');
      params.push(mailData.arrivalDate);
    }
    
    if (mailData.priority !== undefined) {
      updates.push('priority = ?');
      params.push(mailData.priority);
    }
    
    if (mailData.scanUrl !== undefined) {
      updates.push('scan_url = ?');
      params.push(mailData.scanUrl);
    }
    
    if (mailData.scanFilename !== undefined) {
      updates.push('scan_filename = ?');
      params.push(mailData.scanFilename);
    }
    
    if (mailData.isProcessed !== undefined) {
      updates.push('is_processed = ?');
      params.push(mailData.isProcessed ? 1 : 0);
    }
    
    if (mailData.updatedBy !== undefined) {
      updates.push('updated_by = ?');
      params.push(mailData.updatedBy);
    }
    
    const queries = [];
    
    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(id);
      
      queries.push({
        query: `UPDATE incoming_mails SET ${updates.join(', ')} WHERE id = ?`,
        params: params
      });
    }
    
    // Mettre à jour les tags si fournis
    if (mailData.tags !== undefined) {
      // Supprimer les anciens tags
      queries.push({
        query: 'DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = "incoming"',
        params: [id]
      });
      
      // Ajouter les nouveaux tags
      for (const tagId of mailData.tags) {
        queries.push({
          query: `
            INSERT INTO mail_tags (id, mail_id, mail_type, tag_id, created_at)
            VALUES (?, ?, 'incoming', ?, NOW())
          `,
          params: [uuidv4(), id, tagId]
        });
      }
    }
    
    if (queries.length > 0) {
      await executeTransaction(queries);
    }
  }

  static async deleteIncomingMail(id: string): Promise<void> {
    const queries = [
      {
        query: 'DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = "incoming"',
        params: [id]
      },
      {
        query: 'DELETE FROM incoming_mails WHERE id = ?',
        params: [id]
      }
    ];
    
    await executeTransaction(queries);
  }

  // =====================================================
  // OUTGOING MAILS
  // =====================================================
  
  static async getOutgoingMails(): Promise<any[]> {
    const query = `
      SELECT 
        om.*,
        c.name as category_name,
        c.color as category_color,
        u.display_name as created_by_name,
        GROUP_CONCAT(DISTINCT CONCAT(t.id, ':', t.name, ':', t.color) SEPARATOR '|') as tags_data
      FROM outgoing_mails om
      LEFT JOIN categories c ON om.category_id = c.id
      LEFT JOIN users u ON om.created_by = u.id
      LEFT JOIN mail_tags mt ON om.id = mt.mail_id AND mt.mail_type = 'outgoing'
      LEFT JOIN tags t ON mt.tag_id = t.id
      GROUP BY om.id
      ORDER BY om.send_date DESC, om.created_at DESC
    `;
    
    const results = await executeQuery(query);
    
    // Traiter les tags
    return results.map(mail => ({
      ...mail,
      tags: mail.tags_data ? mail.tags_data.split('|').map((tagData: string) => {
        const [id, name, color] = tagData.split(':');
        return { id, name, color };
      }) : []
    }));
  }

  static async createOutgoingMail(mailData: any): Promise<string> {
    const id = uuidv4();
    
    const queries = [
      {
        query: `
          INSERT INTO outgoing_mails (
            id, reference, subject, content, category_id,
            send_date, priority, scan_url, scan_filename, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        params: [
          id,
          mailData.reference,
          mailData.subject,
          mailData.content || null,
          mailData.categoryId,
          mailData.sendDate,
          mailData.priority || 'normal',
          mailData.scanUrl || null,
          mailData.scanFilename || null,
          mailData.createdBy
        ]
      }
    ];
    
    // Ajouter les tags
    if (mailData.tags && mailData.tags.length > 0) {
      for (const tagId of mailData.tags) {
        queries.push({
          query: `
            INSERT INTO mail_tags (id, mail_id, mail_type, tag_id, created_at)
            VALUES (?, ?, 'outgoing', ?, NOW())
          `,
          params: [uuidv4(), id, tagId]
        });
      }
    }
    
    await executeTransaction(queries);
    return id;
  }

  static async updateOutgoingMail(id: string, mailData: any): Promise<void> {
    const updates = [];
    const params = [];
    
    if (mailData.reference !== undefined) {
      updates.push('reference = ?');
      params.push(mailData.reference);
    }
    
    if (mailData.subject !== undefined) {
      updates.push('subject = ?');
      params.push(mailData.subject);
    }
    
    if (mailData.content !== undefined) {
      updates.push('content = ?');
      params.push(mailData.content);
    }
    
    if (mailData.categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(mailData.categoryId);
    }
    
    if (mailData.sendDate !== undefined) {
      updates.push('send_date = ?');
      params.push(mailData.sendDate);
    }
    
    if (mailData.priority !== undefined) {
      updates.push('priority = ?');
      params.push(mailData.priority);
    }
    
    if (mailData.scanUrl !== undefined) {
      updates.push('scan_url = ?');
      params.push(mailData.scanUrl);
    }
    
    if (mailData.scanFilename !== undefined) {
      updates.push('scan_filename = ?');
      params.push(mailData.scanFilename);
    }
    
    if (mailData.isProcessed !== undefined) {
      updates.push('is_processed = ?');
      params.push(mailData.isProcessed ? 1 : 0);
    }
    
    if (mailData.updatedBy !== undefined) {
      updates.push('updated_by = ?');
      params.push(mailData.updatedBy);
    }
    
    const queries = [];
    
    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(id);
      
      queries.push({
        query: `UPDATE outgoing_mails SET ${updates.join(', ')} WHERE id = ?`,
        params: params
      });
    }
    
    // Mettre à jour les tags si fournis
    if (mailData.tags !== undefined) {
      // Supprimer les anciens tags
      queries.push({
        query: 'DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = "outgoing"',
        params: [id]
      });
      
      // Ajouter les nouveaux tags
      for (const tagId of mailData.tags) {
        queries.push({
          query: `
            INSERT INTO mail_tags (id, mail_id, mail_type, tag_id, created_at)
            VALUES (?, ?, 'outgoing', ?, NOW())
          `,
          params: [uuidv4(), id, tagId]
        });
      }
    }
    
    if (queries.length > 0) {
      await executeTransaction(queries);
    }
  }

  static async deleteOutgoingMail(id: string): Promise<void> {
    const queries = [
      {
        query: 'DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = "outgoing"',
        params: [id]
      },
      {
        query: 'DELETE FROM outgoing_mails WHERE id = ?',
        params: [id]
      }
    ];
    
    await executeTransaction(queries);
  }

  // =====================================================
  // SETTINGS
  // =====================================================
  
  static async getSettings(): Promise<any> {
    const query = 'SELECT `key`, `value` FROM settings';
    const results = await executeQuery(query);
    
    const settings: any = {};
    for (const row of results) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    
    return settings;
  }

  static async updateSettings(settingsData: any): Promise<void> {
    const queries = [];
    
    for (const [key, value] of Object.entries(settingsData)) {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      queries.push({
        query: `
          INSERT INTO settings (\`key\`, \`value\`, updated_at)
          VALUES (?, ?, NOW())
          ON DUPLICATE KEY UPDATE
          \`value\` = VALUES(\`value\`), updated_at = NOW()
        `,
        params: [key, jsonValue]
      });
    }
    
    if (queries.length > 0) {
      await executeTransaction(queries);
    }
  }

  // =====================================================
  // SEARCH
  // =====================================================
  
  static async searchMails(searchParams: any): Promise<any[]> {
    const {
      searchTerm,
      mailType = 'all',
      categoryId,
      priority,
      dateFrom,
      dateTo,
      tags = [],
      limit = 100
    } = searchParams;
    
    let query = `
      SELECT * FROM mail_overview
      WHERE 1=1
    `;
    const params = [];
    
    if (searchTerm) {
      query += ` AND (reference LIKE ? OR subject LIKE ? OR content LIKE ?)`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (mailType && mailType !== 'all') {
      query += ` AND mail_type = ?`;
      params.push(mailType);
    }
    
    if (categoryId) {
      query += ` AND category_name = (SELECT name FROM categories WHERE id = ?)`;
      params.push(categoryId);
    }
    
    if (priority) {
      query += ` AND priority = ?`;
      params.push(priority);
    }
    
    if (dateFrom) {
      query += ` AND mail_date >= ?`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND mail_date <= ?`;
      params.push(dateTo);
    }
    
    if (tags.length > 0) {
      const tagPlaceholders = tags.map(() => '?').join(',');
      query += ` AND id IN (
        SELECT DISTINCT mail_id FROM mail_tags 
        WHERE tag_id IN (${tagPlaceholders})
      )`;
      params.push(...tags);
    }
    
    query += ` ORDER BY mail_date DESC LIMIT ?`;
    params.push(limit);
    
    return await executeQuery(query, params);
  }

  // =====================================================
  // STATISTICS
  // =====================================================
  
  static async getStatistics(): Promise<any> {
    const query = 'CALL GetMailStatistics()';
    const [results] = await executeQuery(query);
    return results[0] || {};
  }

  // =====================================================
  // ACTIVITY LOGS
  // =====================================================
  
  static async logActivity(activityData: any): Promise<void> {
    const query = `
      INSERT INTO activity_logs (
        id, user_id, action, module, details, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await executeQuery(query, [
      uuidv4(),
      activityData.userId,
      activityData.action,
      activityData.module,
      JSON.stringify(activityData.details || {}),
      activityData.ipAddress || null,
      activityData.userAgent || null
    ]);
  }

  static async getUserActivity(userId: string, limit: number = 50): Promise<any[]> {
    const query = 'CALL GetUserActivity(?, ?)';
    const [results] = await executeQuery(query, [userId, limit]);
    return results || [];
  }
}

export default MySQLService;