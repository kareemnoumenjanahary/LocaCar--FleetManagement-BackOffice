import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';
import { KycStatusModal } from '../../KycDocuments/components/KycStatusModal';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  drivingLicenseNumber: string | null;
  userAccount: {
    id: string;
    email: string;
  } | null;
}

interface UserAccount {
  id: string;
  kycStatus?: string;
}

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  licensePlate?: string;
  registrationNumber?: string;
  status?: string;
  effectiveDailyRate?: string | number;
}

interface ReservationForm {
  startDate: string;
  endDate: string;
  vehicleId: string;
  customerId: string;
  depositAmount: string;
}

interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  depositAmount?: string | number;
  vehicleId?: string;
  customerId?: string;
}

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(null);
  const [selectedUserKyc, setSelectedUserKyc] =
    useState<string>('PENDING');

  const [vehiclesMap, setVehiclesMap] = useState<{
    [key: string]: any;
  }>({});

  const [customersMap, setCustomersMap] = useState<{
    [key: string]: Customer;
  }>({});

  const [usersMap, setUsersMap] = useState<{
    [key: string]: UserAccount;
  }>({});

  const [agenciesMap, setAgenciesMap] = useState<{
    [key: string]: any;
  }>({});

  const [categoriesMap, setCategoriesMap] = useState<{
    [key: string]: any;
  }>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder] =
    useState<'ASC' | 'DESC'>('DESC');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [activeDropdown, setActiveDropdown] =
    useState<string | null>(null);

  const [activeActionDropdown, setActiveActionDropdown] =
    useState<string | null>(null);

  const [loadingList, setLoadingList] =
    useState(true);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] =
    useState('');

  /*
   * Create reservation state.
   */
  const [isCreateReservationOpen, setIsCreateReservationOpen] =
    useState(false);

  const [creatingReservation, setCreatingReservation] =
    useState(false);

  const [loadingReservationOptions, setLoadingReservationOptions] =
    useState(false);

  const [reservationCustomers, setReservationCustomers] =
    useState<Customer[]>([]);

  const [reservationVehicles, setReservationVehicles] =
    useState<VehicleOption[]>([]);

  const [reservationForm, setReservationForm] =
    useState<ReservationForm>({
      startDate: '',
      endDate: '',
      vehicleId: '',
      customerId: '',
      depositAmount: '0.00',
    });

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        !(event.target as HTMLElement).closest(
          '.custom-dropdown'
        )
      ) {
        setActiveDropdown(null);
        setActiveActionDropdown(null);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  const fetchReservations = async () => {
    if (
      startDateFilter &&
      endDateFilter &&
      startDateFilter > endDateFilter
    ) {
      setError(
        'Start date cannot be greater than end date.'
      );
      setReservations([]);
      setLoadingList(false);
      return;
    }

    if (
      error ===
      'Start date cannot be greater than end date.'
    ) {
      setError('');
    }

    setLoadingList(true);

    try {
      const params: Record<
        string,
        string | number
      > = {
        page,
        limit: 10,
      };

      if (statusFilter !== '') {
        params.status = statusFilter;
      }

      const response = await api.get(
        '/reservations',
        {
          params,
        }
      );

      const resData = response.data;

      let data: Reservation[] = [];
      let pages = 1;

      if (Array.isArray(resData)) {
        data = resData;
      } else if (
        resData &&
        Array.isArray(resData.items)
      ) {
        data = resData.items;
        pages = resData.totalPages || 1;
      } else if (
        resData &&
        Array.isArray(resData.data)
      ) {
        data = resData.data;
        pages = resData.totalPages || 1;
      } else if (
        resData &&
        Array.isArray(
          resData['hydra:member']
        )
      ) {
        data = resData['hydra:member'];
      }

      setReservations(data);
      setTotalPages(pages);

      const vehicleIds = Array.from(
        new Set(
          data
            .map(
              (reservation) =>
                reservation.vehicleId
            )
            .filter(
              (id): id is string =>
                id !== null &&
                id !== undefined
            )
        )
      );

      const customerIds = Array.from(
        new Set(
          data
            .map(
              (reservation) =>
                reservation.customerId
            )
            .filter(
              (id): id is string =>
                id !== null &&
                id !== undefined
            )
        )
      );

      await fetchDetails(
        vehicleIds,
        customerIds
      );
    } catch (err) {
      console.error(
        'Failed to load reservations:',
        err
      );

      setError(
        'Failed to load reservations.'
      );
      setReservations([]);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchDetails = async (
    vehicleIds: string[],
    customerIds: string[]
  ) => {
    for (const vehicleId of vehicleIds) {
      if (vehiclesMap[vehicleId]) {
        continue;
      }

      try {
        const response = await api.get(
          `/vehicles/${vehicleId}`
        );

        const vehicleData = response.data;

        setVehiclesMap((previous) => ({
          ...previous,
          [vehicleId]: vehicleData,
        }));

        let agencyId =
          vehicleData.agencyId ||
          vehicleData.agency?.id;

        if (
          !agencyId &&
          typeof vehicleData.agency ===
            'string' &&
          vehicleData.agency.includes('/')
        ) {
          const parts =
            vehicleData.agency.split('/');

          agencyId =
            parts[parts.length - 1];
        }

        if (
          agencyId &&
          !agenciesMap[agencyId]
        ) {
          let fetchedAgency = null;

          try {
            const agencyResponse =
              await api.get(
                `/agencies/${agencyId}`
              );

            fetchedAgency =
              agencyResponse.data;
          } catch {
            try {
              const agencyResponse =
                await api.get(
                  `/agency/${agencyId}`
                );

              fetchedAgency =
                agencyResponse.data;
            } catch {
              // Agency could not be loaded.
            }
          }

          if (fetchedAgency) {
            setAgenciesMap(
              (previous) => ({
                ...previous,
                [agencyId]:
                  fetchedAgency,
              })
            );
          }
        }

        let categoryId =
          vehicleData.categoryId ||
          vehicleData.category?.id;

        if (
          !categoryId &&
          typeof vehicleData.category ===
            'string' &&
          vehicleData.category.includes('/')
        ) {
          const parts =
            vehicleData.category.split('/');

          categoryId =
            parts[parts.length - 1];
        }

        if (
          categoryId &&
          !categoriesMap[categoryId]
        ) {
          let fetchedCategory = null;

          try {
            const categoryResponse =
              await api.get(
                `/categories/${categoryId}`
              );

            fetchedCategory =
              categoryResponse.data;
          } catch {
            try {
              const categoryResponse =
                await api.get(
                  `/vehicle-categories/${categoryId}`
                );

              fetchedCategory =
                categoryResponse.data;
            } catch {
              // Category could not be loaded.
            }
          }

          if (fetchedCategory) {
            setCategoriesMap(
              (previous) => ({
                ...previous,
                [categoryId]:
                  fetchedCategory,
              })
            );
          }
        }
      } catch {
        // Vehicle details could not be loaded.
      }
    }

    for (const customerId of customerIds) {
      if (customersMap[customerId]) {
        continue;
      }

      try {
        const response = await api.get(
          `/admin/customers/${customerId}`
        );

        const customerData: Customer =
          response.data;

        setCustomersMap(
          (previous) => ({
            ...previous,
            [customerId]:
              customerData,
          })
        );

        const userId =
          customerData.userAccount?.id;

        if (
          userId &&
          !usersMap[userId]
        ) {
          try {
            const userResponse =
              await api.get(
                `/users/${userId}`
              );

            setUsersMap(
              (previous) => ({
                ...previous,
                [userId]:
                  userResponse.data,
              })
            );
          } catch (error) {
            console.error(
              'Failed to load user details:',
              error
            );
          }
        }
      } catch (error) {
        console.error(
          'Failed to load customer details:',
          error
        );
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(
      fetchReservations,
      300
    );

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    statusFilter,
    startDateFilter,
    endDateFilter,
    sortBy,
    sortOrder,
    page,
  ]);

  /*
   * Load customers and available vehicles
   * when the create reservation modal opens.
   */
  const openCreateReservationModal = async () => {
    setError('');

    setReservationForm({
      startDate: '',
      endDate: '',
      vehicleId: '',
      customerId: '',
      depositAmount: '0.00',
    });

    setIsCreateReservationOpen(true);
    setLoadingReservationOptions(true);

    try {
      const [
        customersResponse,
        vehiclesResponse,
      ] = await Promise.all([
        api.get('/admin/customers'),
        api.get('/vehicles'),
      ]);

      const customersData =
        customersResponse.data;

      const customers: Customer[] =
        Array.isArray(customersData)
          ? customersData
          : customersData?.items || [];

      const vehiclesData =
        vehiclesResponse.data;

      const vehicles: VehicleOption[] =
        Array.isArray(vehiclesData)
          ? vehiclesData
          : vehiclesData?.items ||
            vehiclesData?.data ||
            [];

      setReservationCustomers(
        customers
      );

      setReservationVehicles(
        vehicles.filter(
          (vehicle: VehicleOption) =>
            !vehicle.status ||
            vehicle.status === 'AVAILABLE'
        )
      );
    } catch (err) {
      console.error(
        'Failed to load reservation options:',
        err
      );

      setError(
        'Failed to load customers and vehicles.'
      );
    } finally {
      setLoadingReservationOptions(false);
    }
  };

  const closeCreateReservationModal = () => {
    if (creatingReservation) {
      return;
    }

    setIsCreateReservationOpen(false);
  };

  const handleReservationFormChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setReservationForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  /*
   * Convert datetime-local to an ISO string
   * accepted by the Symfony backend.
   */
  const toApiDateTime = (
    value: string
  ): string => {
    if (!value) {
      return value;
    }

    return `${value}:00+03:00`;
  };

  const handleCreateReservation = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');

    if (
      !reservationForm.startDate ||
      !reservationForm.endDate ||
      !reservationForm.vehicleId ||
      !reservationForm.customerId
    ) {
      setError(
        'Please complete all required reservation fields.'
      );

      return;
    }

    if (
      reservationForm.startDate >=
      reservationForm.endDate
    ) {
      setError(
        'End date must be after start date.'
      );

      return;
    }

    setCreatingReservation(true);

    try {
      await api.post(
        '/reservations',
        {
          startDate: toApiDateTime(
            reservationForm.startDate
          ),
          endDate: toApiDateTime(
            reservationForm.endDate
          ),
          vehicleId:
            reservationForm.vehicleId,
          customerId:
            reservationForm.customerId,
          depositAmount:
            reservationForm.depositAmount ||
            '0.00',
        }
      );

      setSuccessMessage(
        'Reservation created successfully.'
      );

      setIsCreateReservationOpen(
        false
      );

      setReservationForm({
        startDate: '',
        endDate: '',
        vehicleId: '',
        customerId: '',
        depositAmount: '0.00',
      });

      await fetchReservations();
    } catch (err: any) {
      console.error(
        'Failed to create reservation:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create reservation.';

      setError(message);
    } finally {
      setCreatingReservation(false);
    }
  };

  const handleStatusChange = async (
    reservationId: string,
    newStatus: string
  ) => {
    try {
      await api.patch(
        `/reservations/${reservationId}/status`,
        {
          status: newStatus,
        }
      );

      setSuccessMessage(
        `Reservation updated to ${newStatus}`
      );

      setActiveActionDropdown(null);

      await fetchReservations();
    } catch (err) {
      console.error(
        'Failed to update reservation status:',
        err
      );

      setError(
        'Failed to update reservation status.'
      );
    }
  };

  const handleKycUpdate = async (
    newStatus: string
  ) => {
    if (!selectedUserId) {
      return;
    }

    try {
      await api.patch(
        `/users/${selectedUserId}/kyc-status`,
        {
          status: newStatus,
        }
      );

      setUsersMap((previous) => ({
        ...previous,
        [selectedUserId]: {
          ...previous[selectedUserId],
          kycStatus: newStatus,
        },
      }));

      setSuccessMessage(
        `KYC status updated to ${newStatus}`
      );

      setIsModalOpen(false);
    } catch (err) {
      console.error(
        'Failed to update KYC status:',
        err
      );

      setError(
        'Failed to update KYC status.'
      );
    }
  };

  const getStatusBadgeClass = (
    status: string
  ) => {
    const value =
      status?.toLowerCase();

    if (
      value === 'confirmed' ||
      value === 'verified'
    ) {
      return 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
    }

    if (
      value === 'rejected' ||
      value === 'cancelled'
    ) {
      return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    }

    return 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
  };

  const formatDate = (
    dateString: string
  ) => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const options: Intl.DateTimeFormatOptions =
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        };

      return new Date(
        dateString
      ).toLocaleDateString(
        undefined,
        options
      );
    } catch {
      return dateString;
    }
  };

  const statusLabels: Record<
    string,
    string
  > = {
    '': 'All Statuses',
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
  };

  const sortByLabels: Record<
    string,
    string
  > = {
    startDate: 'Start Date',
    endDate: 'End Date',
    depositAmount: 'Deposit Amount',
    status: 'Status',
  };

  const availableStatuses = [
    'PENDING',
    'CONFIRMED',
    'REJECTED',
    'CANCELLED',
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Reservations Panel
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage vehicle reservations and customers.
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreateReservationModal
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-colors shadow-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>

          Create Reservation
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 p-3 rounded-lg text-sm transition-all duration-300">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 pb-6 border-b border-slate-100 dark:border-slate-700 items-center">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
              Search
            </label>

            <input
              type="text"
              placeholder="Search vehicle, customer..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(
                  event.target.value
                );
                setPage(1);
              }}
              className="w-full bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
            />
          </div>

          <div className="relative custom-dropdown">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
              Status Filter
            </label>

            <button
              type="button"
              onClick={() =>
                setActiveDropdown(
                  activeDropdown === 'status'
                    ? null
                    : 'status'
                )
              }
              className="w-full flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-600/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left"
            >
              <span className="font-medium truncate">
                {statusLabels[statusFilter]}
              </span>

              <svg
                className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ml-1 ${
                  activeDropdown ===
                  'status'
                    ? 'rotate-180'
                    : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {activeDropdown ===
              'status' && (
              <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                {Object.entries(
                  statusLabels
                ).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(
                          value
                        );
                        setPage(1);
                        setActiveDropdown(
                          null
                        );
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        statusFilter ===
                        value
                          ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {label}

                      {statusFilter ===
                        value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
              From Date
            </label>

            <input
              type="date"
              value={startDateFilter}
              onChange={(event) => {
                const newStartDate =
                  event.target.value;

                setStartDateFilter(
                  newStartDate
                );

                setPage(1);

                if (
                  endDateFilter &&
                  newStartDate >
                    endDateFilter
                ) {
                  setEndDateFilter('');
                }
              }}
              className="w-full bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
              To Date
            </label>

            <input
              type="date"
              value={endDateFilter}
              min={startDateFilter}
              onChange={(event) => {
                setEndDateFilter(
                  event.target.value
                );

                setPage(1);
              }}
              className="w-full bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
            />
          </div>

          <div className="relative custom-dropdown">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">
              Sort By
            </label>

            <button
              type="button"
              onClick={() =>
                setActiveDropdown(
                  activeDropdown === 'sort'
                    ? null
                    : 'sort'
                )
              }
              className="w-full flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-600/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left"
            >
              <span className="font-medium truncate">
                {sortByLabels[sortBy]}
              </span>

              <svg
                className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ml-1 ${
                  activeDropdown ===
                  'sort'
                    ? 'rotate-180'
                    : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {activeDropdown === 'sort' && (
              <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                {Object.entries(
                  sortByLabels
                ).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSortBy(
                          value
                        );
                        setActiveDropdown(
                          null
                        );
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        sortBy === value
                          ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {label}

                      {sortBy ===
                        value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                <th className="py-3 px-4">
                  Vehicle
                </th>

                <th className="py-3 px-4">
                  Category / Agency
                </th>

                <th className="py-3 px-4">
                  Customer
                </th>

                <th className="py-3 px-4">
                  Dates
                </th>

                <th className="py-3 px-4">
                  Deposit
                </th>

                <th className="py-3 px-4">
                  KYC Status
                </th>

                <th className="py-3 px-4">
                  Status
                </th>

                <th className="py-3 px-4">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-200">
              {loadingList ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 text-center text-slate-400 dark:text-slate-500"
                  >
                    Loading reservations...
                  </td>
                </tr>
              ) : reservations.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 text-center text-slate-400 dark:text-slate-500 italic"
                  >
                    No reservations found.
                  </td>
                </tr>
              ) : (
                reservations.map(
                  (reservation) => {
                    const isFinal =
                      reservation.status ===
                        'REJECTED' ||
                      reservation.status ===
                        'CANCELLED';

                    const vehicleId =
                      reservation.vehicleId;

                    const customerId =
                      reservation.customerId;

                    const vehicleData =
                      vehicleId
                        ? vehiclesMap[
                            vehicleId
                          ]
                        : null;

                    const customerData =
                      customerId
                        ? customersMap[
                            customerId
                          ]
                        : null;

                    const vehicleIdString =
                      vehicleId
                        ? String(
                            vehicleId
                          )
                        : '';

                    const customerIdString =
                      customerId
                        ? String(
                            customerId
                          )
                        : '';

                    const customerDisplay =
                      customerData
                        ? `${customerData.firstName} ${customerData.lastName}`
                        : customerIdString
                          ? `Loading... (${customerIdString.substring(
                              0,
                              8
                            )}...)`
                          : 'N/A';

                    const userAccount =
                      customerData?.userAccount;

                    const userId =
                      userAccount?.id ||
                      null;

                    const userData =
                      userId
                        ? usersMap[userId]
                        : null;

                    const kycStatus =
                      userData?.kycStatus ||
                      'PENDING';

                    const agencyId =
                      vehicleData?.agencyId ||
                      (
                        typeof vehicleData?.agency ===
                        'object'
                          ? vehicleData
                              ?.agency?.id
                          : null
                      );

                    const categoryId =
                      vehicleData?.categoryId ||
                      (
                        typeof vehicleData?.category ===
                        'object'
                          ? vehicleData
                              ?.category?.id
                          : null
                      );

                    const agencyObj =
                      agencyId
                        ? agenciesMap[
                            agencyId
                          ]
                        : null;

                    const categoryObj =
                      categoryId
                        ? categoriesMap[
                            categoryId
                          ]
                        : null;

                    const categoryName =
                      categoryObj?.name ||
                      categoryObj?.title ||
                      (
                        typeof vehicleData?.category ===
                        'object'
                          ? vehicleData
                              ?.category?.name
                          : vehicleData?.category
                      ) ||
                      'N/A';

                    const agencyName =
                      agencyObj?.name ||
                      agencyObj?.title ||
                      agencyObj?.city ||
                      vehicleData?.agencyName ||
                      (
                        typeof vehicleData?.agency ===
                        'object'
                          ? (
                              vehicleData
                                ?.agency
                                ?.name ||
                              vehicleData
                                ?.agency
                                ?.city
                            )
                          : null
                      ) ||
                      'N/A';

                    return (
                      <tr
                        key={
                          reservation.id
                        }
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          {vehicleData ? (
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {
                                  vehicleData.brand
                                }{' '}
                                {
                                  vehicleData.model
                                }
                              </div>

                              <span className="inline-block mt-0.5 font-mono text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 px-2 py-0.5 rounded-md border border-purple-100">
                                {vehicleData.licensePlate ||
                                  vehicleData.registrationNumber}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                              {vehicleIdString
                                ? `Loading... (${vehicleIdString.substring(
                                    0,
                                    8
                                  )}...)`
                                : 'N/A'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {vehicleData ? (
                            <div className="space-y-0.5">
                              <div className="text-xs font-medium text-slate-800 dark:text-slate-100">
                                Category:{' '}
                                <span className="text-slate-600 dark:text-slate-300">
                                  {
                                    categoryName
                                  }
                                </span>
                              </div>

                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Agency:{' '}
                                <span className="text-slate-600 dark:text-slate-300">
                                  {
                                    agencyName
                                  }
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                              N/A
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-100">
                              {
                                customerDisplay
                              }
                            </div>

                            {customerData?.email && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {
                                  customerData.email
                                }
                              </div>
                            )}

                            {customerData?.phone && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {
                                  customerData.phone
                                }
                              </div>
                            )}

                            {customerData &&
                              userAccount && (
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                                  Account exists
                                </div>
                            )}

                            {customerData &&
                              !userAccount && (
                                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                  No account
                                </div>
                            )}

                            {!customerData && (
                              <div className="text-xs text-slate-400 dark:text-slate-500 italic">
                                Customer ID:{' '}
                                {
                                  customerIdString
                                }
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-100">
                            From:{' '}
                            <span className="text-slate-600 dark:text-slate-300">
                              {formatDate(
                                reservation.startDate
                              )}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            To:{' '}
                            <span className="text-slate-600 dark:text-slate-300">
                              {formatDate(
                                reservation.endDate
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-purple-600">
                          $
                          {reservation.depositAmount ||
                            '0.00'}
                        </td>

                        <td className="py-3 px-4">
                          {userId ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserId(
                                  userId
                                );

                                setSelectedUserKyc(
                                  kycStatus
                                );

                                setIsModalOpen(
                                  true
                                );
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${getStatusBadgeClass(
                                kycStatus
                              )}`}
                            >
                              {kycStatus}
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600">
                              No account
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                              reservation.status
                            )}`}
                          >
                            {
                              reservation.status
                            }
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {!isFinal ? (
                            <div className="relative custom-dropdown inline-block">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveActionDropdown(
                                    activeActionDropdown ===
                                      reservation.id
                                      ? null
                                      : reservation.id
                                  )
                                }
                                className="flex items-center justify-between min-w-[120px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs text-left"
                              >
                                <span className="font-semibold">
                                  {
                                    reservation.status
                                  }
                                </span>

                                <svg
                                  className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ml-2 ${
                                    activeActionDropdown ===
                                    reservation.id
                                      ? 'rotate-180'
                                      : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>

                              {activeActionDropdown ===
                                reservation.id && (
                                <div className="absolute right-0 top-full mt-2 z-50 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                  {availableStatuses.map(
                                    (status) => (
                                      <button
                                        key={
                                          status
                                        }
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(
                                            reservation.id,
                                            status
                                          )
                                        }
                                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                                          reservation.status ===
                                          status
                                            ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                                        }`}
                                      >
                                        {
                                          status
                                        }

                                        {reservation.status ===
                                          status && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                        )}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic font-medium">
                              Locked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  Math.max(
                    currentPage - 1,
                    1
                  )
                )
              }
              disabled={page === 1}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Previous
            </button>

            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Page {page} of{' '}
              {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(
                    currentPage + 1,
                    totalPages
                  )
                )
              }
              disabled={
                page === totalPages
              }
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/*
       * Create Reservation Modal
       */}
      {isCreateReservationOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Create Reservation
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Create a reservation for a customer.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateReservationModal
                }
                disabled={creatingReservation}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={
                handleCreateReservation
              }
              className="p-6 space-y-5"
            >
              {loadingReservationOptions ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>

                    Loading customers and vehicles...
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Customer
                    </label>

                    <select
                      name="customerId"
                      value={
                        reservationForm.customerId
                      }
                      onChange={
                        handleReservationFormChange
                      }
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="">
                        Select a customer
                      </option>

                      {reservationCustomers.map(
                        (customer) => {
                          const hasAccount =
                            customer.userAccount !==
                            null;

                          return (
                            <option
                              key={customer.id}
                              value={customer.id}
                            >
                              {
                                customer.firstName
                              }{' '}
                              {
                                customer.lastName
                              }{' '}
                              —{' '}
                              {hasAccount
                                ? 'Account exists'
                                : 'No account'}
                            </option>
                          );
                        }
                      )}
                    </select>

                    {reservationForm.customerId &&
                      (() => {
                        const selectedCustomer =
                          reservationCustomers.find(
                            (customer) =>
                              customer.id ===
                              reservationForm.customerId
                          );

                        if (!selectedCustomer) {
                          return null;
                        }

                        const hasAccount =
                          selectedCustomer.userAccount !==
                          null;

                        return (
                          <div
                            className={`mt-2 rounded-lg px-3 py-2 text-xs ${
                              hasAccount
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {hasAccount
                              ? 'This customer has an account.'
                              : 'This is a physical customer without an account. No User account will be created.'}
                          </div>
                        );
                      })()}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Vehicle
                    </label>

                    <select
                      name="vehicleId"
                      value={
                        reservationForm.vehicleId
                      }
                      onChange={
                        handleReservationFormChange
                      }
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="">
                        Select a vehicle
                      </option>

                      {reservationVehicles.map(
                        (vehicle) => (
                          <option
                            key={vehicle.id}
                            value={vehicle.id}
                          >
                            {vehicle.brand}{' '}
                            {vehicle.model}
                            {' — '}
                            {vehicle.licensePlate ||
                              vehicle.registrationNumber ||
                              vehicle.id}
                          </option>
                        )
                      )}
                    </select>

                    {reservationVehicles.length ===
                      0 && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        No available vehicles found.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        Start Date
                      </label>

                      <input
                        type="datetime-local"
                        name="startDate"
                        value={
                          reservationForm.startDate
                        }
                        onChange={
                          handleReservationFormChange
                        }
                        required
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        End Date
                      </label>

                      <input
                        type="datetime-local"
                        name="endDate"
                        value={
                          reservationForm.endDate
                        }
                        min={
                          reservationForm.startDate
                        }
                        onChange={
                          handleReservationFormChange
                        }
                        required
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Deposit Amount
                    </label>

                    <input
                      type="number"
                      name="depositAmount"
                      min="0"
                      step="0.01"
                      value={
                        reservationForm.depositAmount
                      }
                      onChange={
                        handleReservationFormChange
                      }
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={
                    closeCreateReservationModal
                  }
                  disabled={
                    creatingReservation
                  }
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingReservation ||
                    loadingReservationOptions
                  }
                  className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingReservation
                    ? 'Creating...'
                    : 'Create Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen &&
        selectedUserId && (
          <KycStatusModal
            isOpen={isModalOpen}
            onClose={() =>
              setIsModalOpen(false)
            }
            userId={selectedUserId}
            currentStatus={
              selectedUserKyc
            }
            onUpdateStatus={
              handleKycUpdate
            }
          />
        )}
    </div>
  );
};