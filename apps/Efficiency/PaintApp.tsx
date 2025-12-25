
import React, { useRef, useState, useEffect } from 'react';
import { BackButton } from '../../components/BackButton';

export const PaintApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [opacity, setOpacity] = useState(1);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [isEraser, setIsEraser] = useState(false);

  const colors = [
    '#000000', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#ff00ff', '#00ffff', '#ff6b00',
    '#8b5cf6', '#ec4899', '#ffffff'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const tempImage = canvas.toDataURL();
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.src = tempImage;
        img.onload = () => ctx.drawImage(img, 0, 0);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setUndoStack(prev => [...prev, canvas.toDataURL()].slice(-30));
    }
  };

  const undo = () => {
    if (undoStack.length < 2) return;
    const newStack = [...undoStack];
    newStack.pop();
    const lastState = newStack[newStack.length - 1];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && lastState) {
      const img = new Image();
      img.src = lastState;
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      setUndoStack(newStack);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    saveState();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.globalAlpha = isEraser ? 1 : opacity;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div className="w-full h-full bg-[#18181b] flex font-sans select-none overflow-hidden relative">
      <BackButton onClick={onBack} />
      
      {/* LEFT TOOLBAR */}
      <aside className="w-72 bg-white border-r-2 border-zinc-800 p-6 flex flex-col z-30 shadow-2xl">
        <div className="mb-8 mt-14">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">그림판 Studio</h1>
          <div className="h-1 w-10 bg-rose-500 mt-2"></div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
          <section>
            <h2 className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-widest border-b border-zinc-100 pb-1">Colors</h2>
            <div className="grid grid-cols-4 gap-2">
              {colors.map(c => (
                <button 
                  key={c}
                  onClick={() => { setColor(c); setIsEraser(false); }}
                  className={`w-full aspect-square rounded-lg border-2 border-zinc-200 transition-all ${color === c && !isEraser ? 'scale-110 shadow-lg ring-2 ring-zinc-900' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <button onClick={() => setIsEraser(!isEraser)} className={`w-full aspect-square flex items-center justify-center rounded-lg border-2 border-zinc-200 text-xl transition-all ${isEraser ? 'bg-zinc-900 text-white' : 'bg-zinc-50'}`}>🧽</button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest"><span>Size</span><span>{brushSize}px</span></div>
                <input type="range" min="1" max="60" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-zinc-200 rounded-full appearance-none accent-zinc-900 cursor-pointer" />
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest"><span>Opacity</span><span>{Math.round(opacity * 100)}%</span></div>
                <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-zinc-200 rounded-full appearance-none accent-zinc-900 cursor-pointer" />
            </div>
          </section>

          <section className="pt-4 space-y-2">
             <button onClick={undo} disabled={undoStack.length < 2} className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-bold text-xs transition-all disabled:opacity-30 uppercase">Undo</button>
             <button onClick={() => { if(confirm('Clear?')) { const c=canvasRef.current; if(c){const ctx=c.getContext('2d')!; ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); saveState(); }} }} className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-bold text-xs transition-all uppercase">Clear</button>
             <button onClick={() => { const a = document.createElement('a'); a.download=`draw.png`; a.href=canvasRef.current!.toDataURL(); a.click(); }} className="w-full py-4 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl font-black text-sm transition-all shadow-lg uppercase italic tracking-widest">Export PNG</button>
          </section>
        </div>
      </aside>

      <main className="flex-1 bg-[#121212] relative p-10 overflow-hidden flex items-center justify-center">
        <div className="w-full h-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden cursor-crosshair relative">
           <canvas 
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={draw}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="w-full h-full touch-none"
           />
        </div>
      </main>
    </div>
  );
};
