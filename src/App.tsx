import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import LobbyPage       from './pages/LobbyPage';
import SlotsPage       from './pages/games/SlotsPage';
import BlackjackPage   from './pages/games/BlackjackPage';
import RoulettePage    from './pages/games/RoulettePage';
import CrashPage       from './pages/games/CrashPage';

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<LobbyPage />} />
          <Route path="/slots"     element={<SlotsPage />} />
          <Route path="/blackjack" element={<BlackjackPage />} />
          <Route path="/roulette"  element={<RoulettePage />} />
          <Route path="/crash"     element={<CrashPage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}
