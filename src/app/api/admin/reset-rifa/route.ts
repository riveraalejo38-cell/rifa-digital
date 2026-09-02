import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Reinicia la rifa activa: borra todas las boletas vendidas, sus pagos y
// los clientes asociados, y deja todas las boletas en blanco (AVAILABLE).
// También permite actualizar el precio y/o la fecha del sorteo de una vez.
// Solo un ADMIN autenticado puede ejecutar esta acción.
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { ticketPrice, drawDate } = body || {};

    const raffle = await prisma.raffle.findFirst({ where: { isActive: true } });
    if (!raffle) {
      return NextResponse.json(
        { success: false, error: "No hay rifa activa" },
        { status: 400 }
      );
    }

    const ticketsConCliente = await prisma.ticket.findMany({
      where: { raffleId: raffle.id, clientId: { not: null } },
      select: { clientId: true },
    });
    const clientIds = [...new Set(ticketsConCliente.map((t) => t.clientId as string))];

    const raffleUpdateData: any = {};
    if (typeof ticketPrice === "number" && ticketPrice > 0) {
      raffleUpdateData.ticketPrice = ticketPrice;
    }
    if (typeof drawDate === "string" && drawDate) {
      raffleUpdateData.drawDate = new Date(drawDate);
    }

    const [pagosBorrados, ticketsReseteados, clientesBorrados] = await prisma.$transaction([
      prisma.payment.deleteMany({ where: { ticket: { raffleId: raffle.id } } }),
      prisma.ticket.updateMany({
        where: { raffleId: raffle.id },
        data: {
          clientId: null,
          status: "AVAILABLE",
          amountPaid: null,
          reservedAt: null,
          paidAt: null,
        },
      }),
      prisma.client.deleteMany({
        where: { id: { in: clientIds }, wonRaffles: { none: {} } },
      }),
      ...(Object.keys(raffleUpdateData).length
        ? [prisma.raffle.update({ where: { id: raffle.id }, data: raffleUpdateData })]
        : []),
    ] as any);

    return NextResponse.json({
      success: true,
      resumen: {
        pagosBorrados: pagosBorrados.count,
        ticketsReseteados: ticketsReseteados.count,
        clientesBorrados: clientesBorrados.count,
        raffleActualizada: Object.keys(raffleUpdateData).length > 0,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error al reiniciar la rifa" },
      { status: 500 }
    );
  }
}
