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
    // El número de boleta es un entero de 32 bits en la base de datos: un teléfono
    // completo (10 dígitos) desborda ese rango y hace fallar la consulta si se
    // intenta comparar contra `number`. Solo se busca por número cuando el valor
    // cabe en un int de 32 bits (los números de boleta reales son de máximo 4-5 cifras).
    const numericValue = isNumeric ? Number(search) : null;
    const numberSearchable = isNumeric && numericValue !== null && numericValue <= 2147483647;

    const orConditions: any[] = [];
    if (search) {
      if (numberSearchable) {
        orConditions.push({ number: { equals: numericValue } });
      }
      orConditions.push({ client: { name: { contains: search, mode: "insensitive" } } });
      orConditions.push({ client: { phone: { contains: search } } });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        raffleId: raffle.id,
        status: status ? (status as any) : undefined,
        OR: orConditions.length ? orConditions : undefined,
      },
      include: {
        client: true,
        payments: true,
        claims: { where: { status: "PENDING" }, select: { id: true, claimedByName: true } },
      },
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
