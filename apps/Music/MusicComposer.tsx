
import React, { useState, useEffect, useRef } from 'react';
import { BackButton } from '../../components/BackButton';

const PITCHES = [
  { pitch: 'G5', freq: 783.99, y: 0 },
  { pitch: 'F5', freq: 698.46, y: 1 },
  { pitch: 'E5', freq: 659.25, y: 2 },
  { pitch: 'D5', freq: 587.33, y: 3 },
  { pitch: 'C5', freq: 523.25, y: 4 },
  { pitch: 'B4', freq: 493.88, y: 5 },
  { pitch: 'A4', freq: 440.00, y: 6 },
  { pitch: 'G4', freq: 392.00, y: 7 },
  { pitch: 'F4', freq: 349.23, y: 8 },
  { pitch: 'E4', freq: 329.63, y: 9 },
  { pitch: 'D4', freq: 293.66, y: 10 },
  { pitch: 'C4', freq: 261.63, y: 11 },
];

const TICKS_PER_BEAT = 4; 
const BEATS_PER_MEASURE = 4;
const TICK_WIDTH = 40; 
const MEASURES_PER_LINE = 4;

interface SymbolType {
  id: string;
  label: string;
  durationTicks: number;
  type: 'note' | 'rest';
}

const SYMBOLS: SymbolType[] = [
  { id: 'whole', label: '𝅝', durationTicks: 16, type: 'note' },
  { id: 'half', label: '𝅗𝅥', durationTicks: 8, type: 'note' },
  { id: 'quarter', label: '𝅘𝅥', durationTicks: 4, type: 'note' },
  { id: 'eighth', label: '𝅘𝅥𝅮', durationTicks: 2, type: 'note' },
  { id: 'sixteenth', label: '𝅘𝅥𝅯', durationTicks: 1, type: 'note' },
  { id: 'whole_r', label: '𝄻', durationTicks: 16, type: 'rest' },
  { id: 'half_r', label: '𝄼', durationTicks: 8, type: 'rest' },
  { id: 'quarter_r', label: '𝄽', durationTicks: 4, type: 'rest' },
  { id: 'eighth_r', label: '𝄾', durationTicks: 2, type: 'rest' },
  { id: 'sixteenth_r', label: '𝄿', durationTicks: 1, type: 'rest' },
];

interface NoteEvent {
  id: string;
  pitchIdx: number;
  tick: number;
  durationTicks: number;
  type: 'note' | 'rest';
}

export const MusicComposer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [events, setEvents] = useState<NoteEvent[]>([]);
  const [selectedSymbolIdx, setSelectedSymbolIdx] = useState(2); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTick, setCurrentTick] = useState(-1);
  const [bpm, setBpm] = useState(97);
  const [numMeasures, setNumMeasures] = useState(8);
  const [title, setTitle] = useState('I DO ME');
  const [composer, setComposer] = useState('RYAN JHUN 외 3명');
  const [lyricist, setLyricist] = useState('[Inooeo]');
  
  const audioCtx = useRef<AudioContext | null>(null);

  const totalTicks = numMeasures * BEATS_PER_MEASURE * TICKS_PER_BEAT;

  const toggleEvent = (pitchIdx: number, tick: number) => {
    if (isPlaying) return;
    const symbol = SYMBOLS[selectedSymbolIdx];
    
    const existingIdx = events.findIndex(e => e.tick === tick && e.pitchIdx === pitchIdx);
    if (existingIdx !== -1) {
      setEvents(prev => prev.filter((_, i) => i !== existingIdx));
    } else {
      const newEvent: NoteEvent = {
        id: Math.random().toString(36).substr(2, 9),
        pitchIdx: symbol.type === 'rest' ? 5 : pitchIdx,
        tick,
        durationTicks: symbol.durationTicks,
        type: symbol.type
      };
      setEvents(prev => [...prev, newEvent]);
      if (symbol.type === 'note') playSound(PITCHES[pitchIdx].freq, 0.15);
    }
  };

  const playSound = (freq: number, duration: number) => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      const tickDur = (60 / bpm / TICKS_PER_BEAT) * 1000;
      let tick = 0;
      setCurrentTick(0);
      timer = window.setInterval(() => {
        tick++;
        if (tick >= totalTicks) {
          setIsPlaying(false);
          setCurrentTick(-1);
          clearInterval(timer);
          return;
        }
        setCurrentTick(tick);
        const curEvents = events.filter(e => e.tick === tick && e.type === 'note');
        curEvents.forEach(e => playSound(PITCHES[e.pitchIdx].freq, (e.durationTicks * (60 / bpm / TICKS_PER_BEAT))));
      }, tickDur);
    }
    return () => clearInterval(timer);
  }, [isPlaying, bpm, events, numMeasures]);

  const addMeasure = () => setNumMeasures(prev => prev + 4);

  const renderSystem = (lineIdx: number) => {
    const startTick = lineIdx * MEASURES_PER_LINE * BEATS_PER_MEASURE * TICKS_PER_BEAT;
    const ticksInLine = MEASURES_PER_LINE * BEATS_PER_MEASURE * TICKS_PER_BEAT;

    return (
      <div key={lineIdx} className="relative w-full h-[300px] mb-20 flex flex-col group">
        <div className="absolute left-0 top-[18px] flex items-center gap-2 pointer-events-none z-10">
          <span className="text-[100px] leading-none mt-[-10px]">𝄞</span>
          <div className="flex flex-col items-center leading-none text-xl font-bold translate-y-[-5px]">
            <span>4</span>
            <span>4</span>
          </div>
        </div>

        <div className="absolute inset-x-0 top-[40px] h-[155px] flex flex-col justify-between pointer-events-none border-t-[2px] border-black">
          {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-b-[2px] border-black" />)}
        </div>

        {Array.from({length: MEASURES_PER_LINE + 1}).map((_, mIdx) => (
          <div 
            key={mIdx} 
            className="absolute top-[40px] h-[155px] border-l-[2px] border-black pointer-events-none"
            style={{ left: `${mIdx * (BEATS_PER_MEASURE * TICKS_PER_BEAT * TICK_WIDTH) + (mIdx === 0 ? 0 : 0)}px` }}
          />
        ))}

        <div className="relative ml-[80px] mt-[40px]">
          {PITCHES.map((p, pIdx) => (
            <div key={p.pitch} className="h-[31px] w-full flex border-b border-black/[0.02] relative">
              {Array.from({length: ticksInLine}).map((_, tIdx) => {
                const globalTick = startTick + tIdx;
                if (globalTick >= totalTicks) return null;
                return (
                  <div 
                    key={tIdx}
                    onClick={() => toggleEvent(pIdx, globalTick)}
                    className={`w-[${TICK_WIDTH}px] flex-shrink-0 cursor-pointer hover:bg-zinc-100/50 transition-colors border-r ${tIdx % 4 === 3 ? 'border-zinc-200' : 'border-zinc-50'}`}
                    style={{ width: TICK_WIDTH }}
                  />
                );
              })}
            </div>
          ))}

          {events.filter(e => e.tick >= startTick && e.tick < startTick + ticksInLine).map((e) => {
            const symbol = SYMBOLS.find(s => s.durationTicks === e.durationTicks && s.type === e.type) || SYMBOLS[2];
            const relativeTick = e.tick - startTick;
            return (
              <div 
                key={e.id}
                className={`absolute pointer-events-none transition-all ${currentTick === e.tick ? 'text-blue-500 scale-110' : 'text-black'}`}
                style={{ 
                  left: `${relativeTick * TICK_WIDTH + 8}px`, 
                  top: `${e.pitchIdx * 31 - 10}px`,
                  zIndex: 20
                }}
              >
                <span className="text-7xl select-none leading-none">{symbol.label}</span>
                {e.type === 'note' && e.pitchIdx === 11 && (
                  <div className="absolute w-10 h-[2px] bg-black top-[45px] left-[2px]" />
                )}
              </div>
            );
          })}

          {isPlaying && currentTick >= startTick && currentTick < startTick + ticksInLine && (
            <div 
              className="absolute top-0 h-[372px] w-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-50 pointer-events-none"
              style={{ left: `${(currentTick - startTick) * TICK_WIDTH}px` }}
            />
          )}
        </div>
      </div>
    );
  };

  const numLines = Math.ceil(numMeasures / MEASURES_PER_LINE);

  return (
    <div className="w-full h-full bg-[#eee] flex font-serif overflow-hidden relative">
      <BackButton onClick={onBack} />
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r-2 border-zinc-200 flex flex-col p-6 z-30 shadow-2xl overflow-y-auto custom-scrollbar">
        <div className="mb-8 mt-14 border-b border-zinc-100 pb-4">
          <h1 className="text-2xl font-black text-zinc-800 leading-tight font-sans">Music Editor</h1>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-[10px] font-bold uppercase text-zinc-400 mb-3 tracking-widest font-sans">Palette</h2>
            <div className="grid grid-cols-2 gap-2">
              {SYMBOLS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSymbolIdx(idx)}
                  className={`h-16 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${selectedSymbolIdx === idx ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg' : 'bg-zinc-50 border-zinc-100 hover:border-zinc-300'}`}
                >
                  <span className="text-3xl leading-none">{s.label}</span>
                  <span className="text-[8px] font-bold uppercase font-sans mt-1 opacity-60">{s.id}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
             <div className="flex justify-between items-center mb-2 font-sans">
                <h2 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Tempo</h2>
                <span className="text-xs font-black">{bpm} BPM</span>
             </div>
             <input type="range" min="40" max="220" value={bpm} onChange={e => setBpm(parseInt(e.target.value))} className="w-full h-1 bg-zinc-200 rounded-full appearance-none accent-zinc-900 cursor-pointer" />
          </section>

          <section className="pt-4 space-y-3">
             <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-full py-4 rounded-xl font-sans font-black text-sm tracking-widest transition-all ${isPlaying ? 'bg-red-500 text-white shadow-red-200' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg'}`}
             >
                {isPlaying ? 'STOP PLAYBACK' : 'START PLAYBACK'}
             </button>
             <button onClick={addMeasure} className="w-full py-3 bg-[#6366f1] text-white border-2 border-[#4f46e5] rounded-xl font-sans font-bold text-xs hover:bg-[#4f46e5] transition-all shadow-md uppercase">Add 4 Measures</button>
             <button onClick={() => setEvents([])} className="w-full py-3 bg-white border-2 border-zinc-200 rounded-xl font-sans font-bold text-[10px] hover:bg-zinc-50 transition-all text-zinc-400 uppercase">Clear Score</button>
          </section>
        </div>
      </aside>

      {/* PAPER SCORE */}
      <main className="flex-1 relative flex flex-col items-center overflow-y-auto py-16 px-10 custom-scrollbar scroll-smooth">
        <div className="w-full max-w-[950px] bg-white shadow-2xl rounded-sm p-16 min-h-[1200px] border border-zinc-100 flex flex-col relative group">
          
          <div className="text-center mb-16 space-y-2">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="text-6xl font-normal text-center w-full focus:outline-none focus:bg-zinc-50 border-b border-transparent focus:border-zinc-200 py-2"
              placeholder="Title"
            />
            <div className="flex justify-between text-[13px] text-zinc-500 px-10 mt-6">
              <div className="text-left w-1/3 italic">
                 작사: <input value={lyricist} onChange={e => setLyricist(e.target.value)} className="bg-transparent focus:outline-none border-b border-transparent focus:border-zinc-200" />
              </div>
              <div className="text-right w-1/3 italic">
                 작곡: <input value={composer} onChange={e => setComposer(e.target.value)} className="bg-transparent text-right focus:outline-none border-b border-transparent focus:border-zinc-200" />
              </div>
            </div>
            <div className="mt-8 text-left px-10 font-sans font-bold text-sm">♩ = {bpm}</div>
          </div>

          <div className="flex-1 px-10">
            {Array.from({length: numLines}).map((_, i) => renderSystem(i))}
          </div>

          <div className="mt-20 flex justify-between items-end border-t border-zinc-100 pt-8 text-[11px] text-zinc-400 font-sans font-bold">
             <div>© 2025 MUSICAL SCORE EDITOR. ALL RIGHTS RESERVED.</div>
             <div className="tracking-[0.5em] uppercase">Score Sheet #1</div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f5f5f5; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #aaa; }
      `}</style>
    </div>
  );
};
