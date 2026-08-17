import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  mileage: number;
  status: string;
  agencyId: string;
  categoryId: string;
}

interface Agency {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('brand');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [status, setStatus] = useState('AVAILABLE');
  const [agencyId, setAgencyId] = useState('');
  const [categoryId, setCategoryId] = useState('');

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

  const fetchData = async () => {
    setLoadingList(true);
    try {
      const params: any = { page, limit, sortBy, sortOrder };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;

      const [vehicleRes, agencyRes, categoryRes] = await Promise.all([
        api.get('/vehicles', { params }),
        api.get('/agencies').catch(() => ({ data: [] })),
        api.get('/categories').catch(() => ({ data: [] }))
      ]);

      let data: Vehicle[] = [];
      let pages = 1;
      const resData = vehicleRes.data;

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

      setVehicles(data);
      setTotalPages(pages);

      const parseList = (res: any) => {
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray(raw.data)) return raw.data;
        if (raw && Array.isArray(raw['hydra:member'])) return raw['hydra:member'];
        if (raw && Array.isArray(raw.items)) return raw.items;
        return [];
      };

      setAgencies(parseList(agencyRes));
      setCategories(parseList(categoryRes));

    } catch (err: any) {
      setError('Failed to load vehicles data.');
      setVehicles([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, sortBy, sortOrder, page, limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const payload = {
        brand,
        model,
        licensePlate,
        mileage: mileage ? Number(mileage) : 0,
        status,
        agencyId,
        categoryId,
      };

      if (editingId) {
        await api.put(`/vehicles/${editingId}`, payload);
        setSuccessMessage('Vehicle updated successfully!');
      } else {
        await api.post('/vehicles', payload);
        setSuccessMessage('Vehicle created successfully!');
      }

      resetForm();
      await fetchData();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setLicensePlate(vehicle.licensePlate);
    setMileage(vehicle.mileage ? vehicle.mileage.toString() : '');
    setStatus(vehicle.status);
    setAgencyId(String(vehicle.agencyId || ''));
    setCategoryId(String(vehicle.categoryId || ''));
    setShowForm(true);
    setError('');
    setSuccessMessage('');
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/vehicles/${id}`);
      setSuccessMessage('Vehicle deleted successfully!');
      setDeletingId(null);
      await fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete vehicle.');
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setBrand('');
    setModel('');
    setLicensePlate('');
    setMileage('');
    setStatus('AVAILABLE');
    setAgencyId('');
    setCategoryId('');
    setShowForm(false);
  };

  const statusLabels: Record<string, string> = {
    '': 'All Statuses',
    'AVAILABLE': 'AVAILABLE',
    'RENTED': 'RENTED',
    'MAINTENANCE': 'MAINTENANCE'
  };

  const sortByLabels: Record<string, string> = {
    'brand': 'Sort by Brand',
    'mileage': 'Sort by Mileage'
  };

  const sortOrderLabels: Record<string, string> = {
    'ASC': 'Ascending',
    'DESC': 'Descending'
  };

  const selectedAgencyName = agencies.find(a => String(a.id) === String(agencyId))?.name || 'Select Agency...';
  const selectedCategoryName = categories.find(c => String(c.id) === String(categoryId))?.name || 'Select Category...';

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vehicles Management</h2>
          <p className="text-slate-600">Manage your fleet, specifications, and availability status.</p>
        </div>
        
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <span>+</span> New Vehicle
          </button>
        )}
      </div>

      {successMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-sm transition-all animate-bounce">
          <span className="text-emerald-400 text-lg">✅</span>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-lg font-semibold text-slate-800">
              {editingId ? 'Edit Vehicle' : 'New Vehicle'}
            </h3>
            <button 
              onClick={resetForm} 
              className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Brand</label>
                <input 
                  type="text" 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)} 
                  required 
                  placeholder="e.g. Toyota" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Model</label>
                <input 
                  type="text" 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)} 
                  required 
                  placeholder="e.g. Corolla" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">License Plate</label>
                <input 
                  type="text" 
                  value={licensePlate} 
                  onChange={(e) => setLicensePlate(e.target.value)} 
                  required 
                  placeholder="e.g. AB-123-CD" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Mileage (km)</label>
                <input 
                  type="number" 
                  value={mileage} 
                  onChange={(e) => setMileage(e.target.value)} 
                  required 
                  placeholder="e.g. 15000" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status Dropdown */}
              <div className="relative custom-dropdown">
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Status</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formStatus' ? null : 'formStatus')}
                  className="w-full flex items-center justify-between bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-100/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left"
                >
                  <span className="font-medium">{status}</span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'formStatus' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeDropdown === 'formStatus' && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                    {['AVAILABLE', 'RENTED', 'MAINTENANCE'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setStatus(s); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${status === s ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {s}
                        {status === s && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Agency Dropdown */}
              <div className="relative custom-dropdown">
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Agency</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formAgency' ? null : 'formAgency')}
                  className="w-full flex items-center justify-between bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-100/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left"
                >
                  <span className={`font-medium ${!agencyId ? 'text-slate-400' : ''}`}>{selectedAgencyName}</span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'formAgency' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeDropdown === 'formAgency' && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setAgencyId(''); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-50"
                    >
                      Select Agency...
                    </button>
                    {agencies.map((agency) => (
                      <button
                        key={agency.id}
                        type="button"
                        onClick={() => { setAgencyId(String(agency.id)); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${String(agencyId) === String(agency.id) ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {agency.name}
                        {String(agencyId) === String(agency.id) && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="relative custom-dropdown">
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Category</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formCategory' ? null : 'formCategory')}
                  className="w-full flex items-center justify-between bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-100/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left"
                >
                  <span className={`font-medium ${!categoryId ? 'text-slate-400' : ''}`}>{selectedCategoryName}</span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'formCategory' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeDropdown === 'formCategory' && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setCategoryId(''); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-50"
                    >
                      Select Category...
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => { setCategoryId(String(category.id)); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${String(categoryId) === String(category.id) ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {category.name}
                        {String(categoryId) === String(category.id) && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving...' : (editingId ? 'Update Vehicle' : 'Create Vehicle')}
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Fleet List</h3>
        
        {/* Filtres de recherche et tris */}
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
              placeholder="Search brand, model, plate..." 
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
              className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs text-left"
            >
              <span className="font-medium">{statusLabels[statusFilter]}</span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeDropdown === 'filterStatus' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {activeDropdown === 'filterStatus' && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                {Object.entries(statusLabels).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setStatusFilter(val); setPage(1); setActiveDropdown(null); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${statusFilter === val ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
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
              className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs text-left"
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
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${sortBy === val ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
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
              className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs text-left"
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
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${sortOrder === val ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
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
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">License Plate</th>
                <th className="py-3 px-4">Mileage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loadingList ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">Loading vehicles...</td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No matching vehicles found.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{v.brand} {v.model}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">{v.licensePlate}</td>
                    <td className="py-3 px-4">{v.mileage} km</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        v.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 
                        v.status === 'RENTED' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {deletingId === v.id ? (
                        <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-xl border border-red-200 shadow-sm">
                          <span className="text-xs text-red-700 font-semibold px-1">Delete?</span>
                          <button 
                            onClick={() => confirmDelete(v.id)} 
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
                            onClick={() => handleEdit(v)} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setDeletingId(v.id)} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                          >
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
  );
};