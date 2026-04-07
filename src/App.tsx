import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Grid3X3, Clock, Scale, Bomb, Keyboard, Layout, Target, Trophy } from 'lucide-react';
import ColorMemory from './games/ColorMemory';
import PixelPerfect from './games/PixelPerfect';
import BlindStopwatch from './games/BlindStopwatch';
import WeightGuesser from './games/WeightGuesser';
import Minesweeper from './games/Minesweeper';
import Wordle from './games/Wordle';
import Tetris from './games/Tetris';
import Game2048 from './games/Game2048';
import Pong from './games/Pong';
import HaxBall from './games/HaxBall';
import Tournament, { TournamentPlayer } from './components/Tournament';

type GameType = 'MENU' | 'COLOR' | 'PIXEL' | 'STOPWATCH' | 'WEIGHT' | 'MINESWEEPER' | 'WORDLE' | 'TETRIS' | '2048' | 'PONG' | 'HAX' | 'TOURNAMENT';

export default function App() {
  const [currentGame, setCurrentGame] = useState<GameType>('MENU');
  const [tournamentState, setTournamentState] = useState<{
    gameId: string;
    autoStartMode: any;
    onFinish: (results: any) => void;
  } | null>(null);

  // Tournament Persistent State
  const [tournamentStep, setTournamentStep] = useState<any>('SETUP');
  const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayer[]>([
    { id: '1', name: 'Jugador 1', score: 0 },
    { id: '2', name: 'Jugador 2', score: 0 },
  ]);
  const [tournamentSelectedGames, setTournamentSelectedGames] = useState<string[]>([]);
  const [tournamentCurrentGameIndex, setTournamentCurrentGameIndex] = useState(0);
  const [tournamentCurrentPlayerIndex, setTournamentCurrentPlayerIndex] = useState(0);
  const [tournamentRoundResults, setTournamentRoundResults] = useState<{ [playerId: string]: number }>({});

  const categories = [
    {
      name: 'Originales',
      games: [
        { id: 'COLOR' as GameType, title: 'Color Memory', description: 'HSL Perception', icon: <Palette size={24} className="text-pink-500" />, color: 'bg-pink-50 border-pink-200' },
        { id: 'PIXEL' as GameType, title: 'Píxel Perfecto', description: 'Grid Memory', icon: <Grid3X3 size={24} className="text-emerald-500" />, color: 'bg-emerald-50 border-emerald-200' },
        { id: 'STOPWATCH' as GameType, title: 'Cronómetro Ciego', description: 'Time Perception', icon: <Clock size={24} className="text-rose-500" />, color: 'bg-rose-50 border-rose-200' },
        { id: 'WEIGHT' as GameType, title: 'El Peso Exacto', description: 'Weight Estimation', icon: <Scale size={24} className="text-amber-500" />, color: 'bg-amber-50 border-amber-200' },
      ]
    },
    {
      name: 'Clásicos de Lógica',
      games: [
        { id: 'MINESWEEPER' as GameType, title: 'Buscaminas', description: 'Lógica y Probabilidad', icon: <Bomb size={24} className="text-slate-600" />, color: 'bg-slate-50 border-slate-200' },
        { id: 'WORDLE' as GameType, title: 'Wordle', description: 'Adivina la Palabra', icon: <Keyboard size={24} className="text-emerald-600" />, color: 'bg-emerald-50 border-emerald-200' },
        { id: 'TETRIS' as GameType, title: 'Tetris', description: 'Rotación de Matrices', icon: <Layout size={24} className="text-indigo-600" />, color: 'bg-indigo-50 border-indigo-200' },
        { id: '2048' as GameType, title: '2048', description: 'Lógica Matemática', icon: <Grid3X3 size={24} className="text-amber-600" />, color: 'bg-amber-50 border-amber-200' },
      ]
    },
    {
      name: 'Acción y Física',
      games: [
        { id: 'PONG' as GameType, title: 'Pong', description: 'Vectores y Rebote', icon: <Target size={24} className="text-slate-800" />, color: 'bg-slate-100 border-slate-300' },
        { id: 'HAX' as GameType, title: 'Hax-Soccer', description: 'Fútbol de Física', icon: <Trophy size={24} className="text-green-600" />, color: 'bg-green-50 border-green-200' },
      ]
    },
    {
      name: 'Competición',
      games: [
        { id: 'TOURNAMENT' as GameType, title: 'Modo Torneo', description: 'Crea tu propia liga', icon: <Trophy size={24} className="text-yellow-500" />, color: 'bg-yellow-50 border-yellow-200' },
      ]
    }
  ];

  const allGames = categories.flatMap(c => c.games)
    .filter(g => g.id !== 'TOURNAMENT')
    .map(g => ({
      ...g,
      isCompetitive: g.id === 'PONG' || g.id === 'HAX'
    }));

  const handleTournamentPlay = (gameId: string, playerIndex: number, autoStartMode: any, onFinish: (results: any) => void) => {
    const wrappedOnFinish = (results: any) => {
      onFinish(results);
      setCurrentGame('TOURNAMENT');
    };
    setTournamentState({ gameId, autoStartMode, onFinish: wrappedOnFinish });
    setCurrentGame(gameId as GameType);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100">
      <AnimatePresence mode="wait">
        {currentGame === 'MENU' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto p-4 pt-8 space-y-10 pb-24"
          >
            <div className="text-center space-y-3">
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight">Mini Juegos</h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                Retos clásicos y originales optimizados para tu móvil.
              </p>
            </div>

            <div className="space-y-10">
              {categories.map((category) => (
                <div key={category.name} className="space-y-5">
                  <h2 className="text-xl font-black text-gray-400 uppercase tracking-widest px-2">{category.name}</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {category.games.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => setCurrentGame(game.id)}
                        className={`flex flex-col items-start p-5 md:p-6 rounded-3xl border-2 transition-all duration-200 text-left ${game.color} transform active:scale-95 hover:shadow-lg group`}
                      >
                        <div className="bg-white p-3 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                          {game.icon}
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 leading-tight">{game.title}</h3>
                        <p className="text-xs md:text-sm text-gray-500 leading-tight opacity-80">{game.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {currentGame === 'COLOR' && <motion.div key="color" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><ColorMemory onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === 'PIXEL' && <motion.div key="pixel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><PixelPerfect onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === 'STOPWATCH' && <motion.div key="stopwatch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><BlindStopwatch onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === 'WEIGHT' && <motion.div key="weight" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><WeightGuesser onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === 'MINESWEEPER' && <motion.div key="minesweeper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><Minesweeper onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === 'WORDLE' && <motion.div key="wordle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><Wordle onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === 'TETRIS' && <motion.div key="tetris" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><Tetris onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === '2048' && <motion.div key="2048" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><Game2048 onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === 'PONG' && <motion.div key="pong" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><Pong onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === 'HAX' && <motion.div key="hax" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><HaxBall onBack={() => setCurrentGame(tournamentState ? 'TOURNAMENT' : 'MENU')} onFinish={tournamentState?.onFinish} autoStartMode={tournamentState?.autoStartMode} /></motion.div>}
        {currentGame === 'TOURNAMENT' && (
          <motion.div key="tournament" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <Tournament 
              availableGames={allGames} 
              onBack={() => { 
                setCurrentGame('MENU'); 
                setTournamentState(null); 
                // Reset tournament state when exiting to menu
                setTournamentStep('SETUP');
                setTournamentPlayers([
                  { id: '1', name: 'Jugador 1', score: 0 },
                  { id: '2', name: 'Jugador 2', score: 0 },
                ]);
                setTournamentSelectedGames([]);
                setTournamentCurrentGameIndex(0);
                setTournamentCurrentPlayerIndex(0);
                setTournamentRoundResults({});
              }} 
              onPlayGame={handleTournamentPlay}
              // Pass state and setters
              step={tournamentStep}
              setStep={setTournamentStep}
              players={tournamentPlayers}
              setPlayers={setTournamentPlayers}
              selectedGames={tournamentSelectedGames}
              setSelectedGames={setTournamentSelectedGames}
              currentGameIndex={tournamentCurrentGameIndex}
              setCurrentGameIndex={setTournamentCurrentGameIndex}
              currentPlayerIndex={tournamentCurrentPlayerIndex}
              setCurrentPlayerIndex={setTournamentCurrentPlayerIndex}
              roundResults={tournamentRoundResults}
              setRoundResults={setTournamentRoundResults}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
