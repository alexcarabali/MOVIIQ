"use client";

import "./globals.css";
import Link from "next/link";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Search } from "lucide-react";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";

// ------------------- HEADER -------------------
function Header({
  loginOpen,
  setLoginOpen,
  registerOpen,
  setRegisterOpen,
}: {
  loginOpen: boolean;
  setLoginOpen: React.Dispatch<React.SetStateAction<boolean>>;
  registerOpen: boolean;
  setRegisterOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand">
          <img src="/logo.jpg" alt="MoviiQ" />
        </Link>

        <nav className="main-nav" aria-label="barra principal">
          <ul className="nav-list">
            <li>
              <Link href="/">Cómo funciona</Link>
            </li>
            <li>
              <Link href="/">Ayuda</Link>
            </li>
            <li>
              <Link href="/">Sobre Nosotros</Link>
            </li>
          </ul>
        </nav>

        <div className="actions">
          <div className="search-bar">
            <button type="submit" aria-label="Buscar">
              <Search size={30} />
            </button>
          </div>
          <div className="separador">
            <h1>|</h1>
          </div>

          {!isAuthenticated ? (
            <>
              <button
                className="btn iniciar"
                onClick={() => setLoginOpen(true)}
              >
                Iniciar sesión
              </button>
              <button
                className="btn registrarse"
                onClick={() => setRegisterOpen(true)}
              >
                Registrarse
              </button>
            </>
          ) : (
            <>
              <button className="btn cerrar" onClick={logout}>
                Cerrar sesión
              </button>
              <Link className="btn perfil" href="/">
                Mi perfil
              </Link>
            </>
          )}

          <Link className="btn moviiq" href="/">
            App MoviiQ
          </Link>

          {/* Botón hamburguesa */}
          <button
            className={`nav-toggle ${menuOpen ? "open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="hamburger" />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${menuOpen ? "active" : ""}`}
        hidden={!menuOpen}
      >
        <ul>
          <li>
            <Link href="/">Como funciona</Link>
          </li>
          <li>
            <Link href="/">Ayuda</Link>
          </li>
          <li>
            <Link href="/">Sobre Nosotros</Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

// ------------------- ROOT LAYOUT -------------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          {/* Header y Modales dentro del provider */}
          <Header
            loginOpen={loginOpen}
            setLoginOpen={setLoginOpen}
            registerOpen={registerOpen}
            setRegisterOpen={setRegisterOpen}
          />
          <main /*className="p-6"*/>{children}</main>
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
          <RegisterModal
            isOpen={registerOpen}
            onClose={() => setRegisterOpen(false)}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
