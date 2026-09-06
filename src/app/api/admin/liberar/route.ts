import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: "ticketId es obligatorio" },
        { status: 400 }
      );
    }

    const ticketActual = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticketActual) {
      return NextResponse.json({ success: false, error: "Boleta no encontrada" }, { status: 404 });
    }

    // Solo el admin o quien vendió la boleta la puede liberar. Otro vendedor
    // no puede liberar (ni abonar) una boleta que no le pertenece.
    if (
      session.role !== "ADMIN" &&
      ticketActual.assignedById &&
      ticketActual.assignedById !== session.id
    ) {
      return NextResponse.json(
        { success: false, error: "Esta boleta no te pertenece, no la puedes liberar" },
        { status: 403 }
      );
    }

    // Liberar una boleta debe dejarla totalmente limpia: se borra el historial
    // de abonos (Payment) asociado, si no, al volver a registrarla el nuevo
    // abono se suma sobre el saldo viejo (ej: $20.000 previos + $30.000 nuevos
    // aparecía como $50.000 abonados en una boleta que se acababa de asignar
    // a otro cliente distinto). Se deja registrado quién y cuándo la liberó,
    // para poder mostrarlo en el panel.
    const ticket = await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { ticketId } });
      return tx.ticket.update({
        where: { id: ticketId },
        data: {
          clientId: null,
          status: "AVAILABLE",
          reservedAt: null,
          paidAt: null,
          amountPaid: null,
          assignedById: null,
          assignedByName: null,
          releasedAt: new Date(),
          releasedById: session.id,
          releasedByName: session.name,
        },
      });
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error" },
      { status: 500 }
    );
  }
}
