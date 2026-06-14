import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { H as Header, F as Footer, B as Button, c as cn, A as Avatar, a as AvatarImage, b as AvatarFallback } from "./Footer-BWtQXp58.mjs";
import { B as Badge } from "./badge-D5mNeN6h.mjs";
import { S as Separator } from "./separator-D2Zokc-g.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle } from "./dialog-C6y2awIV.mjs";
import { T as Textarea } from "./textarea-9XcX5DdN.mjs";
import { L as Label } from "./label-DDfja8qX.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import { a as LoaderCircle, D as Shield, c as LogOut, b as LayoutDashboard, F as UserCheck, G as UserX, C as Car, q as Calendar, o as Users, r as Trash2 } from "../_libs/lucide-react.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import { f as format } from "../_libs/date-fns.mjs";
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
import "./router-G4FGI3qd.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/zod.mjs";
import "../_libs/radix-ui__react-separator.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
function AdminDashboard() {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = reactExports.useState(true);
  const [stats, setStats] = reactExports.useState(null);
  const [users, setUsers] = reactExports.useState([]);
  const [drivers, setDrivers] = reactExports.useState([]);
  const [rides, setRides] = reactExports.useState([]);
  const [bookings, setBookings] = reactExports.useState([]);
  const [activeTab, setActiveTab] = reactExports.useState("stats");
  const [rejectionDialog, setRejectionDialog] = reactExports.useState({
    open: false,
    driverId: null,
    driverName: null,
    reason: ""
  });
  reactExports.useEffect(() => {
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) {
      navigate({
        to: "/admin/login"
      });
      return;
    }
    fetchData();
  }, [navigate]);
  const fetchData = async () => {
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;
    try {
      const [statsRes, usersRes, driversRes, ridesRes, bookingsRes] = await Promise.all([fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }), fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }), fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/drivers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }), fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/rides`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }), fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })]);
      if (!statsRes.ok) throw new Error(t("admin.fetch_stats_failed"));
      if (!usersRes.ok) throw new Error(t("admin.fetch_users_failed"));
      if (!driversRes.ok) throw new Error(t("admin.fetch_drivers_failed"));
      if (!ridesRes.ok) throw new Error(t("admin.fetch_rides_failed"));
      if (!bookingsRes.ok) throw new Error(t("admin.fetch_bookings_failed"));
      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setDrivers(await driversRes.json());
      setRides(await ridesRes.json());
      setBookings(await bookingsRes.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.load_data_failed"));
    }
    setLoading(false);
  };
  const handleLogout = () => {
    localStorage.removeItem("kshira_admin_token");
    navigate({
      to: "/admin/login"
    });
  };
  const handleDeleteUser = async (userId) => {
    if (!confirm(t("admin.confirm_delete_user"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;
    try {
      const res = await fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(t("admin.delete_user_failed"));
      toast.success(t("admin.user_deleted"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.delete_user_failed"));
    }
  };
  const handleDeleteRide = async (rideId) => {
    if (!confirm(t("admin.confirm_delete_ride"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;
    try {
      const res = await fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/rides/${rideId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(t("admin.delete_ride_failed"));
      toast.success(t("admin.ride_deleted"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.delete_ride_failed"));
    }
  };
  const handleDeleteBooking = async (bookingId) => {
    if (!confirm(t("admin.confirm_delete_booking"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;
    try {
      const res = await fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(t("admin.delete_booking_failed"));
      toast.success(t("admin.booking_deleted"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.delete_booking_failed"));
    }
  };
  const handleReleasePayment = async (driverId) => {
    if (!confirm(t("admin.confirm_release_payment"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;
    try {
      const res = await fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/drivers/${driverId}/release-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(t("admin.release_payment_failed"));
      toast.success(t("admin.payment_released"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.release_payment_failed"));
    }
  };
  const handleBlockDriver = async (driverId) => {
    if (!confirm(t("admin.confirm_block_driver"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;
    try {
      const res = await fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/drivers/${driverId}/block`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(t("admin.block_driver_failed"));
      toast.success(t("admin.driver_blocked"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.block_driver_failed"));
    }
  };
  const handleUnblockDriver = async (driverId) => {
    if (!confirm(t("admin.confirm_unblock_driver"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;
    try {
      const res = await fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/drivers/${driverId}/unblock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(t("admin.unblock_driver_failed"));
      toast.success(t("admin.driver_unblocked"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.unblock_driver_failed"));
    }
  };
  const handleApproveDriver = async (driverId) => {
    if (!confirm(t("admin.confirm_approve_driver"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;
    try {
      const res = await fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/drivers/${driverId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(t("admin.approve_driver_failed"));
      toast.success(t("admin.driver_approved"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.approve_driver_failed"));
    }
  };
  const handleRejectDriver = (driverId, driverName) => {
    setRejectionDialog({
      open: true,
      driverId,
      driverName,
      reason: ""
    });
  };
  const handleRejectSubmit = async () => {
    if (!rejectionDialog.driverId) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;
    try {
      const res = await fetch(`${"https://ukyro-backend.onrender.com"}/api/admin/drivers/${rejectionDialog.driverId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rejectionReason: rejectionDialog.reason
        })
      });
      if (!res.ok) throw new Error(t("admin.reject_driver_failed"));
      toast.success(t("admin.driver_rejected"));
      setRejectionDialog({
        open: false,
        driverId: null,
        driverName: null,
        reason: ""
      });
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.reject_driver_failed"));
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex-1 container mx-auto px-4 md:px-6 py-8 max-w-6xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-5 w-5 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: t("admin.dashboard") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("admin.dashboard_desc") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleLogout, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4 mr-2" }),
          t("admin.logout")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "mb-6" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-64 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "space-y-2", children: [{
          id: "stats",
          label: t("admin.stats.dashboard"),
          icon: LayoutDashboard
        }, {
          id: "drivers",
          label: t("admin.drivers.title"),
          icon: UserCheck
        }, {
          id: "passengers",
          label: t("admin.passengers.title"),
          icon: UserX
        }, {
          id: "rides",
          label: t("admin.rides.title"),
          icon: Car
        }, {
          id: "bookings",
          label: t("admin.bookings.title"),
          icon: Calendar
        }].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: activeTab === tab.id ? "default" : "ghost", onClick: () => setActiveTab(tab.id), className: cn("w-full justify-start gap-3", activeTab === tab.id && "bg-primary text-primary-foreground"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { className: "h-4 w-4" }),
          tab.label
        ] }, tab.id)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
          opacity: 0,
          y: 10
        }, animate: {
          opacity: 1,
          y: 0
        }, transition: {
          duration: 0.3
        }, children: [
          activeTab === "stats" && stats && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 rounded-xl border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("admin.stats.users") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: stats.users })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-8 w-8 text-primary opacity-20" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 rounded-xl border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("admin.stats.rides") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: stats.rides })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-8 w-8 text-primary opacity-20" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 rounded-xl border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("admin.stats.bookings") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: stats.bookings })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-8 w-8 text-primary opacity-20" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 rounded-xl border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("admin.stats.active") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-green-600", children: stats.activeRides })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 rounded-xl border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("admin.stats.completed") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-blue-600", children: stats.completedRides })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 rounded-xl border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("admin.stats.cancelled") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-red-600", children: stats.cancelledRides })
            ] }) })
          ] }),
          activeTab === "drivers" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.driver") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.email_contact") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.vehicle_no") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.vehicle") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.bank_account") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.ifsc") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.ride_count") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.completed") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.active") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.pending") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.revenue") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.earnings") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.profile") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.approval") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium whitespace-nowrap", children: t("admin.drivers.actions") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: drivers.map((driver) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-8 w-8", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: driver.avatarUrl || void 0 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-xs", children: driver.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: driver.fullName })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: driver.email }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: driver.phone || "—" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: driver.vehicleNumber || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: driver.vehicleSeats ? `${driver.vehicleSeats}-seater` : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: driver.bankAccountNumber || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: driver.ifscCode || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm font-medium", children: driver.rideCount || 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm font-medium", children: driver.completedRides || 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm font-medium", children: driver.activeRides || 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm font-medium", children: driver.pendingPassengers || 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-sm font-medium text-green-600", children: [
                "₹",
                ((driver.revenue || 0) / 1e3).toFixed(1),
                "k"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-sm font-medium text-blue-600", children: [
                "₹",
                ((driver.earnings || 0) / 1e3).toFixed(1),
                "k"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: driver.isProfileComplete ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-green-600 text-xs", children: t("admin.drivers.complete") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: t("admin.drivers.incomplete") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: driver.isApproved ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-green-600 text-xs", children: t("admin.drivers.approved") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs", children: t("admin.drivers.pending_approval") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 flex-wrap", children: [
                !driver.isApproved && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => handleApproveDriver(driver._id), className: "h-7 px-2 text-xs bg-green-50 text-green-700 hover:bg-green-100", children: t("admin.drivers.approve") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => handleRejectDriver(driver._id, driver.fullName), className: "h-7 px-2 text-xs bg-red-50 text-red-700 hover:bg-red-100", children: t("admin.drivers.reject") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => handleReleasePayment(driver._id), disabled: !driver.revenue || driver.revenue === 0, className: "h-7 px-2 text-xs", children: t("admin.drivers.release_payment") }),
                driver.isBlocked ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => handleUnblockDriver(driver._id), className: "h-7 px-2 text-xs", children: t("admin.drivers.unblock") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", size: "sm", onClick: () => handleBlockDriver(driver._id), className: "h-7 px-2 text-xs", children: t("admin.drivers.block") })
              ] }) })
            ] }, driver._id)) })
          ] }) }) }),
          activeTab === "passengers" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.passengers.name") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.passengers.email") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.passengers.admin") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.passengers.created") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.passengers.actions") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: users.filter((u) => u.role === "passenger").map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: user.fullName }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: user.email }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: user.isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-primary", children: t("admin.passengers.yes") }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: t("admin.passengers.no") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: format(new Date(user.createdAt), "MMM dd, yyyy") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDeleteUser(user._id), className: "text-destructive hover:text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) })
            ] }, user._id)) })
          ] }) }),
          activeTab === "rides" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.rides.route") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.rides.driver") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.rides.departure") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.rides.status") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.rides.actions") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rides.map((ride) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium", children: [
                  ride.origin,
                  " → ",
                  ride.destination
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  ride.seatsAvailable,
                  "/",
                  ride.seatsTotal,
                  " seats · ₹",
                  ride.pricePerSeat
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: ride.driverId.fullName }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: format(new Date(ride.departureAt), "MMM dd, HH:mm") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: ride.status === "active" ? "default" : ride.status === "completed" ? "secondary" : "destructive", children: ride.status }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDeleteRide(ride._id), className: "text-destructive hover:text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) })
            ] }, ride._id)) })
          ] }) }),
          activeTab === "bookings" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.bookings.passenger") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.bookings.ride") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.bookings.seats") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.bookings.status") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.bookings.booked") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-sm font-medium", children: t("admin.bookings.actions") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: bookings.map((booking) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: booking.passengerId.fullName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: booking.passengerId.email })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: [
                booking.rideId.origin,
                " → ",
                booking.rideId.destination
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: booking.seats }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: booking.status === "confirmed" ? "default" : "secondary", children: booking.status }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-muted-foreground", children: format(new Date(booking.createdAt), "MMM dd, HH:mm") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDeleteBooking(booking._id), className: "text-destructive hover:text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) })
            ] }, booking._id)) })
          ] }) })
        ] }, activeTab) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: rejectionDialog.open, onOpenChange: (open) => setRejectionDialog((prev) => ({
      ...prev,
      open
    })), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { className: "h-5 w-5 text-red-600" }),
        "Reject Driver Application"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "You are rejecting the driver application for ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: rejectionDialog.driverName }),
          "."
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "rejectionReason", children: "Rejection Reason *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "rejectionReason", placeholder: "Please provide a reason for rejecting this driver application...", value: rejectionDialog.reason, onChange: (e) => setRejectionDialog((prev) => ({
            ...prev,
            reason: e.target.value
          })), rows: 4, className: "resize-none" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "This reason will be shown to the driver to help them understand why their application was rejected." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setRejectionDialog({
            open: false,
            driverId: null,
            driverName: null,
            reason: ""
          }), className: "flex-1", children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleRejectSubmit, disabled: !rejectionDialog.reason.trim(), className: "flex-1 bg-red-600 hover:bg-red-700", children: "Reject Driver" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  AdminDashboard as component
};
