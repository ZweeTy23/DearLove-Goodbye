"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

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

interface StarsUniverseProps {
  media: MediaItem[];
}

export default function StarsUniverse({ media }: StarsUniverseProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredItem, setHoveredItem] = useState<MediaItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // References for Three.js control loop
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // Orbiting state variables
  const isDraggingRef = useRef(false);
  const prevMousePosition = useRef({ x: 0, y: 0 });
  const thetaRef = useRef(0);
  const phiRef = useRef(Math.PI / 2.2);
  const cameraRadiusRef = useRef(140);
  const targetCamPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Array of interactive star meshes
  const starMeshes = useRef<{ mesh: THREE.Mesh; item: MediaItem; glow: THREE.Sprite }[]>([]);

  // Function to dynamically generate a glowing circular particle texture
  const createGlowTexture = (colorStr: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.2, colorStr);
    grad.addColorStop(0.5, colorStr.replace("1)", "0.2)"));
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // --- 1. Scene Setup ---
    const scene = new THREE.Scene();
    // Faint dark space fog
    scene.fog = new THREE.FogExp2(0x030208, 0.004);
    sceneRef.current = scene;

    // --- 2. Camera Setup ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // --- 3. Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030208, 1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 4. Lights ---
    const ambientLight = new THREE.AmbientLight(0x18112b, 2.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffe4e6, 1.2);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa78bfa, 0.8);
    dirLight2.position.set(-20, -40, -20);
    scene.add(dirLight2);

    // --- 5. Generate Glow Textures ---
    const pinkGlow = createGlowTexture("rgba(236, 72, 153, 1)");
    const cyanGlow = createGlowTexture("rgba(6, 182, 212, 1)");
    const whiteGlow = createGlowTexture("rgba(255, 255, 255, 1)");

    // --- 6. Background Galaxy Particles (Stardust) ---
    const bgStarsGeo = new THREE.BufferGeometry();
    const bgStarsCount = 1200;
    const bgStarsPos = new Float32Array(bgStarsCount * 3);
    const bgStarsSpeed = new Float32Array(bgStarsCount);
    
    for (let i = 0; i < bgStarsCount; i++) {
      // Create a nice spherical cloud with higher density towards the center
      const r = (Math.random() + 0.1) * 200;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      bgStarsPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      bgStarsPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      bgStarsPos[i * 3 + 2] = r * Math.cos(phi);
      
      bgStarsSpeed[i] = 0.2 + Math.random() * 0.8;
    }
    
    bgStarsGeo.setAttribute("position", new THREE.BufferAttribute(bgStarsPos, 3));
    
    const bgStarsMat = new THREE.PointsMaterial({
      size: 1.5,
      map: whiteGlow || undefined,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.75
    });
    
    const bgStars = new THREE.Points(bgStarsGeo, bgStarsMat);
    scene.add(bgStars);

    // --- 7. Memory Stars (Faceted Octahedrons with Glow & Rings) ---
    starMeshes.current = [];
    const starGeo = new THREE.OctahedronGeometry(1.3, 0); // Gemstone shape
    const ringGeo = new THREE.RingGeometry(2.0, 2.2, 32);

    media.forEach((item, index) => {
      const isVideo = item.type === "video";
      const colorValue = isVideo ? 0x06b6d4 : 0xec4899;
      const glowTex = isVideo ? cyanGlow : pinkGlow;
      
      // Faceted standard material
      const mat = new THREE.MeshStandardMaterial({
        color: colorValue,
        emissive: colorValue,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        metalness: 0.8,
        flatShading: true
      });
      
      const mesh = new THREE.Mesh(starGeo, mat);
      
      // Spherical shell distribution (Golden Spiral)
      const phi = Math.acos(-1 + (2 * index) / Math.max(1, media.length));
      const theta = Math.sqrt(media.length * Math.PI) * phi;
      const radius = 55 + Math.random() * 30; // Shell between 55 and 85

      mesh.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      // Random initial rotations
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.scale.setScalar(0.8 + Math.random() * 0.4);

      // A: Add volumetric glow halo around the star
      const spriteMat = new THREE.SpriteMaterial({
        map: glowTex || undefined,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
      });
      const glowSprite = new THREE.Sprite(spriteMat);
      glowSprite.scale.set(6, 6, 1);
      mesh.add(glowSprite);

      // B: Add Saturn-like orbiting ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorValue,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      // Give ring a random tilt
      ring.rotation.x = Math.PI / 2.5 + Math.random() * 0.4;
      ring.rotation.y = Math.random() * 0.5;
      mesh.add(ring);
      
      scene.add(mesh);
      starMeshes.current.push({ mesh, item, glow: glowSprite });
    });

    // --- 8. Constellation Links (Faint connecting lines) ---
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for (let i = 0; i < starMeshes.current.length; i++) {
      const p1 = starMeshes.current[i].mesh.position;
      
      // Find 2 nearest neighbors
      const distances = starMeshes.current
        .map((s, idx) => ({ idx, dist: p1.distanceTo(s.mesh.position) }))
        .filter(d => d.idx !== i)
        .sort((a, b) => a.dist - b.dist);

      const limit = Math.min(2, distances.length);
      for (let k = 0; k < limit; k++) {
        const neighborIdx = distances[k].idx;
        if (neighborIdx > i && distances[k].dist < 40) {
          const p2 = starMeshes.current[neighborIdx].mesh.position;
          const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
          const line = new THREE.Line(lineGeo, lineMat);
          scene.add(line);
        }
      }
    }

    // --- 9. Raycaster & Mouse Drag Handlers ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh: THREE.Mesh | null = null;

    const onMouseDown = (event: MouseEvent) => {
      if (selectedItem) return;
      isDraggingRef.current = true;
      prevMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update tooltip placement
      setTooltipPos({ x: event.clientX + 15, y: event.clientY + 15 });

      if (isDraggingRef.current) {
        const deltaX = event.clientX - prevMousePosition.current.x;
        const deltaY = event.clientY - prevMousePosition.current.y;
        
        thetaRef.current -= deltaX * 0.005;
        phiRef.current -= deltaY * 0.005;
        
        // Restrict vertical orbit between near-top and near-bottom
        phiRef.current = Math.max(0.15, Math.min(Math.PI - 0.15, phiRef.current));
        
        prevMousePosition.current = { x: event.clientX, y: event.clientY };
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onClick = () => {
      if (selectedItem) return;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(starMeshes.current.map(s => s.mesh));

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const record = starMeshes.current.find(s => s.mesh === clickedMesh);
        if (record) {
          // Orient camera smoothly directly in front of the clicked star
          const starPos = clickedMesh.position.clone();
          const direction = starPos.clone().normalize();
          
          targetCamPos.current = starPos.clone().sub(direction.multiplyScalar(22)); // 22 units offset
          targetLookAt.current.copy(starPos);
          setSelectedItem(record.item);
          setHoveredItem(null);
          isDraggingRef.current = false;
        }
      }
    };

    // Attach Event Listeners
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("click", onClick);

    // --- 10. Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Cosmic background rotation
      if (!selectedItem && !isDraggingRef.current) {
        bgStars.rotation.y = elapsedTime * 0.008;
        bgStars.rotation.x = elapsedTime * 0.003;
        // Slowly update horizontal orbit angle for idle spin
        thetaRef.current += 0.0012;
      }

      // Memory Star Animations (Breathing & Twinkling)
      starMeshes.current.forEach(({ mesh, glow }, index) => {
        // Subtle spinning on its own axes
        mesh.rotation.y += 0.004;
        mesh.rotation.x += 0.002;

        // Animate child ring (mesh.children[1] is the Ring)
        if (mesh.children[1]) {
          mesh.children[1].rotation.z += 0.008;
        }

        // Pulse scale & glow opacity (twinkling breathing effect)
        const breathe = 1.0 + 0.15 * Math.sin(elapsedTime * 2.5 + index * 0.8);
        
        // If not hovered, apply idle breath scale
        if (mesh !== hoveredMesh) {
          mesh.scale.setScalar(breathe);
          glow.scale.setScalar(6 * breathe);
          if (glow.material instanceof THREE.SpriteMaterial) {
            glow.material.opacity = 0.65 + 0.25 * Math.sin(elapsedTime * 4 + index);
          }
        }
      });

      // Smooth Camera Positioning & Interpolation
      if (selectedItem && targetCamPos.current) {
        camera.position.lerp(targetCamPos.current, 0.06);
        camera.lookAt(targetLookAt.current);
      } else {
        // Orbit mode camera coordinates
        const targetOverview = new THREE.Vector3(
          cameraRadiusRef.current * Math.sin(phiRef.current) * Math.sin(thetaRef.current),
          cameraRadiusRef.current * Math.cos(phiRef.current),
          cameraRadiusRef.current * Math.sin(phiRef.current) * Math.cos(thetaRef.current)
        );
        camera.position.lerp(targetOverview, 0.08);
        camera.lookAt(0, 0, 0);
      }

      // Raycasting for Hover states
      if (!selectedItem) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(starMeshes.current.map(s => s.mesh));

        if (intersects.length > 0) {
          const first = intersects[0].object as THREE.Mesh;
          if (hoveredMesh !== first) {
            // Reset previous hover scale
            if (hoveredMesh) {
              hoveredMesh.scale.setScalar(1);
              const prevRecord = starMeshes.current.find(s => s.mesh === hoveredMesh);
              if (prevRecord && prevRecord.glow.material instanceof THREE.SpriteMaterial) {
                prevRecord.glow.scale.setScalar(6);
                prevRecord.glow.material.opacity = 0.8;
              }
            }
            
            hoveredMesh = first;
            hoveredMesh.scale.setScalar(1.8); // Scale up parent gemstone
            
            const record = starMeshes.current.find(s => s.mesh === first);
            if (record) {
              setHoveredItem(record.item);
              record.glow.scale.setScalar(12); // Enlarge glow halo
              if (record.glow.material instanceof THREE.SpriteMaterial) {
                record.glow.material.opacity = 1.0;
              }
            }
          }
        } else {
          if (hoveredMesh) {
            hoveredMesh.scale.setScalar(1);
            const record = starMeshes.current.find(s => s.mesh === hoveredMesh);
            if (record) {
              record.glow.scale.setScalar(6);
              if (record.glow.material instanceof THREE.SpriteMaterial) {
                record.glow.material.opacity = 0.8;
              }
            }
            hoveredMesh = null;
            setHoveredItem(null);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- 11. Window Resize ---
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // --- 12. Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener("mousedown", onMouseDown);
        renderer.domElement.removeEventListener("click", onClick);
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose Geometries/Materials
      bgStarsGeo.dispose();
      bgStarsMat.dispose();
      starGeo.dispose();
      ringGeo.dispose();
      
      pinkGlow?.dispose();
      cyanGlow?.dispose();
      whiteGlow?.dispose();

      starMeshes.current.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
        
        // Children objects
        mesh.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          } else if (child instanceof THREE.Sprite) {
            child.material.dispose();
          }
        });
      });
    };
  }, [media, selectedItem]);

  // Back to space function
  const handleResetCamera = () => {
    targetCamPos.current = null;
    setSelectedItem(null);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "85vh", overflow: "hidden", borderRadius: "24px" }}>
      {/* Three.js canvas mount */}
      <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: selectedItem ? "default" : "grab" }}></div>

      {/* Floating Instructions */}
      <div style={{ position: "absolute", top: "24px", left: "24px", pointerEvents: "none" }}>
        <h2 style={{ fontSize: "1.6rem", textShadow: "0 2px 8px rgba(0,0,0,0.9)", color: "var(--text-primary)" }}>Universo 3D</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
          ✨ Haz clic y arrastra para girar el espacio. Pasa el cursor y haz clic en un recuerdo para acercarte.
        </p>
      </div>

      {/* Tooltip on Hover */}
      {hoveredItem && !selectedItem && (
        <div
          className="glass"
          style={{
            position: "fixed",
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            padding: "10px 14px",
            fontSize: "0.8rem",
            pointerEvents: "none",
            zIndex: 950,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            border: "1px solid var(--accent-light)"
          }}
        >
          <div style={{ fontWeight: "600" }}>{hoveredItem.name}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "2px" }}>
            {hoveredItem.type === "video" ? "🎬 Video" : "📷 Foto"} •{" "}
            {hoveredItem.captured_at ? new Date(hoveredItem.captured_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" }) : ""}
          </div>
        </div>
      )}

      {/* Focused Memory Card */}
      {selectedItem && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "600px",
            zIndex: 960,
            animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}
        >
          <div className="glass" style={{ padding: "24px", boxShadow: "var(--modal-glow)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Recuerdo Estelar</span>
              <button
                onClick={handleResetCamera}
                className="btn-glass"
                style={{ padding: "6px 12px", fontSize: "0.8rem", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--danger)" }}
              >
                Volver al Espacio ✕
              </button>
            </div>

            {/* Media Display */}
            <div style={{ width: "100%", maxHeight: "300px", borderRadius: "12px", overflow: "hidden", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center" }}>
              {selectedItem.type === "video" ? (
                <video src={selectedItem.url} controls autoPlay style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }} />
              ) : (
                <img src={selectedItem.url} alt={selectedItem.name} style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }} />
              )}
            </div>

            {/* Meta details */}
            <div style={{ marginTop: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{selectedItem.name}</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", gap: "10px", alignItems: "center" }}>
                <span>{selectedItem.type === "video" ? "🎬 Video" : "📷 Fotografía"}</span>
                <span>•</span>
                <span>{selectedItem.captured_at ? new Date(selectedItem.captured_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
              </p>

              {/* Story */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "10px",
                  borderLeft: "3px solid var(--accent)",
                  fontStyle: "italic",
                  fontSize: "0.95rem",
                  lineHeight: "1.5",
                  color: "var(--text-primary)"
                }}
              >
                {selectedItem.story || "Aún no hay una historia agregada para este recuerdo. Ve a la sección de Galería para editarla y escribir una historia de amor."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
