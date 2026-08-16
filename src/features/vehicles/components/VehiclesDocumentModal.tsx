import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';

interface VehicleDocumentModalProps {
  vehicleId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface VehicleDocument {
  id: string | number;
  url?: string;
  filePath?: string;
  documentUrl?: string;
  documentType: string;
  expirationDate?: string | null;
}

export const VehicleDocumentModal: React.FC<VehicleDocumentModalProps> = ({
  vehicleId,
  onClose,
  onSuccess,
  onError,
}) => {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  const fetchDocuments = async () => {
    if (!vehicleId) return;
    setLoading(true);
    try {
      const response = await api.get('/vehicle-documents', { 
        params: { vehicleId } 
      });
      
      const data = response?.data;
      let parsedDocs: VehicleDocument[] = [];

      if (Array.isArray(data)) {
        parsedDocs = data;
      } else if (data && Array.isArray(data.data)) {
        parsedDocs = data.data;
      } else if (data && Array.isArray(data['hydra:member'])) {
        parsedDocs = data['hydra:member'];
      } else if (data && Array.isArray(data.items)) {
        parsedDocs = data.items;
      }

      setDocuments(parsedDocs);
    } catch (err) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      fetchDocuments();
    }
  }, [vehicleId]);

  const getDocumentUrl = (doc: VehicleDocument) => {
    if (doc.url) return doc.url;
    
    const path = doc.filePath || doc.documentUrl;
    
    if (path) {
      if (path.startsWith('http')) return path;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      return `${baseUrl}${cleanPath}`;
    }
    return '';
  };

  if (!vehicleId || vehicleId === '') {
    return null;
  }

  const handleDeleteDocument = async (docId: string | number) => {
    try {
      await api.delete(`/vehicle-documents/${docId}`);
      onSuccess('Document deleted successfully!');
      setDeleteConfirmId(null);
      if (editingDocId === docId) handleCancelEdit();
      fetchDocuments();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete document.';
      onError(errorMsg);
    }
  };

  const handleStartEdit = (doc: VehicleDocument) => {
    setEditingDocId(doc.id);
    setDocumentType(doc.documentType || '');
    setExpirationDate(doc.expirationDate || '');
    setDocumentFile(null);
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    setDocumentType('');
    setExpirationDate('');
    setDocumentFile(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDocId && !documentFile) {
      onError('A file is required.');
      return;
    }

    const formData = new FormData();
    formData.append('vehicleId', vehicleId);
    formData.append('documentType', documentType);
    
    if (expirationDate) {
      formData.append('expirationDate', expirationDate);
    }
    
    if (documentFile) {
      formData.append('file', documentFile);
    }

    setUploading(true);
    try {
      if (editingDocId) {
        await api.post(`/vehicle-documents/${editingDocId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onSuccess('Document updated successfully!');
      } else {
        await api.post('/vehicle-documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onSuccess('Document uploaded successfully.');
      }

      handleCancelEdit();
      fetchDocuments();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Operation failed.';
      onError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto">
          
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-lg font-semibold text-slate-800">Manage Vehicle Documents</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Existing Documents</h4>
            {loading ? (
              <p className="text-sm text-slate-400">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No documents uploaded for this vehicle yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {documents.map((doc, index) => {
                  const docUrl = getDocumentUrl(doc);
                  const isEditingThis = editingDocId === doc.id;
                  const isConfirmingDelete = deleteConfirmId === doc.id;

                  return (
                    <div 
                      key={doc.id || index} 
                      className={`flex items-center justify-between p-3 bg-slate-50 border rounded-xl transition ${
                        isEditingThis ? 'border-purple-500 ring-2 ring-purple-100 bg-purple-50/30' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => docUrl && setSelectedPreviewUrl(docUrl)}
                          className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition group relative"
                        >
                          {docUrl ? (
                            <span className="text-xs font-bold text-slate-600">DOC</span>
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </button>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{doc.documentType}</p>
                          <p className="text-xs text-slate-500">
                            Expires: {doc.expirationDate ? doc.expirationDate : 'No expiration'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                            <span className="text-[10px] text-red-600 font-bold px-1">Delete?</span>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteDocument(doc.id)} 
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded"
                            >
                              Yes
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setDeleteConfirmId(null)} 
                              className="px-2 py-0.5 bg-slate-300 hover:bg-slate-400 text-slate-800 text-xs font-bold rounded"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleStartEdit(doc)} className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition">Edit</button>
                            <button type="button" onClick={() => setDeleteConfirmId(doc.id)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition">Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {editingDocId ? 'Edit Selected Document' : 'Upload New Document'}
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Document Type</label>
                <input 
                  type="text" 
                  maxLength={100} 
                  value={documentType} 
                  onChange={(e) => setDocumentType(e.target.value)} 
                  required 
                  placeholder="Insurance, Technical Inspection..." 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Expiration Date (Optional)</label>
                <input 
                  type="date" 
                  value={expirationDate} 
                  min={new Date().toISOString().split('T')[0]} 
                  onChange={(e) => setExpirationDate(e.target.value)} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Document File (PDF, JPEG, PNG, WEBP)</label>
              <input 
                type="file" 
                accept="application/pdf, image/jpeg, image/png, image/webp" 
                onChange={(e) => e.target.files && setDocumentFile(e.target.files[0])} 
                required={!editingDocId} 
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm transition">Close</button>
              <button type="submit" disabled={uploading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-md transition disabled:opacity-50">
                {uploading ? 'Saving...' : editingDocId ? 'Update Document' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {selectedPreviewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedPreviewUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <iframe src={selectedPreviewUrl} title="Document Preview" className="w-[80vw] h-[80vh] rounded-xl bg-white shadow-2xl" />
          </div>
        </div>
      )}
    </>
  );
};