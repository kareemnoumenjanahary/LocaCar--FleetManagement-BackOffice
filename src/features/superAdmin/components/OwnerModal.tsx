import React, { useEffect, useState } from 'react';
import { api } from '../../../shared/api/axiosInstance';

interface OwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ownerToEdit?: any | null; // <-- Ajouté ici pour résoudre l'erreur TypeScript
}

export const OwnerModal: React.FC<OwnerModalProps> = ({ isOpen, onClose, onSuccess, ownerToEdit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'ROLE_OWNER',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ownerToEdit) {
      const nameParts = ownerToEdit.fullName ? ownerToEdit.fullName.split(' ') : ['', ''];
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: ownerToEdit.email || '',
        phone: ownerToEdit.phone || '',
        address: ownerToEdit.address || '',
        password: '', // Laisser vide pour ne pas écraser
        role: ownerToEdit.role || 'ROLE_OWNER',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        role: 'ROLE_OWNER',
      });
    }
  }, [ownerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (ownerToEdit) {
        await api.put(`/admin/management/${ownerToEdit.id}`, formData);
      } else {
        await api.post('/admin/management', formData);
      }
      onSuccess();
    } catch (err: any) {
      console.error("Erreur sauvegarde owner :", err);
      setFormError(err.response?.data?.message || 'Operation failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white">
            {ownerToEdit ? 'Edit Owner' : 'Add New Owner'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
        </div>

        {formError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              >
                <option value="ROLE_OWNER">ROLE_OWNER</option>
                <option value="ROLE_SUPER_ADMIN">ROLE_SUPER_ADMIN</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Password {ownerToEdit && '(Leave blank to keep current)'}
            </label>
            <input
              type="password"
              required={!ownerToEdit}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : ownerToEdit ? 'Update Owner' : 'Create Owner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};