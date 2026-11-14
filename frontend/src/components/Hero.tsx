import { useEffect, useState } from "react";

/**
 * Para usar tus fotos: copia las imágenes a  frontend/public/imagenes/
 * y escribe aquí su nombre en "imagen". Si el archivo no existe, se ve el degradado de "respaldo".
 */
const slides = [
  {
    title: "Aprende música con pasión",
    subtitle: "Guitarra, piano, canto y más en un solo lugar.",
    imagen: "/imagenes/slide1.jpg",
    respaldo: "linear-gradient(120deg, #1c3a73, #5b3a8c)",
  },
  {
    title: "Docentes con experiencia",
    subtitle: "Clases personalizadas para todas las edades.",
    imagen: "/imagenes/slide2.jpg",
    respaldo: "linear-gradient(120deg, #0f5c6e, #1c3a73)",
  },
  {
    title: "Vive el escenario",
    subtitle: "Recitales, audiciones y talleres durante todo el año.",
    imagen: "/imagenes/slide3.jpg",
    respaldo: "linear-gradient(120deg, #8c3a5b, #1c3a73)",
  },
  {
    title: "Tu primera clase, sin compromiso",
    subtitle: "Agenda una clase de prueba y conoce la academia.",
    imagen: "/imagenes/slide4.jpg",
    respaldo: "linear-gradient(120deg, #b36b00, #1c3a73)",
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, []);

  const slide = slides[index];
  // capas: oscurecido suave + foto + degradado de respaldo (si la foto no existe, se ve el degradado)
  const fondo = `linear-gradient(rgba(8,20,50,0.30), rgba(8,20,50,0.30)), url("${slide.imagen}") center / cover no-repeat, ${slide.respaldo}`;

  return (
    <section className="hero" style={{ background: fondo }}>
      <div className="hero-caption">
        <h1>{slide.title}</h1>
        <p>{slide.subtitle}</p>
      </div>
      <div className="dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={i === index ? "dot active" : "dot"}
            onClick={() => setIndex(i)}
            aria-label={`Ir a la diapositiva ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
