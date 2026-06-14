import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useRouter, L as Link, d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { g as getSocket, j as joinDriverRoom, a as joinUserRoom, L as LocationTracker } from "./LocationTracker-CdOqUS-G.mjs";
import { H as Header, B as Button, F as Footer, A as Avatar, a as AvatarImage, b as AvatarFallback, c as cn } from "./Footer-BWtQXp58.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { B as Badge } from "./badge-D5mNeN6h.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CksdTiq5.mjs";
import { S as Separator } from "./separator-D2Zokc-g.mjs";
import { I as Input } from "./input-Cyw76J80.mjs";
import { L as Label } from "./label-DDfja8qX.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogTrigger } from "./dialog-C6y2awIV.mjs";
import { u as useAuth, a as api } from "./router-G4FGI3qd.mjs";
import "../_libs/socket.io-client.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import { L as Lock, C as Car, U as User, m as CircleCheckBig, c as LogOut, X, T as TriangleAlert, n as CircleX, S as Search, o as Users, p as Ticket, M as MapPin, q as Calendar, a as LoaderCircle, A as ArrowRight, I as IndianRupee, W as Wind, f as Check, r as Trash2, P as Phone, s as ShieldCheck, E as ExternalLink, Z as Zap } from "../_libs/lucide-react.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import { f as format, d as differenceInMinutes } from "../_libs/date-fns.mjs";
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
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/radix-ui__react-separator.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
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
function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
function RideCard({ id, origin, destination, departureAt, arrivalAt, seatsAvailable, pricePerSeat, driver, index = 0 }) {
  const navigate = useNavigate();
  const departure = new Date(departureAt);
  const arrival = arrivalAt ? new Date(arrivalAt) : null;
  const durationMins = arrival ? differenceInMinutes(arrival, departure) : null;
  const initials = driver?.fullName ? driver.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  const handleCardClick = () => {
    navigate({ to: "/rides/$rideId", params: { rideId: id } });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 14 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.35, delay: index * 0.05 },
      className: "group glass rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer",
      onClick: handleCardClick,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold tabular-nums", children: format(departure, "HH:mm") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5 truncate max-w-[80px]", children: origin })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col items-center gap-0.5 min-w-[60px]", children: [
              durationMins !== null && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: formatDuration(durationMins) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full flex items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-primary mx-1 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                seatsAvailable,
                " seat",
                seatsAvailable !== 1 ? "s" : ""
              ] })
            ] }),
            arrival ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold tabular-nums", children: format(arrival, "HH:mm") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5 truncate max-w-[80px]", children: destination })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-medium truncate max-w-[80px]", children: destination }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 sm:border-l sm:border-border/40 sm:pl-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-9 w-9 border border-border/40 shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: driver?.avatarUrl ?? void 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold", children: initials })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium leading-tight", children: driver?.fullName ?? "Driver" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-primary mt-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-3 w-3" }),
                "Instant Booking"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 sm:border-l sm:border-border/40 sm:pl-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(IndianRupee, { className: "h-4 w-4 text-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold tabular-nums", children: Number(pricePerSeat).toLocaleString("en-IN") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: ".00" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                className: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 whitespace-nowrap shrink-0",
                onClick: (e) => e.stopPropagation(),
                children: "View ride"
              }
            )
          ] })
        ] }),
        seatsAvailable === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 pt-3 border-t border-border/30 text-center text-xs text-destructive font-medium", children: "No seats available" }),
        seatsAvailable === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 pt-3 border-t border-border/30 text-center text-xs text-amber-400 font-medium", children: "Only 1 seat left — book fast!" })
      ]
    }
  );
}
function DriverSeatMap({ rideId, seats, vehicleType }) {
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {});
  const rowOrder = Object.keys(rows).sort();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-4 h-5 rounded-t-lg border-2 border-primary bg-primary/20" }),
        "Booked"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-4 h-5 rounded-t-lg border-2 border-muted-foreground/20 bg-muted/60" }),
        "Available"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-4 h-5 rounded-t-lg border-2 border-amber-500/40 bg-amber-500/20" }),
        "Locked"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-5", children: rowOrder.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: [
        row,
        " row"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3 flex-wrap justify-center", children: rows[row].map((seat) => {
          const isBooked = seat.status === "booked";
          const isAvailable = seat.status === "available";
          const isLocked = seat.status === "locked";
          const passenger = seat.passenger;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                disabled: !passenger,
                title: passenger ? `${passenger.fullName} - ${seat.seatNumber}` : `${seat.seatNumber} - ${isLocked ? "Locked" : "Available"}`,
                className: cn(
                  "group relative flex flex-col items-center justify-between pb-1.5 pt-2.5 rounded-t-2xl border-2 w-16 h-20 transition-all duration-150 select-none",
                  isBooked && "bg-primary/20 border-primary cursor-pointer hover:bg-primary/30",
                  isAvailable && "bg-muted/50 border-muted-foreground/20 cursor-default opacity-60",
                  isLocked && "bg-amber-500/20 border-amber-500/40 cursor-default opacity-70"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: cn(
                        "text-xs font-semibold leading-none z-10",
                        isBooked && "text-primary",
                        isAvailable && "text-muted-foreground/40",
                        isLocked && "text-amber-600"
                      ),
                      children: seat.seatNumber
                    }
                  ),
                  passenger && /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-7 w-7 border border-primary/50", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: passenger.avatarUrl }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-[10px] bg-primary/20 text-primary", children: passenger.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: cn(
                        "w-full h-2.5 rounded-b-sm absolute bottom-0 left-0 right-0",
                        isBooked && "bg-primary/10",
                        isAvailable && "bg-muted-foreground/10",
                        isLocked && "bg-amber-500/10"
                      )
                    }
                  ),
                  passenger && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-primary font-medium leading-none mt-0.5 truncate max-w-[60px]", children: passenger.fullName.split(" ")[0] })
                ]
              }
            ) }),
            passenger && /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Passenger Details" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center space-y-4 py-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-20 w-20 border-2 border-primary", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: passenger.avatarUrl }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-2xl bg-primary/20 text-primary", children: passenger.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-lg", children: passenger.fullName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
                    "Seat ",
                    seat.seatNumber
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    className: "w-full",
                    onClick: () => window.location.href = `tel:${passenger.phone}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-4 w-4 mr-2" }),
                      "Call Passenger"
                    ]
                  }
                )
              ] })
            ] })
          ] }, seat._id || seat.seatNumber);
        }) }),
        rows[row].some((s) => s.position === 1) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-10 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground/50", children: "Steering" })
      ] })
    ] }, row)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-4 border-t border-border/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Total passengers" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
        seats.filter((s) => s.status === "booked").length,
        " / ",
        seats.length
      ] })
    ] }) })
  ] });
}
function DashboardPage() {
  const {
    t
  } = useTranslation();
  const {
    user,
    loading,
    signOut
  } = useAuth();
  const router = useRouter();
  const [myRides, setMyRides] = reactExports.useState([]);
  const [myBookings, setMyBookings] = reactExports.useState([]);
  const [driverBookings, setDriverBookings] = reactExports.useState([]);
  const [fullName, setFullName] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = reactExports.useState(false);
  const [selectedRideForSeatMap, setSelectedRideForSeatMap] = reactExports.useState(null);
  const [seatsForMap, setSeatsForMap] = reactExports.useState([]);
  const [loadingSeats, setLoadingSeats] = reactExports.useState(false);
  const isDriver = user?.role === "driver";
  const [searchFrom, setSearchFrom] = reactExports.useState("");
  const [searchTo, setSearchTo] = reactExports.useState("");
  const [searchDate, setSearchDate] = reactExports.useState("");
  const [searchRides, setSearchRides] = reactExports.useState([]);
  const [searchLoading, setSearchLoading] = reactExports.useState(false);
  const [searched, setSearched] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? "");
    setPhone(user.phone ?? "");
    fetchData();
    const socket = getSocket();
    if (isDriver) {
      joinDriverRoom(user._id);
    } else {
      joinUserRoom(user._id);
    }
    const checkApprovalStatus = async () => {
      try {
        const userData = await api.get("/api/profile");
        const updatedUser = userData.user;
        if (isDriver && updatedUser.isApproved && !updatedUser.hasSeenApprovalNotification) {
          setShowApprovalPopup(true);
          const timer = setTimeout(() => {
            setShowApprovalPopup(false);
            api.post("/api/profile/notification-seen", {}).catch(console.error);
          }, 1e4);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error("Failed to check approval status:", err);
      }
    };
    if (isDriver) {
      checkApprovalStatus();
    }
    socket.on("driver_approved", (driver) => {
      if (driver._id === user._id) {
        setShowApprovalPopup(true);
        toast.success(t("dashboard.approval_popup"));
      }
    });
    socket.on("driver_rejected", (driver) => {
      if (driver._id === user._id) {
        toast.error("Your driver profile has been rejected. Please update your documents.");
      }
    });
    socket.on("booking_created", (booking) => {
      if (isDriver) {
        toast.success(`New booking received! ${booking.passengerId?.fullName} booked ${booking.seats} seat(s)`);
        fetchData();
      }
    });
    socket.on("booking_cancelled", (booking) => {
      if (isDriver) {
        toast.info(`Booking cancelled by passenger`);
        fetchData();
      } else {
        toast.info("Your booking has been cancelled");
        fetchData();
      }
    });
    socket.on("ride_cancelled", (ride) => {
      toast.info("A ride you booked has been cancelled by the driver");
      fetchData();
    });
    socket.on("driver_confirmed_completion", (data) => {
      if (!isDriver) {
        toast.success("Driver has confirmed ride completion. Please confirm to complete the ride.");
        fetchData();
      }
    });
    socket.on("passenger_confirmed_completion", (data) => {
      if (isDriver) {
        toast.success("Passenger has confirmed ride completion.");
        fetchData();
      }
    });
    socket.on("ride_completed", (data) => {
      toast.success("Ride completed successfully!");
      fetchData();
    });
    socket.on("booking_transferred", (data) => {
      if (!isDriver) {
        toast.success(data.message || "Your booking has been transferred to driver's next ride.");
        fetchData();
      }
    });
    socket.on("passengers_transferred", (data) => {
      if (isDriver) {
        toast.success(data.message || "Passengers transferred to your next ride.");
        fetchData();
      }
    });
    socket.on("cancellation_count_updated", (data) => {
      if (isDriver) {
        toast.warning(data.message || `You have cancelled ${data.cancellationCount} ride(s).`);
        fetchData();
      }
    });
    socket.on("driver_blocked", (data) => {
      if (isDriver) {
        toast.error(data.message || "Your account has been blocked due to excessive cancellations.");
        fetchData();
      }
    });
    socket.on("deviation_charge_requested", (data) => {
      if (!isDriver) {
        toast.warning(data.message || "Driver has requested extra charge for route deviation.");
        fetchData();
      }
    });
    socket.on("deviation_charge_approved", (data) => {
      if (isDriver) {
        toast.success(data.message || "Deviation charge approved by passenger.");
        fetchData();
      } else {
        toast.success(data.message || "Deviation charge has been approved.");
        fetchData();
      }
    });
    socket.on("deviation_charge_rejected", (data) => {
      if (isDriver) {
        toast.info(data.message || "Deviation charge rejected by passenger.");
        fetchData();
      } else {
        toast.info(data.message || "Deviation charge request has been rejected.");
        fetchData();
      }
    });
    return () => {
      socket.off("driver_approved");
      socket.off("driver_rejected");
      socket.off("booking_created");
      socket.off("booking_cancelled");
      socket.off("ride_cancelled");
      socket.off("driver_confirmed_completion");
      socket.off("passenger_confirmed_completion");
      socket.off("ride_completed");
      socket.off("booking_transferred");
      socket.off("passengers_transferred");
      socket.off("cancellation_count_updated");
      socket.off("driver_blocked");
      socket.off("deviation_charge_requested");
      socket.off("deviation_charge_approved");
      socket.off("deviation_charge_rejected");
    };
  }, [user]);
  const fetchData = async () => {
    if (!user) return;
    try {
      const basePromises = [api.get("/api/rides/my"), api.get("/api/bookings/my")];
      let driverBookingsRes = [];
      if (isDriver) {
        const [ridesRes, bookingsRes, driverRes] = await Promise.all([...basePromises, api.get("/api/bookings/driver")]);
        setMyRides(ridesRes);
        setMyBookings(bookingsRes);
        driverBookingsRes = driverRes;
      } else {
        const [ridesRes, bookingsRes] = await Promise.all(basePromises);
        setMyRides(ridesRes);
        setMyBookings(bookingsRes);
      }
      setDriverBookings(driverBookingsRes);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };
  const fetchSeatsForRide = async (rideId) => {
    try {
      setLoadingSeats(true);
      const response = await api.get(`/api/rides/${rideId}/seats/passengers`);
      setSeatsForMap(response.seats);
    } catch (err) {
      console.error("Failed to fetch seats:", err);
      toast.error("Failed to load seat map");
    } finally {
      setLoadingSeats(false);
    }
  };
  const openSeatMap = (ride) => {
    setSelectedRideForSeatMap(ride);
    fetchSeatsForRide(ride._id);
  };
  const closeSeatMap = () => {
    setSelectedRideForSeatMap(null);
    setSeatsForMap([]);
  };
  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.put("/api/profile", {
        fullName,
        phone
      });
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };
  const cancelRide = async (id) => {
    try {
      await api.patch(`/api/rides/${id}/cancel`);
      toast.success("Ride cancelled.");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    }
  };
  const cancelBooking = async (id) => {
    const confirmed = window.confirm("Are you sure you want to cancel this booking?\n\n⚠️ Warning: Your booking amount will NOT be refunded upon cancellation.");
    if (!confirmed) return;
    try {
      await api.patch(`/api/bookings/${id}/cancel`);
      toast.success("Booking cancelled.");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    }
  };
  const confirmRide = async (rideId) => {
    try {
      const response = await api.patch(`/api/rides/${rideId}/confirm/driver`);
      if (response.isCompleted) {
        toast.success("Ride completed successfully!");
      } else {
        toast.success("Ride completion confirmed. Waiting for passenger confirmation.");
      }
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm ride completion");
    }
  };
  const requestDeviationCharge = async (rideId, distance) => {
    try {
      const response = await api.post(`/api/rides/${rideId}/deviation-charge`, {
        deviationDistance: distance
      });
      toast.success(response.message);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request deviation charge");
    }
  };
  const handlePopupClick = async () => {
    await api.post("/api/profile/notification-seen", {});
    setShowApprovalPopup(false);
    router.navigate({
      to: "/publish"
    });
  };
  const handlePopupDismiss = async () => {
    await api.post("/api/profile/notification-seen", {});
    setShowApprovalPopup(false);
  };
  const handleSearch = async () => {
    setSearchLoading(true);
    setSearched(true);
    try {
      const qs = new URLSearchParams();
      if (searchFrom.trim()) qs.set("from", searchFrom.trim());
      if (searchTo.trim()) qs.set("to", searchTo.trim());
      if (searchDate) qs.set("date", searchDate);
      const data = await api.get(`/api/rides?${qs.toString()}`);
      setSearchRides(Array.isArray(data) ? data : []);
    } catch {
      setSearchRides([]);
    }
    setSearchLoading(false);
  };
  if (loading) return null;
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 flex items-center justify-center px-4 py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-10 text-center max-w-sm w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-10 w-10 text-primary mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: t("auth.signin") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: "Please sign in to view your dashboard." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full", children: t("auth.signin") }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
    ] });
  }
  const initials = fullName ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : user.email[0]?.toUpperCase() ?? "?";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 container mx-auto px-4 md:px-6 py-10 max-w-4xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
      opacity: 0,
      y: 20
    }, animate: {
      opacity: 1,
      y: 0
    }, transition: {
      duration: 0.5
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-16 w-16 border-2 border-primary/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: user.avatarUrl ?? void 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold", children: initials })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-center sm:text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 justify-center sm:justify-start", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: fullName || "My Account" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isDriver ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border/40"}`, children: [
              isDriver ? /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3" }),
              isDriver ? t("auth.driver") : t("auth.passenger")
            ] }),
            isDriver && user.isApproved && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-500/20 text-green-600 border border-green-500/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3 w-3" }),
              t("dashboard.verified")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-0.5", children: user.email ?? "" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          isDriver && !user.isProfileComplete && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/driver-setup", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "border-primary/40 text-primary hover:bg-primary/10 font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-4 w-4 mr-1.5" }),
            "Complete Profile"
          ] }) }),
          isDriver && user.isProfileComplete && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/publish", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-4 w-4 mr-1.5" }),
            "Publish Ride"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: signOut, className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
            t("nav.login")
          ] })
        ] })
      ] }),
      showApprovalPopup && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
        opacity: 0,
        y: -50
      }, animate: {
        opacity: 1,
        y: 0
      }, exit: {
        opacity: 0,
        y: -50
      }, className: "glass rounded-2xl p-6 mb-6 border border-green-500/30 bg-green-500/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-6 w-6 text-green-600" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-lg text-green-600", children: "Congratulations!" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "You have become a verified driver." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "Click here to publish your first ride." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handlePopupDismiss, className: "flex-shrink-0 p-1 hover:bg-green-500/20 rounded-full transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4 text-muted-foreground" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handlePopupClick, className: "w-full mt-4 bg-green-600 hover:bg-green-700 text-white", children: t("dashboard.publish_now") })
      ] }),
      isDriver && user.rideCancellationCount > 0 && !user.isBlocked && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: {
        opacity: 0,
        y: -20
      }, animate: {
        opacity: 1,
        y: 0
      }, className: "glass rounded-2xl p-4 mb-6 border border-amber-500/30 bg-amber-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-amber-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-amber-700", children: t("dashboard.cancellation_warning", {
          count: user.rideCancellationCount,
          remaining: 3 - user.rideCancellationCount
        }) }) })
      ] }) }),
      isDriver && user.isBlocked && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: {
        opacity: 0,
        y: -20
      }, animate: {
        opacity: 1,
        y: 0
      }, className: "glass rounded-2xl p-4 mb-6 border border-red-500/30 bg-red-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-5 w-5 text-red-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-red-700", children: t("dashboard.blocked_warning") }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: isDriver ? "rides" : !isDriver ? "search" : "bookings", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "mb-6 bg-muted/40 flex-wrap h-auto gap-1 w-full sm:w-auto", children: [
          !isDriver && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "search", className: "flex items-center gap-1.5 text-sm sm:text-base", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
            t("nav.search")
          ] }),
          isDriver && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "rides", className: "flex items-center gap-1.5 text-sm sm:text-base", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-4 w-4" }),
            t("dashboard.my_rides"),
            " (",
            myRides.length,
            ")"
          ] }),
          isDriver && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "passengers", className: "flex items-center gap-1.5 text-sm sm:text-base", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
            t("dashboard.passengers"),
            " (",
            driverBookings.filter((b) => b.status === "confirmed").length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "bookings", className: "flex items-center gap-1.5 text-sm sm:text-base", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Ticket, { className: "h-4 w-4" }),
            t("dashboard.my_bookings"),
            " (",
            myBookings.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "profile", className: "flex items-center gap-1.5 text-sm sm:text-base", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4" }),
            t("auth.full_name")
          ] })
        ] }),
        !isDriver && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "search", className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-4 sm:p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-xl bg-background/60 border border-border/40 px-4 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3" }),
                  t("search.from")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "text", placeholder: t("search.from_ph"), value: searchFrom, onChange: (e) => setSearchFrom(e.target.value), className: "border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-xl bg-background/60 border border-border/40 px-4 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3" }),
                  t("search.to")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "text", placeholder: t("search.to_ph"), value: searchTo, onChange: (e) => setSearchTo(e.target.value), className: "border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-xl bg-background/60 border border-border/40 px-4 py-2 sm:col-span-2 lg:col-span-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3 w-3" }),
                  t("search.date")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", min: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], value: searchDate, onChange: (e) => setSearchDate(e.target.value), className: "border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSearch, disabled: searchLoading, className: "w-full mt-3 sm:mt-4 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/40 font-semibold h-10 sm:h-11", children: [
              searchLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 mr-2" }),
              t("nav.search")
            ] })
          ] }),
          searched && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: searchRides.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-16 glass rounded-2xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-10 w-10 text-muted-foreground/40 mx-auto mb-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: t("search.no_rides") })
          ] }) : searchRides.map((ride, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(RideCard, { id: ride._id, origin: ride.origin, destination: ride.destination, departureAt: ride.departureAt, arrivalAt: ride.arrivalAt, seatsAvailable: ride.seatsAvailable, pricePerSeat: ride.pricePerSeat, driver: typeof ride.driverId === "object" ? ride.driverId : null, index: i }, ride._id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "rides", className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("dashboard.my_rides") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/publish", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-4 w-4 mr-1" }),
              t("dashboard.publish_ride")
            ] }) })
          ] }),
          myRides.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 sm:py-16 glass rounded-2xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-10 w-10 text-muted-foreground/40 mx-auto mb-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: t("dashboard.no_rides_desc") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/publish", className: "mt-4 inline-block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", children: t("dashboard.publish_ride") }) })
          ] }),
          myRides.map((ride) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-xl p-4 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-semibold text-sm sm:text-base", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4 text-primary" }),
                  ride.origin,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3 text-muted-foreground" }),
                  ride.destination
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5" }),
                    format(new Date(ride.departureAt), "EEE d MMM, h:mm a")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(IndianRupee, { className: "h-3.5 w-3.5" }),
                    ride.pricePerSeat,
                    "/",
                    t("ride_details.seat")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    ride.seatsAvailable,
                    "/",
                    ride.seatsTotal,
                    " ",
                    t("ride_details.seats_available")
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: ride.status === "active" ? "default" : "secondary", className: ride.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "", children: ride.status }),
                ride.status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => openSeatMap(ride), className: "text-xs sm:text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 mr-1" }),
                    t("dashboard.seat_map")
                  ] }),
                  !ride.deviationChargeRequested && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => {
                    const distance = prompt(t("dashboard.enter_deviation_distance"));
                    if (distance && !isNaN(Number(distance)) && Number(distance) > 0) {
                      requestDeviationCharge(ride._id, Number(distance));
                    }
                  }, className: "border-amber-500/50 text-amber-600 hover:bg-amber-500/10 text-xs sm:text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Wind, { className: "h-4 w-4 mr-1" }),
                    t("ride_details.deviation_charge")
                  ] }),
                  ride.deviationChargeRequested && !ride.deviationChargeApproved && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs", children: t("ride_details.charge_pending") }),
                  ride.deviationChargeApproved && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "default", className: "bg-green-500/20 text-green-600 border-green-500/30 text-xs", children: [
                    "+₹",
                    ride.extraCharge
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "default", onClick: () => confirmRide(ride._id), className: "bg-green-600 hover:bg-green-700 text-xs sm:text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 mr-1" }),
                    t("dashboard.confirm_complete")
                  ] }),
                  (() => {
                    const now = /* @__PURE__ */ new Date();
                    const departureTime = new Date(ride.departureAt);
                    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1e3 * 60 * 60);
                    const canCancel = hoursUntilDeparture >= 1;
                    return /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => cancelRide(ride._id), disabled: !canCancel, className: `text-destructive hover:text-destructive hover:bg-destructive/10 ${!canCancel ? "opacity-50 cursor-not-allowed" : ""}`, title: !canCancel ? "Ride can only be cancelled at least 1 hour before departure" : "", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) });
                  })()
                ] })
              ] })
            ] }),
            ride.status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-3 border-t border-border/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LocationTracker, { rideId: ride._id, isTracking: ride.isTrackingLocation || false, onTrackingChange: (isTracking) => {
              setMyRides((prevRides) => prevRides.map((r) => r._id === ride._id ? {
                ...r,
                isTrackingLocation: isTracking
              } : r));
            } }) })
          ] }, ride._id))
        ] }),
        isDriver && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "passengers", className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("dashboard.passengers") }),
          driverBookings.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 sm:py-16 glass rounded-2xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-10 w-10 text-muted-foreground/40 mx-auto mb-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: t("dashboard.no_rides") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("dashboard.no_rides_desc") })
          ] }),
          driverBookings.map((booking) => {
            const passenger = booking.passengerId;
            const ride = typeof booking.rideId === "object" ? booking.rideId : null;
            const passengerInitials = passenger?.fullName ? passenger.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-10 w-10 border border-border/40", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: passenger?.avatarUrl ?? void 0 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-sm bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold", children: passengerInitials })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: passenger?.fullName ?? "Unknown" }),
                  passenger?.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3 w-3" }),
                    passenger.phone
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                ride && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-sm font-medium", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5 text-primary" }),
                  ride.origin,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3 text-muted-foreground" }),
                  ride.destination
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground", children: [
                  ride && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3 w-3" }),
                    format(new Date(ride.departureAt), "EEE d MMM, h:mm a")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    booking.seats,
                    " seat",
                    booking.seats > 1 ? "s" : ""
                  ] }),
                  ride && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(IndianRupee, { className: "h-3 w-3" }),
                    ride.pricePerSeat * booking.seats,
                    " total"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: booking.status === "confirmed" ? "default" : "secondary", className: booking.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "", children: booking.status })
            ] }, booking._id);
          })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "bookings", className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("dashboard.my_bookings") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/search", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "w-full sm:w-auto flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
              t("search.button")
            ] }) })
          ] }),
          myBookings.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 sm:py-16 glass rounded-2xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Ticket, { className: "h-10 w-10 text-muted-foreground/40 mx-auto mb-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: t("dashboard.no_rides") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/search", className: "mt-4 inline-block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", children: t("search.button") }) })
          ] }),
          myBookings.map((booking) => {
            const ride = typeof booking.rideId === "object" ? booking.rideId : null;
            const driver = ride && typeof ride.driverId === "object" ? ride.driverId : null;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                ride && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-semibold text-sm sm:text-base", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4 text-primary" }),
                  ride.origin,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3 text-muted-foreground" }),
                  ride.destination
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground", children: [
                  ride && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5" }),
                    format(new Date(ride.departureAt), "EEE d MMM, h:mm a")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    booking.seats,
                    " ",
                    t("ride_details.seat"),
                    booking.seats > 1 ? "s" : "",
                    " booked"
                  ] }),
                  driver?.fullName && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Driver: ",
                    driver.fullName
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: booking.status === "confirmed" ? "default" : "secondary", className: booking.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "", children: booking.status }),
                booking.status === "confirmed" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => cancelBooking(booking._id), className: "text-destructive hover:text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
              ] })
            ] }, booking._id);
          })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "profile", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-6 space-y-5 max-w-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "Edit profile" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isDriver ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border/40"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5" }),
              isDriver ? "Driver account" : "Passenger account"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Full name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "Your name" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3.5 w-3.5" }),
              "Phone number"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+91 98765 43210", type: "tel" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: user.email, disabled: true, className: "opacity-60" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveProfile, disabled: saving, className: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full", children: saving ? "Saving…" : "Save changes" }),
          isDriver && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/driver-setup", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "w-full flex items-center gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" }),
            "Update driver & bank details"
          ] }) })
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: selectedRideForSeatMap !== null, onOpenChange: closeSeatMap, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { children: [
        "Seat Map - ",
        selectedRideForSeatMap?.origin,
        " to ",
        selectedRideForSeatMap?.destination
      ] }) }),
      loadingSeats ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) }) : selectedRideForSeatMap ? /* @__PURE__ */ jsxRuntimeExports.jsx(DriverSeatMap, { rideId: selectedRideForSeatMap._id, seats: seatsForMap, vehicleType: selectedRideForSeatMap.vehicleType || "sedan" }) : null
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
export {
  DashboardPage as component
};
