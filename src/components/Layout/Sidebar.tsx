import React from 'react';
import { 
  Home, 
  PlaneLanding, 
  PlaneTakeoff, 
  Search, 
  Settings, 
  Users, 
  Tags,
  Folder,
  LogOut,
  Shield,
  Activity,
  UserCheck,
  Crown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../types';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const { currentUser, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, permission: 'dashboard' },
    { id: 'incoming', label: 'Courriers arrivée', icon: PlaneLanding, permission: 'incoming' },
    { id: 'outgoing', label: 'Courriers départ', icon: PlaneTakeoff, permission: 'outgoing' },
    { id: 'search', label: 'Recherche', icon: Search, permission: 'search' },
    { id: 'categories', label: 'Catégories', icon: Folder, permission: 'categories' },
    { id: 'tags', label: 'Tags', icon: Tags, permission: 'tags' },
  ];

  const adminItems = [
    { id: 'users', label: 'Utilisateurs', icon: Users, permission: 'users' },
    { id: 'activity', label: 'Journal d\'activité', icon: Activity, permission: 'activity' },
    { id: 'settings', label: 'Paramètres', icon: Settings, permission: 'settings' },
  ];

  const hasPermission = (module: string, action: string = 'read') => {
    if (!currentUser) return false;
    const permission = currentUser.permissions.find(p => p.module === module);
    return permission?.actions.includes(action as any) || false;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
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
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'manager':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'user':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="bg-white shadow-lg h-full flex flex-col border-r border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg shadow-md">
            <PlaneLanding className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-700">MailFlow</h1>
            <p className="text-xs text-blue-600">Gestion des courriers</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Menu principal */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const canAccess = hasPermission(item.permission);
            
            if (!canAccess) return null;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon 
                  size={20} 
                  className={`transition-transform duration-200 ${
                    activeSection === item.id ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section Administration - Seulement pour admin */}
        {currentUser?.role === 'admin' && (
          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex items-center space-x-2 px-4 mb-3">
              <Crown className="h-4 w-4 text-red-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </p>
            </div>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const canAccess = hasPermission(item.permission);
                
                if (!canAccess) return null;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      activeSection === item.id
                        ? 'bg-red-50 text-red-700 border-l-4 border-red-500 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <Icon 
                      size={20}
                      className={`transition-transform duration-200 ${
                        activeSection === item.id ? 'scale-110' : 'group-hover:scale-105'
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Profil utilisateur */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg mb-3 shadow-sm border border-gray-100">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${getRoleColor(currentUser?.role || 'user')}`}>
            {currentUser?.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser?.displayName}
              </p>
              {getRoleIcon(currentUser?.role || 'user')}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {currentUser?.email}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                {ROLE_LABELS[currentUser?.role || 'user']}
              </span>
            </div>
            {currentUser?.lastLogin && (
              <p className="text-xs text-gray-400 mt-1">
                Dernière connexion: {currentUser.lastLogin.toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform duration-200" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;