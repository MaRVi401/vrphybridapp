import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const depotIcon = L.divIcon({
  className: "bg-transparent border-0",
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: #e11d48;
      color: #ffffff;
      border: 2.5px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
    ">
      <i class="ti ti-building-warehouse" style="transform: rotate(45deg); font-size: 16px;"></i>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const customerIcon = L.divIcon({
  className: "bg-transparent border-0",
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: #4f46e5;
      color: #ffffff;
      border: 2px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">
      <i class="ti ti-map-pin" style="transform: rotate(45deg); font-size: 14px;"></i>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const routeColors = [
  "#E63946",
  "#2A9D8F",
  "#F4A261",
  "#9C27B0",
  "#3F51B5",
  "#00BCD4",
  "#E91E63",
  "#8BC34A",
];

function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng);
    },
  });
  return null;
}

// Auto-fit zoom saat dataset berubah / di-import
function MapBoundsUpdater({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (!locations || locations.length === 0) return;
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 12);
      return;
    }
    const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
  }, [locations, map]);

  return null;
}

export default function MapView({ locations, routes, onMapClick }) {
  const depot = locations.find((l) => l.isDepot) || locations[0];
  const center = depot ? [depot.lat, depot.lng] : [-6.3265, 108.32];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={11}
        attributionControl={false}
        className="w-full h-full rounded-lg"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapEventsHandler onMapClick={onMapClick} />
        <MapBoundsUpdater locations={locations} />

        {/* Render Markers */}
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={loc.isDepot ? depotIcon : customerIcon}
          >
            <Popup>
              <div className="font-sans">
                <strong className="block text-sm">{loc.name}</strong>
                <span className="text-xs text-gray-600">
                  {loc.isDepot
                    ? "Titik Depot Utama"
                    : `Demand: ${loc.demand} unit`}
                </span>
                <br />
                <small className="text-gray-400">
                  Lat: {loc.lat.toFixed(4)}, Lng: {loc.lng.toFixed(4)}
                </small>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Route Lines */}
        {routes &&
          depot &&
          routes.map((route, rIdx) => {
            if (!route || route.length === 0) return null;

            const validWaypoints = route
              .map((cIdx) => locations[cIdx])
              .filter(Boolean)
              .map((loc) => [loc.lat, loc.lng]);

            if (validWaypoints.length === 0) return null;

            const polylineCoords = [
              [depot.lat, depot.lng],
              ...validWaypoints,
              [depot.lat, depot.lng],
            ];

            return (
              <Polyline
                key={`route-${rIdx}`}
                positions={polylineCoords}
                color={routeColors[rIdx % routeColors.length]}
                weight={4}
                opacity={0.85}
              />
            );
          })}
      </MapContainer>
    </div>
  );
}
