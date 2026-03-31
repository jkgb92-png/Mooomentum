import React from 'react';

export default function WaveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #061a2e 0%, #0a2744 40%, #082035 100%)'
      }} />
      
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-5"
          style={{
            width: `${200 + i * 150}px`,
            height: `${200 + i * 150}px`,
            background: `radial-gradient(circle, #0ea5e9, transparent)`,
            top: `${10 + i * 12}%`,
            left: `${5 + i * 15}%`,
            animation: `wave ${6 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none">
        <path
          d="M0,100 C240,160 480,40 720,100 C960,160 1200,40 1440,100 L1440,200 L0,200 Z"
          fill="rgba(14,165,233,0.06)"
          style={{ animation: 'wave 8s ease-in-out infinite' }}
        />
        <path
          d="M0,130 C360,80 720,180 1080,130 C1260,105 1380,150 1440,130 L1440,200 L0,200 Z"
          fill="rgba(14,165,233,0.04)"
          style={{ animation: 'wave 10s ease-in-out infinite reverse' }}
        />
      </svg>

      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + (i % 3) * 2}px`,
            height: `${2 + (i % 3) * 2}px`,
            background: `rgba(14,165,233,${0.3 + (i % 5) * 0.1})`,
            top: `${(i * 17 + 5) % 100}%`,
            left: `${(i * 13 + 3) % 100}%`,
            animation: `float ${3 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${(i % 3) * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
