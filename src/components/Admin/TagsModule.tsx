import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  X, 
  CheckCircle
} from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Tag as TagType } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

const TagsModule = () => {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  const [tags, setTags] = useState<TagType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'nature' | 'priority' | 'status'>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'nature' as 'nature' | 'priority' | 'status',
    color: '#3B82F6'
  });

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const tagTypes = {
    nature: 'Nature',
    priority: 'Priorité',
    status: 'Statut'
  };

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'tags'));
      setTags(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TagType)));
    } catch (error) {
      console.error('Erreur lors du chargement des tags:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les tags.',
        persistent: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const tagData = {
        name: formData.name,
        type: formData.type,
        color: formData.color,
        createdAt: new Date(),
        createdBy: currentUser.id,
        isActive: true
      };

      if (editingTag) {
        // Mise à jour
        await updateDoc(doc(db, 'tags', editingTag.id), tagData);
        addNotification({
          type: 'success',
          title: 'Tag modifié',
          message: `Le tag "${formData.name}" a été mis à jour avec succès.`,
          persistent: false
        });
      } else {
        // Création
        await addDoc(collection(db, 'tags'), tagData);
        addNotification({
          type: 'success',
          title: 'Tag créé',
          message: `Le tag "${formData.name}" a été créé avec succès.`,
          persistent: false
        });
      }

      setShowForm(false);
      setEditingTag(null);
      resetForm();
      loadTags();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du tag:', error);
      addNotification({
        type: 'error',
        title: 'Erreur d\'enregistrement',
        message: 'Impossible d\'enregistrer le tag. Veuillez réessayer.',
        persistent: true
      });
    }
  };

  const handleEdit = (tag: TagType) => {
    setFormData({
      name: tag.name,
      type: tag.type,
      color: tag.color
    });
    setEditingTag(tag);
    setShowForm(true);
  };

  const handleDelete = async (tagId: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le tag "${name}" ?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'tags', tagId));
      addNotification({
        type: 'success',
        title: 'Tag supprimé',
        message: `Le tag "${name}" a été supprimé avec succès.`,
        persistent: false
      });
      loadTags();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de suppression',
        message: 'Impossible de supprimer le tag.',
        persistent: true
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'nature',
      color: '#3B82F6'
    });
  };

  const filteredTags = selectedType === 'all' ? tags : tags.filter(tag => tag.type === selectedType);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Tag className="h-5 w-5 text-purple-500 mr-2" />
            Gestion des tags ({filteredTags.length})
          </h3>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value="nature">Nature</option>
            <option value="priority">Priorité</option>
            <option value="status">Statut</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditingTag(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus size={20} />
          <span>Nouveau tag</span>
        </button>
      </div>

      {/* Tags by Type */}
      {Object.entries(tagTypes).map(([type, label]) => {
        const typeTags = tags.filter(tag => tag.type === type);
        if (selectedType !== 'all' && selectedType !== type) return null;
        if (typeTags.length === 0) return null;

        return (
          <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="h-4 w-4 text-purple-500 mr-2" />
              {label} ({typeTags.length})
            </h4>
            <div className="flex flex-wrap gap-3">
              {typeTags.map(tag => (
                <div 
                  key={tag.id} 
                  className="flex items-center space-x-2 px-3 py-2 rounded-full border border-gray-200 hover:shadow-sm transition-shadow duration-200 group"
                  style={{ backgroundColor: tag.color + '10' }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: tag.color }}
                  >
                    {tag.name}
                  </span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => handleEdit(tag)}
                      className="p-1 text-gray-600 hover:text-purple-600 rounded transition-colors duration-200"
                      title="Modifier"
                    >
                      <Edit size={12} />
                    </button>
                    <button 
                      onClick={() => handleDelete(tag.id, tag.name)}
                      className="p-1 text-gray-600 hover:text-red-600 rounded transition-colors duration-200"
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun tag créé</p>
        </div>
      )}

      {/* Add/Edit Tag Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Tag className="h-5 w-5 text-purple-500 mr-2" />
                  {editingTag ? 'Modifier le tag' : 'Nouveau tag'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTag(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du tag *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  placeholder="Ex: Urgent, Confidentiel, En cours..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de tag *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="nature">Nature</option>
                  <option value="priority">Priorité</option>
                  <option value="status">Statut</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur *
                </label>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Preview */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
                <div 
                  className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: formData.color + '20', color: formData.color }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: formData.color }}
                  ></div>
                  <span>{formData.name || 'Nom du tag'}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTag(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>{editingTag ? 'Modifier' : 'Créer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagsModule;