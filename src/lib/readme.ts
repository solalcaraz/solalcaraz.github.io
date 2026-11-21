// Lee un README en markdown y saca los datos que necesita la card.
// Los README siguen la estructura de la skill codebase-onboarding:
// los encabezados se buscan por nombre exacto. Si falta un dato, queda en null
// (la card muestra PENDIENTE); nunca se completa con una suposición.

// Una imagen o GIF de la sección "Demo". La ruta puede ser relativa al repo.
export type ImagenDemo = { alt: string; ruta: string };

export type DatosReadme = {
  titulo: string | null; // el "# Título"
  queHace: string | null; // primera oración de la introducción
  problema: string | null; // primer párrafo de "Problema que resuelve"
  equipo: string | null; // "Equipo de cinco" o "Trabajo en equipo", si el README lo dice
  tecnologias: string | null; // texto completo de la sección "Tecnologías"
  demo: ImagenDemo[]; // imágenes y GIF de la sección "Demo", en orden
  // Detalle para la vista ampliada de la card (cada uno queda vacío si el README no lo trae):
  problemaCorto: string | null; // primera oración de "Problema que resuelve"
  introduccion: string | null; // el primer párrafo completo
  problemaParrafos: string[]; // todos los párrafos de "Problema que resuelve"
  decisiones: string[]; // viñetas de "Cómo funciona" (las decisiones y su razón)
  aprendizajes: string[]; // viñetas de "Qué aprendí" (sin "Qué mejoraría")
  autoria: string[]; // párrafos y viñetas de "Autoría y mejoras"
  urlDemo: string | null; // primer enlace de la sección "Demo" (que no sea una imagen)
  notasDemo: string[]; // aclaraciones sobre la demo (datos de ejemplo, fotos difuminadas, etc.)
};

const SECCION_PROBLEMA = "Problema que resuelve";
const SECCION_TECNOLOGIAS = "Tecnologías";
const SECCION_DEMO = "Demo";
const SECCION_FUNCIONA = "Cómo funciona";
const SECCION_APRENDI = "Qué aprendí y qué mejoraría";
const SECCION_AUTORIA = "Autoría y mejoras";

// Todos los párrafos de texto de una sección (sin listas, tablas ni imágenes).
function parrafosDe(lineas: string[] | undefined): string[] {
  if (!lineas) return [];
  const bloques: string[][] = [[]];
  for (const linea of lineas) {
    if (linea.trim() === "") bloques.push([]);
    else bloques[bloques.length - 1]?.push(linea);
  }
  return bloques
    .filter((bloque) => bloque.length > 0 && esTexto(bloque))
    .map((bloque) => limpiar(bloque.join(" ")))
    .filter((texto) => texto !== "");
}

// Las viñetas ("- algo") de una sección, ya sin markdown. Si se pide, solo las que están
// entre dos marcas en negrita (por ejemplo, "**Qué aprendí**" y "**Qué mejoraría**").
function vinetasDe(lineas: string[] | undefined, desde?: RegExp, hasta?: RegExp): string[] {
  if (!lineas) return [];
  let dentro = desde === undefined;
  const resultado: string[] = [];
  for (const linea of lineas) {
    if (desde?.test(linea.trim())) {
      dentro = true;
      continue;
    }
    if (hasta?.test(linea.trim())) dentro = false;
    const vineta = linea.match(/^\s*[-*]\s+(.+)$/);
    if (dentro && vineta?.[1]) resultado.push(limpiar(vineta[1]));
  }
  return resultado.filter((texto) => texto !== "");
}

// Las líneas donde el README muestra el proyecto andando: la sección "Demo" y, si las hay,
// las secciones "Integrador..." (por ejemplo, un flujo extra con su propio GIF).
function lineasDeDemo(secciones: Map<string, string[]>): string[] {
  return [...secciones.entries()]
    .filter(([nombre]) => nombre === SECCION_DEMO || nombre.startsWith("Integrador"))
    .flatMap(([, lineas]) => lineas);
}

// Las aclaraciones que el README hace sobre la demo (por ejemplo, "las fotos son de ejemplo"
// o "el contenido definitivo todavía no está cargado"). Se muestran junto a las capturas.
// Quedan afuera los enlaces sueltos y los epígrafes numerados de cada GIF.
function notasDeDemo(lineas: string[] | undefined): string[] {
  return parrafosDe(lineas)
    .filter(
      (texto) =>
        !/^https?:\/\/\S+$/.test(texto) &&
        !/^(Web en producción|Sitio (público|en producción))/i.test(texto) &&
        !/^\d+\./.test(texto),
    )
    .slice(0, 3);
}

// El primer enlace de la sección "Demo" que no es una imagen.
function primerEnlace(lineas: string[] | undefined): string | null {
  if (!lineas) return null;
  const sinImagenes = lineas.join("\n").replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  const coincidencia = sinImagenes.match(/https?:\/\/[^\s)\]>]+/);
  return coincidencia ? coincidencia[0].replace(/[.,;:]+$/, "") : null;
}

// Todo el texto de una sección (listas y tablas incluidas), ya sin markdown.
function textoDeSeccion(lineas: string[] | undefined): string | null {
  if (!lineas) return null;
  const texto = limpiar(lineas.filter((linea) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(linea)).join(" "));
  return texto === "" ? null : texto;
}

function imagenesDe(lineas: string[] | undefined): ImagenDemo[] {
  if (!lineas) return [];
  return [...lineas.join("\n").matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map((coincidencia) => ({
    alt: (coincidencia[1] ?? "").trim(),
    ruta: coincidencia[2] ?? "",
  }));
}

// Quita la sintaxis de markdown y deja solo el texto.
function limpiar(texto: string): string {
  return texto
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // imágenes
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // enlaces: queda el texto
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Un bloque es "texto" si no es una lista, tabla, cita, imagen, badge o código.
function esTexto(bloque: string[]): boolean {
  const primera = (bloque[0] ?? "").trimStart();
  return !/^(\[!\[|!\[|\||-|\*\s|\d+\.|>|<|```|#)/.test(primera);
}

function primerParrafo(lineas: string[]): string | null {
  const bloques: string[][] = [[]];
  for (const linea of lineas) {
    if (linea.trim() === "") bloques.push([]);
    else bloques[bloques.length - 1]?.push(linea);
  }
  const bloque = bloques.find((b) => b.length > 0 && esTexto(b));
  if (!bloque) return null;
  const texto = limpiar(bloque.join(" "));
  // Un párrafo que termina en ":" introducía una lista: se cierra con punto.
  return texto.endsWith(":") ? `${texto.slice(0, -1)}.` : texto;
}

function primeraOracion(texto: string): string {
  const partes = texto.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/);
  return partes[0] ?? texto;
}

function detectarEquipo(texto: string): string | null {
  const conTamano = texto.match(/\bequipo de (\p{L}+)/iu);
  if (conTamano?.[1]) return `Equipo de ${conTamano[1].toLowerCase()}`;
  if (/\ben equipo\b/i.test(texto)) return "Trabajo en equipo";
  return null;
}

export function leerReadme(markdown: string): DatosReadme {
  // Se separa en secciones por encabezado, sin mirar los # dentro de bloques de código.
  const secciones = new Map<string, string[]>();
  let titulo: string | null = null;
  let actual = "";
  secciones.set(actual, []);
  let enCodigo = false;

  for (const linea of markdown.split(/\r?\n/)) {
    if (linea.trimStart().startsWith("```")) enCodigo = !enCodigo;
    if (!enCodigo) {
      const h1 = linea.match(/^#\s+(.+)$/);
      if (h1?.[1] && titulo === null) {
        titulo = limpiar(h1[1]);
        continue;
      }
      const h2 = linea.match(/^##\s+(.+)$/);
      if (h2?.[1]) {
        actual = limpiar(h2[1]);
        secciones.set(actual, []);
        continue;
      }
    }
    secciones.get(actual)?.push(linea);
  }

  const intro = primerParrafo(secciones.get("") ?? []);
  const problema = primerParrafo(secciones.get(SECCION_PROBLEMA) ?? []);

  return {
    titulo,
    queHace: intro ? primeraOracion(intro) : null,
    problema,
    equipo: intro ? detectarEquipo(intro) : null,
    tecnologias: textoDeSeccion(secciones.get(SECCION_TECNOLOGIAS)),
    demo: imagenesDe(lineasDeDemo(secciones)),
    problemaCorto: problema ? primeraOracion(problema) : null,
    introduccion: intro,
    problemaParrafos: parrafosDe(secciones.get(SECCION_PROBLEMA)),
    decisiones: vinetasDe(secciones.get(SECCION_FUNCIONA)).slice(0, 6),
    aprendizajes: vinetasDe(
      secciones.get(SECCION_APRENDI),
      /^\*\*Qué aprendí\*\*/i,
      /^\*\*Qué mejoraría\*\*/i,
    ).slice(0, 5),
    autoria: [
      ...parrafosDe(secciones.get(SECCION_AUTORIA)),
      ...vinetasDe(secciones.get(SECCION_AUTORIA)),
    ],
    urlDemo: primerEnlace(secciones.get(SECCION_DEMO)),
    notasDemo: notasDeDemo(secciones.get(SECCION_DEMO)),
  };
}
