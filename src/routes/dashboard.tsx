import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowRight,
  Calendar,
  Car,
  IndianRupee,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Ticket,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { ApiRide, ApiBooking, ApiUser } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RideWave" },
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

function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const [myRides, setMyRides] = useState<ApiRide[]>([]);
  const [myBookings, setMyBookings] = useState<BookingWithRide[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? "");
    setPhone(user.phone ?? "");
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [rides, bookings] = await Promise.all([
      api.get<ApiRide[]>("/api/rides/my"),
      api.get<BookingWithRide[]>("/api/bookings/my"),
    ]);
    setMyRides(rides);
    setMyBookings(bookings);
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

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="glass rounded-2xl p-10 text-center max-w-sm w-full">
            <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your dashboard.</p>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">
                Sign in
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
              <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{fullName || "My Account"}</h1>
              <p className="text-muted-foreground text-sm">{user.email ?? ""}</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />Sign out
            </Button>
          </div>

          <Tabs defaultValue="rides">
            <TabsList className="mb-6 bg-muted/40">
              <TabsTrigger value="rides" className="flex items-center gap-1.5"><Car className="h-4 w-4" />My rides ({myRides.length})</TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-1.5"><Ticket className="h-4 w-4" />My bookings ({myBookings.length})</TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-1.5"><User className="h-4 w-4" />Profile</TabsTrigger>
            </TabsList>

            {/* MY RIDES */}
            <TabsContent value="rides" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Rides you're driving</p>
                <Link to="/publish">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
                    <Car className="h-4 w-4 mr-1" />Publish new
                  </Button>
                </Link>
              </div>
              {myRides.length === 0 && (
                <div className="text-center py-16 glass rounded-2xl">
                  <Car className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">You haven't published any rides yet.</p>
                  <Link to="/publish" className="mt-4 inline-block">
                    <Button size="sm" variant="outline">Publish a ride</Button>
                  </Link>
                </div>
              )}
              {myRides.map(ride => (
                <div key={ride._id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
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
                      <Button size="sm" variant="ghost" onClick={() => cancelRide(ride._id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* MY BOOKINGS */}
            <TabsContent value="bookings" className="space-y-4">
              <p className="text-sm text-muted-foreground">Rides you've booked as passenger</p>
              {myBookings.length === 0 && (
                <div className="text-center py-16 glass rounded-2xl">
                  <Ticket className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No bookings yet.</p>
                  <Link to="/search" className="mt-4 inline-block">
                    <Button size="sm" variant="outline">Find a ride</Button>
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
                <h2 className="text-lg font-semibold">Edit profile</h2>
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
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
