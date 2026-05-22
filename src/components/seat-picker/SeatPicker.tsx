import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket";

export interface Seat {
  _id: string;
  seatNumber: string;
  row: string;
  position: number;
  type: 'driver' | 'passenger' | 'window' | 'middle';
  status: 'available' | 'booked' | 'locked';
  lockedBy?: string | null;
  lockedUntil?: string | null;
  isMyLock?: boolean;
}

interface SeatPickerProps {
  rideId: string;
  seats: Seat[];
  selectedSeats: string[];
  onSeatToggle: (seatNumber: string) => void;
  userId?: string;
}

const SEAT_COLORS = {
  available: 'bg-background/60 border-border hover:border-primary/70 hover:bg-primary/5',
  booked: 'bg-muted/50 border-muted-foreground/20 cursor-not-allowed opacity-60',
  locked: 'bg-amber-500/20 border-amber-500/40 cursor-not-allowed opacity-70',
  selected: 'bg-primary border-primary shadow-lg shadow-primary/30',
};

const SEAT_TEXT_COLORS = {
  available: 'text-muted-foreground group-hover:text-primary',
  booked: 'text-muted-foreground/40',
  locked: 'text-amber-600',
  selected: 'text-primary-foreground',
};

export function SeatPicker({ rideId, seats, selectedSeats, onSeatToggle, userId }: SeatPickerProps) {
  const socketRef = useRef(getSocket());
  const [localSeats, setLocalSeats] = useState<Seat[]>(seats);

  // Sync seats with prop changes
  useEffect(() => {
    setLocalSeats(seats);
  }, [seats]);

  // Listen for real-time seat updates
  useEffect(() => {
    const socket = socketRef.current;

    const handleSeatLocked = (data: { rideId: string; seatNumbers: string[] }) => {
      if (data.rideId === rideId) {
        setLocalSeats(prev => prev.map(seat => 
          data.seatNumbers.includes(seat.seatNumber) 
            ? { ...seat, status: 'locked' as const }
            : seat
        ));
      }
    };

    const handleSeatReleased = (data: { rideId: string; seatNumbers: string[] }) => {
      if (data.rideId === rideId) {
        setLocalSeats(prev => prev.map(seat => 
          data.seatNumbers.includes(seat.seatNumber) 
            ? { ...seat, status: 'available' as const, lockedBy: null, lockedUntil: null, isMyLock: false }
            : seat
        ));
      }
    };

    const handleSeatBooked = (data: { rideId: string; seatNumbers: string[] }) => {
      if (data.rideId === rideId) {
        setLocalSeats(prev => prev.map(seat => 
          data.seatNumbers.includes(seat.seatNumber) 
            ? { ...seat, status: 'booked' as const, lockedBy: null, lockedUntil: null, isMyLock: false }
            : seat
        ));
      }
    };

    const handleSeatLockExpired = (data: { rideId: string; seatNumbers: string[] }) => {
      if (data.rideId === rideId) {
        setLocalSeats(prev => prev.map(seat => 
          data.seatNumbers.includes(seat.seatNumber) 
            ? { ...seat, status: 'available' as const, lockedBy: null, lockedUntil: null, isMyLock: false }
            : seat
        ));
      }
    };

    socket.on('seat_locked', handleSeatLocked);
    socket.on('seat_released', handleSeatReleased);
    socket.on('seat_booked', handleSeatBooked);
    socket.on('seat_lock_expired', handleSeatLockExpired);

    // Join ride room for real-time updates
    socket.emit('join_ride', rideId);

    return () => {
      socket.off('seat_locked', handleSeatLocked);
      socket.off('seat_released', handleSeatReleased);
      socket.off('seat_booked', handleSeatBooked);
      socket.off('seat_lock_expired', handleSeatLockExpired);
      socket.emit('leave_ride', rideId);
    };
  }, [rideId]);

  // Group seats by row
  const rows = localSeats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  const rowOrder = Object.keys(rows).sort();

  const getSeatLabel = (seat: Seat, rowSeats: Seat[]) => {
    if (seat.type === 'driver') return 'D';
    const idx = rowSeats.indexOf(seat);
    const len = rowSeats.length;
    if (len === 1) return '';
    if (idx === 0 || idx === len - 1) return 'Window';
    return 'Middle';
  };

  const isSeatAvailable = (seat: Seat) => {
    return seat.status === 'available' && !selectedSeats.includes(seat.seatNumber);
  };

  const isSeatSelected = (seat: Seat) => {
    return selectedSeats.includes(seat.seatNumber);
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-5 rounded-t-lg border-2 border-muted-foreground/20 bg-muted/60" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-5 rounded-t-lg border-2 border-border bg-background/60" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-5 rounded-t-lg border-2 border-amber-500/40 bg-amber-500/20" />
          Locked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-5 rounded-t-lg border-2 border-primary bg-primary" />
          Selected
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
                  const isSelected = isSeatSelected(seat);
                  const isAvailable = isSeatAvailable(seat);
                  const isDriver = seat.type === 'driver';
                  const seatLabel = getSeatLabel(seat, rows[row]);

                  return (
                    <button
                      key={seat._id}
                      disabled={!isAvailable && !isSelected}
                      onClick={() => onSeatToggle(seat.seatNumber)}
                      title={
                        isDriver ? 'Driver seat' :
                        seat.status === 'booked' ? 'Already booked' :
                        seat.status === 'locked' ? seat.isMyLock ? 'Your selection' : 'Locked by another user' :
                        isSelected ? 'Click to deselect' : 'Click to select'
                      }
                      className={cn(
                        "group relative flex flex-col items-center justify-between pb-1.5 pt-2.5 rounded-t-2xl border-2 w-14 h-16 transition-all duration-150 select-none",
                        isDriver && 'bg-muted/50 border-muted-foreground/20 cursor-not-allowed opacity-60',
                        !isDriver && isSelected && SEAT_COLORS.selected,
                        !isDriver && !isSelected && seat.status === 'booked' && SEAT_COLORS.booked,
                        !isDriver && !isSelected && seat.status === 'locked' && SEAT_COLORS.locked,
                        !isDriver && !isSelected && seat.status === 'available' && SEAT_COLORS.available
                      )}
                    >
                      {/* Seat number */}
                      <span
                        className={cn(
                          "text-xs font-semibold leading-none z-10",
                          isDriver && 'text-muted-foreground/40',
                          !isDriver && !isSelected && SEAT_TEXT_COLORS[seat.status],
                          isSelected && SEAT_TEXT_COLORS.selected
                        )}
                      >
                        {isDriver ? 'D' : seat.seatNumber}
                      </span>

                      {/* Seat label (Window/Middle) */}
                      {seatLabel && !isDriver && (
                        <span
                          className={cn(
                            "text-[9px] leading-none",
                            !isDriver && !isSelected && SEAT_TEXT_COLORS[seat.status],
                            isSelected && SEAT_TEXT_COLORS.selected
                          )}
                        >
                          {seatLabel}
                        </span>
                      )}

                      {/* Seat cushion strip at bottom */}
                      <div
                        className={cn(
                          "w-full h-2.5 rounded-b-sm absolute bottom-0 left-0 right-0",
                          isDriver && 'bg-muted-foreground/10',
                          !isDriver && !isSelected && seat.status === 'booked' && 'bg-muted-foreground/10',
                          !isDriver && !isSelected && seat.status === 'locked' && 'bg-amber-500/10',
                          !isDriver && !isSelected && seat.status === 'available' && 'bg-muted/70',
                          isSelected && 'bg-white/20'
                        )}
                      />

                      {/* Locked indicator */}
                      {seat.status === 'locked' && !isDriver && (
                        <div className="absolute -top-1 -right-1">
                          <Clock className="h-3 w-3 text-amber-600" />
                        </div>
                      )}

                      {/* Booked X mark */}
                      {seat.status === 'booked' && !isDriver && (
                        <span className="text-[10px] text-muted-foreground/50 font-bold leading-none">✕</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {rows[row].some(s => s.type === 'driver') && (
                <div className="w-16 h-10 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground/50">
                  Steering
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selection summary */}
      {selectedSeats.length > 0 && (
        <p className="text-sm text-primary font-medium">
          {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected (seat{selectedSeats.length > 1 ? 's' : ''} {selectedSeats.sort().join(', ')})
        </p>
      )}
    </div>
  );
}
