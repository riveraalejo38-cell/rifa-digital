import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_SECRET = process.env.BOT_SECRET || 'colrifas-bot-2025';

function shuffle(arr: number[]): number[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('token') !== BOT_SECRET)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const raffle = await prisma.raffle.findFirst({ where: { isActive: true }, select: { id: true } });
  if (!raffle) return NextResponse.json({ error: 'No hay rifa activa' }, { status: 404 });

  const totalDisponibles = await prisma.ticket.count({ where: { raffleId: raffle.id, status: 'AVAILABLE' } });
  const tamano = totalDisponibles > 2000 ? 50 : 25;
  const base = Math.floor(tamano / 10);

  const rangos = await Promise.all(
    Array.from({ length: 10 }, (_, i) => i).map(async (i) => {
      const tickets = await prisma.ticket.findMany({
        where: { raffleId: raffle.id, status: 'AVAILABLE', number: { gte: i * 1000, lte: i * 1000 + 999 } },
        select: { number: true },
        take: 100,
      });
      const nums = shuffle(tickets.map((t) => t.number));
      return { i, nums, puede: Math.max(0, nums.length - 1) };
    })
  );

  const asignado = rangos.map((r) => ({ ...r, n: Math.min(r.puede, base) }));
  let deficit = tamano - asignado.reduce((s, a) => s + a.n, 0);

  while (deficit > 0) {
    const conSobrante = asignado.filter((a) => a.puede > a.n).sort((a, b) => (b.puede - b.n) - (a.puede - a.n));
    if (!conSobrante.length) break;
    for (const a of conSobrante) {
      if (!deficit) break;
      a.n++; deficit--;
    }
  }

  const numeros: number[] = [];
  asignado.forEach((a) => numeros.push(...a.nums.slice(0, a.n)));
  numeros.sort((a, b) => a - b);

  const grouped = numeros.reduce((acc: Record<string, string[]>, num) => {
    const key = `${String(Math.floor(num / 1000) * 1000).padStart(4,'0')} - ${String(Math.floor(num / 1000) * 1000 + 999).padStart(4,'0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(num.toString().padStart(4, '0'));
    return acc;
  }, {});

  const mensaje_whatsapp = Object.entries(grouped)
    .map(([rango, nums]) => `*${rango}:* ${nums.join(' - ')}`)
    .join('\n');

  return NextResponse.json({ disponibles: numeros, total: numeros.length, mensaje_whatsapp, actualizado: new Date().toISOString() });
}
