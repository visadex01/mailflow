import React, { useState, useEffect } from 'react';
import { Plus, Upload, Calendar, User, FileText, Tag, Search, Eye, Edit, Trash2, Download, AlertCircle, CheckCircle, Clock, X, PlaneLanding, Phone, Fax, Cloud, FileCheck, Sparkles, Loader } from 'lucide-react';
import { DatabaseService } from '../../services/DatabaseService';
import { IncomingMail, Category, Tag as TagType, Sender } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

const IncomingMailComponent = () => {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const [mails, setMails] = useState<IncomingMail[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMail, setEditingMail] = useState<IncomingMail | null>(null);
  
  const [formData, setFormData] = useState({
    reference: '',
    subject: '',
    summary: '',
    categoryId: '',
    senderName: '',
    senderEmail: '',
    senderFax: '',
    selectedTags: [] as string[],
    arrivalDate: new Date().toISOString().split('T')[0],
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    scanFile: null as File | null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mailsData, categoriesData, tagsData, sendersData] = await Promise.all([
        DatabaseService.getIncomingMails(),
        DatabaseService.getCategories(),
        DatabaseService.getTags(),
        DatabaseService.getSenders()
      ]);

      setMails(mailsData);
      setCategories(categoriesData);
      setTags(tagsData);
      setSenders(sendersData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les données des courriers.',
        persistent: true
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateSender = async (): Promise<string> => {
    try {
      // Chercher un expéditeur existant
      const existingSender = senders.find(s => 
        s.email === formData.senderEmail && formData.senderEmail ||
        s.name.toLowerCase() === formData.senderName.toLowerCase()
      );
      
      if (existingSender) {
        // Mettre à jour l'expéditeur existant
        await DatabaseService.updateSender(existingSender.id, {
          name: formData.senderName,
          email: formData.senderEmail || '',
          fax: formData.senderFax || ''
        });
        return existingSender.id;
      } else {
        // Créer un nouvel expéditeur
        const senderId = await DatabaseService.createSender({
          name: formData.senderName,
          email: formData.senderEmail || '',
          fax: formData.senderFax || '',
          createdBy: currentUser!.id
        });
        return senderId;
      }
    } catch (error) {
      console.error('Erreur lors de la gestion de l\'expéditeur:', error);
      throw new Error('Impossible de créer ou mettre à jour l\'expéditeur');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.reference.trim()) {
      addNotification({
        type: 'error',
        title: 'Champ requis',
        message: 'La référence est obligatoire.',
        persistent: false
      });
      return false;
    }

    if (!formData.subject.trim()) {
      addNotification({
        type: 'error',
        title: 'Champ requis',
        message: 'L\'objet est obligatoire.',
        persistent: false
      });
      return false;
    }

    if (!formData.senderName.trim()) {
      addNotification({
        type: 'error',
        title: 'Champ requis',
        message: 'Le nom de l\'expéditeur est obligatoire.',
        persistent: false
      });
      return false;
    }

    if (!formData.categoryId) {
      addNotification({
        type: 'error',
        title: 'Champ requis',
        message: 'La catégorie est obligatoire.',
        persistent: false
      });
      return false;
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

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Créer ou mettre à jour l'expéditeur
      const senderId = await createOrUpdateSender();

      // Préparer les données du courrier
      const mailData = {
        reference: formData.reference.trim(),
        subject: formData.subject.trim(),
        summary: formData.summary.trim() || '',
        categoryId: formData.categoryId,
        senderId: senderId,
        tags: formData.selectedTags,
        arrivalDate: new Date(formData.arrivalDate),
        priority: formData.priority,
        scanUrl: '', // TODO: Gérer l'upload de fichier
        createdBy: currentUser.id
      };

      if (editingMail) {
        await DatabaseService.updateIncomingMail(editingMail.id, mailData);
        addNotification({
          type: 'success',
          title: 'Courrier modifié',
          message: `Le courrier "${formData.subject}" a été mis à jour avec succès.`,
          persistent: false
        });
      } else {
        await DatabaseService.createIncomingMail(mailData);
        addNotification({
          type: 'success',
          title: 'Courrier ajouté',
          message: `Le courrier "${formData.subject}" a été enregistré avec succès.`,
          persistent: false
        });
      }

      setShowForm(false);
      setEditingMail(null);
      resetForm();
      await loadData();

    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement:', error);
      addNotification({
        type: 'error',
        title: 'Erreur d\'enregistrement',
        message: error.message || 'Impossible d\'enregistrer le courrier. Veuillez réessayer.',
        persistent: true
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (mail: IncomingMail) => {
    const sender = senders.find(s => s.id === mail.senderId);
    setFormData({
      reference: mail.reference,
      subject: mail.subject,
      summary: mail.summary || '',
      categoryId: mail.categoryId,
      senderName: sender?.name || '',
      senderEmail: sender?.email || '',
      senderFax: sender?.fax || '',
      selectedTags: mail.tags,
      arrivalDate: new Date(mail.arrivalDate).toISOString().split('T')[0],
      priority: mail.priority,
      scanFile: null
    });
    setEditingMail(mail);
    setShowForm(true);
  };

  const handleDelete = async (mailId: string, subject: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le courrier "${subject}" ?`)) {
      return;
    }

    try {
      await DatabaseService.deleteIncomingMail(mailId);
      addNotification({
        type: 'success',
        title: 'Courrier supprimé',
        message: `Le courrier "${subject}" a été supprimé avec succès.`,
        persistent: false
      });
      loadData();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de suppression',
        message: 'Impossible de supprimer le courrier.',
        persistent: true
      });
    }
  };

  const resetForm = () => {
    setFormData({
      reference: '',
      subject: '',
      summary: '',
      categoryId: '',
      senderName: '',
      senderEmail: '',
      senderFax: '',
      selectedTags: [],
      arrivalDate: new Date().toISOString().split('T')[0],
      priority: 'normal',
      scanFile: null
    });
  };

  const filteredMails = mails.filter(mail => {
    const matchesSearch = mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mail.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || mail.categoryId === selectedCategory;
    const matchesPriority = !selectedPriority || mail.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Élevée';
      case 'normal': return 'Normale';
      case 'low': return 'Faible';
      default: return 'Normale';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un courrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80 bg-white shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          >
            <option value="">Toutes les priorités</option>
            <option value="urgent">Urgent</option>
            <option value="high">Élevée</option>
            <option value="normal">Normale</option>
            <option value="low">Faible</option>
          </select>
        </div>

        <button
          onClick={() => {
            setEditingMail(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus size={20} />
          <span>Nouveau courrier</span>
        </button>
      </div>

      {/* Mail List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PlaneLanding className="h-5 w-5 text-blue-500 mr-2" />
            Courriers d'arrivée ({filteredMails.length})
          </h3>
          
          {filteredMails.length === 0 ? (
            <div className="text-center py-12">
              <PlaneLanding className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun courrier trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMails.map(mail => {
                const category = categories.find(c => c.id === mail.categoryId);
                const sender = senders.find(s => s.id === mail.senderId);
                
                return (
                  <div key={mail.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {mail.subject}
                          </h4>
                          {category && (
                            <span 
                              className="px-2 py-1 text-xs font-medium rounded-full"
                              style={{ 
                                backgroundColor: category.color + '20', 
                                color: category.color 
                              }}
                            >
                              {category.name}
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(mail.priority)}`}>
                            {getPriorityLabel(mail.priority)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <FileText size={16} />
                            <span>Réf: {mail.reference}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User size={16} />
                            <span>{sender?.name || 'Expéditeur inconnu'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar size={16} />
                            <span>{new Date(mail.arrivalDate).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {mail.scanUrl && (
                            <div className="flex items-center space-x-1">
                              <FileCheck size={16} className="text-green-500" />
                              <span className="text-green-600">Fichier joint</span>
                            </div>
                          )}
                        </div>
                        
                        {mail.summary && (
                          <p className="text-gray-700 text-sm mb-2">{mail.summary}</p>
                        )}
                        
                        {mail.tags.length > 0 && (
                          <div className="flex items-center space-x-2">
                            {mail.tags.map(tagId => {
                              const tag = tags.find(t => t.id === tagId);
                              return tag ? (
                                <span
                                  key={tag.id}
                                  className="px-2 py-1 text-xs font-medium rounded-full"
                                  style={{ 
                                    backgroundColor: tag.color + '20', 
                                    color: tag.color 
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {mail.scanUrl && (
                          <a
                            href={mail.scanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                            title="Voir le fichier"
                          >
                            <Eye size={16} />
                          </a>
                        )}
                        <button 
                          onClick={() => handleEdit(mail)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(mail.id, mail.subject)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Mail Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <PlaneLanding className="h-5 w-5 text-blue-500 mr-2" />
                  {editingMail ? 'Modifier le courrier' : 'Nouveau courrier d\'arrivée'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingMail(null);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Référence *
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'arrivée *
                  </label>
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objet *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'expéditeur *
                </label>
                <input
                  type="text"
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de l'expéditeur
                  </label>
                  <input
                    type="email"
                    value={formData.senderEmail}
                    onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemple.com"
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fax de l'expéditeur
                  </label>
                  <input
                    type="tel"
                    value={formData.senderFax}
                    onChange={(e) => setFormData({ ...formData, senderFax: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+33 1 23 45 67 89"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={saving}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={saving}
                  >
                    <option value="low">Faible</option>
                    <option value="normal">Normale</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    {tags.map(tag => (
                      <label key={tag.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white rounded p-1 transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={formData.selectedTags.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                selectedTags: [...formData.selectedTags, tag.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selectedTags: formData.selectedTags.filter(id => id !== tag.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={saving}
                        />
                        <span 
                          className="text-sm px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: tag.color + '20', 
                            color: tag.color 
                          }}
                        >
                          {tag.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Résumé
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Résumé du contenu du courrier..."
                  disabled={saving}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMail(null);
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
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader className="animate-spin h-4 w-4" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>{editingMail ? 'Modifier' : 'Enregistrer'}</span>
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

export default IncomingMailComponent;