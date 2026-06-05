import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { getSocket, joinUserRoom, joinDriverRoom } from "@/lib/socket";
import {
  ArrowRight,
  Calendar,
  Car,
  Check,
  CheckCircle,
  ExternalLink,
  IndianRupee,
  Lock,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Ticket,
  Trash2,
  User,
  Users,
  X,
  Wind,
} from "lucide-react";
import { RideCard } from "@/components/site/RideCard";
import { LocationTracker } from "@/components/driver/LocationTracker";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { ApiRide, ApiBooking, ApiUser } from "@/lib/api";
import { DriverSeatMap, type Seat as DriverSeat } from "@/components/driver/DriverSeatMap";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ukyro" },
      { name: "description", content: "Manage your rides and bookings." },
    ],
  }),
  component: DashboardPage,
});

type BookingWithRide = ApiBooking & {
  rideId: ApiRide & {
    driverId: ApiUser | null;
  };
};

type DriverBooking = ApiBooking & {
  passengerId: ApiUser | null;
  rideId: Pick<ApiRide, "_id" | "origin" | "destination" | "departureAt" | "pricePerSeat" | "seatsTotal"> | null;
};

function DashboardPage() {
  const { t } = useTranslation();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [myRides, setMyRides] = useState<ApiRide[]>([]);
  const [myBookings, setMyBookings] = useState<BookingWithRide[]>([]);
  const [driverBookings, setDriverBookings] = useState<DriverBooking[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [selectedRideForSeatMap, setSelectedRideForSeatMap] = useState<ApiRide | null>(null);
  const [seatsForMap, setSeatsForMap] = useState<DriverSeat[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const isDriver = user?.role === "driver";

  // Search functionality for passengers
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchRides, setSearchRides] = useState<ApiRide[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? "");
    setPhone(user.phone ?? "");
    fetchData();

    // Connect to WebSocket
    const socket = getSocket();
    if (isDriver) {
      joinDriverRoom(user._id);
    } else {
      joinUserRoom(user._id);
    }

    // Fetch latest user data to check approval status
    const checkApprovalStatus = async () => {
      try {
        const userData = await api.get<{ user: ApiUser }>("/api/profile");
        const updatedUser = userData.user;
        
        // Update local user state if needed
        if (isDriver && updatedUser.isApproved && !updatedUser.hasSeenApprovalNotification) {
          setShowApprovalPopup(true);

          // Auto-dismiss after 10 seconds
          const timer = setTimeout(() => {
            setShowApprovalPopup(false);
            // Mark as seen when auto-dismissed
            api.post("/api/profile/notification-seen", {}).catch(console.error);
          }, 10000);

          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error("Failed to check approval status:", err);
      }
    };

    if (isDriver) {
      checkApprovalStatus();
    }

    // Listen for real-time events
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

    // Ride completion confirmation events
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

    return () => {
      socket.off("driver_approved");
      socket.off("driver_rejected");
      socket.off("booking_created");
      socket.off("booking_cancelled");
      socket.off("ride_cancelled");
      socket.off("driver_confirmed_completion");
      socket.off("passenger_confirmed_completion");
      socket.off("ride_completed");
    };
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const basePromises: [Promise<ApiRide[]>, Promise<BookingWithRide[]>] = [
        api.get<ApiRide[]>("/api/rides/my"),
        api.get<BookingWithRide[]>("/api/bookings/my"),
      ];
      
      let driverBookingsRes: DriverBooking[] = [];
      if (isDriver) {
        const [ridesRes, bookingsRes, driverRes] = await Promise.all([
          ...basePromises,
          api.get<DriverBooking[]>("/api/bookings/driver")
        ]);
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

  const fetchSeatsForRide = async (rideId: string) => {
    try {
      setLoadingSeats(true);
      const response = await api.get<{ seats: DriverSeat[] }>(`/api/rides/${rideId}/seats/passengers`);
      setSeatsForMap(response.seats);
    } catch (err) {
      console.error("Failed to fetch seats:", err);
      toast.error("Failed to load seat map");
    } finally {
      setLoadingSeats(false);
    }
  };

  const openSeatMap = (ride: ApiRide) => {
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
      await api.put("/api/profile", { fullName, phone });
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  const cancelRide = async (id: string) => {
    try {
      await api.patch(`/api/rides/${id}/cancel`);
      toast.success("Ride cancelled.");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    }
  };

  const cancelBooking = async (id: string) => {
    try {
      await api.patch(`/api/bookings/${id}/cancel`);
      toast.success("Booking cancelled.");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    }
  };

  const confirmRide = async (rideId: string) => {
    try {
      const response = await api.patch<{
        success: boolean;
        confirmByDriver: boolean;
        confirmByPassenger: boolean;
        isCompleted: boolean;
      }>(`/api/rides/${rideId}/confirm/driver`);
      
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

  const handlePopupClick = async () => {
    // Mark notification as seen
    await api.post("/api/profile/notification-seen", {});
    setShowApprovalPopup(false);
    router.navigate({ to: "/publish" });
  };

  const handlePopupDismiss = async () => {
    // Mark notification as seen
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
      const data = await api.get<ApiRide[]>(`/api/rides?${qs.toString()}`);
      setSearchRides(Array.isArray(data) ? data : []);
    } catch {
      setSearchRides([]);
    }
    setSearchLoading(false);
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="glass rounded-2xl p-10 text-center max-w-sm w-full">
            <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("auth.signin")}</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your dashboard.</p>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">
                {t("auth.signin")}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = fullName
    ? fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Profile header */}
          <div className="glass rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-5">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-bold">{fullName || "My Account"}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isDriver
                    ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground border border-border/40"
                }`}>
                  {isDriver ? <Car className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {isDriver ? t("auth.driver") : t("auth.passenger")}
                </span>
                {isDriver && (user as any).isApproved && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-500/20 text-green-600 border border-green-500/30">
                    <CheckCircle className="h-3 w-3" />
                    {t("dashboard.verified")}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">{user.email ?? ""}</p>
            </div>
            <div className="flex items-center gap-2">
              {isDriver && !(user as any).isProfileComplete && (
                <Link to="/driver-setup">
                  <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-semibold">
                    <Car className="h-4 w-4 mr-1.5" />Complete Profile
                  </Button>
                </Link>
              )}
              {isDriver && (user as any).isProfileComplete && (
                <Link to="/publish">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-semibold">
                    <Car className="h-4 w-4 mr-1.5" />Publish Ride
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />{t("nav.login")}
              </Button>
            </div>
          </div>

          {/* Approval Popup */}
          {showApprovalPopup && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="glass rounded-2xl p-6 mb-6 border border-green-500/30 bg-green-500/10"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-green-600">Congratulations!</h3>
                  <p className="text-sm text-muted-foreground mt-1">You have become a verified driver.</p>
                  <p className="text-xs text-muted-foreground mt-2">Click here to publish your first ride.</p>
                </div>
                <button
                  onClick={handlePopupDismiss}
                  className="flex-shrink-0 p-1 hover:bg-green-500/20 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <Button
                onClick={handlePopupClick}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
              >
                {t("dashboard.publish_now")}
              </Button>
            </motion.div>
          )}

          <Tabs defaultValue={isDriver ? "rides" : (!isDriver ? "search" : "bookings")}>
            <TabsList className="mb-6 bg-muted/40 flex-wrap h-auto gap-1">
              {!isDriver && (
                <TabsTrigger value="search" className="flex items-center gap-1.5"><Search className="h-4 w-4" />Search Rides</TabsTrigger>
              )}
              {isDriver && (
                <TabsTrigger value="rides" className="flex items-center gap-1.5"><Car className="h-4 w-4" />{t("dashboard.my_rides")} ({myRides.length})</TabsTrigger>
              )}
              {isDriver && (
                <TabsTrigger value="passengers" className="flex items-center gap-1.5"><Users className="h-4 w-4" />Passengers ({driverBookings.filter(b => b.status === "confirmed").length})</TabsTrigger>
              )}
              <TabsTrigger value="bookings" className="flex items-center gap-1.5"><Ticket className="h-4 w-4" />{t("dashboard.my_bookings")} ({myBookings.length})</TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-1.5"><User className="h-4 w-4" />Profile</TabsTrigger>
            </TabsList>

            {/* SEARCH RIDES — passengers only */}
            {!isDriver && (
              <TabsContent value="search" className="space-y-4">
                <div className="glass rounded-2xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative rounded-xl bg-background/60 border border-border/40 px-4 py-2">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        From
                      </label>
                      <Input
                        type="text"
                        placeholder="Departure city"
                        value={searchFrom}
                        onChange={e => setSearchFrom(e.target.value)}
                        className="border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0"
                      />
                    </div>
                    <div className="relative rounded-xl bg-background/60 border border-border/40 px-4 py-2">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        To
                      </label>
                      <Input
                        type="text"
                        placeholder="Destination city"
                        value={searchTo}
                        onChange={e => setSearchTo(e.target.value)}
                        className="border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0"
                      />
                    </div>
                    <div className="relative rounded-xl bg-background/60 border border-border/40 px-4 py-2">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        Date
                      </label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={searchDate}
                        onChange={e => setSearchDate(e.target.value)}
                        className="border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSearch} disabled={searchLoading} className="w-full mt-3 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/40 font-semibold">
                    {searchLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Search Rides
                  </Button>
                </div>

                {searched && (
                  <div className="space-y-4">
                    {searchRides.length === 0 ? (
                      <div className="text-center py-16 glass rounded-2xl">
                        <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground">No rides found matching your criteria.</p>
                      </div>
                    ) : (
                      searchRides.map((ride, i) => (
                        <RideCard 
                          key={ride._id}
                          id={ride._id}
                          origin={ride.origin}
                          destination={ride.destination}
                          departureAt={ride.departureAt}
                          arrivalAt={ride.arrivalAt}
                          seatsAvailable={ride.seatsAvailable}
                          pricePerSeat={ride.pricePerSeat}
                          driver={typeof ride.driverId === "object" ? ride.driverId : null}
                          index={i}
                        />
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
            )}

            {/* MY RIDES — drivers only */}
            <TabsContent value="rides" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Rides you're driving</p>
                <Link to="/publish">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
                    <Car className="h-4 w-4 mr-1" />{t("dashboard.publish_ride")}
                  </Button>
                </Link>
              </div>
              {myRides.length === 0 && (
                <div className="text-center py-16 glass rounded-2xl">
                  <Car className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t("dashboard.no_rides_desc")}</p>
                  <Link to="/publish" className="mt-4 inline-block">
                    <Button size="sm" variant="outline">{t("dashboard.publish_ride")}</Button>
                  </Link>
                </div>
              )}
              {myRides.map(ride => (
                <div key={ride._id} className="glass rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <MapPin className="h-4 w-4 text-primary" />{ride.origin}
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />{ride.destination}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(ride.departureAt), "EEE d MMM, h:mm a")}</span>
                        <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{ride.pricePerSeat}/seat</span>
                        <span>{ride.seatsAvailable}/{ride.seatsTotal} seats left</span>
                      </div>
                    </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ride.status === "active" ? "default" : "secondary"} className={ride.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}>
                      {ride.status}
                    </Badge>
                    {ride.status === "active" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openSeatMap(ride)}>
                          <Users className="h-4 w-4 mr-1" />Seat Map
                        </Button>
                        <Button size="sm" variant="default" onClick={() => confirmRide(ride._id)} className="bg-green-600 hover:bg-green-700">
                          <Check className="h-4 w-4 mr-1" />Confirm Complete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => cancelRide(ride._id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  </div>
                  {/* Location tracking for active rides */}
                  {ride.status === "active" && (
                    <div className="pt-3 border-t border-border/30">
                      <LocationTracker
                        rideId={ride._id}
                        isTracking={ride.isTrackingLocation || false}
                        onTrackingChange={(isTracking) => {
                          // Update ride in local state to reflect tracking status
                          setMyRides(prevRides => 
                            prevRides.map(r => 
                              r._id === ride._id 
                                ? { ...r, isTrackingLocation: isTracking } 
                                : r
                            )
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            {/* PASSENGERS — driver view of who booked their rides */}
            {isDriver && (
              <TabsContent value="passengers" className="space-y-4">
                <p className="text-sm text-muted-foreground">Passengers who booked your rides</p>
                {driverBookings.length === 0 && (
                  <div className="text-center py-16 glass rounded-2xl">
                    <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">No passengers yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Passengers will appear here once someone books your ride.</p>
                  </div>
                )}
                {driverBookings.map(booking => {
                  const passenger = booking.passengerId;
                  const ride = typeof booking.rideId === "object" ? booking.rideId : null;
                  const passengerInitials = passenger?.fullName
                    ? passenger.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                    : "?";
                  return (
                    <div key={booking._id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/40">
                          <AvatarImage src={(passenger as any)?.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                            {passengerInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{passenger?.fullName ?? "Unknown"}</p>
                          {(passenger as any)?.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />{(passenger as any).phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        {ride && (
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <MapPin className="h-3.5 w-3.5 text-primary" />{ride.origin}
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />{ride.destination}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {ride && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />{format(new Date(ride.departureAt), "EEE d MMM, h:mm a")}
                            </span>
                          )}
                          <span>{booking.seats} seat{booking.seats > 1 ? "s" : ""}</span>
                          {ride && (
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />{ride.pricePerSeat * booking.seats} total
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={booking.status === "confirmed" ? "default" : "secondary"}
                        className={booking.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  );
                })}
              </TabsContent>
            )}

            {/* MY BOOKINGS */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Rides you've booked as passenger</p>
                <Link to="/search">
                  <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                    <Search className="h-4 w-4" />{t("search.button")}
                  </Button>
                </Link>
              </div>
              {myBookings.length === 0 && (
                <div className="text-center py-16 glass rounded-2xl">
                  <Ticket className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No bookings yet.</p>
                  <Link to="/search" className="mt-4 inline-block">
                    <Button size="sm" variant="outline">{t("search.button")}</Button>
                  </Link>
                </div>
              )}
              {myBookings.map(booking => {
                const ride = typeof booking.rideId === "object" ? booking.rideId : null;
                const driver = ride && typeof ride.driverId === "object" ? ride.driverId : null;
                return (
                  <div key={booking._id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      {ride && (
                        <div className="flex items-center gap-2 font-semibold">
                          <MapPin className="h-4 w-4 text-primary" />{ride.origin}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />{ride.destination}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
                        {ride && (
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(ride.departureAt), "EEE d MMM, h:mm a")}</span>
                        )}
                        <span>{booking.seats} seat{booking.seats > 1 ? "s" : ""} booked</span>
                        {driver?.fullName && <span>Driver: {driver.fullName}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={booking.status === "confirmed" ? "default" : "secondary"} className={booking.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}>
                        {booking.status}
                      </Badge>
                      {booking.status === "confirmed" && (
                        <Button size="sm" variant="ghost" onClick={() => cancelBooking(booking._id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* PROFILE */}
            <TabsContent value="profile">
              <div className="glass rounded-2xl p-6 space-y-5 max-w-md">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Edit profile</h2>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    isDriver
                      ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground border border-border/40"
                  }`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isDriver ? "Driver account" : "Passenger account"}
                  </span>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone number</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" type="tel" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="opacity-60" />
                </div>
                <Button onClick={saveProfile} disabled={saving} className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                {isDriver && (
                  <Link to="/driver-setup">
                    <Button variant="outline" className="w-full flex items-center gap-2 mt-1">
                      <ExternalLink className="h-4 w-4" />Update driver &amp; bank details
                    </Button>
                  </Link>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Seat Map Dialog */}
      <Dialog open={selectedRideForSeatMap !== null} onOpenChange={closeSeatMap}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seat Map - {selectedRideForSeatMap?.origin} to {selectedRideForSeatMap?.destination}</DialogTitle>
          </DialogHeader>
          {loadingSeats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedRideForSeatMap ? (
            <DriverSeatMap
              rideId={selectedRideForSeatMap._id}
              seats={seatsForMap}
              vehicleType={selectedRideForSeatMap.vehicleType || 'sedan'}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
