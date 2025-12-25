
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackButton } from '../../components/BackButton';

interface DrumPart {
  id: string;
  key: string;
  name: string;
  freq: number;
  type: OscillatorType;
  decay: number;
  top: string;
  left: string;
  width: string;
  height: string;
  label: string;
  isCymbal?: boolean;
}

const DRUM_KIT: DrumPart[] = [
  { id: 'crash_l', key: 'y', name: 'CRASH L', freq: 600, type: 'sawtooth', decay: 1.2, top: '5%', left: '15%', width: '22%', height: '18%', label: 'Y', isCymbal: true },
  { id: 'crash_r', key: 'u', name: 'CRASH R', freq: 500, type: 'sawtooth', decay: 1.5, top: '3%', left: '60%', width: '28%', height: '24%', label: 'U', isCymbal: true },
  { id: 'hihat_top', key: 'e', name: 'HAT TOP', freq: 1200, type: 'square', decay: 0.05, top: '16%', left: '2%', width: '18%', height: '8%', label: 'E', isCymbal: true },
  { id: 'hihat_bot', key: 'r', name: 'HAT RIM', freq: 1000, type: 'square', decay: 0.1, top: '22%', left: '0%', width: '18%', height: '6%', label: 'R', isCymbal: true },
  { id: 'tom_h', key: 'g', name: 'HIGH TOM', freq: 160, type: 'sine', decay: 0.4, top: '20%', left: '32%', width: '13%', height: '16%', label: 'G' },
  { id: 'tom_m', key: 'h', name: 'MID TOM', freq: 120, type: 'sine', decay: 0.4, top: '18%', left: '46%', width: '14%', height: '18%', label: 'H' },
  { id: 'snare_c', key: 's', name: 'SNARE', freq: 220, type: 'triangle', decay: 0.2, top: '30%', left: '12%', width: '18%', height: '20%', label: 'S' },
  { id: 'snare_r', key: 'd', name: 'SNARE RIM', freq: 400, type: 'sine', decay: 0.05, top: '38%', left: '26%', width: '4%', height: '4%', label: 'D' },
  { id: 'kick', key: 'x', name: 'KICK', freq: 60, type: 'sine', decay: 0.5, top: '36%', left: '32%', width: '24%', height: '45%', label: 'X' },
  { id: 'floor_tom', key: 'j', name: 'FLOOR TOM', freq: 90, type: 'sine', decay: 0.6, top: '35%', left: '62%', width: '20%', height: '35%', label: 'J' },
  { id: 'pedal', key: 'c', name: 'HAT PEDAL', freq: 800, type: 'square', decay: 0.05, top: '80%', left: '6%', width: '8%', height: '15%', label: 'C' },
];

export const DrumMaster: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const audioCtx = useRef<AudioContext | null>(null);

  const playSound = useCallback((drum: DrumPart) => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = drum.type;
    osc.frequency.setValueAtTime(drum.freq, ctx.currentTime);
    
    if (drum.id === 'kick') {
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + drum.decay);
      filter.type = 'lowpass';
      filter.frequency.value = 400;
    } else if (drum.isCymbal) {
      filter.type = 'highpass';
      filter.frequency.value = 2000;
    }

    gain.gain.setValueAtTime(drum.isCymbal ? 0.2 : 0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + drum.decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + drum.decay);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const drum = DRUM_KIT.find(d => d.key.toLowerCase() === e.key.toLowerCase());
      if (drum && !activeKeys.has(drum.id)) {
        setActiveKeys(prev => {
            const next = new Set(prev);
            next.add(drum.id);
            return next;
        });
        playSound(drum);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const drum = DRUM_KIT.find(d => d.key.toLowerCase() === e.key.toLowerCase());
      if (drum) {
        setActiveKeys(prev => {
          const next = new Set(prev);
          next.delete(drum.id);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playSound, activeKeys]);

  return (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      <BackButton onClick={onBack} />
      
      <div className="absolute top-20 text-center z-10 pointer-events-none">
        <h1 className="text-4xl font-black italic tracking-tighter text-zinc-800 uppercase">Drum Master</h1>
        <div className="w-16 h-1 bg-red-500 mx-auto mt-2"></div>
      </div>

      <div className="relative w-full max-w-5xl aspect-[1.5/1] bg-white rounded-3xl">
        {/* Hardware Lines/Stands (Decorative) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
           <div className="absolute left-[10%] bottom-[15%] w-1 h-[70%] bg-zinc-400" />
           <div className="absolute left-[21%] bottom-[45%] w-1 h-[40%] bg-zinc-400" />
           <div className="absolute right-[15%] bottom-[15%] w-1 h-[70%] bg-zinc-400" />
        </div>

        {/* Interactive Drum Parts */}
        {DRUM_KIT.map((drum) => (
          <div
            key={drum.id}
            onMouseDown={() => playSound(drum)}
            style={{ 
                top: drum.top, 
                left: drum.left, 
                width: drum.width, 
                height: drum.height 
            }}
            className={`absolute flex items-center justify-center cursor-pointer transition-all duration-75 group`}
          >
            {/* Drum Body */}
            <div className={`
              w-full h-full relative flex items-center justify-center
              ${drum.isCymbal ? 'rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border-2 border-amber-600 shadow-xl' : 
                drum.id === 'kick' ? 'rounded-full bg-white border-8 border-zinc-200 shadow-2xl overflow-hidden' :
                drum.id === 'pedal' ? 'rounded-t-full bg-zinc-300 border-4 border-zinc-500 shadow-lg' :
                'rounded-2xl bg-red-500 border-t-[12px] border-zinc-300 border-b-4 border-zinc-800 shadow-xl'}
              ${activeKeys.has(drum.id) ? 'scale-95 translate-y-1 brightness-110' : 'hover:scale-[1.02]'}
            `}>
              {/* Internal details for drums */}
              {!drum.isCymbal && drum.id !== 'pedal' && drum.id !== 'kick' && (
                  <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-lg blur-[2px]"></div>
              )}
              {drum.id === 'kick' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[90%] h-[90%] rounded-full border-4 border-zinc-100 flex items-center justify-center">
                          <div className="w-12 h-32 bg-zinc-800 rounded-full opacity-20"></div>
                      </div>
                  </div>
              )}

              {/* Label Circle */}
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-lg border-2 border-white/50
                ${activeKeys.has(drum.id) ? 'bg-red-500 scale-125' : 'bg-green-500'}
                z-20 transform transition-transform group-hover:scale-110
              `}>
                {drum.label}
              </div>

              {/* Shine for cymbals */}
              {drum.isCymbal && (
                  <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0%,white_25%,transparent_50%,white_75%,transparent_100%)] opacity-30"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Manual Legend */}
      <div className="absolute bottom-16 w-full px-10 flex flex-wrap justify-center gap-4 pointer-events-none">
          {DRUM_KIT.map(d => (
              <div key={d.id} className="flex items-center gap-2 bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-lg">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">{d.label}</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{d.name}</span>
              </div>
          ))}
      </div>

      <style>{`
        .drum-hit-animate {
            animation: hit 0.1s ease-out;
        }
        @keyframes hit {
            0% { transform: scale(1); }
            50% { transform: scale(0.95) translateY(4px); }
            100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
