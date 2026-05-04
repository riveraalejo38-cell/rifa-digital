"use client";
import { useState, useRef } from "react";

export default function VendedorPage() {
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
  const [step, setStep] = useState<"form" | "abono" | "done">("form");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastToken, setLastToken] = useState("");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<any>(null);

  const TICKET_PRICE = 70000;
  const isNumeric = (val: string) => /^\d+$/.test(val);
  const formatPeso = (v: number) => "$" + v.toLocaleString("es-CO");

  const fetchTickets = async (q = "") => {
    if (!q || q.trim() === "") { setTickets([]); return; }
    if (isNumeric(q) && q.length !== 4) { setTickets([]); return; }
    setLoading(true);
    const searchVal = isNumeric(q) ? parseInt(q).toString() : q;
    const res = await fetch(`/api/admin/tickets?search=${searchVal}`);
    const data = await res.json();
    if (data.success) setTickets(data.tickets);
    else setTickets([]);
    setLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setTickets([]);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val) return;
    if (isNumeric(val) && val.length !== 4) return;
    timerRef.current = setTimeout(() => fetchTickets(val), 150);
  };

  const openModal = (ticket: any) => {
    setSelectedTicket(ticket);
    setAbonoAmount("");
    setPaymentMethod("");
    setMessage("");
    setLastToken("");
    setCopied(false);
    if (ticket.client) {
      setClientName(ticket.client.name);
      setClientPhone(ticket.client.phone);
      setClientCity(ticket.client.city || "");
      setStep("abono");
    } else {
      setClientName("");
      setClientPhone("");
      setClientCity("");
      setStep("form");
    }
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
    setMessage("");

    const resClient = await fetch("/api/admin/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clientName, phone: clientPhone, city: clientCity }),
    });
    const dataClient = await resClient.json();
    if (!dataClient.success) {
      setMessage("Error al registrar cliente");
      setSaving(false);
      return;
    }

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
      setLastToken(selectedTicket.token);
      setStep("done");
      await fetchTickets(search);
    } else {
      setMessage(dataTicket.error || "Error al guardar");
    }
    setSaving(false);
  };

  const liberarBoleta = async (ticketId: string) => {
    if (!confirm("¿Seguro que quieres liberar esta boleta?")) return;
    const res = await fetch("/api/admin/liberar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId }),
    });
    const data = await res.json();
    if (data.success) await fetchTickets(search);
  };

  const copiarLink = (token: string) => {
    const link = `${window.location.origin}/boleta/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => { setCopied(false); setShowModal(false); }, 1500);
  };

  const getHint = () => {
    if (!search) return "";
    if (isNumeric(search) && search.length < 4) return `Faltan ${4 - search.length} dígito(s)...`;
    if (isNumeric(search) && search.length > 4) return "Máximo 4 dígitos";
    return "";
  };

  const totalAbonado = (ticket: any) => {
    if (ticket.payments?.length > 0) {
      return ticket.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    }
    return Number(ticket.amountPaid) || 0;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F2F4F7", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#1C1C2E", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "2px" }}>COLRIFAS</h1>
          <p style={{ margin: 0, fontSize: "11px", color: "#6B7280" }}>Panel Vendedor</p>
        </div>
        <a href="/api/auth/logout" style={{ color: "#6B7280", fontSize: "13px", textDecoration: "none" }}>Cerrar sesión</a>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Buscador */}
        <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <p style={{ margin: "0 0 10px", fontSize: "11px", letterSpacing: "2px", color: "#6B7280", fontWeight: "600" }}>
            BUSCA BOLETA, TELÉFONO O NOMBRE
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Número de boleta o teléfono..."
              value={search}
              onChange={handleSearch}
              style={{ flex: 1, background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 16px", color: "#1C1C2E", fontSize: "15px", outline: "none" }}
            />
            <button onClick={() => fetchTickets(search)} style={{ background: "#3B5998", border: "none", borderRadius: "10px", padding: "12px 20px", color: "#FFFFFF", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
              Buscar
            </button>
          </div>
          {getHint() && <p style={{ color: "#9CA3AF", fontSize: "12px", margin: "8px 0 0" }}>{getHint()}</p>}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "32px", color: "#6B7280" }}>Buscando...</div>
        )}

        {!loading && search && tickets.length === 0 && (!isNumeric(search) || search.length === 4) && (
          <div style={{ textAlign: "center", padding: "32px", color: "#6B7280" }}>No se encontraron boletas</div>
        )}

        {/* Resultados */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tickets.map((ticket: any) => {
            const abonado = totalAbonado(ticket);
            const resta = TICKET_PRICE - abonado;
            return (
              <div key={ticket.id} style={{ background: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

                {/* Número y estado */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "32px", fontWeight: "900", color: "#1C1C2E", letterSpacing: "4px" }}>
                      {String(ticket.number).padStart(4, "0")}
                    </p>
                    <span style={{
                      display: "inline-block", marginTop: "4px",
                      background: ticket.status === "PAID" ? "#D1FAE5" : ticket.status === "PARTIAL" ? "#FEF3C7" : ticket.status === "RESERVED" ? "#DBEAFE" : "#F3F4F6",
                      color: ticket.status === "PAID" ? "#2D6A4F" : ticket.status === "PARTIAL" ? "#D97706" : ticket.status === "RESERVED" ? "#3B5998" : "#6B7280",
                      borderRadius: "999px", padding: "3px 12px", fontSize: "11px", fontWeight: "700",
                    }}>
                      {ticket.status === "PAID" ? "✓ Pagada" : ticket.status === "PARTIAL" ? "⏳ Con abono" : ticket.status === "RESERVED" ? "● Reservada" : "○ Disponible"}
                    </span>
                  </div>

                  {/* Botones según estado */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {ticket.status === "AVAILABLE" ? (
                      <button onClick={() => openModal(ticket)} style={{ background: "#3B5998", border: "none", borderRadius: "10px", padding: "10px 20px", color: "#FFFFFF", fontSize: "13px", cursor: "pointer", fontWeight: "700" }}>
                        Asignar
                      </button>
                    ) : (
                      <>
                        <button onClick={() => copiarLink(ticket.token)} style={{ background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "10px 14px", color: "#3B5998", fontSize: "13px", cursor: "pointer", fontWeight: "700" }}>
                          🔗 Link
                        </button>
                        {ticket.status !== "PAID" && (
                          <button onClick={() => openModal(ticket)} style={{ background: "#2A9D8F", border: "none", borderRadius: "10px", padding: "10px 14px", color: "#FFFFFF", fontSize: "13px", cursor: "pointer", fontWeight: "700" }}>
                            + Abonar
                          </button>
                        )}
                        <button onClick={() => liberarBoleta(ticket.id)} style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "10px 14px", color: "#DC2626", fontSize: "13px", cursor: "pointer", fontWeight: "700" }}>
                          Liberar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Datos del cliente */}
                {ticket.client && (
                  <div style={{ background: "#F2F4F7", borderRadius: "10px", padding: "14px", marginBottom: abonado > 0 ? "10px" : "0" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Cliente</p>
                        <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: "700", color: "#1C1C2E" }}>{ticket.client.name}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Teléfono</p>
                        <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: "700", color: "#1C1C2E" }}>{ticket.client.phone}</p>
                      </div>
                      {ticket.client.city && (
                        <div>
                          <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Ciudad</p>
                          <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: "700", color: "#1C1C2E" }}>{ticket.client.city}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Abono y resta */}
                {abonado > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", background: "#F2F4F7", borderRadius: "10px", padding: "12px 14px" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Abonado</p>
                      <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "800", color: "#2D6A4F" }}>{formatPeso(abonado)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>Resta</p>
                      <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "800", color: resta === 0 ? "#2D6A4F" : "#D97706" }}>{formatPeso(resta)}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedTicket && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

            {/* Header modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF", letterSpacing: "2px" }}>BOLETA</p>
                <h2 style={{ margin: "4px 0 0", fontSize: "40px", fontWeight: "900", color: "#1C1C2E", fontFamily: "monospace", letterSpacing: "6px" }}>
                  {String(selectedTicket.number).padStart(4, "0")}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B7280" }}>Valor total: {formatPeso(TICKET_PRICE)}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "#F2F4F7", border: "none", borderRadius: "8px", padding: "8px 12px", color: "#6B7280", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>

            {/* Formulario nuevo cliente */}
            {step === "form" && (
              <>
                <input type="text" placeholder="Nombre completo" value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{ width: "100%", background: "#F2F4F7", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", color: "#1C1C2E", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}
                />
                <input type="text" placeholder="Teléfono celular" value={clientPhone}
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

            {/* Registrar abono */}
            {step === "abono" && (
              <>
                <div style={{ background: "#F2F4F7", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>CLIENTE</p>
                  <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: "700", color: "#1C1C2E" }}>{clientName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6B7280" }}>{clientPhone} {clientCity ? `· ${clientCity}` : ""}</p>
                  {totalAbonado(selectedTicket) > 0 && (
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#D97706" }}>
                      Ya abonado: {formatPeso(totalAbonado(selectedTicket))} · Resta: {formatPeso(TICKET_PRICE - totalAbonado(selectedTicket))}
                    </p>
                  )}
                </div>
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

            {/* Listo */}
            {step === "done" && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "48px", margin: "0 0 8px" }}>🎟️</p>
                <h3 style={{ color: "#2D6A4F", fontSize: "20px", margin: "0 0 8px" }}>¡Boleta registrada!</h3>
                <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "24px" }}>Comparte el link con el cliente</p>
                <button onClick={() => copiarLink(lastToken)} style={{
                  width: "100%", background: copied ? "#2D6A4F" : "#3B5998",
                  border: "none", borderRadius: "12px", padding: "16px",
                  color: "#FFFFFF", fontWeight: "900", fontSize: "16px", cursor: "pointer", marginBottom: "12px"
                }}>
                  {copied ? "✓ Link copiado — cerrando..." : "🔗 Copiar link de la boleta"}
                </button>
                <button onClick={() => setShowModal(false)} style={{ width: "100%", background: "transparent", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "14px", color: "#6B7280", cursor: "pointer", fontSize: "14px" }}>
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}