import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { token },
      include: {
        client: true,
        raffle: true,
        payments: {
          where: { status: "CONFIRMED" },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Boleta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error" },
      { status: 500 }
    );
  }
}