import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Bell, 
  Shield, 
  Cloud, 
  HardDrive,
  Mail,
  Globe,
  Lock,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Folder,
  FolderOpen,
  Check,
  X,
  Eye
} from 'lucide-react';
import { DatabaseService } from '../../services/DatabaseService';
import { Settings as SettingsType } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

const SettingsModule = () => {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [testingAccess, setTestingAccess] = useState<{ [key: string]: boolean }>({});
  const [accessResults, setAccessResults] = useState<{ [key: string]: 'success' | 'error' | null }>({});
  
  const [settings, setSettings] = useState<Partial<SettingsType>>({
    autoRename: true,
    fileNamingPattern: '{type}_{reference}_{date}_{subject}',
    storageFolders: {
      incoming: './uploads/courriers/arrivee',
      outgoing: './uploads/courriers/depart'
    },
    notifications: {
      email: true,
      browser: true,
      urgentOnly: false
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les paramètres.',
        persistent: true
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      await DatabaseService.updateSettings(settings);
      
      addNotification({
        type: 'success',
        title: 'Paramètres sauvegardés',
        message: 'Les paramètres ont été mis à jour avec succès.',
        persistent: false
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Impossible de sauvegarder les paramètres.',
        persistent: true
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Êtes-vous sûr de vouloir restaurer les paramètres par défaut ?')) {
      setSettings({
        autoRename: true,
        fileNamingPattern: '{type}_{reference}_{date}_{subject}',
        storageFolders: {
          incoming: './uploads/courriers/arrivee',
          outgoing: './uploads/courriers/depart'
        },
        notifications: {
          email: true,
          browser: true,
          urgentOnly: false
        }
      });
      
      setAccessResults({});
      
      addNotification({
        type: 'info',
        title: 'Paramètres restaurés',
        message: 'Les paramètres par défaut ont été restaurés. N\'oubliez pas de sauvegarder.',
        persistent: false
      });
    }
  };

  const testFolderAccess = async (type: 'incoming' | 'outgoing') => {
    const path = settings.storageFolders?.[type] || '';
    
    if (!path) {
      addNotification({
        type: 'warning',
        title: 'Chemin manquant',
        message: 'Veuillez spécifier un chemin de dossier.',
        persistent: false
      });
      return;
    }

    try {
      setTestingAccess(prev => ({ ...prev, [type]: true }));
      setAccessResults(prev => ({ ...prev, [type]: null }));

      // Simulation d'un test d'accès
      setTimeout(() => {
        const isValidPath = path.length > 0 && !path.includes('..') && (path.startsWith('/') || path.startsWith('./') || path.match(/^[A-Za-z]:\\/));
        
        if (isValidPath) {
          setAccessResults(prev => ({ ...prev, [type]: 'success' }));
          addNotification({
            type: 'info',
            title: 'Chemin validé',
            message: `Le chemin "${path}" semble valide. Vérifiez manuellement les permissions d'accès.`,
            persistent: false
          });
        } else {
          setAccessResults(prev => ({ ...prev, [type]: 'error' }));
          addNotification({
            type: 'error',
            title: 'Chemin invalide',
            message: `Le chemin "${path}" ne semble pas valide.`,
            persistent: false
          });
        }
      }, 1000);
    } catch (error) {
      console.error('Erreur lors du test d\'accès:', error);
      setAccessResults(prev => ({ ...prev, [type]: 'error' }));
      addNotification({
        type: 'error',
        title: 'Erreur de test',
        message: 'Impossible de tester l\'accès au dossier.',
        persistent: true
      });
    } finally {
      setTestingAccess(prev => ({ ...prev, [type]: false }));
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'storage', label: 'Stockage', icon: HardDrive },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Settings className="h-5 w-5 text-gray-500 mr-2" />
          Paramètres système
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Restaurer</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save size={16} />
            )}
            <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-gray-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Paramètres généraux</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Renommage automatique</h5>
                      <p className="text-sm text-gray-600">
                        Renommer automatiquement les fichiers selon un format standardisé
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoRename}
                        onChange={(e) => setSettings({
                          ...settings,
                          autoRename: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>

                  {settings.autoRename && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-medium text-blue-900 mb-2">Format de nommage des fichiers</h5>
                          <input
                            type="text"
                            value={settings.fileNamingPattern || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              fileNamingPattern: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder="{type}_{reference}_{date}_{subject}"
                          />
                          <div className="mt-2 text-sm text-blue-700">
                            <p className="font-medium mb-1">Variables disponibles :</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <span><code className="bg-blue-100 px-1 rounded">{'{type}'}</code> - Type (arrivee/depart)</span>
                              <span><code className="bg-blue-100 px-1 rounded">{'{reference}'}</code> - Référence du courrier</span>
                              <span><code className="bg-blue-100 px-1 rounded">{'{date}'}</code> - Date (YYYY-MM-DD)</span>
                              <span><code className="bg-blue-100 px-1 rounded">{'{subject}'}</code> - Objet du courrier</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Storage Tab */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Configuration du stockage local</h4>
                
                <div className="space-y-6">
                  {/* Courriers d'arrivée */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Folder className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Dossier courriers d'arrivée</h5>
                        <p className="text-sm text-gray-600">Emplacement de stockage des scans de courriers reçus</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={settings.storageFolders?.incoming || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            storageFolders: {
                              ...settings.storageFolders!,
                              incoming: e.target.value
                            }
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="./uploads/courriers/arrivee"
                        />
                        <button
                          onClick={() => testFolderAccess('incoming')}
                          disabled={testingAccess.incoming || !settings.storageFolders?.incoming}
                          className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
                          title="Tester l'accès au dossier"
                        >
                          {testingAccess.incoming ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          <span>Test</span>
                        </button>
                      </div>
                      
                      {/* Résultat du test d'accès */}
                      {accessResults.incoming && (
                        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                          accessResults.incoming === 'success' 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          {accessResults.incoming === 'success' ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">
                                Chemin valide
                              </span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-700 font-medium">
                                Chemin invalide
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Courriers de départ */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Folder className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Dossier courriers de départ</h5>
                        <p className="text-sm text-gray-600">Emplacement de stockage des scans de courriers envoyés</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={settings.storageFolders?.outgoing || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            storageFolders: {
                              ...settings.storageFolders!,
                              outgoing: e.target.value
                            }
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="./uploads/courriers/depart"
                        />
                        <button
                          onClick={() => testFolderAccess('outgoing')}
                          disabled={testingAccess.outgoing || !settings.storageFolders?.outgoing}
                          className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
                          title="Tester l'accès au dossier"
                        >
                          {testingAccess.outgoing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          <span>Test</span>
                        </button>
                      </div>
                      
                      {/* Résultat du test d'accès */}
                      {accessResults.outgoing && (
                        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                          accessResults.outgoing === 'success' 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          {accessResults.outgoing === 'success' ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">
                                Chemin valide
                              </span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-700 font-medium">
                                Chemin invalide
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Paramètres de notification</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <h5 className="font-medium text-gray-900">Notifications par email</h5>
                        <p className="text-sm text-gray-600">
                          Recevoir des notifications par email pour les événements importants
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.email}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            email: e.target.checked
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-green-500" />
                      <div>
                        <h5 className="font-medium text-gray-900">Notifications navigateur</h5>
                        <p className="text-sm text-gray-600">
                          Afficher des notifications dans le navigateur
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.browser}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            browser: e.target.checked
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      <div>
                        <h5 className="font-medium text-gray-900">Notifications urgentes uniquement</h5>
                        <p className="text-sm text-gray-600">
                          Ne recevoir que les notifications pour les courriers urgents
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.urgentOnly}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications!,
                            urgentOnly: e.target.checked
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Paramètres de sécurité</h4>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-blue-900">Sécurité MySQL</h5>
                        <p className="text-sm text-blue-700 mt-1">
                          L'authentification et la sécurité des données sont gérées par MySQL.
                          Les mots de passe sont hachés avec bcrypt et l'authentification utilise JWT.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-green-900">Chiffrement des données</h5>
                        <p className="text-sm text-green-700 mt-1">
                          Toutes les données sensibles sont chiffrées et les connexions sécurisées.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Lock className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-yellow-900">Contrôle d'accès</h5>
                        <p className="text-sm text-yellow-700 mt-1">
                          Les permissions sont gérées par rôles (Utilisateur, Manager, Administrateur).
                          Seuls les administrateurs peuvent modifier ces paramètres.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;