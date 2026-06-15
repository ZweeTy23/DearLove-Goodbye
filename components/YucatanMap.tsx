"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
}

interface MapPin {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  date: string;
  media_id?: string;
}

interface YucatanMapProps {
  media: MediaItem[];
}

// Default seeded pins in Yucatan
const defaultPins: MapPin[] = [
  {
    id: "seed-1",
    title: "Mérida (Paseo de Montejo)",
    description: "La hermosa ciudad blanca. Comiendo marquesitas bajo la sombra de los árboles del Paseo de Montejo y disfrutando del frescor de la tarde.",
    lat: 20.9676,
    lng: -89.6237,
    date: "2025-05-13"
  },
  {
    id: "seed-2",
    title: "Izamal (La Ciudad Amarilla)",
    description: "La ciudad amarilla. Caminamos por el gigantesco convento franciscano rodeados de muros dorados que brillaban bajo el sol de la tarde.",
    lat: 20.9312,
    lng: -89.0175,
    date: "2025-06-20"
  },
  {
    id: "seed-3",
    title: "Celestún (Manglares y Flamencos)",
    description: "Viaje en lancha por la ría para ver los flamencos rosa. Un santuario natural rodeado de aguas tranquilas y manglares verdes.",
    lat: 20.8622,
    lng: -90.3996,
    date: "2025-07-24"
  },
  {
    id: "seed-4",
    title: "Chichén Itzá",
    description: "Visita a la pirámide de Kukulcán, admirando la majestuosidad de la cultura maya y tomando hermosas fotografías.",
    lat: 20.6843,
    lng: -88.5678,
    date: "2025-08-07"
  },
  {
    id: "seed-5",
    title: "Progreso (El Malecón)",
    description: "Brisa marina en la cara, caminando por el malecón mientras las olas rompen suavemente en la arena blanca.",
    lat: 21.2809,
    lng: -89.6644,
    date: "2025-09-21"
  }
];

export default function YucatanMap({ media }: YucatanMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const supabase = createClient();

  const [pins, setPins] = useState<MapPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  
  // Pin Creator Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLat, setNewLat] = useState(0);
  const [newLng, setNewLng] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newMediaId, setNewMediaId] = useState("");

  // Load pins on mount
  useEffect(() => {
    async function fetchPins() {
      try {
        const { data, error } = await supabase.from("pins").select("*");
        if (!error && data && data.length > 0) {
          setPins(data);
        } else {
          // Fallback to localStorage or defaults
          const local = localStorage.getItem("eoa_map_pins");
          if (local) {
            try {
              setPins(JSON.parse(local));
            } catch {
              setPins(defaultPins);
            }
          } else {
            setPins(defaultPins);
            localStorage.setItem("eoa_map_pins", JSON.stringify(defaultPins));
          }
        }
      } catch (err) {
        console.error("Error fetching pins:", err);
        setPins(defaultPins);
      }
    }
    fetchPins();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet dynamically in client
    const L = require("leaflet");

    // Initialize Map instance
    const map = L.map(mapRef.current, {
      center: [20.8, -89.2], // Center of Yucatan
      zoom: 8.5,
      doubleClickZoom: false, // Disable zoom on double click to allow pin placement
      zoomControl: false
    });

    leafletMap.current = map;

    // Position Zoom control in bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Dark-themed Map Layer (CartoDB Dark Matter)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    // Capture double click to create pins
    map.on("dblclick", (e: any) => {
      setNewLat(e.latlng.lat);
      setNewLng(e.latlng.lng);
      setNewTitle("");
      setNewDescription("");
      setNewDate(new Date().toISOString().split("T")[0]);
      setNewMediaId("");
      setIsModalOpen(true);
    });

    return () => {
      map.remove();
    };
  }, []);

  // Update Markers when Pins list changes
  useEffect(() => {
    if (!leafletMap.current) return;
    const L = require("leaflet");

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Custom Glowing Heart Icon
    const heartIcon = L.divIcon({
      className: "custom-heart-marker",
      html: `
        <div style="
          font-size: 24px; 
          animation: pulse 2s infinite ease-in-out; 
          filter: drop-shadow(0 0 8px rgba(236,72,153,0.8));
          cursor: pointer;
        ">💖</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    // Add markers for each pin
    pins.forEach(pin => {
      const marker = L.marker([pin.lat, pin.lng], { icon: heartIcon }).addTo(leafletMap.current);
      
      marker.on("click", () => {
        setSelectedPin(pin);
      });

      markersRef.current.push(marker);
    });
  }, [pins]);

  // Save new pin
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPin: MapPin = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      description: newDescription,
      lat: newLat,
      lng: newLng,
      date: newDate,
      media_id: newMediaId || undefined
    };

    // Update locally
    const updatedPins = [...pins, newPin];
    setPins(updatedPins);
    localStorage.setItem("eoa_map_pins", JSON.stringify(updatedPins));
    setIsModalOpen(false);

    // Attempt to save to Supabase
    try {
      await supabase.from("pins").insert({
        title: newPin.title,
        description: newPin.description,
        lat: newPin.lat,
        lng: newPin.lng,
        date: newPin.date,
        media_id: newPin.media_id
      });
    } catch (err) {
      console.warn("Could not save pin to Supabase database, falling back to local storage.", err);
    }
  };

  // Find linked photo
  const linkedMedia = selectedPin?.media_id 
    ? media.find(m => m.id === selectedPin.media_id)
    : null;

  return (
    <div style={{ display: "flex", gap: "24px", height: "85vh", position: "relative", flexWrap: "wrap" }}>
      {/* Map Element */}
      <div 
        ref={mapRef} 
        className="glass" 
        style={{ 
          flex: "1 1 500px", 
          height: "100%", 
          borderRadius: "20px", 
          overflow: "hidden", 
          zIndex: 1,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}
      ></div>

      {/* Instructions / Info Panel */}
      <div 
        className="glass" 
        style={{ 
          width: "100%", 
          maxWidth: "400px", 
          flex: "1 1 300px", 
          height: "100%", 
          padding: "24px", 
          display: "flex", 
          flexDirection: "column", 
          gap: "20px",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
        }}
      >
        {!selectedPin ? (
          <div style={{ textAlign: "center", margin: "auto 0" }}>
            <span style={{ fontSize: "3rem" }}>🗺️</span>
            <h3 style={{ marginTop: "16px", fontSize: "1.3rem" }}>Mapa de Aventuras</h3>
            <p style={{ marginTop: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Haz clic en cualquier corazón para ver los recuerdos de los lugares hermosos que visitamos en Yucatán.
            </p>
            <div 
              style={{ 
                marginTop: "24px", 
                padding: "12px", 
                border: "1px dashed var(--border-color)", 
                borderRadius: "10px", 
                fontSize: "0.8rem", 
                color: "var(--text-muted)",
                background: "rgba(255,255,255,0.01)" 
              }}
            >
              💡 <strong>Tip Romántico:</strong> Haz doble clic en cualquier parte del mapa para agregar un nuevo pin y enlazarlo con una foto de la galería.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "slideUp 0.3s ease forwards" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Lugar Visitado</span>
              <button 
                onClick={() => setSelectedPin(null)} 
                style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "none", border: "none" }}
              >
                Cerrar ✕
              </button>
            </div>

            <div>
              <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>{selectedPin.title}</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--accent-light)", marginTop: "4px" }}>
                📅 {selectedPin.date ? new Date(selectedPin.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "Fecha sin registrar"}
              </p>
            </div>

            <div style={{ width: "100%", height: "1px", background: "var(--border-color)" }}></div>

            {/* Linked Image */}
            {linkedMedia && (
              <div style={{ width: "100%", maxHeight: "200px", borderRadius: "10px", overflow: "hidden", background: "rgba(0,0,0,0.5)" }}>
                {linkedMedia.type === "video" ? (
                  <video src={linkedMedia.url} controls style={{ width: "100%", maxHeight: "200px", objectFit: "cover" }} />
                ) : (
                  <img src={linkedMedia.url} alt={selectedPin.title} style={{ width: "100%", maxHeight: "200px", objectFit: "cover" }} />
                )}
              </div>
            )}

            {/* Story text */}
            <div 
              style={{ 
                background: "rgba(255,255,255,0.02)", 
                borderLeft: "3px solid var(--accent)", 
                padding: "16px", 
                borderRadius: "10px", 
                fontStyle: "italic", 
                fontSize: "0.95rem", 
                lineHeight: "1.5", 
                color: "var(--text-primary)" 
              }}
            >
              "{selectedPin.description}"
            </div>
          </div>
        )}
      </div>

      {/* --- ADD PIN MODAL --- */}
      {isModalOpen && (
        <div 
          className="lightbox-overlay" 
          style={{ zIndex: 1100 }}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="glass" 
            style={{ 
              width: "90%", 
              maxWidth: "500px", 
              padding: "24px", 
              boxShadow: "var(--modal-glow)", 
              animation: "slideUp 0.3s ease forwards" 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>Marcar Lugar Hermoso</h3>
            
            <form onSubmit={handleSavePin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Nombre del Lugar</label>
                <input 
                  type="text" 
                  placeholder="Ej. Cenote Ik Kil, Progreso, etc." 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  className="input-glass"
                  required 
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Fecha de la Visita</label>
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={(e) => setNewDate(e.target.value)} 
                  className="input-glass" 
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Historia / Recuerdo Lindo</label>
                <textarea 
                  placeholder="Escribe lo más bonito que pasó ese día..." 
                  value={newDescription} 
                  onChange={(e) => setNewDescription(e.target.value)} 
                  className="input-glass" 
                  style={{ minHeight: "100px", resize: "vertical" }}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Vincular con una Foto</label>
                <select 
                  value={newMediaId} 
                  onChange={(e) => setNewMediaId(e.target.value)} 
                  className="input-glass"
                >
                  <option value="">-- Sin foto --</option>
                  {media.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px", justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn-glass"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-glass btn-primary"
                >
                  Guardar Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
