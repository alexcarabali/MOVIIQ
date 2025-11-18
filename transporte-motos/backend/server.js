import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.routes.js";
import viajesRoutes from "./routes/viajes.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import conductoresRoutes from "./routes/conductores.routes.js";
import genericoRoutes from "./routes/generico.routes.js";

import { socketHandler } from "./sockets/index.js";

export const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/viajes", viajesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/conductores", conductoresRoutes);
app.use("/api/generico", genericoRoutes);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket"],
});

socketHandler(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
);
