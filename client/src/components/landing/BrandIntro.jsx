import React, { useEffect, useState } from 'react';

export function BrandIntro({ onComplete }) {
  const [stage, setStage] = useState(0); // 0: init, 1: logo in, 2: text in, 3: fade out

  useEffect(() => {
    // Stage 1: Logo appears with soft pulse (150ms)
    const t1 = setTimeout(() => setStage(1), 150);
    // Stage 2: Wordmark appears (550ms)
    const t2 = setTimeout(() => setStage(2), 550);
    // Stage 3: Smooth dissolve (1200ms)
    const t3 = setTimeout(() => setStage(3), 1200);
    // Complete callback (1500ms)
    const t4 = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070a12] transition-opacity duration-500 pointer-events-none ${
        stage === 3 ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Subtle depth radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Subtle background architectural lattice grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Ambient center pulse glow */}
      <div
        className={`absolute w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl transition-transform duration-1000 ease-out pointer-events-none ${
          stage >= 1 ? 'scale-100 opacity-60' : 'scale-50 opacity-0'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* CompanyBrain Hexagonal Glass Core Mark */}
        <div
          className={`relative w-20 h-20 flex items-center justify-center transition-all duration-700 ease-out transform ${
            stage >= 1 ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-4'
          }`}
        >
          {/* Animated glowing backdrop ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-purple-600/30 blur-md animate-pulse-glow" />
          
          {/* Glass shield box */}
          <div className="relative w-16 h-16 rounded-2xl bg-[#0e1626]/90 border border-indigo-400/40 shadow-[0_0_25px_rgba(99,102,241,0.35)] flex items-center justify-center backdrop-blur-xl">
            <svg
              className="w-9 h-9 text-indigo-400 filter drop-shadow-[0_0_8px_rgba(129,140,248,0.7)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Brain / Core nodes schematic */}
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity="0.4" />
              <circle cx="12" cy="12" r="4.5" fill="rgba(99, 102, 241, 0.25)" stroke="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Wordmark Reveal */}
        <div
          className={`mt-5 text-center transition-all duration-700 ease-out transform ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Company</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Brain
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 ml-1">
              Enterprise
            </span>
          </div>
          <p className="text-xs font-mono tracking-wider text-slate-400 uppercase mt-1">
            Permission-Aware Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
}
