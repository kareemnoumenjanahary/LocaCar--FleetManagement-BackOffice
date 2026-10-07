import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  Eye,
  Mail,
  Search,
  X,
} from 'lucide-react';
import { api } from '../../../shared/api/axiosInstance';

interface CustomSubscriptionRequest {
  id: string;
  ownerId: string;
  requestedMaxAgencies: number;
  requestedMaxVehicles: number;
  message: string | null;
  customPrice: string | null;
  customMaxAgencies: number | null;
  customMaxVehicles: number | null;
  status: 'PENDING' | 'OFFERED' | 'REJECTED' | 'ACCEPTED';
  createdAt: string;
  updatedAt: string | null;
}

interface CustomSubscriptionRequestsProps {
  isDarkMode: boolean;
}

export const CustomSubscriptionRequests: React.FC<
  CustomSubscriptionRequestsProps
> = ({ isDarkMode }) => {
  const [requests, setRequests] = useState<
    CustomSubscriptionRequest[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedRequest, setSelectedRequest] =
    useState<CustomSubscriptionRequest | null>(null);

  const [isOfferModalOpen, setIsOfferModalOpen] =
    useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] =
    useState(false);

  const [customPrice, setCustomPrice] = useState('');
  const [customMaxAgencies, setCustomMaxAgencies] =
    useState('');
  const [customMaxVehicles, setCustomMaxVehicles] =
    useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        '/admin/custom-subscription-requests'
      );

      setRequests(response.data);
    } catch (error) {
      console.error(
        'Error while fetching custom subscription requests:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((request) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      request.id.toLowerCase().includes(search) ||
      request.ownerId.toLowerCase().includes(search) ||
      request.message?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === 'ALL' ||
      request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openOfferModal = (
    request: CustomSubscriptionRequest
  ) => {
    setSelectedRequest(request);
    setCustomPrice(request.customPrice ?? '');
    setCustomMaxAgencies(
      request.customMaxAgencies?.toString() ?? ''
    );
    setCustomMaxVehicles(
      request.customMaxVehicles?.toString() ?? ''
    );
    setIsOfferModalOpen(true);
  };

  const handleOffer = async () => {
    if (!selectedRequest) {
      return;
    }

    if (
      !customPrice ||
      !customMaxAgencies ||
      !customMaxVehicles
    ) {
      return;
    }

    try {
      setSubmitting(true);

      await api.patch(
        `/admin/custom-subscription-requests/${selectedRequest.id}/respond`,
        {
          status: 'OFFERED',
          customPrice: Number(customPrice),
          customMaxAgencies: Number(customMaxAgencies),
          customMaxVehicles: Number(customMaxVehicles),
        }
      );

      setIsOfferModalOpen(false);
      setSelectedRequest(null);

      await fetchRequests();
    } catch (error) {
      console.error(
        'Error while sending custom subscription offer:',
        error
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (
    request: CustomSubscriptionRequest
  ) => {
    try {
      setSubmitting(true);

      await api.patch(
        `/admin/custom-subscription-requests/${request.id}/respond`,
        {
          status: 'REJECTED',
        }
      );

      await fetchRequests();
    } catch (error) {
      console.error(
        'Error while rejecting custom subscription request:',
        error
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'PENDING':
        return isDarkMode
          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          : 'bg-yellow-50 text-yellow-700 border-yellow-200';

      case 'OFFERED':
        return isDarkMode
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          : 'bg-blue-50 text-blue-700 border-blue-200';

      case 'ACCEPTED':
        return isDarkMode
          ? 'bg-green-500/10 text-green-400 border-green-500/20'
          : 'bg-green-50 text-green-700 border-green-200';

      case 'REJECTED':
        return isDarkMode
          ? 'bg-red-500/10 text-red-400 border-red-500/20'
          : 'bg-red-50 text-red-700 border-red-200';

      default:
        return isDarkMode
          ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
          : 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <>
      <section
        className={`border rounded-2xl p-6 shadow-lg space-y-6 ${
          isDarkMode
            ? 'bg-slate-950/60 border-slate-800'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2
              className={`text-lg font-bold ${
                isDarkMode
                  ? 'text-white'
                  : 'text-slate-900'
              }`}
            >
              ⚙️ Custom Subscription Requests
            </h2>

            <p
              className={`text-sm mt-1 ${
                isDarkMode
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              Review and manage custom subscription requests.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search
                size={16}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDarkMode
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              />

              <input
                type="text"
                placeholder="Search request..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                className={`w-full sm:w-64 pl-9 pr-3 py-2 rounded-xl text-sm border outline-none ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className={`appearance-none w-full sm:w-36 px-3 pr-8 py-2 rounded-xl text-sm border outline-none ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="OFFERED">Offered</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div
            className={`text-center py-10 text-sm ${
              isDarkMode
                ? 'text-slate-500'
                : 'text-slate-400'
            }`}
          >
            Loading custom subscription requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div
            className={`border border-dashed rounded-xl p-8 text-center text-sm ${
              isDarkMode
                ? 'border-slate-800 text-slate-500'
                : 'border-slate-300 text-slate-400'
            }`}
          >
            No custom subscription requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode
                      ? 'text-slate-500 border-b border-slate-800'
                      : 'text-slate-400 border-b border-slate-200'
                  }`}
                >
                  <th className="pb-3 pr-4">Owner</th>
                  <th className="pb-3 pr-4">Request</th>
                  <th className="pb-3 pr-4">Offer</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody
                className={`divide-y ${
                  isDarkMode
                    ? 'divide-slate-800'
                    : 'divide-slate-200'
                }`}
              >
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="py-4 pr-4">
                      <div
                        className={`text-sm font-medium ${
                          isDarkMode
                            ? 'text-white'
                            : 'text-slate-900'
                        }`}
                      >
                        {request.ownerId}
                      </div>

                      <div
                        className={`text-xs mt-1 ${
                          isDarkMode
                            ? 'text-slate-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {new Date(
                          request.createdAt
                        ).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-4 pr-4">
                      <div
                        className={`text-sm ${
                          isDarkMode
                            ? 'text-slate-300'
                            : 'text-slate-700'
                        }`}
                      >
                        {request.requestedMaxAgencies}{' '}
                        agencies
                      </div>

                      <div
                        className={`text-xs mt-1 ${
                          isDarkMode
                            ? 'text-slate-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {request.requestedMaxVehicles}{' '}
                        vehicles
                      </div>
                    </td>

                    <td className="py-4 pr-4">
                      {request.customPrice ? (
                        <>
                          <div
                            className={`text-sm font-semibold ${
                              isDarkMode
                                ? 'text-white'
                                : 'text-slate-900'
                            }`}
                          >
                            {request.customPrice} Ar
                          </div>

                          <div
                            className={`text-xs mt-1 ${
                              isDarkMode
                                ? 'text-slate-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {request.customMaxAgencies}{' '}
                            agencies ·{' '}
                            {request.customMaxVehicles}{' '}
                            vehicles
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">
                          —
                        </span>
                      )}
                    </td>

                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusClasses(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>

                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDetailsModalOpen(true);
                          }}
                          className={`p-2 rounded-lg transition ${
                            isDarkMode
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>

                        {request.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openOfferModal(request)
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                            >
                              <Mail size={14} />
                              Offer
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleReject(request)
                              }
                              disabled={submitting}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              <X size={14} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isOfferModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl ${
              isDarkMode
                ? 'bg-slate-950 border border-slate-800'
                : 'bg-white border border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-lg font-bold ${
                    isDarkMode
                      ? 'text-white'
                      : 'text-slate-900'
                  }`}
                >
                  Send Custom Offer
                </h3>

                <p
                  className={`text-sm mt-1 ${
                    isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  The owner will receive this offer by email.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsOfferModalOpen(false)
                }
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? 'hover:bg-slate-800 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}
                >
                  Price (Ar)
                </label>

                <input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={(event) =>
                    setCustomPrice(event.target.value)
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}
                >
                  Maximum agencies
                </label>

                <input
                  type="number"
                  min="1"
                  value={customMaxAgencies}
                  onChange={(event) =>
                    setCustomMaxAgencies(
                      event.target.value
                    )
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}
                >
                  Maximum vehicles
                </label>

                <input
                  type="number"
                  min="1"
                  value={customMaxVehicles}
                  onChange={(event) =>
                    setCustomMaxVehicles(
                      event.target.value
                    )
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() =>
                  setIsOfferModalOpen(false)
                }
                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleOffer}
                disabled={
                  submitting ||
                  !customPrice ||
                  !customMaxAgencies ||
                  !customMaxVehicles
                }
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                <Check size={16} />
                {submitting
                  ? 'Sending...'
                  : 'Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl ${
              isDarkMode
                ? 'bg-slate-950 border border-slate-800'
                : 'bg-white border border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-bold ${
                  isDarkMode
                    ? 'text-white'
                    : 'text-slate-900'
                }`}
              >
                Request Details
              </h3>

              <button
                type="button"
                onClick={() =>
                  setIsDetailsModalOpen(false)
                }
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? 'hover:bg-slate-800 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="font-semibold">
                  Request ID:
                </span>{' '}
                {selectedRequest.id}
              </div>

              <div>
                <span className="font-semibold">
                  Owner ID:
                </span>{' '}
                {selectedRequest.ownerId}
              </div>

              <div>
                <span className="font-semibold">
                  Requested agencies:
                </span>{' '}
                {selectedRequest.requestedMaxAgencies}
              </div>

              <div>
                <span className="font-semibold">
                  Requested vehicles:
                </span>{' '}
                {selectedRequest.requestedMaxVehicles}
              </div>

              <div>
                <span className="font-semibold">
                  Message:
                </span>

                <p
                  className={`mt-1 ${
                    isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  {selectedRequest.message || 'No message.'}
                </p>
              </div>

              <div>
                <span className="font-semibold">
                  Status:
                </span>{' '}
                {selectedRequest.status}
              </div>

              {selectedRequest.customPrice && (
                <div>
                  <span className="font-semibold">
                    Offer:
                  </span>{' '}
                  {selectedRequest.customPrice} Ar / 30 days
                </div>
              )}

              {selectedRequest.customMaxAgencies && (
                <div>
                  <span className="font-semibold">
                    Offer agencies:
                  </span>{' '}
                  {selectedRequest.customMaxAgencies}
                </div>
              )}

              {selectedRequest.customMaxVehicles && (
                <div>
                  <span className="font-semibold">
                    Offer vehicles:
                  </span>{' '}
                  {selectedRequest.customMaxVehicles}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};