"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  const [tiempoRestante, setTiempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

  // Premios con imágenes reales
  const premios = [
    {
      titulo: "Nissan Frontier NP300 LE/XE",
      desc: "Camioneta 0km, totalmente equipada",
      badge: "Premio Mayor",
      color: "#D4A843",
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Nissan_NP_300_LE_X-Gear_2019.jpg/1280px-Nissan_NP_300_LE_X-Gear_2019.jpg",
      alt: "Nissan Frontier NP300 LE/XE",
    },
    {
      titulo: "Yamaha NMAX 155",
      desc: "Scooter 0km, modelo reciente",
      badge: "2do Premio",
      color: "#7DD3FC",
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/2025_Yamaha_NMAX_155_Standard.jpg/1280px-2025_Yamaha_NMAX_155_Standard.jpg",
      alt: "Yamaha NMAX 155",
    },
    {
      titulo: "Yamaha MT-15 V3",
      desc: "Moto deportiva 0km",
      badge: "3er Premio",
      color: "#6EE7B7",
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Yamaha_MT_15_Green_version_2.jpg/1280px-Yamaha_MT_15_Green_version_2.jpg",
      alt: "Yamaha MT-15 V3",
    },
  ];

  // Fecha del sorteo — cambia esta línea si la fecha cambia
  const FECHA_SORTEO = new Date("2026-08-05T20:00:00-05:00");

  useEffect(() => {
    fetch(`/api/boleta/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTicket(data.ticket);
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    const calcular = () => {
      const ahora = new Date().getTime();
      const diff = FECHA_SORTEO.getTime() - ahora;
      if (diff <= 0) {
        setTiempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
        return;
      }
      setTiempoRestante({
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
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <p style={{ color: "#D4A843", fontSize: "16px", fontWeight: "600" }}>Cargando boleta...</p>
      </div>
    </div>
  );

  if (!ticket) return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
        <p style={{ color: "#F87171", fontSize: "16px", fontWeight: "600" }}>Boleta no encontrada</p>
      </div>
    </div>
  );

  if (!verificado) return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap'); * { box-sizing: border-box; } input:focus { outline: none; }`}</style>
      <div style={{ background: "#1E293B", borderRadius: "24px", padding: "36px 28px", width: "100%", maxWidth: "380px", textAlign: "center", border: "1px solid rgba(212,168,67,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <img src="/logo-rg.jpeg.jpeg" alt="Proyectos Santiago Gómez" style={{ width: "72px", height: "72px", borderRadius: "16px", objectFit: "cover", marginBottom: "16px" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "2px" }}>PROYECTOS SANTIAGO GÓMEZ</p>
        <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: "800", color: "#D4A843" }}>Verificación</h2>
        <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#64748B" }}>Boleta número</p>
        <p style={{ margin: "0 0 20px", fontSize: "40px", fontWeight: "900", color: "#FFFFFF", fontFamily: "'DM Mono', monospace", letterSpacing: "6px" }}>
          {String(ticket.number).padStart(4, "0")}
        </p>
        <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#64748B" }}>Ingresa el celular registrado en esta boleta</p>
        <input
          type="tel"
          placeholder="Número de celular"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && verificarTelefono()}
          style={{ width: "100%", background: "#0F172A", border: errorTel ? "1.5px solid #F87171" : "1.5px solid rgba(212,168,67,0.3)", borderRadius: "12px", padding: "14px", color: "#FFFFFF", fontSize: "18px", boxSizing: "border-box", marginBottom: "8px", textAlign: "center", letterSpacing: "3px", fontFamily: "inherit" }}
        />
        {errorTel && <p style={{ color: "#F87171", fontSize: "13px", margin: "0 0 12px", fontWeight: "500" }}>⚠ {errorTel}</p>}
        <button onClick={verificarTelefono} style={{ width: "100%", background: "linear-gradient(135deg, #D4A843, #B8860B)", border: "none", borderRadius: "12px", padding: "16px", color: "#0F172A", fontWeight: "800", fontSize: "15px", cursor: "pointer", marginTop: "8px", fontFamily: "inherit", letterSpacing: "1px" }}>
          VER MI BOLETA
        </button>
        <p style={{ margin: "16px 0 0", fontSize: "12px", color: "#475569" }}>¿Necesitas ayuda? Contacta a tu vendedor</p>
      </div>
    </div>
  );

  const numero = String(ticket.number).padStart(4, "0");
  const fechaSorteo = FECHA_SORTEO.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  const totalPaid = ticket.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  const TICKET_PRICE = 70000;
  const saldoPendiente = Math.max(0, TICKET_PRICE - totalPaid);
  const porcentajePagado = Math.min(100, Math.round((totalPaid / TICKET_PRICE) * 100));
  const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

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

  const statusConfig: any = {
    PAID: { label: "✅ PAGADA COMPLETA", bg: "rgba(5,150,105,0.15)", color: "#6EE7B7", border: "rgba(5,150,105,0.3)" },
    PARTIAL: { label: "⏳ CON ABONO", bg: "rgba(217,119,6,0.15)", color: "#FCD34D", border: "rgba(217,119,6,0.3)" },
    RESERVED: { label: "● RESERVADA", bg: "rgba(14,165,233,0.15)", color: "#7DD3FC", border: "rgba(14,165,233,0.3)" },
  };
  const st = statusConfig[ticket.status] || statusConfig.RESERVED;

  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px 48px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        @keyframes brillo { 0%, 100% { box-shadow: 0 0 40px rgba(212,168,67,0.1); } 50% { box-shadow: 0 0 55px rgba(212,168,67,0.25); } }
      `}</style>
      <div style={{ maxWidth: "440px", width: "100%" }}>

        {/* Header */}
        <div style={{ background: "#0F172A", borderRadius: "24px 24px 0 0", padding: "28px 24px", textAlign: "center", border: "1px solid rgba(212,168,67,0.2)", borderBottom: "none" }}>
          <img src="/logo-rg.jpeg.jpeg" alt="Proyectos Santiago Gómez" style={{ width: "64px", height: "64px", borderRadius: "14px", objectFit: "cover", marginBottom: "12px" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p style={{ margin: "0 0 2px", fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "2px" }}>PROYECTOS SANTIAGO GÓMEZ</p>
          <h1 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "800", color: "#D4A843", letterSpacing: "1px" }}>Boleta Digital Oficial</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>Tu participación está asegurada</p>
        </div>

        {/* Número */}
        <div style={{ background: "#1E293B", padding: "32px 24px", textAlign: "center", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
          <p style={{ margin: "0 0 16px", fontSize: "11px", letterSpacing: "3px", color: "#475569", fontWeight: "600" }}>TU NÚMERO DE BOLETA</p>
          <div style={{ display: "inline-block", background: "#0F172A", borderRadius: "20px", padding: "20px 48px", border: "2px solid rgba(212,168,67,0.3)", animation: "brillo 3s ease-in-out infinite" }}>
            <p style={{ color: "#D4A843", fontSize: "72px", fontWeight: "900", letterSpacing: "12px", margin: "0", fontFamily: "'DM Mono', monospace" }}>
              {numero}
            </p>
          </div>
          <div style={{ marginTop: "16px" }}>
            <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: "999px", padding: "6px 20px", fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>
              {st.label}
            </span>
          </div>
        </div>

        {/* Contador regresivo */}
        <div style={{ background: "#1E293B", padding: "22px 24px", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#475569", fontWeight: "600", textAlign: "center" }}>FALTA PARA EL SORTEO · {fechaSorteo.toUpperCase()}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {[
              { valor: tiempoRestante.dias, label: "DÍAS" },
              { valor: tiempoRestante.horas, label: "HORAS" },
              { valor: tiempoRestante.minutos, label: "MIN" },
              { valor: tiempoRestante.segundos, label: "SEG" },
            ].map((item) => (
              <div key={item.label} style={{ background: "#0F172A", borderRadius: "12px", padding: "12px 4px", textAlign: "center", border: "1px solid rgba(212,168,67,0.2)" }}>
                <p style={{ margin: "0 0 2px", fontSize: "26px", fontWeight: "800", color: "#D4A843", fontFamily: "'DM Mono', monospace" }}>{String(item.valor).padStart(2, "0")}</p>
                <p style={{ margin: 0, fontSize: "9px", color: "#64748B", fontWeight: "700", letterSpacing: "1px" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progreso de pago */}
        <div style={{ background: "#1E293B", padding: "22px 24px", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{ margin: 0, fontSize: "11px", letterSpacing: "2px", color: "#475569", fontWeight: "600" }}>PROGRESO DE PAGO</p>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: porcentajePagado >= 100 ? "#6EE7B7" : "#D4A843" }}>{porcentajePagado}%</p>
          </div>
          <div style={{ width: "100%", height: "10px", background: "#0F172A", borderRadius: "999px", overflow: "hidden", border: "1px solid rgba(212,168,67,0.15)" }}>
            <div style={{ width: `${porcentajePagado}%`, height: "100%", background: "linear-gradient(90deg, #B8860B, #D4A843)", borderRadius: "999px", transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Abonado: <span style={{ color: "#6EE7B7", fontWeight: "700" }}>{formatPeso(totalPaid)}</span></p>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Saldo: <span style={{ color: saldoPendiente === 0 ? "#6EE7B7" : "#FCD34D", fontWeight: "700" }}>{formatPeso(saldoPendiente)}</span></p>
          </div>
        </div>

        {/* Datos del titular */}
        {ticket.client && (
          <div style={{ background: "#1E293B", padding: "22px 24px", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
            <p style={{ margin: "0 0 16px", fontSize: "11px", letterSpacing: "2px", color: "#475569", fontWeight: "600" }}>TITULAR DE LA BOLETA</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              {[
                { label: "Nombre", value: ticket.client.name },
                { label: "Ciudad", value: ticket.client.city || "—" },
                { label: "Celular", value: ticket.client.phone },
                { label: "Sorteo", value: "Lotería de Boyacá" },
              ].map((item) => (
                <div key={item.label} style={{ background: "#0F172A", borderRadius: "12px", padding: "12px 14px", border: "1px solid rgba(212,168,67,0.1)" }}>
                  <p style={{ margin: 0, fontSize: "10px", color: "#475569", fontWeight: "600", letterSpacing: "0.5px" }}>{item.label.toUpperCase()}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "700", color: "#E2E8F0" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {ticket.payments && ticket.payments.length > 0 && (
              <div style={{ background: "rgba(5,150,105,0.06)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(5,150,105,0.2)" }}>
                <p style={{ margin: "0 0 10px", fontSize: "10px", color: "#475569", fontWeight: "700", letterSpacing: "1px" }}>HISTORIAL DE PAGOS</p>
                {ticket.payments.map((p: any, i: number) => {
                  const fecha = new Date(p.createdAt);
                  const dia = String(fecha.getDate()).padStart(2, "0");
                  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
                  const anio = fecha.getFullYear();
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: i > 0 ? "8px" : "0", marginTop: i > 0 ? "8px" : "0", borderTop: i > 0 ? "1px solid rgba(5,150,105,0.15)" : "none" }}>
                      <span style={{ fontSize: "13px", color: "#64748B" }}>{dia}/{mes}/{anio}</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#6EE7B7" }}>{formatPeso(Number(p.amount))}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Galería de premios */}
        <div style={{ background: "#1E293B", padding: "22px 24px", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#475569", fontWeight: "600" }}>PREMIOS</p>
          <div style={{ borderRadius: "16px", overflow: "hidden", background: "#0F172A", marginBottom: "10px", position: "relative" }}>
            <img src={premios[fotoActiva].src} alt={premios[fotoActiva].alt} style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/440x220/0F172A/D4A843?text=Premio"; }} />
            <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,0.85)", borderRadius: "999px", padding: "4px 16px", border: "1px solid rgba(212,168,67,0.3)" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#D4A843", fontWeight: "600" }}>{premios[fotoActiva].titulo}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            {premios.map((p, i) => (
              <button key={i} onClick={() => setFotoActiva(i)} style={{ width: "70px", height: "52px", borderRadius: "10px", overflow: "hidden", border: i === fotoActiva ? "2px solid #D4A843" : "2px solid rgba(212,168,67,0.15)", padding: 0, cursor: "pointer", background: "#0F172A" }}>
                <img src={p.src} alt={p.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/70x52/0F172A/D4A843?text=" + (i + 1); }} />
              </button>
            ))}
          </div>
        </div>

        {/* Descripción de premios */}
        <div style={{ background: "#1E293B", padding: "22px 24px", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
          <p style={{ margin: "0 0 16px", fontSize: "11px", letterSpacing: "2px", color: "#475569", fontWeight: "600" }}>DESCRIPCIÓN DE PREMIOS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {premios.map((p) => (
              <div key={p.titulo} style={{ background: "#0F172A", borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(212,168,67,0.08)", gap: "12px" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#E2E8F0" }}>{p.titulo}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#475569" }}>{p.desc}</p>
                </div>
                <span style={{ background: "rgba(212,168,67,0.08)", color: p.color, borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", border: `1px solid ${p.color}40` }}>{p.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Condiciones */}
        <div style={{ background: "#1E293B", padding: "22px 24px", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#475569", fontWeight: "600" }}>CONDICIONES PARA GANAR</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              `La boleta debe estar 100% pagada (${formatPeso(TICKET_PRICE)}) para participar en el sorteo principal.`,
              "El sorteo se basa en las últimas 4 cifras de la Lotería de Boyacá o Manizales.",
              `Fecha del sorteo: ${fechaSorteo}`,
            ].map((texto, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ color: "#D4A843", fontSize: "14px", marginTop: "1px", flexShrink: 0 }}>◆</span>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B", lineHeight: "1.6" }}>{texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#0F172A", borderRadius: "0 0 24px 24px", padding: "22px 24px", textAlign: "center", border: "1px solid rgba(212,168,67,0.2)", borderTop: "1px solid rgba(212,168,67,0.15)" }}>
          <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "800", color: "#D4A843", letterSpacing: "1px" }}>PROYECTOS SANTIAGO GÓMEZ</p>
          <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#475569" }}>Documento oficial de participación · Aplican términos y condiciones</p>

          <button onClick={compartirWhatsApp} style={{ width: "100%", background: "#25D366", border: "none", borderRadius: "12px", padding: "16px", color: "#0F172A", fontWeight: "800", fontSize: "15px", cursor: "pointer", letterSpacing: "0.5px", fontFamily: "inherit", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>📲</span> COMPARTIR POR WHATSAPP
          </button>

          <button onClick={guardarBoleta} style={{ width: "100%", background: "linear-gradient(135deg, #D4A843, #B8860B)", border: "none", borderRadius: "12px", padding: "16px", color: "#0F172A", fontWeight: "800", fontSize: "15px", cursor: "pointer", letterSpacing: "1px", fontFamily: "inherit" }}>
            {guardado ? "✓ LINK COPIADO" : "GUARDAR MI BOLETA"}
          </button>
        </div>

      </div>
    </div>
  );
}
