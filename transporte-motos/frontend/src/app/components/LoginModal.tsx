"use client";

import "./LoginModal.modules.css";
import { useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext"; // ajusta la ruta si es necesario
import { useRouter } from "next/navigation";
import socket from "../utils/socket"; // opcional: registra conductor en sockets al loguear

export default function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("⏳ Iniciando sesión...");
    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Mensaje de error claro si el backend responde con success=false o status >= 400
        const errMsg = data?.message || "Credenciales inválidas";
        setMensaje("❌ " + errMsg);
        return;
      }

      if (data.success) {
        // Guardar en contexto (si tienes uno)
        try {
          login(data.user);
        } catch {
          // Si useAuth no existe o falla, no rompemos todo: seguimos con localStorage
          console.warn("useAuth login falló o no está disponible.");
        }

        // Determinar ID real del usuario (soporta varias propiedades)
        const id =
          data.user?.id_usuario ??
          data.user?.id_conductor ??
          data.user?.id ??
          null;

        // Guardar información necesaria en localStorage para otras pantallas
        if (id != null) {
          localStorage.setItem("userId", String(id));
        }
        if (data.tipo) {
          localStorage.setItem("tipo", data.tipo);
        }
        // Guardar objeto completo por si otras pantallas lo requieren
        try {
          localStorage.setItem("usuario", JSON.stringify(data.user));
        } catch {
          // no bloquear si falla stringify
        }

        // Si es conductor guardamos también en key 'conductor' por compatibilidad
        if (data.tipo === "conductor") {
          try {
            localStorage.setItem("conductor", JSON.stringify(data.user));
          } catch {}
          // Registrar conductor en socket (si existe instancia)
          try {
            const idConductor = id;
            if (idConductor) {
              socket.emit("registrar_usuario", {
                id: idConductor,
                rol: "conductor",
              });
              console.log(
                "Socket: conductor registrado al loguear",
                idConductor
              );
            }
          } catch (err) {
            // si no existe socket o falla, no detener flujo
            console.warn("No se pudo registrar socket conductor:", err);
          }
        }

        // Mensaje de bienvenida y redirección según tipo
        setMensaje("✅ Bienvenid@ " + (data.user?.nombre || ""));
        // Pequeña pausa para que el usuario vea el mensaje (opcional)
        setTimeout(() => {
          try {
            if (data.tipo === "admin") router.push("/homeAdmin");
            else if (data.tipo === "conductor") router.push("/homeConductor");
            else router.push("/homeUsuario");
            onClose();
          } catch (e) {
            console.warn("Error al redirigir:", e);
          }
        }, 300);
      } else {
        // Cuando success=false (pero status 200)
        setMensaje("❌ " + (data.message || "Error al iniciar sesión"));
      }
    } catch (error) {
      console.error("Error en login:", error);
      setMensaje("⚠️ Error en el servidor. Intenta nuevamente.");
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <section className="section-login">
          <button className="close-btn" onClick={onClose}>
            X
          </button>
          <div className="icono-usuario">
            <User size={70}></User>
          </div>
          <div className="msj-estado">{mensaje && <p>{mensaje}</p>}</div>
          <form className="login-form" onSubmit={handleLogin}>
            <h3>Correo Electrónico</h3>
            <input
              type="email"
              placeholder="Escribe tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <h3>Contraseña</h3>
            <input
              type="password"
              placeholder="Escribe tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <a className="recuperar-contraseña" href="/">
              ¿Olvidaste tu contraseña?
            </a>
            <button type="submit">Ingresar</button>

            <div className="registro-container">
              <h4>¿No tienes una cuenta?</h4>
              <a className="a-registro" href="/register">
                Registrarse
              </a>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
