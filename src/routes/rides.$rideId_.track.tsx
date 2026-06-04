import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Gauge, Loader2, MapPin, Navigation, Radio } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { ApiRide, ApiUser } from "@/lib/api";
import {
  getSocket,
  joinRideRoom,
  leaveRideRoom,
  type DriverLocation,
} from "@/lib/socket";

export const Route = createFileRoute("/rides/$rideId_/track")({
  head: () => ({
    meta: [{ title: "Live Tracking — RideWave" }],
  }),
  component: TrackRidePage,
});

type RideWithDriver = ApiRide & { driverId: ApiUser | null };

interface LocationResponse {
  isTracking: boolean;
  startedAt: string | null;
  location: {
    lat: number;
    lng: number;
    speed: number;
    heading: number | null;
    updatedAt: string;
  } | null;
}

function formatSpeed(mps: number) {
  return `${Math.round(mps * 3.6)} km/h`;
}

function TrackRidePage() {
  const { rideId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();

  const [ride, setRide] = useState<RideWithDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [eta, setEta] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch ride + initial location
  useEffect(() => {
    if (!user) return;
    let active = true;

    (async () => {
      try {
        const rideData = await api.get<RideWithDriver>(`/api/rides/${rideId}`);
        if (!active) return;
        setRide(rideData);

        const loc = await api.get<LocationResponse>(`/api/tracking/${rideId}/location`);
        if (!active) return;
        setIsTracking(loc.isTracking);
        if (loc.location) {
          setLocation({ rideId, ...loc.location });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load tracking");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [rideId, user]);

  // Dynamically import Leaflet (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((L) => {
      (window as any).L = L.default || L;
      setLeafletLoaded(true);
    });
  }, []);

  // Socket subscription for live updates
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    joinRideRoom(rideId);

    const onLocation = (data: DriverLocation) => {
      if (data.rideId === rideId) setLocation(data);
    };
    const onStarted = () => {
      setIsTracking(true);
      toast.success("Driver started the ride!");
    };
    const onStopped = () => {
      setIsTracking(false);
      toast.info("Ride tracking ended");
    };

    socket.on("driver_location", onLocation);
    socket.on("ride_tracking_started", onStarted);
    socket.on("ride_tracking_stopped", onStopped);

    return () => {
      socket.off("driver_location", onLocation);
      socket.off("ride_tracking_started", onStarted);
      socket.off("ride_tracking_stopped", onStopped);
      leaveRideRoom(rideId);
    };
  }, [rideId, user]);

  // Initialize Leaflet map once we have a first location
  useEffect(() => {
    if (!location || !mapContainerRef.current || !leafletLoaded) return;

    // @ts-ignore - L is loaded dynamically from window
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [location.lat, location.lng],
        zoom: 15,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;

      const carIcon = L.divIcon({
        className: "",
        html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">🚗</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      markerRef.current = L.marker([location.lat, location.lng], {
        icon: carIcon,
      }).addTo(map);
    } else {
      // Smoothly move existing marker + recenter
      markerRef.current?.setLatLng([location.lat, location.lng]);
      mapRef.current.panTo([location.lat, location.lng]);
    }
  }, [location, leafletLoaded]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // ETA via OSRM (free, public router) — recompute when location updates significantly
  useEffect(() => {
    if (!location || !ride) return;
    // We compute ETA from driver's live position to the ride destination.
    // Destination is a string here; OSRM needs coordinates. We approximate by
    // geocoding the destination once via Nominatim, then route via OSRM.
    let cancelled = false;

    (async () => {
      try {
        // Geocode destination (only once, cache in ride object)
        const destCoords = await geocodeDestination(ride.destination);
        if (cancelled || !destCoords) return;

        const url = `https://router.project-osrm.org/route/v1/driving/${location.lng},${location.lat};${destCoords.lng},${destCoords.lat}?overview=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (data.routes?.[0]) {
          setEta({
            distanceKm: data.routes[0].distance / 1000,
            durationMin: data.routes[0].duration / 60,
          });
        }
      } catch {
        // ETA is best-effort; ignore failures
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only recompute when lat/lng change meaningfully
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng, ride?.destination]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="glass rounded-2xl p-10 text-center max-w-sm w-full">
            <p className="text-muted-foreground mb-4">Please sign in to track this ride.</p>
            <Link to="/auth">
              <Button className="w-full">Sign in</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const driver = ride?.driverId;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-6 max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />Back to dashboard
        </Link>

        {/* Status header */}
        <div className="glass rounded-2xl p-5 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{ride?.origin} → {ride?.destination}</h1>
              {isTracking ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                  <Radio className="h-3 w-3 animate-pulse" />Live
                </Badge>
              ) : (
                <Badge variant="secondary">Offline</Badge>
              )}
            </div>
            {driver && (
              <p className="text-sm text-muted-foreground mt-1">Driver: {driver.fullName}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {location && (
              <div className="flex items-center gap-1.5 text-sm">
                <Gauge className="h-4 w-4 text-primary" />
                {formatSpeed(location.speed)}
              </div>
            )}
            {eta && (
              <div className="flex items-center gap-1.5 text-sm">
                <Navigation className="h-4 w-4 text-primary" />
                {eta.distanceKm.toFixed(1)} km · {Math.round(eta.durationMin)} min
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="glass rounded-2xl overflow-hidden">
          {!isTracking && !location ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
              <MapPin className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium">Driver hasn't started the ride yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Live location will appear here once the driver starts the trip.
              </p>
            </div>
          ) : (
            <div ref={mapContainerRef} className="h-[60vh] w-full" style={{ zIndex: 0 }} />
          )}
        </div>

        {location && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Last updated: {new Date(location.updatedAt).toLocaleTimeString()}
          </p>
        )}
      </main>
    </div>
  );
}

// ── Helpers ──
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeDestination(query: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    if (data?.[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(query, coords);
      return coords;
    }
  } catch {
    /* ignore */
  }
  geocodeCache.set(query, null);
  return null;
}

export default TrackRidePage;
