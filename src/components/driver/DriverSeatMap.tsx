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
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  const rowOrder = Object.keys(rows).sort();

  const getSeatLabel = (seat: Seat, rowSeats: Seat[]) => {
    if (seat.position === 1) return "Window";
    const idx = rowSeats.indexOf(seat);
    const len = rowSeats.length;
    if (idx === len - 1) return "Window";
    return "Middle";
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
      </div>

      {/* Seat rows */}
      <div className="space-y-5">
        {rowOrder.map((row) => (
          <div key={row} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {row} row
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex gap-3 flex-wrap justify-center">
                {rows[row].map((seat) => {
                  const isBooked = seat.status === 'booked';
                  const isAvailable = seat.status === 'available';
                  const isLocked = seat.status === 'locked';
                  const passenger = seat.passenger;

                  return (
                    <Dialog key={seat._id || seat.seatNumber}>
                      <DialogTrigger asChild>
                        <button
                          disabled={!passenger}
                          title={
                            passenger 
                              ? `${passenger.fullName} - ${seat.seatNumber}`
                              : `${seat.seatNumber} - ${isLocked ? 'Locked' : 'Available'}`
                          }
                          className={cn(
                            "group relative flex flex-col items-center justify-between pb-1.5 pt-2.5 rounded-t-2xl border-2 w-16 h-20 transition-all duration-150 select-none",
                            isBooked && "bg-primary/20 border-primary cursor-pointer hover:bg-primary/30",
                            isAvailable && "bg-muted/50 border-muted-foreground/20 cursor-default opacity-60",
                            isLocked && "bg-amber-500/20 border-amber-500/40 cursor-default opacity-70"
                          )}
                        >
                          {/* Seat number */}
                          <span
                            className={cn(
                              "text-xs font-semibold leading-none z-10",
                              isBooked && "text-primary",
                              isAvailable && "text-muted-foreground/40",
                              isLocked && "text-amber-600"
                            )}
                          >
                            {seat.seatNumber}
                          </span>

                          {/* Passenger avatar */}
                          {passenger && (
                            <Avatar className="h-7 w-7 border border-primary/50">
                              <AvatarImage src={passenger.avatarUrl} />
                              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                {passenger.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          {/* Seat cushion strip at bottom */}
                          <div
                            className={cn(
                              "w-full h-2.5 rounded-b-sm absolute bottom-0 left-0 right-0",
                              isBooked && "bg-primary/10",
                              isAvailable && "bg-muted-foreground/10",
                              isLocked && "bg-amber-500/10"
                            )}
                          />

                          {/* Passenger name */}
                          {passenger && (
                            <span className="text-[9px] text-primary font-medium leading-none mt-0.5 truncate max-w-[60px]">
                              {passenger.fullName.split(' ')[0]}
                            </span>
                          )}
                        </button>
                      </DialogTrigger>

                      {/* Passenger details dialog */}
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
              {/* Steering wheel placeholder */}
              {rows[row].some(s => s.position === 1) && (
                <div className="w-16 h-10 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground/50">
                  Steering
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-border/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total passengers</span>
          <span className="font-semibold">
            {seats.filter(s => s.status === 'booked').length} / {seats.length}
          </span>
        </div>
      </div>
    </div>
  );
}
