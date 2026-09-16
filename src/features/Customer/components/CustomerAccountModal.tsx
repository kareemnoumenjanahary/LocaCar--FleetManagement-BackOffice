import React, { useState } from 'react';
import { X, UserPlus, UserRoundCheck, Loader2 } from 'lucide-react';
import { api } from '../../../shared/api/axiosInstance';

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

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
  mode: 'create-customer' | 'create-account';
  isDarkMode: boolean;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customer = null,
  mode,
  isDarkMode,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) {
    return null;
  }

  const isCreateCustomer = mode === 'create-customer';

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setDrivingLicenseNumber('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleCreateCustomer = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload: {
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string;
        address: string | null;
        drivingLicenseNumber: string | null;
      } = {
        firstName,
        lastName,
        email: email.trim() === '' ? null : email,
        phone,
        address: address.trim() === '' ? null : address,
        drivingLicenseNumber:
          drivingLicenseNumber.trim() === ''
            ? null
            : drivingLicenseNumber,
      };

      await api.post('/admin/customers', payload);

      setSuccess('Customer created successfully.');

      setTimeout(() => {
        onSuccess();
        resetForm();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          'An error occurred while creating the customer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!customer) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post(
        `/admin/customers/${customer.id}/account`
      );

      setSuccess(
        response?.data?.message ||
          'The account was created successfully and the login credentials were sent by email.'
      );

      setTimeout(() => {
        onSuccess();
        resetForm();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          'An error occurred while creating the account.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = isDarkMode
    ? 'w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-orange-500'
    : 'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500';

  const labelClass = isDarkMode
    ? 'mb-2 block text-sm font-medium text-gray-300'
    : 'mb-2 block text-sm font-medium text-gray-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl shadow-2xl ${
          isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <div
          className={`flex items-center justify-between border-b px-6 py-5 ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500">
              {isCreateCustomer ? (
                <UserPlus size={22} />
              ) : (
                <UserRoundCheck size={22} />
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                {isCreateCustomer
                  ? 'Create Customer'
                  : 'Create Customer Account'}
              </h2>

              <p
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {isCreateCustomer
                  ? 'Individual customer without an account'
                  : 'Account creation request'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className={`rounded-lg p-2 transition ${
              isDarkMode
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <X size={22} />
          </button>
        </div>

        {isCreateCustomer ? (
          <form onSubmit={handleCreateCustomer} className="p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First Name"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last Name"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="customer@email.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Phone *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+261..."
                  required
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Customer address"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Driving License Number
                </label>
                <input
                  type="text"
                  value={drivingLicenseNumber}
                  onChange={(event) =>
                    setDrivingLicenseNumber(event.target.value)
                  }
                  placeholder="Driving license number"
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-500">
                {success}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className={`rounded-lg px-5 py-3 font-medium transition ${
                  isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Creating...' : 'Create Customer'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            {customer && (
              <>
                <div
                  className={`rounded-xl border p-5 ${
                    isDarkMode
                      ? 'border-gray-800 bg-gray-800/50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <h3 className="mb-4 text-lg font-semibold">
                    Customer Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      >
                        First Name
                      </p>
                      <p className="font-medium">{customer.firstName}</p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      >
                        Last Name
                      </p>
                      <p className="font-medium">{customer.lastName}</p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      >
                        Email
                      </p>
                      <p className="font-medium">
                        {customer.email || 'No email'}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      >
                        Phone
                      </p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-orange-500/30 bg-orange-500/10 p-5">
                  <h3 className="font-semibold text-orange-500">
                    Account Creation
                  </h3>

                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    A temporary password will be generated automatically and
                    sent to the customer's email address.
                  </p>

                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    The customer will have to change this password on their
                    first login.
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-500">
                {success}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className={`rounded-lg px-5 py-3 font-medium transition ${
                  isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={loading || !customer?.email}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

