
import React, { useState } from 'react';
import { BackButton } from '../../components/BackButton';

const COLORS = ['#ffffff', '#000000', '#f43f5e', '#3b82f6', '#10b981', '#fbbf24', '#8b5cf6', '#a78bfa', '#ffedd5', '#1e293b'];
const MATERIALS = [
  { id: 'GLOSSY', label: '유광 (Glossy)', style: 'bg-opacity-100 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]' },
  { id: 'MATTE', label: '무광 (Matte)', style: 'brightness-90 contrast-75 saturate-50' },
  { id: 'AURORA', label: '오로라 (Aurora)', style: 'bg-gradient-to-tr from-pink-400/30 via-sky-300/30 to-purple-400/30 animate-pulse' },
  { id: 'LEATHER', label: '가죽 (Leather)', style: 'bg-[url("https://www.transparenttextures.com/patterns/leather.png")] opacity-40' },
  { id: 'GLASS', label: '강화유리 (Glass)', style: 'backdrop-blur-sm bg-white/10 border border-white/20' },
];
const STICKERS = ['⭐', '❤️', '🔥', '✨', '⚡', '🍀', '🍎', '🌈', '🍕', '🐱', '🎮', '🛸', '👾', '💎', '🎨', '🚀', '🎸', '🍩', '🍔', '🍦', '🌸', '🐳', '☀️', '🌙'];

interface StickerInstance {
  id: number;
  char: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export const PhoneCaseApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [caseColor, setCaseColor] = useState('#1e293b');
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [stickers, setStickers] = useState<StickerInstance[]>([]);
  const [activeSticker, setActiveSticker] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<number | null>(null);

  const addSticker = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeSticker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSticker = { 
      id: Date.now(), 
      char: activeSticker, 
      x, 
      y, 
      rotation: 0,
      scale: 1.0
    };
    setStickers([...stickers, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  const updateSelectedSticker = (updates: Partial<StickerInstance>) => {
    if (selectedStickerId === null) return;
    setStickers(stickers.map(s => s.id === selectedStickerId ? { ...s, ...updates } : s));
  };

  const removeSelected = () => {
    if (selectedStickerId === null) return;
    setStickers(stickers.filter(s => s.id !== selectedStickerId));
    setSelectedStickerId(null);
  };

  const selectedSticker = stickers.find(s => s.id === selectedStickerId);

  return (
    <div className="w-full h-full bg-[#050506] flex font-sans overflow-hidden relative text-white">
      <BackButton onClick={onBack} />
      
      {/* Sidebar Toolset */}
      <aside className="w-[380px] bg-[#0f0f11] border-r border-white/5 flex flex-col p-8 z-30 shadow-2xl relative overflow-y-auto custom-scrollbar">
        <div className="mb-10 mt-12">
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-none">CASE STUDIO <span className="text-indigo-500">PRO</span></h1>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Premium Customizer v5.0</p>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-[10px] font-black uppercase text-zinc-500 mb-5 tracking-widest flex items-center gap-2">
              <span className="w-4 h-px bg-zinc-800"></span> 01. Color Palette
            </h2>
            <div className="grid grid-cols-5 gap-2.5">
              {COLORS.map(c => (
                <button key={c} onClick={() => setCaseColor(c)} className={`w-full aspect-square rounded-full border-2 transition-all ${caseColor === c ? 'border-indigo-500 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-white/10 hover:border-white/30'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black uppercase text-zinc-500 mb-5 tracking-widest flex items-center gap-2">
              <span className="w-4 h-px bg-zinc-800"></span> 02. Finish & Material
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {MATERIALS.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setMaterial(m)} 
                  className={`py-3.5 px-5 text-left rounded-xl border font-bold text-[11px] transition-all flex justify-between items-center ${material.id === m.id ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/50 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10 text-zinc-500'}`}
                >
                  {m.label}
                  {material.id === m.id && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black uppercase text-zinc-500 mb-5 tracking-widest flex items-center gap-2">
              <span className="w-4 h-px bg-zinc-800"></span> 03. Decals & Stickers
            </h2>
            <div className="grid grid-cols-6 gap-2 bg-black/30 p-4 rounded-2xl border border-white/5">
              {STICKERS.map(s => (
                <button 
                  key={s} 
                  onClick={() => setActiveSticker(s)} 
                  className={`aspect-square text-xl flex items-center justify-center rounded-lg border transition-all ${activeSticker === s ? 'bg-indigo-500 border-indigo-300 scale-110' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {selectedSticker && (
            <section className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-5">
                 <h2 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Selected Item: {selectedSticker.char}</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase mb-2"><span>Scale</span><span>{Math.round(selectedSticker.scale * 100)}%</span></div>
                  <input type="range" min="0.5" max="3.0" step="0.1" value={selectedSticker.scale} onChange={e => updateSelectedSticker({ scale: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500" />
                </div>
                <div>
                  <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase mb-2"><span>Rotate</span><span>{selectedSticker.rotation}°</span></div>
                  <input type="range" min="-180" max="180" value={selectedSticker.rotation} onChange={e => updateSelectedSticker({ rotation: parseInt(e.target.value) })} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500" />
                </div>
                <button onClick={removeSelected} className="w-full py-3 bg-rose-500/10 text-rose-500 rounded-xl font-black text-[10px] hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest">Delete Element</button>
              </div>
            </section>
          )}

          <div className="pt-6 border-t border-white/5">
            <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-[11px] transition-all shadow-xl uppercase tracking-widest italic">Place Order / Save</button>
          </div>
        </div>
      </aside>

      {/* Main Studio View */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-10 bg-[#070708]">
        {/* Cinematic Backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative">
          {/* Smartphone Hardware Body */}
          <div 
            onClick={addSticker}
            className={`w-[300px] h-[610px] rounded-[50px] border-[10px] border-[#1a1a1c] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden transition-all duration-700 cursor-crosshair transform hover:scale-[1.01]`}
            style={{ backgroundColor: caseColor }}
          >
            {/* Minimalist Camera Island */}
            <div className="absolute top-8 left-8 w-20 h-32 bg-[#000000] rounded-[28px] p-4 flex flex-col gap-4 shadow-2xl z-40 border border-white/10">
              <div className="w-full aspect-square bg-[#08080a] rounded-full border border-white/5 flex items-center justify-center shadow-inner relative overflow-hidden">
                 <div className="w-4 h-4 bg-indigo-500/10 rounded-full border border-indigo-400/20"></div>
                 <div className="absolute top-1 right-1 w-2 h-2 bg-white/5 rounded-full blur-[1px]"></div>
              </div>
              <div className="w-full aspect-square bg-[#08080a] rounded-full border border-white/5 shadow-inner"></div>
            </div>

            {/* Premium Material Overlay */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-500 z-10 ${material.style}`}></div>

            {/* Sticker Rendering */}
            {stickers.map(s => (
              <div 
                key={s.id}
                onClick={(e) => { e.stopPropagation(); setSelectedStickerId(s.id); }}
                className={`absolute text-6xl transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-75 select-none z-30 ${selectedStickerId === s.id ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-transparent' : 'hover:scale-110'}`}
                style={{ 
                  left: s.x, 
                  top: s.y, 
                  transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
                  filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))'
                }}
              >
                {s.char}
              </div>
            ))}
          </div>
          
          {/* Shadow beneath the case */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[70%] h-8 bg-black/60 blur-3xl rounded-full"></div>
        </div>

        {/* Dynamic Studio Tip */}
        <div className="absolute bottom-10 bg-white/5 border border-white/10 px-8 py-3 rounded-full backdrop-blur-xl transition-all">
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
             {activeSticker ? `Applying Sticker: ${activeSticker}` : 'Select a sticker to decorate'}
           </p>
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}</style>
    </div>
  );
};
