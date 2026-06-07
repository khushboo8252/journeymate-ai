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
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  createdAt: string;
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

  useEffect(() => {
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) {
      navigate({ to: "/admin/login" });
      return;
    }
    fetchData();
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

  const handleReleasePayment = async (driverId: string) => {
    if (!confirm(t("admin.confirm_release_payment"))) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${driverId}/release-payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t("admin.release_payment_failed"));
      toast.success(t("admin.payment_released"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.release_payment_failed"));
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
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("admin.dashboard")}</h1>
              <p className="text-sm text-muted-foreground">{t("admin.dashboard_desc")}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            {t("admin.logout")}
          </Button>
        </div>

        <Separator className="mb-6" />

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
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
                    "w-full justify-start gap-3",
                    activeTab === tab.id && "bg-primary text-primary-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "stats" && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {activeTab === "drivers" && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.driver")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.email_contact")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.vehicle_no")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.vehicle")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.bank_account")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.ifsc")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.ride_count")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.completed")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.active")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.pending")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.revenue")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.earnings")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.profile")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.approval")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t("admin.drivers.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((driver) => (
                      <tr key={driver._id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={driver.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {driver.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{driver.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="text-xs text-muted-foreground">{driver.email}</div>
                          <div className="text-xs text-muted-foreground">{driver.phone || "—"}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{driver.vehicleNumber || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {driver.vehicleSeats ? `${driver.vehicleSeats}-seater` : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{driver.bankAccountNumber || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{driver.ifscCode || "—"}</td>
                        <td className="px-4 py-3 text-sm font-medium">{driver.rideCount || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium">{driver.completedRides || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium">{driver.activeRides || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium">{driver.pendingPassengers || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">₹{((driver.revenue || 0) / 1000).toFixed(1)}k</td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">₹{((driver.earnings || 0) / 1000).toFixed(1)}k</td>
                        <td className="px-4 py-3 text-sm">
                          {driver.isProfileComplete ? (
                            <Badge className="bg-green-600 text-xs">{t("admin.drivers.complete")}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">{t("admin.drivers.incomplete")}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {driver.isApproved ? (
                            <Badge className="bg-green-600 text-xs">{t("admin.drivers.approved")}</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">{t("admin.drivers.pending_approval")}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-1 flex-wrap">
                            {!driver.isApproved && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveDriver(driver._id)}
                                  className="h-7 px-2 text-xs bg-green-50 text-green-700 hover:bg-green-100"
                                >
                                  {t("admin.drivers.approve")}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectDriver(driver._id, driver.fullName)}
                                  className="h-7 px-2 text-xs bg-red-50 text-red-700 hover:bg-red-100"
                                >
                                  {t("admin.drivers.reject")}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReleasePayment(driver._id)}
                              disabled={!driver.revenue || driver.revenue === 0}
                              className="h-7 px-2 text-xs"
                            >
                              {t("admin.drivers.release_payment")}
                            </Button>
                            {driver.isBlocked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockDriver(driver._id)}
                                className="h-7 px-2 text-xs"
                              >
                                {t("admin.drivers.unblock")}
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleBlockDriver(driver._id)}
                                className="h-7 px-2 text-xs"
                              >
                                {t("admin.drivers.block")}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "passengers" && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.passengers.name")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.passengers.email")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.passengers.admin")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.passengers.created")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.passengers.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === "passenger").map((user) => (
                    <tr key={user._id} className="border-t">
                      <td className="px-4 py-3 text-sm">{user.fullName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        {user.isAdmin ? <Badge className="bg-primary">{t("admin.passengers.yes")}</Badge> : <Badge variant="outline">{t("admin.passengers.no")}</Badge>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
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
          )}

          {activeTab === "rides" && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.rides.route")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.rides.driver")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.rides.departure")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.rides.status")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.rides.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride) => (
                    <tr key={ride._id} className="border-t">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{ride.origin} → {ride.destination}</p>
                          <p className="text-xs text-muted-foreground">
                            {ride.seatsAvailable}/{ride.seatsTotal} seats · ₹{ride.pricePerSeat}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{ride.driverId.fullName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(new Date(ride.departureAt), "MMM dd, HH:mm")}
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
          )}

          {activeTab === "bookings" && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.bookings.passenger")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.bookings.ride")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.bookings.seats")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.bookings.status")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.bookings.booked")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.bookings.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="border-t">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{booking.passengerId.fullName}</p>
                          <p className="text-xs text-muted-foreground">{booking.passengerId.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {booking.rideId.origin} → {booking.rideId.destination}
                      </td>
                      <td className="px-4 py-3 text-sm">{booking.seats}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(new Date(booking.createdAt), "MMM dd, HH:mm")}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Reject Driver Application
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                You are rejecting the driver application for <strong>{rejectionDialog.driverName}</strong>.
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
                Reject Driver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
