import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';

interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  seats: number;
  gearboxType: string;
  fuelType: string;
  status: string;
  initialMileage: string;
  specificDailyRate?: string;
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

  // Form fields matching CreateVehicleDTO
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [seats, setSeats] = useState<number>(5);
  const [gearboxType, setGearboxType] = useState('MANUAL');
  const [fuelType, setFuelType] = useState('DIESEL');
  const [status, setStatus] = useState('AVAILABLE');
  const [initialMileage, setInitialMileage] = useState('');
  const [specificDailyRate, setSpecificDailyRate] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

      // --- 1. Traitement blindé des véhicules ---
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

      // --- 2. Traitement blindé des agences (évite le select vide) ---
      const rawAgencies = agencyRes.data;
      let parsedAgencies: Agency[] = [];
      if (Array.isArray(rawAgencies)) {
        parsedAgencies = rawAgencies;
      } else if (rawAgencies && Array.isArray(rawAgencies.data)) {
        parsedAgencies = rawAgencies.data;
      } else if (rawAgencies && Array.isArray(rawAgencies['hydra:member'])) {
        parsedAgencies = rawAgencies['hydra:member'];
      } else if (rawAgencies && Array.isArray(rawAgencies.items)) {
        parsedAgencies = rawAgencies.items;
      }
      setAgencies(parsedAgencies);

      // --- 3. Traitement blindé des catégories ---
      const rawCategories = categoryRes.data;
      let parsedCategories: Category[] = [];
      if (Array.isArray(rawCategories)) {
        parsedCategories = rawCategories;
      } else if (rawCategories && Array.isArray(rawCategories.data)) {
        parsedCategories = rawCategories.data;
      } else if (rawCategories && Array.isArray(rawCategories['hydra:member'])) {
        parsedCategories = rawCategories['hydra:member'];
      } else if (rawCategories && Array.isArray(rawCategories.items)) {
        parsedCategories = rawCategories.items;
      }
      setCategories(parsedCategories);

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
        licensePlate,
        brand,
        model,
        year: Number(year),
        seats: Number(seats),
        gearboxType,
        fuelType,
        status,
        initialMileage,
        specificDailyRate: specificDailyRate ? specificDailyRate : null,
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
    setLicensePlate(vehicle.licensePlate);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setYear(vehicle.year);
    setSeats(vehicle.seats);
    setGearboxType(vehicle.gearboxType);
    setFuelType(vehicle.fuelType);
    setStatus(vehicle.status);
    setInitialMileage(vehicle.initialMileage);
    setSpecificDailyRate(vehicle.specificDailyRate || '');
    setAgencyId(vehicle.agencyId);
    setCategoryId(vehicle.categoryId);
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
    setLicensePlate('');
    setBrand('');
    setModel('');
    setYear(new Date().getFullYear());
    setSeats(5);
    setGearboxType('MANUAL');
    setFuelType('DIESEL');
    setStatus('AVAILABLE');
    setInitialMileage('');
    setSpecificDailyRate('');
    setAgencyId('');
    setCategoryId('');
  };

  return (
    <div className="space-y-8 relative">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Fleet Management</h2>
        <p className="text-slate-600">Manage vehicles, specs, assignments, and availability status.</p>
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
            {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
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
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">License Plate</label>
              <input 
                type="text" 
                value={licensePlate} 
                onChange={(e) => setLicensePlate(e.target.value)} 
                required 
                maxLength={50}
                placeholder="1234 TB" 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" 
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Brand</label>
                <input 
                  type="text" 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)} 
                  required 
                  maxLength={50}
                  placeholder="Toyota..." 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Model</label>
                <input 
                  type="text" 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)} 
                  required 
                  maxLength={50}
                  placeholder="RAV4..." 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Year</label>
                <input 
                  type="number" 
                  value={year} 
                  onChange={(e) => setYear(Number(e.target.value))} 
                  required 
                  min={1900} 
                  max={2100}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Seats</label>
                <input 
                  type="number" 
                  value={seats} 
                  onChange={(e) => setSeats(Number(e.target.value))} 
                  required 
                  min={1}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Gearbox</label>
                <select 
                  value={gearboxType} 
                  onChange={(e) => setGearboxType(e.target.value)} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automatic</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Fuel Type</label>
                <select 
                  value={fuelType} 
                  onChange={(e) => setFuelType(e.target.value)} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="DIESEL">Diesel</option>
                  <option value="PETROL">Petrol</option>
                  <option value="ELECTRIC">Electric</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Initial Mileage</label>
                <input 
                  type="text" 
                  value={initialMileage} 
                  onChange={(e) => setInitialMileage(e.target.value)} 
                  required 
                  placeholder="15000" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Daily Rate (Opt.)</label>
                <input 
                  type="text" 
                  value={specificDailyRate} 
                  onChange={(e) => setSpecificDailyRate(e.target.value)} 
                  placeholder="120.00" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RENTED">RENTED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Agency</label>
              <select 
                value={agencyId} 
                onChange={(e) => setAgencyId(e.target.value)} 
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Agency...</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>{agency.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1">Category</label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)} 
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingId ? 'Update Vehicle' : 'Create Vehicle')}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Fleet Inventory</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
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
                placeholder="Search brand, plate..." 
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RENTED">RENTED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>

            <div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="brand">Sort by Brand</option>
                <option value="year">Sort by Year</option>
              </select>
            </div>

            <div>
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Plate</th>
                  <th className="py-3 px-4">Specs</th>
                  <th className="py-3 px-4">Mileage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loadingList ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">Loading vehicles...</td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No matching vehicles found.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{vehicle.brand} {vehicle.model}</div>
                        <div className="text-xs text-slate-400">{vehicle.year} • {vehicle.seats} seats</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">{vehicle.licensePlate}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {vehicle.gearboxType} / {vehicle.fuelType}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{vehicle.initialMileage} km</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          vehicle.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 
                          vehicle.status === 'RENTED' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {deletingId === vehicle.id ? (
                          <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-xl border border-red-200 shadow-sm">
                            <span className="text-xs text-red-700 font-semibold px-1">Delete?</span>
                            <button 
                              onClick={() => confirmDelete(vehicle.id)} 
                              className="px-2.5 py-1 bg-red-600 text-white text-xs rounded-lg font-medium hover:bg-red-700 transition shadow-sm"
                            >
                              Yes
                            </button>
                            <button 
                              onClick={() => setDeletingId(null)} 
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg font-medium hover:bg-slate-300 transition"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEdit(vehicle)} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition shadow-sm"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setDeletingId(vehicle.id)} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition shadow-sm"
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
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-40"
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