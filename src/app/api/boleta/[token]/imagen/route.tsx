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
  // lienzo, en su tamaño original (1670×942). No se redibuja ni se modifica:
  // solo se colocan campos dinámicos encima, en las coordenadas exactas de
  // cada casilla ya impresa en la plantilla (medidas píxel por píxel).
  //
  // Esta plantilla trae sus casillas ya en blanco (sin número ni texto de
  // muestra "quemado" en la imagen), así que no hace falta cubrir nada antes
  // de escribir: el dato real se coloca directo sobre la casilla vacía.
  // ══════════════════════════════════════════════════════════════════════════
  const CANVAS_W = 1670;
  const CANVAS_H = 942;
  const INK = "#1C1C1C";

  // Filas de abonos: 3 casillas fijas, con alturas tal como están impresas.
  const ROWS = [
    { top: 653, height: 52 },
    { top: 709, height: 22 },
    { top: 735, height: 23 },
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
        <div style={{ display: "flex", position: "absolute", top: "195px", left: "65px", width: "222px", height: "68px", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", fontFamily: "Poppins", fontWeight: 800, fontSize: "46px", color: "#171205", letterSpacing: "1px" }}>{numero}</div>
        </div>

        {/* ══ N.° de boleta — colilla ══ */}
        <div style={{ display: "flex", position: "absolute", top: "221px", left: "1291px", width: "250px", height: "64px", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", fontFamily: "Poppins", fontWeight: 800, fontSize: "42px", color: "#171205", letterSpacing: "1px" }}>{numero}</div>
        </div>

        {/* ══ Datos del titular — casillas de la colilla ══ */}
        {(
          [
            { top: 326, height: 36, value: campos[0].value },
            { top: 406, height: 30, value: campos[1].value },
            { top: 480, height: 29, value: campos[2].value },
            { top: 553, height: 29, value: campos[3].value },
          ] as const
        ).map((c, i) => {
          const len = c.value.length;
          const fontSize = len > 28 ? 26 : len > 22 ? 30 : len > 17 ? 34 : 38;
          return (
            <div key={i} style={{ display: "flex", position: "absolute", top: `${c.top}px`, left: "1226px", width: "352px", height: `${c.height}px` }}>
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
                  maxWidth: "346px",
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
                alignItems: "flex-end",
                paddingBottom: "3px",
                fontFamily: "Caveat",
                fontWeight: 700,
                fontSize: "20px",
                color: INK,
              }}
            >
              <div style={{ display: "flex", width: "115px" }}>{fila.fecha}</div>
              <div style={{ display: "flex", width: "114px" }}>{fila.abono}</div>
              <div style={{ display: "flex", width: "109px" }}>{fila.saldo}</div>
            </div>
          );
        })}

        {/* ══ QR — se coloca directo sobre la casilla ya en blanco ══ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          width={72}
          height={72}
          style={{ position: "absolute", top: "768px", left: "1263px", width: "72px", height: "72px" }}
          alt=""
        />

        {/* ══ Sello CANCELADO — capa gráfica superpuesta, no borra la información ══ */}
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
        { name: "Poppins", data: poppinsExtra, weight: 800, style: "normal" },
        { name: "Caveat", data: caveat, weight: 700, style: "normal" },
      ],
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
}
