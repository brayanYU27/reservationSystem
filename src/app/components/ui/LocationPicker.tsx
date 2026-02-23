import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './button';
import { Navigation } from 'lucide-react';

// Fix for default marker icon in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
    lat?: number;
    lng?: number;
    onLocationChange: (lat: number, lng: number) => void;
    className?: string;
}

function LocationMarker({ position, setPosition, onLocationChange }: any) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationChange(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export function LocationPicker({ lat, lng, onLocationChange, className }: LocationPickerProps) {
    // Default to Mexico City if no location provided
    const defaultPosition = { lat: 19.4326, lng: -99.1332 };
    const [position, setPosition] = useState<L.LatLngExpression | null>(
        lat && lng ? { lat, lng } : null
    );
    const [mapReady, setMapReady] = useState(false);

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const newPos = { lat: latitude, lng: longitude };
                    setPosition(newPos);
                    onLocationChange(latitude, longitude);
                },
                (err) => {
                    console.error("Error getting location:", err);
                    alert("No se pudo obtener tu ubicación actual.");
                }
            );
        } else {
            alert("Geolocalización no soportada por este navegador.");
        }
    };

    useEffect(() => {
        // This is a workaround to make sure the map renders correctly
        // sometimes Leaflet needs a moment or a resize event
        const timer = setTimeout(() => setMapReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Ubicación en el mapa</span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetCurrentLocation}
                    className="flex items-center gap-1"
                >
                    <Navigation className="size-3" />
                    Usar mi ubicación
                </Button>
            </div>

            <div className="h-[300px] w-full rounded-md border overflow-hidden z-0 relative">
                {mapReady && (
                    <MapContainer
                        center={position || defaultPosition}
                        zoom={13}
                        scrollWheelZoom={true} // Allow scroll zoom
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker
                            position={position}
                            setPosition={setPosition}
                            onLocationChange={onLocationChange}
                        />
                    </MapContainer>
                )}
            </div>
            <p className="text-xs text-neutral-500">
                Haz clic en el mapa para seleccionar la ubicación exacta de tu negocio.
            </p>
        </div>
    );
}
