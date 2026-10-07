import React, { useEffect, useState } from 'react';
import { api } from '../../../shared/api/axiosInstance';

interface OwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ownerToEdit?: any | null;
}

export const OwnerModal: React.FC<OwnerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ownerToEdit,
}) => {
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
      setFormData({
        firstName: ownerToEdit.firstName || '',
        lastName: ownerToEdit.lastName || '',
        email: ownerToEdit.email || '',
        phone: ownerToEdit.phone || '',
        address: ownerToEdit.address || '',
        password: '',
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

    setFormError('');
  }, [ownerToEdit, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError('');
    setSubmitting(true);

    try {
      if (ownerToEdit) {
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          role: formData.role,
        };

        if (formData.password.trim() !== '') {
          updateData.password = formData.password;
        }

        await api.put(
          `/admin/management/${ownerToEdit.id}`,
          updateData
        );
      } else {
        await api.post(
          '/admin/management',
          formData
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving owner:', err);

      const validationErrors =
        err.response?.data?.detail ||
        err.response?.data?.message;

      setFormError(
        validationErrors ||
        'Operation failed. Please check your inputs.'
      );
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

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {formError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
            {formError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">
                First Name
              </label>

              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    firstName: e.target.value,
                  })
                }
                className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">
                Last Name
              </label>

              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastName: e.target.value,
                  })
                }
                className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Email Address
            </label>

            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
              className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Address
            </label>

            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: e.target.value,
                })
              }
              className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">
                Phone
              </label>

              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value,
                  })
                }
                className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">
                Role
              </label>

              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value,
                  })
                }
                className="w-full mt-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              >
                <option value="ROLE_OWNER">
                  ROLE_OWNER
                </option>

                <option value="ROLE_SUPER_ADMIN">
                  ROLE_SUPER_ADMIN
                </option>
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
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
              {submitting
                ? 'Saving...'
                : ownerToEdit
                  ? 'Update Owner'
                  : 'Create Owner'}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};