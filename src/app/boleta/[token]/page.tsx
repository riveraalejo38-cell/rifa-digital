"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function BoletaPage() {
  const params = useParams();
  const token = params.token as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imagenLista, setImagenLista] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const HERO_IMG = "/premios/hero-grupo.jpg";

  // Fecha del sorteo — misma fecha usada en la imagen de la boleta
  const FECHA_SORTEO = new Date("2026-12-12T20:00:00-05:00");

  useEffect(() => {
    fetch(`/api/boleta/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTicket(data.ticket);
        setLoading(false);
      });
  }, [token]);

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


  const numero = String(ticket.number).padStart(4, "0");
  const fechaSorteo = FECHA_SORTEO.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Bogota" });
  const imagenUrl = `/api/boleta/${token}/imagen`;

  const guardarBoleta = () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any).share({ title: "Mi boleta Proyectos Santiago Gómez", url: window.location.href });
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

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0 0 48px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulso { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <div style={{ maxWidth: "500px", width: "100%" }}>

        {/* La boleta — una sola imagen con todos los datos reales (número, nombre,
            ciudad, celular, vendedor, abonos, saldo, QR de verificación y sello
            CANCELADO). Se genera en el momento a partir de la base de datos, así
            que siempre queda igual a como está registrado. */}
        <div style={{ padding: "18px 16px 8px" }}>
          <a href={imagenUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
            {!imagenLista && (
              <div style={{ width: "100%", aspectRatio: "1150 / 725", borderRadius: "16px", background: "#141414", border: "1px solid rgba(217,173,82,0.2)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulso 1.4s ease-in-out infinite" }}>
                <p style={{ color: "#D9AD52", fontSize: "13px", fontWeight: 600 }}>Generando tu boleta...</p>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagenUrl}
              alt={`Boleta N° ${numero}`}
              onLoad={() => setImagenLista(true)}
              style={{ width: "100%", borderRadius: "16px", display: imagenLista ? "block" : "none", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
            />
          </a>
          <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#6E6E6E", textAlign: "center" }}>Toca la imagen para verla en tamaño completo</p>
        </div>

        {/* Botones */}
        <div style={{ padding: "10px 16px 0" }}>
          <button onClick={compartirWhatsApp} style={{ width: "100%", background: "#25D366", border: "none", borderRadius: "12px", padding: "16px", color: "#0A0A0A", fontWeight: "800", fontSize: "15px", cursor: "pointer", letterSpacing: "0.5px", fontFamily: "inherit", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>📲</span> COMPARTIR POR WHATSAPP
          </button>
          <a href={imagenUrl} download={`boleta-${numero}.png`} style={{ width: "100%", background: "linear-gradient(135deg, #D9AD52, #B58A2E)", border: "none", borderRadius: "12px", padding: "16px", color: "#0A0A0A", fontWeight: "800", fontSize: "15px", cursor: "pointer", letterSpacing: "1px", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", marginBottom: "10px" }}>
            GUARDAR MI BOLETA
          </a>
          <button onClick={guardarBoleta} style={{ width: "100%", background: "transparent", border: "1.5px solid rgba(217,173,82,0.4)", borderRadius: "12px", padding: "14px", color: "#D9AD52", fontWeight: "700", fontSize: "13px", cursor: "pointer", letterSpacing: "0.5px", fontFamily: "inherit" }}>
            {guardado ? "¡Enlace copiado!" : "COMPARTIR ENLACE"}
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: "22px 16px 0", textAlign: "center" }}>
          <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "800", color: "#D9AD52", letterSpacing: "1px" }}>PROYECTOS SANTIAGO GÓMEZ</p>
          <p style={{ margin: 0, fontSize: "11px", color: "#6E6E6E" }}>Documento oficial de participación · Aplican términos y condiciones</p>
        </div>

      </div>
    </div>
  );
}
