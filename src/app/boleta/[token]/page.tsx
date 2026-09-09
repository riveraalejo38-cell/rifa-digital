"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

export default function BoletaPage() {
  const params = useParams();
  const token = params.token as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verificado, setVerificado] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [errorTel, setErrorTel] = useState("");
  const [fotoActiva, setFotoActiva] = useState(0);
  const [guardado, setGuardado] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  // Premios con fotografías reales de la campaña "Viaje sin límites"
  const premios = [
    {
      titulo: "Nissan Frontier NP300 LE/XE",
      desc: "Camioneta 0km, totalmente equipada",
      badge: "Premio Mayor",
      color: "#D9AD52",
      src: "/premios/frontier.jpg",
      alt: "Nissan Frontier NP300 LE/XE",
    },
    {
      titulo: "Yamaha NMAX 155",
      desc: "Scooter 0km, modelo reciente",
      badge: "2do Premio",
      color: "#7DD3FC",
      src: "/premios/nmax.jpg",
      alt: "Yamaha NMAX 155",
    },
    {
      titulo: "Yamaha MT-15 V3",
      desc: "Moto deportiva 0km",
      badge: "3er Premio",
      color: "#6EE7B7",
      src: "/premios/mt15.jpg",
      alt: "Yamaha MT-15 V3",
    },
  ];

  // Premio en tecnología — se muestra como productos tecnológicos, no como efectivo
  const premioTecnologia = {
    titulo: "$10.000.000 en Tecnología",
    desc: "Celulares · Portátiles · Televisores · Consolas · Drones · Audio y más",
    badge: "Bono Tecnología",
    color: "#D9AD52",
    iconos: ["📱", "💻", "📺", "🎮", "🚁", "🎧"],
  };

  const HERO_IMG = "/premios/hero-grupo.jpg";

  // Fecha del sorteo — cambia esta línea si la fecha cambia
  const FECHA_SORTEO = new Date("2026-12-12T20:00:00-05:00");

  const diaSorteo = String(FECHA_SORTEO.getDate()).padStart(2, "0");
  const mesSorteo = FECHA_SORTEO.toLocaleDateString("es-CO", { month: "short" }).replace(".", "").toUpperCase();
  const anioSorteo = String(FECHA_SORTEO.getFullYear());
  const horas24Sorteo = FECHA_SORTEO.getHours();
  const horas12Sorteo = horas24Sorteo % 12 === 0 ? 12 : horas24Sorteo % 12;
  const minutosSorteo = String(FECHA_SORTEO.getMinutes()).padStart(2, "0");
  const horaSorteo = `${horas12Sorteo}:${minutosSorteo} ${horas24Sorteo >= 12 ? "PM" : "AM"}`;

  useEffect(() => {
    fetch(`/api/boleta/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTicket(data.ticket);
        setLoading(false);
      });
  }, [token]);

  // Código de verificación: se genera a partir del link real de esta boleta.
  // Es un cálculo matemático a partir del mismo link (no una imagen creada por IA);
  // cada boleta tiene un link único (token) así que cada QR sale distinto automáticamente.
  useEffect(() => {
    if (typeof window === "undefined") return;
    QRCode.toDataURL(window.location.href, {
      margin: 1,
      width: 240,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, []);

  const verificarTelefono = () => {
    if (!ticket?.client) { setErrorTel("Esta boleta no tiene cliente registrado"); return; }
    const telIngresado = telefono.replace(/\s/g, "");
    const telRegistrado = ticket.client.phone.replace(/\s/g, "");
    if (telIngresado === telRegistrado || telRegistrado.endsWith(telIngresado)) {
      setVerificado(true); setErrorTel("");
    } else {
      setErrorTel("Número incorrecto. Verifica e intenta de nuevo.");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧭</div>
        <p style={{ color: "#D9AD52", fontSize: "16px", fontWeight: "600" }}>Cargando boleta...</p>
      </div>
    </div>
  );

  if (!ticket) return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
        <p style={{ color: "#F87171", fontSize: "16px", fontWeight: "600" }}>Boleta no encontrada</p>
      </div>
    </div>
  );

  if (!verificado) return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap'); * { box-sizing: border-box; } input:focus { outline: none; }`}</style>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.5) saturate(1.05)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.9) 70%, #0A0A0A 100%)" }} />
      <div style={{ position: "relative", background: "rgba(20,20,20,0.92)", backdropFilter: "blur(6px)", borderRadius: "24px", padding: "36px 28px", width: "100%", maxWidth: "380px", textAlign: "center", border: "1px solid rgba(217,173,82,0.25)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <img src="/logo-santiago-gomez.jpg" alt="Proyectos Santiago Gómez" style={{ width: "68px", height: "68px", borderRadius: "16px", objectFit: "cover", marginBottom: "14px", border: "2px solid rgba(217,173,82,0.4)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <p style={{ margin: "0 0 2px", fontSize: "11px", color: "#B8B8B8", fontWeight: "600", letterSpacing: "2px" }}>PROYECTOS SANTIAGO GÓMEZ</p>
        <p style={{ margin: "0 0 18px", fontSize: "10px", color: "#D9AD52", fontWeight: "700", letterSpacing: "2px" }}>VIAJE SIN LÍMITES · VIVE SIN EXCUSAS</p>
        <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: "800", color: "#D9AD52" }}>Verificación</h2>
        <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#B8B8B8" }}>Boleta número</p>
        <p style={{ margin: "0 0 20px", fontSize: "40px", fontWeight: "900", color: "#FFFFFF", fontFamily: "'DM Mono', monospace", letterSpacing: "6px" }}>
          {String(ticket.number).padStart(4, "0")}
        </p>
        <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#B8B8B8" }}>Ingresa el celular registrado en esta boleta</p>
        <input
          type="tel"
          placeholder="Número de celular"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && verificarTelefono()}
          style={{ width: "100%", background: "#0A0A0A", border: errorTel ? "1.5px solid #F87171" : "1.5px solid rgba(217,173,82,0.35)", borderRadius: "12px", padding: "14px", color: "#FFFFFF", fontSize: "18px", boxSizing: "border-box", marginBottom: "8px", textAlign: "center", letterSpacing: "3px", fontFamily: "inherit" }}
        />
        {errorTel && <p style={{ color: "#F87171", fontSize: "13px", margin: "0 0 12px", fontWeight: "500" }}>⚠ {errorTel}</p>}
        <button onClick={verificarTelefono} style={{ width: "100%", background: "linear-gradient(135deg, #D9AD52, #B58A2E)", border: "none", borderRadius: "12px", padding: "16px", color: "#0A0A0A", fontWeight: "800", fontSize: "15px", cursor: "pointer", marginTop: "8px", fontFamily: "inherit", letterSpacing: "1px" }}>
          VER MI BOLETA
        </button>
        <p style={{ margin: "16px 0 0", fontSize: "12px", color: "#6E6E6E" }}>¿Necesitas ayuda? Contacta a tu vendedor</p>
      </div>
    </div>
  );

  const numero = String(ticket.number).padStart(4, "0");
  const fechaSorteo = FECHA_SORTEO.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  const totalPaid = ticket.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  const TICKET_PRICE = 80000;
  const saldoPendiente = Math.max(0, TICKET_PRICE - totalPaid);
  const porcentajePagado = Math.min(100, Math.round((totalPaid / TICKET_PRICE) * 100));
  const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

  // Control de abonos: cada fila es un abono real ya registrado por un vendedor/admin.
  // El saldo de cada fila se calcula solo, sumando los abonos hasta esa fila — esta
  // tabla nunca se edita a mano, solo crece cuando entra un abono nuevo.
  const pagosOrdenados: any[] = ticket.payments || [];
  const filasAbono = pagosOrdenados.map((p: any, i: number) => {
    const acumuladoHastaAqui = pagosOrdenados.slice(0, i + 1).reduce((s: number, x: any) => s + Number(x.amount), 0);
    const fecha = new Date(p.createdAt);
    return {
      fechaTexto: `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}/${fecha.getFullYear()}`,
      abono: Number(p.amount),
      saldo: Math.max(0, TICKET_PRICE - acumuladoHastaAqui),
    };
  });

  const guardarBoleta = () => {
    if (navigator.share) {
      navigator.share({ title: "Mi boleta Proyectos Santiago Gómez", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
  };

  const compartirWhatsApp = () => {
    const mensaje = `🎟️ ¡Mira mi boleta oficial de Proyectos Santiago Gómez!\n\nNúmero: ${numero}\nSorteo: ${fechaSorteo}\n\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  // Tres estados de la boleta, tal como se maneja el negocio:
  // PENDIENTE (reservada, sin abonos) · ABONANDO (con abonos, falta saldo) · CANCELADA (pagada al 100%)
  const statusConfig: any = {
    PAID: { label: "CANCELADA", sub: "Pagada al 100%", bg: "rgba(217,173,82,0.14)", color: "#D9AD52", border: "rgba(217,173,82,0.4)" },
    PARTIAL: { label: "ABONANDO", sub: "Con abonos registrados", bg: "rgba(255,255,255,0.06)", color: "#F2F2F2", border: "rgba(255,255,255,0.22)" },
    RESERVED: { label: "PENDIENTE", sub: "Sin abonos aún", bg: "rgba(255,255,255,0.04)", color: "#B8B8B8", border: "rgba(255,255,255,0.14)" },
  };
  const st = statusConfig[ticket.status] || statusConfig.RESERVED;
  const cancelada = ticket.status === "PAID";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0 0 48px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&family=Anton&family=Kalam:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes brillo { 0%, 100% { box-shadow: 0 0 40px rgba(217,173,82,0.14); } 50% { box-shadow: 0 0 55px rgba(217,173,82,0.3); } }
        .hw { font-family: 'Kalam', cursive; color: #F0D584; }
        table.abonos { width: 100%; border-collapse: collapse; }
        table.abonos th { text-align: left; font-size: 10px; letter-spacing: 1px; color: #6E6E6E; font-weight: 700; padding: 0 6px 8px; border-bottom: 1px solid rgba(217,173,82,0.18); }
        table.abonos td { font-size: 13px; color: #E8E8E8; padding: 9px 6px; border-bottom: 1px solid rgba(255,255,255,0.06); font-family: 'DM Mono', monospace; }
        table.abonos tr:last-child td { border-bottom: none; }
      `}</style>
      <div style={{ maxWidth: "460px", width: "100%" }}>

        {/* Hero fotográfico */}
        <div style={{ position: "relative", height: "230px", overflow: "hidden" }}>
          <img src={HERO_IMG} alt="Proyectos Santiago Gómez — Viaje sin límites" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.65)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.4) 55%, #0A0A0A 100%)" }} />
          <div style={{ position: "absolute", top: "18px", left: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo-santiago-gomez.jpg" alt="Proyectos Santiago Gómez" style={{ width: "38px", height: "38px", borderRadius: "10px", objectFit: "cover", border: "1.5px solid rgba(217,173,82,0.6)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <p style={{ margin: 0, fontSize: "12px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "1px", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>PROYECTOS<br />SANTIAGO GÓMEZ</p>
          </div>
          <div style={{ position: "absolute", top: "18px", right: "20px" }}>
            <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: "999px", padding: "6px 16px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px", backdropFilter: "blur(4px)" }}>
              {st.label}
            </span>
          </div>
          <div style={{ position: "absolute", bottom: "16px", left: "20px", right: "20px" }}>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#D9AD52", letterSpacing: "1px", textShadow: "0 2px 8px rgba(0,0,0,0.7)", fontFamily: "'Anton', sans-serif" }}>3 PREMIOS INCREÍBLES</p>
            <p style={{ margin: "2px 0 0", fontSize: "10px", fontWeight: "700", color: "#F2F2F2", letterSpacing: "2px", textShadow: "0 2px 6px rgba(0,0,0,0.7)" }}>+ $10.000.000 EN TECNOLOGÍA</p>
          </div>
        </div>

        {/* Número de boleta + código de verificación */}
        <div style={{ background: "#141414", padding: "22px 24px 18px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none", display: "flex", gap: "14px", alignItems: "stretch" }}>
          <div style={{ flex: 1, background: "#0A0A0A", borderRadius: "18px", padding: "18px 12px", border: "2px solid rgba(217,173,82,0.3)", animation: "brillo 3s ease-in-out infinite", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", fontSize: "10px", letterSpacing: "2px", color: "#9C9C9C", fontWeight: "700" }}>N° DE BOLETA</p>
            <p style={{ color: "#D9AD52", fontSize: "44px", fontWeight: "900", letterSpacing: "6px", margin: "0", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
              {numero}
            </p>
          </div>
          <div style={{ width: "128px", background: "#0A0A0A", borderRadius: "18px", padding: "12px", border: "1px solid rgba(217,173,82,0.25)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {qrUrl ? (
              <img src={qrUrl} alt="Código QR para verificar esta boleta" style={{ width: "88px", height: "88px", borderRadius: "6px", background: "#FFFFFF", padding: "4px" }} />
            ) : (
              <div style={{ width: "88px", height: "88px", borderRadius: "6px", background: "rgba(255,255,255,0.06)" }} />
            )}
            <p style={{ margin: 0, fontSize: "8px", letterSpacing: "0.5px", color: "#9C9C9C", fontWeight: "700", lineHeight: 1.3 }}>ESCANEA Y VERIFICA TU BOLETA</p>
          </div>
        </div>

        {/* Fecha del sorteo */}
        <div style={{ background: "#141414", padding: "22px 24px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#B8B8B8", fontWeight: "600", textAlign: "center" }}>📅 FECHA DEL SORTEO</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {[
              { valor: diaSorteo, label: "DÍA" },
              { valor: mesSorteo, label: "MES" },
              { valor: anioSorteo, label: "AÑO" },
              { valor: horaSorteo, label: "HORA" },
            ].map((item) => (
              <div key={item.label} style={{ background: "#1C1C1C", borderRadius: "12px", padding: "12px 4px", textAlign: "center", border: "1px solid rgba(217,173,82,0.2)" }}>
                <p style={{ margin: "0 0 2px", fontSize: "20px", fontWeight: "800", color: "#D9AD52", fontFamily: "'DM Mono', monospace" }}>{item.valor}</p>
                <p style={{ margin: 0, fontSize: "9px", color: "#6E6E6E", fontWeight: "700", letterSpacing: "1px" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progreso de pago */}
        <div style={{ background: "#141414", padding: "22px 24px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{ margin: 0, fontSize: "11px", letterSpacing: "2px", color: "#B8B8B8", fontWeight: "600" }}>PROGRESO DEL VIAJE</p>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: porcentajePagado >= 100 ? "#D9AD52" : "#F2F2F2" }}>{porcentajePagado}%</p>
          </div>
          <div style={{ position: "relative", width: "100%", height: "14px", background: "#0A0A0A", borderRadius: "999px", overflow: "hidden", border: "1px solid rgba(217,173,82,0.15)" }}>
            <div style={{ width: `${porcentajePagado}%`, height: "100%", background: "linear-gradient(90deg, #6E5A26, #D9AD52 65%, #F0D584)", borderRadius: "999px", transition: "width 0.5s ease" }} />
            {[25, 50, 75].map((m) => (
              <div key={m} style={{ position: "absolute", top: 0, bottom: 0, left: `${m}%`, width: "1px", background: "rgba(10,10,10,0.4)" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#6E6E6E" }}>Abonado: <span style={{ color: "#D9AD52", fontWeight: "700" }}>{formatPeso(totalPaid)}</span></p>
            <p style={{ margin: 0, fontSize: "12px", color: "#6E6E6E" }}>Saldo: <span style={{ color: saldoPendiente === 0 ? "#D9AD52" : "#F2F2F2", fontWeight: "700" }}>{formatPeso(saldoPendiente)}</span></p>
          </div>
        </div>

        {/* Datos del titular */}
        {ticket.client && (
          <div style={{ background: "#141414", padding: "22px 24px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none" }}>
            <p style={{ margin: "0 0 16px", fontSize: "11px", letterSpacing: "2px", color: "#B8B8B8", fontWeight: "600" }}>TITULAR DEL PASE</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[
                { label: "Nombre", value: ticket.client.name, rot: -0.6 },
                { label: "Cédula", value: ticket.client.cedula || "— (pendiente)", rot: 0.8 },
                { label: "Celular", value: ticket.client.phone, rot: -0.4 },
                { label: "Ciudad", value: ticket.client.city || "—", rot: 0.6 },
                { label: "Vendedor", value: ticket.assignedByName || "—", rot: -0.7, full: true },
              ].map((item) => (
                <div key={item.label} style={{ gridColumn: item.full ? "1 / -1" : undefined, background: "#1C1C1C", borderRadius: "12px", padding: "12px 14px", border: "1px solid rgba(217,173,82,0.1)" }}>
                  <p style={{ margin: 0, fontSize: "10px", color: "#6E6E6E", fontWeight: "600", letterSpacing: "0.5px" }}>{item.label.toUpperCase()}</p>
                  <p className="hw" style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "700", display: "inline-block", transform: `rotate(${item.rot}deg)` }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control de abonos — solo crece con abonos reales; el saldo se calcula solo */}
        {ticket.client && (
          <div style={{ background: "#141414", padding: "22px 24px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none", position: "relative" }}>
            <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#B8B8B8", fontWeight: "600" }}>CONTROL DE ABONOS</p>
            <div style={{ background: "#1C1C1C", borderRadius: "12px", padding: "14px 16px", border: "1px solid rgba(217,173,82,0.15)", position: "relative", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="abonos">
                  <thead>
                    <tr><th>FECHA</th><th>ABONO</th><th>SALDO</th></tr>
                  </thead>
                  <tbody>
                    {filasAbono.length === 0 ? (
                      <tr><td colSpan={3} style={{ color: "#6E6E6E", fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>Aún no se han registrado abonos</td></tr>
                    ) : filasAbono.map((f: any, i: number) => (
                      <tr key={i}>
                        <td>{f.fechaTexto}</td>
                        <td style={{ color: "#D9AD52" }}>{formatPeso(f.abono)}</td>
                        <td>{formatPeso(f.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sello CANCELADO — aparece solo cuando la boleta quedó pagada al 100% */}
              {cancelada && (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "8%",
                    right: "4%",
                    width: "132px",
                    padding: "7px 4px",
                    textAlign: "center",
                    color: "#C0392B",
                    border: "3px double #C0392B",
                    borderRadius: "7px 15px 9px 13px",
                    fontFamily: "'Anton', sans-serif",
                    fontSize: "17px",
                    letterSpacing: "2px",
                    transform: "rotate(-11deg)",
                    opacity: 0.62,
                    mixBlendMode: "multiply",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  CANCELADO
                </div>
              )}
            </div>
          </div>
        )}

        {/* Valor de la boleta */}
        <div style={{ background: "#141414", padding: "18px 24px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "2px", color: "#B8B8B8", fontWeight: "600" }}>VALOR DE LA BOLETA</p>
          <p style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#D9AD52", fontFamily: "'DM Mono', monospace" }}>{formatPeso(TICKET_PRICE)}</p>
        </div>

        {/* Galería de premios — vehículos */}
        <div style={{ background: "#141414", padding: "22px 24px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#B8B8B8", fontWeight: "600" }}>DESTINOS · PREMIOS</p>
          <div style={{ borderRadius: "16px", overflow: "hidden", background: "#0A0A0A", marginBottom: "10px", position: "relative" }}>
            <img src={premios[fotoActiva].src} alt={premios[fotoActiva].alt} style={{ width: "100%", height: "230px", objectFit: "cover", display: "block" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/460x230/0A0A0A/D9AD52?text=Premio"; }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,10,10,0) 55%, rgba(10,10,10,0.85) 100%)" }} />
            <div style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(10,10,10,0.75)", borderRadius: "999px", padding: "4px 14px", border: `1px solid ${premios[fotoActiva].color}80` }}>
              <p style={{ margin: 0, fontSize: "11px", color: premios[fotoActiva].color, fontWeight: "700" }}>{premios[fotoActiva].badge}</p>
            </div>
            <div style={{ position: "absolute", bottom: "14px", left: "16px", right: "16px" }}>
              <p style={{ margin: 0, fontSize: "16px", color: "#FFFFFF", fontWeight: "800", textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>{premios[fotoActiva].titulo}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            {premios.map((p, i) => (
              <button key={i} onClick={() => setFotoActiva(i)} style={{ width: "72px", height: "54px", borderRadius: "10px", overflow: "hidden", border: i === fotoActiva ? `2px solid ${p.color}` : "2px solid rgba(217,173,82,0.15)", padding: 0, cursor: "pointer", background: "#0A0A0A" }}>
                <img src={p.src} alt={p.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/72x54/0A0A0A/D9AD52?text=" + (i + 1); }} />
              </button>
            ))}
          </div>
        </div>

        {/* Premio en tecnología */}
        <div style={{ background: "#141414", padding: "22px 24px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none" }}>
          <div style={{ background: "#1C1C1C", borderRadius: "16px", padding: "18px 16px", border: "1px solid rgba(217,173,82,0.25)", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: "10px", letterSpacing: "2px", color: "#D9AD52", fontWeight: "700" }}>{premioTecnologia.badge.toUpperCase()}</p>
            <p style={{ margin: "0 0 12px", fontSize: "19px", fontWeight: "900", color: "#FFFFFF", fontFamily: "'Anton', sans-serif", letterSpacing: "0.5px" }}>{premioTecnologia.titulo.toUpperCase()}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "10px", fontSize: "26px" }}>
              {premioTecnologia.iconos.map((ico, i) => <span key={i}>{ico}</span>)}
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#B8B8B8" }}>{premioTecnologia.desc}</p>
          </div>
        </div>

        {/* Descripción de premios */}
        <div style={{ background: "#141414", padding: "22px 24px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none" }}>
          <p style={{ margin: "0 0 16px", fontSize: "11px", letterSpacing: "2px", color: "#B8B8B8", fontWeight: "600" }}>DESCRIPCIÓN DE PREMIOS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...premios, premioTecnologia].map((p) => (
              <div key={p.titulo} style={{ background: "#0A0A0A", borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(217,173,82,0.08)", gap: "12px" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#F2F2F2" }}>{p.titulo}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6E6E6E" }}>{p.desc}</p>
                </div>
                <span style={{ background: "rgba(217,173,82,0.08)", color: p.color, borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", border: `1px solid ${p.color}40` }}>{p.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Condiciones */}
        <div style={{ background: "#141414", padding: "22px 24px", border: "1px solid rgba(217,173,82,0.15)", borderTop: "none" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#B8B8B8", fontWeight: "600" }}>CONDICIONES PARA GANAR</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              `La boleta debe estar 100% pagada (${formatPeso(TICKET_PRICE)}) para participar en el sorteo principal.`,
              "El sorteo se basa en las últimas 4 cifras de la Lotería de Boyacá o Manizales.",
              `Fecha del sorteo: ${fechaSorteo}`,
            ].map((texto, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ color: "#D9AD52", fontSize: "14px", marginTop: "1px", flexShrink: 0 }}>✦</span>
                <p style={{ margin: 0, fontSize: "13px", color: "#6E6E6E", lineHeight: "1.6" }}>{texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#101010", borderRadius: "0 0 24px 24px", padding: "22px 24px", textAlign: "center", border: "1px solid rgba(217,173,82,0.2)", borderTop: "1px solid rgba(217,173,82,0.15)" }}>
          <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "800", color: "#D9AD52", letterSpacing: "1px" }}>PROYECTOS SANTIAGO GÓMEZ</p>
          <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#6E6E6E" }}>Documento oficial de participación · Aplican términos y condiciones</p>

          <button onClick={compartirWhatsApp} style={{ width: "100%", background: "#25D366", border: "none", borderRadius: "12px", padding: "16px", color: "#0A0A0A", fontWeight: "800", fontSize: "15px", cursor: "pointer", letterSpacing: "0.5px", fontFamily: "inherit", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>📲</span> COMPARTIR POR WHATSAPP
          </button>

          <button onClick={guardarBoleta} style={{ width: "100%", background: "linear-gradient(135deg, #D9AD52, #B58A2E)", border: "none", borderRadius: "12px", padding: "16px", color: "#0A0A0A", fontWeight: "800", fontSize: "15px", cursor: "pointer", letterSpacing: "1px", fontFamily: "inherit" }}>
            {guardado ? "✓ LINK COPIADO" : "GUARDAR MI BOLETA"}
          </button>
        </div>

      </div>
    </div>
  );
}
