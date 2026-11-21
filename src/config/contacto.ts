// Datos de contacto del sitio.
//
// El mail NO se escribe acá en claro: este repositorio es público y el código lo vería
// cualquiera (o un programa que junta mails). Está dado vuelta y pasado a base64, y la página
// lo arma recién cuando alguien hace clic en el botón de mail (ver Contacto.astro).
// Para cambiarlo: dar vuelta el mail letra por letra y pasarlo a base64
// (en Node: Buffer.from(mail.split("").reverse().join("")).toString("base64")).
//
// Aviso: esto frena a los programas que recolectan mails de las páginas y del código, no a
// una persona decidida. No es un secreto.
import { USUARIO_GITHUB } from "@/config/proyectos";

export const CONTACTO = {
  correoCodificado: "bW9jLmxpYW1nQGxvc216YXJhY2xh",
  linkedin: "https://www.linkedin.com/in/maria-sol-alcaraz/",
  github: `https://github.com/${USUARIO_GITHUB}`,
  // Repo del sitio (confirmado 2026-11-21): solalcaraz.github.io, público y sin el topic "portfolio".
  codigoFuente: `https://github.com/${USUARIO_GITHUB}/${USUARIO_GITHUB}.github.io`,
  // PDF que se descarga. Para actualizar el CV, reemplazar este archivo (mismo nombre).
  cv: "/cv/CV-Maria-Sol-Alcaraz.pdf",
};
