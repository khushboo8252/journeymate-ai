/* Firebase Cloud Messaging service worker — handles background push notifications.
 *
 * NOTE: Service workers cannot read Vite env vars, so the Firebase web config
 * is inlined here. These values are NOT secrets (they ship to the browser
 * anyway). Replace the placeholders with your Firebase web app config.
 */
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyByJI0uCpwRXGanFIQkhcZT1iKCbMsXq1Q",
  authDomain: "ukra-c67be.firebaseapp.com",
  projectId: "ukra-c67be",
  storageBucket: "ukra-c67be.firebasestorage.app",
  messagingSenderId: "993883632335",
  appId: "1:993883632335:web:5cb090ebb14c201ddb3dba",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "RideWave";
  const options = {
    body: payload.notification?.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

// Focus/open the app when a notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.rideId ? `/rides/${data.rideId}/track` : "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
