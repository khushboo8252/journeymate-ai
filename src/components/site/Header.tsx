import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { Car, LayoutDashboard, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-magenta)] blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border/60">
              <Car className="h-5 w-5 text-primary" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Ride<span className="text-gradient">Wave</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/search" className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            {t("nav.search")}
          </Link>
          <Link to="/publish" className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            {t("nav.publish")}
          </Link>
          <Link to="/about" className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            {t("nav.about")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <>
              <Link to="/publish" className="hidden sm:inline-flex">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />Publish
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-primary/30 hover:ring-primary/60 transition-all">
                    <Avatar className="h-8 w-8">
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
                  <DropdownMenuItem asChild>
                    <Link to="/publish" className="flex items-center gap-2 cursor-pointer">
                      <Plus className="h-4 w-4" />Publish a ride
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
              <Link to="/auth" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">{t("nav.login")}</Button>
              </Link>
              <Link to="/auth">
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