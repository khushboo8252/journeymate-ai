import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Car, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/publish")({
  head: () => ({
    meta: [
      { title: "Publish a ride — Ukyro" },
      { name: "description", content: "Offer a seat in your car and travel for less." },
    ],
  }),
  component: PublishPage,
});

const schema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  date: z.string().min(1),
  time: z.string().min(1),
  arrivalTime: z.string().optional(),
  vehicleSeats: z.string().min(1),
  price: z.string().refine(v => Number(v) > 0),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function PublishPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vehicleSeats: "5" },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    try {
      const seatCount = Number(values.vehicleSeats);
      // Determine vehicle type based on seat count
      let vehicleType = "sedan";
      if (seatCount >= 8) {
        vehicleType = "van";
      } else if (seatCount >= 6) {
        vehicleType = "suv";
      } else if (seatCount === 4) {
        vehicleType = "hatchback";
      }

      await api.post("/api/rides", {
        origin: values.origin,
        destination: values.destination,
        departureAt: new Date(`${values.date}T${values.time}`).toISOString(),
        arrivalAt: values.arrivalTime ? new Date(`${values.date}T${values.arrivalTime}`).toISOString() : null,
        seatsTotal: seatCount,
        pricePerSeat: Number(values.price),
        description: values.description || null,
        vehicleType,
      });
      toast.success(t("publish.success"));
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("publish.error"));
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="glass rounded-2xl p-10 text-center max-w-sm w-full">
            <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("auth.signin")}</h2>
            <p className="text-muted-foreground mb-6">You need to be signed in to publish a ride.</p>
            <Link to="/auth"><Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">{t("auth.signin")}</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if user is a driver and if they are approved
  if (user.role === "driver" && !user.isApproved) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="glass rounded-2xl p-10 text-center max-w-sm w-full">
            <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Account Pending Approval</h2>
            <p className="text-muted-foreground mb-6">Your driver account is pending admin approval. You cannot publish rides until approved.</p>
            <Link to="/dashboard"><Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">Go to Dashboard</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if user is a passenger (passengers cannot publish rides)
  if (user.role === "passenger") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="glass rounded-2xl p-10 text-center max-w-sm w-full">
            <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Driver Account Required</h2>
            <p className="text-muted-foreground mb-6">Only drivers can publish rides. Please register as a driver to publish rides.</p>
            <Link to="/dashboard"><Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">Go to Dashboard</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("publish.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("publish.subtitle")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>{t("publish.origin")}</Label>
                <Input placeholder={t("publish.origin_ph")} {...register("origin")} />
                {errors.origin && <p className="text-xs text-destructive">{t("publish.origin")}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("publish.destination")}</Label>
                <Input placeholder={t("publish.destination_ph")} {...register("destination")} />
                {errors.destination && <p className="text-xs text-destructive">{t("publish.destination")}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("publish.date")}</Label>
                <Input type="date" min={new Date().toISOString().split("T")[0]} {...register("date")} />
                {errors.date && <p className="text-xs text-destructive">{t("publish.date")}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("publish.departure")}</Label>
                <Input type="time" {...register("time")} />
                {errors.time && <p className="text-xs text-destructive">{t("publish.departure")}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("publish.arrival")} <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input type="time" {...register("arrivalTime")} />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle Seats</Label>
                <Select defaultValue="5" onValueChange={v => setValue("vehicleSeats", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} seats</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicleSeats && <p className="text-xs text-destructive">Vehicle seats are required</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("publish.price")}</Label>
                <Input type="number" placeholder={t("publish.price_ph")} min={1} {...register("price")} />
                {errors.price && <p className="text-xs text-destructive">{t("publish.price")}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes for passengers <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea placeholder="Luggage space, pet-friendly, pick-up point details…" rows={3} {...register("description")} />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold h-12 text-base">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t("publish.publish")}
            </Button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}