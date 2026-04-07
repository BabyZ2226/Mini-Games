import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, CheckCircle2, Play, ArrowRight, UserPlus, Trash2, Gamepad2, User } from 'lucide-react';

export type TournamentPlayer = {
  id: string;
  name: string;
  score: number;
};

export type TournamentGame = {
  id: string;
  title: string;
  icon: React.ReactNode;
  isCompetitive: boolean;
};

type TournamentStep = 'SETUP' | 'GAME_SELECT' | 'LEADERBOARD' | 'PLAYING' | 'TURN_ANNOUNCEMENT' | 'MODE_SELECT_FOR_GAME';

interface TournamentProps {
  availableGames: TournamentGame[];
  onBack: () => void;
  onPlayGame: (gameId: string, playerIndex: number, mode: any, onFinish: (result: any) => void) => void;
  step: TournamentStep;
  setStep: React.Dispatch<React.SetStateAction<TournamentStep>>;
  players: TournamentPlayer[];
  setPlayers: React.Dispatch<React.SetStateAction<TournamentPlayer[]>>;
  selectedGames: string[];
  setSelectedGames: React.Dispatch<React.SetStateAction<string[]>>;
  currentGameIndex: number;
  setCurrentGameIndex: React.Dispatch<React.SetStateAction<number>>;
  currentPlayerIndex: number;
  setCurrentPlayerIndex: React.Dispatch<React.SetStateAction<number>>;
  roundResults: { [playerId: string]: number };
  setRoundResults: React.Dispatch<React.SetStateAction<{ [playerId: string]: number }>>;
}

export default function Tournament({ 
  availableGames, onBack, onPlayGame,
  step, setStep,
  players, setPlayers,
  selectedGames, setSelectedGames,
  currentGameIndex, setCurrentGameIndex,
  currentPlayerIndex, setCurrentPlayerIndex,
  roundResults, setRoundResults
}: TournamentProps) {

  const addPlayer = () => {
    if (players.length < 4) {
      setPlayers([...players, { id: (players.length + 1).toString(), name: `Jugador ${players.length + 1}`, score: 0 }]);
    }
  };

  const removePlayer = (id: string) => {
    if (players.length > 2) {
      setPlayers(players.filter(p => p.id !== id).map((p, i) => ({ ...p, id: (i + 1).toString() })));
    }
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const toggleGame = (gameId: string) => {
    if (selectedGames.includes(gameId)) {
      setSelectedGames(selectedGames.filter(id => id !== gameId));
    } else {
      setSelectedGames([...selectedGames, gameId]);
    }
  };

  const startTournament = () => {
    if (selectedGames.length === 0) return;
    setStep('LEADERBOARD');
  };

  const playNextRound = () => {
    const game = availableGames.find(g => g.id === selectedGames[currentGameIndex]);
    if (!game) return;

    if (game.isCompetitive) {
      // For competitive games, we ask if they want 1P (sequential) or 2P (direct duel)
      setStep('MODE_SELECT_FOR_GAME');
    } else {
      // Sequential play for single-player games
      setStep('TURN_ANNOUNCEMENT');
      setCurrentPlayerIndex(0);
      setRoundResults({});
    }
  };

  const handleGameFinish = (score: any) => {
    const playerId = players[currentPlayerIndex].id;
    const newResults = { ...roundResults, [playerId]: score };
    setRoundResults(newResults);

    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
      setStep('TURN_ANNOUNCEMENT');
    } else {
      // All players finished this game
      const sorted = [...players].sort((a, b) => (newResults[b.id] || 0) - (newResults[a.id] || 0));
      setPlayers(prev => prev.map(p => {
        const rank = sorted.findIndex(s => s.id === p.id);
        const points = rank === 0 ? 3 : rank === 1 ? 2 : rank === 2 ? 1 : 0;
        return { ...p, score: p.score + points };
      }));
      finishRound();
    }
  };

  const handleCompetitiveFinish = (results: any) => {
    if (results.winnerId) {
      // In 2P mode, winnerId is 1 or 2 (referring to the players in the match)
      // For simplicity, we assume P1 and P2 of the tournament are playing
      // If there are 4 players, this is a bit ambiguous, but let's stick to P1 vs P2 for now
      setPlayers(prev => prev.map((p, i) => (i + 1).toString() === results.winnerId ? { ...p, score: p.score + 3 } : p));
    }
    finishRound();
  };

  const startPlayerTurn = () => {
    const gameId = selectedGames[currentGameIndex];
    onPlayGame(gameId, currentPlayerIndex, '1P', handleGameFinish);
  };

  const finishRound = () => {
    if (currentGameIndex < selectedGames.length - 1) {
      setCurrentGameIndex(prev => prev + 1);
      setStep('LEADERBOARD');
    } else {
      setCurrentGameIndex(selectedGames.length); // Mark as finished
      setStep('LEADERBOARD');
    }
  };

  return (
    <div className="h-full bg-slate-900 text-white p-4 overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 'SETUP' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-md mx-auto space-y-6 pt-10">
            <div className="text-center space-y-2">
              <Trophy size={48} className="mx-auto text-yellow-500" />
              <h1 className="text-3xl font-black italic tracking-tighter">MODO TORNEO</h1>
              <p className="text-slate-400">Configura los competidores (2-4 jugadores)</p>
            </div>

            <div className="space-y-3">
              {players.map((player, index) => (
                <div key={player.id} className="flex gap-2 items-center bg-slate-800 p-3 rounded-2xl border border-slate-700">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayerName(player.id, e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-lg"
                    placeholder="Nombre del jugador"
                  />
                  {players.length > 2 && (
                    <button onClick={() => removePlayer(player.id)} className="p-2 text-slate-500 hover:text-red-400">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
              
              {players.length < 4 && (
                <button onClick={addPlayer} className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 flex items-center justify-center gap-2 hover:border-slate-500 hover:text-slate-300 transition-all">
                  <UserPlus size={20} /> Añadir Jugador
                </button>
              )}
            </div>

            <button onClick={() => setStep('GAME_SELECT')} className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-xl shadow-lg flex items-center justify-center gap-2">
              Siguiente <ArrowRight size={24} />
            </button>
            
            <button onClick={onBack} className="w-full text-slate-500 font-bold py-2">Cancelar</button>
          </motion.div>
        )}

        {step === 'GAME_SELECT' && (
          <motion.div key="games" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto space-y-6 pt-10">
            <div className="text-center space-y-2">
              <Gamepad2 size={48} className="mx-auto text-indigo-500" />
              <h2 className="text-3xl font-black italic tracking-tighter">ELIGE LOS JUEGOS</h2>
              <p className="text-slate-400">Selecciona los desafíos del torneo</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {availableGames.map(game => (
                <button
                  key={game.id}
                  onClick={() => toggleGame(game.id)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${selectedGames.includes(game.id) ? 'bg-indigo-600 border-indigo-400 scale-105 shadow-lg' : 'bg-slate-800 border-slate-700 opacity-60'}`}
                >
                  <div className="bg-white/10 p-2 rounded-xl">{game.icon}</div>
                  <span className="font-bold text-sm">{game.title}</span>
                  {selectedGames.includes(game.id) && <CheckCircle2 size={20} className="absolute top-2 right-2 text-white" />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('SETUP')} className="flex-1 py-4 bg-slate-800 rounded-2xl font-bold">Atrás</button>
              <button 
                onClick={startTournament} 
                disabled={selectedGames.length === 0}
                className={`flex-[2] py-4 rounded-2xl font-black text-xl shadow-lg ${selectedGames.length > 0 ? 'bg-green-600' : 'bg-slate-700 cursor-not-allowed'}`}
              >
                Empezar Torneo
              </button>
            </div>
          </motion.div>
        )}

        {step === 'LEADERBOARD' && (
          <motion.div key="leaderboard" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="max-w-md mx-auto space-y-6 pt-10">
            <div className="text-center space-y-2">
              <Trophy size={64} className="mx-auto text-yellow-500 animate-bounce" />
              <h2 className="text-4xl font-black italic tracking-tighter">POSICIONES</h2>
              <p className="text-slate-400">
                {currentGameIndex < selectedGames.length ? `Próximo juego: ${availableGames.find(g => g.id === selectedGames[currentGameIndex])?.title}` : '¡Torneo Finalizado!'}
              </p>
            </div>

            <div className="space-y-3">
              {[...players].sort((a, b) => b.score - a.score).map((player, index) => (
                <div key={player.id} className="flex items-center gap-4 bg-slate-800 p-4 rounded-3xl border border-slate-700">
                  <div className="text-2xl font-black text-slate-500 w-8">#{index + 1}</div>
                  <div className="flex-1 font-bold text-xl">{player.name}</div>
                  <div className="text-2xl font-black text-yellow-500">{player.score} <span className="text-xs text-slate-500">PTS</span></div>
                </div>
              ))}
            </div>

            {currentGameIndex < selectedGames.length ? (
              <div className="space-y-4">
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }} 
                    animate={{ width: "100%" }} 
                    transition={{ duration: 5, ease: "linear" }}
                    onAnimationComplete={playNextRound}
                    className="h-full bg-green-500"
                  />
                </div>
                <button onClick={playNextRound} className="w-full py-5 bg-green-600 rounded-3xl font-black text-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform">
                  <Play size={28} fill="currentColor" /> JUGAR RONDA {currentGameIndex + 1}
                </button>
              </div>
            ) : (
              <button onClick={onBack} className="w-full py-5 bg-indigo-600 rounded-3xl font-black text-2xl shadow-xl flex items-center justify-center gap-3">
                Finalizar y Salir
              </button>
            )}
          </motion.div>
        )}

        {step === 'TURN_ANNOUNCEMENT' && (
          <motion.div key="turn" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="max-w-md mx-auto h-full flex flex-col items-center justify-center space-y-6 text-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-black shadow-2xl ${currentPlayerIndex === 0 ? 'bg-red-500' : currentPlayerIndex === 1 ? 'bg-blue-500' : currentPlayerIndex === 2 ? 'bg-green-500' : 'bg-amber-500'}`}>
              {currentPlayerIndex + 1}
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-black italic tracking-tighter uppercase">TURNO DE</h2>
              <div className="text-3xl font-bold text-indigo-400">{players[currentPlayerIndex].name}</div>
            </div>
            <p className="text-slate-400">Prepárate para jugar {availableGames.find(g => g.id === selectedGames[currentGameIndex])?.title}</p>
            <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }} 
                animate={{ width: "100%" }} 
                transition={{ duration: 2, ease: "linear" }}
                onAnimationComplete={startPlayerTurn}
                className="h-full bg-white"
              />
            </div>
            <button onClick={startPlayerTurn} className="w-full py-6 bg-white text-slate-900 rounded-3xl font-black text-3xl shadow-xl">
              ¡YA!
            </button>
          </motion.div>
        )}

        {step === 'MODE_SELECT_FOR_GAME' && (
          <motion.div key="mode_select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-md mx-auto h-full flex flex-col items-center justify-center space-y-6 text-center">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">¿CÓMO JUGARÁN?</h2>
            <p className="text-slate-400">Elige el modo para {availableGames.find(g => g.id === selectedGames[currentGameIndex])?.title}</p>
            <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
              <button 
                onClick={() => {
                  setStep('TURN_ANNOUNCEMENT');
                  setCurrentPlayerIndex(0);
                  setRoundResults({});
                }} 
                className="p-6 bg-slate-800 border-2 border-slate-700 rounded-3xl hover:border-indigo-500 flex items-center gap-4 group transition-all"
              >
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <User size={24} />
                </div>
                <div className="text-left">
                  <div className="font-black text-xl">1 JUGADOR</div>
                  <div className="text-slate-500 text-xs text-balance">Cada uno juega su turno y suma puntos</div>
                </div>
              </button>
              <button 
                onClick={() => {
                  const gameId = selectedGames[currentGameIndex];
                  const mode = gameId === 'HAX' ? 2 : '2P';
                  onPlayGame(gameId, -1, mode, handleCompetitiveFinish);
                }} 
                className="p-6 bg-slate-800 border-2 border-slate-700 rounded-3xl hover:border-indigo-500 flex items-center gap-4 group transition-all"
              >
                <div className="w-12 h-12 bg-rose-600/20 rounded-xl flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <Users size={24} />
                </div>
                <div className="text-left">
                  <div className="font-black text-xl">2 JUGADORES</div>
                  <div className="text-slate-500 text-xs text-balance">Duelo directo (P1 vs P2)</div>
                </div>
              </button>
            </div>
            <button onClick={() => setStep('LEADERBOARD')} className="text-slate-500 font-bold hover:text-white transition-colors">Cancelar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
