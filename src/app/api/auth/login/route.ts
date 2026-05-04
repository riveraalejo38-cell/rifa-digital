import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Usuario y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    // Buscar primero en Admin
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (admin) {
      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Contraseña incorrecta" },
          { status: 401 }
        );
      }
      const cookieStore = await cookies();
      cookieStore.set("session", JSON.stringify({ id: admin.id, role: "ADMIN", name: "Admin" }), {
        httpOnly: true, maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({ success: true, role: "ADMIN" });
    }

    // Buscar en usuarios vendedores
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("session", JSON.stringify({ id: user.id, role: user.role, name: user.name }), {
      httpOnly: true, maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}