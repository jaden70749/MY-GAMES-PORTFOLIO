
import React, { useState, useRef } from 'react';
import { BackButton } from '../../components/BackButton';

const COLORS = ['#ffffff', '#18181b', '#f43f5e', '#3b82f6', '#10b981', '#fbbf24', '#8b5cf6', '#a78bfa', '#ffedd5'];
const MATERIALS = [
  { id: 'GLOSSY', label: '광택 (Glossy)', style: 'backdrop-blur-none bg-opacity-100' },
  { id: 'MATTE', label: '무광 (Matte)', style: 'brightness-90 saturate-50' },
  { id: 'FROSTED', label: '프로스트 (Frosted)', style: 'opacity-80 backdrop-blur-sm' },
];
const STICKERS = ['⭐', '❤️', '🔥', '✨', '⚡', '🍀', '🍎', '🌈', '🍕', '🐱', '🎮', '🛸', '👾', '💎', '🎨'];

export const PhoneCaseApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [caseColor, setCaseColor] = useState('#ffffff');
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [stickers, setStickers] = useState<{id: number, char: string, x: number, y: number, rotation: number, scale: number}[]>([]);
  const [activeSticker, setActiveSticker] = useState<string | null>(null);

  const addSticker = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeSticker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStickers([...stickers, { 
      id: Date.now(), 
      char: activeSticker, 
      x, 
      y, 
      rotation: (Math.random() - 0.5) * 40,
      scale: 0.8 + Math.random() * 0.4
    }]);
  };

  const removeSticker = (id: number) => {
    setStickers(stickers.filter(s => s.id !== id));
  };

  return (
    <div className="w-full h-full bg-[#fef2f2] flex font-sans overflow-hidden relative">
      <BackButton onClick={onBack} />
      
      {/* Sidebar Controls */}
      <aside className="w-[380px] bg-white border-r border-zinc-200 flex flex-col p-10 z-30 shadow-2xl relative">
        <div className="mb-12 mt-8">
          <h1 className="text-4xl font-black text-rose-500 italic tracking-tighter leading-none uppercase">Case Studio</h1>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-4">Premium Customization Tool</p>
          <div className="h-1 w-12 bg-rose-500 mt-4 rounded-full"></div>
        </div>

        <div className="flex-1 space-y-12 overflow-y-auto custom-scrollbar pr-4">
          <section>
            <h2 className="text-[11px] font-black uppercase text-zinc-400 mb-5 tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              Color Palette
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map(c => (
                <button 
                  key={c}
                  onClick={() => setCaseColor(c)}
                  className={`w-full aspect-square rounded-full border-4 transition-all hover:scale-110 shadow-sm ${caseColor === c ? 'border-rose-500 scale-110 shadow-lg' : 'border-zinc-50'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-black uppercase text-zinc-400 mb-5 tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              Material Texture
            </h2>
            <div className="space-y-2">
              {MATERIALS.map(m => (
                <button 
                  key={m.id}
                  onClick={() => setMaterial(m)}
                  className={`w-full py-4 px-6 text-left rounded-2xl border-2 font-black text-sm transition-all ${material.id === m.id ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl' : 'bg-zinc-50 border-transparent hover:bg-zinc-100 text-zinc-500'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-black uppercase text-zinc-400 mb-5 tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              Premium Stickers
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {STICKERS.map(s => (
                <button 
                  key={s}
                  onClick={() => setActiveSticker(activeSticker === s ? null : s)}
                  className={`w-full aspect-square text-2xl flex items-center justify-center rounded-2xl border-2 transition-all ${activeSticker === s ? 'bg-rose-50 border-rose-500 scale-110 shadow-lg' : 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {activeSticker && <p className="text-[10px] font-black text-rose-500 mt-6 animate-pulse uppercase text-center bg-rose-50 py-2 rounded-lg">Tap on the case to place!</p>}
          </section>

          <section className="pt-8 border-t border-zinc-100 space-y-4">
            <button onClick={() => setStickers([])} className="w-full py-4 text-zinc-400 font-black rounded-2xl text-xs hover:bg-zinc-50 transition-all uppercase tracking-widest">Clear All Design</button>
            <button className="w-full py-5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-[2rem] text-sm transition-all shadow-[0_12px_0_#be185d] active:translate-y-2 active:shadow-none uppercase tracking-widest">ORDER MY CASE</button>
          </section>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 relative flex items-center justify-center p-16 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-400 opacity-10 blur-[120px] animate-pulse rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400 opacity-10 blur-[120px] animate-pulse delay-1000 rounded-full"></div>

        <div className="relative group perspective-1000">
          {/* Subtle Reflection Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none rounded-[55px] bg-gradient-to-br from-white/20 via-transparent to-black/10"></div>
          
          {/* Phone Frame Design */}
          <div 
            onClick={addSticker}
            className={`w-[340px] h-[680px] rounded-[55px] border-[14px] border-zinc-900 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden transition-all duration-700 cursor-crosshair transform hover:scale-[1.02] group-hover:rotate-x-2 group-hover:rotate-y-2`}
            style={{ backgroundColor: caseColor }}
          >
            {/* Camera Module - Modern Style */}
            <div className="absolute top-10 left-10 w-24 h-36 bg-zinc-900/90 rounded-[35px] p-5 flex flex-col gap-6 shadow-inner z-30">
              <div className="w-full aspect-square bg-gradient-to-br from-zinc-800 to-black rounded-full border border-white/5 flex items-center justify-center">
                 <div className="w-4 h-4 bg-blue-900/30 rounded-full blur-[1px]"></div>
              </div>
              <div className="w-full aspect-square bg-gradient-to-br from-zinc-800 to-black rounded-full border border-white/5 flex items-center justify-center">
                 <div className="w-4 h-4 bg-blue-900/30 rounded-full blur-[1px]"></div>
              </div>
            </div>

            {/* Logo Silhouette (Subtle) */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-black/10 text-xl font-black tracking-widest uppercase italic">PREMIUM</div>

            {/* Material Effects Overlay */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-500 z-10 ${material.style}`}>
                {material.id === 'GLOSSY' && (
                    <div className="absolute top-0 left-0 w-full h-[200%] bg-gradient-to-b from-white/10 via-transparent to-transparent -translate-y-1/2 rotate-12"></div>
                )}
            </div>

            {/* Placed Stickers */}
            {stickers.map(s => (
              <div 
                key={s.id}
                onClick={(e) => { e.stopPropagation(); removeSticker(s.id); }}
                className="absolute text-5xl transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 hover:rotate-12 transition-all drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)] z-40 active:scale-90"
                style={{ 
                  left: s.x, 
                  top: s.y, 
                  transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})` 
                }}
              >
                {s.char}
              </div>
            ))}
          </div>

          {/* Floor Shadow Decoration */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-black/10 blur-2xl rounded-full"></div>
        </div>
        
        {/* Floating Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-zinc-200 px-6 py-3 rounded-full shadow-lg pointer-events-none animate-bounce">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            <span className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Real-time Design Preview Mode</span>
        </div>
      </main>

      <style>{`
        .perspective-1000 { perspective: 1400px; }
        .rotate-x-2 { transform: rotateX(2deg); }
        .rotate-y-2 { transform: rotateY(2deg); }
      `}</style>
    </div>
  );
};
