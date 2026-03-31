import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import SlotsPage from './pages/games/SlotsPage';
import BlackjackPage from './pages/games/BlackjackPage';
import RoulettePage from './pages/games/RoulettePage';
import PokerPage from './pages/games/PokerPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/lobby" replace /> : <AuthPage />} />
      <Route path="/lobby" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
      <Route path="/game/slots" element={<ProtectedRoute><SlotsPage /></ProtectedRoute>} />
      <Route path="/game/blackjack" element={<ProtectedRoute><BlackjackPage /></ProtectedRoute>} />
      <Route path="/game/roulette" element={<ProtectedRoute><RoulettePage /></ProtectedRoute>} />
      <Route path="/game/poker" element={<ProtectedRoute><PokerPage /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
