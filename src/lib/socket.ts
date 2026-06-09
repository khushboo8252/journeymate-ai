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

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
