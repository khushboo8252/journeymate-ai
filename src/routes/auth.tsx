import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Car, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, setToken } from "@/lib/api";
import type { ApiUser } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab as string || "signin",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Ukyro" },
      { name: "description", content: "Sign in or create your Ukyro account." },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signUpSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  role: z.enum(["driver", "passenger"]),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

function SignInForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (values: SignInValues) => {
    try {
      const data = await api.post<{ token: string; user: ApiUser }>("/api/auth/login", values);
      setToken(data.token);
      setUser(data.user);
      toast.success(t("auth.welcome_back"));
      // If user is a driver and hasn't completed profile, redirect to driver-setup
      if (data.user.role === "driver") {
        if (!(data.user as any).isProfileComplete) {
          navigate({ to: "/driver-setup" });
        } else if (data.user.isApproved) {
          navigate({ to: "/publish" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.signin_failed"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="si-email">{t("auth.email")}</Label>
        <Input id="si-email" type="email" placeholder={t("auth.email_ph")} {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{t("auth.valid_email")}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="si-pw">{t("auth.password")}</Label>
        <div className="relative">
          <Input id="si-pw" type={showPw ? "text" : "password"} placeholder={t("auth.password_ph")} {...register("password")} className="pr-10" />
          <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{t("auth.password_min")}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.signin")}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: "driver" },
  });
  const selectedRole = watch("role");

  const onSubmit = async (values: SignUpValues) => {
    try {
      const data = await api.post<{ token: string; user: ApiUser }>("/api/auth/register", {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: values.role,
      });
      setToken(data.token);
      setUser(data.user);
      toast.success(t("auth.account_created"));
      if (data.user.role === "driver") {
        navigate({ to: "/driver-setup" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.signup_failed"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Role selector */}
      <div className="space-y-1.5">
        <Label>{t("auth.i_am")}</Label>
        <Select value={selectedRole} onValueChange={v => setValue("role", v as "driver" | "passenger")}>
          <SelectTrigger className="bg-background/60 border-border/40">
            <SelectValue placeholder={t("auth.select_role")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="driver">{t("auth.driver")}</SelectItem>
            <SelectItem value="passenger">{t("auth.passenger")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="su-name">{t("auth.full_name")}</Label>
        <Input id="su-name" type="text" placeholder={t("auth.full_name_ph")} {...register("fullName")} />
        {errors.fullName && <p className="text-xs text-destructive">{t("auth.name_min")}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">{t("auth.email")}</Label>
        <Input id="su-email" type="email" placeholder={t("auth.email_ph")} {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{t("auth.valid_email")}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-phone">{t("auth.mobile")}</Label>
        <Input id="su-phone" type="tel" placeholder={t("auth.mobile_ph")} inputMode="numeric" {...register("phone")} />
        {errors.phone && <p className="text-xs text-destructive">{t("auth.valid_mobile")}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-pw">{t("auth.password")}</Label>
        <div className="relative">
          <Input id="su-pw" type={showPw ? "text" : "password"} placeholder={t("auth.password_ph")} {...register("password")} className="pr-10" />
          <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{t("auth.password_min")}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.signup")}
      </Button>
    </form>
  );
}

function AuthPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [activeTab, setActiveTab] = useState((search as any).tab || "signin");

  // Update tab when URL search params change
  useEffect(() => {
    setActiveTab((search as any).tab || "signin");
  }, [search]);

  // Redirect based on user role and profile status
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "driver") {
        if (!(user as any).isProfileComplete) {
          navigate({ to: "/driver-setup" });
        } else if (user.isApproved) {
          navigate({ to: "/publish" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-lg">Ride<span className="text-gradient">Wave</span></div>
                <div className="text-xs text-muted-foreground">{t("auth.subtitle")}</div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => {
    setActiveTab(value);
    navigate({ to: "/auth", search: { tab: value } });
  }}>
              <TabsList className="w-full mb-6 bg-muted/40">
                <TabsTrigger value="signin" className="flex-1">{t("auth.signin")}</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">{t("auth.signup")}</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <SignInForm />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}