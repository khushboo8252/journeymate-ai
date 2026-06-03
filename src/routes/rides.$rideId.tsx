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
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { ApiRide, ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SeatPicker, type Seat } from "@/components/seat-picker/SeatPicker";

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
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);
  const [lockingSeats, setLockingSeats] = useState(false);

  const toggleSeat = (seatNumber: string) => {
    setSelectedSeats(prev =>
      prev.includes(seatNumber) ? prev.filter(s => s !== seatNumber) : [...prev, seatNumber]
    );
  };

  useEffect(() => {
    fetchRide();
    fetchSeats();
  }, [rideId]);

  useEffect(() => {
    if (user && ride) checkExistingBooking();
  }, [user, ride]);

  const fetchRide = async () => {
    try {
      const data = await api.get<RideWithDriver>(`/api/rides/${rideId}`);
      setRide(data);
    } catch {
      setRide(null);
    }
    setLoading(false);
  };

  const fetchSeats = async () => {
    try {
      const data = await api.get<Seat[]>(`/api/rides/${rideId}/seats`);
      setSeats(data);
    } catch (error) {
      console.error("Failed to fetch seats:", error);
    }
  };

  const lockSeats = async (seatNumbers: string[]) => {
    if (!user) return;
    try {
      setLockingSeats(true);
      await api.post(`/api/rides/${rideId}/seats/lock`, { seatNumbers });
      // Refresh seats to get updated status
      await fetchSeats();
    } catch (error) {
      console.error("Failed to lock seats:", error);
      toast.error(error instanceof Error ? error.message : "Failed to lock seats");
      setSelectedSeats([]);
    } finally {
      setLockingSeats(false);
    }
  };

  const releaseAllLockedSeats = async () => {
    if (!user) return;
    try {
      await api.post(`/api/rides/${rideId}/seats/release`, { seatNumbers: selectedSeats });
      await fetchSeats();
    } catch (error) {
      console.error("Failed to release seats:", error);
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

  const bookRide = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!ride) return;
    if (selectedSeats.length === 0) { toast.error(t("ride_details.select_seat_error")); return; }
    setBooking(true);
    try {
      // First lock the seats (IRCTC style - lock only on book button click)
      await api.post(`/api/rides/${rideId}/seats/lock`, { seatNumbers: selectedSeats });
      
      // Create booking (will return payment order)
      const bookingResponse = await api.post<{
        booking: { _id: string };
        paymentOrder?: { keyId: string; amount: number; currency: string; orderId: string };
        requiresPayment: boolean;
        upfrontAmount?: number;
      }>("/api/bookings", { rideId: ride._id, seatNumbers: selectedSeats });
      
      if (bookingResponse.requiresPayment && bookingResponse.paymentOrder) {
        const paymentOrder = bookingResponse.paymentOrder;
        
        // Check if payment system is configured
        if (!paymentOrder.keyId || paymentOrder.keyId === "your_razorpay_key_id") {
          toast.error("Payment system not configured. Please contact admin.");
          // Release the locked seats
          await api.post(`/api/rides/${rideId}/seats/release`, { seatNumbers: selectedSeats });
          fetchSeats();
          setBooking(false);
          return;
        }
        
        // Load Razorpay script dynamically
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
            handler: async function (response: any) {
              try {
                // Verify payment and confirm booking
                await api.post("/api/bookings/confirm", {
                  bookingId: bookingResponse.booking._id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                });
                toast.success(`${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""} booked! Have a great journey.`);
                setAlreadyBooked(true);
                setSelectedSeats([]);
                fetchRide();
                fetchSeats();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to confirm booking");
                // Release the locked seats on error
                api.post(`/api/rides/${rideId}/seats/release`, { seatNumbers: selectedSeats }).catch(console.error);
                fetchSeats();
              }
            },
            prefill: {
              name: user.fullName,
              email: user.email,
            },
            theme: {
              color: "#6366f1",
            },
            modal: {
              ondismiss: function() {
                toast.error("Payment cancelled");
                // Release the locked seats
                api.post(`/api/rides/${rideId}/seats/release`, { seatNumbers: selectedSeats }).catch(console.error);
                fetchSeats();
              },
            },
          };
          try {
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
          } catch (error) {
            toast.error("Failed to initialize payment. Please try again.");
            // Release the locked seats
            api.post(`/api/rides/${rideId}/seats/release`, { seatNumbers: selectedSeats }).catch(console.error);
            fetchSeats();
          }
        };
        script.onerror = () => {
          toast.error("Failed to load payment gateway. Please check your internet connection.");
          // Release the locked seats
          api.post(`/api/rides/${rideId}/seats/release`, { seatNumbers: selectedSeats }).catch(console.error);
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
      // Refresh seats to show current status
      fetchSeats();
    }
    setBooking(false);
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
    return h === 0 ? `${min}min` : min === 0 ? `${h}h` : `${h}h${min}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10 max-w-5xl">
        <Link to="/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />{t("ride_details.back")}
        </Link>

        <h1 className="text-2xl font-bold mb-6">{t("ride_details.title")}</h1>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ═══ LEFT COLUMN ═══ */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* ── Seat overview card (only for passengers who can book) ── */}
              {canBook && ride.seatsTotal > 0 && (
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">{t("ride_details.select_seat")}</h3>
                    <span className="text-xs text-muted-foreground">
                      {seats.filter(s => s.status === 'available').length} of {ride.seatsTotal} {t("ride_details.available")}
                    </span>
                  </div>
                  <SeatPicker
                    rideId={rideId}
                    seats={seats}
                    selectedSeats={selectedSeats}
                    onSeatToggle={toggleSeat}
                    userId={user?._id}
                  />
                </div>
              )}

              {/* ── Route timeline card ── */}
              <div className="glass rounded-2xl p-6">
                <div className="flex gap-4">
                  {/* Timeline spine */}
                  <div className="flex flex-col items-center pt-1">
                    <div className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-background mt-0.5" />
                    <div className="flex-1 w-px bg-border my-1" />
                    <div className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-background mb-0.5" />
                  </div>

                  {/* Stops */}
                  <div className="flex-1 space-y-3">
                    {/* Departure stop */}
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-lg font-bold tabular-nums w-12 shrink-0">{format(departure, "HH:mm")}</span>
                        <span className="font-semibold text-base">{ride.origin}</span>
                      </div>
                    </div>

                    {/* Duration in between */}
                    {durationMins !== null && (
                      <div className="flex items-center gap-3 py-0.5">
                        <span className="text-xs text-muted-foreground w-12 shrink-0">{formatDur(durationMins)}</span>
                        <span className="text-xs text-muted-foreground">{t("ride_details.duration")}</span>
                      </div>
                    )}

                    {/* Arrival stop */}
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-lg font-bold tabular-nums w-12 shrink-0">
                          {arrival ? format(arrival, "HH:mm") : "—"}
                        </span>
                        <span className="font-semibold text-base">{ride.destination}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seats + status row */}
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

              {/* ── Driver card ── */}
              <div className="glass rounded-2xl overflow-hidden">
                {/* Driver header row */}
                <div className="flex items-center gap-4 p-5 hover:bg-muted/10 transition-colors cursor-default">
                  <Avatar className="h-12 w-12 border-2 border-primary/30 shrink-0">
                    <AvatarImage src={driver?.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-base bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                      {driverInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base leading-tight">{driver?.fullName ?? "Driver"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("ride_details.verified_driver")}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>

                <Separator />

                {/* Driver details list */}
                <div className="p-5 space-y-3">
                  {/* Instant booking */}
                  <div className="flex items-center gap-3 text-sm">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <span>{t("ride_details.instant_booking")}</span>
                  </div>

                  {/* Seats in vehicle */}
                  {driver?.vehicleSeats && (
                    <div className="flex items-center gap-3 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{driver.vehicleSeats}-{t("ride_details.seater")}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {ride.description && (
                    <div className="flex items-start gap-3 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{ride.description}</span>
                    </div>
                  )}

                  {/* Phone (shown only if you're the booker or driver) */}
                  {(isDriver || alreadyBooked) && driver?.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{driver.phone}</span>
                    </div>
                  )}
                </div>

                {/* Contact button */}
                {!isDriver && (
                  <div className="px-5 pb-5">
                    <Button variant="outline" className="flex items-center gap-2 rounded-full border-primary/40 text-primary hover:bg-primary/5">
                      <MessageSquare className="h-4 w-4" />{t("ride_details.contact")} {driver?.fullName?.split(" ")[0] ?? "Driver"}
                    </Button>
                  </div>
                )}
              </div>

            </div>

            {/* ═══ RIGHT COLUMN — sticky booking panel ═══ */}
            <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24">
              <div className="glass rounded-2xl overflow-hidden">

                {/* Date header */}
                <div className="px-5 pt-5 pb-3">
                  <p className="font-semibold text-base">{format(departure, "EEEE, d MMMM")}</p>
                </div>

                {/* Mini timeline */}
                <div className="px-5 pb-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <div className="h-2 w-2 rounded-full border-2 border-primary bg-background" />
                      <div className="flex-1 w-px bg-border my-1" />
                      <div className="h-2 w-2 rounded-full border-2 border-primary bg-background" />
                    </div>
                    <div className="flex-1 space-y-2 text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold tabular-nums">{format(departure, "HH:mm")}</span>
                        <span className="text-muted-foreground truncate">{ride.origin}</span>
                      </div>
                      {durationMins !== null && (
                        <span className="text-xs text-muted-foreground block -mt-1 pl-0">{formatDur(durationMins)}</span>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold tabular-nums">
                          {arrival ? format(arrival, "HH:mm") : "—"}
                        </span>
                        <span className="text-muted-foreground truncate">{ride.destination}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini driver row */}
                <div className="px-5 pb-4 flex items-center gap-2">
                  <Car className="h-5 w-5 text-muted-foreground shrink-0" />
                  <Avatar className="h-7 w-7 border border-border/40 shrink-0">
                    <AvatarImage src={driver?.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                      {driverInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{driver?.fullName?.split(" ")[0] ?? "Driver"}</span>
                </div>

                <Separator />

                {/* Booking action */}
                <div className="p-5 space-y-4">
                  {!user && (
                    <div className="text-center space-y-3">
                      <Lock className="h-7 w-7 text-muted-foreground/40 mx-auto" />
                      <p className="text-sm text-muted-foreground">{t("ride_details.sign_in_to_book")}</p>
                      <Link to="/auth">
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
                      {/* Seat count + price row */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {selectedSeats.length === 0 ? (
                            <span className="text-amber-400 text-xs">{t("ride_details.select_seats_hint")}</span>
                          ) : (
                            <span>
                              <span className="font-semibold text-foreground">{selectedSeats.length}</span>
                              {" "}{t("ride_details.passenger")}
                            </span>
                          )}
                        </div>
                        {selectedSeats.length > 0 && (
                          <div className="flex items-baseline gap-0.5 font-bold text-xl">
                            <IndianRupee className="h-4 w-4" />
                            {(Number(ride.pricePerSeat) * selectedSeats.length).toLocaleString("en-IN")}
                            <span className="text-xs font-normal text-muted-foreground">.00</span>
                          </div>
                        )}
                      </div>

                      {/* Book button */}
                      <Button
                        onClick={bookRide}
                        disabled={booking || selectedSeats.length === 0}
                        className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 font-semibold h-11 rounded-full text-base shadow-lg shadow-primary/30 disabled:opacity-40"
                      >
                        {booking
                          ? <Loader2 className="h-5 w-5 animate-spin" />
                          : selectedSeats.length === 0
                          ? t("ride_details.select_seats_to_book")
                          : <><Zap className="h-4 w-4 mr-1.5" />{t("ride_details.book")} {selectedSeats.length} {t("ride_details.seat")}</>}
                      </Button>
                    </>
                  )}

                  {!canBook && ride.seatsAvailable === 0 && !isDriver && !alreadyBooked && user && (
                    <p className="text-center text-sm text-muted-foreground py-2">{t("ride_details.fully_booked")}</p>
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
