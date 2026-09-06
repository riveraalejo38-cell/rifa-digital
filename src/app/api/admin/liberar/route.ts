import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: "ticketId es obligatorio" },
        { status: 400 }
      );
    }

    // Liberar una boleta debe dejarla totalmente limpia: se borra el historial
    // de abonos (Payment) asociado, si no, al volver a registrarla el nuevo
    // abono se suma sobre el saldo viejo (ej: $20.000 previos + $30.000 nuevos
    // aparecía como $50.000 abonados en una boleta que se acababa de asignar
    // a otro cliente distinto).
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