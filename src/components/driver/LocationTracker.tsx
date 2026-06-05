import { useEffect, useState, useRef } from "react";
import { MapPin, Navigation, NavigationOff } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = async () => {
    try {
      setIsLoading(true);
      
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
            toast.error("Unable to get location. Please enable GPS.");
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        );
      } else {
        toast.error("Geolocation is not supported by your browser");
        return;
      }
      
      toast.success("Location tracking started");
      onTrackingChange?.(true);
    } catch (err) {
      console.error("Failed to start tracking:", err);
      toast.error(err instanceof Error ? err.message : "Failed to start tracking");
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = async () => {
    try {
      setIsLoading(true);
      
      // Stop geolocation watch
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      // Stop tracking on backend
      await api.patch(`/api/rides/${rideId}/location/stop`);
      
      toast.success("Location tracking stopped");
      onTrackingChange?.(false);
    } catch (err) {
      console.error("Failed to stop tracking:", err);
      toast.error(err instanceof Error ? err.message : "Failed to stop tracking");
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      {currentLocation && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-green-500" />
          <span className="font-mono">
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </span>
        </div>
      )}
      
      {isTracking ? (
        <Button
          size="sm"
          variant="destructive"
          onClick={stopTracking}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <NavigationOff className="h-4 w-4" />
          Stop Tracking
        </Button>
      ) : (
        <Button
          size="sm"
          variant="default"
          onClick={startTracking}
          disabled={isLoading}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Navigation className="h-4 w-4" />
          Start Tracking
        </Button>
      )}
    </div>
  );
}
