import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';
import { KycStatusModal } from '../../KycDocuments/components/KycStatusModal';

interface Reservation {
  id: string | number;
  startDate: string;
  endDate: string;
  status: string;
  depositAmount?: string | number;
  vehicleId?: string | number;
  userId?: string | number;
  user?: {
    id: string | number;
    kycStatus?: string;
  };
}

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [selectedUserKyc, setSelectedUserKyc] = useState<string>('PENDING');

  const [vehiclesMap, setVehiclesMap] = useState<{ [key: string]: any }>({});
  const [usersMap, setUsersMap] = useState<{ [key: string]: any }>({});
  const [agenciesMap, setAgenciesMap] = useState<{ [key: string]: any }>({});
  const [categoriesMap, setCategoriesMap] = useState<{ [key: string]: any }>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeActionDropdown, setActiveActionDropdown] = useState<string | number | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.custom-dropdown')) {
        setActiveDropdown(null);
        setActiveActionDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReservations = async () => {
    if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
      setError('Start date cannot be greater than end date.');
      setReservations([]);
      setLoadingList(false);
      return;
    }

    if (error === 'Start date cannot be greater than end date.') {
      setError('');
    }

    setLoadingList(true);
    try {
      const response = await api.get('/reservations', { 
        params: { 
          page, 
          limit: 10, 
          sortBy, 
          sortOrder, 
          search: searchQuery, 
          status: statusFilter,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined
        } 
      });
      
      const resData = response.data;
      let data: Reservation[] = [];
      let pages = 1;

      if (Array.isArray(resData)) {
        data = resData;
      } else if (resData && Array.isArray(resData.items)) {
        data = resData.items;
        pages = resData.totalPages || resData.meta?.totalPages || 1;
      } else if (resData && Array.isArray(resData.data)) {
        data = resData.data;
        pages = resData.totalPages || 1;
      } else if (resData && Array.isArray(resData['hydra:member'])) {
        data = resData['hydra:member'];
      }

      setReservations(data);
      setTotalPages(pages);

      const vehicleIds: string[] = Array.from(
        new Set(data.map(r => r.vehicleId).filter((id): id is string | number => id !== null && id !== undefined))
      ).map(String);

      const userIds: string[] = Array.from(
        new Set(data.map(r => r.userId || (r.user as any)?.id).filter((id): id is string | number => id !== null && id !== undefined))
      ).map(String);

      fetchDetails(vehicleIds, userIds);

    } catch (err) {
      setError('Failed to load reservations.');
      setReservations([]);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchDetails = async (vIds: string[], uIds: string[]) => {
    for (const vId of vIds) {
      if (!vehiclesMap[vId]) {
        try {
          const res = await api.get(`/vehicles/${vId}`);
          const vehicleData = res.data;
          setVehiclesMap(prev => ({ ...prev, [vId]: vehicleData }));

          let agencyId = vehicleData.agencyId || vehicleData.agency?.id;
          if (!agencyId && typeof vehicleData.agency === 'string' && vehicleData.agency.includes('/')) {
            const parts = vehicleData.agency.split('/');
            agencyId = parts[parts.length - 1];
          }

          if (agencyId && !agenciesMap[agencyId]) {
            let fetchedAgency = null;
            try {
              const agencyRes = await api.get(`/agencies/${agencyId}`);
              fetchedAgency = agencyRes.data;
            } catch (e1) {
              try {
                const agencyRes2 = await api.get(`/agency/${agencyId}`);
                fetchedAgency = agencyRes2.data;
              } catch (e2) {}
            }
            if (fetchedAgency) {
              setAgenciesMap(prev => ({ ...prev, [agencyId]: fetchedAgency }));
            }
          }

          let categoryId = vehicleData.categoryId || vehicleData.category?.id;
          if (!categoryId && typeof vehicleData.category === 'string' && vehicleData.category.includes('/')) {
            const parts = vehicleData.category.split('/');
            categoryId = parts[parts.length - 1];
          }

          if (categoryId && !categoriesMap[categoryId]) {
            let fetchedCat = null;
            try {
              const catRes = await api.get(`/categories/${categoryId}`);
              fetchedCat = catRes.data;
            } catch (e1) {
              try {
                const catRes2 = await api.get(`/vehicle-categories/${categoryId}`);
                fetchedCat = catRes2.data;
              } catch (e2) {}
            }
            if (fetchedCat) {
              setCategoriesMap(prev => ({ ...prev, [categoryId]: fetchedCat }));
            }
          }
        } catch (e) {}
      }
    }

    for (const uId of uIds) {
      if (!usersMap[uId]) {
        try {
          const res = await api.get(`/users/${uId}`);
          setUsersMap(prev => ({ ...prev, [uId]: res.data }));
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchReservations, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, startDateFilter, endDateFilter, sortBy, sortOrder, page]);

  const handleStatusChange = async (reservationId: string | number, newStatus: string) => {
    try {
      await api.patch(`/reservations/${reservationId}/status`, { status: newStatus });
      setSuccessMessage(`Reservation updated to ${newStatus}`);
      setActiveActionDropdown(null);
      fetchReservations();
    } catch (err) {
      setError('Failed to update reservation status.');
    }
  };

  const handleKycUpdate = async (newStatus: string) => {
    if (!selectedUserId) return;
    try {
      await api.patch(`/users/${selectedUserId}/kyc-status`, { status: newStatus });
      setSuccessMessage(`KYC status updated to ${newStatus}`);
      setIsModalOpen(false);
      fetchReservations();
    } catch (err) {
      setError('Failed to update KYC status.');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'confirmed' || s === 'verified') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'rejected' || s === 'cancelled') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  const statusLabels: Record<string, string> = {
    '': 'All Statuses',
    'PENDING': 'PENDING',
    'CONFIRMED': 'CONFIRMED',
    'REJECTED': 'REJECTED',
    'CANCELLED': 'CANCELLED'
  };

  const sortByLabels: Record<string, string> = {
    'startDate': 'Start Date',
    'endDate': 'End Date',
    'depositAmount': 'Deposit Amount',
    'status': 'Status'
  };

  const availableStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reservations Panel</h2>
      </div>

      {successMessage && (
        <div className="bg-emerald-100 text-emerald-800 p-3 rounded-lg text-sm transition-all duration-300">{successMessage}</div>
      )}

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 pb-6 border-b border-slate-100 items-center">
          
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Search</label>
            <input 
              type="text"
              placeholder="Search vehicle, user..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
            />
          </div>

          <div className="relative custom-dropdown">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Status Filter</label>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
              className="w-full flex items-center justify-between bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-100/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left"
            >
              <span className="font-medium truncate">{statusLabels[statusFilter]}</span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${activeDropdown === 'status' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {activeDropdown === 'status' && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
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

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">From Date</label>
            <input 
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                const newStartDate = e.target.value;
                setStartDateFilter(newStartDate);
                setPage(1);
                if (endDateFilter && newStartDate > endDateFilter) {
                  setEndDateFilter('');
                }
              }}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">To Date</label>
            <input 
              type="date"
              value={endDateFilter}
              min={startDateFilter}
              onChange={(e) => { setEndDateFilter(e.target.value); setPage(1); }}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
            />
          </div>

          <div className="relative custom-dropdown">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Sort By</label>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
              className="w-full flex items-center justify-between bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-100/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left"
            >
              <span className="font-medium truncate">{sortByLabels[sortBy]}</span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {activeDropdown === 'sort' && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
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

        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Category / Agency</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Deposit</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-slate-700">
              {loadingList ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">Loading reservations...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">No reservations found.</td>
                </tr>
              ) : (
                reservations.map((res) => {
                  const isFinal = res.status === 'REJECTED' || res.status === 'CANCELLED';
                  const userId = res.userId || (typeof res.user === 'object' ? res.user?.id : res.user);
                  
                  const vehicleData = res.vehicleId ? vehiclesMap[res.vehicleId] : null;
                  const userData = userId ? usersMap[userId] : null;

                  const vIdStr = res.vehicleId ? String(res.vehicleId) : '';
                  const uIdStr = userId ? String(userId) : '';

                  const userDisplay = userData 
                    ? (userData.fullName || userData.email || 'User') 
                    : (uIdStr ? `Loading... (${uIdStr.substring(0, 8)}...)` : 'N/A');

                  const kycStatus = userData?.kycStatus || res.user?.kycStatus || 'PENDING';

                  const agencyId = vehicleData?.agencyId || (typeof vehicleData?.agency === 'object' ? vehicleData?.agency?.id : null);
                  const categoryId = vehicleData?.categoryId || (typeof vehicleData?.category === 'object' ? vehicleData?.category?.id : null);

                  const agencyObj = agencyId ? agenciesMap[agencyId] : null;
                  const categoryObj = categoryId ? categoriesMap[categoryId] : null;

                  const categoryName = 
                    categoryObj?.name || 
                    categoryObj?.title || 
                    (typeof vehicleData?.category === 'object' ? vehicleData?.category?.name : vehicleData?.category) || 
                    'N/A';

                  const agencyName = 
                    agencyObj?.name || 
                    agencyObj?.title || 
                    agencyObj?.city || 
                    vehicleData?.agencyName || 
                    (typeof vehicleData?.agency === 'object' ? (vehicleData?.agency?.name || vehicleData?.agency?.city) : null) || 
                    'N/A';

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        {vehicleData ? (
                          <div>
                            <div className="font-medium text-slate-900">
                              {vehicleData.brand} {vehicleData.model}
                            </div>
                            <span className="inline-block mt-0.5 font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                              {vehicleData.licensePlate || vehicleData.registrationNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            {vIdStr ? `Loading... (${vIdStr.substring(0, 8)}...)` : 'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {vehicleData ? (
                          <div className="space-y-0.5">
                            <div className="text-xs font-medium text-slate-800">
                              Category: <span className="text-slate-600">{categoryName}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Agency: <span className="text-slate-600">{agencyName}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {userDisplay}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="text-xs font-medium text-slate-800">
                          From: <span className="text-slate-600">{formatDate(res.startDate)}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          To: <span className="text-slate-600">{formatDate(res.endDate)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-purple-600">${res.depositAmount || '0.00'}</td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => { 
                            if (userId) {
                              setSelectedUserId(userId); 
                              setSelectedUserKyc(kycStatus);
                              setIsModalOpen(true); 
                            }
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${getStatusBadgeClass(kycStatus)}`}
                        >
                          {kycStatus}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(res.status)}`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {!isFinal ? (
                          <div className="relative custom-dropdown inline-block">
                            <button
                              type="button"
                              onClick={() => setActiveActionDropdown(activeActionDropdown === res.id ? null : res.id)}
                              className="flex items-center justify-between min-w-[120px] bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left"
                            >
                              <span className="font-semibold">{res.status}</span>
                              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-2 ${activeActionDropdown === res.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {activeActionDropdown === res.id && (
                              <div className="absolute right-0 z-30 mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                {availableStatuses.map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStatusChange(res.id, st)}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${res.status === st ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                  >
                                    {st}
                                    {res.status === st && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : <span className="text-xs text-slate-400 italic font-medium">Locked</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isModalOpen && selectedUserId && (
        <KycStatusModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          userId={selectedUserId}
          currentStatus={selectedUserKyc}
          onUpdateStatus={handleKycUpdate}
        />
      )}
    </div>
  );
};