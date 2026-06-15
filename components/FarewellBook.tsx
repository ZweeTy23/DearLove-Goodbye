"use client";

import React, { useState } from "react";

interface FarewellBookProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FarewellBook({ isOpen, onClose }: FarewellBookProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleOpenBook = () => {
    if (!isFlipped && !isClosing) {
      setIsFlipped(true);
    }
  };

  const handleCloseBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosing(true);
    setIsFlipped(false);
    
    // Wait for the closing flip animation to finish before closing the modal
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 1000);
  };

  return (
    <div 
      className="lightbox-overlay" 
      style={{ 
        zIndex: 2000, 
        background: "rgba(3, 3, 4, 0.98)", // Almost pitch black
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}
    >
      {/* Background soft ambient particles */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(236,72,153,0.06) 0%, transparent 70%)",
          pointerEvents: "none"
        }}
      ></div>

      <div style={{ textAlign: "center", marginBottom: "40px", zIndex: 10, pointerEvents: "none" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "3px" }}>
          {!isFlipped ? "Haz clic en el libro para abrirlo" : "Nuestra Historia"}
        </p>
      </div>

      {/* 3D Book Container */}
      <div 
        className="book-scene"
        onClick={handleOpenBook}
        style={{
          width: "450px",
          height: "320px",
          perspective: "1200px",
          cursor: !isFlipped ? "pointer" : "default",
          zIndex: 10
        }}
      >
        <div 
          className={`book-3d ${isFlipped ? "flipped" : ""}`}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          {/* FRONT COVER */}
          <div 
            className="book-page front-cover"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)", // Deep midnight indigo/slate
              border: "5px solid #d97706", // Gold border
              borderRadius: "4px 12px 12px 4px",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.6), 5px 5px 20px rgba(0,0,0,0.5)",
              backfaceVisibility: "hidden",
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
          >
            {/* Book spine line decoration */}
            <div 
              style={{
                position: "absolute",
                left: "12px",
                top: 0,
                bottom: 0,
                width: "4px",
                background: "rgba(217, 119, 6, 0.4)"
              }}
            ></div>
            <div 
              style={{
                border: "2px solid rgba(217, 119, 6, 0.3)",
                padding: "30px 20px",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                width: "80%"
              }}
            >
              <h2 style={{ fontSize: "1.8rem", color: "#fbbf24", fontFamily: "Georgia, serif", letterSpacing: "1px" }}>
                Dalai & Delgado
              </h2>
              <div style={{ fontSize: "2.5rem", animation: "pulse 2.5s infinite" }}>💖</div>
              <p style={{ fontSize: "0.75rem", color: "#fbbf24", opacity: 0.8, textTransform: "uppercase", letterSpacing: "2px" }}>
                Un Recuerdo Eterno
              </p>
            </div>
          </div>

          {/* INSIDE LEFT PAGE */}
          <div 
            className="book-page inside-left"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              background: "#fafaf9", // Elegant warm paper
              boxShadow: "inset -10px 0 20px rgba(0,0,0,0.1), 5px 5px 15px rgba(0,0,0,0.3)",
              borderRadius: "4px 8px 8px 4px",
              padding: "36px 36px 36px 48px",
              color: "#1c1917", // Charcoal font
              fontFamily: "Georgia, serif",
              lineHeight: "1.9",
              backfaceVisibility: "hidden",
              zIndex: 3,
              transform: "rotateY(0deg)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}
          >
            {/* Central page crease shadow shadow */}
            <div 
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: "15px",
                background: "linear-gradient(to right, transparent, rgba(0,0,0,0.08))"
              }}
            ></div>
            <div style={{ fontSize: "1.05rem", fontStyle: "italic", display: "flex", flexDirection: "column", gap: "10px" }}>
              <p>Gracias por cada momento.</p>
              <p>Gracias por cada fotografía.</p>
              <p>Gracias por cada risa.</p>
              <p>Gracias por formar parte de mi historia.</p>
            </div>
          </div>

          {/* INSIDE RIGHT PAGE */}
          <div 
            className="book-page inside-right"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              background: "#fafaf9", // Warm paper
              boxShadow: "inset 10px 0 20px rgba(0,0,0,0.1), 5px 5px 15px rgba(0,0,0,0.3)",
              borderRadius: "8px 4px 4px 8px",
              padding: "36px 48px 36px 36px",
              color: "#1c1917",
              fontFamily: "Georgia, serif",
              lineHeight: "1.9",
              // Since this page is visible when the book is open, we offset it on the Y rotation
              transform: "rotateY(180deg)", 
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              // We swap backface visibility to make it show only when book flips
              transformOrigin: "left center"
            }}
          >
            {/* Central page crease shadow */}
            <div 
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "15px",
                background: "linear-gradient(to left, transparent, rgba(0,0,0,0.08))"
              }}
            ></div>

            <div style={{ fontSize: "1.05rem", fontStyle: "italic", display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              <p>Algunas personas llegan para quedarse.</p>
              <p>Otras llegan para enseñarnos algo.</p>
              <p>Tú hiciste ambas cosas.</p>
            </div>

            <div style={{ textAlign: "right", margin: "16px 0" }}>
              <span style={{ fontSize: "0.95rem", color: "#78716c" }}>Con cariño,</span>
              <h4 style={{ fontSize: "1.25rem", color: "#1c1917", fontWeight: "700", marginTop: "2px" }}>Delgado</h4>
            </div>

            <button 
              onClick={handleCloseBook}
              className="close-book-btn"
              style={{
                alignSelf: "center",
                background: "none",
                border: "none",
                borderBottom: "1px dashed #78716c",
                paddingBottom: "2px",
                fontSize: "0.75rem",
                color: "#78716c",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "1px",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#78716c")}
            >
              da click para cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
