import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { c as createRouter, u as useRouter, a as createRootRoute, b as createFileRoute, l as lazyRouteComponent, H as HeadContent, S as Scripts, O as Outlet, L as Link } from "../_libs/tanstack__react-router.mjs";
import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { T as Toaster$1 } from "../_libs/sonner.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
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
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const BASE_URL = "https://ukyro-backend.onrender.com";
function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("rw_token") : null;
}
function setToken(token) {
  localStorage.setItem("rw_token", token);
}
function removeToken() {
  localStorage.removeItem("rw_token");
}
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}
const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: body ? JSON.stringify(body) : void 0 }),
  delete: (path) => request(path, { method: "DELETE" })
};
const AuthContext = reactExports.createContext({
  user: null,
  loading: true,
  setUser: () => {
  },
  signOut: () => {
  }
});
function AuthProvider({ children }) {
  const [user, setUser] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("rw_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/api/auth/me").then(({ user: user2 }) => setUser(user2)).catch(() => removeToken()).finally(() => setLoading(false));
  }, []);
  const signOut = () => {
    removeToken();
    setUser(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthContext.Provider, { value: { user, loading, setUser, signOut }, children });
}
function useAuth() {
  return reactExports.useContext(AuthContext);
}
const appCss = "/assets/styles-C8a837Yk.css";
const queryClient = new QueryClient();
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
const Route$a = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ukyro — AI carpooling across India" },
      { name: "description", content: "Find affordable, trusted carpool rides across India. AI-powered matching, verified drivers, and transparent prices." },
      { name: "author", content: "Ukyro" },
      { property: "og:title", content: "Ukyro — AI carpooling across India" },
      { property: "og:description", content: "Find affordable, trusted carpool rides across India. AI-powered matching, verified drivers, and transparent prices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Ukyro — AI carpooling across India" },
      { name: "twitter:description", content: "Find affordable, trusted carpool rides across India. AI-powered matching, verified drivers, and transparent prices." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ac3911e9-447f-472a-a210-cf55e0bc111e/id-preview-30be2874--5aebb87d-d3b8-449f-9368-c57312a6a3d4.lovable.app-1780659251042.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ac3911e9-447f-472a-a210-cf55e0bc111e/id-preview-30be2874--5aebb87d-d3b8-449f-9368-c57312a6a3d4.lovable.app-1780659251042.png" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { richColors: true, position: "top-right" })
  ] }) });
}
const $$splitComponentImporter$9 = () => import("./search-B2LpnYws.mjs");
const Route$9 = createFileRoute("/search")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./publish-CWEncGxS.mjs");
const Route$8 = createFileRoute("/publish")({
  head: () => ({
    meta: [{
      title: "Publish a ride — Ukyro"
    }, {
      name: "description",
      content: "Offer a seat in your car and travel for less."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
objectType({
  origin: stringType().min(2),
  destination: stringType().min(2),
  date: stringType().min(1),
  time: stringType().min(1),
  arrivalTime: stringType().optional(),
  vehicleSeats: stringType().min(1),
  price: stringType().refine((v) => Number(v) > 0),
  description: stringType().optional()
});
const $$splitComponentImporter$7 = () => import("./driver-setup-BLaB4UaN.mjs");
const Route$7 = createFileRoute("/driver-setup")({
  head: () => ({
    meta: [{
      title: "Driver Setup — Ukyro"
    }, {
      name: "description",
      content: "Complete your driver profile to start publishing rides."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
objectType({
  fullName: stringType().min(2),
  phone: stringType().min(10),
  vehicleNumber: stringType().min(1),
  vehicleSeats: stringType().min(1),
  bankAccountNumber: stringType().min(9).max(18).regex(/^\d+$/),
  ifscCode: stringType().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/)
});
const $$splitComponentImporter$6 = () => import("./dashboard-k64qrvML.mjs");
const Route$6 = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{
      title: "Dashboard — Ukyro"
    }, {
      name: "description",
      content: "Manage your rides and bookings."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./auth-D9hBYiEO.mjs");
const Route$5 = createFileRoute("/auth")({
  head: () => ({
    meta: [{
      title: "Sign in — Ukyro"
    }, {
      name: "description",
      content: "Sign in or create your Ukyro account."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
objectType({
  email: stringType().email(),
  password: stringType().min(6)
});
objectType({
  fullName: stringType().min(2),
  email: stringType().email(),
  phone: stringType().min(10),
  password: stringType().min(6),
  role: enumType(["driver", "passenger"])
});
const $$splitComponentImporter$4 = () => import("./about-CzSiWj9I.mjs");
const Route$4 = createFileRoute("/about")({
  head: () => ({
    meta: [{
      title: "About — Ukyro"
    }, {
      name: "description",
      content: "Why we're building India's smartest carpool network."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./index-MD5hCfIL.mjs");
const Route$3 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./rides._rideId-yLPUAYF7.mjs");
const Route$2 = createFileRoute("/rides/$rideId")({
  head: () => ({
    meta: [{
      title: "Ride details — Ukyro"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./admin.login-CP-RDbIk.mjs");
const Route$1 = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{
      title: "Admin Login — Ukyro"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./admin.dashboard-CpX3YU8R.mjs");
const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{
      title: "Admin Dashboard — Ukyro"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SearchRoute = Route$9.update({
  id: "/search",
  path: "/search",
  getParentRoute: () => Route$a
});
const PublishRoute = Route$8.update({
  id: "/publish",
  path: "/publish",
  getParentRoute: () => Route$a
});
const DriverSetupRoute = Route$7.update({
  id: "/driver-setup",
  path: "/driver-setup",
  getParentRoute: () => Route$a
});
const DashboardRoute = Route$6.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$a
});
const AuthRoute = Route$5.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$a
});
const AboutRoute = Route$4.update({
  id: "/about",
  path: "/about",
  getParentRoute: () => Route$a
});
const IndexRoute = Route$3.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$a
});
const RidesRideIdRoute = Route$2.update({
  id: "/rides/$rideId",
  path: "/rides/$rideId",
  getParentRoute: () => Route$a
});
const AdminLoginRoute = Route$1.update({
  id: "/admin/login",
  path: "/admin/login",
  getParentRoute: () => Route$a
});
const AdminDashboardRoute = Route.update({
  id: "/admin/dashboard",
  path: "/admin/dashboard",
  getParentRoute: () => Route$a
});
const rootRouteChildren = {
  IndexRoute,
  AboutRoute,
  AuthRoute,
  DashboardRoute,
  DriverSetupRoute,
  PublishRoute,
  SearchRoute,
  AdminDashboardRoute,
  AdminLoginRoute,
  RidesRideIdRoute
};
const routeTree = Route$a._addFileChildren(rootRouteChildren)._addFileTypes();
function DefaultErrorComponent({ error, reset }) {
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        className: "h-8 w-8 text-destructive",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "An unexpected error occurred. Please try again." }),
    false,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$2 as R,
  api as a,
  router as r,
  setToken as s,
  useAuth as u
};
