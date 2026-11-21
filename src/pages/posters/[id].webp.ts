// Imagen quieta de cada GIF de demo: su primer cuadro, como WebP liviano.
// Se genera al armar el sitio. Así las cards muestran una imagen quieta y el GIF
// solo se carga y se mueve si la persona lo pide (y tiene el movimiento encendido).
import type { APIRoute, GetStaticPaths } from "astro";
import sharp from "sharp";
import { getProyectos } from "@/lib/proyectos";

export const getStaticPaths = (async () => {
  const proyectos = await getProyectos();
  return proyectos.flatMap((proyecto) =>
    proyecto.demoMedia.flatMap((media, indice) =>
      media.animada ? [{ params: { id: `${proyecto.id}-${indice}` }, props: { url: media.url } }] : [],
    ),
  );
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const url = props.url as string;
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`No se pudo bajar ${url} (${respuesta.status}) para sacarle el primer cuadro`);
  }
  const original = Buffer.from(await respuesta.arrayBuffer());
  // sharp lee solo el primer cuadro de un GIF si no se le pide otra cosa.
  const cuadro = await sharp(original)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
  return new Response(new Uint8Array(cuadro), { headers: { "Content-Type": "image/webp" } });
};
