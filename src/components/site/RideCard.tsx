import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowRight, Calendar, IndianRupee, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RideCardProps {
  id: string;
  origin: string;
  destination: string;
  departureAt: string;
  seatsAvailable: number;
  pricePerSeat: number;
  driver?: {
    fullName: string | null;
    avatarUrl?: string | null;
  } | null;
  index?: number;
}

export function RideCard({ id, origin, destination, departureAt, seatsAvailable, pricePerSeat, driver, index = 0 }: RideCardProps) {
  const departure = new Date(departureAt);
  const initials = driver?.fullName
    ? driver.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group glass rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Route */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{origin}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{destination}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(departure, "EEE, d MMM")}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(departure, "h:mm a")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {seatsAvailable} seat{seatsAvailable !== 1 ? "s" : ""} left
            </span>
          </div>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-border/40">
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground hidden sm:block">{driver?.fullName ?? "Driver"}</span>
        </div>

        {/* Price + CTA */}
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
          <div className="flex items-center gap-0.5 text-xl font-bold text-gradient">
            <IndianRupee className="h-4 w-4" />
            {Number(pricePerSeat).toLocaleString("en-IN")}
          </div>
          <Badge variant="secondary" className="text-xs hidden sm:block">per seat</Badge>
        </div>

        <Link to="/rides/$rideId" params={{ rideId: id }}>
          <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 whitespace-nowrap">
            View ride
          </Button>
        </Link>
      </div>

      {seatsAvailable === 0 && (
        <div className="mt-3 text-center text-xs text-destructive font-medium">No seats available</div>
      )}
    </motion.div>
  );
}
