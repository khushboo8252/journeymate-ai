import { useState } from "react";
import { Map, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PickupNavigatorProps {
  pickupPoint: string | null;
  rideOrigin: string; // 🚨 Naya prop: Driver ka Start Point
}

export function PickupNavigator({ pickupPoint, rideOrigin }: PickupNavigatorProps) {
  const [showMap, setShowMap] = useState(false);

  // Agar pickup point ya origin nahi hai, toh map render mat karo
  if (!pickupPoint || !rideOrigin) return null;

  // Exact text ko URL encode kar rahe hain taaki Google Maps precisely samajh sake
  const saddr = encodeURIComponent(rideOrigin); // Source (Driver Origin)
  const daddr = encodeURIComponent(pickupPoint); // Destination (Passenger Pickup)
  
  // URL trick jo direct Route Line banayegi Origin se Pickup tak
  const embedUrl = `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&output=embed`;
  const appUrl = `https://www.google.com/maps/dir/?api=1&origin=${saddr}&destination=${daddr}`;

  return (
    <div className="w-full mt-4 flex flex-col gap-3">
      {/* Pickup Details Box */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-muted border border-blue-100/50 dark:border-blue-900/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
              <Map className="h-3 w-3" /> Pickup Location
            </span>
            <span className="text-sm font-medium text-foreground leading-tight line-clamp-2">
              {pickupPoint}
            </span>
          </div>
          
          <Button 
            onClick={() => setShowMap(!showMap)}
            size="sm" 
            variant={showMap ? "outline" : "default"}
            className={!showMap ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 shrink-0 rounded-full px-4 transition-all active:scale-95" : "shrink-0 rounded-full px-4 transition-all active:scale-95 border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400"}
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            {showMap ? "Hide Map" : "View Route"}
          </Button>
        </div>
      </div>

      {/* Inline Embedded Route Map */}
      {showMap && (
        <div className="w-full overflow-hidden rounded-xl border border-border/50 shadow-inner bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <iframe 
            src={embedUrl}
            width="100%" 
            height="280" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full bg-muted"
          ></iframe>
          
          <div className="p-1.5 bg-background border-t border-border/50">
            <Button 
              onClick={() => window.open(appUrl, "_blank")}
              variant="ghost" 
              size="sm" 
              className="w-full text-xs text-muted-foreground hover:text-blue-600"
            >
              <ExternalLink className="h-3 w-3 mr-1.5" /> Start Driving (Google Maps App)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}