"use client";
import { useState } from "react";

// Página pública de venta: cualquier visitante que entre al dominio puede
// escribir el número de boleta que quiere, ver si está disponible y
// separarla ahí mismo, sin necesitar un vendedor. A propósito esta página
// SOLO reserva (no recibe abonos/pagos): el cliente separa el número y
// después envía el comprobante de pago por WhatsApp; el vendedor o admin
// registra el abono/pago ya confirmado en su panel.
//
// El diseño de esta página sigue tal cual el lienzo que Alejo aprobó
// (public/plantilla-rifa-oficial.png): encabezado con menú, sección de
// premios, "cómo funciona" y medios de pago. Lo único que se hizo aquí fue
// darle vida a esas secciones — la lógica de verificar/reservar/confirmar
// que ya funcionaba no se tocó.
//
// El orden de las secciones (después del hero) se controla con el arreglo
// ORDEN_SECCIONES más abajo, dentro del componente — para reordenar la
// página solo hay que cambiar el orden de esa lista, sin tocar cada bloque.

// Datos de la rifa activa — coinciden con lo que hay hoy en la base de
// datos (Raffle.isActive = true). Si el nombre, el premio, el precio de la
// boleta o la fecha del sorteo cambian más adelante, hay que actualizar
// estas líneas también.
const RAFFLE_NAME = "ColRifas";
const RAFFLE_DESCRIPTION = "¡Participa y gana grandes premios!";
const RAFFLE_PRIZE = "Camioneta + 2 Motos + $10.000.000 en efectivo";
const TICKET_PRICE = 80000;
const TOTAL_TICKETS = 10000;
const DRAW_DATE = new Date("2026-12-12T20:00:00-05:00");

// Número de WhatsApp del negocio: a este llegan las consultas ("Escríbenos"),
// los comprobantes de pago, y es el mismo número que se muestra como Nequi
// y Daviplata en "Medios de pago" (así lo pidió Alejo — no maneja cuenta
// bancaria todavía).
const WHATSAPP_NEGOCIO = "573148008489";
const NUMERO_PAGO = "314 800 8489";

const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

type CheckResult = { number: number; available: boolean; ticketPrice: number } | null;
type ReservaExito = { number: number; status: string; ticketPrice: number; token: string } | null;

export default function PublicoClient() {
  const [numeroInput, setNumeroInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [checkResult, setCheckResult] = useState<CheckResult>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [reservando, setReservando] = useState(false);
  const [reservaError, setReservaError] = useState("");
  const [reservaExito, setReservaExito] = useState<ReservaExito>(null);

  const [copiado, setCopiado] = useState<string | null>(null);

  const fechaSorteo = DRAW_DATE.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

  // Antes esto era una cuenta regresiva (días/horas/min/seg) que se
  // actualizaba cada segundo. Por pedido suyo, esos mismos recuadros
  // muestran la fecha del sorteo ya fija (día/mes/año/hora), sin
  // contador en vivo.
  const diaSorteo = String(DRAW_DATE.getDate()).padStart(2, "0");
  const mesSorteo = DRAW_DATE.toLocaleDateString("es-CO", { month: "short" }).replace(".", "").toUpperCase();
  const anioSorteo = String(DRAW_DATE.getFullYear());
  const horas24Sorteo = DRAW_DATE.getHours();
  const horas12Sorteo = horas24Sorteo % 12 === 0 ? 12 : horas24Sorteo % 12;
  const minutosSorteo = String(DRAW_DATE.getMinutes()).padStart(2, "0");
  const horaSorteo = `${horas12Sorteo}:${minutosSorteo} ${horas24Sorteo >= 12 ? "PM" : "AM"}`;

  const verificarNumero = async () => {
    const term = numeroInput.trim();
    if (!term) return;
    setChecking(true);
    setCheckError("");
    setCheckResult(null);
    setReservaExito(null);
    setReservaError("");
    setNombre("");
    setTelefono("");
    setCiudad("");
    try {
      const res = await fetch(`/api/public/ticket-status?number=${encodeURIComponent(term)}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setCheckResult({ number: data.number, available: data.available, ticketPrice: data.ticketPrice });
      } else {
        setCheckError(data.error || "No se pudo verificar el número");
      }
    } catch {
      setCheckError("Error de conexión. Intenta de nuevo.");
    } finally {
      setChecking(false);
    }
  };

  const otroNumero = () => {
    setCheckResult(null);
    setCheckError("");
    setNumeroInput("");
    setReservaExito(null);
    setReservaError("");
  };

  const handleReservar = async () => {
    if (!checkResult) return;
    if (!nombre.trim()) {
      setReservaError("Ingresa tu nombre completo");
      return;
    }
    if (!telefono.trim()) {
      setReservaError("Ingresa tu número de teléfono");
      return;
    }
    setReservando(true);
    setReservaError("");
    try {
      const res = await fetch("/api/public/reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: checkResult.number,
          name: nombre.trim(),
          phone: telefono.trim(),
          city: ciudad.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReservaExito(data.ticket);
      } else {
        setReservaError(data.error || "No se pudo completar la reserva");
      }
    } catch {
      setReservaError("Error de conexión. Intenta de nuevo.");
    } finally {
      setReservando(false);
    }
  };

  const linkBoleta = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/boleta/${token}` : "";

  const compartirWhatsApp = () => {
    if (!reservaExito) return;
    const numero = String(reservaExito.number).padStart(4, "0");
    const mensaje = `¡Hola! Quiero confirmar la compra de mi boleta *${numero}* de ${RAFFLE_NAME} (${RAFFLE_PRIZE}). Ya les envío el comprobante de pago.\n\nMi boleta: ${linkBoleta(reservaExito.token)}`;
    window.open(`https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  // Botón "Escríbenos" del encabezado — consulta general, sin boleta de por medio.
  const escribenos = () => {
    const mensaje = `¡Hola! Quiero más información sobre ${RAFFLE_NAME} (${RAFFLE_PRIZE}).`;
    window.open(`https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  // Botón "Enviar comprobante" de Medios de pago — disponible en todo
  // momento (no solo justo después de reservar), para quien ya apartó su
  // boleta antes y vuelve más tarde a mandar el pago.
  const enviarComprobanteGenerico = () => {
    const mensaje = `¡Hola! Ya realicé mi abono para mi boleta de ${RAFFLE_NAME}. Les envío mi comprobante de pago.\n\n(Mi número de boleta es: )`;
    window.open(`https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const copiar = async (texto: string, key: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(key);
      setTimeout(() => setCopiado((c) => (c === key ? null : c)), 1800);
    } catch {
      // Si el navegador bloquea el portapapeles, no pasa nada grave —
      // el número igual queda visible para copiarlo a mano.
    }
  };

  const C = {
    bg: "#0B1F17",
    card: "#142B21",
    border: "#28405A",
    gold: "#D9AD52",
    goldDark: "#B58A2E",
    goldLight: "#E4C983",
    text: "#FFFFFF",
    muted: "#8FA6BD",
    mutedDim: "#7C93AC",
    danger: "#F87171",
    whatsapp: "#25D366",
    whatsappDark: "#128C4A",
  };

  // ══════════════════════════════════════════════════════════════════
  // Orden de las secciones de la página (después del hero, antes del
  // pie de página). Para reorganizar la página basta con cambiar el
  // orden de esta lista — cada bloque se define más abajo tal cual se
  // veía antes, solo movido de lugar.
  // ══════════════════════════════════════════════════════════════════
  const ORDEN_SECCIONES = [
    "eligeValor",
    "premios",
    "comoFunciona",
    "beneficios",
    "fechaSorteo",
  ] as const;

  // ══ Elige tu número (con el valor de la boleta al lado) ══
  const seccionEligeValor = (
    <section key="eligeValor" style={{ marginBottom: "44px" }}>
    <div className="prg-reserva-grid" style={{ marginBottom: "16px" }}>
      {/* Verificar / elegir número */}
      {!reservaExito && (
        <div style={{ background: C.card, borderRadius: "20px", padding: "24px", border: `1.5px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
          <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: C.text, letterSpacing: "0.5px" }}>ELIGE TU NÚMERO</p>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: C.muted }}>Escribe el número de boleta que quieres (0 a {TOTAL_TICKETS - 1}).</p>

          {!checkResult && (
            <>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 0512"
                  value={numeroInput}
                  onChange={(e) => setNumeroInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onKeyDown={(e) => e.key === "Enter" && verificarNumero()}
                  autoComplete="off"
                  style={{ flex: "1 1 160px", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: "14px", padding: "14px 18px", fontSize: "18px", color: C.text, fontFamily: "'DM Mono', monospace", letterSpacing: "2px" }}
                />
                <button onClick={verificarNumero} disabled={checking || !numeroInput}
                  style={{ background: checking || !numeroInput ? C.border : `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, border: "none", borderRadius: "14px", padding: "14px 22px", color: checking || !numeroInput ? C.muted : "#FFFFFF", fontSize: "14px", fontWeight: 700, cursor: checking || !numeroInput ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {checking ? "..." : "Verificar"}
                </button>
              </div>
              {checkError && <p style={{ color: C.danger, fontSize: "13px", margin: "12px 0 0", fontWeight: 500 }}>⚠ {checkError}</p>}
              <p style={{ margin: "16px 0 0", fontSize: "12px", color: C.mutedDim, lineHeight: 1.6, marginTop: "auto", paddingTop: "16px" }}>
                Cada persona puede reservar hasta 4 boletas con el mismo teléfono.<br />
                ¿Eres vendedor? <a href="/login" style={{ color: C.goldLight, fontWeight: 600 }}>Inicia sesión aquí</a>.
              </p>
            </>
          )}

          {checkResult && !checkResult.available && (
            <div>
              <div style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", borderRadius: "16px", padding: "18px", marginBottom: "14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: 700, letterSpacing: "1.5px" }}>BOLETA {String(checkResult.number).padStart(4, "0")}</p>
                <p style={{ margin: 0, fontSize: "15px", color: "#FFFFFF", fontWeight: 700 }}>Uy, esa boleta ya no está disponible</p>
              </div>
              <button onClick={otroNumero} style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: "12px", padding: "13px", color: C.goldLight, fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Probar otro número
              </button>
            </div>
          )}

          {checkResult && checkResult.available && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, borderRadius: "14px", padding: "14px 18px", border: `1.5px solid ${C.gold}`, marginBottom: "16px" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "10px", color: C.muted, fontWeight: 700, letterSpacing: "1px" }}>BOLETA</p>
                  <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace", letterSpacing: "3px" }}>{String(checkResult.number).padStart(4, "0")}</p>
                </div>
                <span style={{ background: "rgba(217,173,82,0.15)", color: C.gold, borderRadius: "999px", padding: "6px 14px", fontSize: "12px", fontWeight: 700 }}>✦ Disponible</span>
              </div>

              <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: C.text }}>TUS DATOS</p>
              <input type="text" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off"
                style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: C.text, fontFamily: "inherit", fontWeight: 500, marginBottom: "10px" }} />
              <input type="tel" placeholder="Teléfono (para el comprobante por WhatsApp)" value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="off"
                style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: C.text, fontFamily: "inherit", fontWeight: 500, marginBottom: "10px" }} />
              <input type="text" placeholder="Ciudad (opcional)" value={ciudad} onChange={(e) => setCiudad(e.target.value)} autoComplete="off"
                style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: C.text, fontFamily: "inherit", fontWeight: 500, marginBottom: "16px" }} />
              <p style={{ color: C.muted, fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>
                Tu boleta queda apartada. El pago se confirma después, enviando el comprobante por WhatsApp.
              </p>
              {reservaError && <p style={{ color: C.danger, fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>⚠ {reservaError}</p>}

              <button onClick={handleReservar} disabled={reservando}
                style={{ width: "100%", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, border: "none", borderRadius: "12px", padding: "14px", color: "#FFFFFF", fontSize: "15px", fontWeight: 700, cursor: reservando ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: "10px" }}>
                {reservando ? "Reservando..." : "Reservar esta boleta"}
              </button>
              <button onClick={otroNumero} style={{ width: "100%", background: "none", border: "none", padding: "4px", color: C.goldLight, fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ← Elegir otro número
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmación de reserva */}
      {reservaExito && (
        <div style={{ background: C.card, borderRadius: "20px", padding: "24px", border: `1.5px solid ${C.border}` }}>
          <div style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, borderRadius: "18px", padding: "24px", marginBottom: "18px", textAlign: "center", animation: "brillo 3s ease-in-out infinite" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: "1.5px" }}>✓ ¡BOLETA RESERVADA!</p>
            <p style={{ margin: 0, fontSize: "44px", fontWeight: 800, color: "#FFFFFF", fontFamily: "'DM Mono', monospace", letterSpacing: "6px" }}>{String(reservaExito.number).padStart(4, "0")}</p>
          </div>

          <div style={{ background: C.bg, borderRadius: "12px", padding: "14px", marginBottom: "18px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "11px", color: C.muted, fontWeight: 600 }}>VALOR A PAGAR</p>
            <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 700, color: C.text }}>{formatPeso(reservaExito.ticketPrice)}</p>
          </div>

          <p style={{ margin: "0 0 14px", fontSize: "13px", color: C.muted, lineHeight: 1.6 }}>
            Tu boleta quedó apartada. Ahora haz el pago y envíanos el comprobante por WhatsApp para confirmarla — tu vendedor la registra apenas lo reciba.
          </p>

          <a href={`/boleta/${reservaExito.token}`} target="_blank" rel="noopener noreferrer"
            style={{ width: "100%", boxSizing: "border-box", background: C.bg, border: `1.5px solid ${C.gold}`, borderRadius: "12px", padding: "15px", color: C.gold, fontWeight: 800, fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none" }}>
            <span style={{ fontSize: "17px" }}>🎟️</span> VER MI BOLETA
          </a>
          <button onClick={compartirWhatsApp} style={{ width: "100%", background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, border: "none", borderRadius: "12px", padding: "15px", color: "#FFFFFF", fontWeight: 800, fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", animation: "latido 1.6s ease-in-out infinite" }}>
            <span style={{ fontSize: "17px" }}>📲</span> CONFIRMAR MI BOLETA
          </button>
          <button onClick={otroNumero} style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: "12px", padding: "13px", color: C.goldLight, fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Reservar otra boleta
          </button>
        </div>
      )}

      {/* Medios de pago + enviar comprobante (al lado de elige tu número) */}
      <div id="medios-pago" style={{ background: C.card, borderRadius: "20px", padding: "18px", border: `1.5px solid ${C.border}`, scrollMarginTop: "80px" }}>
        <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: C.text, letterSpacing: "0.5px" }}>MEDIOS DE PAGO</p>
        {[
          { key: "nequi", icon: "/logos/nequi.png", nombre: "Nequi", numero: NUMERO_PAGO },
          { key: "daviplata", icon: "/logos/daviplata.png", nombre: "Daviplata", numero: NUMERO_PAGO },
        ].map((m) => (
          <div key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, borderRadius: "12px", padding: "10px 12px", border: `1px solid ${C.border}`, marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src={m.icon} alt={m.nombre} style={{ width: "28px", height: "28px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
              <div>
                <p style={{ margin: "0 0 1px", fontSize: "12px", fontWeight: 700, color: C.text }}>{m.nombre}</p>
                <p style={{ margin: 0, fontSize: "12.5px", color: C.goldLight, fontFamily: "'DM Mono', monospace" }}>{m.numero}</p>
              </div>
            </div>
            <button onClick={() => copiar(m.numero, m.key)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "6px 10px", color: copiado === m.key ? C.gold : C.muted, fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {copiado === m.key ? "✓" : "Copiar"}
            </button>
          </div>
        ))}
        <button onClick={enviarComprobanteGenerico} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", background: `linear-gradient(135deg, ${C.whatsapp}, ${C.whatsappDark})`, border: "none", borderRadius: "12px", padding: "13px", color: "#FFFFFF", fontWeight: 800, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", animation: "latido 1.8s ease-in-out infinite", marginTop: "4px" }}>
          <span style={{ fontSize: "16px" }}>📲</span> Enviar comprobante
        </button>
        <p style={{ margin: "8px 0 0", fontSize: "10.5px", color: C.mutedDim, lineHeight: 1.5, textAlign: "center" }}>
          ¿Ya realizaste tu abono? Incluye tu número de boleta en el mensaje.
        </p>
      </div>
    </div>

    {/* Valor de la boleta: banda completa debajo, centrada entre las dos
        columnas de arriba (mitad bajo "elige tu número", mitad bajo
        "medios de pago"), tal como lo pidió. */}
    <div style={{ background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`, borderRadius: "20px", padding: "18px", textAlign: "center" }}>
      <p style={{ margin: "0 0 6px", fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: 700, letterSpacing: "1.5px" }}>🎫 VALOR DE LA BOLETA</p>
      <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#FFFFFF", fontFamily: "'DM Mono', monospace" }}>{formatPeso(TICKET_PRICE)}</p>
    </div>
    </section>
  );

  // ══ Nuestros premios ══
  const seccionPremios = (
    <section key="premios" id="premios" style={{ marginBottom: "44px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 800 }}>Nuestros <span style={{ color: C.gold }}>premios</span></h2>
          <p style={{ margin: 0, fontSize: "13px", color: C.muted }}>Vehículos de alto nivel y muchos premios más.</p>
        </div>
      </div>
      <div className="prg-premios-grid">
        {[
          { img: "/premios/mt15.jpg", tag: "PREMIO MAYOR", nombre: "Yamaha MT-15", desc: "Potencia que te mueve." },
          { img: "/premios/frontier.jpg", tag: "OBSEQUIO", nombre: "Nissan Frontier", desc: "Robusta, confiable, lista para nuevas aventuras." },
          { img: "/premios/nmax.jpg", tag: "PREMIO ADICIONAL", nombre: "Yamaha Nmax", desc: "Estilo y libertad en cada kilómetro." },
        ].map((p) => (
          <div key={p.nombre} style={{ background: C.card, borderRadius: "18px", overflow: "hidden", border: `1.5px solid ${C.border}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.img} alt={p.nombre} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} />
            <div style={{ padding: "14px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 800, color: C.gold, letterSpacing: "1px" }}>🎁 {p.tag}</p>
              <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 800, color: C.text }}>{p.nombre}</p>
              <p style={{ margin: 0, fontSize: "12.5px", color: C.muted }}>{p.desc}</p>
            </div>
          </div>
        ))}
        <div style={{ background: "#1B3A2A", borderRadius: "18px", border: `1.5px dashed ${C.gold}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", minHeight: "160px" }}>
          <span style={{ fontSize: "34px", marginBottom: "8px" }}>🎁</span>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: C.goldLight }}>Y MÁS PREMIOS<br />SORPRESA</p>
        </div>
      </div>
    </section>
  );

  // ══ Beneficios ══
  const seccionBeneficios = (
    <section key="beneficios" style={{ marginBottom: "44px", background: C.card, borderRadius: "20px", padding: "24px", border: `1.5px solid ${C.border}` }}>
      <div className="prg-beneficios-grid">
        {[
          { icon: "👥", texto: "Miles de personas ya hacen parte" },
          { icon: "🛡️", texto: "Transacción segura y confiable" },
          { icon: "❤️", texto: "Apoyas grandes proyectos" },
          { icon: "🌿", texto: "Más oportunidades para todos" },
        ].map((b) => (
          <div key={b.texto} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "22px" }}>{b.icon}</span>
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: C.text }}>{b.texto}</span>
          </div>
        ))}
      </div>
    </section>
  );

  // ══ Cómo funciona ══
  const seccionComoFunciona = (
    <section key="comoFunciona" id="como-participar" style={{ marginBottom: "44px" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 800 }}>¿Cómo funciona?</h2>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: C.muted }}>Es muy fácil, sigue estos pasos y asegura tu participación.</p>
      <div className="prg-pasos-grid">
        {[
          { n: "01", icon: "🎫", titulo: "Elige tu número", desc: "Reserva tu boleta de forma rápida." },
          { n: "02", icon: "💳", titulo: "Realiza tu abono", desc: "Usa nuestros medios de pago." },
          { n: "03", icon: "📤", titulo: "Envía el comprobante", desc: "Por WhatsApp para confirmar." },
          { n: "04", icon: "✅", titulo: "¡Participa y gana!", desc: "La suerte puede ser tuya." },
        ].map((p) => (
          <div key={p.n} style={{ background: C.card, borderRadius: "18px", padding: "20px", border: `1.5px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: C.mutedDim }}>{p.n}</span>
              <span style={{ width: "36px", height: "36px", borderRadius: "50%", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", border: `1px solid ${C.border}` }}>{p.icon}</span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 800, color: C.text }}>{p.titulo}</p>
            <p style={{ margin: 0, fontSize: "12.5px", color: C.muted }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );

  // ══ Fecha del sorteo (al final, según lo pedido) ══
  const seccionFechaSorteo = (
    <section key="fechaSorteo" style={{ marginBottom: "44px" }}>
      <div style={{ background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}`, maxWidth: "480px", margin: "0 auto" }}>
        <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "1.5px", color: C.muted, fontWeight: 700, textAlign: "center" }}>📅 FECHA DEL SORTEO</p>
        <div className="prg-side-grid">
          {[
            { valor: diaSorteo, label: "DÍA" },
            { valor: mesSorteo, label: "MES" },
            { valor: anioSorteo, label: "AÑO" },
            { valor: horaSorteo, label: "HORA" },
          ].map((item) => (
            <div key={item.label} style={{ background: C.bg, borderRadius: "12px", padding: "12px 4px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <p style={{ margin: "0 0 2px", fontSize: "17px", fontWeight: 800, color: C.gold, fontFamily: "'DM Mono', monospace" }}>{item.valor}</p>
              <p style={{ margin: 0, fontSize: "9px", color: C.mutedDim, fontWeight: 700, letterSpacing: "1px" }}>{item.label}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: "11px", color: C.mutedDim, textAlign: "center" }}>{fechaSorteo}</p>
      </div>
    </section>
  );

  const SECCIONES: Record<(typeof ORDEN_SECCIONES)[number], React.ReactNode> = {
    eligeValor: seccionEligeValor,
    premios: seccionPremios,
    comoFunciona: seccionComoFunciona,
    beneficios: seccionBeneficios,
    fechaSorteo: seccionFechaSorteo,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        input:focus { outline: none; }
        @keyframes brillo { 0%, 100% { box-shadow: 0 0 30px rgba(217,173,82,0.10); } 50% { box-shadow: 0 0 46px rgba(217,173,82,0.22); } }
        @keyframes latido { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(37,211,102,0.4); } 50% { transform: scale(1.03); box-shadow: 0 0 22px rgba(37,211,102,0.5); } }
        .prg-nav-links { display: flex; gap: 26px; }
        .prg-hero { position: relative; width: 100%; min-height: 420px; overflow: hidden; display: flex; align-items: center; }
        .prg-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 38%; display: block; }
        .prg-hero-overlay { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(11,31,23,0.96) 0%, rgba(11,31,23,0.88) 32%, rgba(11,31,23,0.5) 58%, rgba(11,31,23,0.12) 82%, rgba(11,31,23,0.05) 100%); }
        .prg-hero-content { position: relative; z-index: 2; max-width: 1100px; margin: 0 auto; padding: 56px 20px; width: 100%; box-sizing: border-box; }
        .prg-hero-title { margin: 0 0 14px; font-size: clamp(30px, 6vw, 50px); font-weight: 800; line-height: 1.08; text-transform: uppercase; max-width: 560px; text-shadow: 0 2px 10px rgba(0,0,0,0.45); }
        .prg-hero-title-accent { color: #D9AD52; font-size: 1.12em; display: inline-block; }
        .prg-hero-sub { text-transform: uppercase; letter-spacing: 0.3px; text-shadow: 0 1px 6px rgba(0,0,0,0.5); }
        .prg-hero-badge-label { text-shadow: 0 1px 6px rgba(0,0,0,0.5); }
        .prg-reserva-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .prg-side-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .prg-premios-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .prg-beneficios-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .prg-pasos-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .prg-pago-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 700px) {
          .prg-premios-grid { grid-template-columns: 1fr 1fr; }
          .prg-pasos-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 860px) {
          .prg-reserva-grid { grid-template-columns: 1.3fr 1fr; }
          .prg-pago-grid { grid-template-columns: 1fr 1fr; }
          .prg-hero { min-height: 540px; }
        }
        @media (min-width: 980px) {
          .prg-premios-grid { grid-template-columns: repeat(4, 1fr); }
          .prg-pasos-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 700px) {
          .prg-nav-links { display: none; }
          .prg-beneficios-grid { grid-template-columns: 1fr; }
          .prg-hero-overlay { background: linear-gradient(180deg, rgba(11,31,23,0.55) 0%, rgba(11,31,23,0.92) 62%, rgba(11,31,23,0.98) 100%); }
          .prg-hero { min-height: 380px; align-items: flex-end; }
        }
      `}</style>

      {/* ══ Encabezado ══ */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(11,31,23,0.95)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(6px)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#inicio" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-santiago-gomez.jpg" alt="Proyectos Santiago Gómez" style={{ width: "34px", height: "34px", borderRadius: "9px", objectFit: "cover", border: `1.5px solid ${C.border}` }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: C.text, letterSpacing: "0.5px", lineHeight: 1.2 }}>PROYECTOS<br />SANTIAGO GÓMEZ</p>
          </a>
          <nav className="prg-nav-links">
            <a href="#inicio" style={{ fontSize: "13px", fontWeight: 600, color: C.text, textDecoration: "none" }}>Inicio</a>
            <a href="#premios" style={{ fontSize: "13px", fontWeight: 600, color: C.muted, textDecoration: "none" }}>Premios</a>
            <a href="#como-participar" style={{ fontSize: "13px", fontWeight: 600, color: C.muted, textDecoration: "none" }}>Cómo participar</a>
            <a href="#medios-pago" style={{ fontSize: "13px", fontWeight: 600, color: C.muted, textDecoration: "none" }}>Medios de pago</a>
            <a href="#contacto" style={{ fontSize: "13px", fontWeight: 600, color: C.muted, textDecoration: "none" }}>Contacto</a>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a href="/login" style={{ fontSize: "12px", fontWeight: 600, color: C.muted, textDecoration: "none", whiteSpace: "nowrap" }}>Vendedores →</a>
            <button onClick={escribenos} style={{ display: "flex", alignItems: "center", gap: "6px", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, border: "none", borderRadius: "999px", padding: "9px 16px", color: "#FFFFFF", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              💬 Escríbenos
            </button>
          </div>
        </div>
      </header>

      {/* ══ Hero ══ */}
      <section id="inicio" className="prg-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/premios/hero-cascada.png" alt={RAFFLE_PRIZE} className="prg-hero-img" />
        <div className="prg-hero-overlay" />
        <div className="prg-hero-content">
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: C.gold, fontWeight: 800, letterSpacing: "2px", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>GRAN RIFA</p>
          <h1 className="prg-hero-title">
            Tu próxima<br />
            <span className="prg-hero-title-accent">aventura</span><br />
            puede ser real
          </h1>
          <p className="prg-hero-sub" style={{ margin: "0 0 22px", fontSize: "14px", color: C.text, fontWeight: 700, lineHeight: 1.6, maxWidth: "440px" }}>
            {RAFFLE_PRIZE} — y muchos premios más.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
            {[
              { icon: "🏆", label: "Grandes premios" },
              { icon: "🛡️", label: "100% confiable" },
              { icon: "👥", label: "Miles de participantes" },
            ].map((b) => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>{b.icon}</span>
                <span className="prg-hero-badge-label" style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 20px 0" }}>
        {ORDEN_SECCIONES.map((key) => (
          <span key={key}>{SECCIONES[key]}</span>
        ))}
      </main>

      {/* ══ Pie de página ══ */}
      <footer id="contacto" style={{ borderTop: `1px solid ${C.border}`, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-santiago-gomez.jpg" alt="Proyectos Santiago Gómez" style={{ width: "30px", height: "30px", borderRadius: "8px", objectFit: "cover", border: `1.5px solid ${C.border}` }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: C.text, letterSpacing: "0.5px", textAlign: "left", lineHeight: 1.2 }}>PROYECTOS<br />SANTIAGO GÓMEZ</p>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: "13px", color: C.goldLight, fontStyle: "italic" }}>{RAFFLE_DESCRIPTION}</p>
        <button onClick={escribenos} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: `1.5px solid ${C.border}`, borderRadius: "999px", padding: "9px 18px", color: C.muted, fontSize: "12.5px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: "16px" }}>
          💬 Escríbenos por WhatsApp
        </button>
        <p style={{ margin: 0, fontSize: "11px", color: C.mutedDim }}>
          ¿Eres vendedor? <a href="/login" style={{ color: C.goldLight, fontWeight: 600 }}>Inicia sesión aquí</a>.
        </p>
      </footer>
    </div>
  );
}
