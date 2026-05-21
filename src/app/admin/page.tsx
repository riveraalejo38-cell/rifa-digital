"use client";
import { useState, useEffect, useRef } from "react";

export default function AdminPage() {
  const [stats, setStats] = useState({ total: 0, available: 0, reserved: 0, partial: 0, paid: 0, recaudado: 0 });
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
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

  const TICKET_PRICE = 70000;

  useEffect(() => {
    fetchStats();
    fetchTickets("");
  }, []);

  const fetchStats = async () => {
    const res = await fetch("/api/admin/stats");
    const data = await res.json();
    if (data.success) setStats(data.stats);
  };

  const fetchTickets = async (q = "") => {
    setLoading(true);
    const searchNum = q.startsWith("0") ? parseInt(q).toString() : q;
    const res = await fetch(`/api/admin/tickets?search=${searchNum}`);
    const data = await res.json();
    if (data.success) setTickets(data.tickets);
    setLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchTickets(val), 150);
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
    if (!clientName || !clientPhone) {
      setMessage("Nombre y teléfono son obligatorios");
      return;
    }
    if (tipo === "PARTIAL" && !abonoAmount) {
      setMessage("Ingresa el monto abonado");
      return;
    }
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
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          clientId: dataClient.client.id,
          amountPaid: abono,
        }),
      });
      const dataTicket = await resTicket.json();
      if (dataTicket.success) {
        await Promise.all([fetchStats(), fetchTickets(search)]);
        setShowModal(false);
      } else {
        setMessage(dataTicket.error || "Error al asignar");
      }
    } catch {
      setMessage("Error de conexión");
    }
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
    if (data.success) { fetchStats(); fetchTickets(search); }
  };

  const formatPeso = (value: number) => "$" + value.toLocaleString("es-CO");

  const getStatusBadge = (ticket: any) => {
    if (ticket.status === "PAID") return { label: "✅ Pagada", bg: "#D1FAE5", color: "#059669" };
    if (ticket.status === "PARTIAL") return { label: "⏳ Abono", bg: "#FEF3C7", color: "#D97706" };
    if (ticket.status === "RESERVED") return { label: "● Reservada", bg: "#DBEAFE", color: "#0284C7" };
    return { label: "○ Disponible", bg: "#F3F4F6", color: "#6B7280" };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F9FC", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        select:focus { outline: none; }
        button:active { transform: scale(0.98); }
        tr:hover { background: #F7F9FC; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1A1F2E", borderBottom: "1px solid #2D3348", padding: "0 32px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo-rg.jpeg.jpeg" alt="RG Proyectos" style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" }} />
          <div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#D4A843", letterSpacing: "0.5px" }}>RG Proyectos</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#64748B", fontWeight: "500" }}>Panel Administrador</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <a href="/admin/vendedores" style={{ color: "#0EA5E9", fontSize: "13px", textDecoration: "none", fontWeight: "600", padding: "6px 14px", borderRadius: "8px", border: "1px solid #1E3A5F" }}>👥 Vendedores</a>
          <a href="/api/auth/logout" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", fontWeight: "500", padding: "6px 14px", borderRadius: "8px", border: "1px solid #2D3348" }}>Cerrar sesión</a>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 20px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: "Total boletas", value: stats.total.toLocaleString(), color: "#0F172A", bg: "#F7F9FC", border: "#E2E8F0" },
            { label: "Disponibles", value: stats.available.toLocaleString(), color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
            { label: "Reservadas", value: stats.reserved.toLocaleString(), color: "#0284C7", bg: "#EFF6FF", border: "#BFDBFE" },
            { label: "Con abono", value: stats.partial.toLocaleString(), color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
            { label: "Pagadas", value: stats.paid.toLocaleString(), color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: "16px", padding: "18px", textAlign: "center", border: `1.5px solid ${s.border}` }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600", letterSpacing: "0.5px" }}>{s.label.toUpperCase()}</p>
              <p style={{ margin: "8px 0 0", fontSize: "28px", fontWeight: "800", color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recaudo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "18px", border: "1.5px solid #E2E8F0" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600", letterSpacing: "0.5px" }}>TOTAL RECAUDADO</p>
            <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: "800", color: "#059669", fontFamily: "'DM Mono', monospace" }}>{formatPeso(stats.paid * TICKET_PRICE)}</p>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "18px", border: "1.5px solid #E2E8F0" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600", letterSpacing: "0.5px" }}>TOTAL ABONOS</p>
            <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: "800", color: "#D97706", fontFamily: "'DM Mono', monospace" }}>{formatPeso(stats.recaudado)}</p>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "18px", border: "1.5px solid #E2E8F0" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600", letterSpacing: "0.5px" }}>META TOTAL</p>
            <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: "800", color: "#94A3B8", fontFamily: "'DM Mono', monospace" }}>{formatPeso(stats.total * TICKET_PRICE)}</p>
          </div>
        </div>

        {/* Buscador */}
        <input
          type="text"
          placeholder="🔍 Buscar por número (ej: 0102), nombre o teléfono..."
          value={search}
          onChange={handleSearch}
          style={{ width: "100%", background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: "14px", padding: "14px 18px", color: "#0F172A", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "16px", fontFamily: "inherit", fontWeight: "500" }}
        />

        {/* Tabla */}
        <div style={{ background: "#FFFFFF", borderRadius: "20px", overflow: "hidden", border: "1.5px solid #E2E8F0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F7F9FC", borderBottom: "1.5px solid #E2E8F0" }}>
                {["Número", "Estado", "Cliente", "Teléfono", "Ciudad", "Vendedor", "Abono / Resta", "Acciones"].map((h) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontWeight: "700", fontSize: "11px", color: "#94A3B8", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94A3B8", fontSize: "14px" }}>Cargando...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94A3B8", fontSize: "14px" }}>No se encontraron boletas</td></tr>
              ) : tickets.map((ticket: any) => {
                const abonado = ticket.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || Number(ticket.amountPaid) || 0;
                const resta = TICKET_PRICE - abonado;
                const badge = getStatusBadge(ticket);
                return (
                  <tr key={ticket.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 16px", fontFamily: "'DM Mono', monospace", fontWeight: "700", color: "#0F172A", fontSize: "16px" }}>
                      {String(ticket.number).padStart(4, "0")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#0F172A", fontSize: "13px", fontWeight: "500" }}>{ticket.client?.name || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "13px" }}>{ticket.client?.phone || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "13px" }}>{ticket.client?.city || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "13px" }}>{ticket.client?.notes?.replace("Vendedor: ", "").split(" (")[0] || "-"}</td>
                    <td style={{ padding: "14px 16px", fontSize: "12px" }}>
                      {ticket.status === "PARTIAL" ? (
                        <span style={{ color: "#D97706", fontWeight: "600" }}>{formatPeso(abonado)} <span style={{ color: "#EF4444" }}>· Resta {formatPeso(resta)}</span></span>
                      ) : ticket.status === "PAID" ? (
                        <span style={{ color: "#059669", fontWeight: "700" }}>{formatPeso(TICKET_PRICE)} ✓</span>
                      ) : "-"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {ticket.status !== "AVAILABLE" && (
                          <button onClick={() => copiarLink(ticket.token)} style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "8px", padding: "5px 10px", color: "#0284C7", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                            {copied === ticket.token ? "✓" : "🔗"}
                          </button>
                        )}
                        {ticket.status !== "PAID" && (
                          <button onClick={() => openModal(ticket)} style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: "8px", padding: "5px 10px", color: "#D97706", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>
                            {ticket.status === "AVAILABLE" ? "Asignar" : "Abonar"}
                          </button>
                        )}
                        {ticket.status !== "AVAILABLE" && (
                          <button onClick={() => liberarBoleta(ticket.id)} style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: "8px", padding: "5px 10px", color: "#EF4444", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", letterSpacing: "2px", fontWeight: "600" }}>BOLETA</p>
                <h2 style={{ margin: "4px 0 0", fontSize: "40px", fontWeight: "900", color: "#0F172A", fontFamily: "'DM Mono', monospace", letterSpacing: "6px" }}>
                  {String(selectedTicket.number).padStart(4, "0")}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94A3B8" }}>Valor total: {formatPeso(TICKET_PRICE)}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "10px", padding: "8px 12px", color: "#64748B", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>

            {step === "form" && (
              <>
                <input type="text" placeholder="Nombre del cliente" value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", color: "#0F172A", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "10px", fontFamily: "inherit", fontWeight: "500" }}
                />
                <input type="text" placeholder="Teléfono" value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", color: "#0F172A", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "10px", fontFamily: "inherit", fontWeight: "500" }}
                />
                <input type="text" placeholder="Ciudad" value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", color: "#0F172A", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "16px", fontFamily: "inherit", fontWeight: "500" }}
                />
                {message && <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "10px", fontWeight: "500" }}>⚠ {message}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button onClick={() => handleAsignar("RESERVED")} disabled={saving} style={{ background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "14px", color: "#64748B", fontWeight: "600", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                    Solo separar
                  </button>
                  <button onClick={() => setStep("abono")} disabled={saving} style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: "12px", padding: "14px", color: "#D97706", fontWeight: "700", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                    + Registrar abono
                  </button>
                  <button onClick={() => handleAsignar("PAID")} disabled={saving} style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, #0EA5E9, #0284C7)", border: "none", borderRadius: "12px", padding: "14px", color: "#FFFFFF", fontWeight: "700", cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
                    ✓ Pagada completa — {formatPeso(TICKET_PRICE)}
                  </button>
                </div>
              </>
            )}

            {step === "abono" && (
              <>
                <div style={{ background: "#F7F9FC", borderRadius: "12px", padding: "14px", marginBottom: "16px", border: "1.5px solid #E2E8F0" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600", letterSpacing: "0.5px" }}>CLIENTE</p>
                  <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>{clientName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748B" }}>{clientPhone} {clientCity ? `· ${clientCity}` : ""}</p>
                </div>

                {selectedTicket.payments && selectedTicket.payments.length > 0 && (
                  <div style={{ background: "#F0FDF4", borderRadius: "12px", padding: "14px", marginBottom: "16px", border: "1.5px solid #BBF7D0" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "700", letterSpacing: "1px" }}>HISTORIAL DE ABONOS</p>
                    {selectedTicket.payments.map((p: any, i: number) => {
                      const fecha = new Date(p.createdAt);
                      const dia = String(fecha.getDate()).padStart(2, "0");
                      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
                      const anio = fecha.getFullYear();
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: i > 0 ? "8px" : "0", borderTop: i > 0 ? "1px solid #D1FAE5" : "none" }}>
                          <span style={{ fontSize: "13px", color: "#64748B" }}>{dia}/{mes}/{anio}</span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#059669" }}>{formatPeso(Number(p.amount))}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "2px solid #BBF7D0" }}>
                      <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "700" }}>Total abonado</span>
                      <span style={{ fontSize: "13px", fontWeight: "900", color: "#059669" }}>
                        {formatPeso(selectedTicket.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                      </span>
                    </div>
                  </div>
                )}

                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", color: "#0F172A", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "10px", fontFamily: "inherit", fontWeight: "500" }}>
                  <option value="">Medio de pago</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia bancaria</option>
                  <option value="NEQUI">Nequi</option>
                  <option value="DAVIPLATA">Daviplata</option>
                </select>
                <input type="number" placeholder="Monto a abonar ($)" value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                  style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #0EA5E9", borderRadius: "12px", padding: "12px 14px", color: "#0F172A", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "8px", fontFamily: "inherit", fontWeight: "500" }}
                />
                {abonoAmount && (
                  <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "16px", fontWeight: "500" }}>
                    Resta por pagar: {formatPeso(Math.max(0, TICKET_PRICE - parseFloat(abonoAmount || "0")))}
                  </p>
                )}
                {message && <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "10px", fontWeight: "500" }}>⚠ {message}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  {!selectedTicket.client && (
                    <button onClick={() => setStep("form")} style={{ background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "14px 20px", color: "#64748B", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>← Volver</button>
                  )}
                  <button onClick={() => handleAsignar("PARTIAL")} disabled={saving} style={{ flex: 1, background: "linear-gradient(135deg, #0EA5E9, #0284C7)", border: "none", borderRadius: "12px", padding: "14px", color: "#FFFFFF", fontWeight: "700", cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
                    {saving ? "Guardando..." : "Registrar abono"}
                  </button>
                  <button onClick={() => handleAsignar("PAID")} disabled={saving} style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: "12px", padding: "14px 16px", color: "#059669", fontWeight: "700", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
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
