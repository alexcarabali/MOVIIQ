"use client";

import Image from "next/image";
import "./page.modules.css";
import Link from "next/link";
import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      // agarramos la primera card
      const card = sliderRef.current.querySelector(".benefit") as HTMLElement;
      if (!card) return;

      // ancho real de una card (incluye padding + margin + gap)
      const cardWidth = card.offsetWidth + 80; // 80px ≈ tu gap de 5rem
      const scrollAmount = cardWidth * 4; // mover 4 cards exactas

      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <h1>Únete a MOVIIQ y viaja fácil, rápido y seguro</h1>
          <p>
            La mejor forma de moverte en la ciudad con confianza y seguridad.
          </p>
          <div className="hero-actions">
            <Link href="/" className="btn primario">
              Comenzar
            </Link>
            <Link href="/" className="btn secundario">
              Descargar App
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/moto.jpg" alt="Servicio MOVIIQ" />
        </div>
      </section>

      <section className="benefits">
        {/* Flecha izquierda */}
        <button className="arrow left" onClick={() => scroll("left")}>
          <ChevronLeft size={80} />
        </button>{" "}
        <div ref={sliderRef} className="benefits-slider">
          <div className="benefit">
            {" "}
            <img src="/seguroo.webp" alt="Seguridad" /> <h3>Seguro</h3>{" "}
            <p>Viaja con conductores verificados.</p>{" "}
            <Link href="/" className="btn btn-card">
              {" "}
              Ver más{" "}
            </Link>{" "}
          </div>{" "}
          <div className="benefit">
            {" "}
            <img src="/rapido.jpg" alt="Rapidez" /> <h3>Rápido</h3>{" "}
            <p>Llegamos en minutos a tu ubicación.</p>{" "}
            <Link href="/" className="btn btn-card">
              {" "}
              Ver más{" "}
            </Link>{" "}
          </div>{" "}
          <div className="benefit">
            {" "}
            <img src="/conectividad.jpg" alt="Conectividad" />{" "}
            <h3>Conectividad</h3> <p>Acercamos barrios y unimos veredas.</p>{" "}
            <Link href="/" className="btn btn-card">
              {" "}
              Ver más{" "}
            </Link>{" "}
          </div>{" "}
          <div className="benefit">
            {" "}
            <img src="/calidad.jpg" alt="Calidad" /> <h3>Calidad</h3>{" "}
            <p>Pensado para tu tranquilidad.</p>{" "}
            <Link href="/" className="btn btn-card">
              {" "}
              Ver más{" "}
            </Link>{" "}
          </div>{" "}
          <div className="benefit">
            {" "}
            <img src="/economico.jpg" alt="Económico" /> <h3>Económico</h3>{" "}
            <p>La mejor tarifa del mercado.</p>{" "}
            <Link href="/" className="btn btn-card">
              {" "}
              Ver más{" "}
            </Link>{" "}
          </div>{" "}
          <div className="benefit">
            {" "}
            <img src="/disponibilidad.webp" alt="Disponibilidad" />{" "}
            <h3>Disponibilidad</h3> <p>Cuando quieras y donde estes.</p>{" "}
            <Link href="/" className="btn btn-card">
              {" "}
              Ver más{" "}
            </Link>{" "}
          </div>{" "}
          <div className="benefit">
            {" "}
            <img src="/inclusion.jpg" alt="Inclusion" /> <h3>Inclusión</h3>{" "}
            <p>La ruta que nos une contigo.</p>{" "}
            <Link href="/" className="btn btn-card">
              {" "}
              Ver más{" "}
            </Link>{" "}
          </div>{" "}
          <div className="benefit">
            {" "}
            <img src="/comodidad.jpg" alt="Comodidad" /> <h3>Comodidad</h3>{" "}
            <p>Viajar nunca fue tan sencillo.</p>{" "}
            <Link href="/" className="btn btn-card">
              {" "}
              Ver más{" "}
            </Link>{" "}
          </div>{" "}
        </div>
        {/* Flecha derecha */}
        <button className="arrow right" onClick={() => scroll("right")}>
          <ChevronRight size={80} />
        </button>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <p>© MOVIIQ 2025 - Todos los derechos reservados</p>
          <ul>
            <li>
              <Link href="/">Política de Privacidad</Link>
            </li>
            <li>
              <Link href="/">Términos y Condiciones</Link>
            </li>
            <li>
              <Link href="/">Contacto</Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
