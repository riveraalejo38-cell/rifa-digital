import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// El administrador aprueba o rechaza un reclamo. Esto NO mueve la boleta
// automáticamente: solo deja constancia de la decisión. Si el reclamo era
// legítimo, el admin libera la boleta él mismo (botón "Liberar") para que el
// vendedor que reclamó la pueda volver a registrar.
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { claimId, decision } = body;

    if (!claimId || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });
    }

    const claim = await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: decision,
        resolvedAt: new Date(),
        resolvedById: session.id,
        resolvedByName: session.name,
      },
    });

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error al resolver el reclamo" }, { status: 500 });
  }
}
