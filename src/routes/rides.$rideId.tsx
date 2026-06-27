import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, differenceInMinutes } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Car,
  ChevronRight,
  IndianRupee,
  Loader2,
  Lock,
  MessageSquare,
  Phone,
  Users,
  Zap,
  Star,
  Shield,
  MapPin,
  Clock,
} from "lucide-react";
import { DriverLocationMap } from "@/components/maps/DriverLocationMap";
import { LocationTracker } from "@/components/driver/LocationTracker";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { ApiRide, ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { playAlertSound } from "@/lib/sounds";

export const Route = createFileRoute("/rides/$rideId")({
  head: () => ({
    meta: [
      { title: "Ride details — Ukyro" },
    ],
  }),
  component: RideDetailPage,
});

type RideWithDriver = ApiRide & {
  driverId: ApiUser | null;
};

function RideDetailPage() {
  const { t } = useTranslation();
  const { rideId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [ride, setRide] = useState<RideWithDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");

  // 🚨 [NEW FEATURE]: Pickup Point State
  const searchParams = Route.useSearch() as any;
const [pickupPoint, setPickupPoint] = useState(searchParams?.pickup || "");

  // Interactive Passenger Seat Selection States
  const [seatsList, setSeatsList] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Live location state
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);

  useEffect(() => {
    fetchRide();
    fetchPassengerSeats();
  }, [rideId]);

  useEffect(() => {
    if (user && ride) checkExistingBooking();
  }, [user, ride]);

  useEffect(() => {
    if (!ride) return;

    const socket = getSocket();

    socket.on("driver_location_updated", (data: any) => {
      if (data.rideId === ride._id && data.currentLocation) {
        setDriverLocation({
          latitude: data.currentLocation.latitude,
          longitude: data.currentLocation.longitude,
        });
        setIsTrackingLocation(true);
      }
    });

    socket.on("seat_locked", () => fetchPassengerSeats());
    socket.on("seat_released", () => fetchPassengerSeats());

    socket.on("location_tracking_started", (data: any) => {
      if (data.rideId === ride._id) {
        setIsTrackingLocation(true);
      }
    });

    socket.on("location_tracking_stopped", (data: any) => {
      if (data.rideId === ride._id) {
        setIsTrackingLocation(false);
      }
    });

    socket.on("driver_confirmed_completion", (data: any) => {
      if (data.rideId === ride._id && !isDriver) {
        playAlertSound();
        toast.success("Driver has confirmed ride completion. Please confirm to complete the ride.");
        fetchRide();
      }
    });

    socket.on("passenger_confirmed_completion", (data: any) => {
      if (data.rideId === ride._id && isDriver) {
        playAlertSound();
        toast.success("Passenger has confirmed ride completion.");
        fetchRide();
      }
    });

    socket.on("ride_completed", (data: any) => {
      if (data.rideId === ride._id) {
        playAlertSound();
        toast.success("Ride completed successfully!");
        fetchRide();
      }
    });

    socket.on("booking_transferred", (data: any) => {
      if (data.originalRideId === ride._id && !isDriver) {
        toast.success(data.message || "Your booking has been transferred to driver's next ride.");
        fetchRide();
      }
    });

    if (ride.currentLocation?.latitude && ride.currentLocation?.longitude) {
      setDriverLocation({
        latitude: ride.currentLocation.latitude,
        longitude: ride.currentLocation.longitude,
      });
      setIsTrackingLocation(ride.isTrackingLocation || false);
    }

    return () => {
      socket.off("driver_location_updated");
      socket.off("seat_locked");
      socket.off("seat_released");
      socket.off("location_tracking_started");
      socket.off("location_tracking_stopped");
      socket.off("driver_confirmed_completion");
      socket.off("passenger_confirmed_completion");
      socket.off("ride_completed");
      socket.off("booking_transferred");
    };
  }, [ride]);

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

  const fetchRide = async () => {
    try {
      const data = await api.get<RideWithDriver>(`/api/rides/${rideId}`);
      setRide(data);
    } catch {
      setRide(null);
    }
    setLoading(false);
  };

  const fetchPassengerSeats = async () => {
    try {
      setLoadingSeats(true);
      const res = await api.get<any>(`/api/rides/${rideId}/seats`);
      const rawSeats = Array.isArray(res) ? res : res.seats || [];
      setSeatsList(rawSeats.filter((s: any) => s.seatNumber !== "A1")); 
    } catch (err) {
      console.error("Failed to load seats", err);
    } finally {
      setLoadingSeats(false);
    }
  };

  const checkExistingBooking = async () => {
    if (!user || !ride) return;
    try {
      const bookings = await api.get<{ _id: string; status: string }[]>("/api/bookings/my");
      const found = bookings.some((b: { _id: string; status: string } & { rideId?: string }) =>
        (typeof b.rideId === "string" ? b.rideId : (b.rideId as unknown as ApiRide)?._id) === ride._id &&
        b.status === "confirmed"
      );
      setAlreadyBooked(found);
    } catch {
      setAlreadyBooked(false);
    }
  };

  const toggleSeatSelection = (seatNumber: string) => {
    if (seatNumber === "A1") return; 

    let updatedSeats: string[];
    if (selectedSeats.includes(seatNumber)) {
      updatedSeats = selectedSeats.filter(s => s !== seatNumber);
    } else {
      updatedSeats = [...selectedSeats, seatNumber];
    }
    setSelectedSeats(updatedSeats);
    setSeatsToBook(Math.max(1, updatedSeats.length));
  };

  const bookRide = async () => {
    if (!user) { navigate({ to: "/auth", search: { tab: "signin" } }); return; }
    if (!ride) return;
    if (selectedSeats.length === 0) { toast.error("Please select at least 1 seat"); return; }
    
    setBooking(true);
    try {
      await api.post(`/api/rides/${ride._id}/seats/lock`, { seatNumbers: selectedSeats });

      // 🚨 [UPDATE]: Added pickupPoint to the payload
      const bookingResponse = await api.post<{
        booking: { _id: string };
        paymentOrder?: { keyId: string; amount: number; currency: string; orderId: string };
        requiresPayment: boolean;
        upfrontAmount?: number;
      }>("/api/bookings", { 
        rideId: ride._id, 
        seats: selectedSeats.length, 
        seatNumbers: selectedSeats,
        pickupPoint: pickupPoint.trim() || undefined // Added pickup point here
      });

      if (bookingResponse.requiresPayment && bookingResponse.paymentOrder) {
        const paymentOrder = bookingResponse.paymentOrder;

        if (!paymentOrder.keyId || paymentOrder.keyId === "your_razorpay_key_id") {
          toast.error("Payment system not configured. Please contact admin.");
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
            description: `Booking for seats: ${selectedSeats.join(", ")}`,
            order_id: paymentOrder.orderId,
            handler: async function (response: any) {
              try {
                await api.post("/api/bookings/confirm", {
                  bookingId: bookingResponse.booking._id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                });
                toast.success(`Seats ${selectedSeats.join(", ")} booked successfully!`);
                setAlreadyBooked(true);
                setSelectedSeats([]);
                setPickupPoint(""); // Reset input
                fetchRide();
                fetchPassengerSeats();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to confirm booking");
              }
              setBooking(false);
            },
            prefill: {
              name: user.fullName,
              email: user.email,
            },
            theme: {
              color: "#6366f1",
            },
            modal: {
              ondismiss: async function() {
                await api.post(`/api/rides/${ride._id}/seats/release`, { seatNumbers: selectedSeats });
                toast.error("Payment cancelled. Seats released.");
                setBooking(false);
              },
            },
          };
          try {
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
          } catch (error) {
            toast.error("Failed to initialize payment. Please try again.");
            setBooking(false);
          }
        };
        script.onerror = () => {
          toast.error("Failed to load payment gateway.");
          setBooking(false);
        };
        document.body.appendChild(script);
      } else {
        toast.success(`Seats ${selectedSeats.join(", ")} booked! Have a great journey.`);
        setAlreadyBooked(true);
        setSelectedSeats([]);
        setPickupPoint(""); // Reset input
        fetchRide();
        fetchPassengerSeats();
        setBooking(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("ride_details.booking_failed"));
      setBooking(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24 text-center">
          <div>
            <Car className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("ride_details.not_found")}</h2>
            <p className="text-muted-foreground mb-6">{t("ride_details.not_found_desc")}</p>
            <Link to="/search"><Button variant="outline">{t("ride_details.browse")}</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const driver = typeof ride.driverId === "object" ? ride.driverId : null;
  const departure = new Date(ride.departureAt);
  const arrival = ride.arrivalAt ? new Date(ride.arrivalAt) : null;
  const durationMins = arrival ? differenceInMinutes(arrival, departure) : null;
  const driverInitials = driver?.fullName
    ? driver.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const isDriver = user?._id === (typeof ride.driverId === "object" ? ride.driverId?._id : ride.driverId);
  const canBook = !isDriver && ride.seatsAvailable > 0 && ride.status === "active";

  const formatDur = (m: number) => {
    const h = Math.floor(m / 60), min = m % 60;
    return h === 0 ? `${min}min` : min === 0 ? `${h}hr` : `${h}hr ${min}min`;
  };

  const seatRows = seatsList.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    if (!acc[seat.row].some((s: any) => s.seatNumber === seat.seatNumber)) acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, any[]>);

  if (!seatRows["A"]) seatRows["A"] = [];
  
  const sortedRowKeys = Object.keys(seatRows).sort();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-6 max-w-5xl">
        <Link to="/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />{t("ride_details.back")}
        </Link>

        {/* Ride Summary Banner */}
        <div className="glass rounded-2xl p-4 sm:p-6 mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                {ride.origin} → {ride.destination}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(departure, "d MMMM • HH:mm")}
                </span>
                <span className="flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  {ride.vehicleType || "Sedan"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {ride.seatsAvailable} seats left
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                <IndianRupee className="h-5 w-5 inline" />
                {Math.round(ride.pricePerSeat * 1.05)}
              </div>
              <div className="text-xs text-muted-foreground">per seat</div>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ═══ LEFT COLUMN ═══ */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Route timeline card */}
              <div className="glass rounded-2xl p-4 sm:p-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
                    <div className="flex-1 w-0.5 bg-gradient-to-b from-primary to-primary/30 my-2" />
                    <div className="h-3 w-3 rounded-full bg-primary/50 border-2 border-primary" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-lg sm:text-xl font-bold tabular-nums w-16 shrink-0">{format(departure, "HH:mm")}</span>
                        <div>
                          <span className="font-semibold text-base sm:text-lg">{ride.origin}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            Origin City
                          </div>
                        </div>
                      </div>
                    </div>

                    {durationMins !== null && (
                      <div className="flex items-center gap-3 py-1">
                        <span className="text-sm font-medium text-primary w-16 shrink-0">{formatDur(durationMins)}</span>
                        <div className="flex-1 h-px bg-border/50" />
                        <span className="text-xs text-muted-foreground">Estimated travel time</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-lg sm:text-xl font-bold tabular-nums w-16 shrink-0">
                          {arrival ? format(arrival, "HH:mm") : "—"}
                        </span>
                        <div>
                          <span className="font-semibold text-base sm:text-lg">{ride.destination}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            Drop-off City
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/30">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />{ride.seatsAvailable} {t("ride_details.seats_available")}
                  </span>
                  <Badge
                    variant={ride.status === "active" ? "default" : "secondary"}
                    className={ride.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                  >
                    {ride.status}
                  </Badge>
                </div>
              </div>

              {/* Driver card */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/30">
                        <AvatarImage src={driver?.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                          {driverInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-base">{driver?.fullName ?? "Driver"}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {driver?.rating ? driver.rating.toFixed(1) : "New"}
                          </span>
                          <span className="text-muted-foreground">• {driver?.totalRides || 0} trips</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Car className="h-4 w-4" />
                    <span>{ride.vehicleType || "Sedan"} • {ride.seatsAvailable} seat{ride.seatsAvailable !== 1 ? 's' : ''} available</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Zap className="h-4 w-4" />
                    <span>Instant confirmation</span>
                  </div>
                </div>

                <Separator />

                <div className="p-4 sm:p-5 space-y-3">
                  {isDriver && ride.status === "active" && (
                    <div className="pt-3 border-t border-border/30">
                      <LocationTracker rideId={ride._id} />
                    </div>
                  )}

                  {ride.description && (
                    <div className="flex items-start gap-3 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{ride.description}</span>
                    </div>
                  )}

                  {(isDriver || alreadyBooked) && driver?.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{driver.phone}</span>
                    </div>
                  )}
                </div>

                {!isDriver && (
                  <div className="px-5 pb-5">
                    <div className="flex gap-2">
                      {driver?.phone && (
                        <div className="relative group">
                          <Button
                            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 h-10 px-5 font-medium shadow-lg shadow-green-500/30"
                            onClick={() => window.location.href = `tel:${driver.phone}`}
                          >
                            <Phone className="h-4 w-4" /> Contact {driver.fullName?.split(" ")[0] ?? "Driver"}
                          </Button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {driver.phone}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Trust Section */}
              <div className="glass rounded-2xl p-4 sm:p-5">
                <h3 className="font-semibold text-base mb-4">Trust & Reviews</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Star className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{driver?.rating ? driver.rating.toFixed(1) : "New"}</p>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{driver?.totalRides || 0}</p>
                      <p className="text-xs text-muted-foreground">Rides</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{driver?.isApproved ? "Yes" : "Pending"}</p>
                      <p className="text-xs text-muted-foreground">ID Verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{driver?.responseRate ? `${driver.responseRate}%` : "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Response</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Location Map */}
              {!isDriver && driverLocation && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border/30">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Driver's Live Location
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <DriverLocationMap
                      latitude={driverLocation.latitude}
                      longitude={driverLocation.longitude}
                      isTracking={isTrackingLocation}
                    />
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Live tracking enabled</span>
                      </div>
                      {isTrackingLocation && (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ RIGHT COLUMN — STICKY BOOKING PANEL ═══ */}
            <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24">
              <div className="glass rounded-2xl overflow-hidden border-primary/20">

                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-5">
                  <div className="flex items-baseline gap-1">
                    <IndianRupee className="h-6 w-6 text-primary" />
                    <span className="text-3xl font-bold text-primary">{Math.round(ride.pricePerSeat * 1.05)}</span>
                    <span className="text-sm text-muted-foreground">/ seat</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-primary font-medium">{ride.seatsAvailable} seats available</span>
                  </div>
                </div>

                <Separator />

                <div className="p-5 space-y-4">
                  {!user && (
                    <div className="text-center space-y-3">
                      <Lock className="h-7 w-7 text-muted-foreground/40 mx-auto" />
                      <p className="text-sm text-muted-foreground">{t("ride_details.sign_in_to_book")}</p>
                      <Link to="/auth" search={{ tab: "signin" }}>
                        <Button className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 rounded-full font-semibold">
                          {t("auth.signin")}
                        </Button>
                      </Link>
                    </div>
                  )}

                  {isDriver && (
                    <p className="text-sm text-muted-foreground text-center py-2">{t("ride_details.your_ride")}</p>
                  )}

                  {canBook && (
                    <>
                      {/* DYNAMIC INTERACTIVE INDIAN SEAT PICKER GRID */}
                      <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-muted/20 p-3">
                          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-3 text-center">
                            Select Seat Layout
                          </p>
                          
                          {loadingSeats ? (
                            <div className="flex justify-center py-6">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2.5 items-center">
                              {sortedRowKeys.map((rowKey) => {
                                let seatsInRow = [...seatRows[rowKey]];
                                
                                if (rowKey === "A") {
                                  return (
                                    <div key={rowKey} className="flex items-center gap-2 justify-center w-full">
                                      {seatsInRow.find(s => s.seatNumber === "A2") ? (
                                        (() => {
                                          const seat = seatsInRow.find(s => s.seatNumber === "A2");
                                          const isBooked = seat.status === "booked";
                                          const isLocked = seat.status === "locked";
                                          const isSelected = selectedSeats.includes(seat.seatNumber);
                                          return (
                                            <button
                                              key="A2"
                                              type="button"
                                              disabled={isBooked || isLocked}
                                              onClick={() => toggleSeatSelection("A2")}
                                              className={cn(
                                                "w-11 h-12 rounded-t-lg font-bold text-xs transition-all flex flex-col items-center justify-center border relative shadow-sm",
                                                isBooked && "bg-muted text-muted-foreground/30 border-muted-foreground/5 cursor-not-allowed opacity-40",
                                                isLocked && "bg-amber-500/10 text-amber-600/50 border-amber-500/20 cursor-not-allowed",
                                                !isBooked && !isLocked && !isSelected && "bg-background border-border hover:border-primary text-foreground cursor-pointer",
                                                isSelected && "bg-primary text-primary-foreground border-primary scale-105 shadow-md shadow-primary/20"
                                              )}
                                            >
                                              <span>A2</span>
                                              <div className={cn("absolute bottom-0 h-1 w-full rounded-b-sm", isSelected ? "bg-white/20" : "bg-muted-foreground/5")} />
                                            </button>
                                          );
                                        })()
                                      ) : null}

                                      <div 
                                        key="driver-steering-box" 
                                        className="w-11 h-12 rounded-t-lg bg-primary/5 border border-dashed border-primary/30 flex flex-col items-center justify-center text-primary/60 select-none shadow-sm"
                                      >
                                        <span className="text-[8px] font-bold">A1</span>
                                        <span className="text-[7px] font-semibold tracking-tighter">Driver</span>
                                      </div>
                                    </div>
                                  );
                                }

                                seatsInRow.sort((a, b) => a.position - b.position);

                                return (
                                  <div key={rowKey} className="flex items-center gap-2 justify-center w-full">
                                    {seatsInRow.map((seat) => {
                                      const isBooked = seat.status === "booked";
                                      const isLocked = seat.status === "locked";
                                      const isSelected = selectedSeats.includes(seat.seatNumber);

                                      return (
                                        <button
                                          key={seat.seatNumber}
                                          type="button"
                                          disabled={isBooked || isLocked}
                                          onClick={() => toggleSeatSelection(seat.seatNumber)}
                                          className={cn(
                                            "w-11 h-12 rounded-t-lg font-bold text-xs transition-all flex flex-col items-center justify-center border relative shadow-sm",
                                            isBooked && "bg-muted text-muted-foreground/30 border-muted-foreground/5 cursor-not-allowed opacity-40",
                                            isLocked && "bg-amber-500/10 text-amber-600/50 border-amber-500/20 cursor-not-allowed",
                                            !isBooked && !isLocked && !isSelected && "bg-background border-border hover:border-primary text-foreground cursor-pointer",
                                            isSelected && "bg-primary text-primary-foreground border-primary scale-105 shadow-md shadow-primary/20"
                                          )}
                                        >
                                          <span>{seat.seatNumber}</span>
                                          <div className={cn(
                                            "absolute bottom-0 h-1 w-full rounded-b-sm",
                                            isSelected ? "bg-white/20" : "bg-muted-foreground/5"
                                          )} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Summary Details */}
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>Selected: <strong className="text-foreground">{selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}</strong></span>
                          <span>Count: <strong className="text-foreground">{selectedSeats.length}</strong></span>
                        </div>

                        {/* 🚨 [NEW FEATURE UI]: Optional Exact Pickup Point */}
                        <div className="space-y-1.5 py-2 border-t border-border/30">
                          <Label className="text-xs text-muted-foreground">Exact Pickup Point (Optional)</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="e.g. City Mall, Gate 2"
                              value={pickupPoint}
                              onChange={(e) => setPickupPoint(e.target.value)}
                              className="pl-9 h-10 text-sm"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={bookRide}
                          disabled={booking || selectedSeats.length === 0}
                          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-semibold h-12 rounded-full text-base shadow-lg shadow-primary/30 disabled:opacity-40"
                        >
                          {booking ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                          ) : (
                            <>Book {seatsToBook} seat{seatsToBook > 1 ? 's' : ''} at ₹{Math.round(ride.pricePerSeat * seatsToBook * 1.05 * 0.0952)}</>
                          )}
                        </Button>
                      </div>
                    </>
                  )}

                  {!canBook && ride.seatsAvailable === 0 && !isDriver && !alreadyBooked && user && (
                    <p className="text-center text-sm text-muted-foreground py-2">{t("ride_details.fully_booked")}</p>
                  )}

                  {/* Ride completion confirmation */}
                  {alreadyBooked && ride.status === "active" && (
                    <div className="space-y-3 pt-3 border-t border-border/30">
                      <div className="text-center space-y-2">
                        {ride.confirmByDriver && !ride.confirmByPassenger && (
                          <p className="text-sm text-green-600 font-medium">{t("ride_details.driver_confirmed")}</p>
                        )}
                        {!ride.confirmByDriver && ride.confirmByPassenger && (
                          <p className="text-sm text-amber-600 font-medium">{t("ride_details.waiting_driver")}</p>
                        )}
                        {ride.confirmByDriver && ride.confirmByPassenger && (
                          <p className="text-sm text-green-600 font-medium">{t("ride_details.ride_completed")}</p>
                        )}
                        {!ride.confirmByDriver && !ride.confirmByPassenger && (
                          <p className="text-sm text-muted-foreground">{t("ride_details.confirm_completion")}</p>
                        )}
                      </div>
                      {!ride.confirmByPassenger && (
                        <div className="space-y-3">
                          <div className="bg-primary/10 rounded-lg p-3 text-center">
                            <p className="text-sm text-muted-foreground">Pay to driver</p>
                            <p className="text-xl font-bold">₹{Math.round(ride.pricePerSeat * seatsToBook * 1.05 - (ride.pricePerSeat * seatsToBook * 1.05 * 0.0952))}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setPaymentMethod("online")}
                              variant={paymentMethod === "online" ? "default" : "outline"}
                              className="flex-1"
                            >
                              <IndianRupee className="h-4 w-4 mr-2" />Online
                            </Button>
                            <Button
                              onClick={() => setPaymentMethod("cash")}
                              variant={paymentMethod === "cash" ? "default" : "outline"}
                              className="flex-1"
                            >
                              Cash
                            </Button>
                          </div>
                          <Button
                            onClick={async () => {
                              try {
                                await api.patch(`/api/rides/${rideId}/confirm/passenger`);
                                if (paymentMethod === "online") {
                                  const paymentResponse = await api.post<{
                                    orderId: string;
                                    amount: number;
                                    currency: string;
                                    keyId: string;
                                  }>(`/api/rides/${rideId}/remaining-payment`, {});
                                  
                                  const options = {
                                    key: paymentResponse.keyId,
                                    amount: paymentResponse.amount,
                                    currency: paymentResponse.currency,
                                    name: "Ukyro",
                                    description: "Remaining payment for ride",
                                    order_id: paymentResponse.orderId,
                                    handler: async function (response: any) {
                                      try {
                                        await api.post(`/api/rides/${rideId}/remaining-payment/verify`, {
                                          paymentId: response.razorpay_payment_id,
                                          signature: response.razorpay_signature,
                                        });
                                        toast.success(t("ride_details.ride_completed"));
                                        fetchRide();
                                      } catch (err) {
                                        toast.error("Payment verification failed");
                                      }
                                    },
                                    modal: {
                                      ondismiss: function() {
                                        toast.error("Payment cancelled");
                                        fetchRide();
                                      },
                                    },
                                  };
                                  const rzp = new (window as any).Razorpay(options);
                                  rzp.open();
                                } else {
                                  await api.post(`/api/rides/${rideId}/remaining-payment/cash`, {});
                                  toast.success(t("ride_details.ride_completed"));
                                  fetchRide();
                                }
                              } catch (err) {
                                toast.error("Failed to confirm");
                              }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                          >
                            {t("ride_details.confirm_button")}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}