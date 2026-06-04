import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from "firebase/messaging";
import { api } from "@/lib/api";

/**
 * Firebase Cloud Messaging (FCM) setup for web push notifications.
 *
 * Config is read from Vite env vars (VITE_FIREBASE_*). If they are missing,
 * FCM silently no-ops so the app still works without notifications configured.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (!isConfigured) return null;
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

/**
 * Request notification permission, retrieve the FCM token, and register it
 * with the backend so the user can receive push notifications.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    console.log("[FCM] Starting registration...");
    console.log("[FCM] Config:", { apiKey: firebaseConfig.apiKey?.substring(0, 10) + "...", projectId: firebaseConfig.projectId });
    console.log("[FCM] VAPID Key:", VAPID_KEY ? VAPID_KEY.substring(0, 10) + "..." : "MISSING");

    if (!isConfigured) {
      console.warn("[FCM] Not configured — skipping push registration");
      return null;
    }
    if (typeof window === "undefined" || !(await isSupported())) {
      console.warn("[FCM] Messaging not supported in this browser");
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log("[FCM] Permission:", permission);
    if (permission !== "granted") {
      console.warn("[FCM] Notification permission not granted");
      return null;
    }

    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;

    messaging = getMessaging(firebaseApp);

    // The service worker must be registered for background messages
    const swRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    }).catch((err) => {
      console.error("[FCM] getToken failed:", err);
      console.error("[FCM] Full error:", JSON.stringify(err, null, 2));
      return null;
    });

    console.log("[FCM] Token:", token ? token.substring(0, 20) + "..." : "NULL");

    if (token) {
      await api.post("/api/profile/fcm-token", { token });
      // Persist locally so we can unregister it on logout
      localStorage.setItem("rw_fcm_token", token);
      console.log("[FCM] Token registered successfully");
    } else {
      console.warn("[FCM] No token received - notifications will not work");
    }

    return token || null;
  } catch (err) {
    console.error("[FCM] registration error:", err);
    return null;
  }
}

/**
 * Unregister the current device token (call on logout).
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const token = localStorage.getItem("rw_fcm_token");
    if (token) {
      await api.delete("/api/profile/fcm-token", { token }).catch(() => {});
      localStorage.removeItem("rw_fcm_token");
    }
  } catch {
    /* ignore */
  }
}

/**
 * Subscribe to foreground messages (when the app/tab is open).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
): () => void {
  if (!isConfigured || !messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data as Record<string, string> | undefined,
    });
  });
}

export const fcmConfigured = isConfigured;
