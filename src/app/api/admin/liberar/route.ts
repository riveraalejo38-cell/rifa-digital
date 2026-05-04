import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: "ticketId es obligatorio" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        clientId: null,
        status: "AVAILABLE",
        reservedAt: null,
        paidAt: null,
        amountPaid: null,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error" },
      { status: 500 }
    );
  }
}