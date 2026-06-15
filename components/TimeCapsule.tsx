"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface TimeLetter {
  id: string;
  title: string;
  content: string;
  unlock_at: string;
  created_at: string;
}

const defaultCapsules: TimeLetter[] = [
  {
    id: "default-2027",
    title: "Carta para el 2027",
    content: "Mi Dalai linda, si estás leyendo esto, ya es el año 2027. Ha pasado el tiempo, pero mi amor por ti sigue intacto o más grande aún. Espero que hayamos cumplido ese viaje que tanto planeamos y que sigamos riendo por las mismas tonterías de siempre, coleccionando momentos y cuidando el uno del otro en cada amanecer. Te amo infinitamente.",
    unlock_at: "2027-01-01T00:00:00Z",
    created_at: "2026-06-14T12:00:00Z"
  },
  {
    id: "default-2030",
    title: "Carta para el 2030",
    content: "Hola mi vida, en el 2030 ya habrá pasado casi media década desde que empezamos este archivo. Imagino que habremos logrado tantas cosas profesionales y personales juntos, tal vez en nuestro propio hogar, con nuevos planes y los mismos abrazos cálidos que me borran el invierno. Gracias por elegir caminar a mi lado todos estos años. Te amo hoy y en el 2030 mucho más.",
    unlock_at: "2030-01-01T00:00:00Z",
    created_at: "2026-06-14T12:00:00Z"
  },
  {
    id: "default-2035",
    title: "Carta para el 2035",
    content: "Dalai, diez años en el futuro... ¿Te lo imaginas? Si estás abriendo esto en el 2035, espero que al mirar atrás sientas el orgullo más inmenso por la hermosa historia que hemos construido juntos. Hemos reído, hemos superado retos, pero sobre todo, nos hemos mantenido unidos. Te amé ayer, te amo hoy, te amaré en el 2035 y por la eternidad entera.",
    unlock_at: "2035-01-01T00:00:00Z",
    created_at: "2026-06-14T12:00:00Z"
  }
];

export default function TimeCapsule() {
  const supabase = createClient();
  const [letters, setLetters] = useState<TimeLetter[]>([]);
  const [activeLetter, setActiveLetter] = useState<TimeLetter | null>(null);
  
  // Form States
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [unlockDate, setUnlockDate] = useState("");

  // Countdown States (Triggered by interval)
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load letters from Supabase
  useEffect(() => {
    async function loadLetters() {
      try {
        const { data, error } = await supabase
          .from("capsules")
          .select("*");

        if (!error && data && data.length > 0) {
          // Merge default with database letters
          setLetters([...defaultCapsules, ...data]);
        } else {
          loadLocal();
        }
      } catch (err) {
        loadLocal();
      }
    }

    function loadLocal() {
      const local = localStorage.getItem("eoa_time_capsules");
      if (local) {
        try {
          setLetters([...defaultCapsules, ...JSON.parse(local)]);
        } catch {
          setLetters(defaultCapsules);
        }
      } else {
        setLetters(defaultCapsules);
      }
    }

    loadLetters();
  }, []);

  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !unlockDate) return;

    // Convert date input (YYYY-MM-DD) to ISO UTC DateTime
    const unlockDateTime = new Date(`${unlockDate}T00:00:00Z`).toISOString();

    const newLetter: TimeLetter = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      content,
      unlock_at: unlockDateTime,
      created_at: new Date().toISOString()
    };

    // Update locally
    const customLetters = letters.filter(l => !l.id.startsWith("default-"));
    const updatedCustom = [...customLetters, newLetter];
    localStorage.setItem("eoa_time_capsules", JSON.stringify(updatedCustom));
    setLetters([...defaultCapsules, ...updatedCustom]);

    // Reset Form
    setTitle("");
    setContent("");
    setUnlockDate("");

    // Attempt to save to Supabase
    try {
      await supabase.from("capsules").insert({
        title: newLetter.title,
        content: newLetter.content,
        unlock_at: newLetter.unlock_at
      });
    } catch (err) {
      console.warn("Could not save capsule to Supabase, falling back to local storage.", err);
    }
  };

  // Helper to format remaining time
  const getCountdown = (unlockAtStr: string) => {
    const unlockTime = new Date(unlockAtStr).getTime();
    const diff = unlockTime - now.getTime();

    if (diff <= 0) return null;

    const secs = Math.floor(diff / 1000) % 60;
    const mins = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return { days, hours, mins, secs };
  };

  return (
    <div style={{ display: "flex", gap: "24px", minHeight: "80vh", flexWrap: "wrap" }}>
      {/* Left panel: List of Capsules */}
      <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="glass" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.6rem" }}>Cápsulas del Tiempo</h2>
          <p style={{ marginTop: "4px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Mensajes escritos con cariño para ser leídos en fechas específicas del futuro.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {letters.map((letter) => {
            const countdown = getCountdown(letter.unlock_at);
            const isLocked = countdown !== null;

            return (
              <div
                key={letter.id}
                onClick={() => {
                  if (!isLocked) {
                    setActiveLetter(letter);
                  }
                }}
                className="glass"
                style={{
                  padding: "20px",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  borderColor: isLocked ? "var(--border-color)" : "var(--border-active)",
                  background: isLocked ? "var(--bg-card)" : "rgba(139, 92, 246, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (!isLocked) e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  if (!isLocked) e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1.5rem" }}>{isLocked ? "🔒" : "✉️"}</span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: isLocked ? "rgba(255,255,255,0.05)" : "var(--success)",
                      color: isLocked ? "var(--text-secondary)" : "#ffffff"
                    }}
                  >
                    {isLocked ? "Bloqueado" : "Abierto"}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>{letter.title}</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Desbloquea el: {new Date(letter.unlock_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>

                {/* Countdown display */}
                {isLocked && countdown && (
                  <div
                    style={{
                      marginTop: "8px",
                      background: "rgba(0,0,0,0.2)",
                      padding: "10px",
                      borderRadius: "8px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ color: "var(--accent-light)", fontWeight: "600", fontSize: "0.9rem" }}>
                      {countdown.days}d {countdown.hours}h {countdown.mins}m {countdown.secs}s
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "2px" }}>
                      Tiempo restante
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: Letter Writer */}
      <div className="glass" style={{ flex: "1 1 320px", maxWidth: "420px", height: "fit-content", padding: "24px" }}>
        <h3 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>Escribir al Futuro</h3>
        <form onSubmit={handleSaveLetter} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Título de la Carta</label>
            <input
              type="text"
              placeholder="Ej. Carta para nuestro aniversario 2028..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-glass"
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Fecha de Desbloqueo</label>
            <input
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="input-glass"
              min={new Date().toISOString().split("T")[0]} // Only allow future dates
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Mensaje de la Carta</label>
            <textarea
              placeholder="Escribe algo hermoso que solo deba ser leído en esa fecha del futuro..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-glass"
              style={{ minHeight: "150px", resize: "vertical" }}
              required
            />
          </div>

          <button type="submit" className="btn-glass btn-primary" style={{ justifyContent: "center" }}>
            🔒 Sellar y Bloquear Carta
          </button>
        </form>
      </div>

      {/* --- LIGHTBOX LETTER VIEWER --- */}
      {activeLetter && (
        <div className="lightbox-overlay" style={{ zIndex: 1100 }} onClick={() => setActiveLetter(null)}>
          <div
            className="glass animate-slide"
            style={{
              width: "90%",
              maxWidth: "600px",
              padding: "40px",
              background: "rgba(10, 10, 15, 0.95)",
              border: "1px solid var(--border-active)",
              boxShadow: "var(--modal-glow)",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Wax stamp or icon decoration */}
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "var(--accent)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                margin: "0 auto 24px",
                boxShadow: "0 0 16px rgba(139, 92, 246, 0.4)"
              }}
            >
              ✉️
            </div>

            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.8rem", color: "var(--text-primary)" }}>{activeLetter.title}</h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Escrita el: {new Date(activeLetter.created_at).toLocaleDateString("es-ES")} • 
                Desbloqueada el: {new Date(activeLetter.unlock_at).toLocaleDateString("es-ES")}
              </div>
            </div>

            <div style={{ width: "100%", height: "1px", background: "var(--border-color)", marginBottom: "24px" }}></div>

            {/* Letter Body */}
            <div
              style={{
                fontFamily: "Georgia, serif", // Classic elegant font for reading letters
                fontSize: "1.1rem",
                lineHeight: "1.8",
                color: "#e2e8f0",
                maxHeight: "300px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                padding: "8px 12px"
              }}
            >
              {activeLetter.content}
            </div>

            <div style={{ width: "100%", height: "1px", background: "var(--border-color)", marginTop: "24px", marginBottom: "24px" }}></div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button onClick={() => setActiveLetter(null)} className="btn-glass" style={{ padding: "8px 24px" }}>
                Guardar Carta de nuevo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
