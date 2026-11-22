// Configuración de los proyectos del portfolio. Lo único que se edita a mano.
// El resto sale solo de GitHub y de los README.
//
// Hay dos fuentes de proyectos:
// 1. Repos públicos de GitHub con el topic "portfolio".
// 2. Vitrinas de proyectos con código privado: una carpeta por proyecto dentro del
//    repo público "bang-ignore" (proyectos/<nombre>/README.md, con su carpeta media/).
//    Cada carpeta nueva aparece sola como card.

export const USUARIO_GITHUB = import.meta.env.GITHUB_USERNAME ?? "solalcaraz";

// Topic que marca qué repos se muestran.
export const TOPIC = "portfolio";

// Vitrina de proyectos privados (repo público del mismo usuario).
export const VITRINAS = { repo: "bang-ignore", carpeta: "proyectos" };

// Repos que son un índice de varios proyectos: el repo en sí no es una card; cada carpeta
// de la lista es un proyecto, con su propio README (misma estructura que los demás).
export const DESGLOSES: { repo: string; carpetas: string[] }[] = [
  {
    repo: "comunidad-triple-a-claude-code",
    carpetas: ["web-fogon-nino", "web-estudio-verde", "web-ferreyra"],
  },
  // Prácticas del módulo de Claude Design (Triple A): Café Raíz y Crudo.
  {
    repo: "comunidad-triple-a-claude-design",
    carpetas: ["cafe-raiz", "caso-crudo"],
  },
];

// Proyectos partidos en más de un repo: se muestran en una sola card.
// "principal" es el repo con el README principal (de ahí salen el nombre y los textos).
// Un repo que no figura acá aparece como un proyecto propio, sin tocar nada.
export const AGRUPACIONES: { principal: string; otros: string[] }[] = [
  { principal: "back-remy-app", otros: ["front-remy-app"] },
  { principal: "transacciones-db-api", otros: ["frontend-transacciones"] },
];

// Proyectos que existen pero no se muestran en el portfolio (se identifican como en ORDEN).
// Para volver a mostrar uno, sacarlo de esta lista.
// - rumbo-espana: decisión de María Sol (2026-11-20), por ser de uso personal. Su vitrina sigue
//   en el repo "bang-ignore": si quiere que tampoco esté ahí, hay que sacarla de ese repo
//   (no se toca desde este proyecto).
export const OCULTOS: string[] = ["rumbo-espana"];

// Orden de las cards. Se identifica cada proyecto por el nombre de su repo principal
// o, en las vitrinas, por el nombre de su carpeta.
// Los proyectos nuevos (que no figuran acá) van primero, del más reciente al más antiguo.
// Criterio (confirmado el 2026-11-20): primero el trabajo freelance, después la herramienta
// propia, después el resto. PENDIENTE: confirmar el orden dentro de cada bloque.
export const ORDEN: string[] = [
  "calis-trainer",
  "polar-canvas",
  "back-remy-app",
  "postulaciones",
  "web-fogon-nino",
  "web-estudio-verde",
  "web-ferreyra",
  "cafe-raiz",
  "caso-crudo",
  "transacciones-db-api",
  "booklibre",
  "algo-que-pedir",
];

// Proyectos destacados: van arriba, como cards grandes en un carrusel que enfoca la del medio.
// El resto va en "Más proyectos", como lista. Un proyecto nuevo cae en "Más proyectos" hasta que
// se lo agregue acá (reemplazando a otro, para que los destacados sigan siendo pocos).
export const DESTACADOS: string[] = [
  "calis-trainer",
  "polar-canvas",
  "back-remy-app",
  "postulaciones",
  "caso-crudo",
];

// Período de los proyectos terminados. La card lo muestra en lugar de "Última actividad":
// en las vitrinas la fecha de GitHub es la de la documentación, no la del trabajo, y en los
// proyectos viejos no dice cuándo se hicieron. Los períodos salen de la primera parte de cada
// README. Un proyecto que no figura acá muestra la fecha real de GitHub.
export const PERIODOS: Record<string, string> = {
  "calis-trainer": "Agosto – septiembre de 2026",
  "polar-canvas": "Julio – agosto de 2026",
  booklibre: "Marzo – junio de 2026",
  "transacciones-db-api": "Agosto – noviembre de 2025",
  "algo-que-pedir": "Marzo – noviembre de 2025",
  "back-remy-app": "Marzo – junio de 2026",
  // Las tres webs de Triple A: los commits de sus carpetas van del 2 al 16 de noviembre de 2026.
  "web-fogon-nino": "Noviembre de 2026",
  "web-estudio-verde": "Noviembre de 2026",
  "web-ferreyra": "Noviembre de 2026",
  // Los dos casos de Claude Design: commits del 7 al 21 de noviembre de 2026.
  "cafe-raiz": "Noviembre de 2026",
  "caso-crudo": "Noviembre de 2026",
};
// Postulaciones no figura a propósito: sigue abierta (la está midiendo) y muestra la actividad real.

// Imagen que representa a cada proyecto en la card: la posición (desde 0) dentro de las capturas
// de su README, o la ruta de una imagen propia en public/. Si no figura, se usa la primera captura
// quieta. PENDIENTE: elegir la más representativa de los demás sistemas.
export const PORTADAS: Record<string, number | string> = {
  booklibre: "/portadas/booklibre.png",
};

// Topic de GitHub que marca un trabajo freelance en un repo público.
// (Las vitrinas lo indican en INFO, abajo, porque no tienen topics.)
export const TOPIC_FREELANCE = "freelance";

export type Origen = "freelance" | "propio" | "practica";

// De qué se trata cada proyecto, en pocas palabras, y de dónde viene.
// "tipo" es la etiqueta principal de la card: dice QUÉ ES, no cómo se hizo.
// "origen" es opcional: si falta, no se dice nada (no se asume).
// Etiquetas confirmadas por María Sol el 2026-11-21. Ya no hay puertas ni filtros.
// Un proyecto que no figura acá se muestra sin etiqueta de tipo.
export const INFO: Record<
  string,
  { tipo: string; origen?: Origen }
> = {
  "calis-trainer": {
    tipo: "Sitio web + panel de administración",
    origen: "freelance",
  },
  "polar-canvas": {
    tipo: "Sitio web + panel de administración",
    origen: "freelance",
  },
  postulaciones: { tipo: "Herramienta personal", origen: "propio" },
  "rumbo-espana": { tipo: "Herramienta personal", origen: "propio" },
  "web-fogon-nino": {
    tipo: "Landing page con carta editable",
    origen: "practica",
  },
  "web-estudio-verde": { tipo: "Landing page", origen: "practica" },
  "web-ferreyra": {
    tipo: "Landing page + borradores de mail con Claude (MCP)",
    origen: "practica",
  },
  // PENDIENTE: María Sol confirma estas dos etiquetas de tipo (propuestas el 2026-11-21).
  "cafe-raiz": {
    tipo: "Landing page + tienda con pedido por WhatsApp",
    origen: "practica",
  },
  "caso-crudo": {
    tipo: "Landing page + tienda con pago simulado",
    origen: "practica",
  },
  "back-remy-app": {
    tipo: "App web de recomendaciones",
    origen: "practica",
  },
  "transacciones-db-api": {
    tipo: "Análisis de datos con IA",
    origen: "practica",
  },
  // PENDIENTE: ¿BookLibre es una práctica? (no se asume, por eso no tiene origen)
  booklibre: { tipo: "Plataforma de préstamos" },
  "algo-que-pedir": { tipo: "Sistema de pedidos", origen: "practica" },
};

// Frase que aparece en el detalle de cada proyecto (no como etiqueta principal).
export const CONTEXTO: Record<Origen, string> = {
  freelance: "Trabajo freelance, entregado.",
  propio: "Herramienta propia: la armé para resolver algo mío.",
  practica: "Proyecto de práctica, planteado a partir de una consigna.",
};

// Tecnologías que se muestran como etiquetas, en este orden.
// Una tecnología aparece en la card solo si está escrita en la sección "Tecnologías"
// del README del proyecto (así el stack siempre coincide con lo que dice el README).
// Para poder mostrar una tecnología nueva, agregarla acá.
export const TECNOLOGIAS: string[] = [
  "Kotlin",
  "Java",
  "Python",
  "TypeScript",
  "JavaScript",
  "HTML",
  "Node.js",
  "Spring Boot",
  "Spring Security",
  "FastAPI",
  "Express",
  "React",
  "Svelte",
  "Astro",
  "Chakra UI",
  "Tailwind CSS",
  "Bootstrap",
  "Vite",
  "React Router",
  "Axios",
  "PostgreSQL",
  "pgvector",
  "MongoDB",
  "Redis",
  "SQLite",
  "SQLAlchemy",
  "Flyway",
  "GraphQL",
  "API REST",
  "JWT",
  "scikit-learn",
  "Plotly",
  "Sanity",
  "Cloudflare R2",
  "Claude Code",
  "Docker",
  "Vercel",
];
