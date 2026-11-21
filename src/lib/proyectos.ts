import {
  AGRUPACIONES,
  DESGLOSES,
  INFO,
  OCULTOS,
  ORDEN,
  PERIODOS,
  TECNOLOGIAS,
  TOPIC,
  TOPIC_FREELANCE,
  USUARIO_GITHUB,
  VITRINAS,
  type Origen,
} from "@/config/proyectos";
import {
  buscarRepos,
  fechaUltimoCambio,
  leerArchivoCrudo,
  leerReadmeCrudo,
  leerRepo,
  listarCarpetas,
  type RepoGitHub,
} from "@/lib/github";
import { leerReadme, type DatosReadme } from "@/lib/readme";

// Imagen o GIF de la demo, con la dirección completa para mostrarla.
// Los GIF traen además una imagen quieta (su primer cuadro) para mostrar mientras no se los pide.
export type MediaDemo = { url: string; alt: string; animada: boolean; poster: string | null };

export type Proyecto = {
  id: string; // nombre del repo principal (o de la carpeta, en las vitrinas)
  nombre: string;
  tipo: string | null; // qué es, en pocas palabras (ver INFO en la config)
  origen: Origen | null;
  queHace: string | null; // null = falta en el README (la card muestra PENDIENTE)
  introduccion: string | null;
  problema: string[]; // párrafos de "Problema que resuelve"
  decisiones: string[];
  aprendizajes: string[];
  autoria: string[];
  tecnologias: string[]; // las que el README escribe en su sección "Tecnologías"
  repos: { nombre: string; url: string }[]; // vacío en las vitrinas (código privado)
  caso: string | null; // enlace a la vitrina, para los proyectos de código privado
  demo: string | null; // enlace a la demo en línea (null = no tiene, y no se menciona)
  demoMedia: MediaDemo[]; // capturas y GIF de la sección "Demo" del README
  notasDemo: string[]; // aclaraciones del README sobre la demo
  esFork: boolean;
  equipo: string | null;
  ultimaActividad: string; // fecha ISO del último cambio (dato de GitHub)
  periodo: string | null; // período fijado a mano en PERIODOS (proyectos terminados); null = se usa la fecha de GitHub
};

// Un proyecto antes de armarlo: de dónde salen sus datos.
type Fuente = {
  id: string;
  repos: { nombre: string; url: string }[];
  esFork: boolean;
  topics: string[];
  homepage: string | null;
  descripcion: string | null;
  ultimaActividad: string;
  readmes: (string | null)[]; // el primero es el principal
  // Cómo completar las rutas de imágenes relativas del README principal.
  baseImagenes: string;
  caso: string | null; // enlace a la vitrina (solo proyectos de código privado)
  demoDeReadme: boolean; // la demo en línea se saca del README (no del campo Website del repo)
};

// Arma los grupos de repos: los de AGRUPACIONES juntos y cada uno de los demás solo.
// El primer repo de cada grupo es el principal.
function agrupar(repos: RepoGitHub[]): RepoGitHub[][] {
  const porNombre = new Map(repos.map((repo) => [repo.name, repo]));
  const grupos: RepoGitHub[][] = [];

  for (const { principal, otros } of AGRUPACIONES) {
    const presentes = [principal, ...otros]
      .map((nombre) => porNombre.get(nombre))
      .filter((repo): repo is RepoGitHub => repo !== undefined);
    if (presentes.length === 0) continue;
    grupos.push(presentes);
    presentes.forEach((repo) => porNombre.delete(repo.name));
  }

  for (const repo of porNombre.values()) grupos.push([repo]);
  return grupos;
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Las tecnologías conocidas que aparecen escritas en las secciones "Tecnologías"
// de los README del grupo (en el orden de la lista de configuración).
function tecnologiasDe(textos: (string | null)[]): string[] {
  const texto = textos.filter((t): t is string => t !== null).join(" ");
  return TECNOLOGIAS.filter((tecnologia) =>
    new RegExp(`(?<![\\p{L}\\d])${escaparRegex(tecnologia)}(?![\\p{L}\\d])`, "iu").test(texto),
  );
}

// Las rutas del README suelen ser relativas a su carpeta ("docs/demo.gif", "media/a.jpg").
function urlDeImagen(base: string, ruta: string): string {
  if (/^https?:\/\//.test(ruta)) return ruta;
  const limpia = ruta.replace(/^\.?\//, "");
  return `${base}/${encodeURI(limpia)}`;
}

// Fuente de un grupo de repos públicos con el topic del portfolio.
async function fuenteDeRepos(grupo: RepoGitHub[]): Promise<Fuente | null> {
  const principal = grupo[0];
  if (!principal) return null;
  const readmes = await Promise.all(grupo.map((repo) => leerReadmeCrudo(repo.full_name)));
  return {
    id: principal.name,
    repos: grupo.map((repo) => ({ nombre: repo.name, url: repo.html_url })),
    esFork: grupo.some((repo) => repo.fork),
    topics: grupo.flatMap((repo) => repo.topics),
    homepage: grupo.find((repo) => repo.homepage)?.homepage ?? null,
    descripcion: principal.description,
    ultimaActividad: grupo.map((repo) => repo.pushed_at).sort().at(-1) ?? principal.pushed_at,
    readmes,
    baseImagenes: `https://raw.githubusercontent.com/${principal.full_name}/${principal.default_branch}`,
    caso: null,
    demoDeReadme: false,
  };
}

// Fuente de un proyecto que vive en una carpeta de un repo (vitrinas y desgloses).
// Si la carpeta no tiene README, no es un proyecto.
async function fuenteDeCarpeta(
  repoCompleto: string,
  repo: RepoGitHub,
  ruta: string,
  id: string,
  esVitrina: boolean,
): Promise<Fuente | null> {
  const [readme, fecha] = await Promise.all([
    leerArchivoCrudo(repoCompleto, `${ruta}/README.md`),
    fechaUltimoCambio(repoCompleto, ruta),
  ]);
  if (readme === null) return null;
  const enGitHub = `${repo.html_url}/tree/${repo.default_branch}/${ruta}`;
  return {
    id,
    // Los proyectos de código privado no tienen repo propio: se enlaza su vitrina.
    // Los de un desglose sí: el enlace va a su carpeta dentro del repo.
    repos: esVitrina ? [] : [{ nombre: id, url: enGitHub }],
    esFork: false,
    topics: [],
    homepage: null,
    descripcion: null,
    ultimaActividad: fecha ?? repo.pushed_at,
    readmes: [readme],
    baseImagenes: `https://raw.githubusercontent.com/${repoCompleto}/${repo.default_branch}/${ruta}`,
    caso: esVitrina ? enGitHub : null,
    demoDeReadme: true,
  };
}

// Una por cada carpeta de proyectos/ en el repo de vitrinas (proyectos de código privado).
async function fuentesDeVitrinas(): Promise<Fuente[]> {
  const repoCompleto = `${USUARIO_GITHUB}/${VITRINAS.repo}`;
  const repo = await leerRepo(repoCompleto);
  const carpetas = await listarCarpetas(repoCompleto, VITRINAS.carpeta);
  const fuentes = await Promise.all(
    carpetas.map((carpeta) =>
      fuenteDeCarpeta(repoCompleto, repo, `${VITRINAS.carpeta}/${carpeta}`, carpeta, true),
    ),
  );
  return fuentes.filter((fuente): fuente is Fuente => fuente !== null);
}

// Una por cada carpeta listada de un repo que es un índice de varios proyectos.
async function fuentesDeDesgloses(): Promise<Fuente[]> {
  const fuentes = await Promise.all(
    DESGLOSES.map(async ({ repo: nombre, carpetas }) => {
      const repoCompleto = `${USUARIO_GITHUB}/${nombre}`;
      const repo = await leerRepo(repoCompleto);
      return Promise.all(
        carpetas.map((carpeta) => fuenteDeCarpeta(repoCompleto, repo, carpeta, carpeta, false)),
      );
    }),
  );
  return fuentes.flat().filter((fuente): fuente is Fuente => fuente !== null);
}

function armarProyecto(fuente: Fuente): Proyecto {
  const datos: (DatosReadme | null)[] = fuente.readmes.map((markdown) =>
    markdown ? leerReadme(markdown) : null,
  );
  const principal = datos[0] ?? null;
  const info = INFO[fuente.id];
  const origen: Origen | null =
    info?.origen ?? (fuente.topics.includes(TOPIC_FREELANCE) ? "freelance" : null);

  return {
    id: fuente.id,
    nombre: principal?.titulo ?? fuente.id,
    tipo: info?.tipo ?? null,
    origen,
    queHace: principal?.queHace ?? fuente.descripcion,
    introduccion: principal?.introduccion ?? null,
    problema: principal?.problemaParrafos ?? [],
    decisiones: principal?.decisiones ?? [],
    aprendizajes: principal?.aprendizajes ?? [],
    autoria: principal?.autoria ?? [],
    tecnologias: tecnologiasDe(datos.map((d) => d?.tecnologias ?? null)),
    repos: fuente.repos,
    caso: fuente.caso,
    // Los repos públicos dicen su demo en el campo "Website"; las carpetas, en su sección Demo.
    demo: fuente.homepage || (fuente.demoDeReadme ? (principal?.urlDemo ?? null) : null),
    demoMedia: (principal?.demo ?? []).map(({ alt, ruta }, indice) => {
      const animada = /\.gif$/i.test(ruta);
      return {
        url: urlDeImagen(fuente.baseImagenes, ruta),
        alt,
        animada,
        // El primer cuadro del GIF lo genera src/pages/posters/[id].webp.ts al armar el sitio.
        poster: animada ? `/posters/${fuente.id}-${indice}.webp` : null,
      };
    }),
    notasDemo: principal?.notasDemo ?? [],
    esFork: fuente.esFork,
    equipo: principal?.equipo ?? null,
    ultimaActividad: fuente.ultimaActividad,
    periodo: PERIODOS[fuente.id] ?? null,
  };
}

// Primero los de ORDEN, en ese orden; los nuevos (que no figuran) van antes, del más reciente
// al más antiguo.
function ordenar(proyectos: Proyecto[]): Proyecto[] {
  const posicion = (proyecto: Proyecto) => ORDEN.indexOf(proyecto.id);
  const nuevos = proyectos
    .filter((proyecto) => posicion(proyecto) === -1)
    .sort((a, b) => b.ultimaActividad.localeCompare(a.ultimaActividad));
  const conocidos = proyectos
    .filter((proyecto) => posicion(proyecto) !== -1)
    .sort((a, b) => posicion(a) - posicion(b));
  return [...nuevos, ...conocidos];
}

// Se lee GitHub una sola vez por armado del sitio (o por arranque, en desarrollo).
// Así no se gasta el límite de pedidos de GitHub al recargar la página mientras se trabaja.
let proyectosEnMemoria: Promise<Proyecto[]> | null = null;

async function leerProyectos(): Promise<Proyecto[]> {
  const repos = await buscarRepos(USUARIO_GITHUB, TOPIC);
  // Una lista vacía casi seguro es un error (GitHub devolvió algo raro), no la realidad:
  // se corta el armado para no publicar un sitio sin proyectos.
  if (repos.length === 0) {
    throw new Error(`GitHub no devolvió repos con el topic "${TOPIC}" para ${USUARIO_GITHUB}`);
  }
  // Un repo que es un índice (DESGLOSES) no es una card: lo son sus carpetas.
  const indices = new Set(DESGLOSES.map((desglose) => desglose.repo));
  const [deRepos, deVitrinas, deDesgloses] = await Promise.all([
    Promise.all(agrupar(repos.filter((repo) => !indices.has(repo.name))).map(fuenteDeRepos)),
    fuentesDeVitrinas(),
    fuentesDeDesgloses(),
  ]);
  const fuentes = [
    ...deRepos.filter((f): f is Fuente => f !== null),
    ...deVitrinas,
    ...deDesgloses,
  ].filter((fuente) => !OCULTOS.includes(fuente.id));
  return ordenar(fuentes.map(armarProyecto));
}

// Proyectos del portfolio, leídos de GitHub al armar el sitio.
// Si GitHub falla, esta función lanza un error y el armado se corta: la última versión
// publicada sigue en línea (nunca se publica una lista vacía).
export function getProyectos(): Promise<Proyecto[]> {
  proyectosEnMemoria ??= leerProyectos().catch((error: unknown) => {
    proyectosEnMemoria = null; // un fallo no queda guardado
    throw error;
  });
  return proyectosEnMemoria;
}
