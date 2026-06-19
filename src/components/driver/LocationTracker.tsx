import { useEffect, useState, useRef } from "react";
import { MapPin, Navigation } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface LocationTrackerProps {
  rideId: string;
  isTracking: boolean;
  onTrackingChange?: (isTracking: boolean) => void;
}

interface Location {
  latitude: number;
  longitude: number;
}

export function LocationTracker({ rideId, isTracking, onTrackingChange }: LocationTrackerProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = async () => {
    try {
      // Start tracking on backend
      await api.patch(`/api/rides/${rideId}/location/start`);
      
      // Start geolocation watch
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
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        );
      }
      
      onTrackingChange?.(true);
    } catch (err) {
      console.error("Failed to start tracking:", err);
    }
  };

  // Auto-start tracking when component mounts
  useEffect(() => {
    if (!isTracking) {
      startTracking();
    }

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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
