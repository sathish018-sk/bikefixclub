import React, { useEffect, useState } from 'react';
import { Flame, Gauge, Zap } from 'lucide-react';

// Web Audio API Synthesizer for a motorcycle acceleration rev-up whoosh
function playIgnitionRevSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // 1. Synthesize smooth accelerating rev sweep (engine rev-up whoosh)
    const revOsc = audioCtx.createOscillator();
    const revGain = audioCtx.createGain();

    revOsc.type = 'sawtooth';
    // Engine RPM climbing rapidly from 120Hz to 380Hz
    revOsc.frequency.setValueAtTime(120, now);
    revOsc.frequency.exponentialRampToValueAtTime(360, now + 0.9);
    revOsc.frequency.exponentialRampToValueAtTime(180, now + 1.3);

    // Bandpass filter to sculpt rich mechanical tone
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.8);
    filter.frequency.exponentialRampToValueAtTime(400, now + 1.3);

    revGain.gain.setValueAtTime(0.001, now);
    revGain.gain.linearRampToValueAtTime(0.05, now + 0.3);
    revGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    revOsc.connect(filter);
    filter.connect(revGain);
    revGain.connect(audioCtx.destination);

    revOsc.start(now);
    revOsc.stop(now + 1.4);

    // 2. High-speed wind/flame whoosh (pink noise)
    const bufferSize = audioCtx.sampleRate * 1.5;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.98 * b0 + white * 0.08;
      b1 = 0.94 * b1 + white * 0.12;
      output[i] = (b0 + b1) * 1.8;
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(700, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.7);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.4);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + 1.4);
  } catch (_) {
    // Graceful fallback
  }
}

export default function GhostRiderTransition({ onComplete, userRole = 'admin' }) {
  const [rpm, setRpm] = useState(1200);
  const [progress, setProgress] = useState(0);
  const [fadeExit, setFadeExit] = useState(false);

  useEffect(() => {
    // Play sound immediately on mount
    playIgnitionRevSound();

    // Rapid RPM counter simulation
    const rpmInterval = setInterval(() => {
      setRpm((prev) => {
        if (prev >= 9600) return 9800;
        return prev + Math.floor(Math.random() * 650) + 400;
      });
    }, 45);

    // Telemetry progress bar (0% -> 100% in 1.25s)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 4;
      });
    }, 40);

    // Fade out transition at 1.35s
    const fadeTimer = setTimeout(() => {
      setFadeExit(true);
    }, 1350);

    // Final navigation trigger at 1.55s
    const completeTimer = setTimeout(() => {
      clearInterval(rpmInterval);
      clearInterval(progressInterval);
      if (onComplete) onComplete();
    }, 1550);

    return () => {
      clearInterval(rpmInterval);
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col justify-between overflow-hidden transition-opacity duration-300 ${
        fadeExit ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Cinematic Concept Backdrop with Parallax Zoom */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/images/ghost-rider-concept.jpg"
          alt="Ghost Rider Transition"
          className="w-full h-full object-cover object-center scale-100 animate-[pulse_4s_ease-in-out_infinite] transform transition-transform duration-1500 hover:scale-105 filter contrast-125 brightness-90"
        />
        {/* Dark Vignette & Fiery Orange Ambient Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/70 via-transparent to-[#0A0A0A]/70" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#F97316]/10 to-[#0A0A0A]/90 mix-blend-screen" />
      </div>

      {/* Top HUD Telemetry */}
      <div className="relative z-10 p-6 sm:p-10 flex items-center justify-between text-white/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F97316] text-white flex items-center justify-center shadow-lg shadow-orange-500/50 animate-bounce">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-[#F97316] block">
              BIKEFIX CLUB // AUTHENTICATION
            </span>
            <h2 className="text-sm font-extrabold tracking-wider text-white">
              {userRole === 'admin' ? 'WORKSHOP COMMAND CENTER' : 'RIDER GARAGE PORTAL'}
            </h2>
          </div>
        </div>

        {/* Live Status Beacon */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-orange-500/40 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
            Access Granted
          </span>
        </div>
      </div>

      {/* Center Fiery Speed Streak Overlay */}
      <div className="relative z-10 text-center px-4 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#F97316]/20 border border-[#F97316]/60 backdrop-blur-md shadow-lg shadow-orange-500/20">
          <Zap className="w-4 h-4 text-[#F97316] animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#F97316]">
            IGNITING WORKSHOP PORTAL
          </span>
        </div>
        <p className="text-xs text-neutral-300 font-mono tracking-wider drop-shadow-md">
          Calibrating fuel injection & digital diagnostics...
        </p>
      </div>

      {/* Bottom Telemetry & Progress Gauge */}
      <div className="relative z-10 p-6 sm:p-10 max-w-2xl mx-auto w-full space-y-4">
        {/* Tachometer & Speed Indicators */}
        <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#F97316]" />
            <span>RPM: <strong className="text-white text-sm">{rpm.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-neutral-400">GEAR: <strong className="text-[#F97316]">N ➔ 1</strong></span>
            <span className="text-neutral-400">THROTTLE: <strong className="text-emerald-400">100%</strong></span>
          </div>
        </div>

        {/* Fiery Progress Bar */}
        <div className="relative w-full h-2.5 rounded-full bg-neutral-900/90 border border-neutral-700/60 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24] rounded-full transition-all duration-75 relative shadow-[0_0_15px_#F97316]"
            style={{ width: `${progress}%` }}
          >
            {/* Blazing tip spark */}
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white blur-2xs" />
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
          <span>BIKEFIX CLUB V2.4</span>
          <span className="text-[#F97316] font-bold">{progress}% READY</span>
        </div>
      </div>
    </div>
  );
}
