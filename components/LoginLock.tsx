"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";

interface LoginLockProps {
  onLoginSuccess: (user: string) => void;
}

export default function LoginLock({ onLoginSuccess }: LoginLockProps) {
  const [selectedUser, setSelectedUser] = useState<"Jose" | "Dalai" | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUser) {
      setError("Por favor, selecciona quién eres, mi amor. 💕");
      return;
    }

    // Anniversary date password
    if (password === "05/09/25") {
      // Trigger romantic confetti explosion
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#ec4899", "#f472b6", "#a78bfa", "#8b5cf6"]
      });

      // Pass success
      setTimeout(() => {
        onLoginSuccess(selectedUser);
      }, 800);
    } else {
      setError("¡Ups! Esa no es nuestra fecha especial... Inténtalo de nuevo, mi amor. ❤️");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "radial-gradient(circle at center, #180d2b 0%, #030208 100%)",
        padding: "20px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Dynamic Floating Hearts Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-around",
          opacity: 0.1
        }}
      >
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            style={{
              fontSize: `${Math.random() * 2 + 1}rem`,
              animation: `floatUp ${5 + Math.random() * 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `translateY(100vh)`
            }}
          >
            💖
          </div>
        ))}
      </div>

      <div
        className="glass animate-fade"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "36px 32px",
          borderRadius: "24px",
          boxShadow: "var(--modal-glow)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          textAlign: "center",
          zIndex: 10
        }}
      >
        <span style={{ fontSize: "3rem", display: "block", marginBottom: "12px", animation: "pulse 2s infinite" }}>
          🔒
        </span>
        <h1
          style={{
            fontSize: "2rem",
            marginBottom: "8px",
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "700"
          }}
        >
          EOA
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "28px" }}>
          Archivo Digital de Nuestro Amor
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* User Selector */}
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "12px" }}>
              ¿Quién está entrando?
            </label>
            <div style={{ display: "flex", gap: "16px" }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser("Jose");
                  setError(null);
                }}
                className="btn-glass"
                style={{
                  flex: 1,
                  padding: "16px 8px",
                  borderRadius: "16px",
                  background: selectedUser === "Jose" ? "rgba(6, 182, 212, 0.15)" : "transparent",
                  borderColor: selectedUser === "Jose" ? "var(--accent-light)" : "var(--border-color)",
                  color: selectedUser === "Jose" ? "var(--accent-light)" : "var(--text-primary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.95rem"
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>👦</span>
                <span>Jose</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser("Dalai");
                  setError(null);
                }}
                className="btn-glass"
                style={{
                  flex: 1,
                  padding: "16px 8px",
                  borderRadius: "16px",
                  background: selectedUser === "Dalai" ? "rgba(236, 72, 153, 0.15)" : "transparent",
                  borderColor: selectedUser === "Dalai" ? "var(--accent)" : "var(--border-color)",
                  color: selectedUser === "Dalai" ? "var(--accent)" : "var(--text-primary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.95rem"
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>👧</span>
                <span>Dalai</span>
              </button>
            </div>
          </div>

          {/* Password Input */}
          {selectedUser && (
            <div className="animate-slide" style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Contraseña Especial (Fecha de Noviazgo)
              </label>
              <input
                type="password"
                placeholder="DD/MM/AA"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glass"
                style={{ width: "100%", textAlign: "center", fontSize: "1.2rem", letterSpacing: "4px" }}
                required
                autoFocus
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--danger)",
                padding: "8px 12px",
                background: "rgba(239, 68, 68, 0.05)",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                lineHeight: "1.4"
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-glass btn-primary"
            disabled={!selectedUser || !password}
            style={{
              padding: "14px",
              fontSize: "1rem",
              fontWeight: "600",
              justifyContent: "center",
              marginTop: "8px",
              opacity: selectedUser && password ? 1 : 0.5,
              cursor: selectedUser && password ? "pointer" : "not-allowed"
            }}
          >
            Abrir Archivo de Amor ➔
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-10vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
