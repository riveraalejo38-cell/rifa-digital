import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Lista los reclamos de boletas para que el administrador los revise.
// Por defecto solo trae los pendientes; con ?status=ALL trae todos (para
// poder ver el historial de reclamos ya aprobados/rechazados).
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const claims = await prisma.claim.findMany({
      where: status === "ALL" ? undefined : { status: status as any },
      include: {
        ticket: { select: { id: true, number: true, status: true, assignedByName: true, client: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, claims });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
