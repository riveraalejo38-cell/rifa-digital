import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const vendedores = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ success: true, vendedores });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, username, password, role } = await request.json();

    if (!name || !username || !password) {
      return NextResponse.json(
        { success: false, error: "Nombre, usuario y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const existe = await prisma.user.findUnique({ where: { username } });
    if (existe) {
      return NextResponse.json(
        { success: false, error: "Ese nombre de usuario ya existe" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const vendedor = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        role: role || "VENDEDOR",
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, vendedor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, isActive, password } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID obligatorio" },
        { status: 400 }
      );
    }

    const data: any = {};
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const vendedor = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, vendedor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}