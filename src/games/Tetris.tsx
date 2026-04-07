import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, ArrowLeft, Layout, User, Users, ArrowDown, ArrowRight, ArrowLeft as ArrowLeftIcon, RotateCw } from 'lucide-react';

type GameState = 'START' | 'MODE_SELECT' | 'PLAYING' | 'RESULT' | 'FINAL';
type PlayerMode = '1P' | '2P';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const TETROMINOS = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: 'bg-cyan-400' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: 'bg-blue-500' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: 'bg-orange-500' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: 'bg-green-500' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: 'bg-purple-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: 'bg-red-500' },
};

export default function Tetris({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (score: number) => void; autoStartMode?: PlayerMode }) {
  const [gameState, setGameState] = useState<GameState>(autoStartMode ? 'PLAYING' : 'START');
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || '1P');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [grid, setGrid] = useState<(string | null)[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  const [activePiece, setActivePiece] = useState<{ pos: { x: number, y: number }, type: keyof typeof TETROMINOS, shape: number[][] } | null>(null);
  const [score, setScore] = useState(0);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [highScore1P, setHighScore1P] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);

  const gameLoopRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('Tetris_1P_HighScore');
    if (saved) setHighScore1P(parseInt(saved));
  }, []);

  const spawnPiece = useCallback(() => {
    const keys = Object.keys(TETROMINOS) as (keyof typeof TETROMINOS)[];
    const type = keys[Math.floor(Math.random() * keys.length)];
    const shape = TETROMINOS[type].shape;
    const pos = { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
    
    if (checkCollision(pos, shape, grid)) {
      setGameState('RESULT');
      return null;
    }
    return { pos, type, shape };
  }, [grid]);

  const checkCollision = (pos: { x: number, y: number }, shape: number[][], currentGrid: (string | null)[][]) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && currentGrid[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (shape: number[][]) => {
    const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    return newShape;
  };

  const move = useCallback((dir: { x: number, y: number }) => {
    if (!activePiece || gameState !== 'PLAYING') return;
    const newPos = { x: activePiece.pos.x + dir.x, y: activePiece.pos.y + dir.y };
    if (!checkCollision(newPos, activePiece.shape, grid)) {
      setActivePiece({ ...activePiece, pos: newPos });
      return true;
    }
    if (dir.y > 0) {
      // Lock piece
      const newGrid = [...grid.map(row => [...row])];
      activePiece.shape.forEach((row, y) => {
        row.forEach((val, x) => {
          if (val) {
            const gy = activePiece.pos.y + y;
            const gx = activePiece.pos.x + x;
            if (gy >= 0) newGrid[gy][gx] = TETROMINOS[activePiece.type].color;
          }
        });
      });

      // Clear lines
      let linesCleared = 0;
      const filteredGrid = newGrid.filter(row => !row.every(cell => cell !== null));
      linesCleared = ROWS - filteredGrid.length;
      while (filteredGrid.length < ROWS) {
        filteredGrid.unshift(Array(COLS).fill(null));
      }
      
      if (linesCleared > 0) {
        setScore(s => s + [0, 100, 300, 500, 800][linesCleared] * level);
        setLevel(l => Math.floor(score / 1000) + 1);
      }

      setGrid(filteredGrid);
      const next = spawnPiece();
      if (next) setActivePiece(next);
    }
    return false;
  }, [activePiece, grid, gameState, level, score, spawnPiece]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      const speed = Math.max(50, 500 - (level - 1) * 60);
      gameLoopRef.current = setInterval(() => move({ x: 0, y: 1 }), speed);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, level, move]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft') move({ x: -1, y: 0 });
      if (e.key === 'ArrowRight') move({ x: 1, y: 0 });
      if (e.key === 'ArrowDown') move({ x: 0, y: 1 });
      if (e.key === 'ArrowUp') {
        const newShape = rotate(activePiece!.shape);
        if (!checkCollision(activePiece!.pos, newShape, grid)) {
          setActivePiece({ ...activePiece!, shape: newShape });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePiece, gameState, grid, move]);

  useEffect(() => {
    if (autoStartMode) {
      resetGame();
    }
  }, [autoStartMode]);

  const selectMode = (mode: PlayerMode) => {
    setPlayerMode(mode);
    setCurrentPlayer(1);
    resetGame();
  };

  const resetGame = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setScore(0);
    setLevel(1);
    setGameState('PLAYING');
    const first = spawnPiece();
    if (first) setActivePiece(first);
  };

  const handleNextAction = () => {
    if (playerMode === '1P') {
      const saved = localStorage.getItem('Tetris_1P_HighScore');
      if (!saved || score > parseInt(saved)) {
        localStorage.setItem('Tetris_1P_HighScore', score.toString());
        setHighScore1P(score);
      }
      setGameState('FINAL');
      if (onFinish) onFinish(score);
    } else {
      if (currentPlayer === 1) {
        setPlayer1Score(score);
        setCurrentPlayer(2);
        resetGame();
      } else {
        setPlayer2Score(score);
        setGameState('FINAL');
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || gameState !== 'PLAYING') return;
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        move({ x: dx > 0 ? 1 : -1, y: 0 });
        if ('vibrate' in navigator) navigator.vibrate(5);
      }
    } else {
      if (dy > 30) {
        move({ x: 0, y: 1 });
        if ('vibrate' in navigator) navigator.vibrate(5);
      } else if (dy < -30) {
        const newShape = rotate(activePiece!.shape);
        if (!checkCollision(activePiece!.pos, newShape, grid)) {
          setActivePiece({ ...activePiece!, shape: newShape });
          if ('vibrate' in navigator) navigator.vibrate(10);
        }
      }
    }
    setTouchStart(null);
  };

  return (
    <div 
      className="min-h-screen bg-slate-900 text-white font-sans flex flex-col relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4 absolute top-0 left-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium">
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && !autoStartMode && (
          <motion.div key="start" className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl rotate-12">
              <Layout size={48} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">TETRIS</h1>
            <p className="text-slate-400 max-w-xs">Ordena las piezas para limpiar líneas y sumar puntos.</p>
            {highScore1P && <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Record: {highScore1P}</p>}
            <button onClick={() => setGameState('MODE_SELECT')} className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg">
              Jugar
            </button>
          </motion.div>
        )}

        {gameState === 'MODE_SELECT' && !autoStartMode && (
          <motion.div key="mode" className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Selecciona Modo</h2>
            <button onClick={() => selectMode('1P')} className="w-full max-w-xs p-6 bg-slate-800 border-2 border-slate-700 rounded-2xl hover:border-indigo-500 flex items-center gap-4">
              <User className="text-indigo-400" /> <div className="text-left font-bold">1 Jugador</div>
            </button>
            <button onClick={() => selectMode('2P')} className="w-full max-w-xs p-6 bg-slate-800 border-2 border-slate-700 rounded-2xl hover:border-indigo-500 flex items-center gap-4">
              <Users className="text-indigo-400" /> <div className="text-left font-bold">2 Jugadores</div>
            </button>
          </motion.div>
        )}

        {(gameState === 'PLAYING' || gameState === 'RESULT') && (
          <motion.div key="playing" className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
            <div className="flex justify-between w-full max-w-[300px] bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase">Puntos</span>
                <span className="text-2xl font-black tabular-nums">{score}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-500 uppercase">Nivel</span>
                <span className="text-2xl font-black tabular-nums">{level}</span>
              </div>
            </div>

            <div className="relative bg-slate-800 border-4 border-slate-700 rounded-lg shadow-2xl overflow-hidden" style={{ width: COLS * BLOCK_SIZE, height: ROWS * BLOCK_SIZE }}>
              {grid.map((row, y) => row.map((color, x) => (
                color && <div key={`${x}-${y}`} className={`absolute border border-black/20 ${color}`} style={{ width: BLOCK_SIZE, height: BLOCK_SIZE, left: x * BLOCK_SIZE, top: y * BLOCK_SIZE }} />
              )))}
              {activePiece && activePiece.shape.map((row, y) => row.map((val, x) => (
                val && <div key={`active-${x}-${y}`} className={`absolute border border-black/20 ${TETROMINOS[activePiece.type].color}`} style={{ width: BLOCK_SIZE, height: BLOCK_SIZE, left: (activePiece.pos.x + x) * BLOCK_SIZE, top: (activePiece.pos.y + y) * BLOCK_SIZE }} />
              )))}
            </div>

            {gameState === 'RESULT' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-5xl font-black text-rose-500 mb-4">GAME OVER</h2>
                <div className="text-2xl font-bold mb-8">Puntuación: {score}</div>
                <button onClick={handleNextAction} className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                  Continuar <ArrowRight size={20} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 w-full max-w-[320px]">
              <button onClick={() => move({ x: -1, y: 0 })} className="p-5 bg-slate-800 rounded-2xl flex items-center justify-center active:bg-slate-700 active:scale-90 shadow-lg border-b-4 border-slate-950"><ArrowLeftIcon /></button>
              <button onClick={() => move({ x: 0, y: 1 })} className="p-5 bg-slate-800 rounded-2xl flex items-center justify-center active:bg-slate-700 active:scale-90 shadow-lg border-b-4 border-slate-950"><ArrowDown /></button>
              <button onClick={() => move({ x: 1, y: 0 })} className="p-5 bg-slate-800 rounded-2xl flex items-center justify-center active:bg-slate-700 active:scale-90 shadow-lg border-b-4 border-slate-950"><ArrowRight /></button>
              <button onClick={() => {
                const newShape = rotate(activePiece!.shape);
                if (!checkCollision(activePiece!.pos, newShape, grid)) setActivePiece({ ...activePiece!, shape: newShape });
              }} className="p-5 bg-indigo-600 rounded-2xl flex items-center justify-center active:bg-indigo-500 active:scale-90 shadow-lg border-b-4 border-indigo-900"><RotateCw /></button>
            </div>
          </motion.div>
        )}

        {gameState === 'FINAL' && (
          <motion.div key="final" className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <h2 className="text-3xl font-bold">Resultados Finales</h2>
            {playerMode === '1P' ? (
              <div className="space-y-4">
                <div className="text-7xl font-black text-indigo-500">{score}</div>
                <p className="text-xl text-slate-400">¡Buen intento!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                <div className={`p-6 rounded-2xl border-4 ${player1Score >= player2Score ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800'}`}>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2">Jugador 1</div>
                  <div className="text-4xl font-black">{player1Score}</div>
                  {player1Score >= player2Score && <div className="mt-2 text-indigo-400 font-bold">GANADOR</div>}
                </div>
                <div className={`p-6 rounded-2xl border-4 ${player2Score >= player1Score ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800'}`}>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2">Jugador 2</div>
                  <div className="text-4xl font-black">{player2Score}</div>
                  {player2Score >= player1Score && <div className="mt-2 text-indigo-400 font-bold">GANADOR</div>}
                </div>
              </div>
            )}
            {onFinish ? (
              <button onClick={() => onFinish(score)} className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-xl">
                <Play size={24} fill="currentColor" /> Continuar Torneo
              </button>
            ) : (
              <button onClick={() => setGameState('MODE_SELECT')} className="w-full max-w-xs py-4 bg-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2">
                <RotateCcw size={20} /> Jugar de Nuevo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
