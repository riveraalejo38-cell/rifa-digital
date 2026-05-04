"use client";
import { useState, useEffect } from "react";

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchVendedores();
  }, []);

  const fetchVendedores = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/vendedores");
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
      body: JSON.stringify({ name, username, password, role: "VENDEDOR" }),
    });
    const data = await res.json();
    if (data.success) {
      setName("");
      setUsername("");
      setPassword("");
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
    const data = await res.json();
    if (data.success) fetchVendedores();
  };

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#F2F4F7", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#1C1C2E", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "2px" }}>COLRIFAS</h1>
          <p style={{ margin: 0, fontSize: "11px", color: "#6B7280" }}>Gestión de Vendedores</p>
        </div>
        <a href="/admin" style={{ color: "#6B7280", fontSize: "13px", textDecoration: "none" }}>← Volver al panel</a>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Título y botón */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1C1C2E" }}>Vendedores</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>{vendedores.length} vendedor(es) registrado(s)</p>
          </div>
          <button onClick={() => { setShowModal(true); setMessage(""); }} style={{ background: "#3B5998", border: "none", borderRadius: "10px", padding: "12px 20px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
            + Nuevo vendedor
          </button>
        </div>

        {/* Lista de vendedores */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>Cargando...</div>
        ) : vendedores.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6B7280", background: "#FFFFFF", borderRadius: "16px" }}>
            No hay vendedores registrados aún
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {vendedores.map((v) => (
              <div key={v.id} style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: v.isActive ? "#DBEAFE" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "700", color: v.isActive ? "#3B5998" : "#9CA3AF" }}>
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1C1C2E" }}>{v.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6B7280" }}>@{v.username}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9CA3AF" }}>Desde {formatFecha(v.createdAt)}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    background: v.isActive ? "#D1FAE5" : "#FEF2F2",
                    color: v.isActive ? "#2D6A4F" : "#DC2626",
                    borderRadius: "999px", padding: "4px 12px", fontSize: "12px", fontWeight: "700"
                  }}>
                    {v.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <button onClick={() => toggleActivo(v.id, v.isActive)} style={{
                    background: v.isActive ? "#FEF2F2" : "#D1FAE5",
                    border: "none", borderRadius: "8px", padding: "8px 14px",
                    color: v.isActive ? "#DC2626" : "#2D6A4F",
                    fontSize: "13px", cursor: "pointer", fontWeight: "600"
                  }}>
                    {v.isActive ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nuevo vendedor */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1C1C2E" }}>Nuevo vendedor</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "#F2F4F7", border: "none", borderRadius: "8px", padding: "8px 12px", color: "#6B7280", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <input type="text" placeholder="Nombre completo" value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}
            />
            <input type="text" placeholder="Usuario (para iniciar sesión)" value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}
            />
            <input type="password" placeholder="Contraseña" value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "16px" }}
            />
            {message && <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "12px" }}>{message}</p>}
            <button onClick={crearVendedor} disabled={saving} style={{ width: "100%", background: "#3B5998", border: "none", borderRadius: "10px", padding: "14px", color: "#FFFFFF", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>
              {saving ? "Creando..." : "Crear vendedor"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}