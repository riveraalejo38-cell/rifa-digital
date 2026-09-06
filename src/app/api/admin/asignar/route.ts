import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const TICKET_PRICE = 80000;

export async function POST(request: Request) {
  try {
    // Leer sesión del vendedor
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
    const { ticketId, clientId, amountPaid } = body;

    if (!ticketId || !clientId) {
      return NextResponse.json(
        { success: false, error: "ticketId y clientId son obligatorios" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Boleta no encontrada" },
        { status: 404 }
      );
    }

    if (ticket.status === "PAID") {
      return NextResponse.json(
        { success: false, error: "Esta boleta ya está pagada" },
        { status: 400 }
      );
    }

    // Una boleta ocupada solo la puede tocar quien la vendió o un admin. Otro
    // vendedor que intente abonarle/registrarla debe reclamarla primero.
    if (
      session.role !== "ADMIN" &&
      ticket.status !== "AVAILABLE" &&
      ticket.assignedById &&
      ticket.assignedById !== session.id
    ) {
      return NextResponse.json(
        { success: false, error: "Esta boleta no te pertenece. Si es tuya, reclámala." },
        { status: 403 }
      );
    }

    const amount = Number(amountPaid) || 0;

    const result = await prisma.$transaction(async (tx) => {
      // El estado de la boleta se calcula sobre el ACUMULADO de todos sus
      // abonos (no solo este abono puntual), para que una boleta que se
      // termina de pagar en varias partes sí quede marcada como PAID.
      const pagosPrevios = await tx.payment.aggregate({
        where: { ticketId },
        _sum: { amount: true },
      });
      const yaAbonado = Number(pagosPrevios._sum.amount) || 0;
      const acumulado = yaAbonado + amount;

      let newStatus: "RESERVED" | "PARTIAL" | "PAID";
      if (acumulado <= 0) {
        newStatus = "RESERVED";
      } else if (acumulado >= TICKET_PRICE) {
        newStatus = "PAID";
      } else {
        newStatus = "PARTIAL";
      }

      // Se registra siempre un movimiento (incluso cuando amount es 0, es
      // decir, una boleta que solo se separa sin abono), para poder armar
      // un historial confiable de movimientos por día en el reporte diario.
      await tx.payment.create({
        data: {
          ticketId: ticketId,
          clientId: clientId,
          amount: amount,
          status: "CONFIRMED",
          notes: amount > 0 ? `Abono registrado por ${session.name}` : `Boleta separada sin abono por ${session.name}`,
          createdById: session.id,
          createdByName: session.name,
        },
      });

      // Guardar el vendedor en el cliente
      await tx.client.update({
        where: { id: clientId },
        data: {
          notes: `Vendedor: ${session.name} (${session.id})`,
        },
      });

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          clientId,
          status: newStatus,
          amountPaid: acumulado,
          reservedAt: new Date(),
          paidAt: newStatus === "PAID" ? new Date() : null,
          assignedById: session.id,
          assignedByName: session.name,
          // Si esta boleta había quedado marcada como liberada antes,
          // al volver a registrarse deja de estar "liberada".
          releasedAt: null,
          releasedById: null,
          releasedByName: null,
        },
        include: {
          client: true,
          payments: true,
        },
      });

      return updated;
    });

    const totalPaid = result.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    return NextResponse.json({
      success: true,
      ticket: {
        ...result,
        totalPaid,
        remaining: TICKET_PRICE - totalPaid,
        vendedor: session.name,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error al asignar boleta" },
      { status: 500 }
    );
  }
}
