const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur de l\'API');
    }
    return response.json();
  }

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  static async authenticateUser(email: string, password: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return this.handleResponse(response);
  }

  static verifyToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Token expiré');
      }
      return payload;
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  // =====================================================
  // USERS
  // =====================================================

  static async getUsers(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async createUser(userData: any): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const result = await this.handleResponse(response);
    return result.id;
  }

  static async updateUser(id: string, userData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    await this.handleResponse(response);
  }

  static async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    await this.handleResponse(response);
  }

  // =====================================================
  // CATEGORIES
  // =====================================================

  static async getCategories(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async createCategory(categoryData: any): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    const result = await this.handleResponse(response);
    return result.id;
  }

  static async updateCategory(id: string, categoryData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    await this.handleResponse(response);
  }

  static async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    await this.handleResponse(response);
  }

  // =====================================================
  // TAGS
  // =====================================================

  static async getTags(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async createTag(tagData: any): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tagData)
    });
    const result = await this.handleResponse(response);
    return result.id;
  }

  static async updateTag(id: string, tagData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tagData)
    });
    await this.handleResponse(response);
  }

  static async deleteTag(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    await this.handleResponse(response);
  }

  // =====================================================
  // SENDERS
  // =====================================================

  static async getSenders(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/senders`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async createSender(senderData: any): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/senders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(senderData)
    });
    const result = await this.handleResponse(response);
    return result.id;
  }

  static async updateSender(id: string, senderData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/senders/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(senderData)
    });
    await this.handleResponse(response);
  }

  // =====================================================
  // INCOMING MAILS
  // =====================================================

  static async getIncomingMails(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/incoming-mails`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async createIncomingMail(mailData: any): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/incoming-mails`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(mailData)
    });
    const result = await this.handleResponse(response);
    return result.id;
  }

  static async updateIncomingMail(id: string, mailData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/incoming-mails/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(mailData)
    });
    await this.handleResponse(response);
  }

  static async deleteIncomingMail(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/incoming-mails/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    await this.handleResponse(response);
  }

  // =====================================================
  // OUTGOING MAILS
  // =====================================================

  static async getOutgoingMails(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/outgoing-mails`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async createOutgoingMail(mailData: any): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/outgoing-mails`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(mailData)
    });
    const result = await this.handleResponse(response);
    return result.id;
  }

  static async updateOutgoingMail(id: string, mailData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/outgoing-mails/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(mailData)
    });
    await this.handleResponse(response);
  }

  static async deleteOutgoingMail(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/outgoing-mails/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    await this.handleResponse(response);
  }

  // =====================================================
  // SEARCH
  // =====================================================

  static async searchMails(searchParams: any): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(searchParams)
    });
    return this.handleResponse(response);
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  static async getStatistics(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/statistics`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // =====================================================
  // SETTINGS
  // =====================================================

  static async getSettings(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  static async updateSettings(settingsData: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settingsData)
    });
    await this.handleResponse(response);
  }
}

export { ApiService as DatabaseService };