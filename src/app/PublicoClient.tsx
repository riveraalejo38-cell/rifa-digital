"use client";

import { useState } from "react";

const RAFFLE_NAME = "ColRifas";
const TICKET_PRICE = 80000;
const TOTAL_TICKETS = 10000;
const DRAW_DATE = new Date("2026-12-12T20:00:00-05:00");
const WHATSAPP_NEGOCIO = "573148008489";

const peso = (value: number) => "$" + value.toLocaleString("es-CO");
type CheckResult = { number: number; available: boolean; ticketPrice: number } | null;
type Reserva = { number: number; status: string; ticketPrice: number; token: string } | null;

export default function PublicoClient() {
  const [numeroInput, setNumeroInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [checkResult, setCheckResult] = useState<CheckResult>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [reservando, setReservando] = useState(false);
  const [reservaError, setReservaError] = useState("");
  const [reserva, setReserva] = useState<Reserva>(null);
  const [copiado, setCopiado] = useState(false);

  const fecha = DRAW_DATE.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });
  const fechaCorta = DRAW_DATE.toLocaleDateString("es-CO", { day: "2-digit", month: "short", timeZone: "America/Bogota" }).replace(".", "").toUpperCase();
  const hora = DRAW_DATE.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" });
  const enlace = (token: string) => typeof window === "undefined" ? "" : `${window.location.origin}/boleta/${token}`;
  const irAReserva = () => document.getElementById("elige-tu-numero")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const verificarNumero = async () => {
    const term = numeroInput.trim();
    if (!term) return;
    setChecking(true); setCheckError(""); setCheckResult(null); setReserva(null); setReservaError("");
    try {
      const response = await fetch(`/api/public/ticket-status?number=${encodeURIComponent(term)}`, { cache: "no-store" });
      const data = await response.json();
      if (data.success) setCheckResult({ number: data.number, available: data.available, ticketPrice: data.ticketPrice });
      else setCheckError(data.error || "No se pudo verificar el número");
    } catch { setCheckError("Error de conexión. Intenta de nuevo."); }
    finally { setChecking(false); }
  };

  const otroNumero = () => {
    setCheckResult(null); setCheckError(""); setNumeroInput(""); setReserva(null); setReservaError(""); setCopiado(false);
    setTimeout(irAReserva, 0);
  };

  const reservar = async () => {
    if (!checkResult) return;
    if (!nombre.trim()) return setReservaError("Ingresa tu nombre completo");
    if (!telefono.trim()) return setReservaError("Ingresa tu número de teléfono");
    setReservando(true); setReservaError("");
    try {
      const response = await fetch("/api/public/reservar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: checkResult.number, name: nombre.trim(), phone: telefono.trim(), city: ciudad.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setReserva(data.ticket);
        setTimeout(() => document.getElementById("boleta-lista")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      } else setReservaError(data.error || "No se pudo completar la reserva");
    } catch { setReservaError("Error de conexión. Intenta de nuevo."); }
    finally { setReservando(false); }
  };

  const whatsapp = () => {
    if (!reserva) return;
    const numero = String(reserva.number).padStart(4, "0");
    const mensaje = `¡Hola! Quiero confirmar la compra de mi boleta *${numero}* de ${RAFFLE_NAME}. Ya les envío el comprobante de pago.\n\nMi boleta: ${enlace(reserva.token)}`;
    window.open(`https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const copiar = async () => {
    if (!reserva) return;
    try { await navigator.clipboard.writeText(enlace(reserva.token)); setCopiado(true); setTimeout(() => setCopiado(false), 2200); }
    catch { window.prompt("Copia este enlace de tu boleta:", enlace(reserva.token)); }
  };

  return <main className="rifa-page">
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@500;700&display=swap');
      *{box-sizing:border-box} html{scroll-behavior:smooth} .rifa-page{min-height:100vh;background:#0a1711;color:#f8f6ee;font-family:'DM Sans',sans-serif;overflow:hidden}.shell{width:min(1120px,calc(100% - 40px));margin:auto}.nav{position:absolute;z-index:2;inset:0 0 auto;padding:20px 0}.navin{display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{display:flex;align-items:center;gap:11px;color:#fff;text-decoration:none}.brand img{width:42px;height:42px;border-radius:12px;object-fit:cover;border:1px solid #eecb71}.brand span{font-size:12px;line-height:1.1;letter-spacing:.8px;font-weight:800}.links{display:flex;align-items:center;gap:22px}.links a{color:#fff;text-decoration:none;font-size:13px;font-weight:700}.links .wa{border:1px solid #eecb71;border-radius:99px;padding:10px 15px}.hero{position:relative;min-height:700px;display:flex;align-items:end;padding:145px 0 64px;background:linear-gradient(90deg,rgba(6,19,13,.92) 0%,rgba(6,19,13,.74) 42%,rgba(6,19,13,.18)),linear-gradient(0deg,#0a1711,transparent 38%),url('/premios/hero-cascada.png') center/cover no-repeat}.herogrid{display:grid;grid-template-columns:1.1fr .65fr;align-items:end;gap:64px}.eyebrow,.kicker{margin:0 0 14px;color:#f0c96c;font-size:12px;font-weight:800;letter-spacing:2px}.hero h1{margin:0;font:400 clamp(43px,6vw,74px)/.99 'DM Serif Display',Georgia,serif;letter-spacing:-.8px;max-width:700px}.lead{max-width:540px;margin:22px 0 30px;color:#fff;font-size:17px;line-height:1.55}.lead b{color:#f0c96c}.buttons{display:flex;flex-wrap:wrap;gap:12px}button{font:inherit}.primary,.secondary{min-height:52px;border-radius:13px;padding:0 20px;border:0;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:.2px}.primary{color:#142016;background:linear-gradient(135deg,#f3d276,#d7a63d);box-shadow:0 12px 30px rgba(0,0,0,.27)}.secondary{color:#fff;border:1px solid rgba(255,255,255,.35);background:rgba(15,29,21,.38)}.date{padding:24px;background:rgba(10,27,19,.74);border:1px solid rgba(241,204,104,.35);border-radius:20px;backdrop-filter:blur(9px)}.date small{color:#d8b359;font-size:11px;letter-spacing:1.6px;font-weight:800}.date strong{display:block;margin:10px 0 4px;font:800 34px/1 'DM Mono',monospace}.date p{margin:0;color:#d6e0d8;font-size:13px;line-height:1.5}.section{padding:84px 0}.prizes{background:#0d2117}.kicker{text-align:center;color:#d7a63d}.section h2{margin:0;text-align:center;font:400 clamp(32px,4vw,48px)/1.05 'DM Serif Display',Georgia,serif}.intro{max-width:650px;margin:13px auto 38px;text-align:center;color:#aac0b2;line-height:1.6}.prizegrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}.prize{min-height:330px;position:relative;isolation:isolate;display:flex;align-items:end;overflow:hidden;padding:22px;border:1px solid rgba(242,210,126,.25);border-radius:22px;background:#182c20 center/cover no-repeat}.prize:before{content:'';position:absolute;z-index:-1;inset:0;background:linear-gradient(0deg,rgba(2,12,7,.9),rgba(2,12,7,.03) 70%)}.frontier{background-image:url('/premios/frontier.jpg')}.mt15{background-image:url('/premios/mt15.jpg')}.nmax{background-image:url('/premios/nmax.jpg')}.tag{display:block;margin-bottom:6px;color:#ecd076;font-size:11px;font-weight:800;letter-spacing:1.1px}.prize h3{margin:0;font:400 27px/1.1 'DM Serif Display',serif}.prize p{margin:7px 0 0;color:#e9f0ea;font-size:13px}.cash{display:flex;align-items:center;justify-content:center;gap:20px;margin-top:16px;min-height:90px;padding:16px;background:linear-gradient(100deg,rgba(205,158,46,.25),rgba(10,31,20,.88)),url('/premios/hero-cascada.png') center/cover;border:1px solid #ddbb60;border-radius:18px}.cash strong{font:400 clamp(28px,4vw,48px)/1 'DM Serif Display',serif;color:#f3d276}.cash span{font-size:12px;font-weight:800;letter-spacing:1.6px}.trust{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px;color:#d8e4da}.trust div{display:flex;align-items:center;justify-content:center;gap:9px;font-size:13px;font-weight:700;text-align:center}.trust b{font-size:22px;color:#f0c96c}.numberarea{background:radial-gradient(circle at 100% 0%,rgba(194,142,41,.18),transparent 35%),#0a1711}.purchase,.ready{max-width:690px;margin:auto;padding:28px;border:1px solid rgba(235,198,103,.28);border-radius:24px;background:#10261a;box-shadow:0 22px 70px rgba(0,0,0,.26)}.ptitle{margin:0 0 6px;font-size:19px;font-weight:800}.pcopy,.help{margin:0 0 20px;color:#a8bcae;font-size:14px;line-height:1.5}.numberrow{display:flex;gap:10px}input{width:100%;min-height:50px;padding:0 15px;border:1px solid #365344;border-radius:12px;background:#0b1d14;color:#fff;font:500 15px 'DM Sans',sans-serif}input:focus{outline:2px solid rgba(240,201,108,.65);border-color:transparent}.numberinput{font:700 21px 'DM Mono',monospace;letter-spacing:3px}.full{width:100%}.alert{margin:14px 0;padding:12px 14px;border-radius:11px;font-size:13px;line-height:1.45}.error{color:#ffb9b9;background:rgba(177,47,47,.18);border:1px solid rgba(244,112,112,.38)}.unavailable{color:#ffe0a3;background:rgba(214,139,30,.13);border:1px solid rgba(241,179,74,.36)}.found{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:20px;padding:17px;border:1px solid #dfb451;border-radius:15px;background:rgba(225,180,78,.08)}.found small{color:#adc0b2;font-size:10px;font-weight:800;letter-spacing:1.3px}.found strong{display:block;margin-top:4px;font:700 30px 'DM Mono',monospace;letter-spacing:3px}.available{flex-shrink:0;padding:7px 10px;border-radius:99px;color:#f4d579;background:rgba(240,201,108,.13);font-size:11px;font-weight:800}.label{display:block;margin:4px 0 10px;font-size:12px;font-weight:800;letter-spacing:1px}.stack{display:grid;gap:10px}.textbutton{width:100%;margin-top:12px;border:0;background:transparent;color:#e5c66d;font-size:13px;font-weight:700;cursor:pointer}.how,.payment{background:#f2ecdc;color:#183022}.how .kicker,.payment .kicker{color:#9a6b15}.how h2{color:#14271c}.how .intro{color:#5c6c60}.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.step{min-height:185px;padding:22px 18px;border:1px solid #e6d9b6;border-radius:18px;background:#fffdf7}.stepnum{color:#b17a19;font:700 27px 'DM Mono',monospace}.step h3{margin:20px 0 7px;color:#1a3022;font-size:16px}.step p{margin:0;color:#667166;font-size:13px;line-height:1.5}.payment{padding-top:0}.paymentbox{display:grid;grid-template-columns:1.05fr .95fr;overflow:hidden;border-radius:23px;background:#183525;color:#fff}.paymentcopy{padding:40px}.paymentcopy .kicker,.paymentcopy h2{text-align:left}.paymentcopy h2{color:#fff}.paymentcopy p{color:#c7d7ca;line-height:1.6}.paymentpoints{display:grid;align-content:center;gap:11px;padding:28px;background:#e4c260;color:#183022}.paymentpoint{padding:14px;border-radius:13px;background:rgba(255,255,255,.27);font-size:13px;font-weight:700}.ready{text-align:center}.ready h2{color:#fff}.ready .eyebrow{margin-bottom:8px}.price{margin:0 0 18px;color:#b7cabc;font-size:14px}.price b{color:#f3d276;font:700 22px 'DM Mono',monospace}.ticketimage{display:block;width:100%;margin:22px auto;border-radius:15px;box-shadow:0 18px 50px rgba(0,0,0,.35)}.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.actions .full{grid-column:1/-1}.outline{border:1px solid rgba(240,201,108,.7);color:#f3d276;background:transparent}footer{padding:30px 0 42px;background:#09130d;color:#789082;text-align:center;font-size:12px;line-height:1.6}footer a{color:#e4c260;text-decoration:none;font-weight:700}@media(max-width:760px){.shell{width:min(100% - 32px,560px)}.nav{padding:14px 0}.links a:not(.wa){display:none}.links .wa{padding:8px 11px}.hero{min-height:660px;padding:122px 0 38px;background-position:62% center}.herogrid,.paymentbox{grid-template-columns:1fr;gap:28px}.date{max-width:260px}.section{padding:58px 0}.prizegrid{grid-template-columns:1fr}.prize{min-height:225px}.cash{flex-direction:column;gap:4px;text-align:center}.trust{grid-template-columns:1fr 1fr}.numberrow{flex-direction:column}.steps{grid-template-columns:1fr 1fr}.purchase,.ready{padding:20px}.paymentcopy{padding:30px 25px}.paymentpoints{padding:20px}.actions{grid-template-columns:1fr}.actions .full{grid-column:auto}}
    `}</style>

    <header className="nav"><div className="shell navin"><a className="brand" href="#inicio"><img src="/logo-santiago-gomez.jpg" alt="Proyectos Santiago Gómez"/><span>PROYECTOS<br/>SANTIAGO GÓMEZ</span></a><nav className="links"><a href="#premios">Premios</a><a href="#como-funciona">Cómo participar</a><a href="#pagos">Pagos</a><a className="wa" href={`https://wa.me/${WHATSAPP_NEGOCIO}`} target="_blank" rel="noreferrer">WhatsApp ↗</a></nav></div></header>
    <section className="hero" id="inicio"><div className="shell herogrid"><div><p className="eyebrow">GRAN RIFA · PROYECTOS SANTIAGO GÓMEZ</p><h1>Tu próxima aventura puede ser real.</h1><p className="lead">Una camioneta, dos motos y <b>$10 millones en efectivo.</b><br/>Elige tu número, separa tu boleta y haz parte de esta gran oportunidad.</p><div className="buttons"><button className="primary" onClick={irAReserva}>🎟️ QUIERO MI BOLETA</button><a className="secondary" href="#premios" style={{display:"inline-flex",alignItems:"center",textDecoration:"none"}}>CONOCE LOS PREMIOS</a></div></div><aside className="date"><small>PRÓXIMO SORTEO</small><strong>{fechaCorta}</strong><p>{fecha}<br/>{hora}</p></aside></div></section>
    <section className="section prizes" id="premios"><div className="shell"><p className="kicker">NUESTROS PREMIOS</p><h2>Una oportunidad para soñar en grande.</h2><p className="intro">Cada boleta te acerca a grandes premios y a un sueño hecho realidad.</p><div className="prizegrid"><article className="prize mt15"><div><span className="tag">🏆 PREMIO MAYOR</span><h3>Yamaha MT-15</h3><p>Diseño, agilidad y emoción.</p></div></article><article className="prize frontier"><div><span className="tag">🎁 OBSEQUIO</span><h3>Nissan Frontier</h3><p>Potencia para recorrer nuevos caminos.</p></div></article><article className="prize nmax"><div><span className="tag">🎁 PREMIO ADICIONAL</span><h3>Yamaha NMAX</h3><p>Tu ciudad, a tu manera.</p></div></article></div><div className="cash"><span>💵 PREMIO EN EFECTIVO</span><strong>$10 MILLONES</strong><span>EN EFECTIVO</span></div><div className="trust"><div><b>♧</b> Miles de personas participan</div><div><b>♢</b> Transacción segura</div><div><b>♡</b> Apoyas grandes proyectos</div><div><b>✦</b> Más oportunidades</div></div></div></section>
    <section className="section numberarea" id="elige-tu-numero"><div className="shell"><p className="kicker">EMPIEZA AQUÍ</p><h2>Elige el número que quieres.</h2><p className="intro">Consulta si está disponible y resérvalo en pocos pasos.</p>
      {!reserva && <div className="purchase"><p className="ptitle">Busca tu número de la suerte</p><p className="pcopy">Puedes elegir un número entre 0000 y {TOTAL_TICKETS - 1}.</p>
        {!checkResult && <><div className="numberrow"><input className="numberinput" type="text" inputMode="numeric" placeholder="Ej: 0512" value={numeroInput} onChange={(event)=>setNumeroInput(event.target.value.replace(/\D/g,"").slice(0,4))} onKeyDown={(event)=>event.key === "Enter" && verificarNumero()} autoComplete="off"/><button className="primary" onClick={verificarNumero} disabled={checking || !numeroInput}>{checking ? "VERIFICANDO..." : "VERIFICAR NÚMERO"}</button></div>{checkError && <p className="alert error">⚠ {checkError}</p>}</>}
        {checkResult && !checkResult.available && <><p className="alert unavailable">Esta boleta ya no está disponible. Prueba con otro número.</p><button className="secondary full" onClick={otroNumero}>ELEGIR OTRO NÚMERO</button></>}
        {checkResult && checkResult.available && <div><div className="found"><div><small>BOLETA DISPONIBLE</small><strong>{String(checkResult.number).padStart(4,"0")}</strong></div><span className="available">✦ DISPONIBLE</span></div><label className="label">TUS DATOS</label><div className="stack"><input type="text" placeholder="Nombre completo" value={nombre} onChange={(event)=>setNombre(event.target.value)} autoComplete="name"/><input type="tel" placeholder="Teléfono para confirmar por WhatsApp" value={telefono} onChange={(event)=>setTelefono(event.target.value)} autoComplete="tel"/><input type="text" placeholder="Ciudad (opcional)" value={ciudad} onChange={(event)=>setCiudad(event.target.value)} autoComplete="address-level2"/></div><p className="help">Tu boleta queda reservada. Después realiza el abono y envíanos el comprobante por WhatsApp para confirmarla.</p>{reservaError && <p className="alert error">⚠ {reservaError}</p>}<button className="primary full" onClick={reservar} disabled={reservando}>{reservando ? "RESERVANDO..." : "RESERVAR MI BOLETA"}</button><button className="textbutton" onClick={otroNumero}>← Elegir otro número</button></div>}
      </div>}
      {reserva && <div className="ready" id="boleta-lista"><p className="eyebrow">✓ ¡TU BOLETA ESTÁ LISTA!</p><h2>Boleta #{String(reserva.number).padStart(4,"0")}</h2><p className="price">Valor a pagar: <b>{peso(reserva.ticketPrice)}</b></p><a href={`/boleta/${reserva.token}`} target="_blank" rel="noreferrer"><img className="ticketimage" src={`/api/boleta/${reserva.token}/imagen`} alt={`Boleta ${String(reserva.number).padStart(4,"0")}`}/></a><p className="help">Guarda tu boleta y envíanos el comprobante por WhatsApp para confirmar tu abono.</p><div className="actions"><a className="secondary" href={`/boleta/${reserva.token}`} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none"}}>VER BOLETA</a><button className="secondary outline" onClick={copiar}>{copiado ? "✓ ENLACE COPIADO" : "COPIAR ENLACE"}</button><button className="primary full" onClick={whatsapp}>📲 ENVIAR COMPROBANTE POR WHATSAPP</button></div><button className="textbutton" onClick={otroNumero}>Reservar otra boleta</button></div>}
    </div></section>
    <section className="section how" id="como-funciona"><div className="shell"><p className="kicker">MUY FÁCIL</p><h2>¿Cómo funciona?</h2><p className="intro">Todo el proceso está pensado para que participes con tranquilidad.</p><div className="steps"><article className="step"><div className="stepnum">01</div><h3>Elige tu número</h3><p>Busca tu número favorito y confirma que esté disponible.</p></article><article className="step"><div className="stepnum">02</div><h3>Reserva tu boleta</h3><p>Registra tus datos y recibe tu boleta de inmediato.</p></article><article className="step"><div className="stepnum">03</div><h3>Realiza tu abono</h3><p>Solicita los medios de pago y realiza tu abono.</p></article><article className="step"><div className="stepnum">04</div><h3>Envía comprobante</h3><p>Compártelo por WhatsApp para confirmar tu participación.</p></article></div></div></section>
    <section className="section payment" id="pagos"><div className="shell paymentbox"><div className="paymentcopy"><p className="kicker">DESPUÉS DE RESERVAR</p><h2>Tu sueño hecho realidad.</h2><p>Cuando tengas tu boleta, realiza tu abono y envía el comprobante. Nuestro equipo confirmará tu pago para que participes oficialmente.</p><button className="primary" onClick={()=>window.open(`https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent("Hola, quiero conocer los medios de pago de la rifa.")}`,"_blank")}>💬 SOLICITAR MEDIOS DE PAGO</button></div><div className="paymentpoints"><div className="paymentpoint">✓ Reserva tu número favorito</div><div className="paymentpoint">✓ Recibe tu boleta con enlace único</div><div className="paymentpoint">✓ Envía tu comprobante por WhatsApp</div></div></div></section>
    <footer><div className="shell">Proyectos Santiago Gómez · {RAFFLE_NAME}<br/>¿Eres vendedor? <a href="/login">Inicia sesión aquí</a>.</div></footer>
  </main>;
}
