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
      setMessage("❌ Nombre y teléfono son obligatorios");
      return;
    }
    if (tipo === "PARTIAL" && !abonoAmount) {
      setMessage("❌ Ingresa el monto abonado");
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
      if (!dataClient.success) { setMessage("❌ Error al crear cliente"); setSaving(false); return; }

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
        setMessage("❌ " + dataTicket.error);
      }
    } catch {
      setMessage("❌ Error de conexión");
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
    if (ticket.status === "PAID") return { label: "✅ Pagada", bg: "#D1FAE5", color: "#2D6A4F" };
    if (ticket.status === "PARTIAL") return { label: "⏳ Abono", bg: "#FEF3C7", color: "#D97706" };
    if (ticket.status === "RESERVED") return { label: "● Reservada", bg: "#DBEAFE", color: "#3B5998" };
    return { label: "○ Disponible", bg: "#F3F4F6", color: "#6B7280" };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F2F4F7", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#1C1C2E", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "2px" }}>COLRIFAS</h1>
          <p style={{ margin: 0, fontSize: "11px", color: "#6B7280" }}>Panel Administrador</p>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <a href="/admin/vendedores" style={{ color: "#2A9D8F", fontSize: "13px", textDecoration: "none", fontWeight: "600" }}>👥 Vendedores</a>
          <a href="/api/auth/logout" style={{ color: "#6B7280", fontSize: "13px", textDecoration: "none" }}>Cerrar sesión</a>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: "Total boletas", value: stats.total.toLocaleString(), color: "#1C1C2E" },
            { label: "Disponibles", value: stats.available.toLocaleString(), color: "#2D6A4F" },
            { label: "Reservadas", value: stats.reserved.toLocaleString(), color: "#3B5998" },
            { label: "Con abono", value: stats.partial.toLocaleString(), color: "#D97706" },
            { label: "Pagadas", value: stats.paid.toLocaleString(), color: "#7C3AED" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#FFFFFF", borderRadius: "12px", padding: "16px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#6B7280" }}>{s.label}</p>
              <p style={{ margin: "6px 0 0", fontSize: "24px", fontWeight: "800", color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recaudo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#6B7280" }}>Total recaudado (pagadas)</p>
            <p style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: "800", color: "#2D6A4F" }}>{formatPeso(stats.paid * TICKET_PRICE)}</p>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#6B7280" }}>Total abonos recibidos</p>
            <p style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: "800", color: "#D97706" }}>{formatPeso(stats.recaudado)}</p>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#6B7280" }}>Meta total rifa</p>
            <p style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: "800", color: "#9CA3AF" }}>{formatPeso(stats.total * TICKET_PRICE)}</p>
          </div>
        </div>

        {/* Buscador */}
        <input
          type="text"
          placeholder="🔍 Buscar por número (ej: 0102), nombre o teléfono..."
          value={search}
          onChange={handleSearch}
          style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "14px 18px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "16px" }}
        />

        {/* Tabla */}
        <div style={{ background: "#FFFFFF", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F2F4F7", color: "#6B7280", fontSize: "12px" }}>
                {["Número", "Estado", "Cliente", "Teléfono", "Ciudad", "Vendedor", "Abono / Resta", "Acciones"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#6B7280" }}>Cargando...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#6B7280" }}>No se encontraron boletas</td></tr>
              ) : tickets.map((ticket: any) => {
                const abonado = ticket.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || Number(ticket.amountPaid) || 0;
                const resta = TICKET_PRICE - abonado;
                const badge = getStatusBadge(ticket);
                return (
                  <tr key={ticket.id} style={{ borderTop: "1px solid #F2F4F7" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: "700", color: "#1C1C2E", fontSize: "16px" }}>
                      {String(ticket.number).padStart(4, "0")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#1C1C2E", fontSize: "13px" }}>{ticket.client?.name || "-"}</td>
                    <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: "13px" }}>{ticket.client?.phone || "-"}</td>
                    <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: "13px" }}>{ticket.client?.city || "-"}</td>
                    <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: "13px" }}>{ticket.client?.notes?.replace("Vendedor: ", "").split(" (")[0] || "-"}</td>
                    <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                      {ticket.status === "PARTIAL" ? (
                        <span style={{ color: "#D97706" }}>{formatPeso(abonado)} <span style={{ color: "#DC2626" }}>· Resta {formatPeso(resta)}</span></span>
                      ) : ticket.status === "PAID" ? (
                        <span style={{ color: "#2D6A4F" }}>{formatPeso(TICKET_PRICE)} ✓</span>
                      ) : "-"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {ticket.status !== "AVAILABLE" && (
                          <button onClick={() => copiarLink(ticket.token)} style={{ background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "5px 10px", color: "#3B5998", fontSize: "12px", cursor: "pointer" }}>
                            {copied === ticket.token ? "✓" : "🔗"}
                          </button>
                        )}
                        {ticket.status !== "PAID" && (
                          <button onClick={() => openModal(ticket)} style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "6px", padding: "5px 10px", color: "#92400E", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>
                            {ticket.status === "AVAILABLE" ? "Asignar" : "Abonar"}
                          </button>
                        )}
                        {ticket.status !== "AVAILABLE" && (
                          <button onClick={() => liberarBoleta(ticket.id)} style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", padding: "5px 10px", color: "#DC2626", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>
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
                <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF", letterSpacing: "2px" }}>BOLETA</p>
                <h2 style={{ margin: "4px 0 0", fontSize: "36px", fontWeight: "900", color: "#1C1C2E", fontFamily: "monospace", letterSpacing: "4px" }}>
                  {String(selectedTicket.number).padStart(4, "0")}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>Valor total: {formatPeso(TICKET_PRICE)}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "#F2F4F7", border: "none", borderRadius: "8px", padding: "8px 12px", color: "#6B7280", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>

            {step === "form" && (
              <>
                <input type="text" placeholder="Nombre del cliente" value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{ width: "100%", background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}
                />
                <input type="text" placeholder="Teléfono" value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  style={{ width: "100%", background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}
                />
                <input type="text" placeholder="Ciudad" value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  style={{ width: "100%", background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "16px" }}
                />
                {message && <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "10px" }}>{message}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button onClick={() => handleAsignar("RESERVED")} disabled={saving} style={{ background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "14px", color: "#4B5563", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
                    Solo separar
                  </button>
                  <button onClick={() => setStep("abono")} disabled={saving} style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "10px", padding: "14px", color: "#92400E", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
                    + Registrar abono
                  </button>
                  <button onClick={() => handleAsignar("PAID")} disabled={saving} style={{ gridColumn: "1 / -1", background: "#2D6A4F", border: "none", borderRadius: "10px", padding: "14px", color: "#FFFFFF", fontWeight: "700", cursor: "pointer", fontSize: "15px" }}>
                    ✓ Pagada completa — {formatPeso(TICKET_PRICE)}
                  </button>
                </div>
              </>
            )}

            {step === "abono" && (
              <>
                <div style={{ background: "#F2F4F7", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>CLIENTE</p>
                  <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: "700", color: "#1C1C2E" }}>{clientName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6B7280" }}>{clientPhone} {clientCity ? `· ${clientCity}` : ""}</p>
                </div>

                {/* HISTORIAL DE ABONOS */}
                {selectedTicket.payments && selectedTicket.payments.length > 0 && (
                  <div style={{ background: "#F0FDF4", borderRadius: "12px", padding: "14px", marginBottom: "16px", border: "1px solid #BBF7D0" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF", fontWeight: "700", letterSpacing: "1px" }}>HISTORIAL DE ABONOS</p>
                    {selectedTicket.payments.map((p: any, i: number) => {
                      const fecha = new Date(p.createdAt);
                      const dia = String(fecha.getDate()).padStart(2, "0");
                      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
                      const anio = fecha.getFullYear();
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: i > 0 ? "8px" : "0", borderTop: i > 0 ? "1px solid #D1FAE5" : "none" }}>
                          <span style={{ fontSize: "13px", color: "#6B7280" }}>{dia}/{mes}/{anio}</span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#2D6A4F" }}>{formatPeso(Number(p.amount))}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "2px solid #BBF7D0" }}>
                      <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: "700" }}>Total abonado</span>
                      <span style={{ fontSize: "13px", fontWeight: "900", color: "#2D6A4F" }}>
                        {formatPeso(selectedTicket.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                      </span>
                    </div>
                  </div>
                )}

                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: "100%", background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}>
                  <option value="">Medio de pago</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia bancaria</option>
                  <option value="NEQUI">Nequi</option>
                  <option value="DAVIPLATA">Daviplata</option>
                </select>
                <input type="number" placeholder="Monto a abonar ($)" value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                  style={{ width: "100%", background: "#F2F4F7", border: "2px solid #2A9D8F", borderRadius: "10px", padding: "12px 14px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "8px" }}
                />
                {abonoAmount && (
                  <p style={{ color: "#6B7280", fontSize: "13px", marginBottom: "16px" }}>
                    Resta por pagar: {formatPeso(Math.max(0, TICKET_PRICE - parseFloat(abonoAmount || "0")))}
                  </p>
                )}
                {message && <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "10px" }}>{message}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  {!selectedTicket.client && (
                    <button onClick={() => setStep("form")} style={{ background: "#F2F4F7", border: "none", borderRadius: "10px", padding: "14px 20px", color: "#6B7280", cursor: "pointer", fontWeight: "600" }}>← Volver</button>
                  )}
                  <button onClick={() => handleAsignar("PARTIAL")} disabled={saving} style={{ flex: 1, background: "#2A9D8F", border: "none", borderRadius: "10px", padding: "14px", color: "#FFFFFF", fontWeight: "900", cursor: "pointer", fontSize: "15px" }}>
                    {saving ? "Guardando..." : "Registrar abono"}
                  </button>
                  <button onClick={() => handleAsignar("PAID")} disabled={saving} style={{ background: "#2D6A4F", border: "none", borderRadius: "10px", padding: "14px 16px", color: "#FFFFFF", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
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
