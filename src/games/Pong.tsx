import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, ArrowLeft, User, Users, ArrowUp, ArrowDown } from 'lucide-react';

type GameState = 'START' | 'MODE_SELECT' | 'PLAYING' | 'RESULT';
type PlayerMode = '1P' | '2P';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 12;

export default function Pong({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (results: any) => void; autoStartMode?: PlayerMode }) {
  const winScore = autoStartMode ? 3 : 5;
  const [gameState, setGameState] = useState<GameState>(autoStartMode ? 'PLAYING' : 'START');
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || '1P');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const p1Pos = useRef(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
  const p2Pos = useRef(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
  const ball = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 4, dy: 4 });
  const keys = useRef<{ [key: string]: boolean | number }>({});

  const resetBall = useCallback(() => {
    ball.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: (Math.random() * 2 - 1) * 5,
      dy: (Math.random() > 0.5 ? 1 : -1) * 5
    };
  }, []);

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    // Move paddles (Keyboard)
    if (keys.current['a']) p1Pos.current = Math.max(0, p1Pos.current - 7);
    if (keys.current['d']) p1Pos.current = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, p1Pos.current + 7);

    if (playerMode === '2P') {
      if (keys.current['ArrowLeft']) p2Pos.current = Math.max(0, p2Pos.current - 7);
      if (keys.current['ArrowRight']) p2Pos.current = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, p2Pos.current + 7);
    } else {
      // AI
      const aiSpeed = 5;
      const target = ball.current.x - PADDLE_WIDTH / 2;
      if (p2Pos.current < target) p2Pos.current += aiSpeed;
      if (p2Pos.current > target) p2Pos.current -= aiSpeed;
      p2Pos.current = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, p2Pos.current));
    }

    // Touch controls
    if (keys.current['touchP1']) {
      p1Pos.current = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, (keys.current['touchP1X'] as number) - PADDLE_WIDTH / 2));
    }
    if (playerMode === '2P' && keys.current['touchP2']) {
      p2Pos.current = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, (keys.current['touchP2X'] as number) - PADDLE_WIDTH / 2));
    }

    // Move ball
    ball.current.x += ball.current.dx;
    ball.current.y += ball.current.dy;

    // Side wall bounce
    if (ball.current.x <= 0 || ball.current.x >= CANVAS_WIDTH - BALL_SIZE) {
      ball.current.dx *= -1;
      if ('vibrate' in navigator) navigator.vibrate(5);
    }

    // Paddle bounce (Bottom - P1)
    if (
      ball.current.y + BALL_SIZE >= CANVAS_HEIGHT - PADDLE_HEIGHT &&
      ball.current.x + BALL_SIZE >= p1Pos.current &&
      ball.current.x <= p1Pos.current + PADDLE_WIDTH
    ) {
      ball.current.dy = -(Math.abs(ball.current.dy) + 0.5);
      ball.current.dx += (Math.random() - 0.5) * 3;
      if ('vibrate' in navigator) navigator.vibrate(10);
    }

    // Paddle bounce (Top - P2)
    if (
      ball.current.y <= PADDLE_HEIGHT &&
      ball.current.x + BALL_SIZE >= p2Pos.current &&
      ball.current.x <= p2Pos.current + PADDLE_WIDTH
    ) {
      ball.current.dy = Math.abs(ball.current.dy) + 0.5;
      ball.current.dx += (Math.random() - 0.5) * 3;
      if ('vibrate' in navigator) navigator.vibrate(10);
    }

    // Score
    if (ball.current.y <= 0) {
      // P1 scores (bottom player scores on top goal)
      setScores(s => ({ ...s, p1: s.p1 + 1 }));
      resetBall();
    } else if (ball.current.y >= CANVAS_HEIGHT) {
      // P2 scores (top player scores on bottom goal)
      setScores(s => ({ ...s, p2: s.p2 + 1 }));
      resetBall();
    }

    // Draw
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#ffffff';
      // Center line (Horizontal)
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
      ctx.strokeStyle = '#ffffff44';
      ctx.stroke();

      // Paddles (Top and Bottom)
      ctx.fillRect(p2Pos.current, 0, PADDLE_WIDTH, PADDLE_HEIGHT); // P2 Top
      ctx.fillRect(p1Pos.current, CANVAS_HEIGHT - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT); // P1 Bottom

      // Ball
      ctx.fillRect(ball.current.x, ball.current.y, BALL_SIZE, BALL_SIZE);
    }

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, playerMode, resetBall]);

  useEffect(() => {
    if (scores.p1 >= winScore) {
      setWinner(1);
      setGameState('RESULT');
    } else if (scores.p2 >= winScore) {
      setWinner(2);
      setGameState('RESULT');
    }
  }, [scores.p1, scores.p2, winScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current[e.key] = true;
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.key] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  useEffect(() => {
    if (autoStartMode) {
      selectMode(autoStartMode);
    }
  }, [autoStartMode]);

  const selectMode = (mode: PlayerMode) => {
    setPlayerMode(mode);
    setScores({ p1: 0, p2: 0 });
    setWinner(null);
    resetBall();
    setGameState('PLAYING');
  };

  const handleTouch = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    const scaleX = CANVAS_WIDTH / rect.width;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      if (y > CANVAS_HEIGHT / 2) {
        keys.current['touchP1'] = true;
        keys.current['touchP1X'] = x;
      } else {
        keys.current['touchP2'] = true;
        keys.current['touchP2X'] = x;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      keys.current['touchP1'] = false;
      keys.current['touchP2'] = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col relative overflow-hidden select-none">
      <div className="p-4 absolute top-0 left-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium">
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && !autoStartMode && (
          <motion.div key="start" className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-slate-900 shadow-xl">
              <div className="w-12 h-12 border-4 border-slate-900 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-900 rounded-full" />
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-widest uppercase">PONG VERTICAL</h1>
            <p className="text-slate-400 max-w-xs">El clásico duelo de raquetas, ahora en formato vertical para tu móvil.</p>
            <button onClick={() => setGameState('MODE_SELECT')} className="w-full max-w-xs py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-lg">
              Jugar
            </button>
          </motion.div>
        )}

        {gameState === 'MODE_SELECT' && !autoStartMode && (
          <motion.div key="mode" className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Selecciona Modo</h2>
            <button onClick={() => selectMode('1P')} className="w-full max-w-xs p-6 bg-slate-800 border-2 border-slate-700 rounded-2xl hover:border-white flex items-center gap-4">
              <User className="text-white" /> <div className="text-left font-bold">1 Jugador (vs CPU)</div>
            </button>
            <button onClick={() => selectMode('2P')} className="w-full max-w-xs p-6 bg-slate-800 border-2 border-slate-700 rounded-2xl hover:border-white flex items-center gap-4">
              <Users className="text-white" /> <div className="text-left font-bold">2 Jugadores (Local)</div>
            </button>
          </motion.div>
        )}

        {(gameState === 'PLAYING' || gameState === 'RESULT') && (
          <motion.div key="playing" className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
            <div className="flex flex-col items-center justify-center w-full max-w-[450px] relative">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-6xl font-black tabular-nums opacity-20 pointer-events-none">
                {scores.p2}
              </div>
              <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-6xl font-black tabular-nums opacity-20 pointer-events-none">
                {scores.p1}
              </div>

              <div 
                className="relative border-4 border-white/20 rounded-xl overflow-hidden shadow-2xl touch-none"
                onTouchStart={handleTouch}
                onTouchMove={handleTouch}
                onTouchEnd={handleTouchEnd}
              >
                <canvas 
                  ref={canvasRef} 
                  width={CANVAS_WIDTH} 
                  height={CANVAS_HEIGHT} 
                  className="max-w-full h-auto max-h-[70vh]"
                />
                
                {gameState === 'RESULT' && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                    <h2 className="text-5xl font-black text-white mb-4 italic">¡FIN!</h2>
                    <div className="text-2xl font-bold mb-8 text-indigo-400">
                      {playerMode === '1P' 
                        ? (winner === 1 ? '¡GANASTE!' : 'LA CPU GANÓ') 
                        : `¡JUGADOR ${winner} GANÓ!`}
                    </div>
                    {onFinish ? (
                      <button onClick={() => onFinish({ winnerId: winner?.toString() })} className="px-12 py-4 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 mx-auto hover:bg-indigo-500 transition-all shadow-xl">
                        <Play size={24} fill="currentColor" /> Continuar Torneo
                      </button>
                    ) : (
                      <button onClick={() => setGameState('MODE_SELECT')} className="px-12 py-4 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-slate-200 transition-all">
                        <RotateCcw size={20} /> Jugar de Nuevo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
              Desliza horizontalmente en tu mitad para mover la raqueta
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
