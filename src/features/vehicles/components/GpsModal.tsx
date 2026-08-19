import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {api} from '../../../shared/api/axiosInstance'; // <--- Importe ton instance Axios configurée (ajuste le chemin si besoin selon ton arborescence)

// Correction pour l'icône du marqueur Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface GpsModalProps {
    vehicleId: string;
    vehicleName?: string;
    onClose: () => void;
}

interface GpsPosition {
    id: string;
    latitude: string;
    longitude: string;
    recordedAt: string;
    gpsDeviceId: string;
    gpsDeviceSerialNumber: string;
}

export default function GpsModal({ vehicleId, vehicleName, onClose }: GpsModalProps) {
    const [position, setPosition] = useState<GpsPosition | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLatestPosition = async () => {
            try {
                setLoading(true);
                setError(null);

                // Utilisation de ton instance `api` : elle ajoute automatiquement le token 'admin_token'
                const response = await api.get<GpsPosition>(`/gps-positions/vehicle/${vehicleId}/latest`);

                setPosition(response.data);
            } catch (err: any) {
                if (err.response && err.response.status === 404) {
                    setError("Ce véhicule n'a pas encore bougé ou ne possède pas de position GPS enregistrée pour le moment.");
                } else if (err.response && err.response.status === 401) {
                    setError("Non autorisé. Veuillez vous reconnecter.");
                } else {
                    setError("Erreur lors de la récupération de la position GPS.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (vehicleId) {
            fetchLatestPosition();
        }
    }, [vehicleId]);

    const lat = position ? parseFloat(position.latitude) : -18.8792;
    const lng = position ? parseFloat(position.longitude) : 47.5079;
    const mapCenter: [number, number] = [lat, lng];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                        Suivi GPS {vehicleName ? `- ${vehicleName}` : ''}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 font-bold text-xl"
                    >
                        &times;
                    </button>
                </div>

                {loading && (
                    <div className="py-8 text-center text-gray-600">Chargement de la position...</div>
                )}

                {error && (
                    <div className="p-4 mb-4 text-sm text-yellow-800 bg-yellow-50 rounded-lg border border-yellow-200">
                        🚗 {error}
                    </div>
                )}

                {!loading && !error && position && (
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm grid grid-cols-2 gap-2">
                            <p><strong>Latitude :</strong> {position.latitude}</p>
                            <p><strong>Longitude :</strong> {position.longitude}</p>
                            <p><strong>Boîtier :</strong> {position.gpsDeviceSerialNumber}</p>
                            <p><strong>Mise à jour :</strong> {new Date(position.recordedAt).toLocaleTimeString()}</p>
                        </div>

                        <div className="h-80 w-full rounded-lg overflow-hidden border shadow-inner">
                            <MapContainer 
                                center={mapCenter} 
                                zoom={15} 
                                scrollWheelZoom={true} 
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={mapCenter}>
                                    <Popup>
                                        <strong>{vehicleName || 'Véhicule'}</strong> <br />
                                        Lat: {position.latitude}, Lng: {position.longitude}
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}