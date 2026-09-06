import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raffle = await prisma.raffle.findFirst({
      where: { isActive: true },
    });

    if (!raffle) {
      return NextResponse.json({ success: false, error: "No hay rifa activa" });
    }

    const [total, available, reserved, partial, paid, payments] = await Promise.all([
      prisma.ticket.count({ where: { raffleId: raffle.id } }),
      prisma.ticket.count({ where: { raffleId: raffle.id, status: "AVAILABLE" } }),
      prisma.ticket.count({ where: { raffleId: raffle.id, status: "RESERVED" } }),
      prisma.ticket.count({ where: { raffleId: raffle.id, status: "PARTIAL" } }),
      prisma.ticket.count({ where: { raffleId: raffle.id, status: "PAID" } }),
      // Solo se cuentan abonos de boletas que siguen ocupadas: si una boleta
      // se liberó, su historial de pagos ya no debe sumar en el recaudo total
      // (una boleta liberada queda totalmente limpia, sin rastro).
      prisma.payment.aggregate({
        where: { ticket: { raffleId: raffle.id, status: { not: "AVAILABLE" } }, status: "CONFIRMED" },
        _sum: { amount: true },
      }),
    ]);

    const recaudado = Number(payments._sum.amount) || 0;

    return NextResponse.json({
      success: true,
      stats: { total, available, reserved, partial, paid, recaudado },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
