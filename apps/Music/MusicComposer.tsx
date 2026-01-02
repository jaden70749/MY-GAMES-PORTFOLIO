
import React, { useState, useEffect, useRef } from 'react';
import { BackButton } from '../../components/BackButton';

// --- SVG Note & Rest Components (정밀 렌더링) ---
const NoteSVG = ({ type, color = 'currentColor', scale = 1 }: { type: string, color?: string, scale?: number }) => {
  const s = scale;
  switch (type) {
    case 'whole': return (
      <svg width={20*s} height={14*s} viewBox="0 0 30 20">
        <ellipse cx="15" cy="10" rx="12" ry="8" fill="none" stroke={color} strokeWidth="3" transform="rotate(-20 15 10)" />
      </svg>
    );
    case 'half': return (
      <svg width={18*s} height={40*s} viewBox="0 0 30 60" style={{ marginTop: -28*s }}>
        <ellipse cx="10" cy="50" rx="8" ry="5" fill="none" stroke={color} strokeWidth="2.5" transform="rotate(-20 10 50)" />
        <path d="M17 50 L17 5" stroke={color} strokeWidth="2.5" />
      </svg>
    );
    case 'quarter': return (
      <svg width={18*s} height={40*s} viewBox="0 0 30 60" style={{ marginTop: -28*s }}>
        <ellipse cx="10" cy="50" rx="8" ry="5" fill={color} transform="rotate(-20 10 50)" />
        <path d="M17 50 L17 5" stroke={color} strokeWidth="2.5" />
      </svg>
    );
    case 'eighth': return (
      <svg width={22*s} height={40*s} viewBox="0 0 35 60" style={{ marginTop: -28*s }}>
        <ellipse cx="10" cy="50" rx="8" ry="5" fill={color} transform="rotate(-20 10 50)" />
        <path d="M17 50 L17 5" stroke={color} strokeWidth="2.5" />
        <path d="M17 5 Q 30 15 28 35" fill="none" stroke={color} strokeWidth="2.5" />
      </svg>
    );
    case 'whole_r': return (
      <svg width={18*s} height={18*s} viewBox="0 0 30 30">
        <rect x="5" y="5" width="20" height="7" fill={color} />
      </svg>
    );
    case 'half_r': return (
      <svg width={18*s} height={18*s} viewBox="0 0 30 30">
        <rect x="5" y="18" width="20" height="7" fill={color} />
      </svg>
    );
    case 'quarter_r': return (
      <svg width={14*s} height={32*s} viewBox="0 0 20 40">
        <path d="M5 5 L15 15 L5 20 L15 30 L10 35" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
    case 'eighth_r': return (
      <svg width={14*s} height={28*s} viewBox="0 0 20 40">
        <circle cx="8" cy="15" r="4" fill={color} />
        <path d="M8 15 Q 15 10 18 5 L 10 35" fill="none" stroke={color} strokeWidth="2.5" />
      </svg>
    );
    default: return null;
  }
};

const PITCHES = [
  { pitch: 'G5', freq: 783.99 }, { pitch: 'F5', freq: 698.46 }, { pitch: 'E5', freq: 659.25 },
  { pitch: 'D5', freq: 587.33 }, { pitch: 'C5', freq: 523.25 }, { pitch: 'B4', freq: 493.88 },
  { pitch: 'A4', freq: 440.00 }, { pitch: 'G4', freq: 392.00 }, { pitch: 'F4', freq: 349.23 },
  { pitch: 'E4', freq: 329.63 }, { pitch: 'D4', freq: 293.66 }, { pitch: 'C4', freq: 261.63 },
];

const BEATS_PER_MEASURE = 4;
const TICKS_PER_BEAT = 4;
const MEASURES_PER_LINE = 4;
const TICK_WIDTH = 12; // 900px 너비에 맞추기 위해 축소

interface NoteEvent {
  id: string;
  pitchIdx: number;
  tick: number;
  durationTicks: number;
  type: string;
  isRest: boolean;
}

const SYMBOLS = [
  { id: 'whole', dur: 16, label: '온음표', isRest: false },
  { id: 'half', dur: 8, label: '2분음표', isRest: false },
  { id: 'quarter', dur: 4, label: '4분음표', isRest: false },
  { id: 'eighth', dur: 2, label: '8분음표', isRest: false },
  { id: 'whole_r', dur: 16, label: '온쉼표', isRest: true },
  { id: 'half_r', dur: 8, label: '2쉼표', isRest: true },
  { id: 'quarter_r', dur: 4, label: '4쉼표', isRest: true },
  { id: 'eighth_r', dur: 2, label: '8쉼표', isRest: true },
];

export const MusicComposer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [title, setTitle] = useState('My Orchestral Piece');
  const [events, setEvents] = useState<NoteEvent[]>([]);
  const [selectedSymIdx, setSelectedSymIdx] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTick, setCurrentTick] = useState(-1);
  const [bpm, setBpm] = useState(110);
  const [zoom, setZoom] = useState(1.0);
  const [numMeasures, setNumMeasures] = useState(16);

  const audioCtx = useRef<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalTicks = numMeasures * BEATS_PER_MEASURE * TICKS_PER_BEAT;

  const playSound = (freq: number, duration: number) => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      const tickDur = (60000 / bpm) / TICKS_PER_BEAT;
      let tick = currentTick === -1 ? 0 : currentTick;
      timer = window.setInterval(() => {
        if (tick >= totalTicks) {
          setIsPlaying(false);
          setCurrentTick(-1);
          return;
        }
        setCurrentTick(tick);
        events.filter(e => e.tick === tick && !e.isRest).forEach(e => {
          playSound(PITCHES[e.pitchIdx].freq, 0.4);
        });

        // 자동 줄 바꿈 스크롤 추적
        const ticksPerLine = MEASURES_PER_LINE * BEATS_PER_MEASURE * TICKS_PER_BEAT;
        const lineIdx = Math.floor(tick / ticksPerLine);
        const lineEl = document.getElementById(`score-line-${lineIdx}`);
        if (lineEl && scrollRef.current) {
          const container = scrollRef.current;
          const rect = lineEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
             lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        tick++;
      }, tickDur);
    }
    return () => clearInterval(timer);
  }, [isPlaying, bpm, events, totalTicks]);

  const toggleEvent = (pIdx: number, tick: number) => {
    if (isPlaying) return;
    const sym = SYMBOLS[selectedSymIdx];
    const existing = events.findIndex(e => e.tick === tick && e.pitchIdx === pIdx);
    if (existing !== -1) {
      setEvents(prev => prev.filter((_, i) => i !== existing));
    } else {
      const newEvent: NoteEvent = {
        id: Math.random().toString(36).substr(2, 9),
        pitchIdx: sym.isRest ? 4 : pIdx,
        tick,
        durationTicks: sym.dur,
        type: sym.id,
        isRest: sym.isRest
      };
      setEvents(prev => [...prev, newEvent]);
      if (!sym.isRest) playSound(PITCHES[pIdx].freq, 0.2);
    }
  };

  const renderSystem = (lineIdx: number) => {
    const ticksPerLine = MEASURES_PER_LINE * BEATS_PER_MEASURE * TICKS_PER_BEAT;
    const startTick = lineIdx * ticksPerLine;
    const measureWidth = BEATS_PER_MEASURE * TICKS_PER_BEAT * TICK_WIDTH;

    return (
      <div id={`score-line-${lineIdx}`} key={lineIdx} className="relative bg-white border-b-2 border-zinc-50 py-10 flex justify-center mb-6 last:mb-40 group">
        <div className="relative flex" style={{ width: MEASURES_PER_LINE * measureWidth + 80 }}>
          {/* 오선지 배경 */}
          <div className="absolute inset-x-0 top-[50%] -translate-y-[50%] h-[50px] flex flex-col justify-between pointer-events-none opacity-20">
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="w-full border-b border-zinc-900" />)}
          </div>
          
          {/* 마디 선 */}
          {Array.from({length: MEASURES_PER_LINE + 1}).map((_, mIdx) => (
            <div 
              key={mIdx} 
              className="absolute h-[50px] top-[50%] -translate-y-[50%] border-l border-zinc-900 pointer-events-none"
              style={{ left: mIdx * measureWidth + 60 }}
            />
          ))}

          {/* 높은음자리표 */}
          <div className="absolute left-0 top-[50%] -translate-y-[50%] text-5xl select-none text-zinc-700">𝄞</div>

          {/* 음표 클릭 그리드 */}
          <div className="relative ml-[60px] h-[150px] flex flex-col">
            {PITCHES.map((p, pIdx) => (
              <div key={p.pitch} className="flex h-[12.5px] w-full items-center relative">
                {Array.from({length: ticksPerLine}).map((_, tIdx) => {
                  const globalTick = startTick + tIdx;
                  if (globalTick >= totalTicks) return null;
                  const note = events.find(e => e.tick === globalTick && e.pitchIdx === pIdx);
                  
                  return (
                    <div 
                      key={tIdx}
                      onClick={() => toggleEvent(pIdx, globalTick)}
                      className={`relative flex-shrink-0 cursor-pointer border-r border-transparent hover:bg-sky-100 transition-colors ${currentTick === globalTick ? 'bg-sky-100/40' : ''}`}
                      style={{ width: TICK_WIDTH, height: 12.5 }}
                    >
                      {note && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <NoteSVG type={note.type} scale={0.5} color={currentTick === globalTick ? '#0ea5e9' : '#18181b'} />
                           {pIdx >= 10 && <div className="absolute w-4 h-px bg-zinc-800 top-[6px]" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 마디 번호 레이블 */}
          <div className="absolute top-0 left-[60px] flex" style={{ width: MEASURES_PER_LINE * measureWidth }}>
            {Array.from({length: MEASURES_PER_LINE}).map((_, i) => (
               <span key={i} className="text-[8px] font-bold text-zinc-300" style={{ width: measureWidth }}>M.{lineIdx * 4 + i + 1}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#f4f4f7] flex font-sans overflow-hidden select-none">
      <BackButton onClick={onBack} />
      
      {/* Sidebar Controls */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col p-6 z-50 shadow-2xl overflow-y-auto custom-scrollbar">
        <div className="mb-10 mt-12">
          <h1 className="text-xl font-black italic tracking-tighter text-zinc-900 leading-none uppercase">Music Studio</h1>
          <p className="text-[9px] font-bold text-sky-500 uppercase tracking-widest mt-2">Score Editor V2.5</p>
        </div>

        <div className="space-y-10">
           <section>
             <h2 className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-widest">Symbols Palette</h2>
             <div className="grid grid-cols-4 gap-2">
               {SYMBOLS.map((s, idx) => (
                 <button 
                  key={s.id}
                  onClick={() => setSelectedSymIdx(idx)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all border-2 ${selectedSymIdx === idx ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105' : 'bg-zinc-50 text-zinc-400 border-transparent hover:bg-white hover:border-zinc-200'}`}
                 >
                   <NoteSVG type={s.id} scale={0.6} color={selectedSymIdx === idx ? 'white' : '#9ca3af'} />
                   <span className="text-[6px] font-bold mt-1 uppercase">{s.label}</span>
                 </button>
               ))}
             </div>
           </section>

           <section className="space-y-6">
              <div>
                <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase mb-2"><span>Page Zoom</span><span>{Math.round(zoom * 100)}%</span></div>
                <input type="range" min="0.6" max="1.4" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-full h-1 bg-zinc-100 rounded-full appearance-none accent-zinc-900" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase mb-2"><span>Tempo (BPM)</span><span>{bpm}</span></div>
                <input type="range" min="40" max="220" step="1" value={bpm} onChange={e => setBpm(parseInt(e.target.value))} className="w-full h-1 bg-zinc-100 rounded-full appearance-none accent-zinc-900" />
              </div>
           </section>

           <div className="pt-8 border-t border-zinc-100">
             <button 
               onClick={() => setIsPlaying(!isPlaying)}
               className={`w-full py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${isPlaying ? 'bg-rose-500 text-white animate-pulse' : 'bg-zinc-900 text-white hover:bg-black'}`}
             >
               {isPlaying ? 'STOP' : 'PLAY REPLAY'}
               <span className="text-sm">{isPlaying ? '⏹' : '▶'}</span>
             </button>
             <button onClick={() => setEvents([])} className="w-full py-3 mt-3 bg-zinc-50 text-zinc-400 hover:text-rose-500 rounded-xl font-bold text-[10px] transition-all uppercase">Reset Score</button>
           </div>
        </div>
      </aside>

      {/* Main Sheet Music Canvas */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto bg-zinc-100 p-8 custom-scrollbar flex justify-center">
        <div 
          className="bg-white shadow-2xl origin-top transition-transform duration-500 rounded-sm p-12 border border-zinc-200 h-fit"
          style={{ width: '900px', transform: `scale(${zoom})`, minHeight: '1400px' }}
        >
          <div className="text-center mb-16">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="text-4xl font-serif italic text-center w-full focus:outline-none border-b border-transparent focus:border-zinc-100 pb-2 mb-2"
              placeholder="Enter Piece Title"
            />
            <div className="flex justify-between italic text-zinc-300 px-8 border-b border-zinc-50 pb-4 text-sm font-serif">
              <span>Piano solo</span>
              <span>Composed by MAESTRO STUDIO</span>
            </div>
          </div>
          
          <div className="space-y-1">
            {Array.from({length: Math.ceil(numMeasures / MEASURES_PER_LINE)}).map((_, i) => renderSystem(i))}
          </div>

          <button onClick={() => setNumMeasures(m => m + 4)} className="w-full mt-12 py-6 border-2 border-dashed border-zinc-200 text-zinc-300 hover:text-zinc-900 hover:border-zinc-900 rounded-3xl font-black transition-all text-[10px] uppercase italic tracking-widest">
            + Append 4 Measures
          </button>

          <div className="mt-40 text-center opacity-10 font-serif text-zinc-900 text-[8px] uppercase tracking-[2em]">Premium Manuscript Paper</div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: #18181b; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
};
