import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_SECRET = process.env.BOT_SECRET || 'colrifas-bot-2025';

const ESTADO_TEXTO: Record<string, string> = {
  AVAILABLE: 'Disponible ✅',
  RESERVED: 'Reservado ⏳',
  PARTIAL: 'Con abono 💰',
  PAID: 'Pagado ❌',
  RELEASED: 'Liberado ✅',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const numeroParam = searchParams.get('numero');

  if (token !== BOT_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!numeroParam || !/^\d{1,4}$/.test(numeroParam)) {
    return NextResponse.json(
      { error: 'Número inválido' },
      { status: 400 }
    );
  }

  const numero = parseInt(numeroParam, 10);

  try {
    const raffle = await prisma.raffle.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!raffle) {
      return NextResponse.json({ error: 'No hay rifa activa' }, { status: 404 });
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        raffleId: raffle.id,
        number: numero,
      },
      select: { number: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json({
        disponible: false,
        mensaje_whatsapp: `El número *${numeroParam.padStart(4, '0')}* no existe.`,
      });
    }

    const disponible = ticket.status === 'AVAILABLE';
    const numeroFormateado = ticket.number.toString().padStart(4, '0');

    return NextResponse.json({
      numero: numeroFormateado,
      disponible,
      estado: ticket.status,
      estado_texto: ESTADO_TEXTO[ticket.status] ?? ticket.status,
      mensaje_whatsapp: disponible
        ? `✅ ¡El número *${numeroFormateado}* está disponible! ¿Lo apartamos para ti?`
        : `❌ El número *${numeroFormateado}* no está disponible (${ESTADO_TEXTO[ticket.status] ?? ticket.status}).\n\n¿Tienes otro favorito o quieres que te enviemos la lista de disponibles?`,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error verificando el número' },
      { status: 500 }
    );
  }
}
