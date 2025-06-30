import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  X, 
  CheckCircle,
  Crown,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  Mail,
  Calendar,
  AlertCircle,
  Loader
} from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { User, ROLE_LABELS, ROLE_PERMISSIONS } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

const UsersModule = () => {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    role: 'user' as 'admin' | 'manager' | 'user'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || null
        } as User;
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les utilisateurs.',
        persistent: true
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewUser = async (email: string, password: string, displayName: string, role: 'admin' | 'manager' | 'user') => {
    try {
      // Créer l'utilisateur avec Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Créer le profil utilisateur dans Firestore
      const userDoc = doc(db, 'users', userCredential.user.uid);
      await updateDoc(userDoc, {
        email: email,
        displayName: displayName,
        role: role,
        permissions: ROLE_PERMISSIONS[role],
        createdAt: new Date(),
        lastLogin: null,
        isActive: true
      });

      addNotification({
        type: 'success',
        title: 'Utilisateur créé',
        message: `Le compte ${displayName} (${ROLE_LABELS[role]}) a été créé avec succès.`,
        persistent: false
      });
      
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la création du compte';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Cette adresse email est déjà utilisée';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'La création de comptes est désactivée';
          break;
      }

      addNotification({
        type: 'error',
        title: 'Erreur de création',
        message: errorMessage,
        persistent: true
      });
      
      throw new Error(errorMessage);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.displayName.trim()) {
      addNotification({
        type: 'error',
        title: 'Champ requis',
        message: 'Le nom complet est obligatoire.',
        persistent: false
      });
      return false;
    }

    if (!editingUser) {
      if (!formData.email.trim()) {
        addNotification({
          type: 'error',
          title: 'Champ requis',
          message: 'L\'adresse email est obligatoire.',
          persistent: false
        });
        return false;
      }

      if (!formData.password.trim()) {
        addNotification({
          type: 'error',
          title: 'Champ requis',
          message: 'Le mot de passe est obligatoire.',
          persistent: false
        });
        return false;
      }

      if (formData.password.length < 6) {
        addNotification({
          type: 'error',
          title: 'Mot de passe trop court',
          message: 'Le mot de passe doit contenir au moins 6 caractères.',
          persistent: false
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'authentification',
        message: 'Vous devez être connecté pour effectuer cette action.',
        persistent: true
      });
      return;
    }

    // Validation du formulaire
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        // Mise à jour d'un utilisateur existant
        console.log('Mise à jour de l\'utilisateur:', editingUser.id);
        
        await updateDoc(doc(db, 'users', editingUser.id), {
          displayName: formData.displayName.trim(),
          role: formData.role,
          permissions: ROLE_PERMISSIONS[formData.role],
          updatedAt: new Date(),
          updatedBy: currentUser.id
        });
        
        addNotification({
          type: 'success',
          title: 'Utilisateur modifié',
          message: `L'utilisateur "${formData.displayName}" a été mis à jour avec succès.`,
          persistent: false
        });
      } else {
        // Création d'un nouvel utilisateur
        console.log('Création d\'un nouvel utilisateur');
        
        await createNewUser(
          formData.email.trim(),
          formData.password,
          formData.displayName.trim(),
          formData.role
        );
      }

      // Fermer le formulaire et recharger les données
      setShowForm(false);
      setEditingUser(null);
      resetForm();
      await loadUsers();

    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
      // L'erreur est déjà gérée dans createNewUser pour la création
      if (editingUser) {
        addNotification({
          type: 'error',
          title: 'Erreur de modification',
          message: 'Impossible de modifier l\'utilisateur. Veuillez réessayer.',
          persistent: true
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      email: user.email,
      displayName: user.displayName,
      password: '',
      role: user.role
    });
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (userId: string, displayName: string) => {
    if (userId === currentUser?.id) {
      addNotification({
        type: 'warning',
        title: 'Action interdite',
        message: 'Vous ne pouvez pas supprimer votre propre compte.',
        persistent: false
      });
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${displayName}" ?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      addNotification({
        type: 'success',
        title: 'Utilisateur supprimé',
        message: `L'utilisateur "${displayName}" a été supprimé avec succès.`,
        persistent: false
      });
      loadUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de suppression',
        message: 'Impossible de supprimer l\'utilisateur.',
        persistent: true
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean, displayName: string) => {
    if (userId === currentUser?.id) {
      addNotification({
        type: 'warning',
        title: 'Action interdite',
        message: 'Vous ne pouvez pas désactiver votre propre compte.',
        persistent: false
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus,
        updatedAt: new Date(),
        updatedBy: currentUser!.id
      });
      
      addNotification({
        type: 'success',
        title: 'Statut modifié',
        message: `L'utilisateur "${displayName}" a été ${!currentStatus ? 'activé' : 'désactivé'}.`,
        persistent: false
      });
      loadUsers();
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de modification',
        message: 'Impossible de modifier le statut de l\'utilisateur.',
        persistent: true
      });
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      displayName: '',
      password: '',
      role: 'user'
    });
    setShowPassword(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-red-500" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-orange-500" />;
      case 'user':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <UserCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserAvatarColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'manager':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'user':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="h-5 w-5 text-red-500 mr-2" />
          Gestion des utilisateurs ({users.length})
        </h3>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus size={20} />
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-red-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${getUserAvatarColor(user.role)}`}>
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {user.displayName}
                        </h4>
                        {getRoleIcon(user.role)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(user.role)}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                        {!user.isActive && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                            Désactivé
                          </span>
                        )}
                        {user.id === currentUser?.id && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                            Vous
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-1">
                          <Mail size={14} />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>Créé le {user.createdAt.toLocaleDateString('fr-FR')}</span>
                        </div>
                        {user.lastLogin && (
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>Dernière connexion: {user.lastLogin.toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.isActive, user.displayName)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      title={user.isActive ? 'Désactiver' : 'Activer'}
                      disabled={user.id === currentUser?.id}
                    >
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </button>
                    <button 
                      onClick={() => handleEdit(user)}
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    {user.id !== currentUser?.id && (
                      <button 
                        onClick={() => handleDelete(user.id, user.displayName)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun utilisateur trouvé</p>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 text-red-500 mr-2" />
                  {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={saving}
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Barre de progression */}
              {saving && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">
                      {editingUser ? 'Modification en cours...' : 'Création en cours...'}
                    </span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                  disabled={saving}
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                        disabled={saving}
                        placeholder="jean.dupont@example.com"
                      />
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                        minLength={6}
                        disabled={saving}
                        placeholder="Minimum 6 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        disabled={saving}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                  disabled={saving}
                >
                  <option value="user">Utilisateur</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                </select>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Permissions du rôle sélectionné :</p>
                  <p className="text-xs text-gray-500">
                    {formData.role === 'user' && 'Consultation et recherche uniquement'}
                    {formData.role === 'manager' && 'Gestion des courriers, catégories et tags'}
                    {formData.role === 'admin' && 'Accès complet à toutes les fonctionnalités'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader className="animate-spin h-4 w-4" />
                      <span>{editingUser ? 'Modification...' : 'Création...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>{editingUser ? 'Modifier' : 'Créer'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;