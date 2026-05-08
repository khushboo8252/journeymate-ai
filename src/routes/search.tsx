import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Calendar, Loader2, MapPin, Search, SlidersHorizontal, Users, Wind } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RideCard } from "@/components/site/RideCard";
import { api } from "@/lib/api";
import type { ApiRide } from "@/lib/api";

const searchParams = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
  seats: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchParams,
  head: () => ({
    meta: [
      { title: "Search rides — RideWave" },
      { name: "description", content: "Find shared carpool rides across India." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate({ from: "/search" });
  const params = Route.useSearch();

  const [from, setFrom] = useState(params.from ?? "");
  const [to, setTo] = useState(params.to ?? "");
  const [date, setDate] = useState(params.date ?? "");
  const [seats, setSeats] = useState(params.seats ?? "1");
  const [rides, setRides] = useState<ApiRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState("departureAt");

  const doSearch = async (f: string, t: string, d: string, s: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const qs = new URLSearchParams();
      if (f.trim()) qs.set("from", f.trim());
      if (t.trim()) qs.set("to", t.trim());
      if (d) qs.set("date", d);
      if (s) qs.set("seats", s);
      qs.set("sortBy", sortBy);
      const data = await api.get<ApiRide[]>(`/api/rides?${qs.toString()}`);
      setRides(data);
    } catch {
      setRides([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (params.from || params.to || params.date) {
      doSearch(params.from ?? "", params.to ?? "", params.date ?? "", params.seats ?? "1");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    navigate({ search: { from: from || undefined, to: to || undefined, date: date || undefined, seats: seats || undefined } });
    doSearch(from, to, date, seats);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10">
        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />From</Label>
              <Input placeholder="City or station" value={from} onChange={e => setFrom(e.target.value)} className="bg-background/60 border-border/40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />To</Label>
              <Input placeholder="Destination" value={to} onChange={e => setTo(e.target.value)} className="bg-background/60 border-border/40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-background/60 border-border/40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Seats</Label>
              <Select value={seats} onValueChange={setSeats}>
                <SelectTrigger className="bg-background/60 border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} seat{n > 1 ? "s" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} className="self-end bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold h-10">
              <Search className="h-4 w-4 mr-2" />Search
            </Button>
          </div>
        </motion.div>

        {/* Sort + results */}
        {searched && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted-foreground">
              {loading ? "Searching…" : `${rides.length} ride${rides.length !== 1 ? "s" : ""} found`}
            </p>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={v => { setSortBy(v); doSearch(from, to, date, seats); }}>
                <SelectTrigger className="h-8 text-xs bg-background/60 border-border/40 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="departure_at">Earliest first</SelectItem>
                  <SelectItem value="price_per_seat">Cheapest first</SelectItem>
                  <SelectItem value="seats_available">Most seats</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && searched && rides.length === 0 && (
          <div className="text-center py-20">
            <Wind className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No rides found</h3>
            <p className="text-muted-foreground">Try different dates or cities, or publish your own ride.</p>
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Enter your route above and hit Search to find rides.</p>
          </div>
        )}

        {!loading && rides.length > 0 && (
          <div className="space-y-4">
            {rides.map((ride, i) => (
              <RideCard
                key={ride._id}
                id={ride._id}
                origin={ride.origin}
                destination={ride.destination}
                departureAt={ride.departureAt}
                seatsAvailable={ride.seatsAvailable}
                pricePerSeat={ride.pricePerSeat}
                driver={typeof ride.driverId === "object" ? ride.driverId : null}
                index={i}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}