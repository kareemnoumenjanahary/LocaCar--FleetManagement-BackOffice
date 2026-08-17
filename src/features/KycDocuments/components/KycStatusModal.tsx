import React from 'react';

interface KycStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | number;
  currentStatus: string;
  onUpdateStatus: (newStatus: string) => void;
}

export const KycStatusModal: React.FC<KycStatusModalProps> = ({ 
  isOpen, onClose, currentStatus, onUpdateStatus 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">KYC Verification Status</h3>
        
        <p className="text-sm text-slate-600 mb-6">
          Current status: <span className="font-semibold uppercase">{currentStatus}</span>
        </p>

        <div className="space-y-3">
          <button 
            onClick={() => onUpdateStatus('VERIFIED')}
            className="w-full py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold"
          >
            Mark as VERIFIED
          </button>
          <button 
            onClick={() => onUpdateStatus('REJECTED')}
            className="w-full py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold"
          >
            Mark as REJECTED
          </button>
          <button 
            onClick={onClose}
            className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};