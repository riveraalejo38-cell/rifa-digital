import VendedorClient from "./VendedorClient";

// Esta página NUNCA se debe servir cacheada desde el borde/CDN: eso hacía
// que, después de un nuevo despliegue, el navegador siguiera recibiendo el
// HTML y el bundle de JS de una versión vieja (con datos de pruebas viejas,
// ej. un cliente de prueba que ya no existe), aunque la base de datos ya
// tuviera el dato correcto. `export const dynamic`/`revalidate` solo se
// puede declarar en un componente de servidor, por eso esta página es un
// wrapper de servidor delgado que solo renderiza el componente cliente real.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function VendedorPage() {
  return <VendedorClient />;
}
