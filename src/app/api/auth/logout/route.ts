import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  const url = new URL(request.url);
  return NextResponse.redirect(`${url.origin}/login`);
}
