import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Calendar,
  IndianRupee,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Leaf,
  Users,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImg from "@/assets/hero-car.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = () => {
    navigate({
      to: "/search",
      search: {
        from: from || undefined,
        to: to || undefined,
        date: date || undefined,
      },
    });
  };

  const features = [
    { key: "price", icon: IndianRupee },
    { key: "trust", icon: ShieldCheck },
    { key: "ai", icon: Sparkles },
    { key: "eco", icon: Leaf },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img
              src={heroImg}
              alt="Neon-lit car driving through an Indian city at night"
              width={1920}
              height={1080}
              className="h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>

          <div className="container mx-auto px-4 md:px-6 pt-20 pb-16 md:pt-32 md:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium mb-6 animate-glow-pulse">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="shimmer-text">{t("hero.badge")}</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
                {t("hero.title_a")}
                <br />
                <span className="text-gradient">{t("hero.title_b")}</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("hero.subtitle")}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity shadow-[var(--shadow-glow)] font-semibold text-base h-12 px-8">
                    <Users className="h-5 w-5 mr-2" />
                    Become a Passenger
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold text-base h-12 px-8 border-primary/40 hover:border-primary/70 hover:bg-primary/10 transition-all">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Start Your Journey
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* SEARCH CARD */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-12 max-w-5xl mx-auto"
            >
              <div className="glass rounded-2xl p-3 md:p-4 shadow-[var(--shadow-elegant)]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <SearchField icon={MapPin} label={t("search.from")} placeholder={t("search.from_ph")} value={from} onChange={setFrom} className="md:col-span-4" />
                  <SearchField icon={MapPin} label={t("search.to")} placeholder={t("search.to_ph")} value={to} onChange={setTo} className="md:col-span-4" />
                  <SearchField icon={Calendar} label={t("search.date")} placeholder="DD / MM" type="date" value={date} onChange={setDate} className="md:col-span-2" />
                  <div className="md:col-span-2">
                    <Button onClick={handleSearch} className="w-full h-full min-h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/40 font-semibold">
                      <Search className="h-4 w-4 mr-2" />
                      {t("search.button")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                {[
                  { v: "2M+", l: "Travelers" },
                  { v: "50K+", l: "Daily rides" },
                  { v: "4.8★", l: "Avg rating" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-gradient">{s.v}</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="container mx-auto px-4 md:px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">{t("features.title")}</h2>
            <p className="mt-4 text-muted-foreground text-lg">{t("features.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="group relative rounded-2xl glass p-6 hover:border-primary/40 transition-all duration-300"
                >
                  <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border/40 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t(`features.items.${f.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`features.items.${f.key}.desc`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container mx-auto px-4 md:px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">{t("how.title")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            {([1, 2, 3] as const).map((n, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full glass mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 animate-glow-pulse" />
                  <span className="text-3xl font-bold text-gradient relative">{n}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{t(`how.s${n}.title`)}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">{t(`how.s${n}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 md:px-6 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl glass p-10 md:p-16 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl animate-glow-pulse" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/30 blur-3xl animate-glow-pulse" />
            <div className="relative">
              <Users className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-5xl font-bold">{t("cta.title")}</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">{t("cta.subtitle")}</p>
              <Link to="/auth" className="inline-block mt-8">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity shadow-[var(--shadow-glow)] font-semibold text-base h-12 px-8">
                  {t("cta.button")}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SearchField({
  icon: Icon,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  className = "",
}: {
  icon: typeof MapPin;
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={`relative rounded-xl bg-background/60 border border-border/40 px-4 py-2 hover:border-primary/40 transition-colors ${className}`}>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
      />
    </div>
  );
}
