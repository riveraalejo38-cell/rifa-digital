import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Devuelve quién es el usuario que tiene la sesión abierta (id, nombre, rol).
// El panel de vendedor lo usa para saber si una boleta que está consultando
// fue vendida por él mismo o por otro vendedor.
export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

  if (!session) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: { id: session.id, name: session.name, role: session.role },
  });
}
