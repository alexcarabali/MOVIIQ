"use client";

import "./LoginModal.modules.css";
import { useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext"; // asegúrate que la ruta sea correcta
import { useRouter } from "next/navigation";

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
    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        login(data.user);
        setMensaje("✅ Bienvenid@ " + data.user.nombre);

        setTimeout(() => {
          if (data.tipo === "admin") router.push("/homeAdmin");
          else if (data.tipo === "conductor") router.push("/homeConductor");
          else router.push("/homeUsuario");

          onClose();
        }, 1000);
      } else {
        setMensaje("❌ " + data.message);
      }
    } catch (error) {
      console.error(error);
      setMensaje("⚠️ Error en el servidor.");
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
