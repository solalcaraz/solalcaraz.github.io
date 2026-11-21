// Pedidos a la API de GitHub. Solo lectura de repos públicos.

export type RepoGitHub = {
  name: string;
  full_name: string;
  html_url: string;
  homepage: string | null;
  description: string | null;
  fork: boolean;
  default_branch: string;
  topics: string[];
  pushed_at: string;
};

const API = "https://api.github.com";

function tokenCargado(): string | undefined {
  // Sin comillas ni espacios, por si se pegó mal en el .env.
  const token = String(import.meta.env.GITHUB_TOKEN ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
  return token === "" ? undefined : token;
}

function encabezados(formato: string): HeadersInit {
  const base: Record<string, string> = {
    Accept: formato,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // El token es opcional: sin token alcanza para un armado (ver .env.example).
  const token = tokenCargado();
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

// Un error que explica qué pasó y qué hacer, en vez de solo el número de la respuesta.
function fallo(respuesta: Response, queIntentaba: string): Error {
  const estado = respuesta.status;
  const restantes = respuesta.headers.get("x-ratelimit-remaining");
  const renovacion = respuesta.headers.get("x-ratelimit-reset");

  if (estado === 401) {
    return new Error(
      `GitHub rechazó el token (401) al ${queIntentaba}. Revisá GITHUB_TOKEN en el archivo .env: tiene que estar completo, sin comillas ni espacios, y no haber vencido.`,
    );
  }
  if ((estado === 403 || estado === 429) && restantes === "0") {
    const hora = renovacion
      ? new Date(Number(renovacion) * 1000).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
      : "dentro de una hora";
    const consejo = tokenCargado()
      ? "Ya hay un token cargado y igual se agotó: esperá a que se renueve."
      : "Sin token GitHub permite solo 60 pedidos por hora. Para no esperar, cargá GITHUB_TOKEN en el archivo .env (ver README).";
    return new Error(
      `GitHub frenó los pedidos (se agotó el límite) al ${queIntentaba}. Se renueva a las ${hora}. ${consejo}`,
    );
  }
  return new Error(`GitHub respondió ${estado} al ${queIntentaba}`);
}

// Repos públicos del usuario con el topic indicado, incluidos los forks
// (la búsqueda de GitHub los excluye si no se pide fork:true).
export async function buscarRepos(usuario: string, topic: string): Promise<RepoGitHub[]> {
  const consulta = `user:${usuario} topic:${topic} fork:true`;
  const url = `${API}/search/repositories?q=${encodeURIComponent(consulta)}&per_page=100`;
  const respuesta = await fetch(url, { headers: encabezados("application/vnd.github+json") });
  if (!respuesta.ok) throw fallo(respuesta, `buscar los repos de ${usuario}`);
  const datos = (await respuesta.json()) as { items: RepoGitHub[] };
  return datos.items;
}

// README en markdown del repo, o null si no tiene.
export async function leerReadmeCrudo(repo: string): Promise<string | null> {
  const respuesta = await fetch(`${API}/repos/${repo}/readme`, {
    headers: encabezados("application/vnd.github.raw+json"),
  });
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw fallo(respuesta, `leer el README de ${repo}`);
  return respuesta.text();
}

// Datos de un repo público (por ejemplo, la vitrina "bang-ignore").
export async function leerRepo(fullName: string): Promise<RepoGitHub> {
  const respuesta = await fetch(`${API}/repos/${fullName}`, {
    headers: encabezados("application/vnd.github+json"),
  });
  if (!respuesta.ok) throw fallo(respuesta, `leer el repo ${fullName}`);
  return (await respuesta.json()) as RepoGitHub;
}

// Nombres de las carpetas que hay dentro de una ruta del repo.
export async function listarCarpetas(repo: string, ruta: string): Promise<string[]> {
  const respuesta = await fetch(`${API}/repos/${repo}/contents/${ruta}`, {
    headers: encabezados("application/vnd.github+json"),
  });
  if (!respuesta.ok) throw fallo(respuesta, `listar ${repo}/${ruta}`);
  const items = (await respuesta.json()) as { name: string; type: string }[];
  return items.filter((item) => item.type === "dir").map((item) => item.name);
}

// Un archivo de texto del repo (por ejemplo, un README dentro de una carpeta), o null si no existe.
export async function leerArchivoCrudo(repo: string, ruta: string): Promise<string | null> {
  const respuesta = await fetch(`${API}/repos/${repo}/contents/${ruta}`, {
    headers: encabezados("application/vnd.github.raw+json"),
  });
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw fallo(respuesta, `leer ${repo}/${ruta}`);
  return respuesta.text();
}

// Fecha (ISO) del último cambio que tocó una ruta del repo, o null si no hay.
export async function fechaUltimoCambio(repo: string, ruta: string): Promise<string | null> {
  const url = `${API}/repos/${repo}/commits?path=${encodeURIComponent(ruta)}&per_page=1`;
  const respuesta = await fetch(url, { headers: encabezados("application/vnd.github+json") });
  if (!respuesta.ok) throw fallo(respuesta, `leer los cambios de ${repo}/${ruta}`);
  const commits = (await respuesta.json()) as { commit: { committer: { date: string } } }[];
  return commits[0]?.commit.committer.date ?? null;
}
