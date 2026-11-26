"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapView({
  latitude, longitude, label, height = 320, zoom = 14,
}: { latitude: number; longitude: number; label?: string; height?: number; zoom?: number }) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-navy-900/10">
      <MapContainer center={[latitude, longitude]} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[latitude, longitude]} icon={icon}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}
