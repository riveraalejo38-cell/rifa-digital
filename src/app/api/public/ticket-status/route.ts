import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, no-cache, must-revalidate" };

// Ruta PÚBLICA (sin sesión): un visitante escribe un número de boleta y esto
// le dice si está disponible o no. A propósito NUNCA devuelve datos del
// cliente que la tenga (nombre/teléfono) — eso sería una fuga de datos
// personales de otro comprador hacia cualquier visitante anónimo.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const numberParam = searchParams.get("number") || "";

    if (!/^\d+$/.test(numberParam)) {
      return NextResponse.json(
        { success: false, error: "Escribe solo números" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const raffle = await prisma.raffle.findFirst({ where: { isActive: true } });
    if (!raffle) {
      return NextResponse.json(
        { success: false, error: "No hay un sorteo activo en este momento" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const number = parseInt(numberParam, 10);
    if (number < 0 || number >= raffle.totalTickets) {
      return NextResponse.json(
        { success: false, error: `El número debe estar entre 0 y ${raffle.totalTickets - 1}` },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const ticket = await prisma.ticket.findFirst({
      where: { raffleId: raffle.id, number },
      select: { status: true },
    });

    const available = !ticket || ticket.status === "AVAILABLE";

    return NextResponse.json(
      {
        success: true,
        number,
        available,
        ticketPrice: Number(raffle.ticketPrice),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error al consultar la boleta" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
