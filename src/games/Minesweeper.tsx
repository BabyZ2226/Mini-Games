import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, ArrowLeft, Bomb, Flag, User, Users } from 'lucide-react';

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
};

type GameState = 'START' | 'MODE_SELECT' | 'PLAYING' | 'WON' | 'LOST';
type PlayerMode = '1P' | '2P';

const GRID_SIZE = 10;
const MINE_COUNT = 15;

export default function Minesweeper({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (score: number) => void; autoStartMode?: PlayerMode }) {
  const [gameState, setGameState] = useState<GameState>(autoStartMode ? 'PLAYING' : 'START');
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || '1P');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [minesLeft, setMinesLeft] = useState(MINE_COUNT);
  const [highScore1P, setHighScore1P] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const [flagMode, setFlagMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('Minesweeper_1P_BestTime');
    if (saved) setHighScore1P(parseInt(saved));
  }, []);

  useEffect(() => {
    let interval: any;
    if (gameState === 'PLAYING') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const initGrid = useCallback(() => {
    const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborCount: 0,
      }))
    );

    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborCount = count;
        }
      }
    }
    setGrid(newGrid);
    setMinesLeft(MINE_COUNT);
    setTimer(0);
  }, []);

  useEffect(() => {
    if (autoStartMode) {
      setPlayerMode(autoStartMode);
      setCurrentPlayer(1);
      initGrid();
      setGameState('PLAYING');
    }
  }, [autoStartMode, initGrid]);

  const selectMode = (mode: PlayerMode) => {
    setPlayerMode(mode);
    setCurrentPlayer(1);
    initGrid();
    setGameState('PLAYING');
  };

  const revealCell = (r: number, c: number) => {
    if (gameState !== 'PLAYING' || grid[r][c].isRevealed || grid[r][c].isFlagged) return;

    const newGrid = [...grid.map(row => [...row])];
    if (newGrid[r][c].isMine) {
      // Game Over
      newGrid.forEach(row => row.forEach(cell => { if (cell.isMine) cell.isRevealed = true; }));
      setGrid(newGrid);
      setGameState('LOST');
      return;
    }

    const floodFill = (row: number, col: number) => {
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE || newGrid[row][col].isRevealed || newGrid[row][col].isFlagged) return;
      newGrid[row][col].isRevealed = true;
      if (newGrid[row][col].neighborCount === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) floodFill(row + dr, col + dc);
          }
        }
      }
    };

    if (flagMode) {
      toggleFlagInternal(newGrid, r, c);
    } else {
      floodFill(r, c);
    }
    setGrid(newGrid);

    // Check Win
    const unrevealedSafe = newGrid.flat().filter(cell => !cell.isMine && !cell.isRevealed).length;
    if (unrevealedSafe === 0) {
      setGameState('WON');
      if (playerMode === '1P') {
        const saved = localStorage.getItem('Minesweeper_1P_BestTime');
        if (!saved || timer < parseInt(saved)) {
          localStorage.setItem('Minesweeper_1P_BestTime', timer.toString());
          setHighScore1P(timer);
        }
      }
    }
  };

  const toggleFlagInternal = (currentGrid: Cell[][], r: number, c: number) => {
    if (currentGrid[r][c].isRevealed) return;
    currentGrid[r][c].isFlagged = !currentGrid[r][c].isFlagged;
    setMinesLeft(prev => currentGrid[r][c].isFlagged ? prev - 1 : prev + 1);
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const toggleFlag = (e: React.MouseEvent | React.TouchEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState !== 'PLAYING' || grid[r][c].isRevealed) return;
    const newGrid = [...grid.map(row => [...row])];
    toggleFlagInternal(newGrid, r, c);
    setGrid(newGrid);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col relative">
      <div className="p-4 absolute top-0 left-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && !autoStartMode && (
          <motion.div key="start" className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center text-white shadow-xl">
              <Bomb size={48} />
            </div>
            <h1 className="text-4xl font-black">Buscaminas</h1>
            <p className="text-slate-600 max-w-xs">Limpia el campo sin detonar ninguna mina. ¡Usa la lógica!</p>
            {highScore1P && <p className="text-sm font-bold text-slate-500 uppercase">Mejor Tiempo: {highScore1P}s</p>}
            <button onClick={() => setGameState('MODE_SELECT')} className="w-full max-w-xs py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
              Jugar
            </button>
          </motion.div>
        )}

        {gameState === 'MODE_SELECT' && !autoStartMode && (
          <motion.div key="mode" className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Selecciona Modo</h2>
            <button onClick={() => selectMode('1P')} className="w-full max-w-xs p-6 bg-white border-2 rounded-2xl hover:border-slate-500 flex items-center gap-4">
              <User className="text-slate-500" /> <div className="text-left font-bold">1 Jugador</div>
            </button>
            <button onClick={() => selectMode('2P')} className="w-full max-w-xs p-6 bg-white border-2 rounded-2xl hover:border-slate-500 flex items-center gap-4">
              <Users className="text-slate-500" /> <div className="text-left font-bold">2 Jugadores</div>
            </button>
          </motion.div>
        )}

        {(gameState === 'PLAYING' || gameState === 'WON' || gameState === 'LOST') && (
          <motion.div key="playing" className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
            <div className="flex justify-between w-full max-w-xs bg-white p-4 rounded-2xl shadow-sm border border-slate-200 font-mono font-bold text-xl">
              <div className="flex items-center gap-2 text-rose-500"><Bomb size={20}/> {minesLeft}</div>
              <button 
                onClick={() => setFlagMode(!flagMode)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${flagMode ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                <Flag size={20} />
                <span className="text-xs uppercase font-black">{flagMode ? 'ON' : 'OFF'}</span>
              </button>
              <div className="flex items-center gap-2 text-slate-500">{timer}s</div>
            </div>

            <div className="grid grid-cols-10 gap-1 bg-slate-300 p-1 rounded-xl shadow-inner border-4 border-slate-300">
              {grid.map((row, r) => row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => revealCell(r, c)}
                  onContextMenu={(e) => toggleFlag(e, r, c)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md font-black text-lg transition-all ${
                    cell.isRevealed 
                      ? 'bg-slate-50 shadow-none' 
                      : 'bg-slate-400 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.2),inset_2px_2px_0px_rgba(255,255,255,0.4)] active:scale-90'
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? <Bomb size={18} className="text-slate-900" /> : (cell.neighborCount > 0 ? (
                      <span className={
                        cell.neighborCount === 1 ? 'text-blue-600' :
                        cell.neighborCount === 2 ? 'text-green-600' :
                        cell.neighborCount === 3 ? 'text-red-600' :
                        cell.neighborCount === 4 ? 'text-purple-600' :
                        'text-rose-800'
                      }>{cell.neighborCount}</span>
                    ) : '')
                  ) : (
                    cell.isFlagged ? <Flag size={18} className="text-rose-500 fill-rose-500" /> : ''
                  )}
                </button>
              )))}
            </div>

            {gameState !== 'PLAYING' && (
              <div className="text-center space-y-4">
                <h2 className={`text-3xl font-black ${gameState === 'WON' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {gameState === 'WON' ? '¡VICTORIA!' : '¡BOOM! PERDISTE'}
                </h2>
                {onFinish ? (
                  <button onClick={() => onFinish(gameState === 'WON' ? Math.max(1, 1000 - timer) : 0)} className="px-12 py-4 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 mx-auto hover:bg-indigo-500 transition-all shadow-xl">
                    <Play size={24} fill="currentColor" /> Continuar Torneo
                  </button>
                ) : (
                  <button onClick={() => setGameState('MODE_SELECT')} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 mx-auto">
                    <RotateCcw size={20} /> Reintentar
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
