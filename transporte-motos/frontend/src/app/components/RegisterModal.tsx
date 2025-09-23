"use client";

import "./RegisterModal.modules.css";
import { useState } from "react";

export default function RegisterModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });

      const data = await res.json();
      if (data.success) {
        setMensaje("✅ Registro exitoso. Ahora puedes iniciar sesión.");
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
        <section className="section-registro">
          <button className="close-btn" onClick={onClose}>
            X
          </button>
          <div className="msj-estado">{mensaje && <p>{mensaje}</p>}</div>
          <h2>Crear cuenta</h2>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn-registrarse" type="submit">
              Registrarse
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
