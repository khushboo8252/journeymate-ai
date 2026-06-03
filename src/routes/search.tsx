import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Calendar, Loader2, MapPin, Search, Wind } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RideCard } from "@/components/site/RideCard";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { ApiRide } from "@/lib/api";

const searchParams = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchParams,
  head: () => ({
    meta: [
      { title: "Search rides — Ukyro" },
      { name: "description", content: "Find shared carpool rides across India." },
    ],
  }),
  component: SearchPage,
});

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, d MMM");
}

function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: "/search" });
  const params = Route.useSearch();

  const SORT_OPTIONS = [
    { value: "departureAt",    label: t("search.sort_earliest") },
    { value: "pricePerSeat",   label: t("search.sort_price") },
    { value: "seatsAvailable", label: t("search.sort_seats") },
  ];

  const [from, setFrom] = useState(params.from ?? "");
  const [to, setTo] = useState(params.to ?? "");
  const [date, setDate] = useState(params.date ?? "");
  const [rides, setRides] = useState<ApiRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState("departureAt");

  const sortRef = useRef(sortBy);
  sortRef.current = sortBy;

  const doSearch = async (f: string, t: string, d: string, sort?: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const qs = new URLSearchParams();
      if (f.trim()) qs.set("from", f.trim());
      if (t.trim()) qs.set("to", t.trim());
      if (d) qs.set("date", d);
      qs.set("sortBy", sort ?? sortRef.current);
      const data = await api.get<ApiRide[]>(`/api/rides?${qs.toString()}`);
      setRides(Array.isArray(data) ? data : []);
    } catch {
      setRides([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (params.from || params.to || params.date) {
      doSearch(params.from ?? "", params.to ?? "", params.date ?? "");
    }

    // Connect to WebSocket for real-time ride updates
    const socket = getSocket();

    socket.on("ride_created", (newRide) => {
      // Add new ride to the list if it matches current search
      setRides(prevRides => {
        // Check if ride matches current search criteria
        const matchesSearch = 
          (!params.from || newRide.origin.toLowerCase().includes(params.from.toLowerCase())) &&
          (!params.to || newRide.destination.toLowerCase().includes(params.to.toLowerCase())) &&
          (!params.date || new Date(newRide.departureAt).toDateString() === new Date(params.date).toDateString());

        if (matchesSearch && !prevRides.find(r => r._id === newRide._id)) {
          return [...prevRides, newRide];
        }
        return prevRides;
      });
    });

    socket.on("ride_cancelled", (cancelledRide) => {
      // Remove cancelled ride from the list
      setRides(prevRides => prevRides.filter(r => r._id !== cancelledRide._id));
    });

    socket.on("ride_updated", (updatedRide) => {
      // Update ride in the list (e.g., seats available changed)
      setRides(prevRides => prevRides.map(r => r._id === updatedRide._id ? updatedRide : r));
    });

    return () => {
      socket.off("ride_created");
      socket.off("ride_cancelled");
      socket.off("ride_updated");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    navigate({ search: { from: from || undefined, to: to || undefined, date: date || undefined } });
    doSearch(from, to, date);
  };

  const handleSort = (val: string) => {
    setSortBy(val);
    doSearch(from, to, date, val);
  };

  const routeLabel = (from || to)
    ? `${from || "Any"} → ${to || "Any"}`
    : null;
  const dateLabel = date ? formatDateLabel(date) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10">

        {/* ── Search bar ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{t("search.from")}</Label>
              <Input
                placeholder={t("search.from_ph")}
                value={from}
                onChange={e => setFrom(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="bg-background/60 border-border/40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{t("search.to")}</Label>
              <Input
                placeholder={t("search.to_ph")}
                value={to}
                onChange={e => setTo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="bg-background/60 border-border/40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{t("search.date")}</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-background/60 border-border/40" />
            </div>
            <Button onClick={handleSearch} className="self-end bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold h-10">
              <Search className="h-4 w-4 mr-2" />{t("search.button")}
            </Button>
          </div>
        </motion.div>

        {/* ── Two-column layout after search ── */}
        {searched ? (
          <div className="flex gap-6 items-start">

            {/* LEFT SIDEBAR — sort */}
            <aside className="hidden lg:flex flex-col gap-2 w-52 shrink-0 glass rounded-2xl p-5 sticky top-24">
              <p className="text-sm font-semibold mb-2">{t("search.sort")}</p>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSort(opt.value)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-left transition-colors ${
                    sortBy === opt.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    sortBy === opt.value ? "border-primary" : "border-muted-foreground/40"
                  }`}>
                    {sortBy === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-primary block" />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </aside>

            {/* MAIN RESULTS */}
            <div className="flex-1 min-w-0">

              {/* Route + count header */}
              {!loading && (
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                  <div>
                    {dateLabel && <span className="text-sm text-muted-foreground mr-2">{dateLabel}</span>}
                    {routeLabel && <span className="font-semibold">{routeLabel}</span>}
                  </div>
                  <span className="text-sm text-primary font-medium">
                    {rides.length} {t("search.rides_available")}
                  </span>
                </div>
              )}

              {/* Mobile sort row */}
              <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto pb-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSort(opt.value)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      sortBy === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {loading && (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {!loading && rides.length === 0 && (
                <div className="text-center py-20 glass rounded-2xl">
                  <Wind className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t("search.no_rides")}</h3>
                  <p className="text-muted-foreground text-sm">{t("search.no_rides_desc")}</p>
                </div>
              )}

              {!loading && rides.length > 0 && (
                <div className="space-y-3">
                  {rides.map((ride, i) => (
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
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <Search className="h-14 w-14 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">{t("search.to_ph")}</p>
            <p className="text-sm">{t("search.no_rides_desc")}</p>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}