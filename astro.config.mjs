// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { rm } from "node:fs/promises";

// La página de trabajo /sistema (paleta y tipografía) solo existe en desarrollo: se borra del
// sitio armado para que no se publique.
const sinSistema = {
  name: "sin-sistema",
  hooks: {
    /** @param {{ dir: URL }} opciones */
    "astro:build:done": async ({ dir }) => {
      await rm(new URL("sistema/", dir), { recursive: true, force: true });
    },
  },
};

// Sitio estático: se arma una vez (con los proyectos de GitHub ya leídos) y se publica.
// Para refrescar los proyectos se vuelve a armar: lo hace solo una tarea semanal
// (.github/workflows/redeploy-semanal.yml).
// `site`: dirección pública en GitHub Pages (repo solalcaraz.github.io, sin ruta base).
// Repo confirmado: solalcaraz.github.io. Si cambia el nombre, hay que ajustar `site` (y `base`).
export default defineConfig({
  site: "https://solalcaraz.github.io",
  integrations: [sinSistema],
  vite: {
    plugins: [tailwindcss()],
  },
  // Las fuentes se descargan al armar el sitio y se sirven desde el propio sitio.
  fonts: [
    {
      provider: fontProviders.google(),
      name: "DM Sans",
      cssVariable: "--font-dm-sans",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      // Solo cursiva: se usa como acento dentro de una frase (ver brand-guidelines).
      provider: fontProviders.google(),
      name: "Newsreader",
      cssVariable: "--font-newsreader",
      weights: [400],
      styles: ["italic"],
      subsets: ["latin"],
      fallbacks: ["Georgia", "serif"],
    },
  ],
});
