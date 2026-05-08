import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Car,
  IndianRupee,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { ApiRide, ApiUser } from "@/lib/api";

export const Route = createFileRoute("/rides/$rideId")({
  head: () => ({
    meta: [
      { title: "Ride details — RideWave" },
    ],
  }),
  component: RideDetailPage,
});

type RideWithDriver = ApiRide & {
  driverId: ApiUser | null;
};

function RideDetailPage() {
  const { rideId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [ride, setRide] = useState<RideWithDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState("1");
  const [booking, setBooking] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  useEffect(() => {
    fetchRide();
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
    setBooking(true);
    const seatsNum = Number(seats);
    try {
      await api.post("/api/bookings", { rideId: ride._id, seats: seatsNum });
      toast.success(`${seatsNum} seat${seatsNum > 1 ? "s" : ""} booked! Have a great journey.`);
      setAlreadyBooked(true);
      fetchRide();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
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
            <h2 className="text-2xl font-bold mb-2">Ride not found</h2>
            <p className="text-muted-foreground mb-6">This ride may have been removed or cancelled.</p>
            <Link to="/search"><Button variant="outline">Browse rides</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const driver = typeof ride.driverId === "object" ? ride.driverId : null;
  const departure = new Date(ride.departureAt);
  const driverInitials = driver?.fullName
    ? driver.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const isDriver = user?._id === (typeof ride.driverId === "object" ? ride.driverId?._id : ride.driverId);
  const canBook = !isDriver && !alreadyBooked && ride.seatsAvailable > 0 && ride.status === "active";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <Link to="/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to search
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
          {/* Route card */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant={ride.status === "active" ? "default" : "secondary"} className={ride.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}>
                {ride.status}
              </Badge>
              <div className="flex items-center gap-1 text-2xl font-bold text-gradient">
                <IndianRupee className="h-5 w-5" />{Number(ride.pricePerSeat).toLocaleString("en-IN")}
                <span className="text-sm font-normal text-muted-foreground">/seat</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xl font-bold mb-6">
              <div className="flex items-center gap-1.5"><MapPin className="h-5 w-5 text-primary" />{ride.origin}</div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-1.5"><MapPin className="h-5 w-5 text-accent" />{ride.destination}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-background/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Date</p>
                <p className="font-semibold text-sm">{format(departure, "EEE, d MMMM yyyy")}</p>
              </div>
              <div className="bg-background/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Time</p>
                <p className="font-semibold text-sm">{format(departure, "h:mm a")}</p>
              </div>
              <div className="bg-background/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="h-3 w-3" />Seats left</p>
                <p className="font-semibold text-sm">{ride.seatsAvailable} / {ride.seatsTotal}</p>
              </div>
            </div>

            {ride.description && (
              <div className="mt-4 bg-background/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" />Driver notes</p>
                <p className="text-sm">{ride.description}</p>
              </div>
            )}
          </div>

          {/* Driver card */}
          <div className="glass rounded-2xl p-5 flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/30">
              <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                {driverInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Your driver</p>
              <p className="font-semibold text-lg">{driver?.fullName ?? "Driver"}</p>
              {isDriver && driver?.phone && (
                <p className="text-sm text-muted-foreground">{driver.phone}</p>
              )}
            </div>
          </div>

          {/* Booking panel */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-lg mb-4">Book your seat</h3>
            <Separator className="mb-4" />

            {!user && (
              <div className="text-center py-4">
                <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground mb-4">Sign in to book this ride.</p>
                <Link to="/auth"><Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">Sign in</Button></Link>
              </div>
            )}

            {isDriver && (
              <p className="text-muted-foreground text-center py-4">This is your ride. Passengers will be able to book it.</p>
            )}

            {alreadyBooked && !isDriver && (
              <div className="text-center py-4">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm px-4 py-2">✓ You've booked this ride</Badge>
                <p className="text-muted-foreground text-sm mt-3">Check your dashboard for details.</p>
                <Link to="/dashboard" className="inline-block mt-3"><Button variant="outline" size="sm">Go to dashboard</Button></Link>
              </div>
            )}

            {canBook && (
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <p className="text-sm text-muted-foreground">Number of seats</p>
                    <Select value={seats} onValueChange={setSeats}>
                      <SelectTrigger className="bg-background/60 border-border/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: Math.min(ride.seatsAvailable, 5) }, (_, i) => i + 1).map(n => (
                          <SelectItem key={n} value={String(n)}>{n} seat{n > 1 ? "s" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-gradient flex items-center gap-0.5">
                      <IndianRupee className="h-4 w-4" />
                      {(Number(ride.pricePerSeat) * Number(seats)).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <Button onClick={bookRide} disabled={booking} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold h-12 text-base">
                  {booking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm booking"}
                </Button>
              </div>
            )}

            {!canBook && ride.seatsAvailable === 0 && !isDriver && !alreadyBooked && (
              <p className="text-center text-muted-foreground py-4">This ride is fully booked.</p>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
