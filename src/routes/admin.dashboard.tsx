import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  LogOut,
  Users,
  Car,
  Calendar,
  Trash2,
  Shield,
  LayoutDashboard,
  UserCheck,
  UserX,
  X,
  Eye,
  FileText, // Naya icon add kiya
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Ukyro" },
    ],
  }),
  component: AdminDashboard,
});

type AdminStats = {
  users: number;
  rides: number;
  bookings: number;
  activeRides: number;
  completedRides: number;
  cancelledRides: number;
};

type User = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isAdmin: boolean;
  phone?: string | null;
  avatarUrl?: string | null;
  vehicleSeats?: number | null;
  vehicleNumber?: string | null;
  isProfileComplete: boolean;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  earnings?: number;
  isBlocked?: boolean;
  isApproved?: boolean;
  createdAt: string;
  drivingLicense?: {
    frontUrl?: string | null;
    backUrl?: string | null;
  };
  aadharCard?: {
    frontUrl?: string | null;
    backUrl?: string | null;
  };
  panCard?: {
    frontUrl?: string | null;
  };
  rc?: {
    frontUrl?: string | null;
    backUrl?: string | null;
  };
  vehicleImage?: {
    url?: string | null;
  };
  insuranceCertificate?: {
    url?: string | null;
  };
  pollutionCertificate?: {
    url?: string | null;
  };
};

type Ride = {
  _id: string;
  origin: string;
  destination: string;
  departureAt: string;
  status: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  driverId: {
    fullName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
};

type Booking = {
  _id: string;
  passengerId: {
    fullName: string;
    email: string;
    phone: string;
  };
  rideId: {
    origin: string;
    destination: string;
    departureAt: string;
    pricePerSeat: number;
  };
  seats: number;
  status: string;
  createdAt: string;
};

// Ek chota component documents ko card jaisa dikhane ke liye
const DocumentLink = ({ href, label }: { href: string; label: string }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="flex items-center gap-2 p-2.5 border rounded-lg bg-muted/30 hover:bg-muted transition-colors group"
  >
    <div className="bg-primary/10 p-1.5 rounded-md group-hover:bg-primary/20 transition-colors">
      <FileText className="h-4 w-4 text-primary" />
    </div>
    <span className="text-xs font-medium truncate flex-1">{label}</span>
  </a>
);

function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<(User & {
    rideCount?: number;
    completedRides?: number;
    activeRides?: number;
    revenue?: number;
    pendingPassengers?: number;
    isApproved?: boolean;
  })[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "drivers" | "passengers" | "rides" | "bookings">("stats");
  const [rejectionDialog, setRejectionDialog] = useState<{
    open: boolean;
    driverId: string | null;
    driverName: string | null;
    reason: string;
  }>({ open: false, driverId: null, driverName: null, reason: "" });
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    driver: User | null;
  }>({ open: false, driver: null });

  useEffect(() => {
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) {
      navigate({ to: "/admin/login" });
      return;
    }
    fetchData();

    // Listen for driver profile updates via WebSocket
    const socket = getSocket();
    const handleDriverProfileUpdated = (data: any) => {
      console.log("Driver profile updated:", data);
      toast.success("New driver profile submitted for approval");
      fetchData(); // Refresh data to show the new profile
    };

    const handleUserProfileUpdated = (data: any) => {
      console.log("User profile updated:", data);
      toast.success("User profile updated");
      fetchData(); // Refresh data to show the updated profile
    };

    socket.on("driver_profile_updated", handleDriverProfileUpdated);
    socket.on("user_profile_updated", handleUserProfileUpdated);

    return () => {
      socket.off("driver_profile_updated", handleDriverProfileUpdated);
      socket.off("user_profile_updated", handleUserProfileUpdated);
    };
  }, [navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const [statsRes, usersRes, driversRes, ridesRes, bookingsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/rides`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

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
    navigate({ to: "/admin/login" });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t("admin.confirm_delete_user"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t("admin.delete_user_failed"));
      toast.success(t("admin.user_deleted"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.delete_user_failed"));
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!confirm(t("admin.confirm_delete_ride"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/rides/${rideId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t("admin.delete_ride_failed"));
      toast.success(t("admin.ride_deleted"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.delete_ride_failed"));
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm(t("admin.confirm_delete_booking"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t("admin.delete_booking_failed"));
      toast.success(t("admin.booking_deleted"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.delete_booking_failed"));
    }
  };

  const handleBlockDriver = async (driverId: string) => {
    if (!confirm(t("admin.confirm_block_driver"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${driverId}/block`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t("admin.block_driver_failed"));
      
      toast.success(t("admin.driver_blocked"));
      
      setViewDialog(prev => {
        if (prev.driver && prev.driver._id === driverId) {
          return {
            ...prev,
            driver: { ...prev.driver, isBlocked: true }
          };
        }
        return prev;
      });

      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.block_driver_failed"));
    }
  };

  const handleUnblockDriver = async (driverId: string) => {
    if (!confirm(t("admin.confirm_unblock_driver"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${driverId}/unblock`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t("admin.unblock_driver_failed"));
      
      toast.success(t("admin.driver_unblocked"));
      
      setViewDialog(prev => {
        if (prev.driver && prev.driver._id === driverId) {
          return {
            ...prev,
            driver: { ...prev.driver, isBlocked: false }
          };
        }
        return prev;
      });

      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.unblock_driver_failed"));
    }
  };

  const handleApproveDriver = async (driverId: string) => {
    if (!confirm(t("admin.confirm_approve_driver"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${driverId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t("admin.approve_driver_failed"));
      
      toast.success(t("admin.driver_approved"));
      
      setViewDialog(prev => {
        if (prev.driver && prev.driver._id === driverId) {
          return {
            ...prev,
            driver: { ...prev.driver, isApproved: true }
          };
        }
        return prev;
      });

      fetchData(); 
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.approve_driver_failed"));
    }
  };

  const handleRejectDriver = (driverId: string, driverName: string) => {
    setRejectionDialog({
      open: true,
      driverId,
      driverName,
      reason: "",
    });
  };

  const handleRejectSubmit = async () => {
    if (!rejectionDialog.driverId) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${rejectionDialog.driverId}/reject`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejectionReason: rejectionDialog.reason,
        }),
      });
      if (!res.ok) throw new Error(t("admin.reject_driver_failed"));
      toast.success(t("admin.driver_rejected"));
      setRejectionDialog({ open: false, driverId: null, driverName: null, reason: "" });
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.reject_driver_failed"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{t("admin.dashboard")}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{t("admin.dashboard_desc")}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="h-4 w-4 mr-2" />
            {t("admin.logout")}
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* 🚨 Yahan Layout ko Responsive banaya gaya hai */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar / Top Navigation on Mobile */}
          <div className="w-full md:w-64 flex-shrink-0 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <nav className="flex flex-row md:flex-col gap-2 min-w-max md:min-w-0">
              {[
                { id: "stats", label: t("admin.stats.dashboard"), icon: LayoutDashboard },
                { id: "drivers", label: t("admin.drivers.title"), icon: UserCheck },
                { id: "passengers", label: t("admin.passengers.title"), icon: UserX },
                { id: "rides", label: t("admin.rides.title"), icon: Car },
                { id: "bookings", label: t("admin.bookings.title"), icon: Calendar },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "md:w-full justify-start gap-2 whitespace-nowrap",
                    activeTab === tab.id && "bg-primary text-primary-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "stats" && stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("admin.stats.users")}</p>
                        <p className="text-3xl font-bold">{stats.users}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary opacity-20" />
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("admin.stats.rides")}</p>
                        <p className="text-3xl font-bold">{stats.rides}</p>
                      </div>
                      <Car className="h-8 w-8 text-primary opacity-20" />
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("admin.stats.bookings")}</p>
                        <p className="text-3xl font-bold">{stats.bookings}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-primary opacity-20" />
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border bg-card">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.stats.active")}</p>
                      <p className="text-3xl font-bold text-green-600">{stats.activeRides}</p>
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border bg-card">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.stats.completed")}</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.completedRides}</p>
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border bg-card">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.stats.cancelled")}</p>
                      <p className="text-3xl font-bold text-red-600">{stats.cancelledRides}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 🚨 Saari tables ko overflow-x-auto mein wrap kiya gaya hai */}
              {activeTab === "drivers" && (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.driver")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.email_contact")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Vehicle No.</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Seats</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drivers.map((driver) => {
                          const driverInitials = driver?.fullName 
                            ? driver.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                            : driver?.email?.[0]?.toUpperCase() || "?";

                          return (
                            <tr key={driver._id} className="border-t">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={driver.avatarUrl || undefined} />
                                    <AvatarFallback className="text-xs font-bold">
                                      {driverInitials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-sm whitespace-nowrap">{driver.fullName || "No Name"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="text-xs text-muted-foreground">{driver.email}</div>
                                <div className="text-xs text-muted-foreground">{driver.phone || "—"}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{driver.vehicleNumber || "—"}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{driver.vehicleSeats || "—"}</td>
                              <td className="px-4 py-3 text-sm">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewDialog({ open: true, driver })}
                                  className="h-7 px-2 text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "passengers" && (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.passengers.name")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.passengers.email")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.passengers.admin")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.passengers.created")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.passengers.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === "passenger").map((user) => (
                          <tr key={user._id} className="border-t">
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{user.fullName || "No Name"}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                            <td className="px-4 py-3 text-sm">
                              {user.isAdmin ? <Badge className="bg-primary">{t("admin.passengers.yes")}</Badge> : <Badge variant="outline">{t("admin.passengers.no")}</Badge>}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                              {user.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "—"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "rides" && (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.rides.route")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.rides.driver")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.rides.departure")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.rides.status")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.rides.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rides.map((ride) => (
                          <tr key={ride._id} className="border-t">
                            <td className="px-4 py-3 text-sm">
                              <div className="whitespace-nowrap">
                                <p className="font-medium">{ride.origin} → {ride.destination}</p>
                                <p className="text-xs text-muted-foreground">
                                  {ride.seatsAvailable}/{ride.seatsTotal} seats · ₹{ride.pricePerSeat}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{ride.driverId?.fullName || "Unknown Driver"}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                              {ride.departureAt ? format(new Date(ride.departureAt), "MMM dd, HH:mm") : "—"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge
                                variant={
                                  ride.status === "active"
                                    ? "default"
                                    : ride.status === "completed"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {ride.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRide(ride._id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.bookings.passenger")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.bookings.ride")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.bookings.seats")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.bookings.status")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.bookings.booked")}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.bookings.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking._id} className="border-t">
                            <td className="px-4 py-3 text-sm">
                              <div className="whitespace-nowrap">
                                <p className="font-medium">{booking.passengerId?.fullName || "No Name"}</p>
                                <p className="text-xs text-muted-foreground">{booking.passengerId?.email || "—"}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                              {booking.rideId ? `${booking.rideId.origin} → ${booking.rideId.destination}` : "—"}
                            </td>
                            <td className="px-4 py-3 text-sm">{booking.seats}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                              {booking.createdAt ? format(new Date(booking.createdAt), "MMM dd, HH:mm") : "—"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBooking(booking._id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog.open} onOpenChange={(open) => 
        setRejectionDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent className="sm:max-w-md w-[95vw] mx-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Reject Driver Application
            </DialogTitle>
            <DialogDescription className="hidden">
              Form to provide a rationale description for rejecting the application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                You are rejecting the driver application for <strong>{rejectionDialog.driverName || "This Driver"}</strong>.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Please provide a reason for rejecting this driver application..."
                value={rejectionDialog.reason}
                onChange={(e) => setRejectionDialog(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be shown to the driver to help them understand why their application was rejected.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setRejectionDialog({ open: false, driverId: null, driverName: null, reason: "" })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={!rejectionDialog.reason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Driver Details Dialog - Fully Responsive */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => 
        setViewDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <UserCheck className="h-5 w-5 text-primary" />
              Driver Profile Details
            </DialogTitle>
            <DialogDescription className="hidden">
              Detailed view of driver document validation variables.
            </DialogDescription>
          </DialogHeader>
          {viewDialog.driver && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
                  <AvatarImage src={viewDialog.driver.avatarUrl || undefined} />
                  <AvatarFallback className="text-lg sm:text-xl font-bold">
                    {viewDialog.driver.fullName 
                      ? viewDialog.driver.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() 
                      : viewDialog.driver.email?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold truncate">{viewDialog.driver.fullName || "No Name Provided"}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{viewDialog.driver.email}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{viewDialog.driver.phone || "—"}</p>
                </div>
              </div>

              {/* Info Grid - 1 col on mobile, 2 cols on bigger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <Label className="text-xs text-muted-foreground">Vehicle Number</Label>
                  <p className="font-medium text-sm">{viewDialog.driver.vehicleNumber || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vehicle Seats</Label>
                  <p className="font-medium text-sm">{viewDialog.driver.vehicleSeats || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Bank Account</Label>
                  <p className="font-medium text-sm break-all">{viewDialog.driver.bankAccountNumber || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">IFSC Code</Label>
                  <p className="font-medium text-sm">{viewDialog.driver.ifscCode || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Profile Status</Label>
                  <div className="mt-1">
                    {viewDialog.driver.isProfileComplete ? (
                      <Badge className="bg-green-600">Complete</Badge>
                    ) : (
                      <Badge variant="outline">Incomplete</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Approval Status</Label>
                  <div className="mt-1">
                    {viewDialog.driver.isApproved ? (
                      <Badge className="bg-green-600">Approved</Badge>
                    ) : (
                      <Badge variant="destructive">Pending Approval</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Account Status</Label>
                  <div className="mt-1">
                    {viewDialog.driver.isBlocked ? (
                      <Badge variant="destructive">Blocked</Badge>
                    ) : (
                      <Badge className="bg-green-600">Active</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Member Since</Label>
                  <p className="font-medium text-sm">
                    {viewDialog.driver.createdAt ? format(new Date(viewDialog.driver.createdAt), "MMM dd, yyyy") : "—"}
                  </p>
                </div>
              </div>

              {/* 🚨 Documents Section with Beautiful Cards */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-bold border-b pb-2 block w-full">Uploaded Documents</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {viewDialog.driver.drivingLicense?.frontUrl && (
                    <DocumentLink href={viewDialog.driver.drivingLicense.frontUrl} label="Driving License (Front)" />
                  )}
                  {viewDialog.driver.drivingLicense?.backUrl && (
                    <DocumentLink href={viewDialog.driver.drivingLicense.backUrl} label="Driving License (Back)" />
                  )}
                  {viewDialog.driver.aadharCard?.frontUrl && (
                    <DocumentLink href={viewDialog.driver.aadharCard.frontUrl} label="Aadhar Card (Front)" />
                  )}
                  {viewDialog.driver.aadharCard?.backUrl && (
                    <DocumentLink href={viewDialog.driver.aadharCard.backUrl} label="Aadhar Card (Back)" />
                  )}
                  {viewDialog.driver.panCard?.frontUrl && (
                    <DocumentLink href={viewDialog.driver.panCard.frontUrl} label="PAN Card" />
                  )}
                  {viewDialog.driver.rc?.frontUrl && (
                    <DocumentLink href={viewDialog.driver.rc.frontUrl} label="RC (Front)" />
                  )}
                  {viewDialog.driver.rc?.backUrl && (
                    <DocumentLink href={viewDialog.driver.rc.backUrl} label="RC (Back)" />
                  )}
                  {viewDialog.driver.vehicleImage?.url && (
                    <DocumentLink href={viewDialog.driver.vehicleImage.url} label="Vehicle Image" />
                  )}
                  {viewDialog.driver.insuranceCertificate?.url && (
                    <DocumentLink href={viewDialog.driver.insuranceCertificate.url} label="Insurance Certificate" />
                  )}
                  {viewDialog.driver.pollutionCertificate?.url && (
                    <DocumentLink href={viewDialog.driver.pollutionCertificate.url} label="Pollution Certificate" />
                  )}

                  {(!viewDialog.driver.drivingLicense?.frontUrl && 
                    !viewDialog.driver.aadharCard?.frontUrl && 
                    !viewDialog.driver.panCard?.frontUrl && 
                    !viewDialog.driver.rc?.frontUrl && 
                    !viewDialog.driver.vehicleImage?.url &&
                    !viewDialog.driver.insuranceCertificate?.url &&
                    !viewDialog.driver.pollutionCertificate?.url) && (
                    <div className="col-span-1 sm:col-span-2 p-4 text-center border border-dashed rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-4">
                {!viewDialog.driver.isApproved && (
                  <Button
                    onClick={() => handleApproveDriver(viewDialog.driver!._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Approve Driver
                  </Button>
                )}

                {!viewDialog.driver.isApproved && (
                  <Button
                    onClick={() => {
                      handleRejectDriver(viewDialog.driver!._id, viewDialog.driver!.fullName || "This Driver");
                      setViewDialog({ open: false, driver: null });
                    }}
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                  >
                    Reject Application
                  </Button>
                )}

                {viewDialog.driver.isBlocked ? (
                  <Button
                    onClick={() => {
                      handleUnblockDriver(viewDialog.driver!._id);
                      setViewDialog({ open: false, driver: null });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Unblock Driver
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      handleBlockDriver(viewDialog.driver!._id);
                      setViewDialog({ open: false, driver: null });
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    Block Driver
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}