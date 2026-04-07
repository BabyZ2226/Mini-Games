import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Check, ArrowRight, ArrowLeft, Users, User } from 'lucide-react';

type ColorHSL = { h: number; s: number; l: number };
type GameState = 'START' | 'MODE_SELECT' | 'MEMORIZE' | 'RECREATE' | 'RESULT' | 'FINAL';
type PlayerMode = '1P' | '2P';

const generateRandomColor = (): ColorHSL => ({
  h: Math.floor(Math.random() * 360),
  s: Math.floor(Math.random() * 60) + 20,
  l: Math.floor(Math.random() * 60) + 20,
});

const hslToString = (c: ColorHSL) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`;

const calculateScore = (target: ColorHSL, user: ColorHSL): number => {
  let hDiff = Math.abs(target.h - user.h);
  if (hDiff > 180) hDiff = 360 - hDiff;
  const hScore = Math.max(0, 100 - (hDiff / 180) * 100);

  const sDiff = Math.abs(target.s - user.s);
  const sScore = Math.max(0, 100 - (sDiff / 100) * 100);

  const lDiff = Math.abs(target.l - user.l);
  const lScore = Math.max(0, 100 - (lDiff / 100) * 100);

  return (hScore * 0.5) + (sScore * 0.2) + (lScore * 0.3);
};

const getFeedbackMessage = (score: number) => {
  if (score >= 95) return "¡Precisión inquietante! ¿Eres un robot?";
  if (score >= 85) return "¡Excelente ojo! Casi perfecto.";
  if (score >= 70) return "Bastante bien, pero puedes mejorar.";
  if (score >= 50) return "Mmm... te falta práctica.";
  return "¡Cómprate unas gafas! Eso no se parece en nada.";
};

export default function ColorMemory({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (score: number) => void; autoStartMode?: PlayerMode }) {
  const [gameState, setGameState] = useState<GameState>(autoStartMode ? 'MEMORIZE' : 'START');
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || '1P');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [round, setRound] = useState(1);
  const [targetColor, setTargetColor] = useState<ColorHSL>({ h: 0, s: 0, l: 0 });
  const [userColor, setUserColor] = useState<ColorHSL>({ h: 180, s: 50, l: 50 });
  const [player1Scores, setPlayer1Scores] = useState<number[]>([]);
  const [player2Scores, setPlayer2Scores] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(5.00);
  const [highScore1P, setHighScore1P] = useState<number | null>(null);
  const [highScore2P, setHighScore2P] = useState<number | null>(null);
  const [isVibrating, setIsVibrating] = useState(false);

  const totalRounds = autoStartMode ? 2 : 5;

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 100);
  };

  useEffect(() => {
    const saved1P = localStorage.getItem('ColorMemory_1P_HighScore');
    const saved2P = localStorage.getItem('ColorMemory_2P_HighScore');
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
      setTargetColor(generateRandomColor());
      setUserColor({ h: 180, s: 50, l: 50 });
      setGameState('MEMORIZE');
      setTimeLeft(5.00);
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
    setTargetColor(generateRandomColor());
    setUserColor({ h: 180, s: 50, l: 50 });
    setGameState('MEMORIZE');
    setTimeLeft(5.00);
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
    const score = calculateScore(targetColor, userColor);
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
        startRound();
      } else {
        const avg = getAvgScore([...player1Scores]);
        const saved = localStorage.getItem('ColorMemory_1P_HighScore');
        if (!saved || avg > parseFloat(saved)) {
          localStorage.setItem('ColorMemory_1P_HighScore', avg.toString());
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
          const bestInSession = Math.max(p1Avg, p2Avg);
          const saved = localStorage.getItem('ColorMemory_2P_HighScore');
          if (!saved || bestInSession > parseFloat(saved)) {
            localStorage.setItem('ColorMemory_2P_HighScore', bestInSession.toString());
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col relative">
      {gameState !== 'MEMORIZE' && (
        <div className="p-4 absolute top-0 left-0 z-10">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
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
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-3xl shadow-xl transform rotate-12" />
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Color Memory</h1>
              <p className="text-lg text-gray-600">
                Pon a prueba tu memoria visual. Memoriza el color y trata de recrearlo usando los controles deslizantes.
              </p>
              {(highScore1P !== null || highScore2P !== null) && (
                <div className="flex justify-center gap-4 text-xs font-bold uppercase tracking-widest text-indigo-500 pt-2">
                  {highScore1P !== null && <span>Mejor 1P: {highScore1P.toFixed(1)}%</span>}
                  {highScore2P !== null && <span>Mejor 2P: {highScore2P.toFixed(1)}%</span>}
                </div>
              )}
            </div>

            <button 
              onClick={handleStartClick}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
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
              className="w-full p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <User size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">1 Jugador</div>
                <div className="text-sm text-gray-500">Práctica tu precisión solo.</div>
              </div>
            </button>

            <button 
              onClick={() => selectMode('2P')}
              className="w-full p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
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
            className="fixed inset-0 flex flex-col items-center justify-center z-50"
            style={{ backgroundColor: hslToString(targetColor) }}
          >
            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
              <div className="bg-black/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-medium">
                Ronda {round}/{totalRounds}
              </div>
              {playerMode === '2P' && (
                <div className={`px-4 py-1 rounded-full text-sm font-bold shadow-md ${currentPlayer === 1 ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}>
                  Turno: Jugador {currentPlayer}
                </div>
              )}
            </div>
            
            <div className="bg-black/30 backdrop-blur-md p-8 rounded-3xl text-center text-white shadow-2xl">
              <div className="text-7xl font-black tabular-nums tracking-tighter mb-2">
                {timeLeft.toFixed(2)}
              </div>
              <div className="text-xl font-medium opacity-90">
                Segundos para memorizar
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
            className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 space-y-8"
          >
            <div className="w-full flex justify-between items-center text-gray-500 font-medium">
              <div className="flex flex-col">
                <span>Ronda {round}/{totalRounds}</span>
                {playerMode === '2P' && (
                  <span className={`text-xs font-bold ${currentPlayer === 1 ? 'text-blue-600' : 'text-rose-600'}`}>
                    Jugador {currentPlayer}
                  </span>
                )}
              </div>
              <span>Recrea el color</span>
            </div>

            <div 
              className="w-full h-48 rounded-2xl shadow-inner border-4 border-white transition-colors duration-100"
              style={{ backgroundColor: hslToString(userColor) }}
            />

            <div className="w-full space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <span>Tono (Hue)</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{userColor.h}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="360" 
                  value={userColor.h}
                  onChange={(e) => {
                    setUserColor({ ...userColor, h: parseInt(e.target.value) });
                    triggerHaptic();
                  }}
                  className="color-slider h-10 w-full accent-gray-900"
                  style={{ 
                    background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' 
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <span>Saturación</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{userColor.s}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={userColor.s}
                  onChange={(e) => {
                    setUserColor({ ...userColor, s: parseInt(e.target.value) });
                    triggerHaptic();
                  }}
                  className="color-slider h-10 w-full accent-gray-900"
                  style={{ 
                    background: `linear-gradient(to right, hsl(${userColor.h}, 0%, ${userColor.l}%), hsl(${userColor.h}, 100%, ${userColor.l}%))` 
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <span>Luminosidad</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{userColor.l}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={userColor.l}
                  onChange={(e) => {
                    setUserColor({ ...userColor, l: parseInt(e.target.value) });
                    triggerHaptic();
                  }}
                  className="color-slider h-10 w-full accent-gray-900"
                  style={{ 
                    background: `linear-gradient(to right, hsl(${userColor.h}, ${userColor.s}%, 0%), hsl(${userColor.h}, ${userColor.s}%, 50%), hsl(${userColor.h}, ${userColor.s}%, 100%))` 
                  }}
                />
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={24} />
              Evaluar Color
            </button>
          </motion.div>
        )}

        {gameState === 'RESULT' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6 space-y-8"
          >
            <div className="text-center space-y-2">
              {playerMode === '2P' && (
                <div className={`text-sm font-bold uppercase tracking-widest mb-2 ${currentPlayer === 1 ? 'text-blue-600' : 'text-rose-600'}`}>
                  Resultado Jugador {currentPlayer}
                </div>
              )}
              <h2 className="text-5xl font-black text-gray-900">
                {(currentPlayer === 1 ? player1Scores[player1Scores.length - 1] : player2Scores[player2Scores.length - 1]).toFixed(2)}%
              </h2>
              <p className="text-xl font-medium text-gray-600">
                {getFeedbackMessage(currentPlayer === 1 ? player1Scores[player1Scores.length - 1] : player2Scores[player2Scores.length - 1])}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-4">
                <div className="text-center font-semibold text-gray-700">Color Original</div>
                <div 
                  className="w-full h-48 rounded-2xl shadow-lg border-4 border-white"
                  style={{ backgroundColor: hslToString(targetColor) }}
                />
                <div className="bg-white p-4 rounded-xl text-center font-mono text-sm text-gray-600 shadow-sm border border-gray-100">
                  H: {targetColor.h}° S: {targetColor.s}% L: {targetColor.l}%
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center font-semibold text-gray-700">Tu Color</div>
                <div 
                  className="w-full h-48 rounded-2xl shadow-lg border-4 border-white"
                  style={{ backgroundColor: hslToString(userColor) }}
                />
                <div className="bg-white p-4 rounded-xl text-center font-mono text-sm text-gray-600 shadow-sm border border-gray-100">
                  H: {userColor.h}° S: {userColor.s}% L: {userColor.l}%
                </div>
              </div>
            </div>

            <button 
              onClick={handleNextAction}
              className="w-full max-w-md py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
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
                <p className="text-gray-500">Tu precisión promedio fue de</p>
                <div className="text-6xl font-black text-gray-900">{p1Avg.toFixed(2)}%</div>
                <p className="text-xl font-medium text-indigo-600 mt-4">{getFeedbackMessage(p1Avg)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <div className={`p-8 rounded-3xl border-4 ${p1Avg >= p2Avg ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100 opacity-70'}`}>
                  <div className="text-sm font-bold text-blue-600 uppercase mb-2">Jugador 1</div>
                  <div className="text-5xl font-black text-gray-900 mb-2">{p1Avg.toFixed(2)}%</div>
                  {p1Avg >= p2Avg && <div className="font-bold text-blue-600">🏆 GANADOR</div>}
                </div>
                <div className={`p-8 rounded-3xl border-4 ${p2Avg >= p1Avg ? 'bg-rose-50 border-rose-500' : 'bg-white border-gray-100 opacity-70'}`}>
                  <div className="text-sm font-bold text-rose-600 uppercase mb-2">Jugador 2</div>
                  <div className="text-5xl font-black text-gray-900 mb-2">{p2Avg.toFixed(2)}%</div>
                  {p2Avg >= p1Avg && <div className="font-bold text-rose-600">🏆 GANADOR</div>}
                </div>
              </div>
            )}

        {onFinish ? (
          <button 
            onClick={() => onFinish(Math.round(playerMode === '1P' ? p1Avg : Math.max(p1Avg, p2Avg)))}
            className="w-full max-w-md py-4 bg-indigo-600 text-white rounded-xl font-black text-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-xl"
          >
            <Play size={24} fill="currentColor" />
            Continuar Torneo
          </button>
        ) : (
          <button 
            onClick={() => setGameState('MODE_SELECT')}
            className="w-full max-w-md py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
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
