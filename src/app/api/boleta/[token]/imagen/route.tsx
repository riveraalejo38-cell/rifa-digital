import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export const runtime = "nodejs";

const TICKET_PRICE = 80000;

const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

// Las fuentes se descargan una sola vez de Google Fonts (repositorio oficial, de uso libre)
// y quedan en memoria del servidor — no hay que subir archivos de fuentes al proyecto.
const FONT_URLS: Record<string, string> = {
  "Poppins-ExtraBold.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-ExtraBold.ttf",
  "Anton-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf",
  "Kalam-Bold.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/kalam/Kalam-Bold.ttf",
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // ── Lógica de datos: SIN CAMBIOS ──
  // Misma consulta a la base de datos, mismo cálculo de estado/saldo,
  // misma librería y misma URL para el QR.
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

  // La colilla de la plantilla tiene una cuadrícula fija de 4 filas para abonos.
  // Si hay más de 4 pagos registrados, se muestran los 4 más recientes
  // (el saldo de cada fila ya viene calculado de forma acumulada y sigue siendo correcto).
  const filasVisibles = filas.slice(-4);

  // Estado: misma lógica de negocio (RESERVED/PARTIAL/PAID ya vienen calculados
  // por /api/admin/asignar), solo cambia cómo se presenta cada uno visualmente.
  const cancelada = ticket.status === "PAID";

  // Orden y campos tal como aparecen en la colilla de la plantilla de referencia.
  const campos = [
    { label: "NOMBRE", value: ticket.client?.name || "—" },
    { label: "CIUDAD", value: ticket.client?.city || "—" },
    { label: "CELULAR", value: ticket.client?.phone || "—" },
    { label: "VENDEDOR", value: ticket.assignedByName || "—" },
  ];

  const [poppinsExtra, anton, kalamBold] = await Promise.all([
    loadFont("Poppins-ExtraBold.ttf"),
    loadFont("Anton-Regular.ttf"),
    loadFont("Kalam-Bold.ttf"),
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // La imagen de referencia del cliente se usa TAL CUAL, como fondo fijo del
  // lienzo, en su tamaño original (1150×725). No se redibuja ni se modifica:
  // solo se colocan campos dinámicos encima, en las coordenadas exactas de
  // cada casilla ya impresa en la plantilla (medidas píxel por píxel sobre la
  // propia imagen). Antes de escribir el dato real, se cubre el valor de
  // muestra de la plantilla con un parche del mismo color de fondo del sitio
  // exacto donde estaba (dorado del sello, o crema de la casilla), para que
  // no se vea el texto de ejemplo debajo del dato real.
  // ══════════════════════════════════════════════════════════════════════════
  const CANVAS_W = 1150;
  const CANVAS_H = 725;
  const GOLD_GRAD = "linear-gradient(135deg, #F3DA9E, #C79A44)";
  const CREAM = "#F2EFE9";
  const CARD_WHITE = "#F8F6F3";
  const INK_BLUE = "#1E3A5F";

  // Filas de la tabla de abonos: 4 casillas fijas ya impresas en la plantilla.
  const TABLE_TOP = 493;
  const TABLE_ROW_H = 21.25;

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
        {/* ══ Fondo exacto — la imagen de referencia del cliente, sin alterar ══ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${origin}/boleta-plantilla-fondo.png`}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ position: "absolute", top: 0, left: 0, width: `${CANVAS_W}px`, height: `${CANVAS_H}px` }}
          alt=""
        />

        {/* ══ N.° de boleta — afiche (panel principal) ══ */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "541px",
            left: "33px",
            width: "147px",
            height: "62px",
            background: GOLD_GRAD,
            borderRadius: "4px 10px 4px 10px",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "541px",
            left: "33px",
            width: "147px",
            height: "62px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", fontFamily: "Anton", fontSize: "34px", color: "#171205", letterSpacing: "1px" }}>{numero}</div>
        </div>

        {/* ══ N.° de boleta — colilla ══ */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "205px",
            left: "884px",
            width: "204px",
            height: "47px",
            background: GOLD_GRAD,
            borderRadius: "4px 12px 4px 12px",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "205px",
            left: "884px",
            width: "204px",
            height: "47px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", fontFamily: "Anton", fontSize: "40px", color: "#171205", letterSpacing: "1px" }}>{numero}</div>
        </div>

        {/* ══ Datos del titular — casillas de la colilla ══ */}
        {(
          [
            { top: 277, height: 23, value: campos[0].value },
            { top: 322, height: 22, value: campos[1].value },
            { top: 366, height: 23, value: campos[2].value },
            { top: 412, height: 33, value: campos[3].value },
          ] as const
        ).map((c, i) => (
          <div key={i} style={{ display: "flex", position: "absolute", top: `${c.top}px`, left: "905px" }}>
            <div style={{ display: "flex", width: "203px", height: `${c.height}px`, background: CREAM, position: "absolute", top: 0, left: 0 }} />
            <div
              style={{
                display: "flex",
                position: "relative",
                fontFamily: "Kalam",
                fontWeight: 700,
                fontSize: "17px",
                color: INK_BLUE,
                alignItems: "center",
                height: `${c.height}px`,
                paddingLeft: "2px",
                maxWidth: "203px",
                overflow: "hidden",
              }}
            >
              {c.value}
            </div>
          </div>
        ))}

        {/* ══ Control de abonos — cuadrícula fija de 4 filas ══ */}
        {/* La fila 0 trae un dato de muestra impreso en la plantilla; se cubre
            antes de escribir el abono real (si existe). Las filas 1-3 ya están
            en blanco en la plantilla. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: `${TABLE_TOP}px`,
            left: "902px",
            width: "208px",
            height: `${TABLE_ROW_H}px`,
            background: "#F4F1EB",
          }}
        />

        {[0, 1, 2, 3].map((i) => {
          const fila = filasVisibles[i];
          if (!fila) return null;
          const top = TABLE_TOP + i * TABLE_ROW_H;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                position: "absolute",
                top: `${top}px`,
                left: "905px",
                width: "202px",
                height: `${TABLE_ROW_H}px`,
                flexDirection: "row",
                alignItems: "center",
                fontFamily: "Kalam",
                fontWeight: 700,
                fontSize: "12px",
                color: INK_BLUE,
              }}
            >
              <div style={{ display: "flex", width: "68px" }}>{fila.fecha}</div>
              <div style={{ display: "flex", width: "72px" }}>{fila.abono}</div>
              <div style={{ display: "flex", width: "62px", justifyContent: "flex-end" }}>{fila.saldo}</div>
            </div>
          );
        })}

        {/* ══ QR — se cubre el código de muestra y se coloca el real ══ */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "596px",
            left: "893px",
            width: "87px",
            height: "67px",
            background: CARD_WHITE,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          width={80}
          height={80}
          style={{ position: "absolute", top: "596px", left: "896px", width: "80px", height: "80px" }}
          alt=""
        />

        {/* ══ Sello CANCELADO — capa gráfica superpuesta, no borra la información ══ */}
        {cancelada && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: "500px",
              left: "1002px",
              transform: "translateX(-50%) rotate(-12deg)",
              border: "3px solid #B4232C",
              borderRadius: "8px 16px 9px 15px",
              padding: "3px",
              opacity: 0.86,
            }}
          >
            <div
              style={{
                display: "flex",
                border: "1.5px solid #B4232C",
                borderRadius: "6px 13px 7px 12px",
                padding: "5px 14px",
                color: "#B4232C",
                fontSize: "20px",
                fontWeight: 400,
                fontFamily: "Anton",
                letterSpacing: "1px",
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
        { name: "Anton", data: anton, weight: 400, style: "normal" },
        { name: "Kalam", data: kalamBold, weight: 700, style: "normal" },
      ],
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
}
