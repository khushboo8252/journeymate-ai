import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Car, ChevronRight, IndianRupee, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

function calculateRidePrice(driverFare: number) {
  const platformFee    = Math.round(driverFare * 0.3333);
  const extraCharge    = Math.round(platformFee * 0.30);
  const totalAmount    = driverFare + platformFee + extraCharge;
  const bookingAmount  = Math.round(totalAmount * 0.25);
  const remainingAmount = totalAmount - bookingAmount;
  return { driverFare, platformFee, extraCharge, totalAmount, bookingAmount, remainingAmount };
}

function PublishPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vehicleSeats: "5" },
  });

  const priceValue = useWatch({ control, name: "price" });
  const driverFare = Number(priceValue) || 0;
  const pricing = driverFare > 0 ? calculateRidePrice(driverFare) : null;

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    try {
      await api.post("/api/rides", {
        origin: values.origin,
        destination: values.destination,
        departureAt: new Date(`${values.date}T${values.time}`).toISOString(),
        arrivalAt: values.arrivalTime ? new Date(`${values.date}T${values.arrivalTime}`).toISOString() : null,
        seatsTotal: Number(values.vehicleSeats),
        seatsAvailable: Number(values.vehicleSeats),
        pricePerSeat: Number(values.price),
        description: values.description || null,
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

  if (user.role === "driver" && !user.isApproved) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
            <Lock className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Driver Approval Required</h2>
            <p className="text-muted-foreground mb-6">
              Your driver account is pending approval from the admin. You can publish rides once your account is approved.
            </p>
            {user.rejectionReason && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-600">{user.rejectionReason}</p>
              </div>
            )}
            <Link to="/dashboard">
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">
                Go to Dashboard
              </Button>
            </Link>
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
                <Label>{t("publish.price")} <span className="text-muted-foreground text-xs">(your fare per seat)</span></Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="e.g. 300" min={1} className="pl-8" {...register("price")} />
                </div>
                {errors.price && <p className="text-xs text-destructive">Enter a valid price</p>}
              </div>
            </div>

            {/* ── Live pricing preview ── */}
            {pricing && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2.5"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Passenger will pay</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ride Fare (your share)</span>
                    <span className="font-medium">₹{pricing.driverFare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span className="font-medium">₹{pricing.platformFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Convenience Charge</span>
                    <span className="font-medium">₹{pricing.extraCharge}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total per seat</span>
                    <span className="text-primary">₹{pricing.totalAmount}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ChevronRight className="h-3 w-3" />Pay now (25%)</span>
                    <span>₹{pricing.bookingAmount}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ChevronRight className="h-3 w-3" />Pay on completion (75%)</span>
                    <span>₹{pricing.remainingAmount}</span>
                  </div>
                </div>
                <p className="text-xs text-emerald-400 font-medium pt-1">✓ You earn ₹{pricing.driverFare} per seat</p>
              </motion.div>
            )}

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