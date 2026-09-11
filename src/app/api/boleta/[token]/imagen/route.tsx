import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export const runtime = "nodejs";

const TICKET_PRICE = 80000;

const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

// Poppins se descarga una sola vez de Google Fonts (repositorio oficial, de uso libre)
// y queda en memoria del servidor. Caveat se sirve como archivo estático propio del
// proyecto (public/fonts) porque Google solo publica su versión variable, que el
// renderizador de imágenes no soporta — se generó una instancia fija en negrita.
const FONT_URLS: Record<string, string> = {
  "Poppins-ExtraBold.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-ExtraBold.ttf",
};

const fontCache = new Map<string, ArrayBuffer>();

async function loadFont(file: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(file);
  if (cached) return cached;
  const res = await fetch(FONT_URLS[file]);
  const buf = await res.arrayBuffer();
  fontCache.set(file, buf);
  return buf;
}

async function loadLocalFont(origin: string, path: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(path);
  if (cached) return cached;
  const res = await fetch(`${origin}${path}`);
  const buf = await res.arrayBuffer();
  fontCache.set(path, buf);
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
      payments: { where: { status: "CONFIRMED" }, orderBy: { createdAt: "asc" } },
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
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
  });

  let acumulado = 0;
  const filas = ticket.payments.map((p) => {
    acumulado += Number(p.amount);
    const f = new Date(p.createdAt);
    return {
      fecha: `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}/${f.getFullYear()}`,
      abono: formatPeso(Number(p.amount)),
      saldo: formatPeso(Math.max(0, TICKET_PRICE - acumulado)),
    };
  });

  // La colilla de esta plantilla tiene 3 casillas fijas para abonos.
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

  // ══════════════════════════════════════════════════════════════════════════
  // La imagen de referencia del cliente se usa TAL CUAL, como fondo fijo del
  // lienzo, en su tamaño original (1152×632). No se redibuja ni se modifica:
  // solo se colocan campos dinámicos encima, en las coordenadas exactas de
  // cada casilla ya impresa en la plantilla (medidas píxel por píxel).
  // ══════════════════════════════════════════════════════════════════════════
  const CANVAS_W = 1152;
  const CANVAS_H = 632;
  const CREAM = "#F2EBDD";
  const INK = "#1C1C1C";
  const GOLD_GRAD = "linear-gradient(90deg, #A6702F 0%, #F7D27A 25%, #FFF8E8 50%, #F7D27A 75%, #A6702F 100%)";

  // Filas de abonos: 3 casillas fijas, con alturas tal como están impresas.
  const ROWS = [
    { top: 452, height: 22 },
    { top: 476, height: 17 },
    { top: 495, height: 14 },
  ];

  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: `${CANVAS_W}px`, height: `${CANVAS_H}px` }}>
        {/* ══ Fondo exacto — la imagen de referencia del cliente, sin alterar ══ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${origin}/boleta-plantilla-fondo.png`}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ position: "absolute", top: 0, left: 0, width: `${CANVAS_W}px`, height: `${CANVAS_H}px` }}
          alt=""
        />

        {/* ══ N.° de boleta — afiche (panel izquierdo) ══ */}
        <div style={{ display: "flex", position: "absolute", top: "128px", left: "43px", width: "165px", height: "54px", background: GOLD_GRAD, borderRadius: "6px" }} />
        <div style={{ display: "flex", position: "absolute", top: "128px", left: "43px", width: "165px", height: "54px", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", fontFamily: "Poppins", fontWeight: 800, fontSize: "36px", color: "#171205", letterSpacing: "1px" }}>{numero}</div>
        </div>

        {/* ══ N.° de boleta — colilla ══ */}
        <div style={{ display: "flex", position: "absolute", top: "152px", left: "905px", width: "163px", height: "46px", background: GOLD_GRAD, borderRadius: "6px" }} />
        <div style={{ display: "flex", position: "absolute", top: "152px", left: "905px", width: "163px", height: "46px", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", fontFamily: "Poppins", fontWeight: 800, fontSize: "32px", color: "#171205", letterSpacing: "1px" }}>{numero}</div>
        </div>

        {/* ══ Datos del titular — casillas de la colilla ══ */}
        {(
          [
            { top: 203, height: 45, value: campos[0].value },
            { top: 253, height: 47, value: campos[1].value },
            { top: 307, height: 48, value: campos[2].value },
            { top: 360, height: 48, value: campos[3].value },
          ] as const
        ).map((c, i) => {
          const len = c.value.length;
          const fontSize = len > 28 ? 18 : len > 22 ? 21 : len > 17 ? 24 : 26;
          return (
            <div key={i} style={{ display: "flex", position: "absolute", top: `${c.top}px`, left: "868px", width: "240px", height: `${c.height}px` }}>
              <div style={{ display: "flex", width: "240px", height: `${c.height}px`, background: CREAM, position: "absolute", top: 0, left: 0 }} />
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  fontFamily: "Caveat",
                  fontWeight: 700,
                  fontSize: `${fontSize}px`,
                  color: INK,
                  alignItems: "flex-end",
                  height: `${c.height}px`,
                  paddingLeft: "6px",
                  paddingBottom: "3px",
                  maxWidth: "234px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.value}
              </div>
            </div>
          );
        })}

        {/* ══ Control de abonos — 3 casillas fijas ══ */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "452px",
            left: "868px",
            width: "240px",
            height: "72px",
            background: CREAM,
          }}
        />

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
                left: "870px",
                width: "236px",
                height: `${row.height}px`,
                flexDirection: "row",
                alignItems: "flex-end",
                paddingBottom: "1px",
                fontFamily: "Caveat",
                fontWeight: 700,
                fontSize: "16px",
                color: INK,
              }}
            >
              <div style={{ display: "flex", width: "88px" }}>{fila.fecha}</div>
              <div style={{ display: "flex", width: "74px" }}>{fila.abono}</div>
              <div style={{ display: "flex", width: "74px" }}>{fila.saldo}</div>
            </div>
          );
        })}

        {/* ══ QR — se cubre el código de muestra y se coloca el real ══ */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "522px",
            left: "868px",
            width: "70px",
            height: "62px",
            background: CREAM,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          width={62}
          height={62}
          style={{ position: "absolute", top: "523px", left: "872px", width: "62px", height: "62px" }}
          alt=""
        />

        {/* ══ Sello CANCELADO — capa gráfica superpuesta, no borra la información ══ */}
        {cancelada && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: "306px",
              left: "988px",
              transform: "translate(-50%, -50%) rotate(-14deg)",
              border: "4px solid #B4232C",
              borderRadius: "10px 20px 11px 18px",
              padding: "4px",
              opacity: 0.88,
            }}
          >
            <div
              style={{
                display: "flex",
                border: "2px solid #B4232C",
                borderRadius: "7px 16px 8px 14px",
                padding: "6px 22px",
                color: "#B4232C",
                fontSize: "28px",
                fontWeight: 800,
                fontFamily: "Poppins",
                letterSpacing: "1.5px",
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
        { name: "Poppins", data: poppinsExtra, weight: 800, style: "normal" },
        { name: "Caveat", data: caveat, weight: 700, style: "normal" },
      ],
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
}
