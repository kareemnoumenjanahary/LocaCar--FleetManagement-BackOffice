import React, { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { api } from '../../../shared/api/axiosInstance';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string | number;
  maxAgencies: number;
  maxVehicles: number;
  isDeleted: boolean;
  deletedAt?: string | null;
}

interface PlanForm {
  name: string;
  price: string;
  maxAgencies: string;
  maxVehicles: string;
}

interface SubscriptionPlansManagementProps {
  isDarkMode: boolean;
}

const emptyForm: PlanForm = {
  name: '',
  price: '',
  maxAgencies: '1',
  maxVehicles: '5',
};

export const SubscriptionPlansManagement: React.FC<SubscriptionPlansManagementProps> = ({
  isDarkMode,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/subscription-plans');
      setPlans(response.data.plans ?? response.data ?? []);
    } catch (err) {
      console.error(err);
      setError('Unable to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const visiblePlans = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return plans.filter((plan) => {
      const matchesArchive = showArchived || !plan.isDeleted;
      const matchesSearch = plan.name.toLowerCase().includes(term);
      return matchesArchive && matchesSearch;
    });
  }, [plans, searchTerm, showArchived]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: String(plan.price),
      maxAgencies: String(plan.maxAgencies),
      maxVehicles: String(plan.maxVehicles),
    });
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) setIsModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name.trim(),
      price: form.price,
      maxAgencies: Number(form.maxAgencies),
      maxVehicles: Number(form.maxVehicles),
    };

    try {
      if (editingPlan) {
        await api.patch(`/admin/subscription-plans/${editingPlan.id}`, payload);
        setSuccess('Plan updated successfully.');
      } else {
        await api.post('/admin/subscription-plans', payload);
        setSuccess('Plan created successfully.');
      }

      setIsModalOpen(false);
      await loadPlans();
    } catch (err) {
      console.error(err);
      setError('An error occurred while saving the plan.');
    } finally {
      setSaving(false);
    }
  };

  const archivePlan = async (plan: SubscriptionPlan) => {
    if (!window.confirm(`Archive plan “${plan.name}”?`)) return;

    try {
      setError('');
      await api.delete(`/admin/subscription-plans/${plan.id}`);
      setSuccess('Plan archived successfully.');
      await loadPlans();
    } catch (err) {
      console.error(err);
      setError('Unable to archive this plan.');
    }
  };

  const restorePlan = async (plan: SubscriptionPlan) => {
    try {
      setError('');
      await api.patch(`/admin/subscription-plans/${plan.id}`, { deleted: false });
      setSuccess('Plan restored successfully.');
      await loadPlans();
    } catch (err) {
      console.error(err);
      setError('Unable to restore this plan.');
    }
  };

  const inputClass = `w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${
    isDarkMode
      ? 'border-slate-800 bg-slate-950 text-white focus:border-blue-500'
      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500'
  }`;

  return (
    <section
      className={`rounded-2xl border p-6 shadow-lg ${
        isDarkMode
          ? 'border-slate-800 bg-slate-950/60 text-slate-100'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold">Plan Management</h2>
          <p className={isDarkMode ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>
            Create, edit, archive, or restore available plans.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" /> New Plan
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search for a plan..."
            className={`${inputClass} pl-10`}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowArchived((value) => !value)}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
            showArchived
              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
              : isDarkMode
                ? 'border-slate-800 text-slate-300'
                : 'border-slate-200 text-slate-700'
          }`}
        >
          {showArchived ? 'Hide archived plans' : 'Show archived plans'}
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      {success && <p className="mb-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-400">{success}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading plans...</p>
      ) : visiblePlans.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No plans found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className={`border-b text-xs uppercase ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Agencies</th>
                <th className="px-4 py-3">Vehicles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePlans.map((plan) => (
                <tr key={plan.id} className={`border-b ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                  <td className="px-4 py-4 font-semibold">{plan.name}</td>
                  <td className="px-4 py-4">{Number(plan.price).toFixed(2)} €</td>
                  <td className="px-4 py-4">{plan.maxAgencies}</td>
                  <td className="px-4 py-4">{plan.maxVehicles}</td>
                  <td className="px-4 py-4">
                    <span className={plan.isDeleted ? 'text-red-400' : 'text-emerald-400'}>
                      {plan.isDeleted ? 'Archived' : 'Active'}
                    </span>
                  </td>
                  <td className="space-x-2 px-4 py-4 text-right">
                    <button type="button" onClick={() => openEditModal(plan)} className="text-blue-400 hover:text-blue-300" title="Edit">
                      <Pencil className="inline h-4 w-4" />
                    </button>
                    {plan.isDeleted ? (
                      <button type="button" onClick={() => restorePlan(plan)} className="text-emerald-400 hover:text-emerald-300" title="Restore">
                        <RotateCcw className="inline h-4 w-4" />
                      </button>
                    ) : (
                      <button type="button" onClick={() => archivePlan(plan)} className="text-red-400 hover:text-red-300" title="Archiver">
                        <Trash2 className="inline h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDarkMode ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingPlan ? 'Edit le plan' : 'Create Plan'}</h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name du plan" className={inputClass} />
              <input required min="0" step="0.01" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" className={inputClass} />
              <input required min="0" step="1" type="number" value={form.maxAgencies} onChange={(e) => setForm({ ...form, maxAgencies: e.target.value })} placeholder="Namebre maximal d'agences" className={inputClass} />
              <input required min="0" step="1" type="number" value={form.maxVehicles} onChange={(e) => setForm({ ...form, maxVehicles: e.target.value })} placeholder="Namebre maximal de véhicules" className={inputClass} />

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button type="button" onClick={closeModal} className="rounded-xl border border-slate-700 px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
