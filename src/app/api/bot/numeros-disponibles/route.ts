import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_SECRET = process.env.BOT_SECRET || 'colrifas-bot-2025';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (token !== BOT_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const raffle = await prisma.raffle.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!raffle) {
      return NextResponse.json({ error: 'No hay rifa activa' }, { status: 404 });
    }

    const numeros: number[] = [];

    for (let i = 0; i <= 9; i++) {
      const tickets = await prisma.ticket.findMany({
        where: {
          raffleId: raffle.id,
          status: 'AVAILABLE',
          number: {
            gte: i * 1000,
            lte: i * 1000 + 999,
          },
        },
        take: 20,
        select: { number: true },
      });

      const shuffled = tickets
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      shuffled.forEach((t) => numeros.push(t.number));
    }

    const grouped = numeros.sort((a, b) => a - b).reduce((acc: Record<string, string[]>, num) => {
      const rangeKey = `${Math.floor(num / 1000) * 1000} - ${Math.floor(num / 1000) * 1000 + 999}`;
      if (!acc[rangeKey]) acc[rangeKey] = [];
      acc[rangeKey].push(num.toString().padStart(4, '0'));
      return acc;
    }, {});

    const mensaje_whatsapp = Object.entries(grouped)
      .map(([rango, nums]) => `📌 *${rango}:* ${nums.join(' · ')}`)
      .join('\n');

    return NextResponse.json({
      disponibles: numeros,
      total: numeros.length,
      mensaje_whatsapp,
      actualizado: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error consultando números' },
      { status: 500 }
    );
  }
}
