import type { MetadataRoute } from "next";

// Le dice a Google (y a otros buscadores) qué partes del sitio puede mostrar
// en resultados de búsqueda. La página pública de venta (/) queda abierta;
// los paneles internos, el login y las boletas de clientes puntuales quedan
// fuera, porque no son páginas para que el público encuentre buscando en
// Google.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/vendedor", "/login", "/api", "/boleta"],
    },
    sitemap: "https://www.rifassantiagogomez.com/sitemap.xml",
  };
}
