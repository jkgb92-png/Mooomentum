import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

const MASTER_ADMIN: User = {
  id: 'admin-001',
  username: 'admin',
  email: 'admin@wavecasino.com',
  password: 'WaveAdmin2024!',
  balance: 1000000,
  isAdmin: true,
  createdAt: new Date().toISOString(),
  totalWinnings: 0,
  gamesPlayed: 0,
  avatar: '👑',
};

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  register: (username: string, email: string, password: string) => boolean;
  logout: () => void;
  updateBalance: (amount: number) => void;
  updateStats: (won: boolean, winAmount: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadUsers(): User[] {
  try {
    const stored = localStorage.getItem('wavecasino_users');
    const users: User[] = stored ? JSON.parse(stored) : [];
    const hasAdmin = users.some(u => u.id === 'admin-001');
    if (!hasAdmin) users.push(MASTER_ADMIN);
    return users;
  } catch {
    return [MASTER_ADMIN];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem('wavecasino_users', JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('wavecasino_current');
      if (stored) {
        const u = JSON.parse(stored);
        const freshUsers = loadUsers();
        return freshUsers.find(fu => fu.id === u.id) ?? null;
      }
    } catch {}
    return null;
  });

  useEffect(() => { saveUsers(users); }, [users]);
  useEffect(() => {
    if (user) localStorage.setItem('wavecasino_current', JSON.stringify(user));
    else localStorage.removeItem('wavecasino_current');
  }, [user]);

  const login = (username: string, password: string): boolean => {
    const found = users.find(u => u.username === username && u.password === password);
    if (found) { setUser(found); return true; }
    return false;
  };

  const register = (username: string, email: string, password: string): boolean => {
    if (users.some(u => u.username === username || u.email === email)) return false;
    const newUser: User = {
      id: `user-${Date.now()}`,
      username, email, password,
      balance: 1000,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      totalWinnings: 0,
      gamesPlayed: 0,
      avatar: ['🎰','🃏','🎲','🎯','🌊','💎','🦈','🐬'][Math.floor(Math.random() * 8)],
    };
    const updated = [...users, newUser];
    setUsers(updated);
    setUser(newUser);
    return true;
  };

  const logout = () => setUser(null);

  const updateBalance = (amount: number) => {
    if (!user) return;
    const updated = { ...user, balance: Math.max(0, user.balance + amount) };
    setUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const updateStats = (won: boolean, winAmount: number) => {
    if (!user) return;
    const updated = {
      ...user,
      gamesPlayed: user.gamesPlayed + 1,
      totalWinnings: user.totalWinnings + (won ? winAmount : 0),
    };
    setUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  return (
    <AuthContext.Provider value={{ user, users, login, register, logout, updateBalance, updateStats }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
