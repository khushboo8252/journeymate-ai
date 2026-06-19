const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("rw_token") : null;
}

export function setToken(token: string) {
  localStorage.setItem("rw_token", token);
}

export function removeToken() {
  localStorage.removeItem("rw_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  const res = await fetch(`${BASE_URL}${path}`, { 
    ...options, 
    headers,
    signal: controller.signal 
  });
  
  clearTimeout(timeoutId);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export interface ApiUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: "driver" | "passenger";
  vehicleSeats: number | null;
  isProfileComplete: boolean;
  isApproved?: boolean;
  rejectionReason?: string | null;
  hasSeenApprovalNotification?: boolean;
  createdAt: string;
  updatedAt?: string;
  rideCancellationCount?: number;
}

export interface ApiRide {
  _id: string;
  driverId: ApiUser | string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string | null;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  description: string | null;
  vehicleType?: "hatchback" | "sedan" | "suv" | "mpv" | "van";
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  // Live location tracking fields
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null;
  locationHistory?: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
  isTrackingLocation?: boolean;
  // Ride completion confirmation fields
  confirmByDriver?: boolean;
  confirmByPassenger?: boolean;
  completedAt?: string | null;
}

export interface ApiBooking {
  _id: string;
  rideId: ApiRide | string;
  passengerId: ApiUser | string;
  seats: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
}
