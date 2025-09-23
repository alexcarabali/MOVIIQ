// app/components/LoginModal.tsx
"use client";

import "./login.css";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Cerrar modal con la tecla Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        login(data.token); // actualiza el estado global de auth
        setMensaje("Bienvenido 🚀");
        onClose(); // cierra el modal automáticamente
      } else {
        setMensaje(data.error || "Error en el login");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} // cerrar al dar click afuera
    >
      <div
        className="bg-white p-6 rounded-lg"
        onClick={(e) => e.stopPropagation()} // evita que cierre al clickear dentro
      >
        <section className="section-login">
          <h2 className="text-2xl font-bold mb-4">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <h3>Correo Electrónico</h3>
            <input
              type="email"
              placeholder="Escribe tu correo electrónico"
              className="w-full p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <h3>Contraseña</h3>
            <input
              type="password"
              placeholder="Escribe tu contraseña"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <a href="/">¿Olvidaste tu contraseña?</a>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              Ingresar
            </button>
            <h4>¿No tienes una cuenta?</h4>
            <a className="a-registro" href="/register">
              Registrarse
            </a>
          </form>
          {mensaje && <p className="mt-3 text-center">{mensaje}</p>}
        </section>
      </div>
    </div>
  );
}
