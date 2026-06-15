"use client";

import React, { useState, useEffect, useRef } from "react";

export default function MiniSpotify() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fallbackTrack = "https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-12.mp3";

  // Fetch music files from next api (lists Supabase storage)
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wqqbcdtbyuohzmjyituf.supabase.co";
    fetch("/api/music")
      .then((res) => res.json())
      .then((data) => {
        if (data.files && data.files.length > 0) {
          const fileUrls = data.files.map(
            (file: string) => `${supabaseUrl}/storage/v1/object/public/musica/${encodeURIComponent(file)}`
          );
          setPlaylist(fileUrls);
        } else {
          setPlaylist([fallbackTrack]);
        }
      })
      .catch(() => {
        setPlaylist([fallbackTrack]);
      });
  }, []);

  // Sync audio play state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.log("Audio play blocked by browser:", err.message);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex, playlist]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTrackEnded = () => {
    if (playlist.length > 1) {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const handleNext = () => {
    if (playlist.length > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (playlist.length > 0) {
      setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
      setIsPlaying(true);
    }
  };

  // Get display name of track
  const getTrackName = () => {
    if (playlist.length === 0) return "Cargando...";
    const url = playlist[currentTrackIndex];
    if (url === fallbackTrack) return "Melodía Romántica (Piano)";
    const parts = url.split("/");
    let fileName = decodeURIComponent(parts[parts.length - 1]);
    
    // Strip file extension
    fileName = fileName.replace(/\.[^/.]+$/, "");
    
    // Decode Hex-encoded name if applicable
    if (/^[0-9a-fA-F]+$/.test(fileName) && fileName.length % 2 === 0) {
      try {
        const bytes = [];
        for (let i = 0; i < fileName.length; i += 2) {
          bytes.push(parseInt(fileName.substring(i, i + 2), 16));
        }
        const decoded = new TextDecoder("utf-8").decode(new Uint8Array(bytes));
        if (!/[\x00-\x1F\x7F]/.test(decoded)) {
          fileName = decoded.replace(/\.[^/.]+$/, ""); // Strip inner extension if decodes to one
        }
      } catch (e) {}
    }

    // Remove spotdown.org suffix if present
    fileName = fileName.replace(/_?spotdown\.org/gi, "");
    // Replace dashes and underscores with spaces
    fileName = fileName.replace(/[-_]/g, " ");
    // Clean trailing dots
    fileName = fileName.replace(/\.+$/, "");
    // Clean up multiple spaces
    fileName = fileName.replace(/\s+/g, " ").trim();
    return fileName || "Canción de Amor";
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>
      {playlist.length > 0 && (
        <audio
          ref={audioRef}
          src={playlist[currentTrackIndex]}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleTrackEnded}
          preload="auto"
        />
      )}

      {isMinimized ? (
        // Circular floating widget in bottom-left corner
        <div
          onClick={() => setIsMinimized(false)}
          className="glass"
          style={{
            position: "fixed",
            bottom: "100px",
            left: "24px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 950,
            boxShadow: "0 8px 32px rgba(236,72,153,0.3)",
            animation: isPlaying ? "pulse 2s infinite ease-in-out" : "none",
            border: "1px solid var(--accent-light)",
            transition: "transform 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          title={`Reproduciendo: ${getTrackName()}`}
        >
          <div
            style={{
              fontSize: "1.5rem",
              animation: isPlaying ? "spin 12s linear infinite" : "none"
            }}
          >
            🎵
          </div>
        </div>
      ) : (
        // Expanded Spotify card floating in bottom-left corner
        <div
          className="glass animate-fade"
          style={{
            position: "fixed",
            bottom: "100px",
            left: "24px",
            width: "280px",
            padding: "16px",
            borderRadius: "20px",
            zIndex: 950,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backdropFilter: "blur(20px)"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", color: "var(--accent-light)", letterSpacing: "1px" }}>
              Reproductor Romántico
            </span>
            <button
              onClick={() => setIsMinimized(true)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
              title="Minimizar reproductor"
            >
              ✕
            </button>
          </div>

          {/* Album Info & Vinyl Disc */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* Spinning Disc */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "radial-gradient(circle, #222 25%, #111 60%, var(--accent) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                animation: isPlaying ? "spin 8s linear infinite" : "none",
                border: "1px solid rgba(255,255,255,0.15)"
              }}
            >
              <span style={{ fontSize: "1rem" }}>❤️</span>
            </div>
            {/* Track Info */}
            <div style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  color: "var(--text-primary)"
                }}
              >
                {getTrackName()}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Para Dalai 💖
              </div>
            </div>
          </div>

          {/* Progress Bar & Seek */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              style={{
                width: "100%",
                height: "4px",
                borderRadius: "2px",
                background: "rgba(255,255,255,0.1)",
                outline: "none",
                cursor: "pointer",
                accentColor: "var(--accent)"
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-muted)" }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px" }}>
            {/* Prev */}
            <button
              onClick={handlePrev}
              style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", fontSize: "1.1rem" }}
              title="Anterior"
            >
              ⏮
            </button>
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--accent)",
                color: "#ffffff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px var(--accent-glow)",
                transition: "transform 0.1s"
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              title={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            {/* Next */}
            <button
              onClick={handleNext}
              style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", fontSize: "1.1rem" }}
              title="Siguiente"
            >
              ⏭
            </button>
          </div>

          {/* Volume Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginTop: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                width: "80px",
                height: "3px",
                background: "rgba(255,255,255,0.1)",
                outline: "none",
                cursor: "pointer",
                accentColor: "var(--text-secondary)"
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🔊</span>
          </div>
        </div>
      )}
    </>
  );
}
