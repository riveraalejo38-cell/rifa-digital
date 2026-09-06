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
      background: "#15113F",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        input::placeholder { color: #6B63A8; }
        input:focus { outline: none; border-color: #8B93FF !important; }
      `}</style>
      <div style={{
        background: "#1B1854",
        border: "1px solid rgba(139,147,255,0.16)",
        borderRadius: "24px", padding: "40px",
        maxWidth: "400px", width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "#8B93FF", fontSize: "26px", fontWeight: "800", margin: "0 0 4px", letterSpacing: "0.5px" }}>
            PROYECTOS SANTIAGO GÓMEZ
          </h1>
          <p style={{ color: "#8A84C4", fontSize: "14px", margin: 0 }}>
            Panel de Control
          </p>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "#8A84C4", fontSize: "12px", margin: "0 0 6px", letterSpacing: "1px", fontWeight: "600" }}>
            USUARIO
          </p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Escribe tu usuario"
            style={{
              width: "100%", background: "#241F6B",
              border: "1.5px solid #2D2860",
              borderRadius: "12px", padding: "12px 16px",
              color: "#FFFFFF", fontSize: "16px",
              boxSizing: "border-box", fontFamily: "inherit", fontWeight: "500",
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "#8A84C4", fontSize: "12px", margin: "0 0 6px", letterSpacing: "1px", fontWeight: "600" }}>
            CONTRASEÑA
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Escribe tu contraseña"
            style={{
              width: "100%", background: "#241F6B",
              border: "1.5px solid #2D2860",
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
            background: loading ? "#2D2860" : "linear-gradient(135deg, #8B93FF, #5B62FF)",
            border: "none", borderRadius: "12px", padding: "14px",
            color: loading ? "#8A84C4" : "#15113F", fontWeight: "800", fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}
        >
          {loading ? "Entrando..." : "Ingresar"}
        </button>
      </div>
    </div>
  );
}
