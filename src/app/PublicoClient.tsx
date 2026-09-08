"use client";
import { useEffect, useState } from "react";

// Página pública de venta: cualquier visitante que entre al dominio puede
// escribir el número de boleta que quiere, ver si está disponible y
// separarla ahí mismo, sin necesitar un vendedor. A propósito esta página
// SOLO reserva (no recibe abonos/pagos): el cliente separa el número y
// después envía el comprobante de pago por WhatsApp; el vendedor o admin
// registra el abono/pago ya confirmado en su panel.

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

const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

type CheckResult = { number: number; available: boolean; ticketPrice: number } | null;
type ReservaExito = { number: number; status: string; ticketPrice: number; token: string } | null;

export default function PublicoClient() {
  const [tiempo, setTiempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

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

  useEffect(() => {
    const calcular = () => {
      const diff = DRAW_DATE.getTime() - Date.now();
      if (diff <= 0) {
        setTiempo({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
        return;
      }
      setTiempo({
        dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((diff / (1000 * 60)) % 60),
        segundos: Math.floor((diff / 1000) % 60),
      });
    };
    calcular();
    const intervalo = setInterval(calcular, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const fechaSorteo = DRAW_DATE.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

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

  // Número de WhatsApp del negocio al que llegan los comprobantes de pago.
  // Sin este número, el botón solo abría un selector de contactos y el
  // mensaje no llegaba de forma confiable.
  const WHATSAPP_NEGOCIO = "573148008489";

  const compartirWhatsApp = () => {
    if (!reservaExito) return;
    const numero = String(reservaExito.number).padStart(4, "0");
    const mensaje = `¡Hola! Acabo de reservar la boleta *${numero}* de ${RAFFLE_NAME} (${RAFFLE_PRIZE}). Aquí les envío el comprobante de pago.\n\nMi boleta: ${linkBoleta(reservaExito.token)}`;
    window.open(`https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, rgba(11,31,23,0.55) 0%, rgba(11,31,23,0.88) 70%, #0B1F17 100%), url('/premios/hero-grupo.jpg')",
      backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        @keyframes brillo { 0%, 100% { box-shadow: 0 0 30px rgba(217,173,82,0.10); } 50% { box-shadow: 0 0 46px rgba(217,173,82,0.22); } }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", maxWidth: "520px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo-rg.jpeg.jpeg" alt="Proyectos Santiago Gómez" style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover", border: "1.5px solid #28405A" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p style={{ margin: 0, fontSize: "12px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "0.5px", lineHeight: 1.2 }}>PROYECTOS<br />SANTIAGO GÓMEZ</p>
        </div>
        <a href="/login" style={{ fontSize: "12px", fontWeight: "600", color: "#8FA6BD", textDecoration: "none" }}>Vendedores →</a>
      </div>

      <div style={{ maxWidth: "460px", margin: "0 auto", padding: "0 20px 48px" }}>

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #D9AD52 0%, #B58A2E 100%)", borderRadius: "24px", padding: "32px 26px", marginBottom: "18px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "140px", height: "140px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
          <p style={{ margin: "0 0 6px", fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: "700", letterSpacing: "2px" }}>{RAFFLE_NAME.toUpperCase()}</p>
          <h1 style={{ margin: "0 0 10px", fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.25 }}>{RAFFLE_PRIZE}</h1>
          <p style={{ margin: "0 0 18px", fontSize: "14px", color: "rgba(255,255,255,0.85)", fontWeight: "500" }}>{RAFFLE_DESCRIPTION}</p>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: "6px", background: "rgba(255,255,255,0.16)", borderRadius: "999px", padding: "8px 18px" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>Boleta</span>
            <span style={{ fontSize: "18px", color: "#FFFFFF", fontWeight: "800", fontFamily: "'DM Mono', monospace" }}>{formatPeso(TICKET_PRICE)}</span>
          </div>
        </div>

        {/* Contador regresivo */}
        <div style={{ background: "#142B21", borderRadius: "20px", padding: "20px", marginBottom: "18px", border: "1.5px solid #28405A" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "1.5px", color: "#8FA6BD", fontWeight: "700", textAlign: "center" }}>SORTEO · {fechaSorteo.toUpperCase()}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {[
              { valor: tiempo.dias, label: "DÍAS" },
              { valor: tiempo.horas, label: "HORAS" },
              { valor: tiempo.minutos, label: "MIN" },
              { valor: tiempo.segundos, label: "SEG" },
            ].map((item) => (
              <div key={item.label} style={{ background: "#142B21", borderRadius: "12px", padding: "12px 4px", textAlign: "center", border: "1px solid #28405A" }}>
                <p style={{ margin: "0 0 2px", fontSize: "24px", fontWeight: "800", color: "#D9AD52", fontFamily: "'DM Mono', monospace" }}>{String(item.valor).padStart(2, "0")}</p>
                <p style={{ margin: 0, fontSize: "9px", color: "#7C93AC", fontWeight: "700", letterSpacing: "1px" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Verificar / elegir número */}
        {!reservaExito && (
          <div style={{ background: "#142B21", borderRadius: "20px", padding: "24px", border: "1.5px solid #28405A", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "700", color: "#FFFFFF", letterSpacing: "0.5px" }}>ELIGE TU NÚMERO</p>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#8FA6BD" }}>Escribe el número de boleta que quieres (0 a {TOTAL_TICKETS - 1}).</p>

            {!checkResult && (
              <>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej: 0512"
                    value={numeroInput}
                    onChange={(e) => setNumeroInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    onKeyDown={(e) => e.key === "Enter" && verificarNumero()}
                    autoComplete="off"
                    style={{ flex: 1, background: "#142B21", border: "1.5px solid #28405A", borderRadius: "14px", padding: "14px 18px", fontSize: "18px", color: "#FFFFFF", fontFamily: "'DM Mono', monospace", letterSpacing: "2px" }}
                  />
                  <button onClick={verificarNumero} disabled={checking || !numeroInput}
                    style={{ background: checking || !numeroInput ? "#28405A" : "linear-gradient(135deg, #D9AD52, #B58A2E)", border: "none", borderRadius: "14px", padding: "14px 22px", color: checking || !numeroInput ? "#8FA6BD" : "#FFFFFF", fontSize: "14px", fontWeight: "700", cursor: checking || !numeroInput ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                    {checking ? "..." : "Verificar"}
                  </button>
                </div>
                {checkError && <p style={{ color: "#F87171", fontSize: "13px", margin: "12px 0 0", fontWeight: "500" }}>⚠ {checkError}</p>}
              </>
            )}

            {checkResult && !checkResult.available && (
              <div className="fade-up">
                <div style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", borderRadius: "16px", padding: "18px", marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: "700", letterSpacing: "1.5px" }}>BOLETA {String(checkResult.number).padStart(4, "0")}</p>
                  <p style={{ margin: 0, fontSize: "15px", color: "#FFFFFF", fontWeight: "700" }}>Uy, esa boleta ya no está disponible</p>
                </div>
                <button onClick={otroNumero} style={{ width: "100%", background: "#142B21", border: "1.5px solid #28405A", borderRadius: "12px", padding: "13px", color: "#E4C983", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                  Probar otro número
                </button>
              </div>
            )}

            {checkResult && checkResult.available && (
              <div className="fade-up">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#142B21", borderRadius: "14px", padding: "14px 18px", border: "1.5px solid #D9AD52", marginBottom: "16px" }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: "10px", color: "#8FA6BD", fontWeight: "700", letterSpacing: "1px" }}>BOLETA</p>
                    <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#FFFFFF", fontFamily: "'DM Mono', monospace", letterSpacing: "3px" }}>{String(checkResult.number).padStart(4, "0")}</p>
                  </div>
                  <span style={{ background: "rgba(217,173,82,0.15)", color: "#D9AD52", borderRadius: "999px", padding: "6px 14px", fontSize: "12px", fontWeight: "700" }}>✦ Disponible</span>
                </div>

                <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "700", color: "#FFFFFF" }}>TUS DATOS</p>
                <input type="text" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off"
                  style={{ width: "100%", background: "#142B21", border: "1.5px solid #28405A", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#FFFFFF", fontFamily: "inherit", fontWeight: "500", marginBottom: "10px" }} />
                <input type="tel" placeholder="Teléfono (para el comprobante por WhatsApp)" value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="off"
                  style={{ width: "100%", background: "#142B21", border: "1.5px solid #28405A", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#FFFFFF", fontFamily: "inherit", fontWeight: "500", marginBottom: "10px" }} />
                <input type="text" placeholder="Ciudad (opcional)" value={ciudad} onChange={(e) => setCiudad(e.target.value)} autoComplete="off"
                  style={{ width: "100%", background: "#142B21", border: "1.5px solid #28405A", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#FFFFFF", fontFamily: "inherit", fontWeight: "500", marginBottom: "16px" }} />
                <p style={{ color: "#8FA6BD", fontSize: "13px", marginBottom: "12px", fontWeight: "500" }}>
                  Tu boleta queda apartada. El pago se confirma después, enviando el comprobante por WhatsApp.
                </p>
                {reservaError && <p style={{ color: "#F87171", fontSize: "13px", marginBottom: "12px", fontWeight: "500" }}>⚠ {reservaError}</p>}

                <button onClick={handleReservar} disabled={reservando}
                  style={{ width: "100%", background: "linear-gradient(135deg, #D9AD52, #B58A2E)", border: "none", borderRadius: "12px", padding: "14px", color: "#FFFFFF", fontSize: "15px", fontWeight: "700", cursor: reservando ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: "10px" }}>
                  {reservando ? "Reservando..." : "Reservar esta boleta"}
                </button>
                <button onClick={otroNumero} style={{ width: "100%", background: "none", border: "none", padding: "4px", color: "#E4C983", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
                  ← Elegir otro número
                </button>
              </div>
            )}
          </div>
        )}

        {/* Confirmación de reserva */}
        {reservaExito && (
          <div className="fade-up" style={{ background: "#142B21", borderRadius: "20px", padding: "24px", border: "1.5px solid #28405A", marginBottom: "16px" }}>
            <div style={{ background: "linear-gradient(135deg, #D9AD52 0%, #B58A2E 100%)", borderRadius: "18px", padding: "24px", marginBottom: "18px", textAlign: "center", animation: "brillo 3s ease-in-out infinite" }}>
              <p style={{ margin: "0 0 6px", fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: "700", letterSpacing: "1.5px" }}>✓ ¡BOLETA RESERVADA!</p>
              <p style={{ margin: 0, fontSize: "48px", fontWeight: "800", color: "#FFFFFF", fontFamily: "'DM Mono', monospace", letterSpacing: "6px" }}>{String(reservaExito.number).padStart(4, "0")}</p>
            </div>

            <div style={{ background: "#142B21", borderRadius: "12px", padding: "14px", marginBottom: "18px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#8FA6BD", fontWeight: "600" }}>VALOR A PAGAR</p>
              <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: "700", color: "#FFFFFF" }}>{formatPeso(reservaExito.ticketPrice)}</p>
            </div>

            <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#8FA6BD", lineHeight: 1.6 }}>
              Tu boleta quedó apartada. Ahora haz el pago y envíanos el comprobante por WhatsApp para confirmarla — tu vendedor la registra apenas lo reciba.
            </p>

            <a href={`/boleta/${reservaExito.token}`} target="_blank" rel="noopener noreferrer"
              style={{ width: "100%", boxSizing: "border-box", background: "#142B21", border: "1.5px solid #D9AD52", borderRadius: "12px", padding: "15px", color: "#D9AD52", fontWeight: "800", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none" }}>
              <span style={{ fontSize: "17px" }}>🎟️</span> VER MI BOLETA
            </a>
            <button onClick={compartirWhatsApp} style={{ width: "100%", background: "#25D366", border: "none", borderRadius: "12px", padding: "15px", color: "#0B1F17", fontWeight: "800", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{ fontSize: "17px" }}>📲</span> ENVIAR COMPROBANTE POR WHATSAPP
            </button>
            <button onClick={otroNumero} style={{ width: "100%", background: "#142B21", border: "1.5px solid #28405A", borderRadius: "12px", padding: "13px", color: "#E4C983", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
              Reservar otra boleta
            </button>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: "11px", color: "#57708A", lineHeight: 1.6, margin: 0 }}>
          Recuerda que cada persona puede reservar hasta 4 boletas con el mismo teléfono.<br />
          ¿Eres vendedor? <a href="/login" style={{ color: "#E4C983", fontWeight: "600" }}>Inicia sesión aquí</a>.
        </p>
      </div>
    </div>
  );
}
