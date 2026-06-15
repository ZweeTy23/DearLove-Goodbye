"use client";

import React, { useState, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
}

interface LoveGamesProps {
  media: MediaItem[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Preset Romantic Quiz Questions
const initialQuestions: QuizQuestion[] = [
  {
    question: "💖 ¿Dónde fue nuestra primera cita?",
    options: ["Plaza Harbor", "La Isla", "Gran Plaza", "Galerías Mérida"],
    correctAnswer: 0,
    explanation: "¡Sí! Nuestra primera cita en Plaza Harbor fue inolvidable y mágica."
  },
  {
    question: "📸 ¿Dónde nos tomamos nuestra primera foto juntos?",
    options: ["En la escuela", "En Plaza Harbor", "En el cine", "En una cafetería"],
    correctAnswer: 0,
    explanation: "¡Exacto! Esa primera fotito en la escuela capturó el inicio de todo lo hermoso."
  },
  {
    question: "🎵 ¿Cuál era nuestra canción más especial?",
    options: ["Bésame", "Stupid Love Story", "Perfect", "Eres"],
    correctAnswer: 0,
    explanation: "¡Bésame! La melodía que define perfectamente los latidos de nuestro corazón."
  },
  {
    question: "✨ ¿Qué día comenzó oficialmente nuestra historia?",
    options: ["5 de septiembre", "13 de junio", "14 de febrero", "1 de enero"],
    correctAnswer: 0,
    explanation: "¡El 5 de septiembre! El día en que la magia de estar juntos comenzó de verdad."
  },
  {
    question: "💌 ¿Cuál era mi apodo para ti?",
    options: ["Purim", "Princesa", "Amorcito", "Mi niña"],
    correctAnswer: 0,
    explanation: "¡Purim! El nombre más tierno y único con el que te llamaba con todo mi amor."
  }
];

export default function LoveGames({ media }: LoveGamesProps) {
  const [activeGame, setActiveGame] = useState<"memorama" | "quiz" | "puzzle">("memorama");
  const photos = useMemo(() => media.filter(m => m.type === "image"), [media]);

  // --- MEMORAMA STATE ---
  const [memoCards, setMemoCards] = useState<{ id: string; url: string; uniqueId: number; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [memoMoves, setMemoMoves] = useState(0);
  const [memoWon, setMemoWon] = useState(false);

  // Initialize Memorama
  const startMemorama = () => {
    if (photos.length < 6) return;
    
    // Select 6 random photos
    const shuffledPhotos = [...photos].sort(() => 0.5 - Math.random());
    const selected = shuffledPhotos.slice(0, 6);
    
    // Double them
    const doubled = [...selected, ...selected].map((item, idx) => ({
      id: item.id,
      url: item.url,
      uniqueId: idx,
      isFlipped: false,
      isMatched: false
    }));
    
    // Shuffle the doubled array
    const shuffled = doubled.sort(() => 0.5 - Math.random());
    setMemoCards(shuffled);
    setFlippedIndices([]);
    setMemoMoves(0);
    setMemoWon(false);
    setIsBusy(false);
  };

  useEffect(() => {
    if (activeGame === "memorama" && photos.length >= 6) {
      startMemorama();
    }
  }, [activeGame, photos]);

  const handleCardClick = (index: number) => {
    if (isBusy || memoCards[index].isFlipped || memoCards[index].isMatched) return;

    // Flip card
    const updated = [...memoCards];
    updated[index].isFlipped = true;
    setMemoCards(updated);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsBusy(true);
      setMemoMoves(prev => prev + 1);

      const [firstIdx, secondIdx] = newFlipped;
      if (memoCards[firstIdx].id === memoCards[secondIdx].id) {
        // Match found!
        setTimeout(() => {
          const matched = [...memoCards];
          matched[firstIdx].isMatched = true;
          matched[secondIdx].isMatched = true;
          setMemoCards(matched);
          setFlippedIndices([]);
          setIsBusy(false);

          // Check if all matched
          if (matched.every(c => c.isMatched)) {
            setMemoWon(true);
            fireConfetti();
          }
        }, 600);
      } else {
        // No match, flip back
        setTimeout(() => {
          const reflipped = [...memoCards];
          reflipped[firstIdx].isFlipped = false;
          reflipped[secondIdx].isFlipped = false;
          setMemoCards(reflipped);
          setFlippedIndices([]);
          setIsBusy(false);
        }, 1000);
      }
    }
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#ec4899", "#f472b6", "#a78bfa", "#8b5cf6"]
    });
  };


  // --- QUIZ STATE ---
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setShowAnswerFeedback(false);
    setQuizFinished(false);
  };

  const handleOptionSelect = (optionIdx: number) => {
    if (showAnswerFeedback) return;
    setSelectedOption(optionIdx);
    setShowAnswerFeedback(true);

    if (optionIdx === initialQuestions[currentQIndex].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowAnswerFeedback(false);
    
    if (currentQIndex + 1 < initialQuestions.length) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
      if (quizScore >= 4) {
        fireConfetti();
      }
    }
  };


  // --- SLIDING PUZZLE STATE ---
  const [selectedPuzzlePhoto, setSelectedPuzzlePhoto] = useState<string | null>(null);
  const [puzzleGrid, setPuzzleGrid] = useState<number[]>([]); // Array of indices (0 to 8), 8 is the empty cell
  const [puzzleWon, setPuzzleWon] = useState(false);
  const [puzzleMoves, setPuzzleMoves] = useState(0);

  const selectPuzzlePhoto = (url: string) => {
    setSelectedPuzzlePhoto(url);
    
    // Initialize standard solved grid: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    // Shuffle tiles
    let tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    do {
      tiles = tiles.sort(() => 0.5 - Math.random());
    } while (!isSolvable(tiles)); // Make sure it's solvable
    
    setPuzzleGrid(tiles);
    setPuzzleWon(false);
    setPuzzleMoves(0);
  };

  // 3x3 sliding puzzle solvability algorithm
  const isSolvable = (grid: number[]) => {
    let inversions = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = i + 1; j < 9; j++) {
        if (grid[i] !== 8 && grid[j] !== 8 && grid[i] > grid[j]) {
          inversions++;
        }
      }
    }
    return inversions % 2 === 0;
  };

  const handlePuzzleTileClick = (index: number) => {
    if (puzzleWon) return;

    const emptyIndex = puzzleGrid.indexOf(8);
    const clickRow = Math.floor(index / 3);
    const clickCol = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;

    // Check if clicked tile is adjacent to empty space
    const isAdjacent = 
      (Math.abs(clickRow - emptyRow) === 1 && clickCol === emptyCol) || 
      (Math.abs(clickCol - emptyCol) === 1 && clickRow === emptyRow);

    if (isAdjacent) {
      const updated = [...puzzleGrid];
      // Swap tiles
      updated[emptyIndex] = puzzleGrid[index];
      updated[index] = 8;
      
      setPuzzleGrid(updated);
      setPuzzleMoves(prev => prev + 1);

      // Check win: check if grid matches [0, 1, 2, 3, 4, 5, 6, 7, 8]
      const solved = updated.every((val, idx) => val === idx);
      if (solved) {
        setPuzzleWon(true);
        fireConfetti();
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", minHeight: "80vh" }}>
      {/* Game Selector Bar */}
      <div className="glass" style={{ display: "flex", justifyContent: "center", padding: "8px", gap: "8px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        <button
          onClick={() => setActiveGame("memorama")}
          className="btn-glass"
          style={{ flex: 1, background: activeGame === "memorama" ? "var(--accent)" : "transparent", borderColor: activeGame === "memorama" ? "var(--accent)" : "var(--border-color)", color: activeGame === "memorama" ? "#ffffff" : "inherit" }}
        >
          🧠 Memorama
        </button>
        <button
          onClick={() => setActiveGame("quiz")}
          className="btn-glass"
          style={{ flex: 1, background: activeGame === "quiz" ? "var(--accent)" : "transparent", borderColor: activeGame === "quiz" ? "var(--accent)" : "var(--border-color)", color: activeGame === "quiz" ? "#ffffff" : "inherit" }}
        >
          ❓ Love Quiz
        </button>
        <button
          onClick={() => setActiveGame("puzzle")}
          className="btn-glass"
          style={{ flex: 1, background: activeGame === "puzzle" ? "var(--accent)" : "transparent", borderColor: activeGame === "puzzle" ? "var(--accent)" : "var(--border-color)", color: activeGame === "puzzle" ? "#ffffff" : "inherit" }}
        >
          🧩 Love Puzzle
        </button>
      </div>

      {/* --- MEMORAMA GAME --- */}
      {activeGame === "memorama" && (
        <div className="glass animate-fade" style={{ padding: "32px", maxWidth: "800px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.4rem" }}>Memorama Romántico</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Encuentra las parejas de nuestras fotos favoritas.</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Movimientos: <strong style={{ color: "var(--text-primary)" }}>{memoMoves}</strong></div>
              <button onClick={startMemorama} className="btn-glass" style={{ padding: "6px 12px", fontSize: "0.8rem", marginTop: "6px" }}>
                Reiniciar ⟳
              </button>
            </div>
          </div>

          {photos.length < 6 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p>Debes subir al menos 6 fotos a tu base de datos para poder jugar al Memorama.</p>
            </div>
          ) : (
            <>
              {memoWon && (
                <div className="glass" style={{ padding: "20px", textAlign: "center", background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.3)", animation: "slideUp 0.3s ease" }}>
                  <h4 style={{ color: "var(--success)", fontSize: "1.3rem" }}>¡Ganaste! 🎉</h4>
                  <p style={{ marginTop: "4px", fontSize: "0.9rem" }}>Completaste el juego en {memoMoves} movimientos. ¡Qué gran memoria de nuestros momentos juntos!</p>
                </div>
              )}

              {/* Memory Board */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", maxWidth: "500px", margin: "0 auto", width: "100%" }}>
                {memoCards.map((card, idx) => (
                  <div
                    key={card.uniqueId}
                    onClick={() => handleCardClick(idx)}
                    style={{
                      aspectRatio: "1/1",
                      cursor: "pointer",
                      perspective: "1000px",
                      position: "relative"
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: card.isFlipped || card.isMatched ? "rotateY(180deg)" : "rotateY(0deg)"
                      }}
                    >
                      {/* Card Back */}
                      <div
                        className="glass"
                        style={{
                          position: "absolute",
                          inset: 0,
                          backfaceVisibility: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "2rem",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)"
                        }}
                      >
                        💖
                      </div>
                      
                      {/* Card Front */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                          borderRadius: "16px",
                          overflow: "hidden",
                          border: card.isMatched ? "2px solid var(--success)" : "1px solid var(--border-color)"
                        }}
                      >
                        <img src={card.url} alt="memorama" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* --- QUIZ GAME --- */}
      {activeGame === "quiz" && (
        <div className="glass animate-fade" style={{ padding: "32px", maxWidth: "600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
          {!quizStarted ? (
            <div style={{ textAlign: "center", padding: "40px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "3rem" }}>❓</span>
              <h3 style={{ fontSize: "1.5rem" }}>Trivia de Nuestra Historia</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                ¿Cuánto recuerdas de nuestros detalles favoritos? Responde esta pequeña trivia romántica de 5 preguntas.
              </p>
              <button onClick={startQuiz} className="btn-glass btn-primary" style={{ alignSelf: "center", marginTop: "12px" }}>
                Empezar Quiz
              </button>
            </div>
          ) : quizFinished ? (
            <div style={{ textAlign: "center", padding: "30px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "3rem" }}>🏆</span>
              <h3 style={{ fontSize: "1.6rem" }}>¡Trivia Terminada!</h3>
              <p style={{ fontSize: "1.1rem" }}>Tu puntuación: <strong style={{ color: "var(--accent)" }}>{quizScore} / {initialQuestions.length}</strong></p>
              
              {quizScore >= 4 ? (
                <p style={{ color: "var(--success)" }}>¡Increíble! Conoces nuestra historia a la perfección. Eres super lindo y detallista. 💖</p>
              ) : (
                <p style={{ color: "var(--text-secondary)" }}>Fue un gran intento. ¡Siempre es bonito recordar el inicio de nuestra historia!</p>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
                <button onClick={startQuiz} className="btn-glass btn-primary">
                  Volver a Jugar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Progress */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                <span>Pregunta {currentQIndex + 1} de {initialQuestions.length}</span>
                <span>Aciertos: {quizScore}</span>
              </div>

              {/* Progress bar */}
              <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${((currentQIndex + 1) / initialQuestions.length) * 100}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s ease" }}></div>
              </div>

              {/* Question */}
              <h4 style={{ fontSize: "1.25rem", lineHeight: "1.4" }}>{initialQuestions[currentQIndex].question}</h4>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {initialQuestions[currentQIndex].options.map((option, idx) => {
                  let btnStyle: React.CSSProperties = {
                    width: "100%",
                    textAlign: "left",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    fontSize: "0.95rem"
                  };
                  
                  if (showAnswerFeedback) {
                    if (idx === initialQuestions[currentQIndex].correctAnswer) {
                      // Correct option
                      btnStyle.borderColor = "var(--success)";
                      btnStyle.background = "rgba(16, 185, 129, 0.08)";
                      btnStyle.color = "var(--success)";
                    } else if (idx === selectedOption) {
                      // Wrong clicked option
                      btnStyle.borderColor = "var(--danger)";
                      btnStyle.background = "rgba(239, 68, 68, 0.08)";
                      btnStyle.color = "var(--danger)";
                    } else {
                      btnStyle.opacity = 0.5;
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={showAnswerFeedback}
                      className="input-glass"
                      style={btnStyle}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Feedback explanation */}
              {showAnswerFeedback && (
                <div className="glass animate-slide" style={{ padding: "16px", background: "rgba(255,255,255,0.02)", marginTop: "8px" }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {initialQuestions[currentQIndex].explanation}
                  </p>
                  <button onClick={handleNextQuestion} className="btn-glass btn-primary" style={{ width: "100%", marginTop: "16px", justifyContent: "center" }}>
                    {currentQIndex + 1 === initialQuestions.length ? "Ver Resultados" : "Siguiente Pregunta ➔"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- SLIDING PUZZLE GAME --- */}
      {activeGame === "puzzle" && (
        <div className="glass animate-fade" style={{ padding: "32px", maxWidth: "800px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
          {!selectedPuzzlePhoto ? (
            <div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "8px", textAlign: "center" }}>Rompecabezas de Amor</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textAlign: "center", marginBottom: "20px" }}>
                Elige una fotografía de la galería para convertirla en un rompecabezas deslizable 3x3.
              </p>

              {photos.length === 0 ? (
                <p style={{ textAlign: "center" }}>Aún no hay fotos en tu galería para jugar.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "12px", maxHeight: "300px", overflowY: "auto", padding: "8px" }}>
                  {photos.map(p => (
                    <div
                      key={p.id}
                      onClick={() => selectPuzzlePhoto(p.url)}
                      style={{ aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", cursor: "pointer", border: "1px solid var(--border-color)", transition: "transform 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <img src={p.url} alt="selection" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "340px", alignItems: "center" }}>
                <div>
                  <button onClick={() => setSelectedPuzzlePhoto(null)} style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    🠔 Elegir otra foto
                  </button>
                </div>
                <div style={{ fontSize: "0.85rem" }}>
                  Movimientos: <strong>{puzzleMoves}</strong>
                </div>
              </div>

              {puzzleWon && (
                <div className="glass" style={{ padding: "16px 24px", textAlign: "center", background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.3)", width: "100%", maxWidth: "340px" }}>
                  <h4 style={{ color: "var(--success)" }}>¡Rompecabezas Resuelto! 💖</h4>
                  <p style={{ fontSize: "0.8rem", marginTop: "4px" }}>Lo lograste en {puzzleMoves} movimientos.</p>
                </div>
              )}

              {/* Puzzle Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "2px",
                  width: "100%",
                  maxWidth: "340px",
                  aspectRatio: "1/1",
                  background: "var(--border-color)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "12px",
                  overflow: "hidden"
                }}
              >
                {puzzleGrid.map((value, index) => {
                  if (value === 8) {
                    // Empty Cell
                    return (
                      <div
                        key={index}
                        style={{
                          background: "var(--bg-deep)",
                          width: "100%",
                          height: "100%"
                        }}
                      ></div>
                    );
                  }

                  // Calculate background position of the slice
                  const solvedRow = Math.floor(value / 3);
                  const solvedCol = value % 3;
                  const bgX = (solvedCol / 2) * 100;
                  const bgY = (solvedRow / 2) * 100;

                  return (
                    <div
                      key={index}
                      onClick={() => handlePuzzleTileClick(index)}
                      style={{
                        backgroundImage: `url(${selectedPuzzlePhoto})`,
                        backgroundSize: "300% 300%",
                        backgroundPosition: `${bgX}% ${bgY}%`,
                        width: "100%",
                        height: "100%",
                        cursor: puzzleWon ? "default" : "pointer",
                        boxSizing: "border-box",
                        border: "1px solid rgba(255,255,255,0.05)",
                        transition: "transform 0.1s ease"
                      }}
                    ></div>
                  );
                })}
              </div>

              {!puzzleWon && (
                <button
                  onClick={() => selectPuzzlePhoto(selectedPuzzlePhoto)}
                  className="btn-glass"
                  style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                >
                  Reiniciar Mezcla ⟳
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
