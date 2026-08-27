import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';
import GpsModal  from './GpsModal';
import { VehiclePhotoModal } from '../../vehicles/components/VehiclesPhotoModal';
import { VehicleDocumentModal } from './VehiclesDocumentModal';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  mileage: number;
  status: string;
  agencyId: string;
  categoryId: string;
  gpsDeviceId?: string;
  year?: number;
  seats?: number;
  gearboxType?: string;
  fuelType?: string;
  specificDailyRate?: number;
}

interface Agency {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';

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
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');
  const [agencyId, setAgencyId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [gpsDeviceId, setGpsDeviceId] = useState('');
  const [year, setYear] = useState('');
  const [seats, setSeats] = useState('');
  const [gearboxType, setGearboxType] = useState('MANUAL');
  const [fuelType, setFuelType] = useState('GASOLINE');
  const [specificDailyRate, setSpecificDailyRate] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

const [trackingVehicle, setTrackingVehicle] = useState<Vehicle | null>(null);
const [gpsModalVehicleId, setGpsModalVehicleId] = useState<string | null>(null);
const [photoModalVehicleId, setPhotoModalVehicleId] = useState<string | null>(null);
const [documentModalVehicleId, setDocumentModalVehicleId] = useState<string | null>(null);
const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenPhotoModal = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.vehicleId) {
        setPhotoModalVehicleId(String(customEvent.detail.vehicleId));
      }
    };

    window.addEventListener('open-vehicle-photo-modal', handleOpenPhotoModal);
    return () => {
      window.removeEventListener('open-vehicle-photo-modal', handleOpenPhotoModal);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.custom-dropdown')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const extractList = (response: any): any[] => {
    const raw = response?.data ?? response;

    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.vehicles)) return raw.vehicles;
    if (Array.isArray(raw?.results)) return raw.results;
    if (Array.isArray(raw?.['hydra:member'])) return raw['hydra:member'];

    return [];
  };

  const getApiErrorMessage = (err: any): string => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Impossible de charger les véhicules.'
    );
  };

  const fetchData = async () => {
    setLoadingList(true);
    setError('');

    try {
      const params: Record<string, string | number> = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;

      const vehicleRes = await api.get('/vehicles', { params });
      const rawVehicleData = vehicleRes?.data;
      const data = extractList(rawVehicleData) as Vehicle[];
      const pagination = rawVehicleData?.data ?? rawVehicleData;
      const pages = Number(
        pagination?.totalPages ??
        pagination?.meta?.totalPages ??
        pagination?.pagination?.totalPages ??
        1
      );

      setVehicles(data);
      setTotalPages(Number.isFinite(pages) && pages > 0 ? pages : 1);

      // Les données secondaires ne doivent jamais empêcher l’affichage des véhicules.
      const [agencyRes, categoryRes] = await Promise.allSettled([
        api.get('/agencies'),
        api.get('/categories'),
      ]);

      if (agencyRes.status === 'fulfilled') {
        setAgencies(extractList(agencyRes.value));
      } else {
        setAgencies([]);
      }

      if (categoryRes.status === 'fulfilled') {
        setCategories(extractList(categoryRes.value));
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error('GET /vehicles failed:', err?.response?.data || err);
      setError(`Erreur lors du chargement des véhicules : ${getApiErrorMessage(err)}`);
      // Ne pas remplacer les anciennes données par une liste vide si le refresh échoue.
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
        initialMileage: mileage ? mileage.toString() : '0',
        status,
        agencyId: agencyId || null,
        categoryId: categoryId || null,
        gpsDeviceId: gpsDeviceId ? gpsDeviceId.trim() : null,
        year: year ? Number(year) : null,
        seats: seats ? Number(seats) : null,
        gearboxType,
        fuelType,
        specificDailyRate: specificDailyRate ? specificDailyRate.toString() : null,
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
    setStatus(normalizeVehicleStatus(vehicle.status));
    setAgencyId(String(vehicle.agencyId || ''));
    setCategoryId(String(vehicle.categoryId || ''));
    setGpsDeviceId(vehicle.gpsDeviceId || '');
    setYear(vehicle.year ? vehicle.year.toString() : '');
    setSeats(vehicle.seats ? vehicle.seats.toString() : '');
    setGearboxType(vehicle.gearboxType || 'MANUAL');
    setFuelType(vehicle.fuelType || 'GASOLINE');
    setSpecificDailyRate(vehicle.specificDailyRate ? vehicle.specificDailyRate.toString() : '');
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
    setGpsDeviceId('');
    setYear('');
    setSeats('');
    setGearboxType('MANUAL');
    setFuelType('GASOLINE');
    setSpecificDailyRate('');
    setShowForm(false);
  };

  const VEHICLE_STATUSES: VehicleStatus[] = ['AVAILABLE', 'RENTED', 'MAINTENANCE'];

  const normalizeVehicleStatus = (value: string): VehicleStatus => {
    return VEHICLE_STATUSES.includes(value as VehicleStatus)
      ? (value as VehicleStatus)
      : 'AVAILABLE';
  };

  const statusLabels: Record<string, string> = {
    '': 'All Statuses',
    AVAILABLE: 'Available',
    RENTED: 'Rented',
    MAINTENANCE: 'Maintenance',
  };

  const getStatusClasses = (vehicleStatus: string) => {
    switch (vehicleStatus) {
      case 'AVAILABLE': return 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
      case 'RENTED': return 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'MAINTENANCE': return 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600';
    }
  };

  const handleStatusChange = async (vehicle: Vehicle, nextStatus: VehicleStatus) => {
    if (vehicle.status === nextStatus) {
      setActiveDropdown(null);
      return;
    }

    const previousStatus = vehicle.status;
    setActiveDropdown(null);
    setError('');
    setSuccessMessage('');

    setVehicles((currentVehicles) =>
      currentVehicles.map((item) =>
        item.id === vehicle.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      await api.put(`/vehicles/${vehicle.id}`, {
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        initialMileage: String(vehicle.mileage ?? 0),
        status: nextStatus,
        agencyId: vehicle.agencyId || null,
        categoryId: vehicle.categoryId || null,
        gpsDeviceId: vehicle.gpsDeviceId || null,
        year: vehicle.year ?? null,
        seats: vehicle.seats ?? null,
        gearboxType: vehicle.gearboxType || 'MANUAL',
        fuelType: vehicle.fuelType || 'GASOLINE',
        specificDailyRate: vehicle.specificDailyRate ?? null,
      });

      setSuccessMessage(`Status updated to ${statusLabels[nextStatus]}.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setVehicles((currentVehicles) =>
        currentVehicles.map((item) =>
          item.id === vehicle.id ? { ...item, status: previousStatus } : item
        )
      );
      setError(err.response?.data?.message || 'Failed to update vehicle status.');
    }
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Vehicles Management</h2>
          <p className="text-slate-600 dark:text-slate-300">Manage your fleet, specifications, and availability status.</p>
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

      {error && !showForm && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-4 font-bold text-red-500 dark:text-red-400 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 dark:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 max-w-3xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {editingId ? 'Edit Vehicle' : 'New Vehicle'}
            </h3>
            <button 
              onClick={resetForm} 
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 font-bold text-lg px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-3 py-2.5 rounded-xl text-sm flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </span>
              <button onClick={() => setError('')} className="text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 dark:text-red-300 font-bold ml-2">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Brand</label>
                <input 
                  type="text" 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)} 
                  required 
                  placeholder="e.g. Toyota" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Model</label>
                <input 
                  type="text" 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)} 
                  required 
                  placeholder="e.g. Corolla" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">License Plate</label>
                <input 
                  type="text" 
                  value={licensePlate} 
                  onChange={(e) => setLicensePlate(e.target.value)} 
                  required 
                  placeholder="e.g. AB-123-CD" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Year</label>
                <input 
                  type="number" 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)} 
                  placeholder="e.g. 2022" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Seats</label>
                <input 
                  type="number" 
                  value={seats} 
                  onChange={(e) => setSeats(e.target.value)} 
                  placeholder="e.g. 5" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Initial Mileage (km)</label>
                <input 
                  type="number" 
                  value={mileage} 
                  onChange={(e) => setMileage(e.target.value)} 
                  placeholder="e.g. 15000" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>

              {/* Gearbox Type Dropdown */}
              <div className="relative custom-dropdown">
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Gearbox Type</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formGearbox' ? null : 'formGearbox')}
                  className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 transition-all shadow-2xs text-left ${activeDropdown === 'formGearbox' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{gearboxType === 'MANUAL' ? 'Manual' : 'Automatic'}</span>
                  <svg className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${activeDropdown === 'formGearbox' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeDropdown === 'formGearbox' && (
                  <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                    {[
                      { val: 'MANUAL', label: 'Manual' },
                      { val: 'AUTOMATIC', label: 'Automatic' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => { setGearboxType(item.val); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${gearboxType === item.val ? 'bg-purple-50/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                      >
                        {item.label}
                        {gearboxType === item.val && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fuel Type Dropdown */}
              <div className="relative custom-dropdown">
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Fuel Type</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formFuel' ? null : 'formFuel')}
                  className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 transition-all shadow-2xs text-left ${activeDropdown === 'formFuel' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{fuelType.charAt(0) + fuelType.slice(1).toLowerCase()}</span>
                  <svg className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${activeDropdown === 'formFuel' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeDropdown === 'formFuel' && (
                  <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                    {['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID'].map((f) => {
                      const label = f.charAt(0) + f.slice(1).toLowerCase();
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => { setFuelType(f); setActiveDropdown(null); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${fuelType === f ? 'bg-purple-50/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                        >
                          {label}
                          {fuelType === f && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Specific Daily Rate ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={specificDailyRate} 
                  onChange={(e) => setSpecificDailyRate(e.target.value)} 
                  placeholder="e.g. 45.00" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">GPS Device ID</label>
                <input 
                  type="text" 
                  value={gpsDeviceId} 
                  onChange={(e) => setGpsDeviceId(e.target.value)} 
                  placeholder="e.g. GPS-TRK-334112" 
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status */}
              <div className="relative custom-dropdown">
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Status</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formStatus' ? null : 'formStatus')}
                  className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 transition-all shadow-2xs text-left ${activeDropdown === 'formStatus' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{status}</span>
                  <svg className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${activeDropdown === 'formStatus' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeDropdown === 'formStatus' && (
                  <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                    {VEHICLE_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setStatus(s); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${status === s ? 'bg-purple-50/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                      >
                        {s}
                        {status === s && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Agency */}
              <div className="relative custom-dropdown">
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Agency</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formAgency' ? null : 'formAgency')}
                  className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 transition-all shadow-2xs text-left ${activeDropdown === 'formAgency' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}
                >
                  <span className={`font-medium ${!agencyId ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>{selectedAgencyName}</span>
                  <svg className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${activeDropdown === 'formAgency' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeDropdown === 'formAgency' && (
                  <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setAgencyId(''); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      Select Agency...
                    </button>
                    {agencies.map((agency) => (
                      <button
                        key={agency.id}
                        type="button"
                        onClick={() => { setAgencyId(String(agency.id)); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${String(agencyId) === String(agency.id) ? 'bg-purple-50/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                      >
                        {agency.name}
                        {String(agencyId) === String(agency.id) && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="relative custom-dropdown">
                <label className="block text-xs font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-1">Category</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'formCategory' ? null : 'formCategory')}
                  className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 transition-all shadow-2xs text-left ${activeDropdown === 'formCategory' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}
                >
                  <span className={`font-medium ${!categoryId ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>{selectedCategoryName}</span>
                  <svg className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${activeDropdown === 'formCategory' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeDropdown === 'formCategory' && (
                  <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setCategoryId(''); setActiveDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      Select Category...
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => { setCategoryId(String(category.id)); setActiveDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${String(categoryId) === String(category.id) ? 'bg-purple-50/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
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
                className="py-2.5 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Fleet List</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-700 items-center">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search brand, model, plate..." 
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Status Dropdown */}
          <div className="relative custom-dropdown">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'filterStatus' ? null : 'filterStatus')}
              className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 transition-all shadow-2xs text-left ${activeDropdown === 'filterStatus' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}
            >
              <span className="font-medium text-slate-900 dark:text-slate-100">{statusLabels[statusFilter]}</span>
              <svg className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${activeDropdown === 'filterStatus' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {activeDropdown === 'filterStatus' && (
              <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                {Object.entries(statusLabels).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setStatusFilter(val); setPage(1); setActiveDropdown(null); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${statusFilter === val ? 'bg-purple-50/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                  >
                    {label}
                    {statusFilter === val && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter SortBy Dropdown */}
          <div className="relative custom-dropdown">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'filterSort' ? null : 'filterSort')}
              className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 transition-all shadow-2xs text-left ${activeDropdown === 'filterSort' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}
            >
              <span className="font-medium text-slate-900 dark:text-slate-100">{sortByLabels[sortBy]}</span>
              <svg className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${activeDropdown === 'filterSort' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {activeDropdown === 'filterSort' && (
              <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                {Object.entries(sortByLabels).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setSortBy(val); setActiveDropdown(null); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${sortBy === val ? 'bg-purple-50/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                  >
                    {label}
                    {sortBy === val && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter SortOrder Dropdown */}
          <div className="relative custom-dropdown">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'filterOrder' ? null : 'filterOrder')}
              className={`w-full flex items-center justify-between bg-white dark:bg-slate-800 border rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 transition-all shadow-2xs text-left ${activeDropdown === 'filterOrder' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}
            >
              <span className="font-medium text-slate-900 dark:text-slate-100">{sortOrderLabels[sortOrder]}</span>
              <svg className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${activeDropdown === 'filterOrder' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {activeDropdown === 'filterOrder' && (
              <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                {Object.entries(sortOrderLabels).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setSortOrder(val as 'ASC' | 'DESC'); setActiveDropdown(null); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${sortOrder === val ? 'bg-purple-50/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                  >
                    {label}
                    {sortOrder === val && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tableau des véhicules */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="p-3.5">Vehicle</th>
                <th className="p-3.5">License Plate</th>
                <th className="p-3.5">Mileage</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-200">
              {loadingList ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 dark:text-slate-500">Loading vehicles...</td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 dark:text-slate-500 italic">No vehicles found.</td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-600/50 transition">
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">{v.brand} {v.model}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{v.licensePlate}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{v.mileage} km</td>
                    <td className="p-3.5">
                      <div className="relative custom-dropdown inline-block">
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === `status-${v.id}` ? null : `status-${v.id}`)}
                          className={`inline-flex min-w-[145px] items-center justify-between gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition hover:shadow-sm ${getStatusClasses(v.status)}`}
                          aria-haspopup="listbox"
                          aria-expanded={activeDropdown === `status-${v.id}`}
                        >
                          <span>{statusLabels[v.status] || v.status}</span>
                          <svg className={`h-3.5 w-3.5 transition-transform ${activeDropdown === `status-${v.id}` ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" />
                          </svg>
                        </button>

                        {activeDropdown === `status-${v.id}` && (
                          <div className="absolute left-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-xl" role="listbox">
                            {VEHICLE_STATUSES.map((availableStatus) => (
                              <button
                                key={availableStatus}
                                type="button"
                                onClick={() => handleStatusChange(v, availableStatus)}
                                className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-slate-50 dark:hover:bg-slate-600 ${v.status === availableStatus ? 'bg-purple-50 font-bold text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-200'}`}
                                role="option"
                                aria-selected={v.status === availableStatus}
                              >
                                <span>{statusLabels[availableStatus]}</span>
                                {v.status === availableStatus && <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-right flex items-center justify-end gap-2">
                      {/* Bouton pour ouvrir le modal des photos */}
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoModalVehicleId(String(v.id));
                          window.dispatchEvent(
                            new CustomEvent('open-vehicle-photo-modal', { detail: { vehicleId: v.id } })
                          );
                        }}
                        className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-800/60 text-purple-700 dark:text-purple-300 font-semibold rounded-xl text-xs transition shadow-2xs cursor-pointer"
                        title="Manage Photos"
                      >
                       Photos
                      </button>

                      {/* Bouton pour ouvrir le modal des documents */}
                      <button
                        type="button"
                        onClick={() => setDocumentModalVehicleId(String(v.id))}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 font-semibold rounded-xl text-xs transition shadow-2xs cursor-pointer"
                        title="Manage Documents"
                      >
                      Docs
                      </button>
                      <button
                        type="button"
                        onClick={() => setGpsModalVehicleId(String(v.id))}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-semibold rounded-xl text-xs transition shadow-2xs cursor-pointer"
                        title="Manage GPS"
                      >
                        GPS
                      </button>

                      <button
                        onClick={() => handleEdit(v)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setDeletingId(v.id)}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-slate-200 transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-slate-200 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal Delete */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Confirm Deletion</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete this vehicle? This action cannot be undone.</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => confirmDelete(deletingId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow-md transition cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Tracking Modal */}
      {trackingVehicle && (
        <GpsModal 
    vehicleId={String(trackingVehicle.id)}
    vehicleName={`${trackingVehicle.brand} ${trackingVehicle.model}`}
    onClose={() => setTrackingVehicle(null)}
/>
      )}

      {/* Vehicle Photo Modal */}
      {photoModalVehicleId && (
        <VehiclePhotoModal
          vehicleId={photoModalVehicleId}
          onClose={() => setPhotoModalVehicleId(null)}
          onSuccess={(msg) => setSuccessMessage(msg)}
          onError={(err) => setError(err)}
        />
      )}

            {/* Vehicle Document Modal */}
      {documentModalVehicleId && (
        <VehicleDocumentModal
          vehicleId={documentModalVehicleId}
          onClose={() => setDocumentModalVehicleId(null)}
          onSuccess={(msg) => setSuccessMessage(msg)}
          onError={(err) => setError(err)}
        />
      )}
  {/* Vehicle GPS Modal */}
{gpsModalVehicleId && (
  <GpsModal
    vehicleId={gpsModalVehicleId}
    vehicleName={(() => {
      const v = vehicles.find(item => String(item.id) === String(gpsModalVehicleId));
      return v ? `${v.brand} ${v.model} (${v.licensePlate})` : 'Vehicle';
    })()}
    onClose={() => setGpsModalVehicleId(null)}
  />
)}
    </div>
  );
};
