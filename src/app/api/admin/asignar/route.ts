import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const TICKET_PRICE = 70000;

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

    const amount = Number(amountPaid) || 0;

    let newStatus: "RESERVED" | "PARTIAL" | "PAID";
    if (amount <= 0) {
      newStatus = "RESERVED";
    } else if (amount >= TICKET_PRICE) {
      newStatus = "PAID";
    } else {
      newStatus = "PARTIAL";
    }

    const result = await prisma.$transaction(async (tx) => {
      if (amount > 0) {
        await tx.payment.create({
          data: {
            ticketId: ticketId,
            clientId: clientId,
            amount: amount,
            status: "CONFIRMED",
            notes: `Abono registrado por ${session.name}`,
          },
        });
      }

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
          amountPaid: amount,
          reservedAt: new Date(),
          paidAt: newStatus === "PAID" ? new Date() : null,
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