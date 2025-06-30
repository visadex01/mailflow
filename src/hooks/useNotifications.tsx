import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  }, []);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Filtrer les notifications - ne garder que celles relatives à l'utilisation et aux erreurs
    const allowedTypes = ['error', 'warning'];
    const allowedUsageNotifications = [
      'connexion réussie',
      'déconnexion',
      'courrier ajouté',
      'courrier modifié',
      'courrier supprimé',
      'catégorie créée',
      'tag créé',
      'utilisateur créé',
      'paramètres sauvegardés',
      'recherche effectuée',
      'export terminé',
      'import terminé'
    ];

    const isUsageNotification = allowedUsageNotifications.some(usage => 
      notificationData.title.toLowerCase().includes(usage) ||
      notificationData.message.toLowerCase().includes(usage)
    );

    // Ne pas afficher les notifications système génériques
    if (!allowedTypes.includes(notificationData.type) && !isUsageNotification) {
      return;
    }

    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [notification, ...prev]);

    // Show browser notification if permission is granted and it's important
    if ('Notification' in window && Notification.permission === 'granted') {
      // Seulement pour les erreurs et les actions importantes
      if (notification.type === 'error' || notification.type === 'warning' || isUsageNotification) {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/vite.svg',
          badge: '/vite.svg',
          tag: notification.id,
          requireInteraction: notification.type === 'error' || notification.persistent
        });

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
          if (notification.action) {
            notification.action.onClick();
          }
        };

        // Auto close after 5 seconds unless persistent or error
        if (!notification.persistent && notification.type !== 'error') {
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }
      }
    }

    // Auto remove non-persistent notifications after 8 seconds (sauf erreurs)
    if (!notificationData.persistent && notificationData.type !== 'error') {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 8000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};