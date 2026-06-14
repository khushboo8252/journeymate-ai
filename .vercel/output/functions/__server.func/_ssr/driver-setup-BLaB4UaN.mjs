import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useForm } from "../_libs/react-hook-form.mjs";
import { a } from "../_libs/hookform__resolvers.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { H as Header, B as Button, F as Footer, A as Avatar, a as AvatarImage, b as AvatarFallback } from "./Footer-BWtQXp58.mjs";
import { I as Input } from "./input-Cyw76J80.mjs";
import { L as Label } from "./label-DDfja8qX.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-D6x52Ku0.mjs";
import { S as Separator } from "./separator-D2Zokc-g.mjs";
import { u as useAuth, a as api } from "./router-G4FGI3qd.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import { L as Lock, j as CircleCheck, C as Car, U as User, k as Camera, P as Phone, l as CreditCard, a as LoaderCircle } from "../_libs/lucide-react.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/radix-ui__react-separator.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
const schema = objectType({
  fullName: stringType().min(2),
  phone: stringType().min(10),
  vehicleNumber: stringType().min(1),
  vehicleSeats: stringType().min(1),
  bankAccountNumber: stringType().min(9).max(18).regex(/^\d+$/),
  ifscCode: stringType().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/)
});
function DriverSetupPage() {
  const {
    t
  } = useTranslation();
  const {
    user,
    loading,
    setUser
  } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = reactExports.useRef(null);
  const [avatarPreview, setAvatarPreview] = reactExports.useState(null);
  const [avatarBase64, setAvatarBase64] = reactExports.useState(null);
  const [drivingLicenseFront, setDrivingLicenseFront] = reactExports.useState(null);
  const [drivingLicenseBack, setDrivingLicenseBack] = reactExports.useState(null);
  const [aadharCardFront, setAadharCardFront] = reactExports.useState(null);
  const [aadharCardBack, setAadharCardBack] = reactExports.useState(null);
  const [panCardFront, setPanCardFront] = reactExports.useState(null);
  const [rcFront, setRcFront] = reactExports.useState(null);
  const [rcBack, setRcBack] = reactExports.useState(null);
  const [vehicleImage, setVehicleImage] = reactExports.useState(null);
  const [uploadingDoc, setUploadingDoc] = reactExports.useState(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm({
    resolver: a(schema),
    defaultValues: {
      fullName: ""
    }
  });
  reactExports.useEffect(() => {
    if (!loading && user) {
      setValue("fullName", user.fullName ?? "");
      setValue("phone", user.phone ?? "");
      if (user.avatarUrl) setAvatarPreview(user.avatarUrl);
      if (user.role !== "driver") navigate({
        to: "/dashboard"
      });
    }
  }, [user, loading]);
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setAvatarPreview(result);
      setAvatarBase64(result);
    };
    reader.readAsDataURL(file);
  };
  const handleDocumentUpload = async (file, type, side = "front") => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Document must be under 5MB");
      return;
    }
    const formData = new FormData();
    formData.append("document", file);
    formData.append("type", type);
    if (side) formData.append("side", side);
    try {
      setUploadingDoc(`${type}-${side}`);
      const response = await fetch(`${"https://ukyro-backend.onrender.com"}/api/upload/document`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("rw_token")}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      return {
        url: data.url,
        publicId: data.publicId
      };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setUploadingDoc(null);
    }
  };
  const onSubmit = async (values) => {
    try {
      const [dlFront, dlBack, aadharFront, aadharBack, pan, rcFrontDoc, rcBackDoc, vehicleImg] = await Promise.all([drivingLicenseFront ? handleDocumentUpload(drivingLicenseFront, "drivingLicense", "front") : Promise.resolve(null), drivingLicenseBack ? handleDocumentUpload(drivingLicenseBack, "drivingLicense", "back") : Promise.resolve(null), aadharCardFront ? handleDocumentUpload(aadharCardFront, "aadharCard", "front") : Promise.resolve(null), aadharCardBack ? handleDocumentUpload(aadharCardBack, "aadharCard", "back") : Promise.resolve(null), panCardFront ? handleDocumentUpload(panCardFront, "panCard", "front") : Promise.resolve(null), rcFront ? handleDocumentUpload(rcFront, "rc", "front") : Promise.resolve(null), rcBack ? handleDocumentUpload(rcBack, "rc", "back") : Promise.resolve(null), vehicleImage ? handleDocumentUpload(vehicleImage, "vehicleImage", "front") : Promise.resolve(null)]);
      const drivingLicense = {
        frontUrl: dlFront?.url || null,
        frontPublicId: dlFront?.publicId || null,
        backUrl: dlBack?.url || null,
        backPublicId: dlBack?.publicId || null
      };
      const aadharCard = {
        frontUrl: aadharFront?.url || null,
        frontPublicId: aadharFront?.publicId || null,
        backUrl: aadharBack?.url || null,
        backPublicId: aadharBack?.publicId || null
      };
      const panCard = {
        frontUrl: pan?.url || null,
        frontPublicId: pan?.publicId || null
      };
      const rc = {
        frontUrl: rcFrontDoc?.url || null,
        frontPublicId: rcFrontDoc?.publicId || null,
        backUrl: rcBackDoc?.url || null,
        backPublicId: rcBackDoc?.publicId || null
      };
      const vehicleImageData = {
        url: vehicleImg?.url || null,
        publicId: vehicleImg?.publicId || null
      };
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        vehicleNumber: values.vehicleNumber,
        vehicleSeats: values.vehicleSeats,
        bankAccountNumber: values.bankAccountNumber,
        ifscCode: values.ifscCode.toUpperCase()
      };
      if (avatarBase64) payload.avatarUrl = avatarBase64;
      if (drivingLicenseFront || drivingLicenseBack) payload.drivingLicense = drivingLicense;
      if (aadharCardFront || aadharCardBack) payload.aadharCard = aadharCard;
      if (panCardFront) payload.panCard = panCard;
      if (rcFront || rcBack) payload.rc = rc;
      if (vehicleImage) payload.vehicleImage = vehicleImageData;
      const data = await api.put("/api/profile/driver", payload);
      setUser(data.user);
      if (data.requiresApproval) {
        toast.success(t("driver_setup.success"));
        navigate({
          to: "/dashboard"
        });
      } else {
        toast.success(t("driver_setup.success_no_approval"));
        navigate({
          to: "/dashboard"
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("driver_setup.error"));
    }
  };
  if (loading) return null;
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 flex items-center justify-center px-4 py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-10 text-center max-w-sm w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-10 w-10 text-primary mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2", children: t("driver_setup.sign_in_required") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: t("driver_setup.sign_in_desc") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 w-full", children: t("driver_setup.sign_in") }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
    ] });
  }
  const initials = (watch("fullName") || user.fullName || "D").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 container mx-auto px-4 md:px-6 py-12 max-w-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
      opacity: 0,
      y: 20
    }, animate: {
      opacity: 1,
      y: 0
    }, transition: {
      duration: 0.5
    }, children: [
      user.isProfileComplete && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 shrink-0 text-green-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-green-600 dark:text-green-400", children: t("dashboard.profile_complete") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("dashboard.profile_complete_desc") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "shrink-0 border-green-500/40 text-green-600 hover:bg-green-500/10", children: t("dashboard.go_to_dashboard") }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-5 w-5 text-primary-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: t("driver_setup.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("driver_setup.subtitle") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-6 space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4 text-primary" }),
            t("driver_setup.personal")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-20 w-20 border-2 border-primary/30", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: avatarPreview ?? void 0 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "text-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold", children: initials })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), className: "absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-3.5 w-3.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", className: "hidden", onChange: handleImageChange })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Profile photo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "JPG, PNG or WEBP · max 2 MB" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), className: "mt-2 text-xs text-primary hover:underline", children: "Upload photo" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("driver_setup.full_name") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Rahul Sharma", ...register("fullName") }),
              errors.fullName && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: t("auth.name_min") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3.5 w-3.5" }),
                t("driver_setup.phone")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "+91 98765 43210", type: "tel", ...register("phone") }),
              errors.phone && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: t("auth.valid_mobile") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-6 space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Car, { className: "h-4 w-4 text-primary" }),
            t("driver_setup.vehicle")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-1 gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("driver_setup.vehicle_seats") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { defaultValue: "5", onValueChange: (v) => setValue("vehicleSeats", v), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background/60 border-border/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: String(n), children: [
                n,
                " seat",
                n > 1 ? "s" : ""
              ] }, n)) })
            ] }),
            errors.vehicleSeats && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: t("driver_setup.vehicle_seats") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("driver_setup.vehicle_number") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "MH 01 AB 1234", ...register("vehicleNumber") }),
            errors.vehicleNumber && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: t("driver_setup.vehicle_number") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("driver_setup.vehicle_image") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "file", accept: "image/*", onChange: (e) => setVehicleImage(e.target.files?.[0] || null) }),
            uploadingDoc === "vehicleImage-front" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("driver_setup.uploading") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-6 space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-4 w-4 text-primary" }),
            t("driver_setup.banking"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-xs font-normal text-muted-foreground", children: "Encrypted & secure" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("driver_setup.bank_account") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Enter your account number", type: "text", inputMode: "numeric", ...register("bankAccountNumber") }),
              errors.bankAccountNumber && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: t("driver_setup.bank_account") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("driver_setup.ifsc") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "SBIN0001234", className: "uppercase", ...register("ifscCode"), onChange: (e) => {
                e.target.value = e.target.value.toUpperCase();
                register("ifscCode").onChange(e);
              } }),
              errors.ifscCode && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: t("driver_setup.ifsc") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "11-character code on your cheque book" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl p-6 space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-4 w-4 text-primary" }),
            t("driver_setup.documents"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-xs font-normal text-muted-foreground", children: "Required for approval" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "font-medium", children: t("driver_setup.driving_license") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Front side" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "file", accept: "image/*", onChange: (e) => setDrivingLicenseFront(e.target.files?.[0] || null), className: "mt-1" }),
                uploadingDoc === "drivingLicense-front" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("driver_setup.uploading") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Back side" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "file", accept: "image/*", onChange: (e) => setDrivingLicenseBack(e.target.files?.[0] || null), className: "mt-1" }),
                uploadingDoc === "drivingLicense-back" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("driver_setup.uploading") })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "font-medium", children: t("driver_setup.aadhar") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Front side" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "file", accept: "image/*", onChange: (e) => setAadharCardFront(e.target.files?.[0] || null), className: "mt-1" }),
                uploadingDoc === "aadharCard-front" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("driver_setup.uploading") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Back side" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "file", accept: "image/*", onChange: (e) => setAadharCardBack(e.target.files?.[0] || null), className: "mt-1" }),
                uploadingDoc === "aadharCard-back" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("driver_setup.uploading") })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "font-medium", children: t("driver_setup.pan") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Front side" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "file", accept: "image/*", onChange: (e) => setPanCardFront(e.target.files?.[0] || null), className: "mt-1" }),
              uploadingDoc === "panCard-front" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("driver_setup.uploading") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "font-medium", children: t("driver_setup.rc") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Front side" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "file", accept: "image/*", onChange: (e) => setRcFront(e.target.files?.[0] || null), className: "mt-1" }),
                uploadingDoc === "rc-front" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("driver_setup.uploading") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: "Back side" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "file", accept: "image/*", onChange: (e) => setRcBack(e.target.files?.[0] || null), className: "mt-1" }),
                uploadingDoc === "rc-back" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("driver_setup.uploading") })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: isSubmitting, className: "w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 font-semibold h-12 text-base", children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) : t("driver_setup.save") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
export {
  DriverSetupPage as component
};
