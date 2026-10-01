import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';
import { ChevronDown, X, CreditCard } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscription: {
    id: string;
    planName: string;
    status: string;
    customPrice?: string | null;
    customMaxAgencies?: number | null;
    customMaxVehicles?: number | null;
    owner?: {
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  } | null;
  isDarkMode: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subscription,
  isDarkMode,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [status, setStatus] = useState('');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const [customPrice, setCustomPrice] = useState('');
  const [customMaxAgencies, setCustomMaxAgencies] = useState('');
  const [customMaxVehicles, setCustomMaxVehicles] = useState('');

  const selectedPlan = plans.find(
    (plan) => plan.id === selectedPlanId
  );

  const isCustomPlan =
    selectedPlan?.name === 'CUSTOM'
    || (
      selectedPlanId === ''
      && subscription?.planName === 'CUSTOM'
    );

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get(
          '/admin/subscription-plans?active_only=true'
        );

        const plansData =
          response.data?.plans
          ?? response.data?.data
          ?? response.data;

        setPlans(
          Array.isArray(plansData)
            ? plansData
            : []
        );
      } catch (error) {
        console.error(
          'Error while loading subscription plans:',
          error
        );

        setPlans([]);
      }
    };

    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  useEffect(() => {
    if (subscription) {
      setStatus(subscription.status || 'ACTIVE');
      setSelectedPlanId('');

      setCustomPrice(
        subscription.customPrice ?? ''
      );

      setCustomMaxAgencies(
        subscription.customMaxAgencies !== null
        && subscription.customMaxAgencies !== undefined
          ? String(subscription.customMaxAgencies)
          : ''
      );

      setCustomMaxVehicles(
        subscription.customMaxVehicles !== null
        && subscription.customMaxVehicles !== undefined
          ? String(subscription.customMaxVehicles)
          : ''
      );
    }
  }, [subscription]);

  if (!isOpen || !subscription) {
    return null;
  }

  const handlePlanChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const planId = event.target.value;

    setSelectedPlanId(planId);

    const plan = plans.find(
      (item) => item.id === planId
    );

    if (plan?.name === 'STANDARD') {
      setCustomPrice('');
      setCustomMaxAgencies('');
      setCustomMaxVehicles('');
    }
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        status,
      };

      if (selectedPlanId !== '') {
        payload.planId = selectedPlanId;
      }

      if (isCustomPlan) {
        if (!customPrice.trim()) {
          alert('Custom price is required.');
          setLoading(false);
          return;
        }

        if (!customMaxAgencies.trim()) {
          alert(
            'Maximum agencies is required.'
          );
          setLoading(false);
          return;
        }

        if (!customMaxVehicles.trim()) {
          alert(
            'Maximum vehicles is required.'
          );
          setLoading(false);
          return;
        }

        const parsedPrice =
          Number(customPrice);

        const parsedMaxAgencies =
          Number(customMaxAgencies);

        const parsedMaxVehicles =
          Number(customMaxVehicles);

        if (
          Number.isNaN(parsedPrice)
          || parsedPrice < 0
        ) {
          alert(
            'Custom price must be a valid positive number.'
          );
          setLoading(false);
          return;
        }

        if (
          !Number.isInteger(parsedMaxAgencies)
          || parsedMaxAgencies < 0
        ) {
          alert(
            'Maximum agencies must be a valid positive integer.'
          );
          setLoading(false);
          return;
        }

        if (
          !Number.isInteger(parsedMaxVehicles)
          || parsedMaxVehicles < 0
        ) {
          alert(
            'Maximum vehicles must be a valid positive integer.'
          );
          setLoading(false);
          return;
        }

        payload.customPrice =
          parsedPrice.toFixed(2);

        payload.customMaxAgencies =
          parsedMaxAgencies;

        payload.customMaxVehicles =
          parsedMaxVehicles;
      }

      await api.patch(
        `/admin/subscriptions/${subscription.id}`,
        payload
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error(
        'Error while updating subscription:',
        error
      );

      alert(
        'Failed to update subscription.'
      );
    } finally {
      setLoading(false);
    }
  };

  const ownerName = subscription.owner
    ? `${subscription.owner.firstName} ${subscription.owner.lastName} (${subscription.owner.email})`
    : 'Unknown owner';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl border shadow-2xl transition-all ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-lg font-bold">
                Manage Subscription
              </h3>

              <p
                className={`text-xs ${
                  isDarkMode
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}
              >
                Update the owner subscription
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Owner */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDarkMode
                  ? 'text-slate-400'
                  : 'text-slate-600'
              }`}
            >
              Owner
            </label>

            <div
              className={`w-full px-4 py-2.5 rounded-xl text-sm border ${
                isDarkMode
                  ? 'bg-slate-950/50 border-slate-800 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {ownerName}
            </div>
          </div>

          {/* Subscription plan */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDarkMode
                  ? 'text-slate-400'
                  : 'text-slate-600'
              }`}
            >
              Subscription plan
            </label>

            <div className="group relative">
              <select
                value={selectedPlanId}
                onChange={handlePlanChange}
                className={`w-full appearance-none rounded-xl border px-4 py-3 pr-11 text-sm font-medium outline-none transition-all duration-200 ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-950 text-white shadow-inner shadow-black/20 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-900 shadow-sm hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              >
                <option value="">
                  Keep current ({subscription.planName})
                </option>

                {plans.map((plan) => (
                  <option
                    key={plan.id}
                    value={plan.id}
                  >
                    {plan.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                aria-hidden="true"
                className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform duration-200 group-focus-within:rotate-180 ${
                  isDarkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                }`}
              />
            </div>

            <p
              className={`text-[11px] mt-1 ${
                isDarkMode
                  ? 'text-slate-500'
                  : 'text-slate-400'
              }`}
            >
              Current plan:{' '}
              <span className="font-semibold text-emerald-400">
                {subscription.planName}
              </span>
            </p>
          </div>

          {/* Custom plan fields */}
          {isCustomPlan && (
            <div
              className={`space-y-4 rounded-xl border p-4 ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-950/50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div>
                <h4 className="text-sm font-semibold">
                  Custom plan settings
                </h4>

                <p
                  className={`text-xs mt-1 ${
                    isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  Configure the personalized subscription for this owner.
                </p>
              </div>

              {/* Custom price */}
              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                    isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  Custom price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice}
                  onChange={(event) =>
                    setCustomPrice(event.target.value)
                  }
                  placeholder="250000.00"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                    isDarkMode
                      ? 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>

              {/* Maximum agencies */}
              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                    isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  Maximum agencies
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customMaxAgencies}
                  onChange={(event) =>
                    setCustomMaxAgencies(event.target.value)
                  }
                  placeholder="5"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                    isDarkMode
                      ? 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>

              {/* Maximum vehicles */}
              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                    isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  Maximum vehicles
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customMaxVehicles}
                  onChange={(event) =>
                    setCustomMaxVehicles(event.target.value)
                  }
                  placeholder="100"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                    isDarkMode
                      ? 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDarkMode
                  ? 'text-slate-400'
                  : 'text-slate-600'
              }`}
            >
              Subscription status
            </label>

            <div className="group relative">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className={`w-full appearance-none rounded-xl border px-4 py-3 pr-11 text-sm font-medium outline-none transition-all duration-200 ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-950 text-white shadow-inner shadow-black/20 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-900 shadow-sm hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <ChevronDown
                aria-hidden="true"
                className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform duration-200 group-focus-within:rotate-180 ${
                  isDarkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                }`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                isDarkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Saving...'
                : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};