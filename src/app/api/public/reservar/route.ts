import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, no-cache, must-revalidate" };

// Máximo de boletas que un mismo cliente (identificado por teléfono) puede
// tener activas al mismo tiempo al comprar por la página pública, sin pasar
// por un vendedor. Regla explícita del dueño del negocio.
const MAX_BOLETAS_POR_CLIENTE = 4;

// Ruta PÚBLICA (sin sesión): permite que un visitante reserve una boleta él
// mismo desde la página de compra, sin necesitar un vendedor. A propósito
// SOLO reserva (nunca registra abono/pago aquí): el cliente separa el
// número y después envía el comprobante por WhatsApp; el vendedor o admin
// es quien registra el abono/pago ya confirmado en su panel.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { number, name, phone, city } = body;

    const nombre = typeof name === "string" ? name.trim() : "";
    const telefono = typeof phone === "string" ? phone.trim() : "";
    const ciudad = typeof city === "string" ? city.trim() : "";

    if (!nombre) {
      return NextResponse.json({ success: false, error: "Ingresa tu nombre completo" }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (!telefono) {
      return NextResponse.json({ success: false, error: "Ingresa tu número de teléfono (lo necesitas para enviar el comprobante por WhatsApp)" }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (typeof number !== "number" || !Number.isInteger(number) || number < 0) {
      return NextResponse.json({ success: false, error: "Número de boleta inválido" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const raffle = await prisma.raffle.findFirst({ where: { isActive: true } });
    if (!raffle) {
      return NextResponse.json({ success: false, error: "No hay un sorteo activo en este momento" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    if (number >= raffle.totalTickets) {
      return NextResponse.json({ success: false, error: `El número debe estar entre 0 y ${raffle.totalTickets - 1}` }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const ticketPrice = Number(raffle.ticketPrice);

    const ticket = await prisma.ticket.findFirst({ where: { raffleId: raffle.id, number } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Esa boleta no existe" }, { status: 404, headers: NO_STORE_HEADERS });
    }
    if (ticket.status !== "AVAILABLE") {
      return NextResponse.json({ success: false, error: "Uy, esa boleta ya no está disponible. Por favor elige otro número." }, { status: 409, headers: NO_STORE_HEADERS });
    }

    // Límite de boletas activas por cliente, contando por teléfono (no por
    // registro de cliente puntual, ya que cada compra crea su propio
    // registro): boletas que siguen ocupadas (no AVAILABLE) de este sorteo,
    // cuyo cliente actual tenga este mismo teléfono.
    const boletasActivas = await prisma.ticket.count({
      where: {
        raffleId: raffle.id,
        status: { not: "AVAILABLE" },
        client: { phone: telefono },
      },
    });
    if (boletasActivas >= MAX_BOLETAS_POR_CLIENTE) {
      return NextResponse.json(
        { success: false, error: `Ya tienes ${MAX_BOLETAS_POR_CLIENTE} boletas reservadas con este número de teléfono, que es el máximo permitido por persona. Escríbenos por WhatsApp si necesitas más.` },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: { name: nombre, phone: telefono, city: ciudad || null },
      });

      // Se revalida adentro de la transacción para evitar que dos compradores
      // reserven la misma boleta al mismo tiempo (condición de carrera).
      const ticketFresco = await tx.ticket.findUnique({ where: { id: ticket.id } });
      if (!ticketFresco || ticketFresco.status !== "AVAILABLE") {
        throw new Error("BOLETA_YA_NO_DISPONIBLE");
      }

      // Siempre RESERVED con monto 0: la página pública solo separa el
      // número. El abono/pago se registra después, ya con el comprobante
      // en mano, desde el panel de vendedor/admin.
      await tx.payment.create({
        data: {
          ticketId: ticket.id,
          clientId: client.id,
          amount: 0,
          status: "CONFIRMED",
          notes: "Boleta reservada desde la página web",
          createdByName: "Cliente (página web)",
        },
      });

      const updated = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          clientId: client.id,
          status: "RESERVED",
          amountPaid: 0,
          reservedAt: new Date(),
          paidAt: null,
          assignedByName: "Compra web",
          releasedAt: null,
          releasedById: null,
          releasedByName: null,
        },
      });

      return updated;
    });

    return NextResponse.json(
      {
        success: true,
        ticket: {
          number: result.number,
          status: result.status,
          ticketPrice,
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    if (error?.message === "BOLETA_YA_NO_DISPONIBLE") {
      return NextResponse.json(
        { success: false, error: "Uy, justo se acaba de reservar por alguien más. Por favor elige otro número." },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la reserva" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
