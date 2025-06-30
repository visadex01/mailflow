import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DatabaseService } from '../services/DatabaseService';
import { User, ROLE_PERMISSIONS } from '../types';
import { useNotifications } from './useNotifications';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string, displayName: string, role?: 'admin' | 'manager' | 'user') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  const signIn = async (email: string, password: string) => {
    try {
      const result = await DatabaseService.authenticateUser(email, password);
      
      // Sauvegarder le token
      localStorage.setItem('authToken', result.token);
      
      // Définir l'utilisateur actuel
      setCurrentUser({
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        role: result.user.role,
        permissions: result.user.permissions || ROLE_PERMISSIONS[result.user.role] || [],
        createdAt: new Date(),
        isActive: true
      });
      
      addNotification({
        type: 'success',
        title: 'Connexion réussie',
        message: `Bienvenue ${result.user.displayName} !`,
        persistent: false
      });
      
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erreur de connexion',
        message: error.message,
        persistent: true
      });
      throw error;
    }
  };

  const createUser = async (email: string, password: string, displayName: string, role: 'admin' | 'manager' | 'user' = 'user') => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Seuls les administrateurs peuvent créer des utilisateurs');
      }
      
      await DatabaseService.createUser({
        email,
        password,
        displayName,
        role,
        permissions: ROLE_PERMISSIONS[role]
      });
      
      addNotification({
        type: 'success',
        title: 'Utilisateur créé',
        message: `Le compte ${displayName} a été créé avec succès.`,
        persistent: false
      });
      
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erreur de création',
        message: error.message,
        persistent: true
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('authToken');
      setCurrentUser(null);
      
      addNotification({
        type: 'success',
        title: 'Déconnexion réussie',
        message: 'Vous avez été déconnecté avec succès.',
        persistent: false
      });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  // Vérification de l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Vérifier le token
        const decoded = DatabaseService.verifyToken(token);
        
        if (!decoded) {
          localStorage.removeItem('authToken');
          setLoading(false);
          return;
        }
        
        // Reconstituer l'utilisateur
        setCurrentUser({
          id: decoded.id,
          email: decoded.email,
          displayName: decoded.displayName || 'Utilisateur',
          role: decoded.role,
          permissions: ROLE_PERMISSIONS[decoded.role] || [],
          createdAt: new Date(),
          isActive: true
        });
        
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        localStorage.removeItem('authToken');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    createUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};