// utils/socket.ts
import { io } from "socket.io-client";

// Evita múltiples sockets durante el Fast Refresh de Next.js
let socket: any;

if (!socket) {
  socket = io("http://localhost:4000", {
    autoConnect: true,
    transports: ["websocket"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}

export default socket;
