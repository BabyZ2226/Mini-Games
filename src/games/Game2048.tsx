import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, ArrowLeft, Grid3X3, User, Users, ArrowUp, ArrowDown, ArrowRight, ArrowLeft as ArrowLeftIcon } from 'lucide-react';

type GameState = 'START' | 'MODE_SELECT' | 'PLAYING' | 'RESULT' | 'FINAL';
type PlayerMode = '1P' | '2P';

const SIZE = 4;

export default function Game2048({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (score: number) => void; autoStartMode?: PlayerMode }) {
  const [gameState, setGameState] = useState<GameState>(autoStartMode ? 'PLAYING' : 'START');
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || '1P');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [grid, setGrid] = useState<(number | null)[][]>(Array(SIZE).fill(null).map(() => Array(SIZE).fill(null)));
  const [score, setScore] = useState(0);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [highScore1P, setHighScore1P] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('2048_1P_HighScore');
    if (saved) setHighScore1P(parseInt(saved));
  }, []);

  const addRandomTile = useCallback((currentGrid: (number | null)[][]) => {
    const emptyCells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (currentGrid[r][c] === null) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return currentGrid;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = [...currentGrid.map(row => [...row])];
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }, []);

  const resetGame = () => {
    let newGrid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameState('PLAYING');
  };

  const move = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameState !== 'PLAYING') return;

    let newGrid = [...grid.map(row => [...row])];
    let moved = false;
    let currentScore = score;

    const rotateGrid = (g: (number | null)[][]) => {
      const rotated = Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          rotated[c][SIZE - 1 - r] = g[r][c];
        }
      }
      return rotated;
    };

    let rotations = 0;
    if (dir === 'UP') rotations = 1;
    if (dir === 'RIGHT') rotations = 2;
    if (dir === 'DOWN') rotations = 3;

    for (let i = 0; i < rotations; i++) newGrid = rotateGrid(newGrid);

    for (let r = 0; r < SIZE; r++) {
      let row = newGrid[r].filter(v => v !== null) as number[];
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          currentScore += row[i];
          row.splice(i + 1, 1);
          moved = true;
        }
      }
      const newRow = [...row, ...Array(SIZE - row.length).fill(null)];
      if (JSON.stringify(newGrid[r]) !== JSON.stringify(newRow)) moved = true;
      newGrid[r] = newRow;
    }

    for (let i = 0; i < (4 - rotations) % 4; i++) newGrid = rotateGrid(newGrid);

    if (moved) {
      newGrid = addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(currentScore);

      // Check Game Over
      const canMove = (g: (number | null)[][]) => {
        for (let r = 0; r < SIZE; r++) {
          for (let c = 0; c < SIZE; c++) {
            if (g[r][c] === null) return true;
            if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
            if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
          }
        }
        return false;
      };

      if (!canMove(newGrid)) {
        setGameState('RESULT');
      }
    }
  }, [addRandomTile, gameState, grid, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move('UP');
      if (e.key === 'ArrowDown') move('DOWN');
      if (e.key === 'ArrowLeft') move('LEFT');
      if (e.key === 'ArrowRight') move('RIGHT');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

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

  const handleNextAction = () => {
    if (playerMode === '1P') {
      const saved = localStorage.getItem('2048_1P_HighScore');
      if (!saved || score > parseInt(saved)) {
        localStorage.setItem('2048_1P_HighScore', score.toString());
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

  const getTileColor = (val: number | null) => {
    if (val === null) return 'bg-slate-200';
    const colors: { [key: number]: string } = {
      2: 'bg-slate-100 text-slate-800',
      4: 'bg-slate-200 text-slate-800',
      8: 'bg-orange-200 text-slate-800',
      16: 'bg-orange-300 text-white',
      32: 'bg-orange-400 text-white',
      64: 'bg-orange-500 text-white',
      128: 'bg-amber-300 text-white',
      256: 'bg-amber-400 text-white',
      512: 'bg-amber-500 text-white',
      1024: 'bg-amber-600 text-white',
      2048: 'bg-amber-700 text-white',
    };
    return colors[val] || 'bg-slate-800 text-white';
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
        move(dx > 0 ? 'RIGHT' : 'LEFT');
        if ('vibrate' in navigator) navigator.vibrate(5);
      }
    } else {
      if (Math.abs(dy) > 30) {
        move(dy > 0 ? 'DOWN' : 'UP');
        if ('vibrate' in navigator) navigator.vibrate(5);
      }
    }
    setTouchStart(null);
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4 absolute top-0 left-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && !autoStartMode && (
          <motion.div key="start" className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <div className="w-24 h-24 bg-amber-500 rounded-3xl flex items-center justify-center text-white shadow-xl rotate-3">
              <Grid3X3 size={48} />
            </div>
            <h1 className="text-4xl font-black tracking-tight">2048</h1>
            <p className="text-slate-600 max-w-xs">Desliza las fichas para sumarlas y llegar al 2048.</p>
            {highScore1P && <p className="text-sm font-bold text-amber-600 uppercase tracking-widest">Record: {highScore1P}</p>}
            <button onClick={() => setGameState('MODE_SELECT')} className="w-full max-w-xs py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
              Jugar
            </button>
          </motion.div>
        )}

        {gameState === 'MODE_SELECT' && !autoStartMode && (
          <motion.div key="mode" className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Selecciona Modo</h2>
            <button onClick={() => selectMode('1P')} className="w-full max-w-xs p-6 bg-white border-2 rounded-2xl hover:border-amber-500 flex items-center gap-4">
              <User className="text-amber-500" /> <div className="text-left font-bold">1 Jugador</div>
            </button>
            <button onClick={() => selectMode('2P')} className="w-full max-w-xs p-6 bg-white border-2 rounded-2xl hover:border-amber-500 flex items-center gap-4">
              <Users className="text-amber-500" /> <div className="text-left font-bold">2 Jugadores</div>
            </button>
          </motion.div>
        )}

        {(gameState === 'PLAYING' || gameState === 'RESULT') && (
          <motion.div key="playing" className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
            <div className="flex justify-between w-full max-w-[320px] bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase">Puntos</span>
                <span className="text-3xl font-black tabular-nums">{score}</span>
              </div>
              {playerMode === '2P' && (
                <div className={`px-4 py-1 rounded-full text-sm font-bold self-center ${currentPlayer === 1 ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}>
                  P{currentPlayer}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 bg-slate-300 p-3 rounded-2xl shadow-inner w-full max-w-[320px] aspect-square">
              {grid.map((row, r) => row.map((val, c) => (
                <motion.div
                  key={`${r}-${c}-${val}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-full h-full rounded-xl flex items-center justify-center text-2xl font-black shadow-sm ${getTileColor(val)}`}
                >
                  {val}
                </motion.div>
              )))}
            </div>

            {gameState === 'RESULT' && (
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-rose-600 uppercase">¡Sin movimientos!</h2>
                <button onClick={handleNextAction} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 mx-auto">
                  Continuar <ArrowRight size={20} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 w-full max-w-[200px]">
              <div />
              <button onClick={() => move('UP')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center"><ArrowUp /></button>
              <div />
              <button onClick={() => move('LEFT')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center"><ArrowLeftIcon /></button>
              <button onClick={() => move('DOWN')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center"><ArrowDown /></button>
              <button onClick={() => move('RIGHT')} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center"><ArrowRight /></button>
            </div>
          </motion.div>
        )}

        {gameState === 'FINAL' && (
          <motion.div key="final" className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <h2 className="text-3xl font-bold">Resultados Finales</h2>
            {playerMode === '1P' ? (
              <div className="space-y-4">
                <div className="text-7xl font-black text-amber-500">{score}</div>
                <p className="text-xl text-slate-500">¡Excelente partida!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                <div className={`p-6 rounded-2xl border-4 ${player1Score >= player2Score ? 'border-amber-500 bg-amber-50' : 'border-slate-100'}`}>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Jugador 1</div>
                  <div className="text-4xl font-black">{player1Score}</div>
                  {player1Score >= player2Score && <div className="mt-2 text-amber-600 font-bold">GANADOR</div>}
                </div>
                <div className={`p-6 rounded-2xl border-4 ${player2Score >= player1Score ? 'border-amber-500 bg-amber-50' : 'border-slate-100'}`}>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Jugador 2</div>
                  <div className="text-4xl font-black">{player2Score}</div>
                  {player2Score >= player1Score && <div className="mt-2 text-amber-600 font-bold">GANADOR</div>}
                </div>
              </div>
            )}
            {onFinish ? (
              <button onClick={() => onFinish(score)} className="w-full max-w-xs py-4 bg-amber-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-xl">
                <Play size={24} fill="currentColor" /> Continuar Torneo
              </button>
            ) : (
              <button onClick={() => setGameState('MODE_SELECT')} className="w-full max-w-xs py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <RotateCcw size={20} /> Jugar de Nuevo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
