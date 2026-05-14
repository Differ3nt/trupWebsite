import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import gpxParser from 'gpxparser';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import L from 'leaflet';
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface GpxPreviewProps {
  fileUrl: string;
}

function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  return null;
}

export default function GpxPreview({ fileUrl }: GpxPreviewProps) {
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [bounds, setBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGpx = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Nie udało się pobrać pliku');
        const text = await response.text();
        
        const gpx = new gpxParser();
        gpx.parse(text);
        
        let pts: [number, number][] = [];
        if (gpx.tracks && gpx.tracks.length > 0) {
          pts = gpx.tracks[0].points.map(p => [p.lat, p.lon] as [number, number]);
        } else if (gpx.routes && gpx.routes.length > 0) {
          pts = gpx.routes[0].points.map(p => [p.lat, p.lon] as [number, number]);
        }
        
        if (pts.length === 0) throw new Error('Brak punktów w pliku GPX');
        
        setPositions(pts);
        
        // Calculate bounds
        const lats = pts.map(p => p[0]);
        const lons = pts.map(p => p[1]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        
        setBounds([[minLat, minLon], [maxLat, maxLon]]);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchGpx();
  }, [fileUrl]);

  if (error) return <div className="p-4 text-red-500 text-xs font-bold uppercase">{error}</div>;
  if (positions.length === 0) return <div className="p-4 text-on-surface-variant text-xs animate-pulse uppercase font-bold">Ładowanie podglądu...</div>;

  return (
    <div className="h-64 w-full relative border-2 border-primary/20 overflow-hidden">
      <MapContainer 
        style={{ height: '100%', width: '100%' }} 
        center={positions[0]} 
        zoom={13} 
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="#ff4400" weight={6} opacity={0.9} />
        {bounds && <ChangeView bounds={bounds} />}
      </MapContainer>
    </div>
  );
}
