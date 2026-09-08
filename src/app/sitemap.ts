import type { MetadataRoute } from "next";

// Lista de páginas que Google puede indexar y mostrar en resultados de
// búsqueda. Solo la página pública de venta (la raíz del dominio) — los
// paneles internos y las boletas de clientes no van aquí (ver robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.rifassantiagogomez.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
