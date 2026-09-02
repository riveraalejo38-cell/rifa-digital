import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Agrega, de forma segura e idempotente, las columnas necesarias para
// registrar quién asignó cada boleta y quién registró cada abono.
// Solo un ADMIN autenticado puede ejecutar esta migración.
export async function POST() {
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

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "assignedById" TEXT;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "assignedByName" TEXT;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "createdById" TEXT;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "createdByName" TEXT;`
    );

    return NextResponse.json({ success: true, message: "Migración de atribución aplicada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error al migrar" },
      { status: 500 }
    );
  }
}
