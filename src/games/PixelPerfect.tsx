import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Check, ArrowRight, ArrowLeft, Users, User } from 'lucide-react';

type GameState = 'START' | 'MODE_SELECT' | 'MEMORIZE' | 'RECREATE' | 'RESULT' | 'FINAL';
type PlayerMode = '1P' | '2P';

const generateGrid = (size: number, numActive: number): boolean[][] => {
  const grid = Array(size).fill(false).map(() => Array(size).fill(false));
  let placed = 0;
  while (placed < numActive) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (!grid[r][c]) {
      grid[r][c] = true;
      placed++;
    }
  }
  return grid;
};

const calculateScore = (target: boolean[][], user: boolean[][]): number => {
  let correct = 0;
  let total = 0;
  for (let r = 0; r < target.length; r++) {
    for (let c = 0; c < target[r].length; c++) {
      total++;
      if (target[r][c] === user[r][c]) {
        correct++;
      }
    }
  }
  return (correct / total) * 100;
};

const getFeedbackMessage = (score: number) => {
  if (score === 100) return "¡Píxel Perfecto! Memoria fotográfica.";
  if (score >= 90) return "Casi perfecto, un pequeño desliz.";
  if (score >= 70) return "Buena memoria, pero faltan detalles.";
  if (score >= 50) return "Recordaste la idea general.";
  return "Memoria de pez 🐠";
};

export default function PixelPerfect({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (score: number) => void; autoStartMode?: PlayerMode }) {
  const [gameState, setGameState] = useState<GameState>(autoStartMode ? 'MEMORIZE' : 'START');
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || '1P');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [round, setRound] = useState(1);
  const [gridSize, setGridSize] = useState(3);
  const [targetGrid, setTargetGrid] = useState<boolean[][]>([]);
  const [userGrid, setUserGrid] = useState<boolean[][]>([]);
  const [player1Scores, setPlayer1Scores] = useState<number[]>([]);
  const [player2Scores, setPlayer2Scores] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(3.00);
  const [highScore1P, setHighScore1P] = useState<number | null>(null);
  const [highScore2P, setHighScore2P] = useState<number | null>(null);

  const totalRounds = autoStartMode ? 2 : 5;

  useEffect(() => {
    const saved1P = localStorage.getItem('PixelPerfect_1P_HighScore');
    const saved2P = localStorage.getItem('PixelPerfect_2P_HighScore');
    if (saved1P) setHighScore1P(parseFloat(saved1P));
    if (saved2P) setHighScore2P(parseFloat(saved2P));
  }, []);

  useEffect(() => {
    if (autoStartMode) {
      setPlayerMode(autoStartMode);
      setRound(1);
      setCurrentPlayer(1);
      setPlayer1Scores([]);
      setPlayer2Scores([]);
      startRound(1);
    }
  }, [autoStartMode]);

  const handleStartClick = () => {
    setGameState('MODE_SELECT');
  };

  const selectMode = (mode: PlayerMode) => {
    setPlayerMode(mode);
    setRound(1);
    setCurrentPlayer(1);
    setPlayer1Scores([]);
    setPlayer2Scores([]);
    startRound(1);
  };

  const startRound = (currentRound: number) => {
    const size = 2 + currentRound; 
    const numActive = Math.floor((size * size) * 0.3); 
    
    setGridSize(size);
    setTargetGrid(generateGrid(size, numActive));
    setUserGrid(Array(size).fill(false).map(() => Array(size).fill(false)));
    setGameState('MEMORIZE');
    setTimeLeft(3.00);
  };

  useEffect(() => {
    if (gameState === 'MEMORIZE') {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.05) {
            clearInterval(interval);
            setGameState('RECREATE');
            return 0;
          }
          return prev - 0.05;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  const handleSubmit = () => {
    const score = calculateScore(targetGrid, userGrid);
    if (currentPlayer === 1) {
      setPlayer1Scores([...player1Scores, score]);
    } else {
      setPlayer2Scores([...player2Scores, score]);
    }
    setGameState('RESULT');
  };

  const handleNextAction = () => {
    if (playerMode === '1P') {
      if (round < totalRounds) {
        setRound(round + 1);
        startRound(round + 1);
      } else {
        const avg = getAvgScore([...player1Scores]);
        const saved = localStorage.getItem('PixelPerfect_1P_HighScore');
        if (!saved || avg > parseFloat(saved)) {
          localStorage.setItem('PixelPerfect_1P_HighScore', avg.toString());
          setHighScore1P(avg);
        }
        setGameState('FINAL');
      }
    } else {
      if (currentPlayer === 1) {
        setCurrentPlayer(2);
        startRound(round); // Same round level for both players
      } else {
        if (round < totalRounds) {
          setRound(round + 1);
          setCurrentPlayer(1);
          startRound(round + 1);
        } else {
          const p1Avg = getAvgScore(player1Scores);
          const p2Avg = getAvgScore(player2Scores);
          const bestInSession = Math.max(p1Avg, p2Avg);
          const saved = localStorage.getItem('PixelPerfect_2P_HighScore');
          if (!saved || bestInSession > parseFloat(saved)) {
            localStorage.setItem('PixelPerfect_2P_HighScore', bestInSession.toString());
            setHighScore2P(bestInSession);
          }
          setGameState('FINAL');
        }
      }
    }
  };

  const togglePixel = (r: number, c: number) => {
    if (gameState !== 'RECREATE') return;
    const newGrid = [...userGrid];
    newGrid[r] = [...newGrid[r]];
    newGrid[r][c] = !newGrid[r][c];
    setUserGrid(newGrid);
  };

  const getAvgScore = (scores: number[]) => {
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const p1Avg = getAvgScore(player1Scores);
  const p2Avg = getAvgScore(player2Scores);

  const GridDisplay = ({ grid, interactive = false }: { grid: boolean[][], interactive?: boolean }) => (
    <div 
      className="grid gap-2 bg-gray-200 p-3 rounded-2xl shadow-inner w-full max-w-sm mx-auto"
      style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
    >
      {grid.map((row, r) => 
        row.map((isActive, c) => (
          <motion.div
            key={`${r}-${c}`}
            whileHover={interactive ? { scale: 0.98 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
            onClick={() => {
              if (interactive) {
                togglePixel(r, c);
                if ('vibrate' in navigator) navigator.vibrate(5);
              }
            }}
            className={`aspect-square rounded-lg ${interactive ? 'cursor-pointer shadow-sm' : ''} transition-all duration-150 border-2 ${isActive ? 'bg-emerald-500 border-emerald-400' : 'bg-white border-transparent'}`}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-emerald-50 text-gray-900 font-sans flex flex-col relative">
      {gameState !== 'MEMORIZE' && (
        <div className="p-4 absolute top-0 left-0 z-10">
          <button onClick={onBack} className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-medium">
            <ArrowLeft size={20} /> Volver
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {gameState === 'START' && !autoStartMode && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 space-y-8 text-center"
          >
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto grid grid-cols-3 gap-1 p-2 bg-emerald-100 rounded-2xl transform rotate-3">
                {[1,0,1,0,1,0,1,0,1].map((v, i) => (
                  <div key={i} className={`rounded-sm ${v ? 'bg-emerald-500' : 'bg-white'}`} />
                ))}
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Píxel Perfecto</h1>
              <p className="text-lg text-gray-600">
                Memoria fotográfica. Tienes 3 segundos para memorizar el patrón de la cuadrícula.
              </p>
              {(highScore1P !== null || highScore2P !== null) && (
                <div className="flex justify-center gap-4 text-xs font-bold uppercase tracking-widest text-emerald-600 pt-2">
                  {highScore1P !== null && <span>Mejor 1P: {highScore1P.toFixed(1)}%</span>}
                  {highScore2P !== null && <span>Mejor 2P: {highScore2P.toFixed(1)}%</span>}
                </div>
              )}
            </div>

            <button 
              onClick={handleStartClick}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            >
              <Play size={24} fill="currentColor" />
              Comenzar Juego
            </button>
          </motion.div>
        )}

        {gameState === 'MODE_SELECT' && !autoStartMode && (
          <motion.div 
            key="mode_select"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 space-y-6 text-center"
          >
            <h2 className="text-3xl font-black text-gray-900 mb-4">Selecciona Modo</h2>
            
            <button 
              onClick={() => selectMode('1P')}
              className="w-full p-6 bg-white border-2 border-emerald-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <User size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">1 Jugador</div>
                <div className="text-sm text-gray-500">Práctica tu precisión solo.</div>
              </div>
            </button>

            <button 
              onClick={() => selectMode('2P')}
              className="w-full p-6 bg-white border-2 border-emerald-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">2 Jugadores</div>
                <div className="text-sm text-gray-500">Compite por turnos con un amigo.</div>
              </div>
            </button>
          </motion.div>
        )}

        {gameState === 'MEMORIZE' && (
          <motion.div 
            key="memorize"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-gray-900"
          >
            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
              <div className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full font-medium">
                Nivel {round}/{totalRounds}
              </div>
              {playerMode === '2P' && (
                <div className={`px-4 py-1 rounded-full text-sm font-bold shadow-md ${currentPlayer === 1 ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}>
                  Turno: Jugador {currentPlayer}
                </div>
              )}
            </div>
            
            <div className="w-full max-w-md p-8">
              <GridDisplay grid={targetGrid} />
            </div>

            <div className="mt-8 bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl text-center text-white">
              <div className="text-5xl font-black tabular-nums tracking-tighter">
                {timeLeft.toFixed(2)}s
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'RECREATE' && (
          <motion.div 
            key="recreate"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 space-y-8 pt-16"
          >
            <div className="w-full flex justify-between items-center text-gray-500 font-medium">
              <div className="flex flex-col">
                <span>Nivel {round}/{totalRounds}</span>
                {playerMode === '2P' && (
                  <span className={`text-xs font-bold ${currentPlayer === 1 ? 'text-blue-600' : 'text-rose-600'}`}>
                    Jugador {currentPlayer}
                  </span>
                )}
              </div>
              <span>Dibuja el patrón</span>
            </div>

            <div className="w-full">
              <GridDisplay grid={userGrid} interactive={true} />
            </div>

            <button 
              onClick={handleSubmit}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={24} />
              Comprobar Patrón
            </button>
          </motion.div>
        )}

        {gameState === 'RESULT' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-6 space-y-8 pt-16"
          >
            <div className="text-center space-y-2">
              {playerMode === '2P' && (
                <div className={`text-sm font-bold uppercase tracking-widest mb-2 ${currentPlayer === 1 ? 'text-blue-600' : 'text-rose-600'}`}>
                  Resultado Jugador {currentPlayer}
                </div>
              )}
              <h2 className="text-5xl font-black text-gray-900">
                {(currentPlayer === 1 ? player1Scores[player1Scores.length - 1] : player2Scores[player2Scores.length - 1]).toFixed(1)}%
              </h2>
              <p className="text-xl font-medium text-gray-600">
                {getFeedbackMessage(currentPlayer === 1 ? player1Scores[player1Scores.length - 1] : player2Scores[player2Scores.length - 1])}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl mx-auto">
              <div className="space-y-4">
                <div className="text-center font-semibold text-gray-700">Patrón Original</div>
                <GridDisplay grid={targetGrid} />
              </div>

              <div className="space-y-4">
                <div className="text-center font-semibold text-gray-700">Tu Patrón</div>
                <GridDisplay grid={userGrid} />
              </div>
            </div>

            <button 
              onClick={handleNextAction}
              className="w-full max-w-md py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              {playerMode === '1P' ? (
                round < totalRounds ? <>Siguiente Nivel <ArrowRight size={24} /></> : <>Ver Resultados Finales <ArrowRight size={24} /></>
              ) : (
                currentPlayer === 1 ? <>Turno Jugador 2 <ArrowRight size={24} /></> : (round < totalRounds ? <>Siguiente Nivel <ArrowRight size={24} /></> : <>Ver Resultados Finales <ArrowRight size={24} /></>)
              )}
            </button>
          </motion.div>
        )}

        {gameState === 'FINAL' && (
          <motion.div 
            key="final"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6 space-y-8 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-800">Juego Terminado</h2>

            {playerMode === '1P' ? (
              <div className="space-y-4">
                <p className="text-gray-500">Tu precisión promedio fue de</p>
                <div className="text-6xl font-black text-emerald-600">{p1Avg.toFixed(1)}%</div>
                <p className="text-xl font-medium text-gray-700 mt-4">{getFeedbackMessage(p1Avg)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <div className={`p-8 rounded-3xl border-4 ${p1Avg >= p2Avg ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100 opacity-70'}`}>
                  <div className="text-sm font-bold text-blue-600 uppercase mb-2">Jugador 1</div>
                  <div className="text-5xl font-black text-gray-900 mb-2">{p1Avg.toFixed(1)}%</div>
                  {p1Avg >= p2Avg && <div className="font-bold text-blue-600">🏆 GANADOR</div>}
                </div>
                <div className={`p-8 rounded-3xl border-4 ${p2Avg >= p1Avg ? 'bg-rose-50 border-rose-500' : 'bg-white border-gray-100 opacity-70'}`}>
                  <div className="text-sm font-bold text-rose-600 uppercase mb-2">Jugador 2</div>
                  <div className="text-5xl font-black text-gray-900 mb-2">{p2Avg.toFixed(1)}%</div>
                  {p2Avg >= p1Avg && <div className="font-bold text-rose-600">🏆 GANADOR</div>}
                </div>
              </div>
            )}

        {onFinish ? (
          <button 
            onClick={() => onFinish(Math.round(playerMode === '1P' ? p1Avg : Math.max(p1Avg, p2Avg)))}
            className="w-full max-w-md py-4 bg-emerald-600 text-white rounded-xl font-black text-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-xl"
          >
            <Play size={24} fill="currentColor" />
            Continuar Torneo
          </button>
        ) : (
          <button 
            onClick={() => setGameState('MODE_SELECT')}
            className="w-full max-w-md py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw size={24} />
            Jugar de Nuevo
          </button>
        )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
