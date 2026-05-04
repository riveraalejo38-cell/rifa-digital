import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const raffle = await prisma.raffle.findFirst({
      where: { isActive: true },
    });

    if (!raffle) {
      return NextResponse.json({ success: false, error: "No hay rifa activa" });
    }

    const isNumeric = /^\d+$/.test(search);

    const tickets = await prisma.ticket.findMany({
      where: {
        raffleId: raffle.id,
        status: status ? (status as any) : undefined,
        OR: search ? (
          isNumeric ? [
            { number: { equals: parseInt(search) } },
          ] : [
            { client: { name: { contains: search, mode: "insensitive" } } },
            { client: { phone: { startsWith: search } } },
          ]
        ) : undefined,
      },
      include: { client: true, payments: true },
      orderBy: { number: "asc" },
      take: 100,
    });

    // Calcular el total real de abonos sumando todos los pagos
    const enriched = tickets.map((ticket) => {
      const totalPaid = ticket.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      return {
        ...ticket,
        amountPaid: totalPaid,
      };
    });

    return NextResponse.json({ success: true, tickets: enriched });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}