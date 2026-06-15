"use client";

import React from "react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenFarewell: () => void;
}

export default function Navbar({ activeTab, setActiveTab, onOpenFarewell }: NavbarProps) {
  const menuItems = [
    { id: "gallery", label: "Galería", icon: "📷" },
    { id: "stars", label: "Universo 3D", icon: "✨" },
    { id: "map", label: "Mapa de Amor", icon: "🗺️" },
    { id: "poetry", label: "Poesía", icon: "✍️" },
    { id: "games", label: "Juegos", icon: "🧩" },
    { id: "capsule", label: "Cápsula", icon: "⏳" }
  ];

  return (
    <nav
      className="glass"
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 20px",
        width: "90%",
        maxWidth: "800px",
        boxShadow: "var(--modal-glow)"
      }}
    >
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "2px", flex: 1 }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="btn-glass"
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: "10px",
              background: activeTab === item.id ? "var(--accent)" : "transparent",
              color: activeTab === item.id ? "#ffffff" : "var(--text-secondary)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            <span>{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Secret Heart Trigger */}
      <div style={{ display: "flex", alignItems: "center", marginLeft: "12px", borderLeft: "1px solid var(--border-color)", paddingLeft: "12px" }}>
        <button
          onClick={onOpenFarewell}
          style={{
            opacity: 0.2,
            fontSize: "1.3rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "opacity 0.3s, transform 0.3s, filter 0.3s",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: "drop-shadow(0 0 2px rgba(255,255,255,0.2))"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "scale(1.2)";
            e.currentTarget.style.filter = "drop-shadow(0 0 8px var(--accent))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.2";
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.filter = "drop-shadow(0 0 2px rgba(255,255,255,0.2))";
          }}
          title="Nuestro libro secreto 💖"
        >
          ❤️
        </button>
      </div>
    </nav>
  );
}
