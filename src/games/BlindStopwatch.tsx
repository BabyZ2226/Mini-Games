import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, ArrowRight, ArrowLeft, Clock, Users, User } from 'lucide-react';

type GameState = 'START' | 'MODE_SELECT' | 'READY' | 'PLAYING' | 'RESULT' | 'FINAL';
type PlayerMode = '1P' | '2P';

const getFeedbackMessage = (diff: number) => {
  if (diff <= 50) return "¡Increíble! Eres un reloj humano ⏱️";
  if (diff <= 200) return "¡Muy preciso! Casi exacto.";
  if (diff <= 500) return "Buen cálculo, pero se puede mejorar.";
  if (diff <= 1000) return "Un poco desfasado.";
  return "Tu reloj interno necesita baterías nuevas.";
};

export default function BlindStopwatch({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (score: number) => void; autoStartMode?: PlayerMode }) {
  const [gameState, setGameState] = useState<GameState>(autoStartMode ? 'READY' : 'START');
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || '1P');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [round, setRound] = useState(1);
  const [targetTime, setTargetTime] = useState(0);
  const [userTime, setUserTime] = useState(0);
  const [player1Scores, setPlayer1Scores] = useState<number[]>([]);
  const [player2Scores, setPlayer2Scores] = useState<number[]>([]);
  const [highScore1P, setHighScore1P] = useState<number | null>(null);
  const [highScore2P, setHighScore2P] = useState<number | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const totalRounds = autoStartMode ? 2 : 5;

  useEffect(() => {
    const saved1P = localStorage.getItem('BlindStopwatch_1P_HighScore');
    const saved2P = localStorage.getItem('BlindStopwatch_2P_HighScore');
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
      const target = Math.floor(Math.random() * 6000) + 2000;
      setTargetTime(target);
      setGameState('READY');
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
    startRound();
  };

  const startRound = () => {
    const target = Math.floor(Math.random() * 6000) + 2000;
    setTargetTime(target);
    setGameState('READY');
  };

  const handlePointerDown = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'READY') return;
    if (e.cancelable) e.preventDefault();
    
    startTimeRef.current = Date.now();
    setGameState('PLAYING');
  };

  const handlePointerUp = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    if (e.cancelable) e.preventDefault();

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    setUserTime(duration);
    
    const diff = Math.abs(targetTime - duration);
    if (currentPlayer === 1) {
      setPlayer1Scores([...player1Scores, diff]);
    } else {
      setPlayer2Scores([...player2Scores, diff]);
    }
    setGameState('RESULT');
  };

  const handleNextAction = () => {
    if (playerMode === '1P') {
      if (round < totalRounds) {
        setRound(round + 1);
        startRound();
      } else {
        const avg = getAvgScore([...player1Scores]);
        const saved = localStorage.getItem('BlindStopwatch_1P_HighScore');
        if (!saved || avg < parseFloat(saved)) {
          localStorage.setItem('BlindStopwatch_1P_HighScore', avg.toString());
          setHighScore1P(avg);
        }
        setGameState('FINAL');
      }
    } else {
      if (currentPlayer === 1) {
        setCurrentPlayer(2);
        startRound();
      } else {
        if (round < totalRounds) {
          setRound(round + 1);
          setCurrentPlayer(1);
          startRound();
        } else {
          const p1Avg = getAvgScore(player1Scores);
          const p2Avg = getAvgScore(player2Scores);
          const bestInSession = Math.min(p1Avg, p2Avg);
          const saved = localStorage.getItem('BlindStopwatch_2P_HighScore');
          if (!saved || bestInSession < parseFloat(saved)) {
            localStorage.setItem('BlindStopwatch_2P_HighScore', bestInSession.toString());
            setHighScore2P(bestInSession);
          }
          setGameState('FINAL');
        }
      }
    }
  };

  const getAvgScore = (scores: number[]) => {
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const p1Avg = getAvgScore(player1Scores);
  const p2Avg = getAvgScore(player2Scores);

  return (
    <div className="min-h-screen bg-rose-50 text-gray-900 font-sans flex flex-col select-none relative">
      {gameState !== 'PLAYING' && (
        <div className="p-4 absolute top-0 left-0 z-10">
          <button onClick={onBack} className="flex items-center gap-2 text-rose-700 hover:text-rose-900 font-medium">
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
              <div className="w-24 h-24 mx-auto bg-rose-500 rounded-full shadow-xl flex items-center justify-center text-white">
                <Clock size={48} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Cronómetro Ciego</h1>
              <p className="text-lg text-gray-600">
                Pon a prueba tu percepción del tiempo. Mantén presionado el botón y suéltalo cuando creas que ha pasado el tiempo exacto.
              </p>
              {(highScore1P !== null || highScore2P !== null) && (
                <div className="flex justify-center gap-4 text-xs font-bold uppercase tracking-widest text-rose-500 pt-2">
                  {highScore1P !== null && <span>Mejor 1P: {Math.round(highScore1P)}ms</span>}
                  {highScore2P !== null && <span>Mejor 2P: {Math.round(highScore2P)}ms</span>}
                </div>
              )}
            </div>

            <button 
              onClick={handleStartClick}
              className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-lg hover:bg-rose-700 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
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
              className="w-full p-6 bg-white border-2 border-rose-100 rounded-2xl hover:border-rose-500 hover:bg-rose-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <User size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">1 Jugador</div>
                <div className="text-sm text-gray-500">Práctica tu precisión solo.</div>
              </div>
            </button>

            <button 
              onClick={() => selectMode('2P')}
              className="w-full p-6 bg-white border-2 border-rose-100 rounded-2xl hover:border-rose-500 hover:bg-rose-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">2 Jugadores</div>
                <div className="text-sm text-gray-500">Compite por turnos con un amigo.</div>
              </div>
            </button>
          </motion.div>
        )}

        {(gameState === 'READY' || gameState === 'PLAYING') && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex-1 flex flex-col items-center justify-center w-full p-6 transition-colors duration-500 ${gameState === 'PLAYING' ? 'bg-rose-600' : 'bg-rose-50'}`}
          >
            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
              <div className={`px-4 py-2 rounded-full font-medium ${gameState === 'PLAYING' ? 'bg-black/20 text-white' : 'bg-rose-200 text-rose-800'}`}>
                Ronda {round}/{totalRounds}
              </div>
              {playerMode === '2P' && (
                <div className={`px-4 py-1 rounded-full text-sm font-bold shadow-md ${currentPlayer === 1 ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}>
                  Turno: Jugador {currentPlayer}
                </div>
              )}
            </div>
            
            <div className={`text-center mb-12 ${gameState === 'PLAYING' ? 'text-white' : 'text-gray-900'}`}>
              <h2 className="text-2xl font-medium opacity-80 mb-2">Objetivo</h2>
              <div className="text-7xl font-black tabular-nums tracking-tighter">
                {(targetTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div 
              className="w-full max-w-sm aspect-square relative"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
            >
              <motion.div 
                animate={gameState === 'PLAYING' ? { 
                  scale: [1, 0.95, 1],
                  transition: { repeat: Infinity, duration: 0.5 }
                } : { scale: 1 }}
                className={`w-full h-full rounded-full flex items-center justify-center shadow-2xl cursor-pointer select-none touch-none transition-colors duration-300 ${gameState === 'PLAYING' ? 'bg-rose-400 shadow-inner' : 'bg-rose-500 hover:bg-rose-400'}`}
              >
                <div className="text-center">
                  <span className="text-white font-black text-3xl block mb-2">
                    {gameState === 'PLAYING' ? '¡SUELTA!' : 'MANTÉN'}
                  </span>
                  <span className="text-white/60 text-sm font-bold uppercase tracking-widest">
                    {gameState === 'PLAYING' ? 'YA PASÓ?' : 'PRESIONADO'}
                  </span>
                </div>
              </motion.div>
              
              {gameState === 'PLAYING' && (
                <>
                  <motion.div 
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 rounded-full border-4 border-white pointer-events-none"
                  />
                  <motion.div 
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                    className="absolute inset-0 rounded-full border-2 border-white pointer-events-none"
                  />
                </>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'RESULT' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 space-y-8 pt-16 text-center"
          >
            <div className="space-y-2">
              {playerMode === '2P' && (
                <div className={`text-sm font-bold uppercase tracking-widest mb-2 ${currentPlayer === 1 ? 'text-blue-600' : 'text-rose-600'}`}>
                  Resultado Jugador {currentPlayer}
                </div>
              )}
              <h2 className="text-2xl font-medium text-gray-500">Diferencia</h2>
              <div className="text-6xl font-black text-gray-900">
                {Math.abs(targetTime - userTime)}<span className="text-3xl text-gray-500">ms</span>
              </div>
              <p className="text-xl font-medium text-rose-600">{getFeedbackMessage(Math.abs(targetTime - userTime))}</p>
            </div>

            <div className="w-full bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-rose-100">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-gray-500">Objetivo</span>
                <span className="font-mono font-bold text-xl">{(targetTime / 1000).toFixed(3)}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tu Tiempo</span>
                <span className={`font-mono font-bold text-xl ${userTime > targetTime ? 'text-red-500' : userTime < targetTime ? 'text-blue-500' : 'text-green-500'}`}>
                  {(userTime / 1000).toFixed(3)}s
                </span>
              </div>
              <div className="text-sm text-gray-400 text-right">
                {userTime > targetTime ? 'Te pasaste por ' : 'Te faltaron '}
                {Math.abs(targetTime - userTime)}ms
              </div>
            </div>

            <button 
              onClick={handleNextAction}
              className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
            >
              {playerMode === '1P' ? (
                round < totalRounds ? <>Siguiente Ronda <ArrowRight size={24} /></> : <>Ver Resultados Finales <ArrowRight size={24} /></>
              ) : (
                currentPlayer === 1 ? <>Turno Jugador 2 <ArrowRight size={24} /></> : (round < totalRounds ? <>Siguiente Ronda <ArrowRight size={24} /></> : <>Ver Resultados Finales <ArrowRight size={24} /></>)
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
                <p className="text-gray-500">Tu error promedio fue de</p>
                <div className="text-6xl font-black text-rose-600">
                  {Math.round(p1Avg)}<span className="text-3xl">ms</span>
                </div>
                <p className="text-xl font-medium text-gray-700 mt-4">{getFeedbackMessage(p1Avg)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <div className={`p-8 rounded-3xl border-4 ${p1Avg <= p2Avg ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100 opacity-70'}`}>
                  <div className="text-sm font-bold text-blue-600 uppercase mb-2">Jugador 1</div>
                  <div className="text-5xl font-black text-gray-900 mb-2">{Math.round(p1Avg)}ms</div>
                  {p1Avg <= p2Avg && <div className="font-bold text-blue-600">🏆 GANADOR</div>}
                </div>
                <div className={`p-8 rounded-3xl border-4 ${p2Avg <= p1Avg ? 'bg-rose-50 border-rose-500' : 'bg-white border-gray-100 opacity-70'}`}>
                  <div className="text-sm font-bold text-rose-600 uppercase mb-2">Jugador 2</div>
                  <div className="text-5xl font-black text-gray-900 mb-2">{Math.round(p2Avg)}ms</div>
                  {p2Avg <= p1Avg && <div className="font-bold text-rose-600">🏆 GANADOR</div>}
                </div>
              </div>
            )}

        {onFinish ? (
          <button 
            onClick={() => onFinish(Math.round(playerMode === '1P' ? p1Avg : Math.min(p1Avg, p2Avg)))}
            className="w-full max-w-md py-4 bg-rose-600 text-white rounded-xl font-black text-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-xl"
          >
            <Play size={24} fill="currentColor" />
            Continuar Torneo
          </button>
        ) : (
          <button 
            onClick={() => setGameState('MODE_SELECT')}
            className="w-full max-w-md py-4 bg-rose-600 text-white rounded-xl font-bold text-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
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
