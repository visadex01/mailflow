export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'user';
  permissions: Permission[];
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  isDefaultAdmin?: boolean;
}

export interface Permission {
  module: string;
  actions: ('read' | 'write' | 'delete')[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface Tag {
  id: string;
  name: string;
  type: 'nature' | 'priority' | 'status';
  color: string;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface Sender {
  id: string;
  name: string;
  email?: string;
  fax?: string;
  organization?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface IncomingMail {
  id: string;
  reference: string;
  subject: string;
  summary?: string;
  categoryId: string;
  senderId: string;
  tags: string[];
  arrivalDate: Date;
  scanUrl?: string;
  createdAt: Date;
  createdBy: string;
  isProcessed: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface OutgoingMail {
  id: string;
  reference: string;
  subject: string;
  content?: string;
  categoryId: string;
  tags: string[];
  sendDate: Date;
  scanUrl?: string;
  createdAt: Date;
  createdBy: string;
  isProcessed: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface Settings {
  id: string;
  autoRename: boolean;
  fileNamingPattern: string;
  storageFolders: {
    incoming: string;
    outgoing: string;
  };
  externalServices: {
    googleDrive?: {
      enabled: boolean;
      folderId?: string;
    };
    dropbox?: {
      enabled: boolean;
      accessToken?: string;
    };
    ftp?: {
      enabled: boolean;
      host: string;
      username: string;
      password: string;
      port: number;
    };
  };
  autoBackup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    service: 'googleDrive' | 'dropbox' | 'ftp';
    lastBackup?: Date;
  };
  notifications: {
    email: boolean;
    browser: boolean;
    urgentOnly: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

// Définition des rôles et permissions
export const ROLE_PERMISSIONS = {
  user: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'search', actions: ['read'] }
  ],
  manager: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'incoming', actions: ['read', 'write', 'delete'] },
    { module: 'outgoing', actions: ['read', 'write', 'delete'] },
    { module: 'categories', actions: ['read', 'write', 'delete'] },
    { module: 'tags', actions: ['read', 'write', 'delete'] },
    { module: 'search', actions: ['read'] }
  ],
  admin: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'incoming', actions: ['read', 'write', 'delete'] },
    { module: 'outgoing', actions: ['read', 'write', 'delete'] },
    { module: 'search', actions: ['read'] },
    { module: 'categories', actions: ['read', 'write', 'delete'] },
    { module: 'tags', actions: ['read', 'write', 'delete'] },
    { module: 'users', actions: ['read', 'write', 'delete'] },
    { module: 'activity', actions: ['read'] },
    { module: 'settings', actions: ['read', 'write'] }
  ]
} as const;

export const ROLE_LABELS = {
  user: 'Utilisateur',
  manager: 'Manager',
  admin: 'Administrateur'
} as const;