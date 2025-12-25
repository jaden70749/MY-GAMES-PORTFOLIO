
import React, { useState } from 'react';
import { BackButton } from '../../components/BackButton';

interface RankResult {
  name: string;
  rank: number;
}

export const PickApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [items, setItems] = useState<string[]>(['참가자 A', '참가자 B', '참가자 C', '참가자 D']);
  const [inputValue, setInputValue] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [rankings, setRankings] = useState<RankResult[]>([]);

  const addItem = () => {
    if (inputValue.trim()) {
      setItems([...items, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const startRankingDraw = () => {
    if (items.length < 2 || isRolling) return;
    setIsRolling(true);
    setRankings([]);

    let count = 0;
    const interval = setInterval(() => {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      setRankings(shuffled.map((name, i) => ({ name, rank: i + 1 })));
      count++;

      if (count > 30) {
        clearInterval(interval);
        const finalShuffled = [...items].sort(() => Math.random() - 0.5);
        setRankings(finalShuffled.map((name, i) => ({ name, rank: i + 1 })));
        setIsRolling(false);
      }
    }, 50);
  };

  return (
    <div className="w-full h-full bg-[#fdf6e3] flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
      <BackButton onClick={onBack} />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 h-full max-h-[85vh]">
        {/* Input Section */}
        <div className="bg-white border-[6px] border-black rounded-[2.5rem] p-8 shadow-[16px_16px_0px_black] flex flex-col overflow-hidden">
          <h1 className="text-5xl font-black text-black mb-2 tracking-tighter uppercase italic">제비뽑기 Pro</h1>
          <p className="text-zinc-400 font-bold text-sm mb-6 uppercase tracking-widest">Premium Drawing Tool</p>
          
          <div className="flex gap-3 mb-6">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="참가자 이름을 입력하세요..."
              className="flex-1 border-4 border-black px-6 py-4 rounded-2xl text-xl font-bold focus:outline-none focus:bg-yellow-50 transition-colors shadow-inner"
            />
            <button onClick={addItem} className="bg-[#fbbf24] border-4 border-black px-8 py-4 rounded-2xl font-black text-xl hover:translate-y-[-4px] active:translate-y-0 shadow-[4px_4px_0px_black] active:shadow-none transition-all">ADD</button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar border-4 border-dashed border-zinc-200 rounded-[2rem] p-6 bg-zinc-50 mb-6">
            <div className="flex flex-wrap gap-3">
              {items.map((item, i) => (
                <div key={i} className="bg-white border-[3px] border-black px-5 py-2.5 rounded-xl font-black flex items-center gap-3 group animate-in zoom-in duration-200 shadow-[4px_4px_0px_black]">
                  {item}
                  <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 font-black">×</button>
                </div>
              ))}
              {items.length === 0 && <p className="text-zinc-300 font-black p-4 text-center w-full uppercase italic">참가자가 없습니다</p>}
            </div>
          </div>

          <button 
            onClick={startRankingDraw}
            disabled={isRolling || items.length < 2}
            className="w-full py-6 bg-[#ff6b00] text-white border-[6px] border-black rounded-[2rem] font-black text-4xl shadow-[8px_8px_0px_black] active:shadow-none active:translate-y-2 transition-all uppercase italic disabled:opacity-50"
          >
            {isRolling ? '추첨 중...' : '추첨 시작'}
          </button>
        </div>

        {/* Results Section */}
        <div className="bg-white border-[6px] border-black rounded-[2.5rem] p-8 shadow-[16px_16px_0px_#22c55e] flex flex-col overflow-hidden">
          <h2 className="text-4xl font-black text-black mb-6 tracking-tighter uppercase italic border-b-4 border-black pb-4 flex justify-between items-center">
            최종 순위
            {isRolling && <span className="text-sm font-bold bg-black text-white px-3 py-1 rounded animate-pulse">SHUFFLING</span>}
          </h2>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {rankings.length === 0 && !isRolling && (
              <div className="h-full flex flex-col items-center justify-center opacity-10">
                <span className="text-[12rem] mb-4">👑</span>
                <p className="font-black text-2xl uppercase italic">The Winner Is...</p>
              </div>
            )}
            {rankings.map((r, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-5 p-5 border-4 border-black rounded-2xl transition-all duration-300 transform ${isRolling ? 'opacity-40 blur-[2px]' : 'bg-white translate-x-0 shadow-[6px_6px_0px_black]'} ${i === 0 ? 'bg-yellow-50 border-yellow-500' : ''}`}
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <div className={`w-14 h-14 flex items-center justify-center rounded-2xl font-black text-3xl border-4 border-black shadow-[3px_3px_0px_black] ${i === 0 ? 'bg-[#fbbf24]' : i === 1 ? 'bg-zinc-300' : i === 2 ? 'bg-[#cd7f32]' : 'bg-white'}`}>
                  {r.rank}
                </div>
                <div className="text-3xl font-black uppercase italic truncate flex-1 tracking-tight text-slate-800">{r.name}</div>
                {!isRolling && (
                    <div className="text-2xl">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
