import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generarBoletas(): number[] {
  const boletas: number[] = [];
  for (let i = 0; i <= 9999; i++) {
    boletas.push(i);
  }
  return boletas;
}

export async function POST() {
  try {
    // 1. Crear admin
    const existingAdmin = await prisma.admin.findFirst({
      where: { username: "admin" },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("Admin123!", 12);
      await prisma.admin.create({
        data: { username: "admin", passwordHash },
      });
    }

    // 2. Crear o actualizar rifa
    let raffle = await prisma.raffle.findFirst({
      where: { isActive: true },
    });

    if (raffle) {
      raffle = await prisma.raffle.update({
        where: { id: raffle.id },
        data: {
          name: "ColRifas",
          description: "¡Participa y gana grandes premios!",
          prize: "Camioneta + 2 Motos + $10.000.000 en efectivo",
          ticketPrice: 70000,
          totalTickets: 10000,
          drawDate: new Date("2025-12-31"),
        },
      });
    } else {
      raffle = await prisma.raffle.create({
        data: {
          name: "ColRifas",
          description: "¡Participa y gana grandes premios!",
          prize: "Camioneta + 2 Motos + $10.000.000 en efectivo",
          ticketPrice: 70000,
          totalTickets: 10000,
          drawDate: new Date("2025-12-31"),
          isActive: true,
        },
      });
    }

    // 3. Borrar boletas anteriores
    await prisma.ticket.deleteMany({
      where: { raffleId: raffle.id },
    });

    // 4. Generar 10.000 boletas del 0000 al 9999
    const numeros = generarBoletas();
    const BATCH_SIZE = 500;
    let created = 0;

    for (let i = 0; i < numeros.length; i += BATCH_SIZE) {
      const batch = numeros.slice(i, i + BATCH_SIZE).map((numero) => ({
        number: numero,
        raffleId: raffle!.id,
      }));
      await prisma.ticket.createMany({ data: batch });
      created += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${created} boletas creadas correctamente`,
      raffleId: raffle.id,
      total: created,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error al inicializar" },
      { status: 500 }
    );
  }
}