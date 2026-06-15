"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import StarsUniverse from "./StarsUniverse";
import YucatanMap from "./YucatanMap";
import LoveGames from "./LoveGames";
import TimeCapsule from "./TimeCapsule";
import PoetrySection from "./PoetrySection";
import FarewellBook from "./FarewellBook";
import Navbar from "./Navbar";
import MiniSpotify from "./MiniSpotify";
import LoginLock from "./LoginLock";
import { createClient } from "@/utils/supabase/client";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
  size: number;
  captured_at: string;
  bucket_path: string;
  story?: string;
}

interface GalleryClientProps {
  initialMedia: MediaItem[];
}

export default function GalleryClient({ initialMedia }: GalleryClientProps) {
  const supabase = createClient();

  // --- Main Layout States ---
  const [activeTab, setActiveTab] = useState("gallery");
  const [isFarewellOpen, setIsFarewellOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // --- Gallery States ---
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "image" | "video">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Lightbox
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // Photo Story Editing
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [tempStory, setTempStory] = useState("");
  
  // Slideshow
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideshowSpeed] = useState(4000); // 4 seconds
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimationRef = useRef<HTMLDivElement | null>(null);
  
  // Infinite Scroll
  const [visibleCount, setVisibleCount] = useState(24);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // --- Load database updates & favorites ---
  useEffect(() => {
    // Check auth session
    const savedUser = localStorage.getItem("eoa_auth_user");
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    setIsLoadingAuth(false);

    const saved = localStorage.getItem("eoa_favorites");
    if (saved) {
      try {
        setFavorites(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    // Refresh media stories from local storage if database isn't fully configured
    const localStories = localStorage.getItem("eoa_photo_stories");
    if (localStories) {
      try {
        const storiesMap = JSON.parse(localStories);
        setMediaList(prev =>
          prev.map(item => ({
            ...item,
            story: storiesMap[item.id] || item.story
          }))
        );
      } catch {}
    }
  }, []);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = new Set(favorites);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setFavorites(updated);
    localStorage.setItem("eoa_favorites", JSON.stringify(Array.from(updated)));
  };

  // Save story to a photo
  const handleSaveStory = async (id: string) => {
    // 1. Update state
    setMediaList(prev =>
      prev.map(item => (item.id === id ? { ...item, story: tempStory } : item))
    );

    // 2. Save in LocalStorage fallback
    const localStories = localStorage.getItem("eoa_photo_stories") || "{}";
    try {
      const storiesMap = JSON.parse(localStories);
      storiesMap[id] = tempStory;
      localStorage.setItem("eoa_photo_stories", JSON.stringify(storiesMap));
    } catch {}

    setEditingStoryId(null);

    // 3. Save to Supabase
    try {
      await supabase
        .from("media")
        .update({ story: tempStory })
        .eq("id", id);
    } catch (err) {
      console.warn("Could not save photo story to Supabase, falling back to local storage.", err);
    }
  };

  // --- Dynamic Months List ---
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    mediaList.forEach(item => {
      if (item.captured_at) {
        const date = new Date(item.captured_at);
        if (!isNaN(date.getTime())) {
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, "0");
          months.add(`${year}-${month}`);
        }
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [mediaList]);

  const getMonthLabel = (yearMonthStr: string) => {
    const [year, month] = yearMonthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  };

  // --- Filtering Logic ---
  const filteredMedia = useMemo(() => {
    return mediaList.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = selectedType === "all" || item.type === selectedType;
      
      let monthMatch = true;
      if (selectedMonth !== "all" && item.captured_at) {
        const date = new Date(item.captured_at);
        if (!isNaN(date.getTime())) {
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, "0");
          monthMatch = `${year}-${month}` === selectedMonth;
        } else {
          monthMatch = false;
        }
      }

      const favMatch = !favoritesOnly || favorites.has(item.id);

      return nameMatch && typeMatch && monthMatch && favMatch;
    });
  }, [mediaList, searchQuery, selectedType, selectedMonth, favoritesOnly, favorites]);

  // --- Reset visible count on filter change ---
  useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, selectedType, selectedMonth, favoritesOnly]);

  // --- Infinite Scroll Observer ---
  useEffect(() => {
    const currentObserver = observerRef.current;
    if (!currentObserver) return;

    const ob = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => Math.min(prev + 24, filteredMedia.length));
      }
    }, { threshold: 0.1 });

    ob.observe(currentObserver);
    return () => ob.unobserve(currentObserver);
  }, [filteredMedia, activeTab]);

  // --- Lightbox Items Reference ---
  const activeItem = activeIdx !== null ? filteredMedia[activeIdx] : null;

  const handleOpenLightbox = (index: number) => {
    setActiveIdx(index);
    setZoom(1);
    setRotation(0);
    setIsPlaying(false);
    if (filteredMedia[index]) {
      setTempStory(filteredMedia[index].story || "");
    }
  };

  const handleCloseLightbox = () => {
    setActiveIdx(null);
    setIsPlaying(false);
    setEditingStoryId(null);
  };

  const handleNext = () => {
    if (filteredMedia.length === 0) return;
    setActiveIdx(prev => {
      if (prev === null) return 0;
      const nextIdx = (prev + 1) % filteredMedia.length;
      setTempStory(filteredMedia[nextIdx]?.story || "");
      return nextIdx;
    });
    setZoom(1);
    setRotation(0);
    setEditingStoryId(null);
  };

  const handlePrev = () => {
    if (filteredMedia.length === 0) return;
    setActiveIdx(prev => {
      if (prev === null) return filteredMedia.length - 1;
      const prevIdx = (prev - 1 + filteredMedia.length) % filteredMedia.length;
      setTempStory(filteredMedia[prevIdx]?.story || "");
      return prevIdx;
    });
    setZoom(1);
    setRotation(0);
    setEditingStoryId(null);
  };

  // --- Keyboard Event Handler ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeIdx === null || editingStoryId !== null) return; // Disable key shortcuts if editing story
      if (e.key === "Escape") handleCloseLightbox();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIdx, editingStoryId, filteredMedia]);

  // --- Slideshow Loop ---
  useEffect(() => {
    if (isPlaying && activeIdx !== null) {
      if (progressAnimationRef.current) {
        progressAnimationRef.current.style.transition = 'none';
        progressAnimationRef.current.style.width = '0%';
        progressAnimationRef.current.offsetHeight; // Force reflow
        progressAnimationRef.current.style.transition = `width ${slideshowSpeed}ms linear`;
        progressAnimationRef.current.style.width = '100%';
      }

      slideshowTimerRef.current = setTimeout(() => {
        handleNext();
      }, slideshowSpeed);
    } else {
      if (slideshowTimerRef.current) {
        clearTimeout(slideshowTimerRef.current);
      }
      if (progressAnimationRef.current) {
        progressAnimationRef.current.style.transition = 'none';
        progressAnimationRef.current.style.width = '0%';
      }
    }

    return () => {
      if (slideshowTimerRef.current) clearTimeout(slideshowTimerRef.current);
    };
  }, [isPlaying, activeIdx, slideshowSpeed]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Fecha desconocida";
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const stats = useMemo(() => {
    const images = mediaList.filter(m => m.type === "image").length;
    const videos = mediaList.filter(m => m.type === "video").length;
    return { total: mediaList.length, images, videos };
  }, [mediaList]);

  if (isLoadingAuth) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at center, #180d2b 0%, #030208 100%)" }}>
        <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "50%" }}></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginLock
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem("eoa_auth_user", user);
        }}
      />
    );
  }

  return (
    <div style={{ paddingBottom: "120px" }}> {/* Padding to keep clear of fixed floating navbar */}
      
      {/* --- GALLERY TAB --- */}
      {activeTab === "gallery" && (
        <div className="container animate-fade">
          <header style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "2.8rem", background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  EOA
                </h1>
                <p style={{ marginTop: "4px", fontSize: "1.1rem" }}>Archivo Digital de Medios</p>
              </div>
              <div className="glass" style={{ display: "flex", gap: "24px", padding: "12px 24px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: "700" }}>{stats.total}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Archivos</div>
                </div>
                <div style={{ width: "1px", background: "var(--border-color)" }}></div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: "700" }}>{stats.images}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Fotos</div>
                </div>
                <div style={{ width: "1px", background: "var(--border-color)" }}></div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: "700" }}>{stats.videos}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Videos</div>
                </div>
              </div>
            </div>
          </header>

          {/* Filter Bar */}
          <div className="glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 300px" }}>
                <input
                  type="text"
                  placeholder="Buscar por nombre de archivo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-glass"
                  style={{ width: "100%", paddingLeft: "44px" }}
                />
                <svg
                  style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "var(--text-muted)" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>✕</button>
                )}
              </div>

              <div className="glass" style={{ display: "inline-flex", padding: "4px", gap: "4px", borderRadius: "10px" }}>
                <button
                  onClick={() => setSelectedType("all")}
                  className="btn-glass"
                  style={{ padding: "8px 16px", border: "none", borderRadius: "8px", background: selectedType === "all" ? "rgba(255,255,255,0.1)" : "transparent", color: selectedType === "all" ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedType("image")}
                  className="btn-glass"
                  style={{ padding: "8px 16px", border: "none", borderRadius: "8px", background: selectedType === "image" ? "rgba(255,255,255,0.1)" : "transparent", color: selectedType === "image" ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  Fotos
                </button>
                <button
                  onClick={() => setSelectedType("video")}
                  className="btn-glass"
                  style={{ padding: "8px 16px", border: "none", borderRadius: "8px", background: selectedType === "video" ? "rgba(255,255,255,0.1)" : "transparent", color: selectedType === "video" ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  Videos
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-glass"
                  style={{ appearance: "none", paddingRight: "40px", cursor: "pointer" }}
                >
                  <option value="all">Cualquier fecha</option>
                  {uniqueMonths.map(month => (
                    <option key={month} value={month}>{getMonthLabel(month)}</option>
                  ))}
                </select>
                <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>▼</span>
              </div>

              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className="btn-glass"
                style={{ borderColor: favoritesOnly ? "rgba(239, 68, 68, 0.4)" : "var(--border-color)", background: favoritesOnly ? "rgba(239, 68, 68, 0.08)" : "transparent" }}
              >
                <svg style={{ width: "18px", height: "18px", fill: favoritesOnly ? "var(--danger)" : "none", color: favoritesOnly ? "var(--danger)" : "currentColor" }} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Favoritos ({favorites.size})
              </button>
            </div>
          </div>

          {/* Media Grid */}
          {filteredMedia.length === 0 ? (
            <div className="glass" style={{ padding: "80px 24px", textAlign: "center", marginTop: "32px" }}>
              <h3>No se encontraron archivos</h3>
              <p style={{ marginTop: "8px" }}>Prueba a cambiar tus criterios de búsqueda o filtros.</p>
            </div>
          ) : (
            <div className="media-grid">
              {filteredMedia.slice(0, visibleCount).map((item, index) => (
                <div key={item.id} className="media-card" onClick={() => handleOpenLightbox(index)}>
                  <div className="media-card-type-badge">
                    {item.type === "video" ? "🎬" : "📷"}
                  </div>

                  {item.type === "video" ? (
                    <video className="media-card-video" preload="metadata" muted>
                      <source src={`${item.url}#t=0.1`} />
                    </video>
                  ) : (
                    <img className="media-card-img" src={item.url} alt={item.name} loading="lazy" />
                  )}

                  <div className="media-card-overlay">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <div style={{ overflow: "hidden", marginRight: "12px" }}>
                        <div className="media-card-title">{item.name}</div>
                        <div className="media-card-meta">
                          {item.captured_at ? new Date(item.captured_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" }) : ""}
                        </div>
                      </div>
                      <button onClick={(e) => toggleFavorite(item.id, e)} style={{ color: favorites.has(item.id) ? "var(--danger)" : "#ffffff" }}>
                        <svg style={{ width: "22px", height: "22px", fill: favorites.has(item.id) ? "currentColor" : "none" }} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loader for infinite scroll */}
          {filteredMedia.length > visibleCount && (
            <div ref={observerRef} style={{ height: "100px", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "20px" }}>
              <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "50%" }}></div>
            </div>
          )}
        </div>
      )}

      {/* --- STARS TAB --- */}
      {activeTab === "stars" && (
        <div className="container animate-fade">
          <StarsUniverse media={mediaList} />
        </div>
      )}

      {/* --- MAP TAB --- */}
      {activeTab === "map" && (
        <div className="container animate-fade">
          <YucatanMap media={mediaList} />
        </div>
      )}

      {/* --- POETRY TAB --- */}
      {activeTab === "poetry" && (
        <div className="container animate-fade">
          <PoetrySection />
        </div>
      )}

      {/* --- GAMES TAB --- */}
      {activeTab === "games" && (
        <div className="container animate-fade">
          <LoveGames media={mediaList} />
        </div>
      )}

      {/* --- CAPSULE TAB --- */}
      {activeTab === "capsule" && (
        <div className="container animate-fade">
          <TimeCapsule />
        </div>
      )}

      {/* --- FLOATING NAVBAR --- */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFarewell={() => setIsFarewellOpen(true)}
      />

      {/* --- MINI SPOTIFY PLAYER --- */}
      <MiniSpotify />

      {/* --- 3D FAREWELL BOOK MODAL --- */}
      <FarewellBook
        isOpen={isFarewellOpen}
        onClose={() => setIsFarewellOpen(false)}
      />

      {/* --- LIGHTBOX MODAL --- */}
      {activeIdx !== null && activeItem && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          {isPlaying && (
            <div style={{ position: "absolute", top: 0, left: 0, height: "4px", background: "var(--accent)", zIndex: 1100, width: "0%" }} ref={progressAnimationRef}></div>
          )}

          <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} style={{ position: "absolute", left: "24px", zIndex: 1050, background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "50%" }}>
            <svg style={{ width: "24px", height: "24px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button onClick={(e) => { e.stopPropagation(); handleNext(); }} style={{ position: "absolute", right: "24px", zIndex: 1050, background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "50%" }}>
            <svg style={{ width: "24px", height: "24px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* Top Toolbar */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", position: "absolute", top: 0, left: 0, zIndex: 1050 }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "600" }}>{activeItem.name}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginLeft: "12px" }}>{activeIdx + 1} de {filteredMedia.length}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn-glass"
                  style={{ background: isPlaying ? "var(--accent)" : "rgba(0,0,0,0.4)", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {isPlaying ? "Pausar" : "Presentar"}
                </button>
                <button onClick={() => toggleFavorite(activeItem.id)} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--border-color)", padding: "8px", borderRadius: "8px", color: favorites.has(activeItem.id) ? "var(--danger)" : "inherit" }}>
                  <svg style={{ width: "18px", height: "18px", fill: favorites.has(activeItem.id) ? "currentColor" : "none" }} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {activeItem.type === "image" && (
                  <>
                    <button onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))} className="btn-glass" style={{ padding: "8px" }}>🔍+</button>
                    <button onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.75))} className="btn-glass" style={{ padding: "8px" }}>🔍-</button>
                    <button onClick={() => setRotation(prev => (prev + 90) % 360)} className="btn-glass" style={{ padding: "8px" }}>⟳</button>
                  </>
                )}

                <button onClick={() => setShowInfo(!showInfo)} className="btn-glass" style={{ background: showInfo ? "var(--accent)" : "rgba(0,0,0,0.4)", padding: "8px" }}>ℹ</button>
                
                <a href={activeItem.url} download={activeItem.name} target="_blank" rel="noopener noreferrer" className="btn-glass" style={{ padding: "8px 12px", fontSize: "0.85rem" }} onClick={(e) => e.stopPropagation()}>
                  Descargar
                </a>
                
                <button onClick={handleCloseLightbox} style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "8px 12px", borderRadius: "8px", fontWeight: "bold", color: "var(--danger)" }}>✕</button>
              </div>
            </div>

            {/* Media Body & Side Info Panel */}
            <div style={{ display: "flex", width: "100%", height: "100%", paddingTop: "60px", flexWrap: "wrap" }}>
              <div className="lightbox-media-wrapper" style={{ flex: "1 1 500px", height: "calc(100% - 60px)" }}>
                {activeItem.type === "video" ? (
                  <video className="lightbox-media" controls autoPlay key={activeItem.id} style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}>
                    <source src={activeItem.url} />
                  </video>
                ) : (
                  <img className="lightbox-media" src={activeItem.url} alt={activeItem.name} style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: "transform 0.15s ease-out" }} />
                )}
              </div>

              {showInfo && (
                <div className="glass" style={{ width: "320px", padding: "24px", margin: "24px 0 24px 24px", maxHeight: "calc(100% - 120px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", zIndex: 1060 }}>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", marginBottom: "4px" }}>Detalles del archivo</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Información e Historia de Amor</p>
                  </div>

                  <div style={{ width: "100%", height: "1px", background: "var(--border-color)" }}></div>

                  {/* Photo Story section */}
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Nuestra Historia</span>
                      {editingStoryId !== activeItem.id && (
                        <button
                          onClick={() => {
                            setEditingStoryId(activeItem.id);
                            setTempStory(activeItem.story || "");
                          }}
                          style={{ color: "var(--accent-light)", fontSize: "0.75rem" }}
                        >
                          Editar ✍️
                        </button>
                      )}
                    </div>
                    {editingStoryId === activeItem.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <textarea
                          value={tempStory}
                          onChange={(e) => setTempStory(e.target.value)}
                          className="input-glass"
                          style={{ width: "100%", minHeight: "80px", fontSize: "0.85rem", resize: "vertical" }}
                          placeholder="Escribe el hermoso recuerdo de este momento..."
                        />
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button onClick={() => setEditingStoryId(null)} className="btn-glass" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Cancelar</button>
                          <button onClick={() => handleSaveStory(activeItem.id)} className="btn-glass btn-primary" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: "rgba(255,255,255,0.02)", borderLeft: "3px solid var(--accent)", padding: "10px 12px", borderRadius: "8px", fontStyle: "italic", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                        {activeItem.story ? `"${activeItem.story}"` : "Aún no hay una historia agregada. Haz clic en 'Editar' para escribir un hermoso recuerdo de este día."}
                      </div>
                    )}
                  </div>

                  <div style={{ width: "100%", height: "1px", background: "var(--border-color)" }}></div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>Nombre</div>
                      <div style={{ fontSize: "0.9rem", wordBreak: "break-all", fontWeight: "500" }}>{activeItem.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>Tipo de medio</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "500" }}>{activeItem.type === "video" ? "🎬 Video" : "📷 Imagen"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>Tamaño</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "500" }}>{formatSize(activeItem.size)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>Fecha de captura</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "500" }}>{formatDate(activeItem.captured_at)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
