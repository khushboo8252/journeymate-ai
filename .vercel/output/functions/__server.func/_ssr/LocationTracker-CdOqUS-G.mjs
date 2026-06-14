import { l as lookup } from "../_libs/socket.io-client.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { B as Button } from "./Footer-BWtQXp58.mjs";
import { a as api } from "./router-G4FGI3qd.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { M as MapPin, N as NavigationOff, t as Navigation } from "../_libs/lucide-react.mjs";
const SOCKET_URL = "https://ukyro-backend.onrender.com";
let socket = null;
const getSocket = () => {
  if (!socket) {
    socket = lookup(SOCKET_URL, {
      withCredentials: true
    });
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });
  }
  return socket;
};
const joinUserRoom = (userId) => {
  const socket2 = getSocket();
  socket2.emit("join_user", userId);
};
const joinDriverRoom = (driverId) => {
  const socket2 = getSocket();
  socket2.emit("join_driver", driverId);
};
function LocationTracker({ rideId, isTracking, onTrackingChange }) {
  const [currentLocation, setCurrentLocation] = reactExports.useState(null);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const watchIdRef = reactExports.useRef(null);
  const startTracking = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/api/rides/${rideId}/location/start`);
      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ latitude, longitude });
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
            timeout: 1e4,
            maximumAge: 5e3
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
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
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
  reactExports.useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
    currentLocation && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5 text-green-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono", children: [
        currentLocation.latitude.toFixed(4),
        ", ",
        currentLocation.longitude.toFixed(4)
      ] })
    ] }),
    isTracking ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        size: "sm",
        variant: "destructive",
        onClick: stopTracking,
        disabled: isLoading,
        className: "flex items-center gap-2",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(NavigationOff, { className: "h-4 w-4" }),
          "Stop Tracking"
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        size: "sm",
        variant: "default",
        onClick: startTracking,
        disabled: isLoading,
        className: "flex items-center gap-2 bg-green-600 hover:bg-green-700",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Navigation, { className: "h-4 w-4" }),
          "Start Tracking"
        ]
      }
    )
  ] });
}
export {
  LocationTracker as L,
  joinUserRoom as a,
  getSocket as g,
  joinDriverRoom as j
};
