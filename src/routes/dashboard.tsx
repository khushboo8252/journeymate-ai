import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { getSocket, joinUserRoom, joinDriverRoom } from "@/lib/socket";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Car,
  Check,
  CheckCircle,
  IndianRupee,
  Lock,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Plus,
  Search,
  XCircle,
  ShieldCheck,
  Ticket,
  Trash2,
  User,
  Users,
  X,
  Banknote
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LocationAutocomplete, type LocationData } from "@/components/ui/LocationAutocomplete";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { ApiRide, ApiBooking, ApiUser } from "@/lib/api";
import { DriverSeatMap, type Seat as DriverSeat } from "@/components/driver/DriverSeatMap";
import { PickupNavigator } from "@/components/driver/PickupNavigator";

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
  pickupPoint?: string | null;
  deviationCharge?: number; 
  driverCashFare?: number;
  isPaymentConfirmedByDriver?: boolean; 
};

function DashboardPage() {
  const { t } = useTranslation();
  const { user, loading, signOut, setUser } = useAuth();
  const router = useRouter();
  const [myRides, setMyRides] = useState<ApiRide[]>([]);
  const [myBookings, setMyBookings] = useState<BookingWithRide[]>([]);
  const [driverBookings, setDriverBookings] = useState<DriverBooking[]>([]);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [selectedRideForSeatMap, setSelectedRideForSeatMap] = useState<ApiRide | null>(null);
  const [seatsForMap, setSeatsForMap] = useState<DriverSeat[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const isDriver = user?.role === "driver";

  const [searchFrom, setSearchFrom] = useState<LocationData | null>(null);
  const [searchTo, setSearchTo] = useState<LocationData | null>(null);
  const [searchPickup, setSearchPickup] = useState<LocationData | null>(null);
  
  const [searchDate, setSearchDate] = useState("");
  const [searchRides, setSearchRides] = useState<ApiRide[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();

    const socket = getSocket();
    if (isDriver) {
      joinDriverRoom(user._id);
    } else {
      joinUserRoom(user._id);
    }

    // 🚨 [FIXED]: Memory Leak Timer Fix
    let approvalTimer: NodeJS.Timeout;

    const checkApprovalStatus = async () => {
      try {
        const userData = await api.get<{ user: ApiUser }>("/api/profile");
        const updatedUser = userData.user;
        
        if (isDriver && updatedUser.isApproved && !updatedUser.hasSeenApprovalNotification) {
          setShowApprovalPopup(true);

          approvalTimer = setTimeout(() => {
            setShowApprovalPopup(false);
            api.post("/api/profile/notification-seen", {}).catch(console.error);
          }, 10000);
        }
      } catch (err) {
        console.error("Failed to check approval status:", err);
      }
    };

    if (isDriver) {
      checkApprovalStatus();
    }

    // Listen for real-time events
    socket.on("driver_approved", async (driver) => {
      if (driver._id === user._id) {
        setShowApprovalPopup(true);
        toast.success(t("dashboard.approval_popup"));
        try {
          const userData = await api.get<{ user: ApiUser }>("/api/profile");
          setUser(userData.user); 
        } catch (err) {
          console.error("Failed to refresh user data:", err);
        }
      }
    });

    socket.on("driver_rejected", async (data) => {
      if (data.driver._id === user._id) {
        toast.error(`Your driver profile has been rejected. ${data.rejectionReason || "Please update your documents."}`);
        try {
          const userData = await api.get<{ user: ApiUser }>("/api/profile");
          setUser(userData.user); 
        } catch (err) {
          console.error("Failed to refresh user data:", err);
        }
      }
    });

    socket.on("booking_created", (booking) => {
      if (isDriver) {
        toast.success(`New booking received! ${booking.passengerId?.fullName} booked ${booking.seats} seat(s)`);
        fetchData();
      }
    });

    socket.on("passenger_paid_driver", (data: any) => {
      if (isDriver) {
        toast.success(`💰 Payment Alert: ${data.passengerName} has paid you ₹${data.amount}. Please confirm in passenger details!`, {
          duration: 10000,
        });
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

    socket.on("ride_created", (ride) => {
      if (!isDriver) {
        toast.success("New ride available matching your search!");
        if (searchFrom || searchTo || searchDate) {
          handleSearch();
        }
      }
    });

    return () => {
      if (approvalTimer) clearTimeout(approvalTimer); // 🚨 [FIXED]: Secure Timer Cleanup
      socket.off("driver_approved");
      socket.off("driver_rejected");
      socket.off("booking_created");
      socket.off("passenger_paid_driver");
      socket.off("booking_cancelled");
      socket.off("ride_cancelled");
      socket.off("driver_confirmed_completion");
      socket.off("passenger_confirmed_completion");
      socket.off("ride_completed");
      socket.off("booking_transferred");
      socket.off("passengers_transferred");
      socket.off("cancellation_count_updated");
      socket.off("driver_blocked");
      socket.off("ride_created");
    };
  }, [user]);

  useEffect(() => {
    const initAudio = () => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

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
      setSeatsForMap(Array.isArray(response) ? response : response.seats || []);
    } catch (err) {
      console.error("Failed to fetch seats:", err);
      toast.error("Failed to load seat map");
      setSeatsForMap([]); 
    } finally {
      setLoadingSeats(false);
    }
  };

  const openSeatMap = (ride: ApiRide) => {
    setSeatsForMap([]); 
    setSelectedRideForSeatMap(ride);
    fetchSeatsForRide(ride._id);
  };

  const closeSeatMap = () => {
    setSelectedRideForSeatMap(null);
    setSeatsForMap([]);
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
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?\n\n⚠️ Warning: Your booking amount will NOT be refunded upon cancellation."
    );
    
    if (!confirmed) return;
    
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

  const confirmPassengerPayment = async (bookingId: string, passengerName: string) => {
    try {
      // 🚨 [FIXED]: Frontend emit removed for security. Backend API handles it now.
      await api.patch(`/api/bookings/${bookingId}/confirm-payment`);
      toast.success(`Payment confirmed for ${passengerName}`);
      fetchData(); 
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm payment");
    }
  };

  const handlePopupClick = async () => {
    await api.post("/api/profile/notification-seen", {});
    setShowApprovalPopup(false);
    router.navigate({ to: "/publish" });
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
      if (searchFrom?.display_name) qs.set("from", searchFrom.display_name.trim());
      if (searchTo?.display_name) qs.set("to", searchTo.display_name.trim());
      
      if (searchDate && searchDate.trim()) {
        qs.set("date", searchDate);
      }
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
            <Link to="/auth" search={{ tab: "signin" }}>
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          
          <div className="glass rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-5">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage src={(user as any).avatarUrl || undefined} alt={user.fullName || "User"} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                {user.fullName ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-bold">{user.fullName || "My Account"}</h1>
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
              {isDriver && (user as any).isProfileComplete && (user as any).isApproved && (
                <Link to="/publish">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-semibold">
                    <Car className="h-4 w-4 mr-1.5" />Publish Ride
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />{t("logout")}
              </Button>
            </div>
          </div>

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

          {isDriver && (user as any).rideCancellationCount > 0 && !(user as any).isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 mb-6 border border-amber-500/30 bg-amber-500/10"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700">
                    {t("dashboard.cancellation_warning", { 
                      count: (user as any).rideCancellationCount,
                      remaining: 3 - (user as any).rideCancellationCount
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {isDriver && (user as any).isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 mb-6 border border-red-500/30 bg-red-500/10"
            >
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700">
                    {t("dashboard.blocked_warning")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <Tabs defaultValue={isDriver ? "rides" : "search"}>
            <TabsList className="mb-6 bg-muted/40 flex-wrap h-auto gap-1 w-full sm:w-auto">
              {isDriver && (
                <Link to="/publish">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-semibold">
                    <Plus className="h-4 w-4 mr-1.5" />Publish Ride
                  </Button>
                </Link>
              )}
              {!isDriver && (
                <TabsTrigger value="search" className="flex items-center gap-1.5 text-sm sm:text-base"><Search className="h-4 w-4" />{t("nav.search")}</TabsTrigger>
              )}
              {isDriver && (
                <TabsTrigger value="rides" className="flex items-center gap-1.5 text-sm sm:text-base"><Car className="h-4 w-4" />{t("dashboard.my_rides")} ({myRides.length})</TabsTrigger>
              )}
              {isDriver && (
                <TabsTrigger value="passengers" className="flex items-center gap-1.5 text-sm sm:text-base"><Users className="h-4 w-4" />{t("dashboard.passengers")} ({driverBookings.filter(b => b.status === "confirmed").length})</TabsTrigger>
              )}
              <TabsTrigger value="bookings" className="flex items-center gap-1.5 text-sm sm:text-base"><Ticket className="h-4 w-4" />{t("dashboard.my_bookings")} ({myBookings.length})</TabsTrigger>
            </TabsList>

            {/* SEARCH RIDES */}
            {!isDriver && (
              <TabsContent value="search" className="space-y-4">
                <div className="glass rounded-2xl p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                        <MapPin className="h-3 w-3" />
                        {t("search.from")}
                      </label>
                      <LocationAutocomplete 
                        value={searchFrom?.display_name || ""} 
                        onLocationSelect={(loc) => setSearchFrom(loc)} 
                        placeholder={t("search.from_ph")} 
                        className="w-full" 
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                        <MapPin className="h-3 w-3" />
                        {t("search.to")}
                      </label>
                      <LocationAutocomplete 
                        value={searchTo?.display_name || ""} 
                        onLocationSelect={(loc) => setSearchTo(loc)} 
                        placeholder={t("search.to_ph")} 
                        className="w-full" 
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                        <MapPin className="h-3 w-3" />
                        Pickup Point
                      </label>
                      <LocationAutocomplete 
                        value={searchPickup?.display_name || ""} 
                        onLocationSelect={(loc) => setSearchPickup(loc)} 
                        placeholder="Enter exact pickup location" 
                        className="w-full" 
                      />
                    </div>
                    <div className="relative rounded-xl bg-background/60 border border-border/40 px-4 py-2 sm:col-span-2 lg:col-span-1">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {t("search.date")}
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={searchDate}
                          onChange={e => setSearchDate(e.target.value)}
                          className="border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0 flex-1"
                          autoComplete="off"
                        />
                        {searchDate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1 hover:bg-transparent"
                            onClick={() => setSearchDate("")}
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSearch} disabled={searchLoading} className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/40 font-semibold h-10 sm:h-11">
                    {searchLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    {t("nav.search")}
                  </Button>
                </div>

                {searched && (
                  <div className="space-y-4">
                    {searchLoading ? (
                      <div className="text-center py-16 glass rounded-2xl">
                        <Loader2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3 animate-spin" />
                        <p className="text-muted-foreground">Loading rides...</p>
                      </div>
                    ) : searchRides.length === 0 ? (
                      <div className="text-center py-16 glass rounded-2xl">
                        <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground">{t("search.no_rides")}</p>
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
                          pickupPoint={searchPickup?.display_name || ""}
                          driver={typeof ride.driverId === "object" ? ride.driverId : null}
                          index={i}
                        />
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
            )}

            {/* MY RIDES */}
            <TabsContent value="rides" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <p className="text-sm text-muted-foreground">{t("dashboard.my_rides")}</p>
              </div>
              {myRides.length === 0 && (
                <div className="text-center py-12 sm:py-16 glass rounded-2xl">
                  <Car className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t("dashboard.no_rides_desc")}</p>
                </div>
              )}
              {myRides.map(ride => (
                <div key={ride._id} className="glass rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                        <MapPin className="h-4 w-4 text-primary" />{ride.origin}
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />{ride.destination}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(ride.departureAt), "EEE d MMM, h:mm a")}</span>
                        <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{ride.pricePerSeat}/{t("ride_details.seat")}</span>
                        <span>{ride.seatsAvailable}/{ride.seatsTotal} {t("ride_details.seats_available")}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={ride.status === "active" ? "default" : "secondary"} className={ride.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}>
                        {ride.status}
                      </Badge>
                      {ride.status === "active" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openSeatMap(ride)} className="text-xs sm:text-sm">
                            <Users className="h-4 w-4 mr-1" />{t("dashboard.seat_map")}
                          </Button>
                          <Button size="sm" variant="default" onClick={() => confirmRide(ride._id)} className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                            <Check className="h-4 w-4 mr-1" />{t("dashboard.confirm_complete")}
                          </Button>
                          {(() => {
                            const now = new Date();
                            const departureTime = new Date(ride.departureAt);
                            const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                            const canCancel = hoursUntilDeparture >= 1;
                            return (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelRide(ride._id)}
                                disabled={!canCancel}
                                className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${!canCancel ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={!canCancel ? "Ride can only be cancelled at least 1 hour before departure" : ""}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                  {ride.status === "active" && (
                    <div className="pt-3 border-t border-border/30">
                      <LocationTracker rideId={ride._id} />
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            {/* 🚨 PASSENGERS SECTION WITH INTERACTIVE CLICK DIALOG 🚨 */}
            {isDriver && (
              <TabsContent value="passengers" className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("dashboard.passengers")}</p>
                {driverBookings.length === 0 && (
                  <div className="text-center py-12 sm:py-16 glass rounded-2xl">
                    <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">{t("dashboard.no_rides")}</p>
                  </div>
                )}
                {driverBookings.map(booking => {
                  const passenger = booking.passengerId;
                  const ride = typeof booking.rideId === "object" ? booking.rideId : null;

                  const totalFare = Math.round((ride?.pricePerSeat || 0) * booking.seats * 1.05);
                  const advancePaid = Math.round(totalFare * 0.0952);
                  const baseCashToCollect = totalFare - advancePaid;
                  const deviationCharge = booking.deviationCharge || 0; 
                  const finalCashToCollect = booking.driverCashFare || (baseCashToCollect + deviationCharge);

                  return (
                    <Dialog key={booking._id}>
                      <DialogTrigger asChild>
                        <div className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-primary/40 hover:bg-muted/10 transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border/40">
                              <AvatarImage src={(passenger as any)?.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                                {passenger?.fullName ? passenger.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{passenger?.fullName ?? "Unknown"}</p>
                              {/* Short Payment Info */}
                              <p className="text-xs text-green-600 font-bold mt-0.5">Collect: ₹{finalCashToCollect}</p>
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
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"} className={booking.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Passenger &amp; Booking Details</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center space-y-4 py-4">
                          <Avatar className="h-20 w-20 border-2 border-primary">
                            <AvatarImage src={(passenger as any)?.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-2xl bg-primary/20 text-primary font-bold">
                              {passenger?.fullName ? passenger.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-center">
                            <h3 className="font-semibold text-lg">{passenger?.fullName ?? "Passenger"}</h3>
                            <p className="text-xs text-muted-foreground">{passenger?.email ?? ""}</p>
                          </div>

                          <div className="w-full space-y-2.5 bg-muted/40 p-3 rounded-xl border text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Route:</span>
                              <span className="font-medium text-right">{ride?.origin} → {ride?.destination}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Seats Booked:</span>
                              <span className="font-semibold text-primary">{booking.seats} Seat{booking.seats > 1 ? 's' : ''} ({booking.seatNumbers?.join(", ") || "—"})</span>
                            </div>
                            
                            <div className="flex flex-col gap-1 pt-1 border-t border-border/40">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-primary" /> Exact Pickup Point:
                              </span>
                              <p className={
                                `text-xs font-medium p-2 rounded-lg mt-0.5 ${
                                  booking.pickupPoint 
                                    ? "bg-primary/10 text-primary border border-primary/20" 
                                    : "bg-muted text-muted-foreground/60 italic"
                                }`
                              }>
                                {booking.pickupPoint || "No specific pickup point provided by passenger."}
                              </p>
                            </div>
                          </div>

                          {/* 🚨 PAYMENT BREAKDOWN BOX 🚨 */}
                          <div className="w-full bg-primary/5 rounded-xl border border-primary/20 p-4 mt-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Banknote className="h-3 w-3" /> Payment to Collect
                            </p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Seat Fare (Remaining)</span>
                                <span className="font-medium">₹{baseCashToCollect}</span>
                              </div>
                              {deviationCharge > 0 && (
                                <div className="flex justify-between text-orange-600">
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> Extra Pickup Charge</span>
                                  <span className="font-medium">+₹{deviationCharge}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-2 border-t border-primary/10 mt-2">
                                <span className="font-bold text-foreground">Total Cash/UPI</span>
                                <span className="font-bold text-2xl text-green-600">₹{finalCashToCollect}</span>
                              </div>
                            </div>
                            
                            {/* 🚨 [MODIFIED]: Button logic simplified securely 🚨 */}
                            {booking.isPaymentConfirmedByDriver ? (
                              <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-600 mb-1" />
                                <span className="text-sm font-bold text-green-600">Payment Received</span>
                              </div>
                            ) : (
                              <>
                                <Button
                                  onClick={() => confirmPassengerPayment(booking._id, passenger?.fullName || "Passenger")}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold mt-4 shadow-md shadow-green-600/20"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirm Payment Received
                                </Button>
                                <p className="text-center text-[10px] text-muted-foreground mt-2">
                                   Click this once you receive the payment to mark this specific passenger's payment as received.
                                </p>
                              </>
                            )}
                          </div>

                          {/* Navigation Route Box */}
                          <PickupNavigator pickupPoint={booking.pickupPoint} rideOrigin={ride?.origin || ""} />

                          {passenger?.phone && (
                            <Button
                              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold mt-2"
                              onClick={() => window.location.href = `tel:${passenger.phone}`}
                            >
                              <Phone className="h-4 w-4 mr-2" /> Call Passenger
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </TabsContent>
            )}

            {/* MY BOOKINGS */}
            <TabsContent value="bookings" className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("dashboard.my_bookings")}</p>
              {myBookings.length === 0 && (
                <div className="text-center py-12 sm:py-16 glass rounded-2xl">
                  <Ticket className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t("dashboard.no_rides")}</p>
                </div>
              )}
              {myBookings.map(booking => {
                const ride = typeof booking.rideId === "object" ? booking.rideId : null;
                const driver = ride && typeof ride.driverId === "object" ? ride.driverId : null;
                return (
                  <div key={booking._id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      {ride && (
                        <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                          <MapPin className="h-4 w-4 text-primary" />{ride.origin}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />{ride.destination}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                        {ride && (
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(ride.departureAt), "EEE d MMM, h:mm a")}</span>
                        )}
                        <span>{booking.seats} {t("ride_details.seat")}{booking.seats > 1 ? "s" : ""} booked</span>
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