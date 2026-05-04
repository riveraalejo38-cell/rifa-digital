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
      background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "sans-serif",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(184,134,11,0.3)",
        borderRadius: "24px", padding: "40px",
        maxWidth: "400px", width: "100%",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "#ffd700", fontSize: "28px", fontWeight: "900", margin: "0 0 4px" }}>
            INCASUERTE
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
            Panel de Control
          </p>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 6px", letterSpacing: "1px" }}>
            USUARIO
          </p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Escribe tu usuario"
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(184,134,11,0.3)",
              borderRadius: "12px", padding: "12px 16px",
              color: "white", fontSize: "16px",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 6px", letterSpacing: "1px" }}>
            CONTRASEÑA
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Escribe tu contraseña"
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(184,134,11,0.3)",
              borderRadius: "12px", padding: "12px 16px",
              color: "white", fontSize: "16px",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#ef4444", fontSize: "14px", marginBottom: "16px", textAlign: "center" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#6b7280" : "linear-gradient(135deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)",
            border: "none", borderRadius: "12px", padding: "14px",
            color: "#1a0a00", fontWeight: "900", fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Entrando..." : "Ingresar"}
        </button>
      </div>
    </div>
  );
}