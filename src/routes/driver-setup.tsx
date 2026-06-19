import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Camera, Car, CheckCircle2, CreditCard, Loader2, Lock, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
      { title: "Driver Setup — Ukyro" },
      { name: "description", content: "Complete your driver profile to start publishing rides." },
    ],
  }),
  component: DriverSetupPage,
});

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  vehicleNumber: z.string().min(1),
  vehicleSeats: z.string().min(1),
  bankAccountNumber: z
    .string()
    .min(9)
    .max(18)
    .regex(/^\d+$/),
  ifscCode: z
    .string()
    .regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/),
});

type FormValues = z.infer<typeof schema>;

function DriverSetupPage() {
  const { t } = useTranslation();
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  // Document upload states
  const [drivingLicenseFront, setDrivingLicenseFront] = useState<File | null>(null);
  const [drivingLicenseBack, setDrivingLicenseBack] = useState<File | null>(null);
  const [aadharCardFront, setAadharCardFront] = useState<File | null>(null);
  const [aadharCardBack, setAadharCardBack] = useState<File | null>(null);
  const [panCardFront, setPanCardFront] = useState<File | null>(null);
  const [rcFront, setRcFront] = useState<File | null>(null);
  const [insurance, setInsurance] = useState<File | null>(null);
  const [pollution, setPollution] = useState<File | null>(null);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

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
    },
  });

  useEffect(() => {
    if (!loading && user) {
      setValue("fullName", user.fullName ?? "");
      setValue("phone", user.phone ?? "");
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

  const compressImage = async (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
      };
    });
  };

  const handleDocumentUpload = async (file: File, type: string, side: string = "front") => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Document must be under 5MB");
      return;
    }

    try {
      setUploadingDoc(`${type}-${side}`);
      
      // Compress image before upload
      const compressedFile = await compressImage(file, 1200, 0.7);
      
      const formData = new FormData();
      formData.append("document", compressedFile);
      formData.append("type", type);
      if (side) formData.append("side", side);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/document`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("rw_token")}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");

      return { url: data.url, publicId: data.publicId };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setUploadingDoc(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      // Upload all documents
      const [
        dlFront,
        dlBack,
        aadharFront,
        aadharBack,
        pan,
        rcFrontDoc,
        insuranceDoc,
        pollutionDoc,
        vehicleImg,
      ] = await Promise.all([
        drivingLicenseFront ? handleDocumentUpload(drivingLicenseFront, "drivingLicense", "front") : Promise.resolve(null),
        drivingLicenseBack ? handleDocumentUpload(drivingLicenseBack, "drivingLicense", "back") : Promise.resolve(null),
        aadharCardFront ? handleDocumentUpload(aadharCardFront, "aadharCard", "front") : Promise.resolve(null),
        aadharCardBack ? handleDocumentUpload(aadharCardBack, "aadharCard", "back") : Promise.resolve(null),
        panCardFront ? handleDocumentUpload(panCardFront, "panCard", "front") : Promise.resolve(null),
        rcFront ? handleDocumentUpload(rcFront, "rc", "front") : Promise.resolve(null),
        insurance ? handleDocumentUpload(insurance, "insurance", "front") : Promise.resolve(null),
        pollution ? handleDocumentUpload(pollution, "pollution", "front") : Promise.resolve(null),
        vehicleImage ? handleDocumentUpload(vehicleImage, "vehicleImage", "front") : Promise.resolve(null),
      ]);

      // Build document objects
      const drivingLicense = {
        frontUrl: dlFront?.url || null,
        frontPublicId: dlFront?.publicId || null,
        backUrl: dlBack?.url || null,
        backPublicId: dlBack?.publicId || null,
      };

      const aadharCard = {
        frontUrl: aadharFront?.url || null,
        frontPublicId: aadharFront?.publicId || null,
        backUrl: aadharBack?.url || null,
        backPublicId: aadharBack?.publicId || null,
      };

      const panCard = {
        frontUrl: pan?.url || null,
        frontPublicId: pan?.publicId || null,
      };

      const rc = {
        frontUrl: rcFrontDoc?.url || null,
        frontPublicId: rcFrontDoc?.publicId || null,
      };

      const insuranceData = {
        url: insuranceDoc?.url || null,
        publicId: insuranceDoc?.publicId || null,
      };

      const pollutionData = {
        url: pollutionDoc?.url || null,
        publicId: pollutionDoc?.publicId || null,
      };

      const vehicleImageData = {
        url: vehicleImg?.url || null,
        publicId: vehicleImg?.publicId || null,
      };

      const payload: any = {
        fullName: values.fullName,
        phone: values.phone,
        vehicleNumber: values.vehicleNumber,
        vehicleSeats: values.vehicleSeats,
        bankAccountNumber: values.bankAccountNumber,
        ifscCode: values.ifscCode.toUpperCase(),
      };

      if (avatarBase64) payload.avatarUrl = avatarBase64;
      if (drivingLicenseFront || drivingLicenseBack) payload.drivingLicense = drivingLicense;
      if (aadharCardFront || aadharCardBack) payload.aadharCard = aadharCard;
      if (panCardFront) payload.panCard = panCard;
      if (rcFront) payload.rc = rc;
      if (insurance) payload.insurance = insuranceData;
      if (pollution) payload.pollution = pollutionData;
      if (vehicleImage) payload.vehicleImage = vehicleImageData;

      const data = await api.put<{ status: string; user: ApiUser; requiresApproval: boolean }>("/api/profile/driver", payload);
      setUser(data.user);

      if (data.requiresApproval) {
        toast.success(t("driver_setup.success"));
        navigate({ to: "/dashboard" });
      } else {
        toast.success(t("driver_setup.success_no_approval"));
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("driver_setup.error"));
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
            <h2 className="text-2xl font-bold mb-2">{t("driver_setup.sign_in_required")}</h2>
            <p className="text-muted-foreground mb-6">{t("driver_setup.sign_in_desc")}</p>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full">
                {t("driver_setup.sign_in")}
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
                <p className="text-sm font-medium text-green-600 dark:text-green-400">{t("dashboard.profile_complete")}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.profile_complete_desc")}</p>
              </div>
              <Link to="/dashboard">
                <Button size="sm" variant="outline" className="shrink-0 border-green-500/40 text-green-600 hover:bg-green-500/10">
                  {t("dashboard.go_to_dashboard")}
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
              <h1 className="text-2xl font-bold">{t("driver_setup.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("driver_setup.subtitle")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* ── SECTION 1: Personal details ───────────────────────────── */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {t("driver_setup.personal")}
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
                  <Label>{t("driver_setup.full_name")}</Label>
                  <Input placeholder="Rahul Sharma" {...register("fullName")} />
                  {errors.fullName && <p className="text-xs text-destructive">{t("auth.name_min")}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />{t("driver_setup.phone")}
                  </Label>
                  <Input placeholder="+91 98765 43210" type="tel" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive">{t("auth.valid_mobile")}</p>}
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Vehicle details ────────────────────────────── */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                {t("driver_setup.vehicle")}
              </h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("driver_setup.vehicle_seats")}</Label>
                  <Select
                    defaultValue="5"
                    onValueChange={v => setValue("vehicleSeats", v)}
                  >
                    <SelectTrigger className="bg-background/60 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} seat{n > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vehicleSeats && <p className="text-xs text-destructive">{t("driver_setup.vehicle_seats")}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("driver_setup.vehicle_number")}</Label>
                <Input placeholder="MH 01 AB 1234" {...register("vehicleNumber")} />
                {errors.vehicleNumber && <p className="text-xs text-destructive">{t("driver_setup.vehicle_number")}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("driver_setup.vehicle_image")}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVehicleImage(e.target.files?.[0] || null)}
                />
                {uploadingDoc === "vehicleImage-front" && <p className="text-xs text-muted-foreground">{t("driver_setup.uploading")}</p>}
              </div>
            </div>

            {/* ── SECTION 3: Bank details ───────────────────────────────── */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {t("driver_setup.banking")}
                <span className="ml-auto text-xs font-normal text-muted-foreground">Encrypted &amp; secure</span>
              </h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t("driver_setup.bank_account")}</Label>
                  <Input
                    placeholder="Enter your account number"
                    type="text"
                    inputMode="numeric"
                    {...register("bankAccountNumber")}
                  />
                  {errors.bankAccountNumber && (
                    <p className="text-xs text-destructive">{t("driver_setup.bank_account")}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>{t("driver_setup.ifsc")}</Label>
                  <Input
                    placeholder="SBIN0001234"
                    className="uppercase"
                    {...register("ifscCode")}
                    onChange={e => {
                      e.target.value = e.target.value.toUpperCase();
                      register("ifscCode").onChange(e);
                    }}
                  />
                  {errors.ifscCode && <p className="text-xs text-destructive">{t("driver_setup.ifsc")}</p>}
                  <p className="text-xs text-muted-foreground">11-character code on your cheque book</p>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: Verification documents ─────────────────────── */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                {t("driver_setup.documents")}
                <span className="ml-auto text-xs font-normal text-muted-foreground">Required for approval</span>
              </h2>
              <Separator />
              
              {/* Driving License */}
              <div className="space-y-3">
                <Label className="font-medium">{t("driver_setup.driving_license")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Front side</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDrivingLicenseFront(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                    {uploadingDoc === "drivingLicense-front" && <p className="text-xs text-muted-foreground mt-1">{t("driver_setup.uploading")}</p>}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Back side</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDrivingLicenseBack(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                    {uploadingDoc === "drivingLicense-back" && <p className="text-xs text-muted-foreground mt-1">{t("driver_setup.uploading")}</p>}
                  </div>
                </div>
              </div>

              {/* Aadhar Card */}
              <div className="space-y-3">
                <Label className="font-medium">{t("driver_setup.aadhar")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Front side</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAadharCardFront(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                    {uploadingDoc === "aadharCard-front" && <p className="text-xs text-muted-foreground mt-1">{t("driver_setup.uploading")}</p>}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Back side</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAadharCardBack(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                    {uploadingDoc === "aadharCard-back" && <p className="text-xs text-muted-foreground mt-1">{t("driver_setup.uploading")}</p>}
                  </div>
                </div>
              </div>

              {/* PAN Card */}
              <div className="space-y-3">
                <Label className="font-medium">{t("driver_setup.pan")}</Label>
                <div>
                  <Label className="text-xs text-muted-foreground">Front side</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPanCardFront(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {uploadingDoc === "panCard-front" && <p className="text-xs text-muted-foreground mt-1">{t("driver_setup.uploading")}</p>}
                </div>
              </div>

              {/* RC */}
              <div className="space-y-3">
                <Label className="font-medium">{t("driver_setup.rc")}</Label>
                <div>
                  <Label className="text-xs text-muted-foreground">Front side</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setRcFront(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {uploadingDoc === "rc-front" && <p className="text-xs text-muted-foreground mt-1">{t("driver_setup.uploading")}</p>}
                </div>
              </div>

              {/* Insurance */}
              <div className="space-y-3">
                <Label className="font-medium">Insurance Certificate</Label>
                <div>
                  <Label className="text-xs text-muted-foreground">Upload insurance document</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setInsurance(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {uploadingDoc === "insurance-front" && <p className="text-xs text-muted-foreground mt-1">{t("driver_setup.uploading")}</p>}
                </div>
              </div>

              {/* Pollution */}
              <div className="space-y-3">
                <Label className="font-medium">Pollution Certificate</Label>
                <div>
                  <Label className="text-xs text-muted-foreground">Upload pollution certificate</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPollution(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {uploadingDoc === "pollution-front" && <p className="text-xs text-muted-foreground mt-1">{t("driver_setup.uploading")}</p>}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold h-12 text-base"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t("driver_setup.save")}
            </Button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
