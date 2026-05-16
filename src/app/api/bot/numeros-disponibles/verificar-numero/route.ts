import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_SECRET = process.env.BOT_SECRET || 'colrifas-bot-2025';

const ESTADO_TEXTO: Record<string, string> = {
  AVAILABLE: 'Disponible ✅',
  RESERVADA: 'Reservado ⏳',
  ABONO: 'Con abono 💰',
  PAGADA: 'Pagado ❌',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const numero = searchParams.get('numero');

  if (token !== BOT_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!numero || !/^\d{4}$/.test(numero)) {
    return NextResponse.json(
      { error: 'El número debe tener exactamente 4 dígitos' },
      { status: 400 }
    );
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { number: numero },
      select: { number: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json({
        disponible: false,
        mensaje_whatsapp: `El número *${numero}* no existe en el sistema.`,
      });
    }

    const disponible = ticket.status === 'AVAILABLE';

    return NextResponse.json({
      numero: ticket.number,
      disponible,
      estado: ticket.status,
      estado_texto: ESTADO_TEXTO[ticket.status] ?? ticket.status,
      mensaje_whatsapp: disponible
        ? `✅ ¡El número *${numero}* está disponible! ¿Lo apartamos para ti?`
        : `❌ El número *${numero}* no está disponible (${ESTADO_TEXTO[ticket.status] ?? ticket.status}).\n\n¿Tienes otro favorito o quieres que te enviemos la lista de disponibles?`,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error verificando el número' },
      { status: 500 }
    );
  }
}
