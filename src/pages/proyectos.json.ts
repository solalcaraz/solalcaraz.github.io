// Lista de proyectos en JSON, para que otros la lean. Hoy la usa el README del perfil de GitHub
// (repo solalcaraz/solalcaraz): una tarea semanal baja este archivo y arma la tabla "Más proyectos".
// Sale de los mismos datos que las cards, así que web y perfil cuentan lo mismo.
// Solo lleva datos que ya son públicos en el sitio (nada de lo privado).
import type { APIRoute } from "astro";
import { getProyectos } from "@/lib/proyectos";

const mesYAnio = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });

export const GET: APIRoute = async () => {
  const proyectos = await getProyectos();

  const lista = proyectos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    tipo: p.tipo,
    origen: p.origen,
    queHace: p.queHace,
    tecnologias: p.tecnologias,
    // Los proyectos de código privado enlazan a su vitrina; el resto, a su repo.
    enlace: p.repos[0]?.url ?? p.caso,
    demo: p.demo,
    // Igual que en la card: período fijado a mano si está cerrado, si no, la última actividad.
    fecha: p.periodo ? `Período: ${p.periodo}` : `Última actividad: ${mesYAnio.format(new Date(p.ultimaActividad))}`,
  }));

  return new Response(JSON.stringify({ proyectos: lista }, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
