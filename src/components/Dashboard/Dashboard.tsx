import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  FileText, 
  Users, 
  TrendingUp,
  Calendar,
  Clock,
  Search,
  PlaneLanding,
  PlaneTakeoff,
  Activity,
  User
} from 'lucide-react';
import { DatabaseService } from '../../services/DatabaseService';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

interface DashboardProps {
  onSectionChange?: (section: string) => void;
}

const Dashboard = ({ onSectionChange }: DashboardProps) => {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalIncoming: 0,
    totalOutgoing: 0,
    totalToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statistics = await DatabaseService.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les données du tableau de bord.',
        persistent: true
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, growth }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : value}</p>
          {growth && !loading && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+{growth}%</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color} shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </div>
  );

  const navigateToSection = (section: string) => {
    if (onSectionChange) {
      onSectionChange(section);
      addNotification({
        type: 'info',
        title: 'Navigation',
        message: `Redirection vers ${section === 'incoming' ? 'Courriers d\'arrivée' : section === 'outgoing' ? 'Courriers de départ' : 'Recherche'}`,
        persistent: false
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Courriers arrivée"
          value={stats.totalIncoming}
          icon={PlaneLanding}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          growth={12}
        />
        <StatCard
          title="Courriers départ"
          value={stats.totalOutgoing}
          icon={PlaneTakeoff}
          color="bg-gradient-to-br from-green-500 to-green-600"
          growth={8}
        />
        <StatCard
          title="Aujourd'hui"
          value={stats.totalToday}
          icon={Calendar}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horloge */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 text-indigo-500 mr-2" />
              Date et heure
            </h3>
          </div>
          
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="text-3xl font-bold tracking-wide mb-2">
                {currentTime.toLocaleTimeString('fr-FR')}
              </div>
              <div className="text-white/80 text-xs font-medium">
                HEURE LOCALE
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="text-lg font-semibold text-gray-800 capitalize mb-2">
                {currentTime.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Informations système */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 text-orange-500 mr-2" />
              Système
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-800">Base de données</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">MySQL Connecté</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-800">Version</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">MailFlow 1.0</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-800">Environnement</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Développement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Search className="h-5 w-5 text-gray-500 mr-2" />
          Actions rapides
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => navigateToSection('incoming')}
            className="group p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <PlaneLanding className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                Nouveau courrier arrivée
              </p>
            </div>
          </button>
          
          <button 
            onClick={() => navigateToSection('outgoing')}
            className="group p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <PlaneTakeoff className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm font-semibold text-green-700 group-hover:text-green-800">
                Nouveau courrier départ
              </p>
            </div>
          </button>
          
          <button 
            onClick={() => navigateToSection('search')}
            className="group p-6 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-4 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Search className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm font-semibold text-purple-700 group-hover:text-purple-800">
                Rechercher
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Informations utilisateur */}
      {currentUser && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-full p-3 shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                Bienvenue, {currentUser.displayName}
              </h4>
              <p className="text-sm text-gray-600">
                Connecté en tant que {currentUser.role === 'admin' ? 'Administrateur' : 
                currentUser.role === 'manager' ? 'Manager' : 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Base de données MySQL - Version 1.0
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;