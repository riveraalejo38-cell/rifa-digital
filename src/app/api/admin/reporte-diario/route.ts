import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const TICKET_PRICE = 80000;

// Reporte de movimientos de un día específico: boletas separadas sin abono,
// abonos registrados, pagos completados y el detalle de cada movimiento.
// Recibe ?date=YYYY-MM-DD (fecha local, Colombia -05:00). Solo ADMIN.
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { success: false, error: "Parámetro 'date' inválido (usa YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const raffle = await prisma.raffle.findFirst({ where: { isActive: true } });
    if (!raffle) {
      return NextResponse.json({ success: false, error: "No hay rifa activa" }, { status: 400 });
    }

    // Colombia no tiene horario de verano: offset fijo -05:00.
    const inicio = new Date(`${dateParam}T00:00:00-05:00`);
    const fin = new Date(`${dateParam}T23:59:59.999-05:00`);

    const pagosDelDia = await prisma.payment.findMany({
      where: {
        ticket: { raffleId: raffle.id },
        createdAt: { gte: inicio, lte: fin },
      },
      include: {
        ticket: { select: { id: true, number: true } },
        client: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (pagosDelDia.length === 0) {
      return NextResponse.json({
        success: true,
        fecha: dateParam,
        resumen: {
          ventasNuevas: 0,
          abonos: 0,
          montoAbonado: 0,
          pagosCompletos: 0,
          separadasSinAbono: 0,
          totalMovimientos: 0,
        },
        movimientos: [],
      });
    }

    const ticketIds = [...new Set(pagosDelDia.map((p) => p.ticketId))];

    // Para clasificar cada movimiento necesitamos el historial completo de
    // pagos de las boletas involucradas (para saber si es la primera vez
    // que se toca la boleta, y el acumulado hasta ese momento).
    const historial = await prisma.payment.findMany({
      where: { ticketId: { in: ticketIds } },
      orderBy: { createdAt: "asc" },
      select: { id: true, ticketId: true, amount: true, createdAt: true },
    });

    const historialPorTicket = new Map<string, typeof historial>();
    for (const p of historial) {
      const arr = historialPorTicket.get(p.ticketId) || [];
      arr.push(p);
      historialPorTicket.set(p.ticketId, arr);
    }

    let ventasNuevas = 0;
    let abonos = 0;
    let montoAbonado = 0;
    let pagosCompletos = 0;
    let separadasSinAbono = 0;

    const movimientos = pagosDelDia.map((p) => {
      const monto = Number(p.amount);
      const listaTicket = historialPorTicket.get(p.ticketId) || [];
      const esPrimerToque = listaTicket.length > 0 && listaTicket[0].id === p.id;

      let acumulado = 0;
      let acumuladoAnterior = 0;
      for (const evento of listaTicket) {
        if (new Date(evento.createdAt) <= new Date(p.createdAt)) {
          acumuladoAnterior = acumulado;
          acumulado += Number(evento.amount);
        }
      }

      let tipo: "SIN_ABONO" | "ABONO" | "PAGO_COMPLETO";
      if (monto === 0) {
        tipo = "SIN_ABONO";
        separadasSinAbono++;
      } else if (acumuladoAnterior < TICKET_PRICE && acumulado >= TICKET_PRICE) {
        tipo = "PAGO_COMPLETO";
        pagosCompletos++;
        montoAbonado += monto;
      } else {
        tipo = "ABONO";
        abonos++;
        montoAbonado += monto;
      }

      if (esPrimerToque) ventasNuevas++;

      return {
        id: p.id,
        hora: p.createdAt,
        ticketNumber: p.ticket.number,
        clienteName: p.client?.name || "-",
        clientePhone: p.client?.phone || "-",
        tipo,
        esVentaNueva: esPrimerToque,
        monto,
        vendedor: p.createdByName || "-",
      };
    });

    return NextResponse.json({
      success: true,
      fecha: dateParam,
      resumen: {
        ventasNuevas,
        abonos,
        montoAbonado,
        pagosCompletos,
        separadasSinAbono,
        totalMovimientos: movimientos.length,
      },
      movimientos,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error al generar el reporte" },
      { status: 500 }
    );
  }
}
