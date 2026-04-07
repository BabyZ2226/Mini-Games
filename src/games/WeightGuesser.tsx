import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, ArrowRight, ArrowLeft, Scale, Users, User } from 'lucide-react';

type GameState = 'START' | 'MODE_SELECT' | 'PLAYING' | 'RESULT' | 'FINAL';
type PlayerMode = '1P' | '2P';

type GameObject = {
  id: string;
  name: string;
  weight: number; // in kg
  emoji: string;
  position?: { top: string; left: string };
};

const OBJECT_DATABASE: GameObject[] = [
  // Very Light (< 100g)
  { id: '21', name: 'Huevo', weight: 0.06, emoji: '🥚' },
  { id: '22', name: 'Llaves', weight: 0.08, emoji: '🔑' },
  { id: '25', name: 'Gafas', weight: 0.05, emoji: '👓' },
  { id: '26', name: 'Reloj', weight: 0.07, emoji: '⌚' },
  { id: '27', name: 'Lápiz', weight: 0.01, emoji: '✏️' },
  { id: '28', name: 'Carta', weight: 0.02, emoji: '✉️' },
  { id: '29', name: 'Ratón de PC', weight: 0.09, emoji: '🖱️' },
  { id: '61', name: 'Anillo', weight: 0.015, emoji: '💍' },
  { id: '62', name: 'Moneda', weight: 0.008, emoji: '🪙' },

  // Light (100g - 500g)
  { id: '1', name: 'Manzana', weight: 0.15, emoji: '🍎' },
  { id: '30', name: 'Naranja', weight: 0.20, emoji: '🍊' },
  { id: '31', name: 'Plátano', weight: 0.12, emoji: '🍌' },
  { id: '16', name: 'Smartphone', weight: 0.20, emoji: '📱' },
  { id: '32', name: 'Control remoto', weight: 0.15, emoji: '🎛️' },
  { id: '12', name: 'Taza vacía', weight: 0.35, emoji: '☕' },
  { id: '33', name: 'Taza llena', weight: 0.60, emoji: '☕' },
  { id: '11', name: 'Zapatilla', weight: 0.30, emoji: '👟' },
  { id: '34', name: 'Billetera', weight: 0.12, emoji: '👛' },
  { id: '15', name: 'Oso de peluche', weight: 0.40, emoji: '🧸' },
  { id: '35', name: 'Lata de refresco', weight: 0.35, emoji: '🥫' },
  { id: '36', name: 'Mando de consola', weight: 0.25, emoji: '🎮' },
  { id: '37', name: 'Hamburguesa', weight: 0.25, emoji: '🍔' },
  { id: '38', name: 'Porción de pizza', weight: 0.15, emoji: '🍕' },
  { id: '63', name: 'Gorra', weight: 0.11, emoji: '🧢' },

  // Medium-Light (500g - 2kg)
  { id: '2', name: 'Libro', weight: 0.80, emoji: '📖' },
  { id: '39', name: 'Diccionario', weight: 1.50, emoji: '📚' },
  { id: '40', name: 'Botella de agua 1L', weight: 1.05, emoji: '💧' },
  { id: '42', name: 'Secador de pelo', weight: 0.80, emoji: '💨' },
  { id: '44', name: 'Sartén', weight: 1.10, emoji: '🍳' },
  { id: '45', name: 'Cámara', weight: 0.90, emoji: '📷' },
  { id: '46', name: 'Prismáticos', weight: 0.75, emoji: '🔭' },
  { id: '64', name: 'Paraguas', weight: 0.50, emoji: '☂️' },
  { id: '65', name: 'Balón de fútbol', weight: 0.45, emoji: '⚽' },
  { id: '66', name: 'Balón de basket', weight: 0.62, emoji: '🏀' },

  // Medium (2kg - 10kg)
  { id: '3', name: 'Laptop ligera', weight: 1.30, emoji: '💻' },
  { id: '47', name: 'Laptop gamer', weight: 2.80, emoji: '💻' },
  { id: '8', name: 'Guitarra acústica', weight: 2.00, emoji: '🎸' },
  { id: '17', name: 'Patineta', weight: 2.50, emoji: '🛹' },
  { id: '18', name: 'Ladrillo', weight: 2.20, emoji: '🧱' },
  { id: '10', name: 'Maceta pequeña', weight: 1.50, emoji: '🪴' },
  { id: '49', name: 'Maceta grande', weight: 4.50, emoji: '🪴' },
  { id: '4', name: 'Gato', weight: 4.50, emoji: '🐈' },
  { id: '23', name: 'Perro pequeño', weight: 7.00, emoji: '🐶' },
  { id: '5', name: 'Sandía', weight: 6.00, emoji: '🍉' },
  { id: '50', name: 'Melón', weight: 3.00, emoji: '🍈' },
  { id: '7', name: 'Silla', weight: 5.00, emoji: '🪑' },
  { id: '13', name: 'Mochila llena', weight: 6.50, emoji: '🎒' },
  { id: '14', name: 'Bola de bolos', weight: 6.80, emoji: '🎳' },
  { id: '51', name: 'Monitor', weight: 4.00, emoji: '🖥️' },
  { id: '53', name: 'Extintor', weight: 8.50, emoji: '🧯' },
  { id: '67', name: 'Bebé', weight: 5.50, emoji: '👶' },

  // Heavy (10kg - 50kg)
  { id: '6', name: 'Bicicleta', weight: 12.00, emoji: '🚲' },
  { id: '19', name: 'Neumático', weight: 10.00, emoji: '🚗' },
  { id: '24', name: 'Microondas', weight: 11.00, emoji: '📻' },
  { id: '9', name: 'Televisor', weight: 15.00, emoji: '📺' },
  { id: '54', name: 'Silla de oficina', weight: 14.00, emoji: '💺' },
  { id: '55', name: 'Perro grande', weight: 30.00, emoji: '🐕' },
  { id: '20', name: 'Sofá', weight: 40.00, emoji: '🛋️' },
  { id: '56', name: 'Batería de coche', weight: 18.00, emoji: '🔋' },
  { id: '57', name: 'Maleta llena', weight: 20.00, emoji: '🧳' },
  { id: '58', name: 'Inodoro', weight: 25.00, emoji: '🚽' },
  { id: '60', name: 'Caja fuerte', weight: 35.00, emoji: '🏦' },
];

const generateSpawnPoints = (count: number) => {
  const points = [];
  const cols = 7;
  const rows = 5;
  const validCells = [];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 && c <= 1) continue;
      if (r >= 1 && r <= 3 && c >= 2 && c <= 4) continue;
      validCells.push({ r, c });
    }
  }
  
  validCells.sort(() => 0.5 - Math.random());
  const selectedCells = validCells.slice(0, count);
  
  return selectedCells.map(cell => {
    const cellWidth = 100 / cols;
    const cellHeight = 100 / rows;
    const jitterX = (Math.random() * 0.6 + 0.2) * cellWidth;
    const jitterY = (Math.random() * 0.6 + 0.2) * cellHeight;
    return {
      left: `${(cell.c * cellWidth) + jitterX}%`,
      top: `${(cell.r * cellHeight) + jitterY}%`
    };
  });
};

const formatWeight = (weight: number) => {
  if (weight < 1) {
    return `${Math.round(weight * 1000)} g`;
  }
  return `${weight.toFixed(1)} kg`;
};

const calculateScore = (target: number, user: number): number => {
  const diff = Math.abs(target - user);
  const score = Math.max(0, 100 - (diff / target) * 100);
  return score;
};

const getFeedbackMessage = (score: number) => {
  if (score === 100) return "¡Peso exacto! Eres una balanza humana ⚖️";
  if (score >= 90) return "¡Casi perfecto! Por muy poco.";
  if (score >= 70) return "Buena estimación, bastante cerca.";
  if (score >= 50) return "Algo lejos, pero no está mal.";
  return "Necesitas calibrar tu sentido del peso.";
};

export default function WeightGuesser({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (score: number) => void; autoStartMode?: PlayerMode }) {
  const [gameState, setGameState] = useState<GameState>(autoStartMode ? 'PLAYING' : 'START');
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || '1P');
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [round, setRound] = useState(1);
  const [targetWeight, setTargetWeight] = useState(0);
  const [roomObjects, setRoomObjects] = useState<GameObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<GameObject | null>(null);
  const [player1Scores, setPlayer1Scores] = useState<number[]>([]);
  const [player2Scores, setPlayer2Scores] = useState<number[]>([]);
  const [highScore1P, setHighScore1P] = useState<number | null>(null);
  const [highScore2P, setHighScore2P] = useState<number | null>(null);

  const totalRounds = autoStartMode ? 2 : 5;
  const objectsPerRound = 15;

  useEffect(() => {
    const saved1P = localStorage.getItem('WeightGuesser_1P_HighScore');
    const saved2P = localStorage.getItem('WeightGuesser_2P_HighScore');
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
      startRound();
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
    const targetObj = OBJECT_DATABASE[Math.floor(Math.random() * OBJECT_DATABASE.length)];
    const sortedByWeightDiff = [...OBJECT_DATABASE]
      .filter(obj => obj.id !== targetObj.id)
      .sort((a, b) => Math.abs(a.weight - targetObj.weight) - Math.abs(b.weight - targetObj.weight));
    
    const closestObjects = sortedByWeightDiff.slice(0, 8);
    const remainingObjects = sortedByWeightDiff.slice(8).sort(() => 0.5 - Math.random());
    const randomObjects = remainingObjects.slice(0, objectsPerRound - 1 - 8);
    const roundObjects = [targetObj, ...closestObjects, ...randomObjects].sort(() => 0.5 - Math.random());
    
    const spawnPoints = generateSpawnPoints(roundObjects.length);
    const selected = roundObjects.map((obj, idx) => ({
      ...obj,
      position: spawnPoints[idx]
    }));
    
    setRoomObjects(selected);
    setTargetWeight(targetObj.weight);
    setSelectedObject(null);
    setGameState('PLAYING');
  };

  const handleSelectObject = (obj: GameObject) => {
    setSelectedObject(obj);
    const score = calculateScore(targetWeight, obj.weight);
    
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
        const saved = localStorage.getItem('WeightGuesser_1P_HighScore');
        if (!saved || avg > parseFloat(saved)) {
          localStorage.setItem('WeightGuesser_1P_HighScore', avg.toString());
          setHighScore1P(avg);
        }
        setGameState('FINAL');
      }
    } else {
      // 2 Player Mode Logic
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
          const saved = localStorage.getItem('WeightGuesser_2P_HighScore');
          if (!saved || bestInSession > parseFloat(saved)) {
            localStorage.setItem('WeightGuesser_2P_HighScore', bestInSession.toString());
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
    <div className="min-h-screen bg-amber-50 text-gray-900 font-sans flex flex-col relative">
      <div className="p-4 absolute top-0 left-0 z-30">
        <button 
          onClick={onBack} 
          className={`flex items-center gap-2 font-medium transition-colors ${
            gameState === 'PLAYING' 
              ? 'text-white drop-shadow-md hover:text-gray-200 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm' 
              : 'text-amber-700 hover:text-amber-900'
          }`}
        >
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

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
              <div className="w-24 h-24 mx-auto bg-amber-500 rounded-2xl shadow-xl flex items-center justify-center text-white transform rotate-3">
                <Scale size={48} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">El Peso Exacto</h1>
              <p className="text-lg text-gray-600">
                La balanza marca un peso objetivo. Busca en la habitación el objeto que más se acerque a ese peso.
              </p>
              {(highScore1P !== null || highScore2P !== null) && (
                <div className="flex justify-center gap-4 text-xs font-bold uppercase tracking-widest text-amber-600 pt-2">
                  {highScore1P !== null && <span>Mejor 1P: {highScore1P.toFixed(1)}%</span>}
                  {highScore2P !== null && <span>Mejor 2P: {highScore2P.toFixed(1)}%</span>}
                </div>
              )}
            </div>

            <button 
              onClick={handleStartClick}
              className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
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
              className="w-full p-6 bg-white border-2 border-amber-200 rounded-2xl hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <User size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">1 Jugador</div>
                <div className="text-sm text-gray-500">Práctica tu precisión solo.</div>
              </div>
            </button>

            <button 
              onClick={() => selectMode('2P')}
              className="w-full p-6 bg-white border-2 border-amber-200 rounded-2xl hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">2 Jugadores</div>
                <div className="text-sm text-gray-500">Compite por turnos con un amigo.</div>
              </div>
            </button>
          </motion.div>
        )}

        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 relative w-full h-full overflow-hidden bg-gray-900"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80)' }}
            />
            
            <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-20">
               <div className="bg-black/40 backdrop-blur-md text-white px-6 py-2 rounded-full font-medium shadow-lg border border-white/10">
                 Ronda {round}/{totalRounds}
               </div>
               {playerMode === '2P' && (
                 <motion.div 
                   initial={{ y: -10, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className={`px-4 py-1 rounded-full text-sm font-bold shadow-md ${currentPlayer === 1 ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}
                 >
                   Turno: Jugador {currentPlayer}
                 </motion.div>
               )}
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-4 border-amber-300 flex flex-col items-center pointer-events-auto transform hover:scale-105 transition-transform">
                <Scale size={48} className="text-amber-500 mb-2" />
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Peso Objetivo</div>
                <div className="text-5xl font-black text-gray-900 tabular-nums">
                  {formatWeight(targetWeight)}
                </div>
              </div>
            </div>

            {roomObjects.map((obj) => (
              <div 
                key={obj.id}
                className="absolute z-20"
                style={{ 
                  top: obj.position?.top, 
                  left: obj.position?.left,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.3, rotate: [-10, 10, -10, 0] }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    handleSelectObject(obj);
                    if ('vibrate' in navigator) navigator.vibrate(10);
                  }}
                  className="text-6xl md:text-7xl cursor-pointer transition-all duration-200 p-4"
                  style={{ filter: 'drop-shadow(0px 12px 10px rgba(0,0,0,0.7))' }}
                >
                  {obj.emoji}
                </motion.button>
              </div>
            ))}
          </motion.div>
        )}

        {gameState === 'RESULT' && selectedObject && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6 space-y-8 pt-16"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-gray-100 flex flex-col items-center justify-center space-y-2">
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Objetivo</div>
                <Scale size={32} className="text-amber-400 mb-2" />
                <div className="text-4xl font-black text-gray-900">{formatWeight(targetWeight)}</div>
              </div>

              <div className={`bg-white rounded-3xl p-6 shadow-sm border-4 flex flex-col items-center justify-center space-y-2 ${ (currentPlayer === 1 ? player1Scores[player1Scores.length - 1] : player2Scores[player2Scores.length - 1]) === 100 ? 'border-green-400' : 'border-amber-200'}`}>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tu Elección</div>
                <span className="text-5xl mb-2 filter drop-shadow-md">{selectedObject.emoji}</span>
                <div className="text-xl font-bold text-gray-700">{selectedObject.name}</div>
                <div className="text-3xl font-black text-amber-600">{formatWeight(selectedObject.weight)}</div>
              </div>
            </div>

            <button 
              onClick={handleNextAction}
              className="w-full max-w-md py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
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
            <h2 className="text-3xl font-black text-gray-900">Juego Terminado</h2>

            {playerMode === '1P' ? (
              <div className="space-y-4">
                <p className="text-gray-500">Tu precisión promedio fue de</p>
                <div className="text-7xl font-black text-amber-600">{p1Avg.toFixed(1)}%</div>
                <p className="text-xl font-medium text-gray-700">{getFeedbackMessage(p1Avg)}</p>
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
            className="w-full max-w-md py-4 bg-amber-600 text-white rounded-xl font-black text-xl hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-xl"
          >
            <Play size={24} fill="currentColor" />
            Continuar Torneo
          </button>
        ) : (
          <button 
            onClick={() => setGameState('MODE_SELECT')}
            className="w-full max-w-md py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
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
