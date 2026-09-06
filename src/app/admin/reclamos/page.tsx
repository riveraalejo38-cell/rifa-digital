import ReclamosClient from "./ReclamosClient";

// Ver nota en src/app/vendedor/page.tsx: esta ruta tampoco se debe cachear
// en el borde/CDN.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ReclamosPage() {
  return <ReclamosClient />;
}
