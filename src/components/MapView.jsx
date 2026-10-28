import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Icon Leaflet Default di React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon untuk Depot & Customer
const depotIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Warna rute tiap kendaraan
const routeColors = ['#E63946', '#2A9D8F', '#F4A261', '#9C27B0', '#3F51B5', '#00BCD4'];

// Component Listener Klik di Peta
function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapView({ locations, routes, onMapClick }) {
  const depot = locations.find((l) => l.isDepot) || locations[0];
  const center = depot ? [depot.lat, depot.lng] : [-6.200000, 106.816666];

  return (
    <MapContainer center={center} zoom={12} className="w-full h-[500px] rounded-xl shadow-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapEventsHandler onMapClick={onMapClick} />

      {/* Render Markers */}
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={loc.isDepot ? depotIcon : customerIcon}
        >
          <Popup>
            <div className="font-sans">
              <strong className="block text-base">{loc.name}</strong>
              <span className="text-sm text-gray-600">
                {loc.isDepot ? 'Titik Depot' : `Demand: ${loc.demand} unit`}
              </span>
              <br />
              <small className="text-gray-400">Lat: {loc.lat.toFixed(4)}, Lng: {loc.lng.toFixed(4)}</small>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Render Route Lines */}
      {routes &&
        routes.map((route, rIdx) => {
          if (!depot || route.length === 0) return null;
          const polylineCoords = [
            [depot.lat, depot.lng],
            ...route.map((cIdx) => [locations[cIdx].lat, locations[cIdx].lng]),
            [depot.lat, depot.lng],
          ];

          return (
            <Polyline
              key={`route-${rIdx}`}
              positions={polylineCoords}
              color={routeColors[rIdx % routeColors.length]}
              weight={4}
              opacity={0.8}
            />
          );
        })}
    </MapContainer>
  );
}