import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';

interface Category {
  id: number;
  name: string;
  description: string;
  dailyRate: number;
}

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDailyRate, setMaxDailyRate] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // État pour gérer l'ouverture des menus déroulants personnalisés
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Fermer les dropdowns si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.custom-dropdown')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    setLoadingList(true);
    try {
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (maxDailyRate !== '') {
        params.maxDailyRate = parseFloat(maxDailyRate);
      }

      const response = await api.get('/categories', { params });
      let data: Category[] = [];
      let pages = 1;

      const resData = response.data;
      if (Array.isArray(resData)) {
        data = resData;
      } else if (resData && Array.isArray(resData.data)) {
        data = resData.data;
        if (resData.totalPages) pages = resData.totalPages;
      } else if (resData && Array.isArray(resData['hydra:member'])) {
        data = resData['hydra:member'];
      } else if (resData && Array.isArray(resData.items)) {
        data = resData.items;
        if (resData.totalPages) pages = resData.totalPages;
        else if (resData.meta?.totalPages) pages = resData.meta.totalPages;
      }

      setCategories(data);
      setTotalPages(pages);
    } catch (err: any) {
      setError('Failed to load categories.');
      setCategories([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, maxDailyRate, sortBy, sortOrder, page, limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { 
          name, 
          description, 
          dailyRate: parseFloat(dailyRate) 
        });
        setSuccessMessage('Category updated successfully!');
      } else {
        await api.post('/categories', { 
          name, 
          description, 
          dailyRate: parseFloat(dailyRate) 
        });
        setSuccessMessage('Category created successfully!');
      }
      
      resetForm();
      await fetchCategories();

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description);
    setDailyRate(cat.dailyRate.toString());
    setError('');
    setSuccessMessage('');
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      setSuccessMessage('Category deleted successfully!');
      setDeletingId(null);
      await fetchCategories();

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to delete category.');
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setDailyRate('');
  };

  // Libellés pour les menus déroulants de tri
  const sortByLabels: Record<string, string> = {
    'name': 'Sort by Name',
    'dailyRate': 'Sort by Rate'
  };

  const sortOrderLabels: Record<string, string> = {
    'ASC': 'Ascending',
    'DESC': 'Descending'
  };

  return (
    <div className="space-y-8 relative">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Vehicle Categories</h2>
        <p className="text-slate-600">Manage types of vehicles and their daily rental rates.</p>
      </div>

      {successMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-sm transition-all animate-bounce">
          <span className="text-emerald-400 text-lg">✅</span>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {editingId ? 'Edit Category' : 'Add New Category'}
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-sm flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold ml-2">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please fill out this field.')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="SUV, Sedan..." 
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                onInvalid={(e) => (e.target as HTMLTextAreaElement).setCustomValidity('Please fill out this field.')}
                onInput={(e) => (e.target as HTMLTextAreaElement).setCustomValidity('')}
                rows={3} 
                placeholder="Short description..." 
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs resize-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Daily Rate ($)</label>
              <input 
                type="number" 
                step="0.01" 
                value={dailyRate} 
                onChange={(e) => setDailyRate(e.target.value)} 
                required 
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please fill out this field.')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="50.00" 
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving...' : (editingId ? 'Update Category' : 'Create Category')}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Existing Categories</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 items-center">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search..." 
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div>
              <input 
                type="number" 
                step="10"
                value={maxDailyRate}
                onChange={(e) => { setMaxDailyRate(e.target.value); setPage(1); }}
                placeholder="Max Rate ($)" 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
              />
            </div>

            {/* Sort By Custom Dropdown */}
            <div className="relative custom-dropdown">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'filterSort' ? null : 'filterSort')}
                className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs text-left cursor-pointer"
              >
                <span className="font-medium">{sortByLabels[sortBy]}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'filterSort' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {activeDropdown === 'filterSort' && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                  {Object.entries(sortByLabels).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setSortBy(val); setActiveDropdown(null); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${sortBy === val ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {label}
                      {sortBy === val && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Order Custom Dropdown */}
            <div className="relative custom-dropdown">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'filterOrder' ? null : 'filterOrder')}
                className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs text-left cursor-pointer"
              >
                <span className="font-medium">{sortOrderLabels[sortOrder]}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'filterOrder' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {activeDropdown === 'filterOrder' && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                  {Object.entries(sortOrderLabels).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setSortOrder(val as 'ASC' | 'DESC'); setActiveDropdown(null); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${sortOrder === val ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {label}
                      {sortOrder === val && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Daily Rate</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loadingList ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">Loading categories...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No matching categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{cat.name}</td>
                      <td className="py-3 px-4 text-slate-500">{cat.description}</td>
                      <td className="py-3 px-4 font-medium text-purple-600">${cat.dailyRate}</td>
                      <td className="py-3 px-4">
                        {deletingId === cat.id ? (
                          <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-xl border border-red-200 shadow-sm">
                            <span className="text-xs text-red-700 font-semibold px-1">Delete?</span>
                            <button 
                              onClick={() => confirmDelete(cat.id)} 
                              className="px-2.5 py-1 bg-red-600 text-white text-xs rounded-lg font-medium hover:bg-red-700 transition shadow-sm cursor-pointer"
                            >
                              Yes
                            </button>
                            <button 
                              onClick={() => setDeletingId(null)} 
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg font-medium hover:bg-slate-300 transition cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEdit(cat)} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => setDeletingId(cat.id)} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};