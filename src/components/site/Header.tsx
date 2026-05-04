import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageToggle";

export function Header() {
  const { t } = useTranslation();
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
          <Link to="/auth" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">{t("nav.login")}</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
              {t("nav.signup")}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}