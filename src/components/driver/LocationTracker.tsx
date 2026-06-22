import { useEffect, useState, useRef } from "react";
import { MapPin, Navigation } from "lucide-react";
import { api } from "@/lib/api";

interface LocationTrackerProps {
  rideId: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

export function LocationTracker({ rideId }: LocationTrackerProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Start geolocation watch (tracking is already enabled on backend)
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });

          // Send location to backend
          try {
            await api.patch(`/api/rides/${rideId}/location`, { latitude, longitude });
          } catch (err) {
            console.error("Failed to update location:", err);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Don't show toast for timeout errors - they're common
          if (error.code !== 3) {
            console.error("Geolocation permission or access error:", error.message);
          }
        },
        {
          enableHighAccuracy: false, // Changed to false for better reliability
          timeout: 30000, // Increased from 10s to 30s
          maximumAge: 60000, // Increased from 5s to 60s for better caching
        }
      );
    }

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [rideId]);

  return (
    <div className="flex items-center gap-2">
      <Navigation className="h-4 w-4 text-green-500 animate-pulse" />
      <span className="text-xs text-muted-foreground">Location tracking active</span>
      {currentLocation && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono">
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}
