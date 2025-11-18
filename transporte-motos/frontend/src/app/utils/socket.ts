// utils/socket.ts
import { io } from "socket.io-client";

// Evitar múltiples conexiones en Fast Refresh de Next.js
const socket = io("http://localhost:4000", {
  autoConnect: true,
  transports: ["websocket"],
});

export default socket;
