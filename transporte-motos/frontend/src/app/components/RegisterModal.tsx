"use client";

import "./RegisterModal.modules.css";
import { useState } from "react";

type TipoRegistro = "usuario" | "conductor" | null;

export default function RegisterModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>(null);
  const [mensaje, setMensaje] = useState("");
  const [step, setStep] = useState(1);

  // Campos comunes
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
  });

  // Campos específicos de conductor
  const [conductorData, setConductorData] = useState({
    cedula: "",
    licencia: "",
    fechaVencimiento: "",
    tipoVehiculo: "Carro" as "Moto" | "Carro",
    marca: "",
    modelo: "",
    placa: "",
  });

  if (!isOpen) return null;

  // Cambios de inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (
      tipoRegistro === "conductor" &&
      Object.keys(conductorData).includes(name)
    ) {
      setConductorData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Avanzar paso con validación
  const nextStep = () => {
    const { nombre, apellido, email, telefono, password } = formData;
    if (!nombre || !apellido || !email || !telefono || !password) {
      setMensaje("⚠️ Completa todos los campos del Paso 1");
      return;
    }
    setMensaje("");
    setStep(2);
  };

  const prevStep = () => {
    setMensaje("");
    setStep(1);
  };

  // Enviar formulario
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación paso 2 conductor
    if (tipoRegistro === "conductor") {
      const {
        cedula,
        licencia,
        fechaVencimiento,
        tipoVehiculo,
        marca,
        modelo,
        placa,
      } = conductorData;

      if (!cedula || !licencia || !fechaVencimiento || !tipoVehiculo) {
        setMensaje("⚠️ Completa todos los campos obligatorios del Paso 2");
        return;
      }
    }

    // Construir endpoint y body
    const endpoint =
      tipoRegistro === "usuario"
        ? "http://localhost:4000/api/usuarios/register"
        : "http://localhost:4000/api/conductores/register";

    const body =
      tipoRegistro === "usuario"
        ? formData
        : {
            ...formData,
            cedula: conductorData.cedula,
            licencia_conduccion: conductorData.licencia,
            fecha_vencimiento_licencia: conductorData.fechaVencimiento,
            tipo: conductorData.tipoVehiculo,
            marca: conductorData.marca || null,
            modelo: conductorData.modelo || null,
            placa: conductorData.placa || null,
          };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setMensaje(
        data.success
          ? "✅ Registro exitoso. Ahora puedes iniciar sesión."
          : "❌ " + data.message
      );
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
            ×
          </button>

          {mensaje && <div className="msj-estado">{mensaje}</div>}

          {!tipoRegistro ? (
            <div className="tipo-seleccion">
              <h2>Registrarse como:</h2>
              <button onClick={() => setTipoRegistro("usuario")}>
                Usuario
              </button>
              <button onClick={() => setTipoRegistro("conductor")}>
                Conductor
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleRegister}
              className={`form-registro ${
                tipoRegistro === "conductor" ? "wizard" : ""
              }`}
            >
              <h2>
                {tipoRegistro === "usuario"
                  ? "Registro de Usuario"
                  : "Registro de Conductor"}
              </h2>

              {/* Paso 1: Datos personales */}
              {(tipoRegistro === "usuario" || step === 1) && (
                <>
                  <input
                    name="nombre"
                    type="text"
                    placeholder="Nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                  <input
                    name="apellido"
                    type="text"
                    placeholder="Apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <input
                    name="telefono"
                    type="text"
                    placeholder="Teléfono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {tipoRegistro === "conductor" && (
                    <button
                      type="button"
                      className="btn-next"
                      onClick={nextStep}
                    >
                      Siguiente ➔
                    </button>
                  )}
                </>
              )}

              {/* Paso 2: Datos vehículo (conductor) */}
              {tipoRegistro === "conductor" && step === 2 && (
                <>
                  <input
                    name="cedula"
                    type="text"
                    placeholder="Cédula"
                    value={conductorData.cedula}
                    onChange={handleChange}
                  />
                  <input
                    name="licencia"
                    type="text"
                    placeholder="Licencia"
                    value={conductorData.licencia}
                    onChange={handleChange}
                  />
                  <input
                    name="fechaVencimiento"
                    type="date"
                    placeholder="Fecha vencimiento"
                    value={conductorData.fechaVencimiento}
                    onChange={handleChange}
                  />
                  <select
                    name="tipoVehiculo"
                    value={conductorData.tipoVehiculo}
                    onChange={handleChange}
                  >
                    <option value="Carro">Carro</option>
                    <option value="Moto">Moto</option>
                  </select>
                  <input
                    name="marca"
                    type="text"
                    placeholder="Marca"
                    value={conductorData.marca}
                    onChange={handleChange}
                  />
                  <input
                    name="modelo"
                    type="text"
                    placeholder="Modelo"
                    value={conductorData.modelo}
                    onChange={handleChange}
                  />
                  <input
                    name="placa"
                    type="text"
                    placeholder="Placa"
                    value={conductorData.placa}
                    onChange={handleChange}
                  />

                  <div className="wizard-buttons">
                    <button
                      type="button"
                      className="btn-prev"
                      onClick={prevStep}
                    >
                      ← Anterior
                    </button>
                    <button type="submit" className="btn-registrarse">
                      Registrarse
                    </button>
                  </div>
                </>
              )}

              {/* Usuario simple */}
              {tipoRegistro === "usuario" && (
                <button type="submit" className="btn-registrarse">
                  Registrarse
                </button>
              )}
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
