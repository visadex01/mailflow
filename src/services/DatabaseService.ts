import { executeQuery } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseService {
  
  // =====================================================
  // AUTHENTICATION
  // =====================================================
  
  static async authenticateUser(email: string, password: string): Promise<any> {
    const query = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
    const users = await executeQuery(query, [email]);
    
    if (users.length === 0) {
      throw new Error('Utilisateur non trouvé');
    }
    
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Mot de passe incorrect');
    }
    
    // Mettre à jour la dernière connexion
    await executeQuery('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      import.meta.env.VITE_JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
      },
      token
    };
  }
  
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, import.meta.env.VITE_JWT_SECRET || 'default-secret');
    } catch (error) {
      throw new Error('Token invalide');
    }
  }
  
  // =====================================================
  // USERS
  // =====================================================
  
  static async getUsers(): Promise<any[]> {
    const query = 'SELECT id, email, display_name, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC';
    return await executeQuery(query);
  }
  
  static async createUser(userData: any): Promise<string> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const query = `
      INSERT INTO users (id, email, password, display_name, role, permissions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await executeQuery(query, [
      id,
      userData.email,
      hashedPassword,
      userData.displayName,
      userData.role,
      JSON.stringify(userData.permissions)
    ]);
    
    return id;
  }
  
  static async updateUser(id: string, userData: any): Promise<void> {
    const updates = [];
    const params = [];
    
    if (userData.displayName) {
      updates.push('display_name = ?');
      params.push(userData.displayName);
    }
    
    if (userData.role) {
      updates.push('role = ?');
      params.push(userData.role);
    }
    
    if (userData.permissions) {
      updates.push('permissions = ?');
      params.push(JSON.stringify(userData.permissions));
    }
    
    if (userData.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(userData.isActive ? 1 : 0);
    }
    
    if (updates.length > 0) {
      params.push(id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(query, params);
    }
  }
  
  static async deleteUser(id: string): Promise<void> {
    await executeQuery('DELETE FROM users WHERE id = ?', [id]);
  }
  
  // =====================================================
  // CATEGORIES
  // =====================================================
  
  static async getCategories(): Promise<any[]> {
    const query = 'SELECT * FROM categories WHERE is_active = 1 ORDER BY name';
    return await executeQuery(query);
  }
  
  static async createCategory(categoryData: any): Promise<string> {
    const id = uuidv4();
    const query = 'INSERT INTO categories (id, name, description, color, created_by) VALUES (?, ?, ?, ?, ?)';
    await executeQuery(query, [id, categoryData.name, categoryData.description, categoryData.color, categoryData.createdBy]);
    return id;
  }
  
  static async updateCategory(id: string, categoryData: any): Promise<void> {
    const query = 'UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ?';
    await executeQuery(query, [categoryData.name, categoryData.description, categoryData.color, id]);
  }
  
  static async deleteCategory(id: string): Promise<void> {
    await executeQuery('DELETE FROM categories WHERE id = ?', [id]);
  }
  
  // =====================================================
  // TAGS
  // =====================================================
  
  static async getTags(): Promise<any[]> {
    const query = 'SELECT * FROM tags WHERE is_active = 1 ORDER BY type, name';
    return await executeQuery(query);
  }
  
  static async createTag(tagData: any): Promise<string> {
    const id = uuidv4();
    const query = 'INSERT INTO tags (id, name, type, color, created_by) VALUES (?, ?, ?, ?, ?)';
    await executeQuery(query, [id, tagData.name, tagData.type, tagData.color, tagData.createdBy]);
    return id;
  }
  
  static async updateTag(id: string, tagData: any): Promise<void> {
    const query = 'UPDATE tags SET name = ?, type = ?, color = ? WHERE id = ?';
    await executeQuery(query, [tagData.name, tagData.type, tagData.color, id]);
  }
  
  static async deleteTag(id: string): Promise<void> {
    await executeQuery('DELETE FROM tags WHERE id = ?', [id]);
  }
  
  // =====================================================
  // SENDERS
  // =====================================================
  
  static async getSenders(): Promise<any[]> {
    const query = 'SELECT * FROM senders WHERE is_active = 1 ORDER BY name';
    return await executeQuery(query);
  }
  
  static async createSender(senderData: any): Promise<string> {
    const id = uuidv4();
    const query = 'INSERT INTO senders (id, name, email, phone, fax, organization, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)';
    await executeQuery(query, [id, senderData.name, senderData.email, senderData.phone, senderData.fax, senderData.organization, senderData.createdBy]);
    return id;
  }
  
  static async updateSender(id: string, senderData: any): Promise<void> {
    const query = 'UPDATE senders SET name = ?, email = ?, phone = ?, fax = ?, organization = ? WHERE id = ?';
    await executeQuery(query, [senderData.name, senderData.email, senderData.phone, senderData.fax, senderData.organization, id]);
  }
  
  static async deleteSender(id: string): Promise<void> {
    await executeQuery('DELETE FROM senders WHERE id = ?', [id]);
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
    return results.map((mail: any) => ({
      ...mail,
      tags: mail.tag_ids ? mail.tag_ids.split(',').map((id: string, index: number) => ({
        id,
        name: mail.tag_names.split(',')[index],
        color: mail.tag_colors.split(',')[index]
      })) : []
    }));
  }
  
  static async createIncomingMail(mailData: any): Promise<string> {
    const id = uuidv4();
    
    // Insérer le courrier
    const mailQuery = `
      INSERT INTO incoming_mails (id, reference, subject, summary, category_id, sender_id, arrival_date, priority, scan_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(mailQuery, [
      id, mailData.reference, mailData.subject, mailData.summary,
      mailData.categoryId, mailData.senderId, mailData.arrivalDate,
      mailData.priority, mailData.scanUrl, mailData.createdBy
    ]);
    
    // Ajouter les tags
    if (mailData.tags && mailData.tags.length > 0) {
      for (const tagId of mailData.tags) {
        await executeQuery(
          'INSERT INTO mail_tags (id, mail_id, mail_type, tag_id) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, 'incoming', tagId]
        );
      }
    }
    
    return id;
  }
  
  static async updateIncomingMail(id: string, mailData: any): Promise<void> {
    const query = `
      UPDATE incoming_mails 
      SET reference = ?, subject = ?, summary = ?, category_id = ?, sender_id = ?, 
          arrival_date = ?, priority = ?, scan_url = ?, is_processed = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      mailData.reference, mailData.subject, mailData.summary,
      mailData.categoryId, mailData.senderId, mailData.arrivalDate,
      mailData.priority, mailData.scanUrl, mailData.isProcessed ? 1 : 0, id
    ]);
    
    // Mettre à jour les tags
    if (mailData.tags !== undefined) {
      await executeQuery('DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = ?', [id, 'incoming']);
      
      for (const tagId of mailData.tags) {
        await executeQuery(
          'INSERT INTO mail_tags (id, mail_id, mail_type, tag_id) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, 'incoming', tagId]
        );
      }
    }
  }
  
  static async deleteIncomingMail(id: string): Promise<void> {
    await executeQuery('DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = ?', [id, 'incoming']);
    await executeQuery('DELETE FROM incoming_mails WHERE id = ?', [id]);
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
    return results.map((mail: any) => ({
      ...mail,
      tags: mail.tag_ids ? mail.tag_ids.split(',').map((id: string, index: number) => ({
        id,
        name: mail.tag_names.split(',')[index],
        color: mail.tag_colors.split(',')[index]
      })) : []
    }));
  }
  
  static async createOutgoingMail(mailData: any): Promise<string> {
    const id = uuidv4();
    
    const mailQuery = `
      INSERT INTO outgoing_mails (id, reference, subject, content, category_id, send_date, priority, scan_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(mailQuery, [
      id, mailData.reference, mailData.subject, mailData.content,
      mailData.categoryId, mailData.sendDate, mailData.priority,
      mailData.scanUrl, mailData.createdBy
    ]);
    
    if (mailData.tags && mailData.tags.length > 0) {
      for (const tagId of mailData.tags) {
        await executeQuery(
          'INSERT INTO mail_tags (id, mail_id, mail_type, tag_id) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, 'outgoing', tagId]
        );
      }
    }
    
    return id;
  }
  
  static async updateOutgoingMail(id: string, mailData: any): Promise<void> {
    const query = `
      UPDATE outgoing_mails 
      SET reference = ?, subject = ?, content = ?, category_id = ?, 
          send_date = ?, priority = ?, scan_url = ?, is_processed = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      mailData.reference, mailData.subject, mailData.content,
      mailData.categoryId, mailData.sendDate, mailData.priority,
      mailData.scanUrl, mailData.isProcessed ? 1 : 0, id
    ]);
    
    if (mailData.tags !== undefined) {
      await executeQuery('DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = ?', [id, 'outgoing']);
      
      for (const tagId of mailData.tags) {
        await executeQuery(
          'INSERT INTO mail_tags (id, mail_id, mail_type, tag_id) VALUES (?, ?, ?, ?)',
          [uuidv4(), id, 'outgoing', tagId]
        );
      }
    }
  }
  
  static async deleteOutgoingMail(id: string): Promise<void> {
    await executeQuery('DELETE FROM mail_tags WHERE mail_id = ? AND mail_type = ?', [id, 'outgoing']);
    await executeQuery('DELETE FROM outgoing_mails WHERE id = ?', [id]);
  }
  
  // =====================================================
  // SEARCH
  // =====================================================
  
  static async searchMails(searchParams: any): Promise<any[]> {
    const { searchTerm, mailType, categoryId, priority, dateFrom, dateTo } = searchParams;
    
    let query = `
      SELECT 'incoming' as type, id, reference, subject, summary as content, arrival_date as date, priority, category_id
      FROM incoming_mails WHERE 1=1
    `;
    let params: any[] = [];
    
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
    
    if (mailType !== 'all' && mailType !== 'outgoing') {
      // Seulement les courriers d'arrivée
    } else if (mailType === 'outgoing') {
      // Remplacer par les courriers de départ
      query = query.replace('incoming_mails', 'outgoing_mails')
                   .replace('arrival_date', 'send_date')
                   .replace('summary', 'content')
                   .replace("'incoming'", "'outgoing'");
    } else {
      // Les deux types
      const outgoingQuery = query.replace('incoming_mails', 'outgoing_mails')
                                 .replace('arrival_date', 'send_date')
                                 .replace('summary', 'content')
                                 .replace("'incoming'", "'outgoing'");
      query += ' UNION ALL ' + outgoingQuery;
      params = [...params, ...params]; // Doubler les paramètres
    }
    
    query += ' ORDER BY date DESC LIMIT 100';
    
    return await executeQuery(query, params);
  }
  
  // =====================================================
  // STATISTICS
  // =====================================================
  
  static async getStatistics(): Promise<any> {
    const queries = [
      'SELECT COUNT(*) as totalIncoming FROM incoming_mails',
      'SELECT COUNT(*) as totalOutgoing FROM outgoing_mails',
      'SELECT COUNT(*) as todayIncoming FROM incoming_mails WHERE DATE(arrival_date) = CURDATE()',
      'SELECT COUNT(*) as todayOutgoing FROM outgoing_mails WHERE DATE(send_date) = CURDATE()'
    ];
    
    const results = await Promise.all(queries.map(q => executeQuery(q)));
    
    return {
      totalIncoming: results[0][0].totalIncoming,
      totalOutgoing: results[1][0].totalOutgoing,
      totalToday: results[2][0].todayIncoming + results[3][0].todayOutgoing
    };
  }
  
  // =====================================================
  // SETTINGS
  // =====================================================
  
  static async getSettings(): Promise<any> {
    const results = await executeQuery('SELECT `key`, `value` FROM settings');
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
    for (const [key, value] of Object.entries(settingsData)) {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      await executeQuery(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, jsonValue]
      );
    }
  }
}