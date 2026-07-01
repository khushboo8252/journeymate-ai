import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Seat {
  _id: string;
  seatNumber: string;
  row: string;
  position: number;
  type?: string;
  passenger?: {
    _id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string;
  };
  status: string;
}

interface DriverSeatMapProps {
  rideId: string;
  seats: Seat[];
  vehicleType: string;
}

export function DriverSeatMap({ rideId, seats, vehicleType }: DriverSeatMapProps) {
  // Group seats by row
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    if (!acc[seat.row].some(s => s.seatNumber === seat.seatNumber)) {
      acc[seat.row].push(seat);
    }
    return acc;
  }, {} as Record<string, Seat[]>);

  // Row A check and initialization
  if (!rows["A"]) {
    rows["A"] = [];
  }

  // 🚨 [INDIAN CAR FIX]: Row A me A1 (Driver) ko array ke PEECHE (push) karenge
  // taaki A2 (Passenger) left me render ho aur A1 (Steering) Right side me aaye!
  if (!rows["A"].some(s => s.seatNumber === "A1")) {
    rows["A"].push({
      _id: "driver-placeholder",
      seatNumber: "A1",
      row: "A",
      position: 2, // Right side position
      type: "driver",
      status: "available"
    });
  }

  const rowOrder = Object.keys(rows).sort();

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground bg-muted/30 py-2 rounded-xl">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-5 rounded-t-lg border-2 border-primary bg-primary/20" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-5 rounded-t-lg border-2 border-muted-foreground/20 bg-muted/60" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-5 rounded-t-lg border-2 border-amber-500/40 bg-amber-500/20" />
          Locked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-5 rounded-t-lg border-2 border-dashed border-primary/40 bg-primary/5" />
          Driver (Steering)
        </span>
      </div>

      {/* Seat rows */}
      <div className="space-y-5 mt-6">
        {/* 🚨 FIX: Corrected curly braces here */}
        {rowOrder.map((row) => {
          let sortedSeats = [...rows[row]];
          
          if (row === "A") {
            const pSeat = sortedSeats.find(s => s.seatNumber === "A2");
            const dSeat = sortedSeats.find(s => s.seatNumber === "A1");
            sortedSeats = [];
            if (pSeat) sortedSeats.push(pSeat);
            if (dSeat) sortedSeats.push(dSeat);
          } else {
            sortedSeats.sort((a, b) => a.position - b.position);
          }

          return (
            <div key={row} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
                {row} Row
              </p>
              
              <div className="flex items-center justify-center gap-4">
                {sortedSeats.map((seat) => {
                  
                  // DRIVER SEAT CHECK
                  if (seat.seatNumber === 'A1' || seat.type === 'driver') {
                    return (
                      <div 
                        key="driver-seat-box"
                        className="flex flex-col items-center justify-center rounded-t-2xl border-2 border-dashed border-primary/40 bg-primary/5 w-16 h-20 select-none text-center shadow-sm animate-fade-in"
                      >
                        <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">A1</span>
                        <span className="text-[10px] text-muted-foreground font-semibold mt-1">Steering</span>
                      </div>
                    );
                  }

                  const isBooked = seat.status === 'booked';
                  const isAvailable = seat.status === 'available';
                  const isLocked = seat.status === 'locked';
                  const passenger = seat.passenger;

                  return (
                    <Dialog key={seat._id || seat.seatNumber}>
                      <DialogTrigger asChild>
                        <button
                          disabled={isBooked || isLocked}
                          title={
                            passenger 
                              ? `${passenger.fullName} - ${seat.seatNumber}`
                              : `${seat.seatNumber} - ${isLocked ? 'Locked' : 'Available'}`
                          }
                          className={cn(
                            "group relative flex flex-col items-center justify-between pb-1.5 pt-2.5 rounded-t-2xl border-2 w-16 h-20 transition-all duration-150 select-none",
                            isBooked && "bg-muted border-muted-foreground/30 cursor-not-allowed opacity-50 grayscale",
                            isAvailable && "bg-muted/50 border-muted-foreground/20 cursor-default opacity-60",
                            isLocked && "bg-amber-500/20 border-amber-500/40 cursor-default opacity-70"
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs font-semibold leading-none z-10",
                              isBooked && "text-muted-foreground",
                              isAvailable && "text-muted-foreground/40",
                              isLocked && "text-amber-600"
                            )}
                          >
                            {seat.seatNumber}
                          </span>

                          {passenger && (
                            <Avatar className="h-7 w-7 border border-primary/50">
                              <AvatarImage src={passenger.avatarUrl} />
                              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                {passenger.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={cn(
                              "w-full h-2.5 rounded-b-sm absolute bottom-0 left-0 right-0",
                              isBooked && "bg-muted-foreground/10",
                              isAvailable && "bg-muted-foreground/10",
                              isLocked && "bg-amber-500/10"
                            )}
                          />

                          {passenger && (
                            <span className="text-[9px] text-muted-foreground font-medium leading-none mt-0.5 truncate max-w-[60px]">
                              {passenger.fullName.split(' ')[0]}
                            </span>
                          )}
                        </button>
                      </DialogTrigger>

                      {passenger && (
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Passenger Details</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center space-y-4 py-4">
                            <Avatar className="h-20 w-20 border-2 border-primary">
                              <AvatarImage src={passenger.avatarUrl} />
                              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                                {passenger.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                              <h3 className="font-semibold text-lg">{passenger.fullName}</h3>
                              <p className="text-sm text-muted-foreground">Seat {seat.seatNumber}</p>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => window.location.href = `tel:${passenger.phone}`}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call Passenger
                            </Button>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {/* 🚨 [FIXED LOGIC]: Driver ko dono taraf se bilkul alag kar diya hai */}
      <div className="pt-4 border-t border-border/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total passengers</span>
          <span className="font-semibold">
            {seats.filter(s => s.status === 'booked' && s.type !== 'driver' && s.seatNumber !== 'A1').length} / {seats.filter(s => s.type !== 'driver' && s.seatNumber !== 'A1').length}
          </span>
        </div>
      </div>
    </div>
  );
}