import React from 'react';
import { Link } from 'react-router-dom';

// Web Audio API: Realistic Pure Wheel Rotation (Tyre & Air Friction / Bearing Whoosh)
// Strictly NO engine/silencer noise: only smooth aerodynamic wheel spin
let audioCtx = null;
let noiseSource = null;
let gainNode = null;
let filterNode = null;
let lfoNode = null;
let stopTimeout = null;

function playWheelSpinSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (stopTimeout) {
      clearTimeout(stopTimeout);
      stopTimeout = null;
    }

    const now = audioCtx.currentTime;

    // Stop previous instance if already active
    if (gainNode) {
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0.04, now + 0.08);
        return;
      } catch (_) {}
    }

    // 1. Generate pink/soft noise buffer (represents air friction & spinning rubber tread)
    const bufferSize = audioCtx.sampleRate * 2.0;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.96 * b1 + white * 0.09;
      b2 = 0.86 * b2 + white * 0.16;
      data[i] = (b0 + b1 + b2) * 1.5;
    }

    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // 2. Bandpass filter: shapes noise into a pure aerodynamic wheel whoosh (800-1100 Hz)
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'bandpass';
    filterNode.frequency.setValueAtTime(850, now);
    filterNode.Q.setValueAtTime(2.2, now);

    // 3. Rhythmic LFO: creates the "whsh-whsh-whsh" cadence of spokes & tyre rotation
    lfoNode = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfoNode.frequency.setValueAtTime(4.8, now); // ~5 wheel revolutions per second
    lfoGain.gain.setValueAtTime(220, now); // filter modulation
    lfoNode.connect(lfoGain);
    lfoGain.connect(filterNode.frequency);

    // 4. Master volume with smooth ramp up (subtle and pleasant)
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.038, now + 0.12);

    // Connect audio pipeline
    noiseSource.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start(now);
    lfoNode.start(now);
  } catch (err) {
    // Autoplay policy fallback
  }
}

function stopWheelSpinSound() {
  if (gainNode && audioCtx && audioCtx.state === 'running') {
    try {
      const now = audioCtx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25); // 250ms smooth spin-down

      const activeSource = noiseSource;
      const activeLfo = lfoNode;
      stopTimeout = setTimeout(() => {
        try {
          if (activeSource) activeSource.stop();
          if (activeLfo) activeLfo.stop();
        } catch (_) {}
      }, 260);
    } catch (_) {}
  }
  noiseSource = null;
  lfoNode = null;
  gainNode = null;
}

export default function Logo({ variant = 'dark-text', showTagline = false, size = 'md', to = '/' }) {
  // size: sm, md, lg
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const isLightText = variant === 'light-text';

  const content = (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Brand Icon: Motorcycle Wheel & Gear Symbol with hover rotation animation & aerodynamic wheel whoosh sound */}
      <div 
        onMouseEnter={playWheelSpinSound}
        onMouseLeave={stopWheelSpinSound}
        className={`${iconSizes[size]} group/wheel relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/50 hover:scale-110 transition-all duration-300 cursor-pointer`}
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-5/6 h-5/6 fill-none stroke-current stroke-[2.2] stroke-linecap-round stroke-linejoin-round transition-transform duration-700 ease-in-out group-hover:rotate-[360deg] group-hover/wheel:animate-[spin_1.2s_linear_infinite]"
        >
          {/* Outer tyre rim with tread notches */}
          <circle cx="12" cy="12" r="9" />
          {/* Inner brake disc */}
          <circle cx="12" cy="12" r="4.5" strokeDasharray="2 2" />
          {/* Center axle hub */}
          <circle cx="12" cy="12" r="2" fill="white" />
          {/* Mechanical spokes */}
          <path d="M12 3v4.5" />
          <path d="M12 16.5V21" />
          <path d="M3 12h4.5" />
          <path d="M16.5 12H21" />
          <path d="M5.6 5.6l3.2 3.2" />
          <path d="M15.2 15.2l3.2 3.2" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className={`font-extrabold tracking-tight ${textSizes[size]} leading-none flex items-center`}>
          <span className={isLightText ? 'text-white' : 'text-[#111111]'}>BikeFix</span>
          <span className="text-[#F97316] ml-1">Club</span>
        </div>
        {showTagline && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#737373] mt-0.5">
            Your Bike. Your Club. Our Care.
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="inline-block focus:outline-none">{content}</Link>;
  }

  return content;
}
