import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export const runtime = "nodejs";

const TICKET_PRICE = 80000;

const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

const FONT_URLS: Record<string, string> = {
  "Poppins-ExtraBold.ttf":
    "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-ExtraBold.ttf",
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

async function loadLocalFont(
  origin: string,
  path: string
): Promise<ArrayBuffer> {
  const cached = fontCache.get(path);
  if (cached) return cached;

  const res = await fetch(`${origin}${path}`);

  if (!res.ok) {
    throw new Error(`No se pudo cargar la fuente local: ${path}`);
  }

  const buf = await res.arrayBuffer();
  fontCache.set(path, buf);
  return buf;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
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
    { value: ticket.client?.name || "—" },
    { value: ticket.client?.city || "—" },
    { value: ticket.client?.phone || "—" },
    { value: ticket.assignedByName || "—" },
  ];

  const [poppinsExtra, caveat] = await Promise.all([
    loadFont("Poppins-ExtraBold.ttf"),
    loadLocalFont(origin, "/fonts/Caveat-Bold.ttf"),
  ]);

  const CANVAS_W = 1670;
  const CANVAS_H = 942;

  const INK = "#1C1C1C";

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
        {/* ══ FONDO EXACTO ══ */}
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

        {/* ═══════════════════════════════════════════════
            DATOS DEL TITULAR
            Ajustados dentro de la zona inferior
            de cada recuadro.
           ═══════════════════════════════════════════════ */}

        {(
          [
            {
              top: 300,
              height: 44,
              value: campos[0].value,
              fontSize:
                campos[0].value.length > 25
                  ? 23
                  : campos[0].value.length > 18
                  ? 26
                  : 29,
            },
            {
              top: 377,
              height: 43,
              value: campos[1].value,
              fontSize:
                campos[1].value.length > 18
                  ? 23
                  : campos[1].value.length > 12
                  ? 26
                  : 29,
            },
            {
              top: 449,
              height: 43,
              value: campos[2].value,
              fontSize:
                campos[2].value.length > 12
                  ? 22
                  : campos[2].value.length > 10
                  ? 25
                  : 28,
            },
            {
              top: 521,
              height: 42,
              value: campos[3].value,
              fontSize:
                campos[3].value.length > 20
                  ? 23
                  : campos[3].value.length > 14
                  ? 26
                  : 29,
            },
          ] as const
        ).map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              position: "absolute",
              top: `${c.top}px`,
              left: "1226px",
              width: "352px",
              height: `${c.height}px`,
              alignItems: "flex-end",
              justifyContent: "flex-start",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Caveat",
                fontWeight: 700,
                fontSize: `${c.fontSize}px`,
                color: INK,
                lineHeight: 1,
                paddingLeft: "5px",
                paddingBottom: "1px",
                paddingRight: "8px",
                maxWidth: "338px",
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
                fontFamily: "Caveat",
                fontWeight: 700,
                fontSize: "20px",
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
          name: "Caveat",
          data: caveat,
          weight: 700,
          style: "normal",
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
}
