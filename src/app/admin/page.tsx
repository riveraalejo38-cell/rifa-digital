import AdminClient from "./AdminClient";

// Ver nota en src/app/vendedor/page.tsx: esta ruta tampoco se debe cachear
// en el borde/CDN, para que siempre se sirva el HTML/JS de la versión
// desplegada más reciente y nunca datos de una versión vieja.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminPage() {
  return <AdminClient />;
}
