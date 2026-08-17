import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';

interface Agency {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const AgenciesPage: React.FC = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  
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

  const fetchAgencies = async () => {
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
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await api.get('/agencies', { params });
      let data: Agency[] = [];
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

      setAgencies(data);
      setTotalPages(pages);
    } catch (err: any) {
      setError('Failed to load agencies.');
      setAgencies([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAgencies();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, sortBy, sortOrder, page, limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const payload = { name, address, city, phone, status };
      if (editingId) {
        await api.put(`/agencies/${editingId}`, payload);
        setSuccessMessage('Agency updated successfully!');
      } else {
        await api.post('/agencies', payload);
        setSuccessMessage('Agency created successfully!');
      }
      
      resetForm();
      await fetchAgencies();

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (agency: Agency) => {
    setEditingId(agency.id);
    setName(agency.name);
    setAddress(agency.address);
    setCity(agency.city);
    setPhone(agency.phone);
    setStatus(agency.status);
    setError('');
    setSuccessMessage('');
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/agencies/${id}`);
      setSuccessMessage('Agency deleted successfully!');
      setDeletingId(null);
      await fetchAgencies();

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to delete agency.');
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAddress('');
    setCity('');
    setPhone('');
    setStatus('ACTIVE');
  };

  // Libellés pour les menus déroulants
  const statusFilterLabels: Record<string, string> = {
    '': 'All Statuses',
    'ACTIVE': 'ACTIVE',
    'INACTIVE': 'INACTIVE'
  };

  const formStatusLabels: Record<string, string> = {
    'ACTIVE': 'ACTIVE',
    'INACTIVE': 'INACTIVE'
  };

  const sortByLabels: Record<string, string> = {
    'name': 'Sort by Name',
    'city': 'Sort by City'
  };

  const sortOrderLabels: Record<string, string> = {
    'ASC': 'Ascending',
    'DESC': 'Descending'
  };

  return (
    <div className="space-y-8 relative">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Agencies</h2>
        <p className="text-slate-600">Manage company branches, locations, and operational status.</p>
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
            {editingId ? 'Edit Agency' : 'Add New Agency'}
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
                maxLength={50}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please fill out this field.')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="Central Agency..." 
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Address</label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                required 
                maxLength={100}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please fill out this field.')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="123 Main Street..." 
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">City</label>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                required 
                maxLength={50}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please fill out this field.')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="Antananarivo..." 
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Phone</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
                maxLength={20}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please fill out this field.')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="+261 34 00 000 00..." 
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
              />
            </div>

            {/* Form Status Custom Dropdown */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Status</label>
              <div className="relative custom-dropdown">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formStatus' ? null : 'formStatus')}
                  className="w-full flex items-center justify-between bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left cursor-pointer"
                >
                  <span className="font-medium">{formStatusLabels[status]}</span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'formStatus' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeDropdown === 'formStatus' && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                    {Object.entries(formStatusLabels).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { setStatus(val as 'ACTIVE' | 'INACTIVE'); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${status === val ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {label}
                        {status === val && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving...' : (editingId ? 'Update Agency' : 'Create Agency')}
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
          <h3 className="text-lg font-semibold text-slate-800">Existing Agencies</h3>
          
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

            {/* Status Filter Custom Dropdown */}
            <div className="relative custom-dropdown">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'filterStatus' ? null : 'filterStatus')}
                className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs text-left cursor-pointer"
              >
                <span className="font-medium">{statusFilterLabels[statusFilter]}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'filterStatus' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {activeDropdown === 'filterStatus' && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                  {Object.entries(statusFilterLabels).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setStatusFilter(val); setPage(1); setActiveDropdown(null); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${statusFilter === val ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {label}
                      {statusFilter === val && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                    </button>
                  ))}
                </div>
              )}
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
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loadingList ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">Loading agencies...</td>
                  </tr>
                ) : agencies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No matching agencies found.
                    </td>
                  </tr>
                ) : (
                  agencies.map((agency) => (
                    <tr key={agency.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{agency.name}</td>
                      <td className="py-3 px-4 text-slate-500">{agency.address}</td>
                      <td className="py-3 px-4 text-slate-500">{agency.city}</td>
                      <td className="py-3 px-4 text-slate-500">{agency.phone}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${agency.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {agency.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {deletingId === agency.id ? (
                          <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-xl border border-red-200 shadow-sm">
                            <span className="text-xs text-red-700 font-semibold px-1">Delete?</span>
                            <button 
                              onClick={() => confirmDelete(agency.id)} 
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
                              onClick={() => handleEdit(agency)} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => setDeletingId(agency.id)} 
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