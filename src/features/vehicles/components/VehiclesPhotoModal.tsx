import React, { useState, useEffect } from 'react';
import { api } from '../../../shared/api/axiosInstance';

interface VehiclePhotoModalProps {
  vehicleId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface VehiclePhoto {
  id: string | number;
  url?: string;
  filePath?: string;
  photoUrl?: string;
  viewType: string;
  displayOrder: number;
}

export const VehiclePhotoModal: React.FC<VehiclePhotoModalProps> = ({
  vehicleId,
  onClose,
  onSuccess,
  onError,
}) => {
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [viewType, setViewType] = useState('FRONT');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  const fetchPhotos = async () => {
    if (!vehicleId) return;
    setLoading(true);
    try {
      const response = await api.get(`/vehicles/${vehicleId}/photos`).catch(() => 
        api.get('/vehicle-photos', { params: { vehicleId } }).catch(() => ({ data: [] }))
      );
      
      const data = response?.data;
      let parsedPhotos: VehiclePhoto[] = [];

      if (Array.isArray(data)) {
        parsedPhotos = data;
      } else if (data && Array.isArray(data.data)) {
        parsedPhotos = data.data;
      } else if (data && Array.isArray(data['hydra:member'])) {
        parsedPhotos = data['hydra:member'];
      } else if (data && Array.isArray(data.items)) {
        parsedPhotos = data.items;
      }

      setPhotos(parsedPhotos);
    } catch (err) {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      fetchPhotos();
    }
  }, [vehicleId]);

  const getImageUrl = (photo: VehiclePhoto) => {
    if (photo.url) return photo.url;
    
    const path = photo.filePath || photo.photoUrl;
    
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

  const handleDeletePhoto = async (photoId: string | number) => {
    try {
      await api.delete(`/vehicle-photos/${photoId}`);
      onSuccess('Photo deleted successfully!');
      setDeleteConfirmId(null);
      if (editingPhotoId === photoId) handleCancelEdit();
      fetchPhotos();
    } catch (err) {
      onError('Failed to delete photo.');
    }
  };

  const handleStartEdit = (photo: VehiclePhoto) => {
    setEditingPhotoId(photo.id);
    setViewType(photo.viewType || 'FRONT');
    setDisplayOrder(photo.displayOrder || 0);
    setPhotoFile(null);
  };

  const handleCancelEdit = () => {
    setEditingPhotoId(null);
    setViewType('FRONT');
    setDisplayOrder(0);
    setPhotoFile(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('vehicleId', vehicleId);
    formData.append('viewType', viewType);
    formData.append('displayOrder', displayOrder.toString());
    if (photoFile) {
      formData.append('file', photoFile);
    }

    setUploading(true);
    try {
      if (editingPhotoId) {
        await api.post(`/vehicle-photos/${editingPhotoId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onSuccess('Photo updated successfully!');
      } else {
        if (!photoFile) {
          onError('Please select an image file.');
          setUploading(false);
          return;
        }
        await api.post('/vehicle-photos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onSuccess('Photo added successfully!');
      }

      handleCancelEdit();
      fetchPhotos();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto">
          
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-lg font-semibold text-slate-800">Manage Vehicle Photos</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Existing Photos</h4>
            {loading ? (
              <p className="text-sm text-slate-400">Loading photos...</p>
            ) : photos.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No photos uploaded for this vehicle yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {photos.map((photo, index) => {
                  const imgUrl = getImageUrl(photo);
                  const isEditingThis = editingPhotoId === photo.id;
                  const isConfirmingDelete = deleteConfirmId === photo.id;

                  return (
                    <div 
                      key={photo.id || index} 
                      className={`flex items-center justify-between p-3 bg-slate-50 border rounded-xl transition ${
                        isEditingThis ? 'border-purple-500 ring-2 ring-purple-100 bg-purple-50/30' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => imgUrl && setSelectedPreviewUrl(imgUrl)}
                          className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition group relative"
                        >
                          {imgUrl ? (
                            <img 
                              src={imgUrl} 
                              alt={photo.viewType || 'Vehicle'} 
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <span className="text-xs text-slate-400">IMG</span>
                          )}
                        </button>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{photo.viewType}</p>
                          <p className="text-xs text-slate-500">Order: {photo.displayOrder}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                            <span className="text-[10px] text-red-600 font-bold px-1">Delete?</span>
                            <button 
                              type="button" 
                              onClick={() => handleDeletePhoto(photo.id)} 
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
                            <button type="button" onClick={() => handleStartEdit(photo)} className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition">Edit</button>
                            <button type="button" onClick={() => setDeleteConfirmId(photo.id)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition">Delete</button>
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
                {editingPhotoId ? 'Edit Selected Photo' : 'Add New Photo'}
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">View Type</label>
                <select value={viewType} onChange={(e) => setViewType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="FRONT">Front</option>
                  <option value="BACK">Back</option>
                  <option value="SIDE">Side</option>
                  <option value="INTERIOR">Interior</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Display Order</label>
                <input type="number" min={0} value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Image File</label>
              <input type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => e.target.files && setPhotoFile(e.target.files[0])} required={!editingPhotoId} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm transition">Close</button>
              <button type="submit" disabled={uploading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-md transition disabled:opacity-50">
                {uploading ? 'Saving...' : editingPhotoId ? 'Update Photo' : 'Upload & Add'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {selectedPreviewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedPreviewUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedPreviewUrl} alt="Vehicle preview" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </>
  );
};