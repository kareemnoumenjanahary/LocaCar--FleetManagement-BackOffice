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
    owner?: { firstName: string; lastName: string; email: string } | null;
  } | null;
  isDarkMode: boolean;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subscription,
  isDarkMode
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [status, setStatus] = useState('');
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger la liste des plans disponibles pour alimenter le select
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get('/admin/subscription-plans');

        // The API may return an array directly or wrap it in "plans" or "data".
        const plansData =
          response.data?.plans ?? response.data?.data ?? response.data;

        setPlans(Array.isArray(plansData) ? plansData : []);
      } catch (error) {
        console.error('Error while loading plans', error);
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
      setSelectedPlanId(''); // Réinitialisé pour ne modifier le plan que si l'admin le souhaite explicitement
    }
  }, [subscription]);

  if (!isOpen || !subscription) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/admin/subscriptions/${subscription.id}`, {
        // On n'envoie planId que s'il a été explicitement sélectionné (évite d'envoyer une chaîne vide)
        planId: selectedPlanId !== '' ? selectedPlanId : undefined,
        status,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l’abonnement', error);
    } finally {
      setLoading(false);
    }
  };

  const ownerName = subscription.owner 
    ? `${subscription.owner.firstName} ${subscription.owner.lastName} (${subscription.owner.email})` 
    : 'Propriétaire inconnu';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Gérer l'Abonnement</h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Modification de l'abonnement
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champ Propriétaire (Lecture seule) */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Propriétaire
            </label>
            <div className={`w-full px-4 py-2.5 rounded-xl text-sm border ${
              isDarkMode ? 'bg-slate-950/50 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              {ownerName}
            </div>
          </div>

          {/* Champ Plan d'abonnement (Modifiable via Select) */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Plan d'abonnement
            </label>
            <div className="group relative">
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className={`w-full appearance-none rounded-xl border px-4 py-3 pr-11 text-sm font-medium outline-none transition-all duration-200 ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-950 text-white shadow-inner shadow-black/20 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-900 shadow-sm hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              >
                <option value="">Keep current ({subscription.planName})</option>
                {Array.isArray(plans) && plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform duration-200 group-focus-within:rotate-180 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              />
            </div>
            <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Plan actuel : <span className="font-semibold text-emerald-400">{subscription.planName}</span>
            </p>
          </div>

          {/* Champ Statut (Modifiable) */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Statut de l'abonnement
            </label>
            <div className="group relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center space-x-2"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
