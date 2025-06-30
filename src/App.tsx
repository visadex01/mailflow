import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationProvider } from './hooks/useNotifications';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import IncomingMail from './components/Mail/IncomingMail';
import OutgoingMail from './components/Mail/OutgoingMail';
import SearchModule from './components/Search/SearchModule';
import CategoriesModule from './components/Admin/CategoriesModule';
import TagsModule from './components/Admin/TagsModule';
import UsersModule from './components/Admin/UsersModule';
import SettingsModule from './components/Settings/SettingsModule';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de MailFlow...</p>
          <p className="text-sm text-gray-500 mt-2">Connexion MySQL...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm />;
  }

  const getSectionTitle = (section: string) => {
    const titles: { [key: string]: string } = {
      dashboard: 'Tableau de bord',
      incoming: 'Courriers d\'arrivée',
      outgoing: 'Courriers de départ',
      search: 'Recherche',
      categories: 'Catégories',
      tags: 'Tags',
      users: 'Gestion des utilisateurs',
      settings: 'Paramètres'
    };
    return titles[section] || 'MailFlow';
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onSectionChange={setActiveSection} />;
      case 'incoming':
        return <IncomingMail />;
      case 'outgoing':
        return <OutgoingMail />;
      case 'search':
        return <SearchModule />;
      case 'categories':
        return <CategoriesModule />;
      case 'tags':
        return <TagsModule />;
      case 'users':
        return <UsersModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <Dashboard onSectionChange={setActiveSection} />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getSectionTitle(activeSection)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;