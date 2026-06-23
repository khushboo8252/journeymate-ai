import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { format, differenceInMinutes } from "date-fns";
import { IndianRupee, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RideCardProps {
  id: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt?: string | null;
  seatsAvailable: number;
  pricePerSeat: number;
  driver?: {
    fullName: string | null;
    avatarUrl?: string | null;
  } | null;
  index?: number;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Calculate final price for passengers: base + 5% platform fee (no GST)
function calculateFinalPrice(basePrice: number): number {
  const platformFee = basePrice * 0.05; // 5%
  return basePrice + platformFee;
}

export function RideCard({ id, origin, destination, departureAt, arrivalAt, seatsAvailable, pricePerSeat, driver, index = 0 }: RideCardProps) {
  const navigate = useNavigate();
  const departure = new Date(departureAt);
  const arrival = arrivalAt ? new Date(arrivalAt) : null;
  const durationMins = arrival ? differenceInMinutes(arrival, departure) : null;

  const initials = driver?.fullName
    ? driver.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleCardClick = () => {
    navigate({ to: "/rides/$rideId", params: { rideId: id } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="group glass rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
      onClick={handleCardClick}
    >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

          {/* ── Timeline ── */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Departure */}
            <div className="text-center shrink-0">
              <p className="text-xl font-bold tabular-nums">{format(departure, "HH:mm")}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[80px]">{origin}</p>
            </div>

            {/* Progress line + duration */}
            <div className="flex-1 flex flex-col items-center gap-0.5 min-w-[60px]">
              {durationMins !== null && (
                <span className="text-xs text-muted-foreground">{formatDuration(durationMins)}</span>
              )}
              <div className="relative w-full flex items-center">
                <div className="h-px flex-1 bg-border" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary mx-1 shrink-0" />
                <div className="h-px flex-1 bg-border" />
              </div>
              <span className="text-xs text-muted-foreground">{seatsAvailable} seat{seatsAvailable !== 1 ? "s" : ""}</span>
            </div>

            {/* Arrival */}
            {arrival ? (
              <div className="text-center shrink-0">
                <p className="text-xl font-bold tabular-nums">{format(arrival, "HH:mm")}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[80px]">{destination}</p>
              </div>
            ) : (
              <div className="text-center shrink-0">
                <p className="text-xs text-muted-foreground font-medium truncate max-w-[80px]">{destination}</p>
              </div>
            )}
          </div>

          {/* ── Driver info ── */}
          <div className="flex items-center gap-2.5 sm:border-l sm:border-border/40 sm:pl-5">
            <Avatar className="h-9 w-9 border border-border/40 shrink-0">
              <AvatarImage src={driver?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-tight">{driver?.fullName ?? "Driver"}</p>
              <span className="inline-flex items-center gap-1 text-xs text-primary mt-0.5">
                <Zap className="h-3 w-3" />Instant Booking
              </span>
            </div>
          </div>

          {/* ── Price + CTA ── */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 sm:border-l sm:border-border/40 sm:pl-5">
            <div className="flex items-baseline gap-0.5">
              <IndianRupee className="h-4 w-4 text-foreground" />
              <span className="text-2xl font-bold tabular-nums">{Math.round(calculateFinalPrice(pricePerSeat)).toLocaleString("en-IN")}</span>
              <span className="text-xs text-muted-foreground">.00</span>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 whitespace-nowrap shrink-0"
              onClick={e => {
                e.stopPropagation();
                navigate({ to: "/rides/$rideId", params: { rideId: id } });
              }}
            >
              View ride
            </Button>
          </div>

        </div>

        {/* ── Seats warning ── */}
        {seatsAvailable === 0 && (
          <div className="mt-3 pt-3 border-t border-border/30 text-center text-xs text-destructive font-medium">
            No seats available
          </div>
        )}
        {seatsAvailable === 1 && (
          <div className="mt-3 pt-3 border-t border-border/30 text-center text-xs text-amber-400 font-medium">
            Only 1 seat left — book fast!
          </div>
        )}
    </motion.div>
  );
}
