import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Tag,
  Download,
  Eye,
  PlaneLanding,
  PlaneTakeoff,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { IncomingMail, OutgoingMail, Category, Tag as TagType, Sender } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

interface SearchResult {
  id: string;
  type: 'incoming' | 'outgoing';
  reference: string;
  subject: string;
  date: Date;
  category?: Category;
  tags: TagType[];
  sender?: Sender;
  priority: string;
  scanUrl?: string;
  summary?: string;
  content?: string;
}

const SearchModule = () => {
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [categoriesSnapshot, tagsSnapshot, sendersSnapshot] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'tags')),
        getDocs(collection(db, 'senders'))
      ]);

      setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      setTags(tagsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TagType)));
      setSenders(sendersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sender)));
    } catch (error) {
      console.error('Erreur lors du chargement des données de référence:', error);
    }
  };

  const performSearch = async () => {
    if (!searchTerm.trim() && !selectedCategory && !selectedPriority && !selectedTags.length && !dateFrom && !dateTo) {
      addNotification({
        type: 'warning',
        title: 'Recherche vide',
        message: 'Veuillez saisir au moins un critère de recherche.',
        persistent: false
      });
      return;
    }

    try {
      setLoading(true);
      const searchResults: SearchResult[] = [];

      // Recherche dans les courriers d'arrivée
      if (searchType === 'all' || searchType === 'incoming') {
        const incomingSnapshot = await getDocs(collection(db, 'incomingMails'));
        const incomingMails = incomingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncomingMail));

        incomingMails.forEach(mail => {
          const category = categories.find(c => c.id === mail.categoryId);
          const sender = senders.find(s => s.id === mail.senderId);
          const mailTags = tags.filter(t => mail.tags.includes(t.id));

          const matchesText = !searchTerm.trim() || 
            mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mail.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (mail.summary && mail.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (sender && sender.name.toLowerCase().includes(searchTerm.toLowerCase()));

          const matchesCategory = !selectedCategory || mail.categoryId === selectedCategory;
          const matchesPriority = !selectedPriority || mail.priority === selectedPriority;
          const matchesTags = selectedTags.length === 0 || selectedTags.some(tagId => mail.tags.includes(tagId));
          
          const mailDate = new Date(mail.arrivalDate);
          const matchesDateFrom = !dateFrom || mailDate >= new Date(dateFrom);
          const matchesDateTo = !dateTo || mailDate <= new Date(dateTo);

          if (matchesText && matchesCategory && matchesPriority && matchesTags && matchesDateFrom && matchesDateTo) {
            searchResults.push({
              id: mail.id,
              type: 'incoming',
              reference: mail.reference,
              subject: mail.subject,
              date: new Date(mail.arrivalDate),
              category,
              tags: mailTags,
              sender,
              priority: mail.priority,
              scanUrl: mail.scanUrl,
              summary: mail.summary
            });
          }
        });
      }

      // Recherche dans les courriers de départ
      if (searchType === 'all' || searchType === 'outgoing') {
        const outgoingSnapshot = await getDocs(collection(db, 'outgoingMails'));
        const outgoingMails = outgoingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OutgoingMail));

        outgoingMails.forEach(mail => {
          const category = categories.find(c => c.id === mail.categoryId);
          const mailTags = tags.filter(t => mail.tags.includes(t.id));

          const matchesText = !searchTerm.trim() || 
            mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mail.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (mail.content && mail.content.toLowerCase().includes(searchTerm.toLowerCase()));

          const matchesCategory = !selectedCategory || mail.categoryId === selectedCategory;
          const matchesPriority = !selectedPriority || mail.priority === selectedPriority;
          const matchesTags = selectedTags.length === 0 || selectedTags.some(tagId => mail.tags.includes(tagId));
          
          const mailDate = new Date(mail.sendDate);
          const matchesDateFrom = !dateFrom || mailDate >= new Date(dateFrom);
          const matchesDateTo = !dateTo || mailDate <= new Date(dateTo);

          if (matchesText && matchesCategory && matchesPriority && matchesTags && matchesDateFrom && matchesDateTo) {
            searchResults.push({
              id: mail.id,
              type: 'outgoing',
              reference: mail.reference,
              subject: mail.subject,
              date: new Date(mail.sendDate),
              category,
              tags: mailTags,
              priority: mail.priority,
              scanUrl: mail.scanUrl,
              content: mail.content
            });
          }
        });
      }

      // Trier par date décroissante
      searchResults.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setResults(searchResults);
      
      addNotification({
        type: 'success',
        title: 'Recherche effectuée',
        message: `${searchResults.length} résultat(s) trouvé(s).`,
        persistent: false
      });

    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de recherche',
        message: 'Une erreur est survenue lors de la recherche.',
        persistent: true
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchType('all');
    setSelectedCategory('');
    setSelectedPriority('');
    setSelectedTags([]);
    setDateFrom('');
    setDateTo('');
    setResults([]);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Search className="h-5 w-5 text-purple-500 mr-2" />
            Recherche de courriers
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center space-x-1"
          >
            <Filter size={16} />
            <span>{showAdvanced ? 'Masquer' : 'Filtres avancés'}</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Basic Search */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher par référence, objet, contenu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tous les courriers</option>
              <option value="incoming">Courriers d'arrivée</option>
              <option value="outgoing">Courriers de départ</option>
            </select>
            <button
              onClick={performSearch}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search size={16} />
              )}
              <span>Rechercher</span>
            </button>
          </div>

          {/* Quick Tag Filters */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtres rapides par tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 text-sm font-medium rounded-full border transition-all duration-200 ${
                      selectedTags.includes(tag.id)
                        ? 'border-purple-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      backgroundColor: selectedTags.includes(tag.id) 
                        ? tag.color + '30' 
                        : tag.color + '10', 
                      color: tag.color 
                    }}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && (
                      <X size={12} className="ml-1 inline" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Toutes les priorités</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">Élevée</option>
                  <option value="normal">Normale</option>
                  <option value="low">Faible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={clearSearch}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Effacer
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Résultats de recherche ({results.length})
            </h3>
            
            <div className="space-y-4">
              {results.map(result => (
                <div key={`${result.type}-${result.id}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-1 rounded-full ${result.type === 'incoming' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {result.type === 'incoming' ? (
                            <PlaneLanding className="h-4 w-4 text-blue-600" />
                          ) : (
                            <PlaneTakeoff className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {result.subject}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${result.type === 'incoming' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {result.type === 'incoming' ? 'Arrivée' : 'Départ'}
                        </span>
                        {result.category && (
                          <span 
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{ 
                              backgroundColor: result.category.color + '20', 
                              color: result.category.color 
                            }}
                          >
                            {result.category.name}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(result.priority)}`}>
                          {getPriorityLabel(result.priority)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <FileText size={16} />
                          <span>Réf: {result.reference}</span>
                        </div>
                        {result.sender && (
                          <div className="flex items-center space-x-1">
                            <User size={16} />
                            <span>{result.sender.name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar size={16} />
                          <span>{result.date.toLocaleDateString('fr-FR')}</span>
                        </div>
                        {result.scanUrl && (
                          <div className="flex items-center space-x-1">
                            <FileText size={16} />
                            <span>Fichier joint</span>
                          </div>
                        )}
                      </div>
                      
                      {(result.summary || result.content) && (
                        <p className="text-gray-700 text-sm mb-2">
                          {result.summary || (result.content && result.content.substring(0, 150) + '...')}
                        </p>
                      )}
                      
                      {result.tags.length > 0 && (
                        <div className="flex items-center space-x-2">
                          {result.tags.map(tag => (
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
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {result.scanUrl && (
                        <a
                          href={result.scanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                          title="Voir le fichier"
                        >
                          <Eye size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && (searchTerm || selectedCategory || selectedPriority || selectedTags.length || dateFrom || dateTo) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
          <p className="text-gray-600">
            Essayez de modifier vos critères de recherche ou d'utiliser des termes différents.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchModule;