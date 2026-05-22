import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Car, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
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
      { title: "Publish a ride — RideWave" },
      { name: "description", content: "Offer a seat in your car and travel for less." },
    ],
  }),
  component: PublishPage,
});

const schema = z.object({
  origin: z.string().min(2, "Enter departure city"),
  destination: z.string().min(2, "Enter destination city"),
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time"),
  arrivalTime: z.string().optional(),
  vehicleType: z.string().min(1, "Select vehicle type"),
  price: z.string().refine(v => Number(v) > 0, "Enter a valid price"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function PublishPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vehicleType: "sedan" },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    try {
      await api.post("/api/rides", {
        origin: values.origin,
        destination: values.destination,
        departureAt: new Date(`${values.date}T${values.time}`).toISOString(),
        arrivalAt: values.arrivalTime ? new Date(`${values.date}T${values.arrivalTime}`).toISOString() : null,
        vehicleType: values.vehicleType,
        pricePerSeat: Number(values.price),
        description: values.description || null,
      });
      toast.success("Ride published! Passengers can now find it.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish ride");
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
            <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
            <p className="text-muted-foreground mb-6">You need to be signed in to publish a ride.</p>
            <Link to="/auth"><Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">Sign in</Button></Link>
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
              <h1 className="text-2xl font-bold">Publish a ride</h1>
              <p className="text-sm text-muted-foreground">Share your route and earn money on fuel</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input placeholder="Mumbai" {...register("origin")} />
                {errors.origin && <p className="text-xs text-destructive">{errors.origin.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input placeholder="Pune" {...register("destination")} />
                {errors.destination && <p className="text-xs text-destructive">{errors.destination.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" min={new Date().toISOString().split("T")[0]} {...register("date")} />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Departure time</Label>
                <Input type="time" {...register("time")} />
                {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Arrival time <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input type="time" {...register("arrivalTime")} />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle type</Label>
                <Select defaultValue="sedan" onValueChange={v => setValue("vehicleType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hatchback">Hatchback (5 seats)</SelectItem>
                    <SelectItem value="sedan">Sedan (5 seats)</SelectItem>
                    <SelectItem value="suv">SUV (7 seats)</SelectItem>
                    <SelectItem value="mpv">MPV (7 seats)</SelectItem>
                    <SelectItem value="van">Van (10 seats)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicleType && <p className="text-xs text-destructive">{errors.vehicleType.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Price per seat (₹)</Label>
                <Input type="number" placeholder="500" min={1} {...register("price")} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes for passengers <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea placeholder="Luggage space, pet-friendly, pick-up point details…" rows={3} {...register("description")} />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold h-12 text-base">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publish ride"}
            </Button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}