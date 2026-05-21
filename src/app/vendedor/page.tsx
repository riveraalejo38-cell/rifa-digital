"use client";
import { useState, useRef } from "react";

export default function VendedorPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [abonoAmount, setAbonoAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const TICKET_PRICE = 70000;

  const formatPeso = (value: number) =>
    "$" + value.toLocaleString("es-CO");

  const buscar = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setTicket(null);
    setNotFound(false);
    setMessage("");
    setClientName("");
    setClientPhone("");
    setClientCity("");
    setAbonoAmount("");
    setPaymentMethod("");

    const isNum = /^\d+$/.test(search.trim());
    const query = isNum ? parseInt(search.trim()).toString() : search.trim();
    const res = await fetch(`/api/admin/tickets?search=${query}`);
    const data = await res.json();

    if (data.success && data.tickets.length > 0) {
      const t = data.tickets[0];
      setTicket(t);
      setClientName(t.client?.name || "");
      setClientPhone(t.client?.phone || "");
      setClientCity(t.client?.city || "");
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") buscar();
  };

  const handleAsignar = async (tipo: "RESERVED" | "PARTIAL" | "PAID") => {
    if (!clientName || !clientPhone) {
      setMessage("Nombre y teléfono son obligatorios");
      return;
    }
    if (tipo === "PARTIAL" && !abonoAmount) {
      setMessage("Ingresa el monto a abonar");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const resClient = await fetch("/api/admin/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, phone: clientPhone, city: clientCity }),
      });
      const dataClient = await resClient.json();
      if (!dataClient.success) { setMessage("Error al registrar cliente"); setSaving(false); return; }

      const abono = tipo === "PAID" ? TICKET_PRICE : tipo === "PARTIAL" ? parseFloat(abonoAmount) || 0 : 0;

      const resTicket = await fetch("/api/admin/asignar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          clientId: dataClient.client.id,
          amountPaid: abono,
        }),
      });
      const dataTicket = await resTicket.json();
      if (dataTicket.success) {
        await buscar();
      } else {
        setMessage(dataTicket.error || "Error al asignar");
      }
    } catch {
      setMessage("Error de conexión");
    }
    setSaving(false);
  };

  const handleAbonar = async () => {
    if (!abonoAmount) { setMessage("Ingresa el monto a abonar"); return; }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/asignar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          clientId: ticket.client.id,
          amountPaid: parseFloat(abonoAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAbonoAmount("");
        setPaymentMethod("");
        await buscar();
      } else {
        setMessage(data.error || "Error al registrar abono");
      }
    } catch {
      setMessage("Error de conexión");
    }
    setSaving(false);
  };

  const liberarBoleta = async () => {
    if (!confirm("¿Seguro que quieres liberar esta boleta?")) return;
    const res = await fetch("/api/admin/liberar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: ticket.id }),
    });
    const data = await res.json();
    if (data.success) { setTicket(null); setSearch(""); }
  };

  const copiarLink = () => {
    const link = `${window.location.origin}/boleta/${ticket.token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalAbonado = ticket?.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  const resta = TICKET_PRICE - totalAbonado;

  const isAvailable = ticket?.status === "AVAILABLE";
  const isTaken = ticket && !isAvailable;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F9FC", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        select:focus { outline: none; }
        button:active { transform: scale(0.98); }
        .search-input::placeholder { color: #B0BAC9; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse { animation: pulse 1.5s ease infinite; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1A1F2E", borderBottom: "1px solid #2D3348", padding: "0 32px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo-rg.jpeg" alt="RG Proyectos" style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" }} />
          <div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#D4A843", letterSpacing: "0.5px" }}>RG Proyectos</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#64748B", fontWeight: "500" }}>Panel Vendedor</p>
          </div>
        </div>
        <a href="/api/auth/logout" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", fontWeight: "500", padding: "6px 14px", borderRadius: "8px", border: "1px solid #2D3348" }}>Cerrar sesión</a>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>

        {/* Search */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: "600", color: "#94A3B8", letterSpacing: "1.5px", textTransform: "uppercase" }}>Buscar boleta</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <input ref={inputRef} type="text" className="search-input" placeholder="Número (ej: 0234) o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleKey}
              style={{ flex: 1, background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: "14px", padding: "14px 18px", fontSize: "15px", color: "#0F172A", fontFamily: "inherit", fontWeight: "500" }} />
            <button onClick={buscar} disabled={loading}
              style={{ background: loading ? "#E2E8F0" : "linear-gradient(135deg, #0EA5E9, #0284C7)", border: "none", borderRadius: "14px", padding: "14px 24px", color: loading ? "#94A3B8" : "#FFFFFF", fontSize: "14px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", minWidth: "100px" }}>
              {loading ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="fade-up" style={{ background: "#FFFFFF", borderRadius: "20px", padding: "40px", textAlign: "center", border: "1.5px solid #E2E8F0" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
            <p style={{ margin: 0, fontWeight: "700", color: "#0F172A", fontSize: "16px" }}>No se encontró ninguna boleta</p>
            <p style={{ margin: "6px 0 0", color: "#94A3B8", fontSize: "14px" }}>Verifica el número o teléfono e intenta de nuevo</p>
          </div>
        )}

        {/* DISPONIBLE */}
        {isAvailable && (
          <div className="fade-up">
            <div style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)", borderRadius: "20px", padding: "28px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: "600", letterSpacing: "1.5px" }}>BOLETA</p>
              <p style={{ margin: "0 0 12px", fontSize: "52px", fontWeight: "800", color: "#FFFFFF", fontFamily: "'DM Mono', monospace", letterSpacing: "6px", lineHeight: 1 }}>{String(ticket.number).padStart(4, "0")}</p>
              <span style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF", borderRadius: "999px", padding: "5px 14px", fontSize: "12px", fontWeight: "700" }}>✦ Disponible</span>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "24px", border: "1.5px solid #E2E8F0" }}>
              <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: "700", color: "#0F172A", letterSpacing: "0.5px" }}>DATOS DEL CLIENTE</p>
              <input type="text" placeholder="Nombre completo" value={clientName} onChange={(e) => setClientName(e.target.value)}
                style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#0F172A", fontFamily: "inherit", fontWeight: "500", marginBottom: "10px" }} />
              <input type="text" placeholder="Teléfono celular" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
                style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#0F172A", fontFamily: "inherit", fontWeight: "500", marginBottom: "10px" }} />
              <input type="text" placeholder="Ciudad" value={clientCity} onChange={(e) => setClientCity(e.target.value)}
                style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#0F172A", fontFamily: "inherit", fontWeight: "500", marginBottom: "16px" }} />
              {message && <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "12px", fontWeight: "500" }}>⚠ {message}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button onClick={() => handleAsignar("RESERVED")} disabled={saving}
                  style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "13px", color: "#64748B", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
                  Separar sin abono
                </button>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="number" placeholder="Monto abono ($)" value={abonoAmount} onChange={(e) => setAbonoAmount(e.target.value)}
                    style={{ flex: 1, background: "#F7F9FC", border: "1.5px solid #0EA5E9", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#0F172A", fontFamily: "inherit", fontWeight: "500" }} />
                  <button onClick={() => handleAsignar("PARTIAL")} disabled={saving}
                    style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "12px", padding: "12px 16px", color: "#0284C7", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    + Abonar
                  </button>
                </div>
                <button onClick={() => handleAsignar("PAID")} disabled={saving}
                  style={{ width: "100%", background: "linear-gradient(135deg, #0EA5E9, #0284C7)", border: "none", borderRadius: "12px", padding: "14px", color: "#FFFFFF", fontSize: "15px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                  {saving ? "Guardando..." : `✓ Pagada completa — ${formatPeso(TICKET_PRICE)}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OCUPADA */}
        {isTaken && (
          <div className="fade-up">
            <div style={{ background: ticket.status === "PAID" ? "linear-gradient(135deg, #059669, #047857)" : "linear-gradient(135deg, #F59E0B, #D97706)", borderRadius: "20px", padding: "28px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: "600", letterSpacing: "1.5px" }}>BOLETA</p>
                  <p style={{ margin: "0 0 12px", fontSize: "52px", fontWeight: "800", color: "#FFFFFF", fontFamily: "'DM Mono', monospace", letterSpacing: "6px", lineHeight: 1 }}>{String(ticket.number).padStart(4, "0")}</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={copiarLink} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "10px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>
                    {copied ? "✓ Copiado" : "🔗 Link"}
                  </button>
                  <button onClick={liberarBoleta} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>
                    Liberar
                  </button>
                </div>
              </div>
              <span style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF", borderRadius: "999px", padding: "5px 14px", fontSize: "12px", fontWeight: "700" }}>
                {ticket.status === "PAID" ? "✅ Pagada completa" : ticket.status === "PARTIAL" ? "⏳ Con abono" : "● Reservada"}
              </span>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "24px", border: "1.5px solid #E2E8F0", marginBottom: "12px" }}>
              <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: "700", color: "#0F172A", letterSpacing: "0.5px" }}>DATOS DEL CLIENTE</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ background: "#F7F9FC", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600" }}>NOMBRE</p>
                  <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>{ticket.client?.name || "-"}</p>
                </div>
                <div style={{ background: "#F7F9FC", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600" }}>TELÉFONO</p>
                  <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>{ticket.client?.phone || "-"}</p>
                </div>
                <div style={{ background: "#F7F9FC", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600" }}>CIUDAD</p>
                  <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>{ticket.client?.city || "-"}</p>
                </div>
                <div style={{ background: "#F7F9FC", borderRadius: "12px", padding: "14px" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", fontWeight: "600" }}>SALDO PENDIENTE</p>
                  <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: "700", color: resta > 0 ? "#EF4444" : "#059669" }}>
                    {resta > 0 ? formatPeso(resta) : "Pagado ✓"}
                  </p>
                </div>
              </div>

              {ticket.payments && ticket.payments.length > 0 && (
                <div style={{ borderTop: "1.5px solid #F1F5F9", paddingTop: "16px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "700", color: "#0F172A", letterSpacing: "0.5px" }}>HISTORIAL DE PAGOS</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {ticket.payments.map((p: any, i: number) => {
                      const fecha = new Date(p.createdAt);
                      const dia = String(fecha.getDate()).padStart(2, "0");
                      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
                      const anio = fecha.getFullYear();
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F0FDF4", borderRadius: "10px", padding: "10px 14px", border: "1px solid #BBF7D0" }}>
                          <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "500" }}>{dia}/{mes}/{anio}</span>
                          <span style={{ fontSize: "14px", fontWeight: "700", color: "#059669" }}>{formatPeso(Number(p.amount))}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: "1.5px dashed #E2E8F0", marginTop: "4px" }}>
                      <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "600" }}>Total abonado</span>
                      <span style={{ fontSize: "15px", fontWeight: "800", color: "#059669" }}>{formatPeso(totalAbonado)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {ticket.status !== "PAID" && (
              <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "24px", border: "1.5px solid #E2E8F0" }}>
                <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: "700", color: "#0F172A", letterSpacing: "0.5px" }}>REGISTRAR NUEVO ABONO</p>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #E2E8F0", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#0F172A", fontFamily: "inherit", fontWeight: "500", marginBottom: "10px" }}>
                  <option value="">Método de pago</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia bancaria</option>
                  <option value="NEQUI">Nequi</option>
                  <option value="DAVIPLATA">Daviplata</option>
                </select>
                <input type="number" placeholder="Monto a abonar ($)" value={abonoAmount} onChange={(e) => setAbonoAmount(e.target.value)}
                  style={{ width: "100%", background: "#F7F9FC", border: "1.5px solid #0EA5E9", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#0F172A", fontFamily: "inherit", fontWeight: "500", marginBottom: abonoAmount ? "6px" : "14px" }} />
                {abonoAmount && (
                  <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "14px", fontWeight: "500" }}>
                    Quedaría pendiente: {formatPeso(Math.max(0, TICKET_PRICE - totalAbonado - parseFloat(abonoAmount || "0")))}
                  </p>
                )}
                {message && <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "12px", fontWeight: "500" }}>⚠ {message}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleAbonar} disabled={saving}
                    style={{ flex: 1, background: "linear-gradient(135deg, #0EA5E9, #0284C7)", border: "none", borderRadius: "12px", padding: "13px", color: "#FFFFFF", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                    {saving ? "Guardando..." : "Registrar abono"}
                  </button>
                  <button onClick={() => handleAsignar("PAID")} disabled={saving}
                    style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: "12px", padding: "13px 16px", color: "#059669", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                    ✓ Completa
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
