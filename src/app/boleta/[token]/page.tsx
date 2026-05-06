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
    if (!ticket?.client) {
      setErrorTel("Esta boleta no tiene cliente registrado");
      return;
    }
    const telIngresado = telefono.replace(/\s/g, "");
    const telRegistrado = ticket.client.phone.replace(/\s/g, "");
    if (telIngresado === telRegistrado || telRegistrado.endsWith(telIngresado)) {
      setVerificado(true);
      setErrorTel("");
    } else {
      setErrorTel("Número incorrecto. Verifica e intenta de nuevo.");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F2F4F7", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#3B5998", fontSize: "18px", fontFamily: "sans-serif" }}>Cargando boleta...</p>
    </div>
  );

  if (!ticket) return (
    <div style={{ minHeight: "100vh", background: "#F2F4F7", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#ef4444", fontSize: "18px", fontFamily: "sans-serif" }}>Boleta no encontrada</p>
    </div>
  );

  // Pantalla de verificación
  if (!verificado) return (
    <div style={{
      minHeight: "100vh", background: "#1C1C2E",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: "20px",
        padding: "32px 28px", width: "100%", maxWidth: "360px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔒</div>
        <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800", color: "#1C1C2E" }}>Verificación</h2>
        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6B7280" }}>
          Ingresa el celular registrado en la boleta{" "}
          <strong style={{ color: "#3B5998" }}>
            {String(ticket.number).padStart(4, "0")}
          </strong>
        </p>
        <input
          type="tel"
          placeholder="Número de celular"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && verificarTelefono()}
          style={{
            width: "100%", background: "#F2F4F7",
            border: errorTel ? "2px solid #DC2626" : "1px solid #E5E7EB",
            borderRadius: "10px", padding: "14px",
            color: "#1C1C2E", fontSize: "16px", outline: "none",
            boxSizing: "border-box", marginBottom: "8px",
            textAlign: "center", letterSpacing: "2px",
          }}
        />
        {errorTel && (
          <p style={{ color: "#DC2626", fontSize: "13px", margin: "0 0 12px" }}>{errorTel}</p>
        )}
        <button onClick={verificarTelefono} style={{
          width: "100%", background: "#1C1C2E",
          border: "none", borderRadius: "10px", padding: "16px",
          color: "#FFFFFF", fontWeight: "800", fontSize: "15px",
          cursor: "pointer", marginTop: "8px",
        }}>
          VER MI BOLETA
        </button>
        <p style={{ margin: "16px 0 0", fontSize: "12px", color: "#9CA3AF" }}>
          ¿Necesitas ayuda? Contacta a tu vendedor
        </p>
      </div>
    </div>
  );

  const numero = String(ticket.number).padStart(4, "0");
  const fechaSorteo = new Date(ticket.raffle.drawDate).toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric"
  });

  const totalPaid = ticket.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  const TICKET_PRICE = 70000;
  const saldoPendiente = Math.max(0, TICKET_PRICE - totalPaid);

  const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

  const guardarBoleta = () => {
    if (navigator.share) {
      navigator.share({ title: "Mi boleta ColRifas", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F2F4F7",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 16px 40px", fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: "440px", width: "100%" }}>

        {/* Header */}
        <div style={{ background: "#1C1C2E", borderRadius: "20px 20px 0 0", padding: "24px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "4px", color: "#2A9D8F", fontWeight: "700" }}>
            BOLETA DIGITAL OFICIAL
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "28px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "3px" }}>
            COLRIFAS
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6B7280" }}>Tu participación está asegurada</p>
        </div>

        {/* Número */}
        <div style={{ background: "#FFFFFF", padding: "28px 24px", textAlign: "center", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ margin: "0 0 8px", fontSize: "11px", letterSpacing: "3px", color: "#6B7280", fontWeight: "600" }}>TU NÚMERO</p>
          <div style={{ display: "inline-block", background: "linear-gradient(135deg, #1C1C2E 0%, #2D3561 100%)", borderRadius: "20px", padding: "20px 48px", boxShadow: "0 8px 32px rgba(59,89,152,0.3)" }}>
            <p style={{ color: "#FFFFFF", fontSize: "72px", fontWeight: "900", letterSpacing: "12px", margin: "0", fontFamily: "monospace" }}>
              {numero}
            </p>
          </div>
          <div style={{ marginTop: "14px" }}>
            <span style={{
              background: ticket.status === "PAID" ? "#D1FAE5" : ticket.status === "PARTIAL" ? "#FEF3C7" : "#DBEAFE",
              color: ticket.status === "PAID" ? "#2D6A4F" : ticket.status === "PARTIAL" ? "#D97706" : "#3B5998",
              borderRadius: "999px", padding: "5px 18px", fontSize: "12px", fontWeight: "700", letterSpacing: "1px",
            }}>
              {ticket.status === "PAID" ? "✓ PAGADA COMPLETA" : ticket.status === "PARTIAL" ? "⏳ CON ABONO" : "● RESERVADA"}
            </span>
          </div>
        </div>

        {/* Datos del titular */}
        {ticket.client && (
          <div style={{ background: "#FFFFFF", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
            <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#6B7280", fontWeight: "600" }}>TITULAR DE LA BOLETA</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Nombre</p>
                <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: "700", color: "#1C1C2E" }}>{ticket.client.name}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Ciudad</p>
                <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: "700", color: "#1C1C2E" }}>{ticket.client.city || "—"}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Celular</p>
                <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: "700", color: "#1C1C2E" }}>{ticket.client.phone}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Sorteo</p>
                <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: "700", color: "#1C1C2E" }}>Lotería de Boyacá</p>
              </div>
            </div>
            <div style={{ marginTop: "16px", background: "#F2F4F7", borderRadius: "12px", padding: "14px 18px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Abonado</p>
                <p style={{ margin: "2px 0 0", fontSize: "20px", fontWeight: "800", color: "#2D6A4F" }}>{formatPeso(totalPaid)}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Saldo pendiente</p>
                <p style={{ margin: "2px 0 0", fontSize: "20px", fontWeight: "800", color: saldoPendiente === 0 ? "#2D6A4F" : "#D97706" }}>{formatPeso(saldoPendiente)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Galería */}
        <div style={{ background: "#FFFFFF", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#6B7280", fontWeight: "600" }}>PREMIOS</p>
          <div style={{ borderRadius: "14px", overflow: "hidden", background: "#F2F4F7", marginBottom: "10px", position: "relative" }}>
            <img src={fotos[fotoActiva].src} alt={fotos[fotoActiva].alt} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/440x200/F2F4F7/6B7280?text=" + fotos[fotoActiva].alt; }} />
            <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", background: "rgba(28,28,46,0.7)", borderRadius: "999px", padding: "4px 12px" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#FFFFFF" }}>Desliza para ver más</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            {fotos.map((f, i) => (
              <button key={i} onClick={() => setFotoActiva(i)} style={{ width: "60px", height: "44px", borderRadius: "8px", overflow: "hidden", border: i === fotoActiva ? "2px solid #3B5998" : "2px solid transparent", padding: 0, cursor: "pointer", background: "#F2F4F7" }}>
                <img src={f.src} alt={f.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/60x44/F2F4F7/6B7280?text=" + (i + 1); }} />
              </button>
            ))}
          </div>
        </div>

        {/* Premios */}
        <div style={{ background: "#FFFFFF", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#6B7280", fontWeight: "600" }}>DESCRIPCIÓN DE PREMIOS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { titulo: "Nissan Frontier", desc: "Camioneta 0km totalmente equipada", badge: "Premio Mayor" },
              { titulo: "Honda XR 190", desc: "Moto 0km modelo 2025", badge: "2do Premio" },
              { titulo: "Yamaha NMAX", desc: "Scooter 0km modelo 2025", badge: "3er Premio" },
              { titulo: "$10.000.000 en efectivo", desc: "Entrega inmediata al ganador", badge: "Premio Extra" },
            ].map((p) => (
              <div key={p.titulo} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "12px", borderBottom: "1px solid #F2F4F7" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#1C1C2E" }}>{p.titulo}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>{p.desc}</p>
                </div>
                <span style={{ background: "#DBEAFE", color: "#3B5998", borderRadius: "999px", padding: "3px 10px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" }}>{p.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Condiciones */}
        <div style={{ background: "#FFFFFF", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", letterSpacing: "2px", color: "#6B7280", fontWeight: "600" }}>CONDICIONES PARA GANAR</p>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#4B5563", lineHeight: "1.6" }}>• La boleta debe estar <strong>100% pagada</strong> ({formatPeso(TICKET_PRICE)}) para participar en el sorteo principal.</p>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#4B5563", lineHeight: "1.6" }}>• El sorteo se basa en las <strong>últimas 4 cifras</strong> de la Lotería de Boyacá o Manizales.</p>
          <p style={{ margin: 0, fontSize: "13px", color: "#4B5563", lineHeight: "1.6" }}>• Fecha del sorteo: <strong>{fechaSorteo}</strong></p>
        </div>

        {/* Footer */}
        <div style={{ background: "#1C1C2E", borderRadius: "0 0 20px 20px", padding: "20px 24px", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "800", color: "#FFFFFF" }}>COLRIFAS</p>
          <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#6B7280" }}>Documento oficial de participación · Aplican términos y condiciones</p>
          <button onClick={guardarBoleta} style={{ width: "100%", background: "#3B5998", border: "none", borderRadius: "12px", padding: "16px", color: "#FFFFFF", fontWeight: "800", fontSize: "15px", cursor: "pointer", letterSpacing: "1px" }}>
            {guardado ? "✓ LINK COPIADO" : "GUARDAR MI BOLETA"}
          </button>
        </div>

      </div>
    </div>
  );
}