import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Esta ruta siempre debe leer el estado actual de la base de datos: nunca se
// debe servir una respuesta cacheada (ni por Next.js ni por el navegador),
// porque eso puede mostrar el nombre de un cliente que ya cambió (ver bug
// reportado: la boleta mostraba un nombre viejo en el panel de vendedor).
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";

    const raffle = await prisma.raffle.findFirst({
      where: { isActive: true },
    });

    if (!raffle) {
      return NextResponse.json({ success: false, error: "No hay rifa activa" }, { headers: NO_STORE_HEADERS });
    }

    const isNumeric = /^\d+$/.test(search);

    const orConditions: any[] = [];
    if (search) {
      // Los tres modos de búsqueda son EXCLUYENTES entre sí para que buscar
      // una boleta puntual nunca "arrastre" boletas de otros clientes:
      //  - 1 a 4 dígitos (con o sin ceros a la izquierda, ej "0001"): se
      //    interpreta como número de boleta y se exige coincidencia EXACTA.
      //    No se agregan alternativas por nombre/teléfono.
      //  - más de 4 dígitos: se interpreta como teléfono, y se busca
      //    ÚNICAMENTE por teléfono.
      //  - cualquier otro texto: se busca ÚNICAMENTE por nombre.
      if (isNumeric && search.length <= 4) {
        orConditions.push({ number: { equals: parseInt(search, 10) } });
      } else if (isNumeric) {
        orConditions.push({ client: { phone: { contains: search } } });
      } else {
        orConditions.push({ client: { name: { contains: search, mode: "insensitive" } } });
      }
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

    return NextResponse.json({ success: true, tickets: enriched }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
