"use client";
import { useState, useEffect } from "react";

// Ver nota en src/app/vendedor/page.tsx: esta ruta tampoco se debe cachear
// en el borde/CDN.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ReclamosPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [resolviendo, setResolviendo] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fetchClaims = async (status: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/reclamos?status=${status}`);
    const data = await res.json();
    if (data.success) setClaims(data.claims);
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims(filtro);
  }, [filtro]);

  const resolver = async (claimId: string, decision: "APPROVED" | "REJECTED") => {
    setResolviendo(claimId);
    const res = await fetch("/api/admin/reclamos/resolver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, decision }),
    });
    const data = await res.json();
    if (data.success) await fetchClaims(filtro);
    setResolviendo(null);
  };

  const tabs = [
    { key: "PENDING", label: "Pendientes" },
    { key: "APPROVED", label: "Aprobados" },
    { key: "REJECTED", label: "Rechazados" },
    { key: "ALL", label: "Todos" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#15113F", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        button:active { transform: scale(0.98); }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1B1854", borderBottom: "1px solid rgba(139,147,255,0.2)", padding: "0 38px", height: "84px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img src="/logo-rg.jpeg.jpeg" alt="Proyectos Santiago Gómez" style={{ width: "58px", height: "58px", borderRadius: "12px", objectFit: "cover" }} />
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#8B93FF", letterSpacing: "0.5px" }}>Proyectos Santiago Gómez</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#5F5A8E", fontWeight: "500" }}>Reclamos de boletas</p>
          </div>
        </div>
        <a href="/admin" style={{ color: "#8A84C4", fontSize: "16px", textDecoration: "none", fontWeight: "500", padding: "9px 19px", borderRadius: "10px", border: "1px solid #2D2860" }}>← Volver al panel</a>
      </div>

      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "32px 24px 60px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setFiltro(t.key)}
              style={{ background: filtro === t.key ? "rgba(139,147,255,0.15)" : "transparent", border: filtro === t.key ? "1px solid #8B93FF" : "1px solid #2D2860", borderRadius: "10px", padding: "9px 18px", color: filtro === t.key ? "#8B93FF" : "#8A84C4", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "#5F5A8E", fontSize: "16px", textAlign: "center", padding: "48px" }}>Cargando...</p>
        ) : claims.length === 0 ? (
          <div style={{ background: "#241F6B", borderRadius: "20px", padding: "48px", textAlign: "center", border: "1px solid rgba(139,147,255,0.16)" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
            <p style={{ margin: 0, color: "#ECEAFB", fontSize: "16px", fontWeight: "600" }}>No hay reclamos {filtro === "PENDING" ? "pendientes" : "en esta categoría"}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {claims.map((c) => (
              <div key={c.id} style={{ background: "#241F6B", borderRadius: "20px", padding: "22px", border: "1px solid rgba(139,147,255,0.16)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: "22px", fontWeight: "800", color: "#FFFFFF" }}>
                      Boleta {String(c.ticket.number).padStart(4, "0")}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#8A84C4" }}>
                      Cliente actual: {c.ticket.client?.name || "-"} ({c.ticket.client?.phone || "-"})
                    </p>
                  </div>
                  <span style={{
                    background: c.status === "PENDING" ? "rgba(217,119,6,0.15)" : c.status === "APPROVED" ? "rgba(5,150,105,0.15)" : "rgba(239,68,68,0.15)",
                    color: c.status === "PENDING" ? "#FCD34D" : c.status === "APPROVED" ? "#6EE7B7" : "#F87171",
                    padding: "5px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "700",
                  }}>
                    {c.status === "PENDING" ? "⏳ Pendiente" : c.status === "APPROVED" ? "✅ Aprobado" : "❌ Rechazado"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ background: "#1B1854", borderRadius: "12px", padding: "14px" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#5F5A8E", fontWeight: "700", letterSpacing: "0.5px" }}>REGISTRADA POR</p>
                    <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: "700", color: "#ECEAFB" }}>{c.ticket.assignedByName || "-"}</p>
                  </div>
                  <div style={{ background: "#1B1854", borderRadius: "12px", padding: "14px" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#5F5A8E", fontWeight: "700", letterSpacing: "0.5px" }}>RECLAMADA POR</p>
                    <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: "700", color: "#F87171" }}>{c.claimedByName}</p>
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#5F5A8E", fontWeight: "700", letterSpacing: "0.5px" }}>MOTIVO</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#ECEAFB", lineHeight: 1.5 }}>{c.reason}</p>
                </div>

                {c.evidenceImage && (
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#5F5A8E", fontWeight: "700", letterSpacing: "0.5px" }}>EVIDENCIA</p>
                    <img src={c.evidenceImage} alt="Evidencia del reclamo" onClick={() => setZoomImage(c.evidenceImage)}
                      style={{ maxWidth: "260px", maxHeight: "200px", borderRadius: "10px", cursor: "zoom-in", border: "1px solid rgba(139,147,255,0.2)" }} />
                  </div>
                )}

                {c.status === "PENDING" && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => resolver(c.id, "REJECTED")} disabled={resolviendo === c.id}
                      style={{ flex: 1, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "12px", color: "#F87171", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                      ❌ Rechazar
                    </button>
                    <button onClick={() => resolver(c.id, "APPROVED")} disabled={resolviendo === c.id}
                      style={{ flex: 1, background: "rgba(5,150,105,0.15)", border: "1px solid rgba(110,231,183,0.4)", borderRadius: "12px", padding: "12px", color: "#6EE7B7", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                      {resolviendo === c.id ? "..." : "✅ Aprobar"}
                    </button>
                  </div>
                )}
                {c.status === "APPROVED" && (
                  <p style={{ margin: 0, fontSize: "13px", color: "#6EE7B7", fontWeight: "600" }}>
                    Aprobado — ve a la boleta {String(c.ticket.number).padStart(4, "0")} en el panel y dale &quot;Liberar&quot; para que {c.claimedByName} la pueda registrar.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {zoomImage && (
        <div onClick={() => setZoomImage(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,8,30,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, cursor: "zoom-out", padding: "24px" }}>
          <img src={zoomImage} alt="Evidencia ampliada" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: "12px" }} />
        </div>
      )}
    </div>
  );
}
