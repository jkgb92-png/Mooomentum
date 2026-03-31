import React, { createContext, useContext, useState, useCallback } from 'react';

interface GameContextValue {
  balance: number;
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(1000);

  const addBalance = useCallback((amount: number) => {
    setBalance(prev => Math.round((prev + amount) * 100) / 100);
  }, []);

  const deductBalance = useCallback((amount: number): boolean => {
    let ok = false;
    setBalance(prev => {
      if (prev >= amount) { ok = true; return Math.round((prev - amount) * 100) / 100; }
      return prev;
    });
    return ok;
  }, []);

  return (
    <GameContext.Provider value={{ balance, addBalance, deductBalance }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
