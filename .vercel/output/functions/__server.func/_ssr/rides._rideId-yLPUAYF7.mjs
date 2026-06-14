import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { g as getSocket, L as LocationTracker } from "./LocationTracker-CdOqUS-G.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { H as Header, B as Button, F as Footer, A as Avatar, a as AvatarImage, b as AvatarFallback, c as cn } from "./Footer-BWtQXp58.mjs";
import { B as Badge } from "./badge-D5mNeN6h.mjs";
import { S as Separator } from "./separator-D2Zokc-g.mjs";
import { R as Route$2, u as useAuth, a as api } from "./router-G4FGI3qd.mjs";
import "../_libs/socket.io-client.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import { a as LoaderCircle, C as Car, y as ArrowLeft, o as Users, e as ChevronRight, Z as Zap, z as MessageSquare, L as Lock, I as IndianRupee, B as Clock, M as MapPin } from "../_libs/lucide-react.mjs";
import { d as differenceInMinutes, f as format } from "../_libs/date-fns.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-separator.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/zod.mjs";
import "../_libs/engine.io-client.mjs";
import "../_libs/xmlhttprequest-ssl.mjs";
import "fs";
import "url";
import "child_process";
import "http";
import "https";
import "../_libs/engine.io-parser.mjs";
import "../_libs/socket.io__component-emitter.mjs";
import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "tty";
import "../_libs/supports-color.mjs";
import "os";
import "../_libs/has-flag.mjs";
import "../_libs/ws.mjs";
import "events";
import "net";
import "tls";
import "zlib";
import "buffer";
import "../_libs/socket.io-parser.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
function DriverLocationMap({ latitude, longitude, isTracking = false }) {
  const mapRef = reactExports.useRef(null);
  const mapInstanceRef = reactExports.useRef(null);
  const markerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (mapRef.current && !mapInstanceRef.current && window.L) {
        const map = window.L.map(mapRef.current).setView([latitude, longitude], 15);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        const marker = window.L.marker([latitude, longitude]).addTo(map);
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
  reactExports.useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && window.L) {
      const newLatLng = new window.L.LatLng(latitude, longitude);
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng, 15);
      markerRef.current.setPopupContent(`
        <div class="text-center">
          <strong>Driver Location</strong><br/>
          <small>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>
        </div>
      `);
    }
  }, [latitude, longitude]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: `h-4 w-4 ${isTracking ? "text-green-500 animate-pulse" : "text-muted-foreground"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: isTracking ? "Live Location" : "Last Known Location" })
      ] }),
      isTracking && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-2 w-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-green-500" })
        ] }),
        "Live"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: mapRef, className: "h-64 w-full rounded-xl overflow-hidden border border-border/30" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground text-center", children: [
      "Coordinates: ",
      latitude.toFixed(6),
      ", ",
      longitude.toFixed(6)
    ] })
  ] });
}
const SEAT_COLORS = {
  available: "bg-background/60 border-border hover:border-primary/70 hover:bg-primary/5",
  booked: "bg-muted/50 border-muted-foreground/20 cursor-not-allowed opacity-60",
  locked: "bg-amber-500/20 border-amber-500/40 cursor-not-allowed opacity-70",
  selected: "bg-primary border-primary shadow-lg shadow-primary/30"
};
const SEAT_TEXT_COLORS = {
  available: "text-muted-foreground group-hover:text-primary",
  booked: "text-muted-foreground/40",
  locked: "text-amber-600",
  selected: "text-primary-foreground"
};
function SeatPicker({ rideId, seats, selectedSeats, onSeatToggle, userId }) {
  const socketRef = reactExports.useRef(getSocket());
  const [localSeats, setLocalSeats] = reactExports.useState(seats);
  reactExports.useEffect(() => {
    setLocalSeats(seats);
  }, [seats]);
  reactExports.useEffect(() => {
    const socket = socketRef.current;
    const handleSeatLocked = (data) => {
      if (data.rideId === rideId) {
        setLocalSeats((prev) => prev.map(
          (seat) => data.seatNumbers.includes(seat.seatNumber) ? { ...seat, status: "locked" } : seat
        ));
      }
    };
    const handleSeatReleased = (data) => {
      if (data.rideId === rideId) {
        setLocalSeats((prev) => prev.map(
          (seat) => data.seatNumbers.includes(seat.seatNumber) ? { ...seat, status: "available", lockedBy: null, lockedUntil: null, isMyLock: false } : seat
        ));
      }
    };
    const handleSeatBooked = (data) => {
      if (data.rideId === rideId) {
        setLocalSeats((prev) => prev.map(
          (seat) => data.seatNumbers.includes(seat.seatNumber) ? { ...seat, status: "booked", lockedBy: null, lockedUntil: null, isMyLock: false } : seat
        ));
      }
    };
    const handleSeatLockExpired = (data) => {
      if (data.rideId === rideId) {
        setLocalSeats((prev) => prev.map(
          (seat) => data.seatNumbers.includes(seat.seatNumber) ? { ...seat, status: "available", lockedBy: null, lockedUntil: null, isMyLock: false } : seat
        ));
      }
    };
    socket.on("seat_locked", handleSeatLocked);
    socket.on("seat_released", handleSeatReleased);
    socket.on("seat_booked", handleSeatBooked);
    socket.on("seat_lock_expired", handleSeatLockExpired);
    socket.emit("join_ride", rideId);
    return () => {
      socket.off("seat_locked", handleSeatLocked);
      socket.off("seat_released", handleSeatReleased);
      socket.off("seat_booked", handleSeatBooked);
      socket.off("seat_lock_expired", handleSeatLockExpired);
      socket.emit("leave_ride", rideId);
    };
  }, [rideId]);
  const rows = localSeats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {});
  const rowOrder = Object.keys(rows).sort();
  const getSeatLabel = (seat, rowSeats) => {
    if (seat.type === "driver") return "D";
    const idx = rowSeats.indexOf(seat);
    const len = rowSeats.length;
    if (len === 1) return "";
    if (idx === 0 || idx === len - 1) return "Window";
    return "Middle";
  };
  const isSeatAvailable = (seat) => {
    return seat.status === "available" && !selectedSeats.includes(seat.seatNumber);
  };
  const isSeatSelected = (seat) => {
    return selectedSeats.includes(seat.seatNumber);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-4 h-5 rounded-t-lg border-2 border-muted-foreground/20 bg-muted/60" }),
        "Booked"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-4 h-5 rounded-t-lg border-2 border-border bg-background/60" }),
        "Available"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-4 h-5 rounded-t-lg border-2 border-amber-500/40 bg-amber-500/20" }),
        "Locked"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-4 h-5 rounded-t-lg border-2 border-primary bg-primary" }),
        "Selected"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-5", children: rowOrder.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: [
        row,
        " row"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3 flex-wrap justify-center", children: rows[row].map((seat) => {
          const isSelected = isSeatSelected(seat);
          const isAvailable = isSeatAvailable(seat);
          const isDriver = seat.type === "driver";
          const seatLabel = getSeatLabel(seat, rows[row]);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: !isAvailable && !isSelected,
              onClick: () => onSeatToggle(seat.seatNumber),
              title: isDriver ? "Driver seat" : seat.status === "booked" ? "Already booked" : seat.status === "locked" ? seat.isMyLock ? "Your selection" : "Locked by another user" : isSelected ? "Click to deselect" : "Click to select",
              className: cn(
                "group relative flex flex-col items-center justify-between pb-1.5 pt-2.5 rounded-t-2xl border-2 w-14 h-16 transition-all duration-150 select-none",
                isDriver && "bg-muted/50 border-muted-foreground/20 cursor-not-allowed opacity-60",
                !isDriver && isSelected && SEAT_COLORS.selected,
                !isDriver && !isSelected && seat.status === "booked" && SEAT_COLORS.booked,
                !isDriver && !isSelected && seat.status === "locked" && SEAT_COLORS.locked,
                !isDriver && !isSelected && seat.status === "available" && SEAT_COLORS.available
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "text-xs font-semibold leading-none z-10",
                      isDriver && "text-muted-foreground/40",
                      !isDriver && !isSelected && SEAT_TEXT_COLORS[seat.status],
                      isSelected && SEAT_TEXT_COLORS.selected
                    ),
                    children: isDriver ? "D" : seat.seatNumber
                  }
                ),
                seatLabel && !isDriver && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "text-[9px] leading-none",
                      !isDriver && !isSelected && SEAT_TEXT_COLORS[seat.status],
                      isSelected && SEAT_TEXT_COLORS.selected
                    ),
                    children: seatLabel
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: cn(
                      "w-full h-2.5 rounded-b-sm absolute bottom-0 left-0 right-0",
                      isDriver && "bg-muted-foreground/10",
                      !isDriver && !isSelected && seat.status === "booked" && "bg-muted-foreground/10",
                      !isDriver && !isSelected && seat.status === "locked" && "bg-amber-500/10",
                      !isDriver && !isSelected && seat.status === "available" && "bg-muted/70",
                      isSelected && "bg-white/20"
                    )
                  }
                ),
                seat.status === "locked" && !isDriver && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-1 -right-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3 text-amber-600" }) }),
                seat.status === "booked" && !isDriver && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground/50 font-bold leading-none", children: "✕" })
              ]
            },
            seat._id
          );
        }) }),
        rows[row].some((s) => s.type === "driver") && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-10 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground/50", children: "Steering" })
      ] })
    ] }, row)) }),
    selectedSeats.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-primary font-medium", children: [
      selectedSeats.length,
      " seat",
      selectedSeats.length > 1 ? "s" : "",
      " selected (seat",
      selectedSeats.length > 1 ? "s" : "",
      " ",
      selectedSeats.sort().join(", "),
      ")"
    ] })
  ] });
}
function RideDetailPage() {
  const {
    t
  } = useTranslation();
  const {
    rideId
  } = Route$2.useParams();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [ride, setRide] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [seats, setSeats] = reactExports.useState([]);
  const [selectedSeats, setSelectedSeats] = reactExports.useState([]);
  const [booking, setBooking] = reactExports.useState(false);
  const [alreadyBooked, setAlreadyBooked] = reactExports.useState(false);
  const [lockingSeats, setLockingSeats] = reactExports.useState(false);
  const [driverLocation, setDriverLocation] = reactExports.useState(null);
  const [isTrackingLocation, setIsTrackingLocation] = reactExports.useState(false);
  const toggleSeat = (seatNumber) => {
    setSelectedSeats((prev) => prev.includes(seatNumber) ? prev.filter((s) => s !== seatNumber) : [...prev, seatNumber]);
  };
  reactExports.useEffect(() => {
    fetchRide();
    fetchSeats();
  }, [rideId]);
  reactExports.useEffect(() => {
    if (user && ride) checkExistingBooking();
  }, [user, ride]);
  reactExports.useEffect(() => {
    if (!ride) return;
    const socket = getSocket();
    socket.on("driver_location_updated", (data) => {
      if (data.rideId === ride._id && data.currentLocation) {
        setDriverLocation({
          latitude: data.currentLocation.latitude,
          longitude: data.currentLocation.longitude
        });
        setIsTrackingLocation(true);
      }
    });
    socket.on("location_tracking_started", (data) => {
      if (data.rideId === ride._id) {
        setIsTrackingLocation(true);
      }
    });
    socket.on("location_tracking_stopped", (data) => {
      if (data.rideId === ride._id) {
        setIsTrackingLocation(false);
      }
    });
    socket.on("driver_confirmed_completion", (data) => {
      if (data.rideId === ride._id && !isDriver) {
        toast.success("Driver has confirmed ride completion. Please confirm to complete the ride.");
        fetchRide();
      }
    });
    socket.on("passenger_confirmed_completion", (data) => {
      if (data.rideId === ride._id && isDriver) {
        toast.success("Passenger has confirmed ride completion.");
        fetchRide();
      }
    });
    socket.on("ride_completed", (data) => {
      if (data.rideId === ride._id) {
        toast.success("Ride completed successfully!");
        fetchRide();
      }
    });
    socket.on("booking_transferred", (data) => {
      if (data.originalRideId === ride._id && !isDriver) {
        toast.success(data.message || "Your booking has been transferred to driver's next ride.");
        fetchRide();
      }
    });
    socket.on("deviation_charge_requested", (data) => {
      if (data.rideId === ride._id && !isDriver) {
        toast.warning(data.message || "Driver has requested extra charge for route deviation.");
        fetchRide();
      }
    });
    socket.on("deviation_charge_approved", (data) => {
      if (data.rideId === ride._id) {
        toast.success(data.message || "Deviation charge has been approved.");
        fetchRide();
      }
    });
    socket.on("deviation_charge_rejected", (data) => {
      if (data.rideId === ride._id) {
        toast.info(data.message || "Deviation charge request has been rejected.");
        fetchRide();
      }
    });
    if (ride.currentLocation?.latitude && ride.currentLocation?.longitude) {
      setDriverLocation({
        latitude: ride.currentLocation.latitude,
        longitude: ride.currentLocation.longitude
      });
      setIsTrackingLocation(ride.isTrackingLocation || false);
    }
    return () => {
      socket.off("driver_location_updated");
      socket.off("location_tracking_started");
      socket.off("location_tracking_stopped");
      socket.off("driver_confirmed_completion");
      socket.off("passenger_confirmed_completion");
      socket.off("ride_completed");
      socket.off("booking_transferred");
      socket.off("deviation_charge_requested");
      socket.off("deviation_charge_approved");
      socket.off("deviation_charge_rejected");
    };
  }, [ride]);
  const fetchRide = async () => {
    try {
      const data = await api.get(`/api/rides/${rideId}`);
      setRide(data);
    } catch {
      setRide(null);
    }
    setLoading(false);
  };
  const fetchSeats = async () => {
    try {
      const data = await api.get(`/api/rides/${rideId}/seats`);
      setSeats(data);
    } catch (error) {
      console.error("Failed to fetch seats:", error);
    }
  };
  const checkExistingBooking = async () => {
    if (!user || !ride) return;
    try {
      const bookings = await api.get("/api/bookings/my");
      const found = bookings.some((b) => (typeof b.rideId === "string" ? b.rideId : b.rideId?._id) === ride._id && b.status === "confirmed");
      setAlreadyBooked(found);
    } catch {
      setAlreadyBooked(false);
    }
  };
  const bookRide = async () => {
    if (!user) {
      navigate({
        to: "/auth"
      });
      return;
    }
    if (!ride) return;
    if (selectedSeats.length === 0) {
      toast.error(t("ride_details.select_seat_error"));
      return;
    }
    setBooking(true);
    try {
      await api.post(`/api/rides/${rideId}/seats/lock`, {
        seatNumbers: selectedSeats
      });
      const bookingResponse = await api.post("/api/bookings", {
        rideId: ride._id,
        seatNumbers: selectedSeats
      });
      if (bookingResponse.requiresPayment && bookingResponse.paymentOrder) {
        const paymentOrder = bookingResponse.paymentOrder;
        if (!paymentOrder.keyId || paymentOrder.keyId === "your_razorpay_key_id") {
          toast.error("Payment system not configured. Please contact admin.");
          await api.post(`/api/rides/${rideId}/seats/release`, {
            seatNumbers: selectedSeats
          });
          fetchSeats();
          setBooking(false);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          const options = {
            key: paymentOrder.keyId,
            amount: paymentOrder.amount * 100,
            currency: paymentOrder.currency,
            name: "Ukyro",
            description: `Booking for ${selectedSeats.length} seat(s)`,
            order_id: paymentOrder.orderId,
            handler: async function(response) {
              try {
                await api.post("/api/bookings/confirm", {
                  bookingId: bookingResponse.booking._id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature
                });
                toast.success(`${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""} booked! Have a great journey.`);
                setAlreadyBooked(true);
                setSelectedSeats([]);
                fetchRide();
                fetchSeats();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to confirm booking");
                api.post(`/api/rides/${rideId}/seats/release`, {
                  seatNumbers: selectedSeats
                }).catch(console.error);
                fetchSeats();
              }
            },
            prefill: {
              name: user.fullName,
              email: user.email
            },
            theme: {
              color: "#6366f1"
            },
            modal: {
              ondismiss: function() {
                toast.error("Payment cancelled");
                api.post(`/api/rides/${rideId}/seats/release`, {
                  seatNumbers: selectedSeats
                }).catch(console.error);
                fetchSeats();
              }
            }
          };
          try {
            const rzp = new window.Razorpay(options);
            rzp.open();
          } catch (error) {
            toast.error("Failed to initialize payment. Please try again.");
            api.post(`/api/rides/${rideId}/seats/release`, {
              seatNumbers: selectedSeats
            }).catch(console.error);
            fetchSeats();
          }
        };
        script.onerror = () => {
          toast.error("Failed to load payment gateway. Please check your internet connection.");
          api.post(`/api/rides/${rideId}/seats/release`, {
            seatNumbers: selectedSeats
          }).catch(console.error);
          fetchSeats();
        };
        document.body.appendChild(script);
      } else {
        toast.success(`${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""} booked! Have a great journey.`);
        setAlreadyBooked(true);
        setSelectedSeats([]);
        fetchRide();
        fetchSeats();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("ride_details.booking_failed"));
      fetchSeats();
    }
    setBooking(false);
  };
  if (loading || authLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) })
    ] });
  }
  if (!ride) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 flex items-center justify-center px-4 py-24 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-12 w-12 text-muted-foreground/40 mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: t("ride_details.not_found") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: t("ride_details.not_found_desc") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/search", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", children: t("ride_details.browse") }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
    ] });
  }
  const driver = typeof ride.driverId === "object" ? ride.driverId : null;
  const departure = new Date(ride.departureAt);
  const arrival = ride.arrivalAt ? new Date(ride.arrivalAt) : null;
  const durationMins = arrival ? differenceInMinutes(arrival, departure) : null;
  const driverInitials = driver?.fullName ? driver.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  const isDriver = user?._id === (typeof ride.driverId === "object" ? ride.driverId?._id : ride.driverId);
  const canBook = !isDriver && ride.seatsAvailable > 0 && ride.status === "active";
  const formatDur = (m) => {
    const h = Math.floor(m / 60), min = m % 60;
    return h === 0 ? `${min}min` : min === 0 ? `${h}h` : `${h}h${min}`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex-1 container mx-auto px-4 md:px-6 py-10 max-w-5xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/search", className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
        t("ride_details.back")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold mb-6", children: t("ride_details.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: {
        opacity: 0,
        y: 20
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        duration: 0.5
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row gap-6 items-start", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-4", children: [
          canBook && ride.seatsTotal > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-base", children: t("ride_details.select_seat") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                seats.filter((s) => s.status === "available").length,
                " of ",
                ride.seatsTotal,
                " ",
                t("ride_details.available")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SeatPicker, { rideId, seats, selectedSeats, onSeatToggle: toggleSeat, userId: user?._id })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-4 sm:p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center pt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2.5 w-2.5 rounded-full border-2 border-primary bg-background mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 w-px bg-border my-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2.5 w-2.5 rounded-full border-2 border-primary bg-background mb-0.5" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base sm:text-lg font-bold tabular-nums w-12 shrink-0", children: format(departure, "HH:mm") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-sm sm:text-base", children: ride.origin })
                ] }) }),
                durationMins !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground w-12 shrink-0", children: formatDur(durationMins) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("ride_details.duration") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base sm:text-lg font-bold tabular-nums w-12 shrink-0", children: arrival ? format(arrival, "HH:mm") : "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-sm sm:text-base", children: ride.destination })
                ] }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mt-5 pt-4 border-t border-border/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
                ride.seatsAvailable,
                " ",
                t("ride_details.seats_available")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: ride.status === "active" ? "default" : "secondary", className: ride.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "", children: ride.status })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-muted/10 transition-colors cursor-default", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/30 shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: driver?.avatarUrl ?? void 0 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-sm sm:text-base bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold", children: driverInitials })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm sm:text-base leading-tight", children: driver?.fullName ?? "Driver" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: t("ride_details.verified_driver") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground shrink-0" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 sm:p-5 space-y-3", children: [
              isDriver && ride.status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-3 border-t border-border/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LocationTracker, { rideId: ride._id, isTracking: isTrackingLocation, onTrackingChange: setIsTrackingLocation }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-4 w-4 text-primary shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("ride_details.instant_booking") })
              ] }),
              driver?.vehicleSeats && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-4 w-4 text-muted-foreground shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  driver.vehicleSeats,
                  "-",
                  t("ride_details.seater")
                ] })
              ] }),
              ride.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4 text-muted-foreground shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: ride.description })
              ] }),
              (isDriver || alreadyBooked) && driver?.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4 text-muted-foreground shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: driver.phone })
              ] })
            ] }),
            !isDriver && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 pb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "flex items-center gap-2 rounded-full border-primary/40 text-primary hover:bg-primary/5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4" }),
              t("ride_details.contact"),
              " ",
              driver?.fullName?.split(" ")[0] ?? "Driver"
            ] }) })
          ] }),
          !isDriver && driverLocation && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-base mb-4", children: "Driver's Live Location" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DriverLocationMap, { latitude: driverLocation.latitude, longitude: driverLocation.longitude, isTracking: isTrackingLocation })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full lg:w-72 shrink-0 lg:sticky lg:top-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 pt-5 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-base", children: format(departure, "EEEE, d MMMM") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center pt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full border-2 border-primary bg-background" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 w-px bg-border my-1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full border-2 border-primary bg-background" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold tabular-nums", children: format(departure, "HH:mm") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground truncate", children: ride.origin })
              ] }),
              durationMins !== null && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground block -mt-1 pl-0", children: formatDur(durationMins) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold tabular-nums", children: arrival ? format(arrival, "HH:mm") : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground truncate", children: ride.destination })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 pb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-5 w-5 text-muted-foreground shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-7 w-7 border border-border/40 shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: driver?.avatarUrl ?? void 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold", children: driverInitials })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: driver?.fullName?.split(" ")[0] ?? "Driver" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 space-y-4", children: [
            !user && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-7 w-7 text-muted-foreground/40 mx-auto" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("ride_details.sign_in_to_book") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 rounded-full font-semibold", children: t("auth.signin") }) })
            ] }),
            isDriver && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-2", children: t("ride_details.your_ride") }),
            canBook && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: selectedSeats.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-amber-400 text-xs", children: t("ride_details.select_seats_hint") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: selectedSeats.length }),
                  " ",
                  t("ride_details.passenger")
                ] }) }),
                selectedSeats.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-0.5 font-bold text-lg sm:text-xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(IndianRupee, { className: "h-4 w-4" }),
                  (Number(ride.pricePerSeat) * selectedSeats.length).toLocaleString("en-IN"),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-normal text-muted-foreground", children: ".00" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: bookRide, disabled: booking || selectedSeats.length === 0, className: "w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-semibold h-10 sm:h-11 rounded-full text-sm sm:text-base shadow-lg shadow-primary/30 disabled:opacity-40", children: booking ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 sm:h-5 sm:w-5 animate-spin" }) : selectedSeats.length === 0 ? t("ride_details.select_seats_to_book") : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-4 w-4 mr-1.5" }),
                t("ride_details.book"),
                " ",
                selectedSeats.length,
                " ",
                t("ride_details.seat")
              ] }) })
            ] }),
            !canBook && ride.seatsAvailable === 0 && !isDriver && !alreadyBooked && user && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm text-muted-foreground py-2", children: t("ride_details.fully_booked") }),
            alreadyBooked && ride.status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-3 border-t border-border/30", children: [
              ride.deviationChargeRequested && !ride.deviationChargeApproved && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-amber-700", children: t("ride_details.deviation_charge_requested", {
                  extraCharge: ride.extraCharge || 0,
                  distance: ride.deviationDistance || 0
                }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: async () => {
                    try {
                      await api.post(`/api/rides/${rideId}/deviation-charge/approve`, {});
                      toast.success(t("ride_details.deviation_charge_approved", {
                        extraCharge: ride.extraCharge || 0
                      }));
                      fetchRide();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to approve");
                    }
                  }, className: "flex-1 bg-green-600 hover:bg-green-700", children: t("ride_details.approve") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: async () => {
                    try {
                      await api.post(`/api/rides/${rideId}/deviation-charge/reject`, {});
                      toast.success("Deviation charge rejected.");
                      fetchRide();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to reject");
                    }
                  }, className: "flex-1 border-red-500/50 text-red-600 hover:bg-red-500/10", children: t("ride_details.reject") })
                ] })
              ] }),
              ride.deviationChargeApproved && (ride.extraCharge || 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-green-500/10 border border-green-500/30 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-green-700", children: t("ride_details.deviation_charge_approved", {
                extraCharge: ride.extraCharge || 0
              }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2", children: [
                ride.confirmByDriver && !ride.confirmByPassenger && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-green-600 font-medium", children: t("ride_details.driver_confirmed") }),
                !ride.confirmByDriver && ride.confirmByPassenger && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-600 font-medium", children: t("ride_details.waiting_driver") }),
                ride.confirmByDriver && ride.confirmByPassenger && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-green-600 font-medium", children: t("ride_details.ride_completed") }),
                !ride.confirmByDriver && !ride.confirmByPassenger && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("ride_details.confirm_completion") })
              ] }),
              !ride.confirmByPassenger && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: async () => {
                try {
                  await api.patch(`/api/rides/${rideId}/confirm/passenger`);
                  toast.success(t("ride_details.ride_completed"));
                  fetchRide();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to confirm");
                }
              }, className: "w-full bg-green-600 hover:bg-green-700 text-white font-semibold", children: t("ride_details.confirm_button") })
            ] })
          ] })
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
export {
  RideDetailPage as component
};
