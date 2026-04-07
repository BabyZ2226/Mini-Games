import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Users, Play, RotateCcw, Settings } from 'lucide-react';

type GameState = 'START' | 'MODE_SELECT' | 'PLAYING' | 'GOAL' | 'FINAL';
type PlayerMode = 2 | 4;

interface Vector {
  x: number;
  y: number;
}

interface Entity {
  pos: Vector;
  vel: Vector;
  radius: number;
  mass: number;
  color: string;
  team: 'RED' | 'BLUE' | 'BALL';
}

const CANVAS_WIDTH = 450;
const CANVAS_HEIGHT = 750;
const GOAL_SIZE = 120;
const FRICTION = 0.98;
const BALL_FRICTION = 0.99;
const PLAYER_ACCEL = 0.6;
const MAX_PLAYER_SPEED = 6;
const BALL_RADIUS = 10;
const PLAYER_RADIUS = 18;

export default function HaxBall({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (results: any) => void; autoStartMode?: PlayerMode }) {
  const winScore = autoStartMode ? 2 : 3;
  const [gameState, setGameState] = useState<GameState>(autoStartMode ? 'PLAYING' : 'START');
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || 2);
  const [score, setScore] = useState({ red: 0, blue: 0 });
  const [lastScorer, setLastScorer] = useState<'RED' | 'BLUE' | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  
  const playersRef = useRef<Entity[]>([]);
  const ballRef = useRef<Entity>({
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    radius: BALL_RADIUS,
    mass: 1,
    color: '#ffffff',
    team: 'BALL'
  });

  const keysRef = useRef<Set<string>>(new Set());
  const activeTouchesRef = useRef<{ [key: number]: Vector | null }>({ 0: null, 1: null, 2: null, 3: null });

  const initPlayers = (mode: PlayerMode) => {
    const players: Entity[] = [];
    if (mode === 2) {
      // 1 vs 1 (Red at bottom, Blue at top)
      players.push({
        pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100 },
        vel: { x: 0, y: 0 },
        radius: PLAYER_RADIUS,
        mass: 2,
        color: '#ef4444', // Red
        team: 'RED'
      });
      players.push({
        pos: { x: CANVAS_WIDTH / 2, y: 100 },
        vel: { x: 0, y: 0 },
        radius: PLAYER_RADIUS,
        mass: 2,
        color: '#3b82f6', // Blue
        team: 'BLUE'
      });
    } else {
      // 2 vs 2
      players.push({ pos: { x: CANVAS_WIDTH / 3, y: CANVAS_HEIGHT - 100 }, vel: { x: 0, y: 0 }, radius: PLAYER_RADIUS, mass: 2, color: '#ef4444', team: 'RED' });
      players.push({ pos: { x: (CANVAS_WIDTH / 3) * 2, y: CANVAS_HEIGHT - 100 }, vel: { x: 0, y: 0 }, radius: PLAYER_RADIUS, mass: 2, color: '#ef4444', team: 'RED' });
      players.push({ pos: { x: CANVAS_WIDTH / 3, y: 100 }, vel: { x: 0, y: 0 }, radius: PLAYER_RADIUS, mass: 2, color: '#3b82f6', team: 'BLUE' });
      players.push({ pos: { x: (CANVAS_WIDTH / 3) * 2, y: 100 }, vel: { x: 0, y: 0 }, radius: PLAYER_RADIUS, mass: 2, color: '#3b82f6', team: 'BLUE' });
    }
    playersRef.current = players;
    ballRef.current.pos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    ballRef.current.vel = { x: 0, y: 0 };
  };

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    const players = playersRef.current;
    const ball = ballRef.current;

    // Keyboard Controls (Desktop fallback)
    if (keysRef.current.has('w')) players[0].vel.y -= PLAYER_ACCEL;
    if (keysRef.current.has('s')) players[0].vel.y += PLAYER_ACCEL;
    if (keysRef.current.has('a')) players[0].vel.x -= PLAYER_ACCEL;
    if (keysRef.current.has('d')) players[0].vel.x += PLAYER_ACCEL;

    const blueIdx = playerMode === 2 ? 1 : 2;
    if (keysRef.current.has('ArrowUp')) players[blueIdx].vel.y -= PLAYER_ACCEL;
    if (keysRef.current.has('ArrowDown')) players[blueIdx].vel.y += PLAYER_ACCEL;
    if (keysRef.current.has('ArrowLeft')) players[blueIdx].vel.x -= PLAYER_ACCEL;
    if (keysRef.current.has('ArrowRight')) players[blueIdx].vel.x += PLAYER_ACCEL;

    // Touch Controls
    Object.entries(activeTouchesRef.current).forEach(([idxStr, touchPos]) => {
      const idx = parseInt(idxStr);
      const pos = touchPos as Vector | null;
      if (pos && players[idx]) {
        const p = players[idx];
        const dx = pos.x - p.pos.x;
        const dy = pos.y - p.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          p.vel.x += (dx / dist) * PLAYER_ACCEL;
          p.vel.y += (dy / dist) * PLAYER_ACCEL;
        }
      }
    });

    // Update positions and physics
    players.forEach(p => {
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.vel.x *= FRICTION;
      p.vel.y *= FRICTION;

      const speed = Math.sqrt(p.vel.x ** 2 + p.vel.y ** 2);
      if (speed > MAX_PLAYER_SPEED) {
        p.vel.x = (p.vel.x / speed) * MAX_PLAYER_SPEED;
        p.vel.y = (p.vel.y / speed) * MAX_PLAYER_SPEED;
      }

      if (p.pos.x < p.radius) { p.pos.x = p.radius; p.vel.x = 0; }
      if (p.pos.x > CANVAS_WIDTH - p.radius) { p.pos.x = CANVAS_WIDTH - p.radius; p.vel.x = 0; }
      if (p.pos.y < p.radius) { p.pos.y = p.radius; p.vel.y = 0; }
      if (p.pos.y > CANVAS_HEIGHT - p.radius) { p.pos.y = CANVAS_HEIGHT - p.radius; p.vel.y = 0; }
    });

    ball.pos.x += ball.vel.x;
    ball.pos.y += ball.vel.y;
    ball.vel.x *= BALL_FRICTION;
    ball.vel.y *= BALL_FRICTION;

    // Ball Wall Collisions (Sides)
    if (ball.pos.x < ball.radius || ball.pos.x > CANVAS_WIDTH - ball.radius) {
      ball.vel.x *= -0.8;
      ball.pos.x = ball.pos.x < ball.radius ? ball.radius : CANVAS_WIDTH - ball.radius;
    }

    // Goal detection (Top and Bottom)
    const goalXMin = (CANVAS_WIDTH - GOAL_SIZE) / 2;
    const goalXMax = (CANVAS_WIDTH + GOAL_SIZE) / 2;

    // Top Goal (Blue Goal, Red scores here)
    if (ball.pos.y < ball.radius) {
      if (ball.pos.x > goalXMin && ball.pos.x < goalXMax) {
        setScore(s => ({ ...s, red: s.red + 1 }));
        setLastScorer('RED');
        setGameState('GOAL');
        return;
      } else {
        ball.vel.y *= -0.8;
        ball.pos.y = ball.radius;
      }
    }

    // Bottom Goal (Red Goal, Blue scores here)
    if (ball.pos.y > CANVAS_HEIGHT - ball.radius) {
      if (ball.pos.x > goalXMin && ball.pos.x < goalXMax) {
        setScore(s => ({ ...s, blue: s.blue + 1 }));
        setLastScorer('BLUE');
        setGameState('GOAL');
        return;
      } else {
        ball.vel.y *= -0.8;
        ball.pos.y = CANVAS_HEIGHT - ball.radius;
      }
    }

    // Collisions: Player-Ball
    players.forEach(p => {
      const dx = ball.pos.x - p.pos.x;
      const dy = ball.pos.y - p.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = p.radius + ball.radius;

      if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        const overlap = minDist - dist;
        ball.pos.x += Math.cos(angle) * overlap;
        ball.pos.y += Math.sin(angle) * overlap;

        const nx = dx / dist;
        const ny = dy / dist;
        const p1 = 2 * (p.vel.x * nx + p.vel.y * ny - ball.vel.x * nx - ball.vel.y * ny) / (p.mass + ball.mass);
        
        ball.vel.x += p1 * p.mass * nx;
        ball.vel.y += p1 * p.mass * ny;
        p.vel.x -= p1 * ball.mass * nx;
        p.vel.y -= p1 * ball.mass * ny;

        ball.vel.x += p.vel.x * 0.5;
        ball.vel.y += p.vel.y * 0.5;
        
        if ('vibrate' in navigator) navigator.vibrate(10);
      }
    });

    // Collisions: Player-Player
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];
        const dx = p2.pos.x - p1.pos.x;
        const dy = p2.pos.y - p1.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;

        if (dist < minDist) {
          const angle = Math.atan2(dy, dx);
          const overlap = minDist - dist;
          p1.pos.x -= Math.cos(angle) * overlap / 2;
          p1.pos.y -= Math.sin(angle) * overlap / 2;
          p2.pos.x += Math.cos(angle) * overlap / 2;
          p2.pos.y += Math.sin(angle) * overlap / 2;

          const nx = dx / dist;
          const ny = dy / dist;
          const pVal = 2 * (p1.vel.x * nx + p1.vel.y * ny - p2.vel.x * nx - p2.vel.y * ny) / (p1.mass + p2.mass);
          
          p1.vel.x -= pVal * p2.mass * nx;
          p1.vel.y -= pVal * p2.mass * ny;
          p2.vel.x += pVal * p1.mass * nx;
          p2.vel.y += pVal * p1.mass * ny;
        }
      }
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, playerMode]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1e293b'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT / 2);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    const goalXMin = (CANVAS_WIDTH - GOAL_SIZE) / 2;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; 
    ctx.fillRect(goalXMin, 0, GOAL_SIZE, 10);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; 
    ctx.fillRect(goalXMin, CANVAS_HEIGHT - 10, GOAL_SIZE, 10);

    const ball = ballRef.current;
    ctx.beginPath();
    ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();

    playersRef.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  useEffect(() => {
    if (score.red >= winScore || score.blue >= winScore) {
      setGameState('FINAL');
    }
  }, [score, winScore]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, update]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (autoStartMode) {
      startGame(autoStartMode);
    }
  }, [autoStartMode]);

  const startGame = (mode: PlayerMode) => {
    setPlayerMode(mode);
    setScore({ red: 0, blue: 0 });
    initPlayers(mode);
    setGameState('PLAYING');
  };

  const resetAfterGoal = () => {
    initPlayers(playerMode);
    setGameState('PLAYING');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    Array.from(e.changedTouches).forEach((touch: React.Touch) => {
      const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
      
      let playerIdx = -1;
      if (y > CANVAS_HEIGHT / 2) {
        // Red Team (Bottom)
        if (playerMode === 2) playerIdx = 0;
        else playerIdx = x < CANVAS_WIDTH / 2 ? 0 : 1;
      } else {
        // Blue Team (Top)
        if (playerMode === 2) playerIdx = 1;
        else playerIdx = x < CANVAS_WIDTH / 2 ? 2 : 3;
      }

      if (playerIdx !== -1) {
        activeTouchesRef.current[playerIdx] = { x, y };
      }
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    Array.from(e.touches).forEach((touch: React.Touch) => {
      const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
      
      let playerIdx = -1;
      if (y > CANVAS_HEIGHT / 2) {
        if (playerMode === 2) playerIdx = 0;
        else playerIdx = x < CANVAS_WIDTH / 2 ? 0 : 1;
      } else {
        if (playerMode === 2) playerIdx = 1;
        else playerIdx = x < CANVAS_WIDTH / 2 ? 2 : 3;
      }

      if (playerIdx !== -1) {
        activeTouchesRef.current[playerIdx] = { x, y };
      }
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Simple way: if no touches, clear all
    if (e.touches.length === 0) {
      activeTouchesRef.current = { 0: null, 1: null, 2: null, 3: null };
    } else {
      // Clear quadrants that no longer have touches
      const currentQuadrants = new Set();
      Array.from(e.touches).forEach((t: React.Touch) => {
        const tx = ((t.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
        const ty = ((t.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
        if (ty > CANVAS_HEIGHT / 2) {
          if (playerMode === 2) currentQuadrants.add(0);
          else currentQuadrants.add(tx < CANVAS_WIDTH / 2 ? 0 : 1);
        } else {
          if (playerMode === 2) currentQuadrants.add(1);
          else currentQuadrants.add(tx < CANVAS_WIDTH / 2 ? 2 : 3);
        }
      });
      [0,1,2,3].forEach(i => {
        if (!currentQuadrants.has(i)) activeTouchesRef.current[i] = null;
      });
    }
  };

  return (
    <div className="h-full bg-slate-900 text-white font-sans flex flex-col relative overflow-hidden select-none">
      <div className="p-4 flex justify-between items-center z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium">
          <ArrowLeft size={20} /> Volver
        </button>
        {gameState === 'PLAYING' && (
          <div className="flex gap-4 items-center bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="font-black text-xl">{score.red}</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="font-black text-xl">{score.blue}</span>
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            </div>
          </div>
        )}
        <div className="w-20" />
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && !autoStartMode && (
          <motion.div key="start" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white/20">
              <Trophy size={48} />
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic">HAX-SOCCER</h1>
            <p className="text-slate-400 max-w-xs">Fútbol minimalista. Toca tu campo para mover a tu jugador.</p>
            <button onClick={() => setGameState('MODE_SELECT')} className="w-full max-w-xs py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-500 transition-all shadow-lg text-xl">
              Jugar
            </button>
          </motion.div>
        )}

        {gameState === 'MODE_SELECT' && !autoStartMode && (
          <motion.div key="mode" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <h2 className="text-3xl font-black mb-6">MODO DE JUEGO</h2>
            <button onClick={() => startGame(2)} className="w-full max-w-xs p-6 bg-slate-800 border-2 border-slate-700 rounded-3xl hover:border-green-500 flex items-center gap-6 group transition-all">
              <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Users size={32} />
              </div>
              <div className="text-left">
                <div className="font-black text-xl">1 vs 1</div>
                <div className="text-slate-500 text-sm">Duelo vertical</div>
              </div>
            </button>
            <button onClick={() => startGame(4)} className="w-full max-w-xs p-6 bg-slate-800 border-2 border-slate-700 rounded-3xl hover:border-green-500 flex items-center gap-6 group transition-all">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users size={32} />
              </div>
              <div className="text-left">
                <div className="font-black text-xl">2 vs 2</div>
                <div className="text-slate-500 text-sm">Caos total</div>
              </div>
            </button>
          </motion.div>
        )}

        {(gameState === 'PLAYING' || gameState === 'GOAL') && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center relative p-4">
            <div className="relative w-full max-w-[450px] aspect-[45/75] bg-slate-800 rounded-xl border-4 border-slate-700 shadow-2xl overflow-hidden touch-none">
              <canvas 
                ref={canvasRef} 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT} 
                className="w-full h-full"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
              
              {gameState === 'GOAL' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                  <h2 className="text-8xl font-black italic tracking-tighter text-white drop-shadow-2xl">¡GOL!</h2>
                  <p className={`text-2xl font-bold mt-4 px-6 py-2 rounded-full ${lastScorer === 'RED' ? 'bg-red-500' : 'bg-blue-500'}`}>
                    Equipo {lastScorer === 'RED' ? 'Rojo' : 'Azul'} anota
                  </p>
                  <button onClick={resetAfterGoal} className="mt-8 px-8 py-3 bg-white text-black rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform">
                    <Play size={20} fill="currentColor" /> Continuar
                  </button>
                </motion.div>
              )}
            </div>
            
            <p className="text-slate-500 text-xs mt-4 text-center">Toca en tu mitad de la cancha para mover a tu jugador hacia ese punto.</p>
          </motion.div>
        )}

        {gameState === 'FINAL' && (
          <motion.div key="final" className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <Trophy size={80} className="text-yellow-500" />
            <h2 className="text-4xl font-black">¡FIN DEL PARTIDO!</h2>
            <div className="flex gap-12 items-center">
              <div className="text-center">
                <div className="text-slate-500 font-bold uppercase text-xs mb-2">ROJO</div>
                <div className="text-6xl font-black">{score.red}</div>
              </div>
              <div className="text-4xl font-black text-slate-700">VS</div>
              <div className="text-center">
                <div className="text-slate-500 font-bold uppercase text-xs mb-2">AZUL</div>
                <div className="text-6xl font-black">{score.blue}</div>
              </div>
            </div>
            {onFinish ? (
              <button onClick={() => onFinish({ winnerId: score.red > score.blue ? '1' : '2' })} className="w-full max-w-xs py-4 bg-indigo-600 rounded-2xl font-black flex items-center justify-center gap-2 text-xl shadow-xl">
                <Play size={24} fill="currentColor" /> Continuar Torneo
              </button>
            ) : (
              <button onClick={() => setGameState('MODE_SELECT')} className="w-full max-w-xs py-4 bg-green-600 rounded-2xl font-bold flex items-center justify-center gap-2 text-xl">
                <RotateCcw size={24} /> Revancha
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
