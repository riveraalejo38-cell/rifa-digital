"use client";
import { useState, useEffect } from "react";

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VENDEDOR");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Si el servidor dice que la sesión ya no es válida para admin (código
  // 401) —por ejemplo porque en otra pestaña se inició sesión con otro
  // usuario, ya que el navegador comparte una sola sesión entre todas las
  // pestañas del mismo sitio— se manda de vuelta al login en vez de dejar
  // la pantalla pegada en "cargando".
  const sesionInvalida = (status: number) => {
    if (status === 401) {
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const fetchVendedores = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/vendedores");
    if (sesionInvalida(res.status)) return;
    const data = await res.json();
    if (data.success) setVendedores(data.vendedores);
    setLoading(false);
  };

  const crearVendedor = async () => {
    if (!name || !username || !password) {
      setMessage("Todos los campos son obligatorios");
      return;
    }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/vendedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password, role }),
    });
    if (sesionInvalida(res.status)) return;
    const data = await res.json();
    if (data.success) {
      setName("");
      setUsername("");
      setPassword("");
      setRole("VENDEDOR");
      setShowModal(false);
      fetchVendedores();
    } else {
      setMessage(data.error || "Error al crear vendedor");
    }
    setSaving(false);
  };

  const toggleActivo = async (id: string, isActive: boolean) => {
    const res = await fetch("/api/admin/vendedores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    if (sesionInvalida(res.status)) return;
    const data = await res.json();
    if (data.success) fetchVendedores();
  };

  const eliminarVendedor = async (id: string) => {
    setConfirmId(null);
    setDeletingId(id);
    const res = await fetch(`/api/admin/vendedores?id=${id}`, { method: "DELETE" });
    if (sesionInvalida(res.status)) return;
    const data = await res.json();
    if (data.success) {
      setMessage(data.deactivatedInstead ? data.message : "Usuario borrado correctamente.");
      fetchVendedores();
    } else {
      setMessage(data.error || "Error al borrar");
    }
    setDeletingId(null);
  };

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#0B1F17", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* Header — mismo tono (verde/dorado) y mismo logo (letras) que el resto
          del sistema; altura automática por el logo de 145px, igual que en
          AdminClient/VendedorClient/Reclamos/login. */}
      <div style={{ background: "#142B21", borderBottom: "1px solid rgba(217,173,82,0.2)", padding: "16px 38px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ display: "inline-block", lineHeight: 0, background: "#142B21" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-wordmark-santiago-gomez.png" alt="Proyectos Santiago Gómez" style={{ height: "145px", width: "auto", objectFit: "contain", display: "block", mixBlendMode: "screen", filter: "saturate(1.18)" }} />
          </span>
          <p style={{ margin: 0, fontSize: "13px", color: "#57708A", fontWeight: "500" }}>Gestión de Vendedores</p>
        </div>
        <a href="/admin" style={{ color: "#7C93AC", fontSize: "16px", textDecoration: "none", fontWeight: "500", padding: "9px 19px", borderRadius: "10px", border: "1px solid #28405A" }}>← Volver al panel</a>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 16px 60px" }}>

        {/* Título y botón */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#FFFFFF" }}>Vendedores</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#7C93AC" }}>{vendedores.length} vendedor(es) registrado(s)</p>
          </div>
          <button onClick={() => { setShowModal(true); setMessage(""); }} style={{ background: "linear-gradient(135deg, #D9AD52, #B58A2E)", border: "none", borderRadius: "10px", padding: "12px 20px", color: "#0B1F17", fontWeight: "800", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
            + Nuevo usuario
          </button>
        </div>

        {message && !showModal && (
          <div style={{ background: "rgba(252,211,77,0.12)", color: "#FCD34D", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", marginBottom: "16px" }}>
            {message}
          </div>
        )}

        {/* Lista de vendedores */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#57708A" }}>Cargando...</div>
        ) : vendedores.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#57708A", background: "#142B21", borderRadius: "16px", border: "1px solid rgba(217,173,82,0.16)" }}>
            No hay vendedores registrados aún
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {vendedores.map((v) => (
              <div key={v.id} style={{ background: "#142B21", borderRadius: "16px", padding: "20px", border: "1px solid rgba(217,173,82,0.16)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: v.isActive ? "rgba(217,173,82,0.15)" : "rgba(124,147,172,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "700", color: v.isActive ? "#D9AD52" : "#57708A" }}>
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>
                      {v.name}
                      {v.role === "ADMIN" && (
                        <span style={{ marginLeft: "8px", background: "rgba(125,211,252,0.15)", color: "#7DD3FC", borderRadius: "999px", padding: "2px 9px", fontSize: "11px", fontWeight: "700", verticalAlign: "middle" }}>
                          Administrador
                        </span>
                      )}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#7C93AC" }}>@{v.username}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#57708A" }}>Desde {formatFecha(v.createdAt)}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    background: v.isActive ? "rgba(5,150,105,0.15)" : "rgba(239,68,68,0.15)",
                    color: v.isActive ? "#6EE7B7" : "#F87171",
                    borderRadius: "999px", padding: "4px 12px", fontSize: "12px", fontWeight: "700"
                  }}>
                    {v.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <button onClick={() => toggleActivo(v.id, v.isActive)} style={{
                    background: v.isActive ? "rgba(239,68,68,0.1)" : "rgba(5,150,105,0.15)",
                    border: v.isActive ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(110,231,183,0.4)",
                    borderRadius: "8px", padding: "8px 14px",
                    color: v.isActive ? "#F87171" : "#6EE7B7",
                    fontSize: "13px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit"
                  }}>
                    {v.isActive ? "Desactivar" : "Activar"}
                  </button>
                  {confirmId === v.id ? (
                    <>
                      <span style={{ fontSize: "12px", color: "#7C93AC" }}>¿Seguro?</span>
                      <button onClick={() => eliminarVendedor(v.id)} disabled={deletingId === v.id} style={{
                        background: "#DC2626", border: "none", borderRadius: "8px", padding: "8px 14px",
                        color: "#FFFFFF", fontSize: "13px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit"
                      }}>
                        {deletingId === v.id ? "Borrando..." : "Sí, borrar"}
                      </button>
                      <button onClick={() => setConfirmId(null)} style={{
                        background: "transparent", border: "1px solid #28405A", borderRadius: "8px", padding: "8px 14px",
                        color: "#7C93AC", fontSize: "13px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit"
                      }}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmId(v.id)} style={{
                      background: "transparent",
                      border: "1px solid #28405A", borderRadius: "8px", padding: "8px 14px",
                      color: "#7C93AC",
                      fontSize: "13px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit"
                    }}>
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nuevo vendedor */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,31,23,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
          <div style={{ background: "#142B21", border: "1px solid rgba(217,173,82,0.16)", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#FFFFFF" }}>Nuevo usuario</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "#0B1F17", border: "none", borderRadius: "8px", padding: "8px 12px", color: "#7C93AC", cursor: "pointer", fontSize: "16px", fontFamily: "inherit" }}>✕</button>
            </div>
            <input type="text" placeholder="Nombre completo" value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", background: "#142B21", border: "1.5px solid #28405A", borderRadius: "10px", padding: "12px 14px", color: "#FFFFFF", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "10px", fontFamily: "inherit" }}
            />
            <input type="text" placeholder="Usuario (para iniciar sesión)" value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", background: "#142B21", border: "1.5px solid #28405A", borderRadius: "10px", padding: "12px 14px", color: "#FFFFFF", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "10px", fontFamily: "inherit" }}
            />
            <input type="password" placeholder="Contraseña" value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", background: "#142B21", border: "1.5px solid #28405A", borderRadius: "10px", padding: "12px 14px", color: "#FFFFFF", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "10px", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button type="button" onClick={() => setRole("VENDEDOR")} style={{
                flex: 1, borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit",
                border: role === "VENDEDOR" ? "2px solid #D9AD52" : "1px solid #28405A",
                background: role === "VENDEDOR" ? "rgba(217,173,82,0.12)" : "transparent",
                color: role === "VENDEDOR" ? "#D9AD52" : "#7C93AC",
              }}>
                Vendedor
              </button>
              <button type="button" onClick={() => setRole("ADMIN")} style={{
                flex: 1, borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit",
                border: role === "ADMIN" ? "2px solid #7DD3FC" : "1px solid #28405A",
                background: role === "ADMIN" ? "rgba(125,211,252,0.12)" : "transparent",
                color: role === "ADMIN" ? "#7DD3FC" : "#7C93AC",
              }}>
                Administrador
              </button>
            </div>
            {message && <p style={{ color: "#F87171", fontSize: "13px", marginBottom: "12px" }}>{message}</p>}
            <button onClick={crearVendedor} disabled={saving} style={{ width: "100%", background: saving ? "#28405A" : "linear-gradient(135deg, #D9AD52, #B58A2E)", border: "none", borderRadius: "10px", padding: "14px", color: saving ? "#7C93AC" : "#0B1F17", fontWeight: "800", fontSize: "15px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {saving ? "Creando..." : role === "ADMIN" ? "Crear administrador" : "Crear vendedor"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
