import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, ArrowLeft, Keyboard, User, Users, Check } from 'lucide-react';

type GameState = 'START' | 'MODE_SELECT' | 'SET_WORD' | 'PLAYING' | 'WON' | 'LOST';
type PlayerMode = '1P' | '2P';

const WORD_LIST = ['APPLE', 'BEACH', 'BRAIN', 'CLOUD', 'DANCE', 'EARTH', 'FLAME', 'GRAPE', 'HEART', 'LIGHT', 'MUSIC', 'NIGHT', 'OCEAN', 'PIANO', 'QUEEN', 'RIVER', 'SMILE', 'TIGER', 'VOICE', 'WATER', 'YOUTH', 'ZEBRA', 'BOOKS', 'CHAIR', 'DREAM', 'FRUIT', 'GLASS', 'HOUSE', 'JUICE', 'KNIFE', 'LEMON', 'MOUSE', 'NOBLE', 'PAPER', 'RADIO', 'SHIRT', 'TABLE', 'UNCLE', 'WATCH', 'PHONE', 'PLANE', 'TRAIN', 'TRUCK', 'BREAD', 'CHEESE', 'PIZZA', 'PASTA', 'SALAD', 'STEAK', 'SUGAR'];

export default function Wordle({ onBack, onFinish, autoStartMode }: { onBack: () => void; onFinish?: (score: number) => void; autoStartMode?: PlayerMode }) {
  const [gameState, setGameState] = useState<GameState>(autoStartMode === '1P' ? 'PLAYING' : (autoStartMode === '2P' ? 'SET_WORD' : 'START'));
  const [playerMode, setPlayerMode] = useState<PlayerMode>(autoStartMode || '1P');
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [highScore1P, setHighScore1P] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('Wordle_1P_BestScore');
    if (saved) setHighScore1P(parseInt(saved));
  }, []);

  useEffect(() => {
    if (autoStartMode) {
      setPlayerMode(autoStartMode);
      if (autoStartMode === '1P') {
        setTargetWord(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
        setGuesses([]);
        setCurrentGuess('');
        setGameState('PLAYING');
      } else {
        setGameState('SET_WORD');
      }
    }
  }, [autoStartMode]);

  const selectMode = (mode: PlayerMode) => {
    setPlayerMode(mode);
    if (mode === '1P') {
      setTargetWord(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
      setGuesses([]);
      setCurrentGuess('');
      setGameState('PLAYING');
    } else {
      setGameState('SET_WORD');
    }
  };

  const handleSetWord = (word: string) => {
    if (word.length === 5) {
      setTargetWord(word.toUpperCase());
      setGuesses([]);
      setCurrentGuess('');
      setGameState('PLAYING');
    }
  };

  const onKeyPress = useCallback((key: string) => {
    if (gameState !== 'PLAYING') return;

    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentGuess('');

        if (currentGuess === targetWord) {
          setGameState('WON');
          if (playerMode === '1P') {
            const saved = localStorage.getItem('Wordle_1P_BestScore');
            if (!saved || newGuesses.length < parseInt(saved)) {
              localStorage.setItem('Wordle_1P_BestScore', newGuesses.length.toString());
              setHighScore1P(newGuesses.length);
            }
          }
        } else if (newGuesses.length === 6) {
          setGameState('LOST');
        }
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  }, [currentGuess, gameState, guesses, targetWord, playerMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        onKeyPress(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  const getLetterStatus = (guess: string, index: number) => {
    const char = guess[index];
    if (char === targetWord[index]) return 'bg-emerald-500 text-white border-emerald-500';
    if (targetWord.includes(char)) return 'bg-amber-500 text-white border-amber-500';
    return 'bg-slate-400 text-white border-slate-400';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative">
      <div className="p-4 absolute top-0 left-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && !autoStartMode && (
          <motion.div key="start" className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl">
              <Keyboard size={48} />
            </div>
            <h1 className="text-4xl font-black">Wordle</h1>
            <p className="text-slate-600 max-w-xs">Adivina la palabra de 5 letras en 6 intentos.</p>
            {highScore1P && <p className="text-sm font-bold text-emerald-600 uppercase">Mejor Puntuación: {highScore1P} intentos</p>}
            <button onClick={() => setGameState('MODE_SELECT')} className="w-full max-w-xs py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
              Jugar
            </button>
          </motion.div>
        )}

        {gameState === 'MODE_SELECT' && !autoStartMode && (
          <motion.div key="mode" className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Selecciona Modo</h2>
            <button onClick={() => selectMode('1P')} className="w-full max-w-xs p-6 bg-white border-2 rounded-2xl hover:border-emerald-500 flex items-center gap-4">
              <User className="text-emerald-500" /> <div className="text-left font-bold">1 Jugador</div>
            </button>
            <button onClick={() => selectMode('2P')} className="w-full max-w-xs p-6 bg-white border-2 rounded-2xl hover:border-emerald-500 flex items-center gap-4">
              <Users className="text-emerald-500" /> <div className="text-left font-bold">2 Jugadores</div>
            </button>
          </motion.div>
        )}

        {gameState === 'SET_WORD' && (
          <motion.div key="set" className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <h2 className="text-2xl font-bold">Jugador 1: Elige una palabra</h2>
            <input 
              type="password" 
              maxLength={5} 
              className="w-full max-w-xs p-4 text-3xl font-black text-center border-4 border-emerald-500 rounded-2xl uppercase tracking-widest outline-none"
              placeholder="*****"
              onChange={(e) => handleSetWord(e.target.value)}
            />
            <p className="text-slate-500 text-sm">Escribe una palabra de 5 letras para que el Jugador 2 la adivine.</p>
          </motion.div>
        )}

        {(gameState === 'PLAYING' || gameState === 'WON' || gameState === 'LOST') && (
          <motion.div key="playing" className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
            <div className="grid grid-rows-6 gap-2">
              {[...Array(6)].map((_, i) => {
                const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
                const isSubmitted = i < guesses.length;
                return (
                  <div key={i} className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, j) => {
                      const char = guess[j] || '';
                      return (
                        <div 
                          key={j} 
                          className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl font-black border-2 rounded-lg transition-all duration-500 ${
                            isSubmitted ? getLetterStatus(guess, j) : (char ? 'border-slate-400 scale-105' : 'border-slate-200')
                          }`}
                        >
                          {char}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {gameState !== 'PLAYING' && (
              <div className="text-center space-y-4">
                <h2 className={`text-3xl font-black ${gameState === 'WON' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {gameState === 'WON' ? '¡VICTORIA!' : `LA PALABRA ERA: ${targetWord}`}
                </h2>
                {onFinish ? (
                  <button onClick={() => onFinish(gameState === 'WON' ? Math.max(1, 100 - guesses.length * 10) : 0)} className="px-12 py-4 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 mx-auto hover:bg-indigo-500 transition-all shadow-xl">
                    <Play size={24} fill="currentColor" /> Continuar Torneo
                  </button>
                ) : (
                  <button onClick={() => setGameState('MODE_SELECT')} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 mx-auto">
                    <RotateCcw size={20} /> Reintentar
                  </button>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-10 gap-1.5 w-full max-w-md px-2">
              {['Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','ENTER','Z','X','C','V','B','N','M','BACKSPACE'].map(key => (
                <button 
                  key={key} 
                  onClick={() => {
                    onKeyPress(key);
                    if ('vibrate' in navigator) navigator.vibrate(5);
                  }}
                  className={`h-12 sm:h-14 bg-slate-200 rounded-lg font-black text-[10px] sm:text-sm hover:bg-slate-300 active:scale-90 transition-all flex items-center justify-center shadow-sm border-b-4 border-slate-300 active:border-b-0 ${
                    key === 'ENTER' || key === 'BACKSPACE' ? 'col-span-2' : 'col-span-1'
                  }`}
                >
                  {key === 'BACKSPACE' ? 'DEL' : key}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
