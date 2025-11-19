// utils/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function createSocket() {
  if (typeof window === "undefined") return null;
  if (socket) return socket;

  // Cambia la URL si usas otra
  socket = io("http://localhost:4000", {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // logs útiles para debug
  socket.on("connect", () => {
    console.log("socket connected:", socket?.id);
  });
  socket.on("disconnect", (reason) => {
    console.log("socket disconnected:", reason);
  });
  socket.on("connect_error", (err) => {
    console.warn("socket connect_error:", err);
  });

  return socket;
}

const s = createSocket();
export default s as Socket;
