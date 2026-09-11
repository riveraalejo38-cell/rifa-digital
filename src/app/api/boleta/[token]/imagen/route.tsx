import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export const runtime = "nodejs";

const TICKET_PRICE = 80000;

const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

const FONT_URLS: Record<string, string> = {
  "Poppins-ExtraBold.ttf":
    "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-ExtraBold.ttf",
  "Kalam-Regular.ttf":
    "https://raw.githubusercontent.com/google/fonts/main/ofl/kalam/Kalam-Regular.ttf",
};

const fontCache = new Map<string, ArrayBuffer>();

async function loadFont(file: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(file);
  if (cached) return cached;

  const res = await fetch(FONT_URLS[file]);

  if (!res.ok) {
    throw new Error(`No se pudo cargar la fuente: ${file}`);
  }

  const buf = await res.arrayBuffer();
  fontCache.set(file, buf);
  return buf;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // ── Lógica de datos: SIN CAMBIOS ──
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
    return new Response("Boleta no encontrada", { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const numero = String(ticket.number).padStart(4, "0");

  const boletaUrl = `${origin}/boleta/${token}`;

  const qrDataUrl = await QRCode.toDataURL(boletaUrl, {
    margin: 0,
    width: 200,
    color: {
      dark: "#0A0A0A",
      light: "#FFFFFF",
    },
  });

  let acumulado = 0;

  const filas = ticket.payments.map((p) => {
    acumulado += Number(p.amount);

    const f = new Date(p.createdAt);

    return {
      fecha: `${String(f.getDate()).padStart(2, "0")}/${String(
        f.getMonth() + 1
      ).padStart(2, "0")}/${f.getFullYear()}`,
      abono: formatPeso(Number(p.amount)),
      saldo: formatPeso(Math.max(0, TICKET_PRICE - acumulado)),
    };
  });

  const filasVisibles = filas.slice(-3);

  const cancelada = ticket.status === "PAID";

  const campos = [
    ticket.client?.name || "—",
    ticket.client?.city || "—",
    ticket.client?.phone || "—",
    ticket.assignedByName || "—",
  ];

  const [poppinsExtra, kalam] = await Promise.all([
    loadFont("Poppins-ExtraBold.ttf"),
    loadFont("Kalam-Regular.ttf"),
  ]);

  const CANVAS_W = 1670;
  const CANVAS_H = 942;

  const INK = "#1C1C1C";

  // Filas de abonos
  const ROWS = [
    { top: 653, height: 52 },
    { top: 709, height: 22 },
    { top: 735, height: 23 },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: `${CANVAS_W}px`,
          height: `${CANVAS_H}px`,
        }}
      >
        {/* Fondo exacto */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${origin}/boleta-plantilla-fondo.png?v=2`}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${CANVAS_W}px`,
            height: `${CANVAS_H}px`,
          }}
          alt=""
        />

        {/* ══ NÚMERO PRINCIPAL ══ */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "195px",
            left: "65px",
            width: "222px",
            height: "68px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Poppins",
              fontWeight: 800,
              fontSize: "46px",
              color: "#171205",
              letterSpacing: "1px",
            }}
          >
            {numero}
          </div>
        </div>

        {/* ══ NÚMERO COLILLA ══ */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "221px",
            left: "1291px",
            width: "250px",
            height: "64px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Poppins",
              fontWeight: 800,
              fontSize: "42px",
              color: "#171205",
              letterSpacing: "1px",
            }}
          >
            {numero}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            DATOS DEL TITULAR
            Fuente manuscrita tipo lapicero
           ══════════════════════════════════════════════════════ */}

        {[
          {
            top: 297,
            height: 75,
            value: campos[0],
            fontSize: campos[0].length > 25 ? 28 : 34,
          },
          {
            top: 380,
            height: 72,
            value: campos[1],
            fontSize: campos[1].length > 18 ? 27 : 33,
          },
          {
            top: 458,
            height: 65,
            value: campos[2],
            fontSize: campos[2].length > 12 ? 26 : 31,
          },
          {
            top: 532,
            height: 66,
            value: campos[3],
            fontSize: campos[3].length > 20 ? 27 : 32,
          },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              position: "absolute",
              top: `${c.top}px`,
              left: "1226px",
              width: "352px",
              height: `${c.height}px`,
              alignItems: "center",
              justifyContent: "flex-start",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Kalam",
                fontWeight: 400,
                fontSize: `${c.fontSize}px`,
                color: INK,
                lineHeight: 1,
                paddingLeft: "7px",
                paddingRight: "6px",
                maxWidth: "346px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.value}
            </div>
          </div>
        ))}

        {/* ══ CONTROL DE ABONOS ══ */}

        {[0, 1, 2].map((i) => {
          const fila = filasVisibles[i];

          if (!fila) return null;

          const row = ROWS[i];

          return (
            <div
              key={i}
              style={{
                display: "flex",
                position: "absolute",
                top: `${row.top}px`,
                left: "1244px",
                width: "338px",
                height: `${row.height}px`,
                flexDirection: "row",
                alignItems: "center",
                fontFamily: "Kalam",
                fontWeight: 400,
                fontSize: "18px",
                lineHeight: 1,
                color: INK,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "115px",
                  paddingLeft: "2px",
                }}
              >
                {fila.fecha}
              </div>

              <div
                style={{
                  display: "flex",
                  width: "114px",
                  paddingLeft: "2px",
                }}
              >
                {fila.abono}
              </div>

              <div
                style={{
                  display: "flex",
                  width: "109px",
                  paddingLeft: "2px",
                }}
              >
                {fila.saldo}
              </div>
            </div>
          );
        })}

        {/* ══ QR ══ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          width={72}
          height={72}
          style={{
            position: "absolute",
            top: "768px",
            left: "1263px",
            width: "72px",
            height: "72px",
          }}
          alt=""
        />

        {/* ══ CANCELADO ══ */}
        {cancelada && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: "440px",
              left: "1405px",
              transform: "translate(-50%, -50%) rotate(-14deg)",
              border: "6px solid #B4232C",
              borderRadius: "14px 29px 16px 26px",
              padding: "6px",
              opacity: 0.88,
            }}
          >
            <div
              style={{
                display: "flex",
                border: "3px solid #B4232C",
                borderRadius: "10px 23px 12px 20px",
                padding: "9px 32px",
                color: "#B4232C",
                fontSize: "41px",
                fontWeight: 800,
                fontFamily: "Poppins",
                letterSpacing: "2px",
              }}
            >
              CANCELADO
            </div>
          </div>
        )}
      </div>
    ),
    {
      width: CANVAS_W,
      height: CANVAS_H,

      fonts: [
        {
          name: "Poppins",
          data: poppinsExtra,
          weight: 800,
          style: "normal",
        },
        {
          name: "Kalam",
          data: kalam,
          weight: 400,
          style: "normal",
        },
      ],

      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
}
