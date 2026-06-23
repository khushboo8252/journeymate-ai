import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { LayoutDashboard, LogOut, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import logoImg from "@/assets/logo.jpg";

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'booking' | 'ride' | 'payment' | 'system';
}

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const addNotification = (message: string, type: 'booking' | 'ride' | 'payment' | 'system') => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      read: false,
      type,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  };

  // Listen for WebSocket events for notifications
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleNewBooking = (data: any) => {
      if (user.role === 'driver') {
        addNotification(`New booking received from ${data.passengerId?.fullName || 'a passenger'}`, 'booking');
      }
    };

    const handleBookingConfirmed = (data: any) => {
      if (user.role === 'passenger') {
        addNotification('Your booking has been confirmed!', 'booking');
      }
    };

    const handleRideCompleted = (data: any) => {
      addNotification('Ride completed successfully!', 'ride');
    };

    const handleDriverConfirmedCompletion = (data: any) => {
      if (user.role === 'passenger') {
        addNotification('Driver has confirmed ride completion. Please confirm to complete the ride.', 'ride');
      }
    };

    const handlePassengerConfirmedCompletion = (data: any) => {
      if (user.role === 'driver') {
        addNotification('Passenger has confirmed ride completion.', 'ride');
      }
    };

    socket.on('new_booking', handleNewBooking);
    socket.on('booking_created', handleBookingConfirmed);
    socket.on('ride_completed', handleRideCompleted);
    socket.on('driver_confirmed_completion', handleDriverConfirmedCompletion);
    socket.on('passenger_confirmed_completion', handlePassengerConfirmedCompletion);

    return () => {
      socket.off('new_booking', handleNewBooking);
      socket.off('booking_created', handleBookingConfirmed);
      socket.off('ride_completed', handleRideCompleted);
      socket.off('driver_confirmed_completion', handleDriverConfirmedCompletion);
      socket.off('passenger_confirmed_completion', handlePassengerConfirmedCompletion);
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logoImg} alt="Logo" className="h-12 object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {/* Navigation removed - only logo remains */}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <>
              {/* Notification Bell */}
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass w-80 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                        Mark all read
                      </Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-3 cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex gap-3 w-full">
                          <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-primary' : 'bg-muted'}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.timestamp)}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-primary/30 hover:ring-primary/60 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass w-48">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2">
                    <LogOut className="h-4 w-4" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ tab: "signin" }} className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">{t("nav.login")}</Button>
              </Link>
              <Link to="/auth" search={{ tab: "signup" }}>
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
                  {t("nav.signup")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}