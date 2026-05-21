import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
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
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — RideWave" },
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

      if (!statsRes.ok) throw new Error("Failed to fetch stats");
      if (!usersRes.ok) throw new Error("Failed to fetch users");
      if (!driversRes.ok) throw new Error("Failed to fetch drivers");
      if (!ridesRes.ok) throw new Error("Failed to fetch rides");
      if (!bookingsRes.ok) throw new Error("Failed to fetch bookings");

      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setDrivers(await driversRes.json());
      setRides(await ridesRes.json());
      setBookings(await bookingsRes.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("kshira_admin_token");
    navigate({ to: "/admin/login" });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!confirm("Are you sure you want to delete this ride?")) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/rides/${rideId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete ride");
      toast.success("Ride deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete ride");
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete booking");
      toast.success("Booking deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete booking");
    }
  };

  const handleReleasePayment = async (driverId: string) => {
    if (!confirm("Are you sure you want to release payment to this driver?")) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${driverId}/release-payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to release payment");
      toast.success("Payment released successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to release payment");
    }
  };

  const handleBlockDriver = async (driverId: string) => {
    if (!confirm("Are you sure you want to block this driver? This will cancel all their active rides.")) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${driverId}/block`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to block driver");
      toast.success("Driver blocked successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to block driver");
    }
  };

  const handleUnblockDriver = async (driverId: string) => {
    if (!confirm("Are you sure you want to unblock this driver?")) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${driverId}/unblock`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to unblock driver");
      toast.success("Driver unblocked successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unblock driver");
    }
  };

  const handleApproveDriver = async (driverId: string) => {
    if (!confirm("Are you sure you want to approve this driver?")) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${driverId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to approve driver");
      toast.success("Driver approved successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve driver");
    }
  };

  const handleRejectDriver = async (driverId: string) => {
    if (!confirm("Are you sure you want to reject this driver? This will mark their profile as incomplete.")) return;
    const token = localStorage.getItem("kshira_admin_token");
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${driverId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to reject driver");
      toast.success("Driver rejected successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject driver");
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
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage users, rides, and bookings</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Separator className="mb-6" />

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {[
                { id: "stats", label: "Dashboard", icon: LayoutDashboard },
                { id: "drivers", label: "Drivers", icon: UserCheck },
                { id: "passengers", label: "Passengers", icon: UserX },
                { id: "rides", label: "Rides", icon: Car },
                { id: "bookings", label: "Bookings", icon: Calendar },
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
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{stats.users}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary opacity-20" />
                </div>
              </div>
              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rides</p>
                    <p className="text-3xl font-bold">{stats.rides}</p>
                  </div>
                  <Car className="h-8 w-8 text-primary opacity-20" />
                </div>
              </div>
              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-3xl font-bold">{stats.bookings}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary opacity-20" />
                </div>
              </div>
              <div className="p-6 rounded-xl border bg-card">
                <div>
                  <p className="text-sm text-muted-foreground">Active Rides</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeRides}</p>
                </div>
              </div>
              <div className="p-6 rounded-xl border bg-card">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Rides</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.completedRides}</p>
                </div>
              </div>
              <div className="p-6 rounded-xl border bg-card">
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled Rides</p>
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
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Driver</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Email/Contact</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Vehicle No.</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Vehicle</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Bank Account</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">IFSC</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Total Rides</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Completed</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Active</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Pending Pass.</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Revenue</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Earnings</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Profile</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Approval</th>
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">Actions</th>
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
                            <Badge className="bg-green-600 text-xs">Complete</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Incomplete</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {driver.isApproved ? (
                            <Badge className="bg-green-600 text-xs">Approved</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Pending</Badge>
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
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectDriver(driver._id)}
                                  className="h-7 px-2 text-xs bg-red-50 text-red-700 hover:bg-red-100"
                                >
                                  Reject
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
                              Release
                            </Button>
                            {driver.isBlocked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockDriver(driver._id)}
                                className="h-7 px-2 text-xs"
                              >
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleBlockDriver(driver._id)}
                                className="h-7 px-2 text-xs"
                              >
                                Block
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
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Admin</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === "passenger").map((user) => (
                    <tr key={user._id} className="border-t">
                      <td className="px-4 py-3 text-sm">{user.fullName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        {user.isAdmin ? <Badge className="bg-primary">Yes</Badge> : <Badge variant="outline">No</Badge>}
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
                    <th className="px-4 py-3 text-left text-sm font-medium">Route</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Driver</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Departure</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
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
                    <th className="px-4 py-3 text-left text-sm font-medium">Passenger</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Ride</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Seats</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Booked</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
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
    </div>
  );
}
