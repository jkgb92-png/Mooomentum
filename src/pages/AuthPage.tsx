import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WaveBackground from '../components/WaveBackground';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'login') {
      if (login(username, password)) navigate('/lobby');
      else setError('Invalid username or password');
    } else {
      if (!username || !email || !password) { setError('All fields are required'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (register(username, email, password)) navigate('/lobby');
      else setError('Username or email already taken');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WaveBackground />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-float inline-block">🌊</div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-ocean-300 via-white to-gold-400 glow-text">
            WaveCasino
          </h1>
          <p className="text-ocean-400 mt-2">Ride the Wave of Fortune 🎰</p>
        </div>

        <div className="glass-card p-8 shadow-2xl shadow-ocean-900/50">
          <div className="flex gap-2 mb-6 glass-card p-1">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                  mode === m
                    ? 'bg-gradient-to-r from-ocean-500 to-ocean-700 text-white shadow-lg'
                    : 'text-ocean-400 hover:text-white'
                }`}
              >
                {m === 'login' ? '🔑 Sign In' : '✨ Join Now'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-ocean-300 text-sm mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full glass-card px-4 py-3 text-white placeholder-ocean-500 focus:outline-none focus:border-ocean-400 border border-white/10 rounded-xl"
                placeholder="Enter username..."
                autoComplete="username"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-ocean-300 text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full glass-card px-4 py-3 text-white placeholder-ocean-500 focus:outline-none border border-white/10 rounded-xl"
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
            )}

            <div>
              <label className="block text-ocean-300 text-sm mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full glass-card px-4 py-3 text-white placeholder-ocean-500 focus:outline-none border border-white/10 rounded-xl pr-12"
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-400 hover:text-white"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="w-full gold-btn text-lg">
              {mode === 'login' ? '🎰 Enter Casino' : '🌊 Start Playing!'}
            </button>
          </form>

          {mode === 'register' && (
            <p className="text-ocean-500 text-xs text-center mt-4">
              🎁 New players start with 1,000 free credits!
            </p>
          )}
        </div>

        <p className="text-center text-ocean-600 text-xs mt-4">
          🔞 18+ only. Play responsibly. For entertainment purposes.
        </p>
      </div>
    </div>
  );
}
