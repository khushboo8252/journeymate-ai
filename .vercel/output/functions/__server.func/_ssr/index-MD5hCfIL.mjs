import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { H as Header, B as Button, F as Footer } from "./Footer-BWtQXp58.mjs";
import { I as Input } from "./input-Cyw76J80.mjs";
import "../_libs/sonner.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import { w as Sparkles, o as Users, A as ArrowRight, M as MapPin, q as Calendar, S as Search, I as IndianRupee, s as ShieldCheck, x as Leaf } from "../_libs/lucide-react.mjs";
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
import "./router-G4FGI3qd.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/zod.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
function AnimatedBackground() {
  const particles = Array.from({ length: 22 });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none absolute inset-0 overflow-hidden -z-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "svg",
      {
        className: "absolute inset-0 h-full w-full opacity-[0.18]",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "pattern",
              {
                id: "ai-grid",
                width: "48",
                height: "48",
                patternUnits: "userSpaceOnUse",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    d: "M 48 0 L 0 0 0 48",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "0.5",
                    className: "text-primary"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("radialGradient", { id: "ai-grid-mask", cx: "50%", cy: "40%", r: "60%", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "white", stopOpacity: "1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "white", stopOpacity: "0" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("mask", { id: "ai-grid-fade", children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "100%", height: "100%", fill: "url(#ai-grid-mask)" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              width: "100%",
              height: "100%",
              fill: "url(#ai-grid)",
              mask: "url(#ai-grid-fade)"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        "aria-hidden": true,
        initial: { opacity: 0.5, x: -40, y: -20 },
        animate: { opacity: [0.4, 0.7, 0.4], x: [-40, 30, -40], y: [-20, 20, -20] },
        transition: { duration: 14, repeat: Infinity, ease: "easeInOut" },
        className: "absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full blur-3xl",
        style: { background: "radial-gradient(circle, oklch(0.58 0.18 255 / 0.35), transparent 70%)" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        "aria-hidden": true,
        initial: { opacity: 0.4, x: 30, y: 30 },
        animate: { opacity: [0.3, 0.6, 0.3], x: [30, -40, 30], y: [30, -10, 30] },
        transition: { duration: 18, repeat: Infinity, ease: "easeInOut" },
        className: "absolute -bottom-32 -right-24 h-[32rem] w-[32rem] rounded-full blur-3xl",
        style: { background: "radial-gradient(circle, oklch(0.7 0.13 235 / 0.32), transparent 70%)" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        "aria-hidden": true,
        initial: { opacity: 0.3 },
        animate: { opacity: [0.25, 0.5, 0.25], scale: [1, 1.1, 1] },
        transition: { duration: 10, repeat: Infinity, ease: "easeInOut" },
        className: "absolute top-1/3 left-1/2 -translate-x-1/2 h-[20rem] w-[20rem] rounded-full blur-3xl",
        style: { background: "radial-gradient(circle, oklch(0.72 0.14 200 / 0.25), transparent 70%)" }
      }
    ),
    particles.map((_, i) => {
      const left = i * 53 % 100;
      const delay = i % 7 * 0.8;
      const duration = 8 + i % 5 * 2;
      const size = 2 + i % 3;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.span,
        {
          "aria-hidden": true,
          initial: { y: "110%", opacity: 0 },
          animate: { y: "-10%", opacity: [0, 1, 1, 0] },
          transition: { duration, delay, repeat: Infinity, ease: "linear" },
          className: "absolute rounded-full bg-primary/60",
          style: {
            left: `${left}%`,
            width: size,
            height: size,
            boxShadow: "0 0 8px 1px oklch(0.58 0.18 255 / 0.6)"
          }
        },
        i
      );
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        "aria-hidden": true,
        initial: { x: "-100%" },
        animate: { x: "100%" },
        transition: { duration: 7, repeat: Infinity, ease: "linear" },
        className: "absolute top-0 h-full w-1/3",
        style: {
          background: "linear-gradient(90deg, transparent, oklch(0.58 0.18 255 / 0.08), transparent)"
        }
      }
    )
  ] });
}
const heroVideo = "/assets/5379992-uhd_3840_2160_24fps-BUm2f18Y.mp4";
function Home() {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const [from, setFrom] = reactExports.useState("");
  const [to, setTo] = reactExports.useState("");
  const [date, setDate] = reactExports.useState("");
  const handleSearch = () => {
    navigate({
      to: "/search",
      search: {
        from: from || void 0,
        to: to || void 0,
        date: date || void 0
      }
    });
  };
  const features = [{
    key: "price",
    icon: IndianRupee
  }, {
    key: "trust",
    icon: ShieldCheck
  }, {
    key: "ai",
    icon: Sparkles
  }, {
    key: "eco",
    icon: Leaf
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex-1 relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatedBackground, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 -z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: heroVideo, autoPlay: true, loop: true, muted: true, playsInline: true, className: "h-full w-full object-cover" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-background/5 via-background/10 to-background/30" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 md:px-6 pt-20 pb-16 md:pt-32 md:pb-24", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
            opacity: 0,
            y: 20
          }, animate: {
            opacity: 1,
            y: 0
          }, transition: {
            duration: 0.6
          }, className: "max-w-3xl mx-auto text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium mb-6 animate-glow-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 text-accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shimmer-text", children: t("hero.badge") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight", children: [
              t("hero.title_a"),
              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient", children: t("hero.title_b") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed", children: t("hero.subtitle") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-col sm:flex-row gap-3 justify-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "lg", className: "w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity shadow-[var(--shadow-glow)] font-semibold text-base h-12 px-8", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5 mr-2" }),
                "Become a Driver"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "lg", variant: "outline", className: "w-full sm:w-auto font-semibold text-base h-12 px-8 border-primary/40 hover:border-primary/70 hover:bg-primary/10 transition-all", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5 mr-2" }),
                "Start Your Journey"
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
            opacity: 0,
            y: 30
          }, animate: {
            opacity: 1,
            y: 0
          }, transition: {
            duration: 0.6,
            delay: 0.2
          }, className: "mt-12 max-w-5xl mx-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass rounded-2xl p-3 md:p-4 shadow-[var(--shadow-elegant)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SearchField, { icon: MapPin, label: t("search.from"), placeholder: t("search.from_ph"), value: from, onChange: setFrom, className: "md:col-span-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SearchField, { icon: MapPin, label: t("search.to"), placeholder: t("search.to_ph"), value: to, onChange: setTo, className: "md:col-span-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SearchField, { icon: Calendar, label: t("search.date"), placeholder: "DD / MM", type: "date", value: date, onChange: setDate, className: "md:col-span-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSearch, className: "w-full h-full min-h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/40 font-semibold", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 mr-2" }),
                t("search.button")
              ] }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto", children: [{
              v: "2M+",
              l: "Travelers"
            }, {
              v: "50K+",
              l: "Daily rides"
            }, {
              v: "4.8★",
              l: "Avg rating"
            }].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl md:text-3xl font-bold text-gradient", children: s.v }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs md:text-sm text-muted-foreground mt-1", children: s.l })
            ] }, s.l)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "container mx-auto px-4 md:px-6 py-24", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-2xl mx-auto mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-bold", children: t("features.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-muted-foreground text-lg", children: t("features.subtitle") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5", children: features.map((f, i) => {
          const Icon = f.icon;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
            opacity: 0,
            y: 20
          }, whileInView: {
            opacity: 1,
            y: 0
          }, viewport: {
            once: true
          }, transition: {
            duration: 0.5,
            delay: i * 0.1
          }, whileHover: {
            y: -6
          }, className: "group relative rounded-2xl glass p-6 hover:border-primary/40 transition-all duration-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border/40 mb-4 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-2", children: t(`features.items.${f.key}.title`) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: t(`features.items.${f.key}.desc`) })
          ] }, f.key);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "container mx-auto px-4 md:px-6 py-24", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center max-w-2xl mx-auto mb-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl md:text-5xl font-bold", children: t("how.title") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" }),
          [1, 2, 3].map((n, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
            opacity: 0,
            y: 20
          }, whileInView: {
            opacity: 1,
            y: 0
          }, viewport: {
            once: true
          }, transition: {
            duration: 0.5,
            delay: i * 0.15
          }, className: "relative text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative inline-flex h-24 w-24 items-center justify-center rounded-full glass mb-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 animate-glow-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-bold text-gradient relative", children: n })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold mb-2", children: t(`how.s${n}.title`) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-xs mx-auto", children: t(`how.s${n}.desc`) })
          ] }, n))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "container mx-auto px-4 md:px-6 py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: {
        opacity: 0,
        scale: 0.95
      }, whileInView: {
        opacity: 1,
        scale: 1
      }, viewport: {
        once: true
      }, transition: {
        duration: 0.6
      }, className: "relative overflow-hidden rounded-3xl glass p-10 md:p-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl animate-glow-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/30 blur-3xl animate-glow-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-10 w-10 text-primary mx-auto mb-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-5xl font-bold", children: t("cta.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-lg text-muted-foreground max-w-xl mx-auto", children: t("cta.subtitle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "inline-block mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "lg", className: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity shadow-[var(--shadow-glow)] font-semibold text-base h-12 px-8", children: [
            t("cta.button"),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5 ml-2" })
          ] }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
function SearchField({
  icon: Icon,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  className = ""
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative rounded-xl bg-background/60 border border-border/40 px-4 py-2 hover:border-primary/40 transition-colors ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3 w-3" }),
      label
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type, placeholder, value, onChange: (e) => onChange(e.target.value), className: "border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60" })
  ] });
}
export {
  Home as component
};
