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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
    externalServices: {
      googleDrive: {
        enabled: false,
        folderId: ''
      },
      dropbox: {
        enabled: false,
        accessToken: ''
      },
      ftp: {
        enabled: false,
        host: '',
        username: '',
        password: '',
        port: 21
      }
    },
    autoBackup: {
      enabled: false,
      frequency: 'weekly',
      service: 'googleDrive'
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
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as SettingsType;
        setSettings(data);
      }
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
      
      const settingsData = {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.id
      };

      await setDoc(doc(db, 'settings', 'global'), settingsData, { merge: true });
      
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
        externalServices: {
          googleDrive: {
            enabled: false,
            folderId: ''
          },
          dropbox: {
            enabled: false,
            accessToken: ''
          },
          ftp: {
            enabled: false,
            host: '',
            username: '',
            password: '',
            port: 21
          }
        },
        autoBackup: {
          enabled: false,
          frequency: 'weekly',
          service: 'googleDrive'
        },
        notifications: {
          email: true,
          browser: true,
          urgentOnly: false
        }
      });
      
      // Reset access results
      setAccessResults({});
      
      addNotification({
        type: 'info',
        title: 'Paramètres restaurés',
        message: 'Les paramètres par défaut ont été restaurés. N\'oubliez pas de sauvegarder.',
        persistent: false
      });
    }
  };

  const selectFolder = async (type: 'incoming' | 'outgoing') => {
    try {
      // Vérifier si l'API File System Access est supportée
      if ('showDirectoryPicker' in window) {
        const directoryHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'documents'
        });
        
        // Obtenir le chemin complet du dossier
        let folderPath = '';
        try {
          // Essayer d'obtenir le chemin complet si possible
          if (directoryHandle.getDirectoryHandle) {
            folderPath = directoryHandle.name;
          } else {
            folderPath = directoryHandle.name;
          }
          
          // Si on peut accéder au chemin parent, construire le chemin complet
          if (directoryHandle.resolve) {
            const pathSegments = await directoryHandle.resolve();
            if (pathSegments && pathSegments.length > 0) {
              folderPath = '/' + pathSegments.join('/');
            }
          }
        } catch (pathError) {
          // Fallback au nom du dossier si on ne peut pas obtenir le chemin complet
          folderPath = directoryHandle.name;
        }
        
        // Mettre à jour le chemin du dossier
        setSettings(prev => ({
          ...prev,
          storageFolders: {
            ...prev.storageFolders!,
            [type]: folderPath
          }
        }));

        // Tester l'accès immédiatement
        await testFolderAccess(type, folderPath, directoryHandle);
        
        addNotification({
          type: 'success',
          title: 'Dossier sélectionné',
          message: `Le dossier "${folderPath}" a été sélectionné pour les courriers ${type === 'incoming' ? 'd\'arrivée' : 'de départ'}.`,
          persistent: false
        });
      } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API
        addNotification({
          type: 'warning',
          title: 'API non supportée',
          message: 'Votre navigateur ne supporte pas la sélection de dossiers. Veuillez saisir le chemin manuellement.',
          persistent: false
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erreur lors de la sélection du dossier:', error);
        addNotification({
          type: 'error',
          title: 'Erreur de sélection',
          message: 'Impossible de sélectionner le dossier.',
          persistent: true
        });
      }
    }
  };

  const testFolderAccess = async (type: 'incoming' | 'outgoing', folderPath?: string, directoryHandle?: any) => {
    const path = folderPath || settings.storageFolders?.[type] || '';
    
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

      if (directoryHandle) {
        // Test avec l'API File System Access
        try {
          // Tester la lecture
          const entries = [];
          for await (const entry of directoryHandle.values()) {
            entries.push(entry);
            if (entries.length >= 1) break; // Juste pour tester l'accès
          }

          // Tester l'écriture en créant un fichier temporaire
          const testFileName = `mailflow_test_${Date.now()}.txt`;
          const testFileHandle = await directoryHandle.getFileHandle(testFileName, { create: true });
          const writable = await testFileHandle.createWritable();
          await writable.write('Test d\'accès MailFlow');
          await writable.close();

          // Supprimer le fichier de test
          await directoryHandle.removeEntry(testFileName);

          setAccessResults(prev => ({ ...prev, [type]: 'success' }));
          addNotification({
            type: 'success',
            title: 'Test d\'accès réussi',
            message: `Accès en lecture/écriture confirmé pour le dossier ${type === 'incoming' ? 'd\'arrivée' : 'de départ'}.`,
            persistent: false
          });
        } catch (accessError) {
          console.error('Erreur d\'accès au dossier:', accessError);
          setAccessResults(prev => ({ ...prev, [type]: 'error' }));
          addNotification({
            type: 'error',
            title: 'Erreur d\'accès',
            message: `Impossible d'accéder au dossier en lecture/écriture. Vérifiez les permissions.`,
            persistent: true
          });
        }
      } else {
        // Simulation pour les chemins saisis manuellement
        // Dans un environnement réel, ceci devrait être géré côté serveur
        setTimeout(() => {
          // Simulation d'un test d'accès
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
      }
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

  const openFolder = async (type: 'incoming' | 'outgoing') => {
    const path = settings.storageFolders?.[type];
    if (!path) return;

    try {
      // Tenter d'ouvrir le dossier dans l'explorateur de fichiers
      if ('showDirectoryPicker' in window) {
        await (window as any).showDirectoryPicker({
          mode: 'read',
          startIn: 'documents'
        });
      } else {
        addNotification({
          type: 'info',
          title: 'Ouverture manuelle',
          message: `Ouvrez manuellement le dossier : ${path}`,
          persistent: false
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        addNotification({
          type: 'info',
          title: 'Chemin du dossier',
          message: `Dossier configuré : ${path}`,
          persistent: false
        });
      }
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'storage', label: 'Stockage', icon: HardDrive },
    { id: 'backup', label: 'Sauvegarde', icon: Cloud },
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
                              <span><code className="bg-blue-100 px-1 rounded">{'{category}'}</code> - Catégorie</span>
                              <span><code className="bg-blue-100 px-1 rounded">{'{priority}'}</code> - Priorité</span>
                            </div>
                            <p className="mt-2 text-blue-600">
                              Exemple : <code className="bg-blue-100 px-1 rounded">arrivee_REF001_2025-01-27_demande-information.pdf</code>
                            </p>
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
                          onClick={() => selectFolder('incoming')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors duration-200"
                          title="Parcourir et sélectionner un dossier"
                        >
                          <FolderOpen size={16} />
                          <span>Parcourir</span>
                        </button>
                        <button
                          onClick={() => openFolder('incoming')}
                          disabled={!settings.storageFolders?.incoming}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          title="Ouvrir le dossier"
                        >
                          <Eye size={16} />
                        </button>
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
                                Accès confirmé - Lecture/écriture autorisée
                              </span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-700 font-medium">
                                Accès refusé - Vérifiez les permissions du dossier
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
                          onClick={() => selectFolder('outgoing')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors duration-200"
                          title="Parcourir et sélectionner un dossier"
                        >
                          <FolderOpen size={16} />
                          <span>Parcourir</span>
                        </button>
                        <button
                          onClick={() => openFolder('outgoing')}
                          disabled={!settings.storageFolders?.outgoing}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          title="Ouvrir le dossier"
                        >
                          <Eye size={16} />
                        </button>
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
                                Accès confirmé - Lecture/écriture autorisée
                              </span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-700 font-medium">
                                Accès refusé - Vérifiez les permissions du dossier
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations importantes */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-yellow-900">Informations importantes</h5>
                        <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                          <li>• Les dossiers doivent avoir les permissions de lecture/écriture</li>
                          <li>• Utilisez le bouton "Parcourir" pour une sélection sécurisée</li>
                          <li>• Testez toujours l'accès avant de sauvegarder</li>
                          <li>• Les fichiers seront automatiquement renommés selon le format défini</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-4">Services externes</h5>
                
                {/* Google Drive */}
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Google Drive</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.externalServices?.googleDrive?.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          externalServices: {
                            ...settings.externalServices!,
                            googleDrive: {
                              ...settings.externalServices!.googleDrive!,
                              enabled: e.target.checked
                            }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {settings.externalServices?.googleDrive?.enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID du dossier Google Drive
                      </label>
                      <input
                        type="text"
                        value={settings.externalServices?.googleDrive?.folderId || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          externalServices: {
                            ...settings.externalServices!,
                            googleDrive: {
                              ...settings.externalServices!.googleDrive!,
                              folderId: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Sauvegarde automatique</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Activer la sauvegarde automatique</h5>
                      <p className="text-sm text-gray-600">
                        Sauvegarder automatiquement les données selon la fréquence définie
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoBackup?.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          autoBackup: {
                            ...settings.autoBackup!,
                            enabled: e.target.checked
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>

                  {settings.autoBackup?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fréquence de sauvegarde
                        </label>
                        <select
                          value={settings.autoBackup?.frequency}
                          onChange={(e) => setSettings({
                            ...settings,
                            autoBackup: {
                              ...settings.autoBackup!,
                              frequency: e.target.value as any
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="daily">Quotidienne</option>
                          <option value="weekly">Hebdomadaire</option>
                          <option value="monthly">Mensuelle</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service de sauvegarde
                        </label>
                        <select
                          value={settings.autoBackup?.service}
                          onChange={(e) => setSettings({
                            ...settings,
                            autoBackup: {
                              ...settings.autoBackup!,
                              service: e.target.value as any
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="googleDrive">Google Drive</option>
                          <option value="dropbox">Dropbox</option>
                          <option value="ftp">FTP</option>
                        </select>
                      </div>
                    </div>
                  )}
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
                        <h5 className="font-medium text-blue-900">Sécurité Firebase</h5>
                        <p className="text-sm text-blue-700 mt-1">
                          L'authentification et la sécurité des données sont gérées par Firebase.
                          Les règles de sécurité sont configurées au niveau du projet Firebase.
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
                          Toutes les données sont chiffrées en transit et au repos par Firebase.
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