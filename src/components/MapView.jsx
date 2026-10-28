import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const ROUTE_COLORS = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

export default function MapView({ locations, routes }) {
  const depot = locations[0] || { lat: -6.2088, lng: 106.8456 }; // Default Jakarta

  return (
    <div className="h-[450px] w-full rounded-xl overflow-hidden border border-slate-700 shadow-lg">
      <MapContainer center={[depot.lat, depot.lng]} zoom={12} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Marker Depot & Pelanggan */}
        {locations.map((loc, idx) => (
          <Marker key={idx} position={[loc.lat, loc.lng]}>
            <Popup>
              <strong>{idx === 0 ? "DEPOT PUSAT" : `Pelanggan #${idx}`}</strong> <br />
              Demand: {loc.demand || 0} kg
            </Popup>
          </Marker>
        ))}

        {/* Render Polyline Rute Kendaraan */}
        {routes &&
          routes.map((route, vehicleIdx) => {
            if (route.length === 0) return null;
            const pathCoordinates = [
              [depot.lat, depot.lng],
              ...route.map((customerIdx) => [locations[customerIdx].lat, locations[customerIdx].lng]),
              [depot.lat, depot.lng],
            ];

            return (
              <Polyline
                key={vehicleIdx}
                positions={pathCoordinates}
                color={ROUTE_COLORS[vehicleIdx % ROUTE_COLORS.length]}
                weight={4}
                opacity={0.8}
              />
            );
          })}
      </MapContainer>
    </div>
  );
}