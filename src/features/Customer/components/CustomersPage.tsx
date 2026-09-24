import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  UserRound,
  UserRoundCheck,
  Loader2,
  Mail,
  Phone,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../../shared/api/axiosInstance';
import { CustomerAccountModal } from './CustomerAccountModal';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  address: string | null;
  drivingLicenseNumber: string | null;
  userAccount?: {
    id: string;
    email: string;
  } | null;
}

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [accountFilter, setAccountFilter] = useState<
    'all' | 'with-account' | 'without-account'
  >('all');

  const [isDark, setIsDark] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<
    'create-customer' | 'create-account'
  >('create-customer');

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/admin/customers');

      setCustomers(response.data.items || response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          'Unable to retrieve the customer list.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCreateCustomerModal = () => {
    setSelectedCustomer(null);
    setModalMode('create-customer');
    setIsModalOpen(true);
  };

  const openCreateAccountModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode('create-account');
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchCustomers();
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      customer.firstName.toLowerCase().includes(searchValue) ||
      customer.lastName.toLowerCase().includes(searchValue) ||
      customer.email?.toLowerCase().includes(searchValue) ||
      customer.phone.toLowerCase().includes(searchValue);

    const matchesAccountFilter =
      accountFilter === 'all' ||
      (accountFilter === 'with-account' &&
        customer.userAccount !== null) ||
      (accountFilter === 'without-account' &&
        !customer.userAccount);

    return matchesSearch && matchesAccountFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Customers
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage customers and their accounts
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateCustomerModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-medium text-white transition hover:bg-purple-700"
        >
          <Plus size={19} />
          New Customer
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-500">
              <UserRound size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Customers
              </p>

              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {customers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-500/10 p-3 text-green-500">
              <UserRoundCheck size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                With Account
              </p>

              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {
                  customers.filter(
                    (customer) => customer.userAccount !== null
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500">
              <UserRound size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Without Account
              </p>

              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {
                  customers.filter(
                    (customer) => !customer.userAccount
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for a customer..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="relative w-full md:w-56">
            <SlidersHorizontal
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purple-500"
            />

            <select
              value={accountFilter}
              onChange={(event) =>
                setAccountFilter(
                  event.target.value as
                    | 'all'
                    | 'with-account'
                    | 'without-account'
                )
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-purple-500"
            >
              <option value="all">All Customers</option>
              <option value="with-account">With Account</option>
              <option value="without-account">
                Without Account
              </option>
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Customer
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Contact
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Driving License
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Account
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                      <Loader2
                        size={20}
                        className="animate-spin"
                      />
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 font-semibold text-purple-500">
                          {customer.firstName
                            .charAt(0)
                            .toUpperCase()}
                          {customer.lastName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {customer.firstName}{' '}
                            {customer.lastName}
                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Individual Customer
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <Mail size={15} />
                          {customer.email || 'No email'}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <Phone size={15} />
                          {customer.phone}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700 dark:text-slate-300">
                      {customer.drivingLicenseNumber ||
                        'Not provided'}
                    </td>

                    <td className="px-6 py-5">
                      {customer.userAccount ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Active Account
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                          <span className="h-2 w-2 rounded-full bg-orange-500" />
                          No Account
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      {!customer.userAccount && (
                        <button
                          type="button"
                          onClick={() =>
                            openCreateAccountModal(customer)
                          }
                          disabled={!customer.email}
                          title={
                            !customer.email
                              ? 'Customer must have an email address'
                              : 'Create customer account'
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <UserRoundCheck size={17} />
                          Create Account
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        customer={selectedCustomer}
        mode={modalMode}
        isDarkMode={isDark}
      />
    </div>
  );
};