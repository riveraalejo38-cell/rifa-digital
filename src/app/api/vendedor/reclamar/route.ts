import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Un vendedor reclama una boleta que aparece registrada por otro vendedor.
// No mueve nada de la boleta: solo deja un reclamo "PENDING" para que el
// administrador lo revise (viendo el motivo y la foto de evidencia) y decida.
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, reason, evidenceImage } = body;

    if (!ticketId || !reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Cuéntanos por qué es tuya esta boleta" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Boleta no encontrada" }, { status: 404 });
    }

    if (ticket.status === "AVAILABLE") {
      return NextResponse.json(
        { success: false, error: "Esta boleta está disponible, la puedes registrar directamente" },
        { status: 400 }
      );
    }

    if (ticket.assignedById === session.id) {
      return NextResponse.json(
        { success: false, error: "Esta boleta ya está registrada a tu nombre" },
        { status: 400 }
      );
    }

    const yaTieneReclamoPendiente = await prisma.claim.findFirst({
      where: { ticketId, claimedById: session.id, status: "PENDING" },
    });
    if (yaTieneReclamoPendiente) {
      return NextResponse.json(
        { success: false, error: "Ya enviaste un reclamo por esta boleta, está pendiente de revisión" },
        { status: 400 }
      );
    }

    const claim = await prisma.claim.create({
      data: {
        ticketId,
        claimedById: session.id,
        claimedByName: session.name,
        reason: reason.trim(),
        evidenceImage: evidenceImage || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error al enviar el reclamo" }, { status: 500 });
  }
}
