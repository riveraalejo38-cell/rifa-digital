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

  const fotos = [
    { src: "/Camion.jpeg", alt: "Foton 2025" },
    { src: "/moto1.png", alt: "Honda XR 190" },
    { src: "/moto2.png", alt: "Yamaha NMAX" },
  ];

  useEffect(() => {
    fetch(`/api/boleta/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTicket(data.ticket);
        setLoading(false);
      });
  }, [token]);

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
        <img src="/logo-rg.jpeg.jpeg" alt="RG Proyectos" style={{ width: "72px", height: "72px", borderRadius: "16px", objectFit: "cover", marginBottom: "16px" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "2px" }}>RG PROYECTOS</p>
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
  const fechaSorteo = new Date(ticket.raffle.drawDate).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  const totalPaid = ticket.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  const TICKET_PRICE = 70000;
  const saldoPendiente = Math.max(0, TICKET_PRICE - totalPaid);
  const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

  const guardarBoleta = () => {
    if (navigator.share) {
      navigator.share({ title: "Mi boleta RG Proyectos", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
  };

  const statusConfig: any = {
    PAID: { label: "✅ PAGADA COMPLETA", bg: "rgba(5,150,105,0.15)", color: "#6EE7B7", border: "rgba(5,150,105,0.3)" },
    PARTIAL: { label: "⏳ CON ABONO", bg: "rgba(217,119,6,0.15)", color: "#FCD34D", border: "rgba(217,119,6,0.3)" },
    RESERVED: { label: "● RESERVADA", bg: "rgba(14,165,233,0.15)", color: "#7DD3FC", border: "rgba(14,165,233,0.3)" },
  };
  const st = statusConfig[ticket.status] || statusConfig.RESERVED;

  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px 48px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap'); * { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "440px", width: "100%" }}>

        {/* Header */}
        <div style={{ background: "#0F172A", borderRadius: "24px 24px 0 0", padding: "28px 24px", textAlign: "center", border: "1px solid rgba(212,168,67,0.2)", borderBottom: "none" }}>
          <img src="/logo-rg.jpeg.jpeg" alt="RG Proyectos" style={{ width: "64px", height: "64px", borderRadius: "14px", objectFit: "cover", marginBottom: "12px" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p style={{ margin: "0 0 2px", fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "2px" }}>RG PROYECTOS</p>
          <h1 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "800", color: "#D4A843", letterSpacing: "1px" }}>Boleta Digital Oficial</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>Tu participación está asegurada</p>
        </div>

        {/* Número */}
        <div style={{ background: "#1E293B", padding: "32px 24px", textAlign: "center", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
          <p style={{ margin: "0 0 16px", fontSize: "11px", letterSpacing: "3px", color: "#475569", fontWeight: "600" }}>TU NÚMERO DE BOLETA</p>
          <div style={{ display: "inline-block", background: "#0F172A", borderRadius: "20px", padding: "20px 48px", border: "2px solid rgba(212,168,67,0.3)", boxShadow: "0 0 40px rgba(212,168,67,0.1)" }}>
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
            <div style={{ background: "#0F172A", borderRadius: "14px", padding: "16px 18px", border: "1px solid rgba(212,168,67,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: "10px", color: "#475569", fontWeight: "600", letterSpacing: "0.5px" }}>ABONADO</p>
                <p style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: "800", color: "#6EE7B7", fontFamily: "'DM Mono', monospace" }}>{formatPeso(totalPaid)}</p>
              </div>
              <div style={{ width: "1px", height: "40px", background: "rgba(212,168,67,0.15)" }} />
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "10px", color: "#475569", fontWeight: "600", letterSpacing: "0.5px" }}>SALDO PENDIENTE</p>
                <p style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: "800", color: saldoPendiente === 0 ? "#6EE7B7" : "#FCD34D", fontFamily: "'DM Mono', monospace" }}>{formatPeso(saldoPendiente)}</p>
              </div>
            </div>

            {/* Historial de pagos */}
            {ticket.payments && ticket.payments.length > 0 && (
              <div style={{ marginTop: "14px", background: "rgba(5,150,105,0.06)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(5,150,105,0.2)" }}>
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

        {/* Galería */}
        <div style={{ background: "#1E293B", padding: "22px 24px", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#475569", fontWeight: "600" }}>PREMIOS</p>
          <div style={{ borderRadius: "16px", overflow: "hidden", background: "#0F172A", marginBottom: "10px", position: "relative" }}>
            <img src={fotos[fotoActiva].src} alt={fotos[fotoActiva].alt} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/440x200/0F172A/D4A843?text=" + fotos[fotoActiva].alt; }} />
            <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,0.8)", borderRadius: "999px", padding: "4px 14px", border: "1px solid rgba(212,168,67,0.3)" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#D4A843", fontWeight: "600" }}>{fotos[fotoActiva].alt}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            {fotos.map((f, i) => (
              <button key={i} onClick={() => setFotoActiva(i)} style={{ width: "70px", height: "50px", borderRadius: "10px", overflow: "hidden", border: i === fotoActiva ? "2px solid #D4A843" : "2px solid rgba(212,168,67,0.15)", padding: 0, cursor: "pointer", background: "#0F172A", transition: "border 0.2s" }}>
                <img src={f.src} alt={f.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/70x50/0F172A/D4A843?text=" + (i + 1); }} />
              </button>
            ))}
          </div>
        </div>

        {/* Premios descripción */}
        <div style={{ background: "#1E293B", padding: "22px 24px", border: "1px solid rgba(212,168,67,0.15)", borderTop: "none", borderBottom: "none" }}>
          <p style={{ margin: "0 0 16px", fontSize: "11px", letterSpacing: "2px", color: "#475569", fontWeight: "600" }}>DESCRIPCIÓN DE PREMIOS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { titulo: "Nissan Frontier", desc: "Camioneta 0km totalmente equipada", badge: "Premio Mayor", color: "#D4A843" },
              { titulo: "Honda XR 190", desc: "Moto 0km modelo 2025", badge: "2do Premio", color: "#7DD3FC" },
              { titulo: "Yamaha NMAX", desc: "Scooter 0km modelo 2025", badge: "3er Premio", color: "#C4B5FD" },
              { titulo: "$10.000.000 en efectivo", desc: "Entrega inmediata al ganador", badge: "Premio Extra", color: "#6EE7B7" },
            ].map((p) => (
              <div key={p.titulo} style={{ background: "#0F172A", borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(212,168,67,0.08)" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#E2E8F0" }}>{p.titulo}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#475569" }}>{p.desc}</p>
                </div>
                <span style={{ background: "rgba(212,168,67,0.1)", color: p.color, borderRadius: "999px", padding: "4px 12px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", marginLeft: "12px", border: `1px solid ${p.color}30` }}>{p.badge}</span>
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
          <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "800", color: "#D4A843", letterSpacing: "1px" }}>RG PROYECTOS</p>
          <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#475569" }}>Documento oficial de participación · Aplican términos y condiciones</p>
          <button onClick={guardarBoleta} style={{ width: "100%", background: "linear-gradient(135deg, #D4A843, #B8860B)", border: "none", borderRadius: "12px", padding: "16px", color: "#0F172A", fontWeight: "800", fontSize: "15px", cursor: "pointer", letterSpacing: "1px", fontFamily: "inherit" }}>
            {guardado ? "✓ LINK COPIADO" : "GUARDAR MI BOLETA"}
          </button>
        </div>

      </div>
    </div>
  );
}
