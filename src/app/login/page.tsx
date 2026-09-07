"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Escribe tu usuario y contraseña");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.success) {
      if (data.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/vendedor");
      }
    } else {
      setError(data.error || "Usuario o contraseña incorrectos");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, rgba(11,31,23,0.55) 0%, rgba(11,31,23,0.88) 70%, #0B1F17 100%), url('/premios/hero-grupo.jpg')",
      backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        input::placeholder { color: #5E7690; }
        input:focus { outline: none; border-color: #D9AD52 !important; }
      `}</style>
      <div style={{
        background: "#142B21",
        border: "1px solid rgba(217,173,82,0.16)",
        borderRadius: "24px", padding: "40px",
        maxWidth: "400px", width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "#D9AD52", fontSize: "26px", fontWeight: "800", margin: "0 0 4px", letterSpacing: "0.5px" }}>
            PROYECTOS SANTIAGO GÓMEZ
          </h1>
          <p style={{ color: "#7C93AC", fontSize: "14px", margin: 0 }}>
            Panel de Control
          </p>
        </div>

        {/* autoComplete="off"/"new-password" evita que el navegador deje
            guardado el usuario/contraseña anterior y lo vuelva a poner solo
            al entrar a esta pantalla, obligando a borrarlo a mano antes de
            poder escribir otro usuario. */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "#7C93AC", fontSize: "12px", margin: "0 0 6px", letterSpacing: "1px", fontWeight: "600" }}>
            USUARIO
          </p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Escribe tu usuario"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            name="usuario-panel"
            style={{
              width: "100%", background: "#142B21",
              border: "1.5px solid #28405A",
              borderRadius: "12px", padding: "12px 16px",
              color: "#FFFFFF", fontSize: "16px",
              boxSizing: "border-box", fontFamily: "inherit", fontWeight: "500",
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "#7C93AC", fontSize: "12px", margin: "0 0 6px", letterSpacing: "1px", fontWeight: "600" }}>
            CONTRASEÑA
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Escribe tu contraseña"
            autoComplete="new-password"
            name="clave-panel"
            style={{
              width: "100%", background: "#142B21",
              border: "1.5px solid #28405A",
              borderRadius: "12px", padding: "12px 16px",
              color: "#FFFFFF", fontSize: "16px",
              boxSizing: "border-box", fontFamily: "inherit", fontWeight: "500",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#F87171", fontSize: "14px", marginBottom: "16px", textAlign: "center", fontWeight: "500" }}>
            ⚠ {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#28405A" : "linear-gradient(135deg, #D9AD52, #B58A2E)",
            border: "none", borderRadius: "12px", padding: "14px",
            color: loading ? "#7C93AC" : "#0B1F17", fontWeight: "800", fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}
        >
          {loading ? "Entrando..." : "Ingresar"}
        </button>
      </div>
    </div>
  );
}
