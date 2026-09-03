"use client";
import { useState, useEffect, useRef } from "react";

export default function AdminPage() {
  const [stats, setStats] = useState({ total: 0, available: 0, reserved: 0, partial: 0, paid: 0, recaudado: 0 });
  const [tickets, setTickets] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("SIN_DISPONIBLES");
  const [vendedorFiltro, setVendedorFiltro] = useState("");
  const [showVendedorMenu, setShowVendedorMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [abonoAmount, setAbonoAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [step, setStep] = useState<"form" | "abono">("form");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");
  const timerRef = useRef<any>(null);
  const vendedorMenuRef = useRef<any>(null);

  const TICKET_PRICE = 80000;

  useEffect(() => {
    fetchStats();
    fetchTickets("", "SIN_DISPONIBLES");
    fetchVendedores();
    const handleClick = (e: MouseEvent) => {
      if (vendedorMenuRef.current && !vendedorMenuRef.current.contains(e.target)) {
        setShowVendedorMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchStats = async () => {
    const res = await fetch("/api/admin/stats");
    const data = await res.json();
    if (data.success) setStats(data.stats);
  };

  const fetchVendedores = async () => {
    const res = await fetch("/api/admin/vendedores");
    const data = await res.json();
    if (data.success) setVendedores(data.vendedores);
  };

  const fetchTickets = async (q = "", f = filtro, vend = vendedorFiltro) => {
    setLoading(true);
    const searchNum = q.startsWith("0") ? parseInt(q).toString() : q;
    let result: any[] = [];
    if (f === "SIN_DISPONIBLES") {
      const statuses = ["RESERVED", "PARTIAL", "PAID"];
      const responses = await Promise.all(
        statuses.map(s => fetch(`/api/admin/tickets?search=${searchNum}&status=${s}`).then(r => r.json()))
      );
      for (const data of responses) {
        if (data.success) result = [...result, ...data.tickets];
      }
      result.sort((a, b) => a.number - b.number);
    } else {
      const url = `/api/admin/tickets?search=${searchNum}&status=${f}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) result = data.tickets;
    }
    if (vend) {
      result = result.filter((t: any) =>
        t.client?.notes?.toLowerCase().includes(vend.toLowerCase())
      );
    }
    setTickets(result);
    setLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchTickets(val, filtro, vendedorFiltro), 150);
  };

  const handleFiltro = (f: string) => {
    setFiltro(f);
    setVendedorFiltro("");
    fetchTickets(search, f, "");
  };

  const handleVendedor = (nombre: string) => {
    setVendedorFiltro(nombre);
    setFiltro("SIN_DISPONIBLES");
    setShowVendedorMenu(false);
    fetchTickets(search, "SIN_DISPONIBLES", nombre);
  };

  const limpiarVendedor = () => {
    setVendedorFiltro("");
    fetchTickets(search, filtro, "");
  };

  const openModal = (ticket: any) => {
    setSelectedTicket(ticket);
    setClientName(ticket.client?.name || "");
    setClientPhone(ticket.client?.phone || "");
    setClientCity(ticket.client?.city || "");
    setAbonoAmount("");
    setPaymentMethod("");
    setMessage("");
    setStep(ticket.client ? "abono" : "form");
    setShowModal(true);
  };

  const handleAsignar = async (tipo: "RESERVED" | "PARTIAL" | "PAID") => {
    if (!clientName || !clientPhone) { setMessage("Nombre y teléfono son obligatorios"); return; }
    if (tipo === "PARTIAL" && !abonoAmount) { setMessage("Ingresa el monto abonado"); return; }
    setSaving(true);
    try {
      const resClient = await fetch("/api/admin/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, phone: clientPhone, city: clientCity }),
      });
      const dataClient = await resClient.json();
      if (!dataClient.success) { setMessage("Error al crear cliente"); setSaving(false); return; }
      const abono = tipo === "PAID" ? TICKET_PRICE : tipo === "PARTIAL" ? parseFloat(abonoAmount) || 0 : 0;
      const resTicket = await fetch("/api/admin/asignar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selectedTicket.id, clientId: dataClient.client.id, amountPaid: abono }),
      });
      const dataTicket = await resTicket.json();
      if (dataTicket.success) {
        await Promise.all([fetchStats(), fetchTickets(search, filtro, vendedorFiltro)]);
        setShowModal(false);
      } else { setMessage(dataTicket.error || "Error al asignar"); }
    } catch { setMessage("Error de conexión"); }
    setSaving(false);
  };

  const copiarLink = (token: string) => {
    const link = `${window.location.origin}/boleta/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => { setCopied(""); setShowModal(false); }, 1500);
  };

  const liberarBoleta = async (ticketId: string) => {
    if (!confirm("¿Seguro que quieres liberar esta boleta?")) return;
    const res = await fetch("/api/admin/liberar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId }),
    });
    const data = await res.json();
    if (data.success) { fetchStats(); fetchTickets(search, filtro, vendedorFiltro); }
  };

  const formatPeso = (value: number) => "$" + value.toLocaleString("es-CO");

  const getStatusBadge = (ticket: any) => {
    if (ticket.status === "PAID") return { label: "✅ Pagada", bg: "rgba(5,150,105,0.15)", color: "#6EE7B7" };
    if (ticket.status === "PARTIAL") return { label: "⏳ Abono", bg: "rgba(217,119,6,0.15)", color: "#FCD34D" };
    if (ticket.status === "RESERVED") return { label: "● Reservada", bg: "rgba(14,165,233,0.15)", color: "#7DD3FC" };
    return { label: "○ Disponible", bg: "rgba(148,163,184,0.15)", color: "#94A3B8" };
  };

  const totalOcupadas = stats.reserved + stats.partial + stats.paid;

  const filtros = [
    { key: "SIN_DISPONIBLES", label: "Todas", count: totalOcupadas },
    { key: "AVAILABLE", label: "Disponibles", count: stats.available },
    { key: "RESERVED", label: "Separadas", count: stats.reserved },
    { key: "PARTIAL", label: "Con abono", count: stats.partial },
    { key: "PAID", label: "Pagadas", count: stats.paid },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#111827", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        select:focus { outline: none; }
        button:active { transform: scale(0.98); }
        tr:hover td { background: rgba(212,168,67,0.04); }
        input::placeholder { color: #475569; }
      `}</style>

      {/* Marca de agua esquina inferior derecha */}
      <div style={{ position: "fixed", bottom: "24px", right: "24px", pointerEvents: "none", zIndex: 0, textAlign: "center", lineHeight: 1 }}>
        <div style={{ fontSize: "80px", fontWeight: 900, color: "rgba(212,168,67,0.08)", fontFamily: "monospace", letterSpacing: "-4px" }}>SG</div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(212,168,67,0.08)", fontFamily: "monospace", letterSpacing: "5px", marginTop: "-8px" }}>PROYECTOS</div>
      </div>

      {/* Marca de agua esquina superior izquierda */}
      <div style={{ position: "fixed", top: "80px", left: "24px", pointerEvents: "none", zIndex: 0, textAlign: "center", lineHeight: 1 }}>
        <div style={{ fontSize: "80px", fontWeight: 900, color: "rgba(212,168,67,0.08)", fontFamily: "monospace", letterSpacing: "-4px" }}>SG</div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(212,168,67,0.08)", fontFamily: "monospace", letterSpacing: "5px", marginTop: "-8px" }}>PROYECTOS</div>
      </div>

      {/* Header */}
      <div style={{ background: "#0F172A", borderBottom: "1px solid rgba(212,168,67,0.2)", padding: "0 32px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo-rg.jpeg.jpeg" alt="Proyectos Santiago Gómez" style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" }} />
          <div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#D4A843", letterSpacing: "0.5px" }}>Proyectos Santiago Gómez</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#475569", fontWeight: "500" }}>Panel Administrador</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a href="/admin/vendedores" style={{ color: "#D4A843", fontSize: "13px", textDecoration: "none", fontWeight: "600", padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(212,168,67,0.3)", background: "rgba(212,168,67,0.08)" }}>👥 Vendedores</a>
          <a href="/api/auth/logout" style={{ color: "#475569", fontSize: "13px", textDecoration: "none", fontWeight: "500", padding: "7px 16px", borderRadius: "8px", border: "1px solid #1E293B" }}>Cerrar sesión</a>
        </div>
      </div>

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "28px 20px", position: "relative", zIndex: 1 }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: "Total boletas", value: stats.total.toLocaleString() },
            { label: "Disponibles", value: stats.available.toLocaleString() },
            { label: "Reservadas", value: stats.reserved.toLocaleString() },
            { label: "Con abono", value: stats.partial.toLocaleString() },
            { label: "Pagadas", value: stats.paid.toLocaleString() },
          ].map((s) => (
            <div key={s.label} style={{ background: "#1E293B", borderRadius: "16px", padding: "18px", textAlign: "center", border: "1px solid rgba(212,168,67,0.15)" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "0.5px" }}>{s.label.toUpperCase()}</p>
              <p style={{ margin: "8px 0 0", fontSize: "28px", fontWeight: "800", color: "#D4A843", fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recaudo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "TOTAL RECAUDADO", value: formatPeso(stats.paid * TICKET_PRICE) },
            { label: "TOTAL ABONOS", value: formatPeso(stats.recaudado) },
            { label: "META TOTAL", value: formatPeso(stats.total * TICKET_PRICE) },
          ].map((s) => (
            <div key={s.label} style={{ background: "#1E293B", borderRadius: "16px", padding: "18px", border: "1px solid rgba(212,168,67,0.15)" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "0.5px" }}>{s.label}</p>
              <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: "800", color: "#D4A843", fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Buscador + Filtros */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por número, nombre o teléfono..."
            value={search}
            onChange={handleSearch}
            style={{ flex: 1, minWidth: "260px", background: "#1E293B", border: "1px solid rgba(212,168,67,0.2)", borderRadius: "12px", padding: "13px 18px", color: "#E2E8F0", fontSize: "14px", outline: "none", fontFamily: "inherit", fontWeight: "500" }}
          />
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            {filtros.map((f) => {
              const activo = filtro === f.key && !vendedorFiltro;
              return (
                <button key={f.key} onClick={() => handleFiltro(f.key)}
                  style={{
                    background: activo ? "linear-gradient(135deg, #D4A843, #B8860B)" : "#1E293B",
                    border: activo ? "none" : "1px solid rgba(212,168,67,0.2)",
                    borderRadius: "10px", padding: "10px 14px",
                    color: activo ? "#0F172A" : "#94A3B8",
                    fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "7px",
                  }}>
                  {f.label}
                  <span style={{
                    background: activo ? "rgba(0,0,0,0.15)" : "rgba(212,168,67,0.15)",
                    color: activo ? "#0F172A" : "#D4A843",
                    borderRadius: "999px",
                    padding: "1px 7px",
                    fontSize: "11px",
                    fontWeight: "800",
                    fontFamily: "'DM Mono', monospace",
                  }}>{f.count}</span>
                </button>
              );
            })}

            {/* Dropdown Vendedor */}
            <div ref={vendedorMenuRef} style={{ position: "relative" }}>
              <button onClick={() => setShowVendedorMenu(!showVendedorMenu)}
                style={{
                  background: vendedorFiltro ? "linear-gradient(135deg, #D4A843, #B8860B)" : "#1E293B",
                  border: vendedorFiltro ? "none" : "1px solid rgba(212,168,67,0.2)",
                  borderRadius: "10px", padding: "10px 14px",
                  color: vendedorFiltro ? "#0F172A" : "#94A3B8",
                  fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                {vendedorFiltro || "Vendedor"} ▾
              </button>
              {showVendedorMenu && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#1E293B", border: "1px solid rgba(212,168,67,0.2)", borderRadius: "12px", padding: "6px", minWidth: "180px", zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                  {vendedorFiltro && (
                    <button onClick={limpiarVendedor} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "8px", padding: "9px 14px", color: "#F87171", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: "4px" }}>
                      ✕ Quitar filtro
                    </button>
                  )}
                  {vendedores.filter(v => v.isActive).map((v) => (
                    <button key={v.id} onClick={() => handleVendedor(v.name)}
                      style={{ width: "100%", background: vendedorFiltro === v.name ? "rgba(212,168,67,0.15)" : "transparent", border: "none", borderRadius: "8px", padding: "9px 14px", color: vendedorFiltro === v.name ? "#D4A843" : "#E2E8F0", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      {v.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Etiqueta vendedor activo */}
        {vendedorFiltro && (
          <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "#D4A843", fontWeight: "600" }}>
              🧑‍💼 Boletas de: <strong>{vendedorFiltro}</strong>
            </span>
            <span style={{ fontSize: "12px", color: "#475569" }}>— {tickets.length} boleta(s)</span>
            <button onClick={limpiarVendedor} style={{ background: "none", border: "none", color: "#F87171", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>✕ Quitar</button>
          </div>
        )}

        {/* Tabla */}
        <div style={{ background: "#1E293B", borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(212,168,67,0.15)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0F172A", borderBottom: "1px solid rgba(212,168,67,0.15)" }}>
                {["Número", "Estado", "Cliente", "Teléfono", "Ciudad", "Vendedor", "Abono / Resta", "Acciones"].map((h) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontWeight: "700", fontSize: "11px", color: "#475569", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#475569", fontSize: "14px" }}>Cargando...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#475569", fontSize: "14px" }}>No se encontraron boletas</td></tr>
              ) : tickets.map((ticket: any) => {
                const abonado = ticket.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || Number(ticket.amountPaid) || 0;
                const resta = TICKET_PRICE - abonado;
                const badge = getStatusBadge(ticket);
                return (
                  <tr key={ticket.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "14px 16px", fontFamily: "'DM Mono', monospace", fontWeight: "700", color: "#D4A843", fontSize: "16px" }}>
                      {String(ticket.number).padStart(4, "0")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#E2E8F0", fontSize: "13px", fontWeight: "500" }}>{ticket.client?.name || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "13px" }}>{ticket.client?.phone || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "13px" }}>{ticket.client?.city || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "13px" }}>{ticket.assignedByName || ticket.client?.notes?.replace("Vendedor: ", "").split(" (")[0] || "-"}</td>
                    <td style={{ padding: "14px 16px", fontSize: "12px" }}>
                      {ticket.status === "PARTIAL" ? (
                        <span style={{ color: "#FCD34D", fontWeight: "600" }}>{formatPeso(abonado)} <span style={{ color: "#F87171" }}>· Resta {formatPeso(resta)}</span></span>
                      ) : ticket.status === "PAID" ? (
                        <span style={{ color: "#6EE7B7", fontWeight: "700" }}>{formatPeso(TICKET_PRICE)} ✓</span>
                      ) : "-"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {ticket.status !== "AVAILABLE" && (
                          <button onClick={() => copiarLink(ticket.token)} style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "8px", padding: "5px 10px", color: "#7DD3FC", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                            {copied === ticket.token ? "✓" : "🔗"}
                          </button>
                        )}
                        {ticket.status !== "PAID" && (
                          <button onClick={() => openModal(ticket)} style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "8px", padding: "5px 10px", color: "#D4A843", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>
                            {ticket.status === "AVAILABLE" ? "Asignar" : "Abonar"}
                          </button>
                        )}
                        {ticket.status !== "AVAILABLE" && (
                          <button onClick={() => liberarBoleta(ticket.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "5px 10px", color: "#F87171", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>
                            Liberar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedTicket && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
          <div style={{ background: "#1E293B", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(212,168,67,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#475569", letterSpacing: "2px", fontWeight: "600" }}>BOLETA</p>
                <h2 style={{ margin: "4px 0 0", fontSize: "40px", fontWeight: "900", color: "#D4A843", fontFamily: "'DM Mono', monospace", letterSpacing: "6px" }}>
                  {String(selectedTicket.number).padStart(4, "0")}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569" }}>Valor total: {formatPeso(TICKET_PRICE)}</p>
                {selectedTicket.assignedByName && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#D4A843" }}>🧑‍💼 Registrado por: {selectedTicket.assignedByName}</p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "#0F172A", border: "1px solid #2D3348", borderRadius: "10px", padding: "8px 12px", color: "#64748B", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>

            {step === "form" && (
              <>
                {["Nombre del cliente", "Teléfono", "Ciudad"].map((placeholder, idx) => (
                  <input key={idx} type="text" placeholder={placeholder}
                    value={idx === 0 ? clientName : idx === 1 ? clientPhone : clientCity}
                    onChange={(e) => idx === 0 ? setClientName(e.target.value) : idx === 1 ? setClientPhone(e.target.value) : setClientCity(e.target.value)}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #2D3348", borderRadius: "12px", padding: "12px 14px", color: "#E2E8F0", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "10px", fontFamily: "inherit", fontWeight: "500" }}
                  />
                ))}
                {message && <p style={{ color: "#F87171", fontSize: "13px", marginBottom: "10px", fontWeight: "500" }}>⚠ {message}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button onClick={() => handleAsignar("RESERVED")} disabled={saving} style={{ background: "#0F172A", border: "1px solid #2D3348", borderRadius: "12px", padding: "14px", color: "#64748B", fontWeight: "600", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                    Solo separar
                  </button>
                  <button onClick={() => setStep("abono")} disabled={saving} style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "12px", padding: "14px", color: "#D4A843", fontWeight: "700", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                    + Registrar abono
                  </button>
                  <button onClick={() => handleAsignar("PAID")} disabled={saving} style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, #D4A843, #B8860B)", border: "none", borderRadius: "12px", padding: "14px", color: "#0F172A", fontWeight: "800", cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
                    ✓ Pagada completa — {formatPeso(TICKET_PRICE)}
                  </button>
                </div>
              </>
            )}

            {step === "abono" && (
              <>
                <div style={{ background: "#0F172A", borderRadius: "12px", padding: "14px", marginBottom: "16px", border: "1px solid #2D3348" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "0.5px" }}>CLIENTE</p>
                  <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: "700", color: "#E2E8F0" }}>{clientName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748B" }}>{clientPhone} {clientCity ? `· ${clientCity}` : ""}</p>
                </div>

                {selectedTicket.payments && selectedTicket.payments.length > 0 && (
                  <div style={{ background: "rgba(5,150,105,0.08)", borderRadius: "12px", padding: "14px", marginBottom: "16px", border: "1px solid rgba(5,150,105,0.3)" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#475569", fontWeight: "700", letterSpacing: "1px" }}>HISTORIAL DE ABONOS</p>
                    {selectedTicket.payments.map((p: any, i: number) => {
                      const fecha = new Date(p.createdAt);
                      const dia = String(fecha.getDate()).padStart(2, "0");
                      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
                      const anio = fecha.getFullYear();
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", marginTop: "8px", paddingTop: i > 0 ? "8px" : "0", borderTop: i > 0 ? "1px solid rgba(5,150,105,0.2)" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "13px", color: "#64748B" }}>{dia}/{mes}/{anio}</span>
                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#6EE7B7" }}>{formatPeso(Number(p.amount))}</span>
                          </div>
                          {p.createdByName && (
                            <span style={{ fontSize: "11px", color: "#D4A843" }}>🧑‍💼 {p.createdByName}</span>
                          )}
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(5,150,105,0.3)" }}>
                      <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "700" }}>Total abonado</span>
                      <span style={{ fontSize: "13px", fontWeight: "900", color: "#6EE7B7" }}>
                        {formatPeso(selectedTicket.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                      </span>
                    </div>
                  </div>
                )}

                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #2D3348", borderRadius: "12px", padding: "12px 14px", color: "#E2E8F0", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "10px", fontFamily: "inherit" }}>
                  <option value="">Medio de pago</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia bancaria</option>
                  <option value="NEQUI">Nequi</option>
                  <option value="DAVIPLATA">Daviplata</option>
                </select>
                <input type="number" placeholder="Monto a abonar ($)" value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid rgba(212,168,67,0.4)", borderRadius: "12px", padding: "12px 14px", color: "#E2E8F0", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "8px", fontFamily: "inherit" }}
                />
                {abonoAmount && (
                  <p style={{ color: "#475569", fontSize: "13px", marginBottom: "16px", fontWeight: "500" }}>
                    Resta por pagar: {formatPeso(Math.max(0, TICKET_PRICE - parseFloat(abonoAmount || "0")))}
                  </p>
                )}
                {message && <p style={{ color: "#F87171", fontSize: "13px", marginBottom: "10px", fontWeight: "500" }}>⚠ {message}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  {!selectedTicket.client && (
                    <button onClick={() => setStep("form")} style={{ background: "#0F172A", border: "1px solid #2D3348", borderRadius: "12px", padding: "14px 20px", color: "#64748B", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>← Volver</button>
                  )}
                  <button onClick={() => handleAsignar("PARTIAL")} disabled={saving} style={{ flex: 1, background: "linear-gradient(135deg, #D4A843, #B8860B)", border: "none", borderRadius: "12px", padding: "14px", color: "#0F172A", fontWeight: "800", cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
                    {saving ? "Guardando..." : "Registrar abono"}
                  </button>
                  <button onClick={() => handleAsignar("PAID")} disabled={saving} style={{ background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.3)", borderRadius: "12px", padding: "14px 16px", color: "#6EE7B7", fontWeight: "700", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                    ✓ Completa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
