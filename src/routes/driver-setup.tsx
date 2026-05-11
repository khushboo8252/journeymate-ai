import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Camera, Car, CheckCircle2, CreditCard, Loader2, Lock, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { ApiUser } from "@/lib/api";

export const Route = createFileRoute("/driver-setup")({
  head: () => ({
    meta: [
      { title: "Driver Setup — RideWave" },
      { name: "description", content: "Complete your driver profile to start publishing rides." },
    ],
  }),
  component: DriverSetupPage,
});

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  vehicleSeats: z.string().min(1, "Select available seats"),
  bankAccountNumber: z
    .string()
    .min(9, "Account number must be at least 9 digits")
    .max(18, "Account number too long")
    .regex(/^\d+$/, "Account number must contain only digits"),
  ifscCode: z
    .string()
    .regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, "Invalid IFSC code (e.g. SBIN0001234)"),
});

type FormValues = z.infer<typeof schema>;

function DriverSetupPage() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      vehicleSeats: "3",
    },
  });

  useEffect(() => {
    if (!loading && user) {
      setValue("fullName", user.fullName ?? "");
      setValue("phone", user.phone ?? "");
      if (user.vehicleSeats) setValue("vehicleSeats", String(user.vehicleSeats));
      if (user.avatarUrl) setAvatarPreview(user.avatarUrl);
      if (user.role !== "driver") navigate({ to: "/dashboard" });
    }
  }, [user, loading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await api.put<{ status: string; user: ApiUser }>("/api/profile/driver", {
        fullName: values.fullName,
        phone: values.phone,
        vehicleSeats: Number(values.vehicleSeats),
        bankAccountNumber: values.bankAccountNumber,
        ifscCode: values.ifscCode.toUpperCase(),
        ...(avatarBase64 && { avatarUrl: avatarBase64 }),
      });
      setUser(data.user);
      toast.success("Driver profile saved! You can now publish rides.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
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
            <p className="text-muted-foreground mb-6">Please sign in as a driver to complete setup.</p>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">
                Sign in
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = (watch("fullName") || user.fullName || "D")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile complete banner */}
          {user.isProfileComplete && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Profile complete</p>
                <p className="text-xs text-muted-foreground">You can update your details below or go to your dashboard.</p>
              </div>
              <Link to="/dashboard">
                <Button size="sm" variant="outline" className="shrink-0 border-green-500/40 text-green-600 hover:bg-green-500/10">
                  Dashboard
                </Button>
              </Link>
            </div>
          )}

          {/* Page header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Complete your driver profile</h1>
              <p className="text-sm text-muted-foreground">Required before you can publish rides</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* ── SECTION 1: Personal details ───────────────────────────── */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal details
              </h2>
              <Separator />

              {/* Avatar upload */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-primary/30">
                    <AvatarImage src={avatarPreview ?? undefined} />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Profile photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or WEBP · max 2 MB</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Upload photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input placeholder="Rahul Sharma" {...register("fullName")} />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />Phone number
                  </Label>
                  <Input placeholder="+91 98765 43210" type="tel" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Vehicle details ────────────────────────────── */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Vehicle details
              </h2>
              <Separator />
              <div className="space-y-1.5 max-w-xs">
                <Label>Available seats for passengers</Label>
                <Select
                  defaultValue="3"
                  onValueChange={v => setValue("vehicleSeats", v)}
                >
                  <SelectTrigger className="bg-background/60 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <SelectItem key={n} value={String(n)}>
                        {n} seat{n > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicleSeats && <p className="text-xs text-destructive">{errors.vehicleSeats.message}</p>}
              </div>
            </div>

            {/* ── SECTION 3: Bank details ───────────────────────────────── */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Bank details
                <span className="ml-auto text-xs font-normal text-muted-foreground">Encrypted &amp; secure</span>
              </h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Bank account number</Label>
                  <Input
                    placeholder="Enter your account number"
                    type="text"
                    inputMode="numeric"
                    {...register("bankAccountNumber")}
                  />
                  {errors.bankAccountNumber && (
                    <p className="text-xs text-destructive">{errors.bankAccountNumber.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC code</Label>
                  <Input
                    placeholder="SBIN0001234"
                    className="uppercase"
                    {...register("ifscCode")}
                    onChange={e => {
                      e.target.value = e.target.value.toUpperCase();
                      register("ifscCode").onChange(e);
                    }}
                  />
                  {errors.ifscCode && <p className="text-xs text-destructive">{errors.ifscCode.message}</p>}
                  <p className="text-xs text-muted-foreground">11-character code on your cheque book</p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold h-12 text-base"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save driver profile"}
            </Button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
