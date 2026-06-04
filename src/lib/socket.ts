import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });
  }
  return socket;
};

export const joinUserRoom = (userId: string) => {
  const socket = getSocket();
  socket.emit("join_user", userId);
};

export const joinDriverRoom = (driverId: string) => {
  const socket = getSocket();
  socket.emit("join_driver", driverId);
};

export const joinRideRoom = (rideId: string) => {
  const socket = getSocket();
  socket.emit("join_ride", rideId);
};

export const leaveRideRoom = (rideId: string) => {
  const socket = getSocket();
  socket.emit("leave_ride", rideId);
};

export interface DriverLocation {
  rideId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number | null;
  updatedAt: string;
}

/** Driver emits their current GPS position to the ride room. */
export const emitLocation = (payload: {
  rideId: string;
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number | null;
}) => {
  const socket = getSocket();
  socket.emit("location_update", payload);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
