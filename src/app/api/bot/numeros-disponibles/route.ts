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
    const numeros: string[] = [];

    for (let i = 0; i <= 9; i++) {
      const tickets = await prisma.ticket.findMany({
        where: {
          status: 'AVAILABLE',
          number: { startsWith: i.toString() },
        },
        take: 20,
        select: { number: true },
      });

      const mezclados = tickets
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      mezclados.forEach((t) => numeros.push(t.number));
    }

    const mensaje = numeros
      .sort()
      .reduce((acc: Record<string, string[]>, num) => {
        const rango = `${num[0]}000 - ${num[0]}999`;
        if (!acc[rango]) acc[rango] = [];
        acc[rango].push(num);
        return acc;
      }, {});

    const mensaje_whatsapp = Object.entries(mensaje)
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
