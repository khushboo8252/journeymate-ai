import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

// Declare Leaflet types for dynamic loading
declare global {
  interface Window {
    L: any;
  }
}

interface DriverLocationMapProps {
  latitude: number;
  longitude: number;
  isTracking?: boolean;
}

export function DriverLocationMap({ latitude, longitude, isTracking = false }: DriverLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (mapRef.current && !mapInstanceRef.current && window.L) {
        // Initialize map
        const map = window.L.map(mapRef.current).setView([latitude, longitude], 15);

        // Add OpenStreetMap tiles (free, no API key required)
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Add marker
        const marker = window.L.marker([latitude, longitude]).addTo(map);
        
        // Add popup
        marker.bindPopup(`
          <div class="text-center">
            <strong>Driver Location</strong><br/>
            <small>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>
          </div>
        `);

        mapInstanceRef.current = map;
        markerRef.current = marker;
      }
    };
    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position when location changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && window.L) {
      const newLatLng = new window.L.LatLng(latitude, longitude);
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng, 15);
      
      // Update popup content
      markerRef.current.setPopupContent(`
        <div class="text-center">
          <strong>Driver Location</strong><br/>
          <small>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>
        </div>
      `);
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${isTracking ? "text-green-500 animate-pulse" : "text-muted-foreground"}`} />
          <span className="text-sm font-medium">
            {isTracking ? "Live Location" : "Last Known Location"}
          </span>
        </div>
        {isTracking && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </span>
        )}
      </div>
      <div ref={mapRef} className="h-64 w-full rounded-xl overflow-hidden border border-border/30" />
      <div className="text-xs text-muted-foreground text-center">
        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </div>
  );
}
