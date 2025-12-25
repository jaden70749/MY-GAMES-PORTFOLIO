
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BackButton } from '../../components/BackButton';

interface Weapon {
  id: string;
  name: string;
  atk: number;
  tier: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  color: string;
  level: number;
}

const WEAPONS_DATA: Omit<Weapon, 'id' | 'level'>[] = [
  { name: '녹슨 검', atk: 5, tier: 'COMMON', color: '#94a3b8' },
  { name: '강철 검', atk: 12, tier: 'COMMON', color: '#64748b' },
  { name: '빛나는 검', atk: 25, tier: 'RARE', color: '#38bdf8' },
  { name: '불꽃 대검', atk: 50, tier: 'RARE', color: '#f87171' },
  { name: '드래곤 슬레이어', atk: 120, tier: 'EPIC', color: '#818cf8' },
  { name: '천상의 날개', atk: 300, tier: 'EPIC', color: '#fcd34d' },
  { name: '슬라임 학살자', atk: 999, tier: 'LEGENDARY', color: '#f472b6' },
];

export const SlimeRPG: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [maxExp, setMaxExp] = useState(50);
  const [gold, setGold] = useState(100);
  const [activeTab, setActiveTab] = useState<'BATTLE' | 'SHOP' | 'GACHA' | 'ENHANCE'>('BATTLE');
  const [damageNumbers, setDamageNumbers] = useState<{id: number, val: number, x: number, y: number}[]>([]);
  const [slimeType, setSlimeType] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [myWeapon, setMyWeapon] = useState<Weapon>({ id: '1', ...WEAPONS_DATA[0], level: 1 });
  const [gachaResult, setGachaResult] = useState<Weapon | null>(null);

  const totalAtk = useMemo(() => {
    return myWeapon.atk + (myWeapon.level - 1) * Math.ceil(myWeapon.atk * 0.2);
  }, [myWeapon]);

  const slimeColors = ['#6ee7b7', '#60a5fa', '#f87171', '#fbbf24', '#8b5cf6'];
  const slimeNames = ['초록 슬라임', '파랑 슬라임', '빨간 슬라임', '골드 슬라임', '다크 슬라임'];

  const attack = useCallback(() => {
    if (hp <= 0 || activeTab !== 'BATTLE') return;
    
    setIsAttacking(true);
    setTimeout(() => setIsAttacking(false), 100);

    const dmg = Math.floor(totalAtk * (0.9 + Math.random() * 0.2));
    setHp(prev => Math.max(0, prev - dmg));
    
    const id = Date.now();
    setDamageNumbers(prev => [...prev, {
      id,
      val: dmg,
      x: Math.random() * 100 - 50,
      y: Math.random() * 50 - 25
    }]);
    
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(n => n.id !== id));
    }, 800);
  }, [hp, totalAtk, activeTab]);

  useEffect(() => {
    if (hp <= 0) {
      const rewardExp = Math.floor(20 * (1 + slimeType * 0.5));
      const rewardGold = Math.floor(15 * (1 + slimeType));
      
      setExp(prev => {
        let newExp = prev + rewardExp;
        if (newExp >= maxExp) {
          setLevel(l => l + 1);
          setMaxExp(me => Math.floor(me * 1.5));
          return newExp - maxExp;
        }
        return newExp;
      });
      setGold(prev => prev + rewardGold);

      setTimeout(() => {
        const nextType = Math.floor(Math.random() * slimeColors.length);
        setSlimeType(nextType);
        const newMaxHp = 50 + (level * 30) + (nextType * 100);
        setMaxHp(newMaxHp);
        setHp(newMaxHp);
      }, 400);
    }
  }, [hp]);

  const doGacha = () => {
    if (gold < 100) return;
    setGold(prev => prev - 100);
    const rand = Math.random();
    let tierIdx = 0;
    if (rand > 0.98) tierIdx = 6;
    else if (rand > 0.9) tierIdx = 5;
    else if (rand > 0.8) tierIdx = 4;
    else if (rand > 0.6) tierIdx = 3;
    else if (rand > 0.4) tierIdx = 2;
    else if (rand > 0.2) tierIdx = 1;
    
    const newW: Weapon = { id: Date.now().toString(), ...WEAPONS_DATA[tierIdx], level: 1 };
    setGachaResult(newW);
    if (newW.atk > totalAtk) {
      setMyWeapon(newW);
    }
  };

  const enhanceWeapon = () => {
    const cost = myWeapon.level * 200;
    if (gold < cost) return;
    setGold(prev => prev - cost);
    setMyWeapon(prev => ({ ...prev, level: prev.level + 1 }));
  };

  return (
    <div className="w-full h-full bg-[#0f172a] text-white flex flex-col font-sans select-none overflow-hidden relative">
      <BackButton onClick={onBack} />
      
      {/* Header HUD */}
      <header className="bg-black/40 backdrop-blur-md p-6 border-b border-white/10 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-2xl border-2 border-white/20 shadow-lg">LV.{level}</div>
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Slime Hunter</div>
            <div className="text-xl font-black italic">PROFESSIONAL HUNTER</div>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-right">
             <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Balance</div>
             <div className="text-2xl font-black text-yellow-400">💰 {gold.toLocaleString()}</div>
          </div>
          <div className="h-10 w-px bg-white/10 mx-2"></div>
          <div className="text-right">
             <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Weapon</div>
             <div className="text-lg font-bold" style={{ color: myWeapon.color }}>{myWeapon.name} (+{myWeapon.level})</div>
          </div>
        </div>
      </header>

      {/* Main Experience */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Navigation Tabs */}
        <nav className="flex justify-center gap-2 p-4 bg-white/5 border-b border-white/5">
          {['BATTLE', 'SHOP', 'GACHA', 'ENHANCE'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-2 rounded-xl font-black text-xs transition-all border-2 ${activeTab === tab ? 'bg-white text-black border-white shadow-xl' : 'text-zinc-500 border-transparent hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          {activeTab === 'BATTLE' && (
            <div className="flex flex-col items-center gap-10">
              <div className="relative">
                <div className="text-center mb-4">
                  <div className="text-2xl font-black uppercase italic tracking-tighter text-zinc-400">{slimeNames[slimeType]}</div>
                  <div className="text-lg font-bold text-red-500 mt-2">HP: {Math.ceil(hp)} / {maxHp}</div>
                  <div className="w-64 h-4 bg-zinc-900 rounded-full overflow-hidden border-2 border-black mx-auto mt-2 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300" style={{width: `${(hp/maxHp)*100}%`}}></div>
                  </div>
                </div>

                <div 
                  onClick={attack}
                  className={`w-56 h-48 cursor-pointer transition-all duration-75 transform active:scale-90 ${isAttacking ? 'translate-y-2' : ''}`}
                >
                  <div 
                    className={`w-full h-full rounded-[50%_50%_40%_40%] border-[6px] border-black shadow-[0_20px_0_rgba(0,0,0,0.5)] transition-colors relative flex items-center justify-center`}
                    style={{ backgroundColor: slimeColors[slimeType] }}
                  >
                    <div className="flex gap-12">
                      <div className="w-5 h-5 bg-black rounded-full animate-bounce"></div>
                      <div className="w-5 h-5 bg-black rounded-full animate-bounce"></div>
                    </div>
                  </div>
                  {hp <= 0 && <div className="absolute inset-0 bg-white/40 rounded-full animate-ping"></div>}
                </div>

                {damageNumbers.map(n => (
                  <div 
                    key={n.id}
                    className="absolute text-5xl font-black text-red-500 animate-float-up pointer-events-none drop-shadow-[0_4px_0_black]"
                    style={{ left: `calc(50% + ${n.x}px)`, top: `calc(50% + ${n.y}px)` }}
                  >
                    -{n.val}
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center space-y-2">
                 <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-xs">Total Attack Power: {totalAtk}</p>
                 <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mx-auto">
                    <div className="h-full bg-emerald-500" style={{ width: `${(exp/maxExp)*100}%` }}></div>
                 </div>
                 <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Experience Points</p>
              </div>
            </div>
          )}

          {activeTab === 'SHOP' && (
             <div className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white/5 p-8 rounded-3xl border-2 border-white/10 hover:border-emerald-500 transition-all group">
                 <div className="text-4xl mb-4">🍗</div>
                 <h3 className="text-xl font-black mb-1">고기 세트</h3>
                 <p className="text-sm text-zinc-400 mb-6">즉시 경험치를 100 획득합니다.</p>
                 <button onClick={() => { if(gold >= 300) { setGold(g => g-300); setExp(e => e+100); } }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black shadow-lg">구매 (💰300)</button>
               </div>
               <div className="bg-white/5 p-8 rounded-3xl border-2 border-white/10 hover:border-yellow-500 transition-all group">
                 <div className="text-4xl mb-4">🍯</div>
                 <h3 className="text-xl font-black mb-1">슬라임 꿀</h3>
                 <p className="text-sm text-zinc-400 mb-6">골드 획득량이 영구히 5% 증가합니다.</p>
                 <button className="w-full py-4 bg-zinc-700 opacity-50 cursor-not-allowed rounded-2xl font-black shadow-lg">매진됨</button>
               </div>
             </div>
          )}

          {activeTab === 'GACHA' && (
            <div className="text-center flex flex-col items-center">
              <div className="w-48 h-48 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[3rem] shadow-2xl border-8 border-white/10 mb-10 flex items-center justify-center text-7xl animate-pulse">🎁</div>
              <h2 className="text-3xl font-black mb-2 italic">LUCKY WEAPON BOX</h2>
              <p className="text-zinc-500 font-bold text-sm mb-10 uppercase tracking-widest">Try your luck for Legendary items</p>
              <button 
                onClick={doGacha}
                className="px-16 py-6 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-2xl rounded-3xl shadow-[0_12px_0_#ca8a04] active:translate-y-2 active:shadow-none transition-all"
              >
                OPEN BOX (💰100)
              </button>

              {gachaResult && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] animate-in fade-in zoom-in duration-300">
                  <div className="bg-zinc-900 p-12 rounded-[4rem] border-8 border-white/10 text-center flex flex-col items-center shadow-2xl">
                    <div className="text-sm font-black uppercase tracking-widest mb-4 opacity-50" style={{ color: gachaResult.color }}>You Got New Item!</div>
                    <div className="text-9xl mb-10 drop-shadow-2xl">⚔️</div>
                    <h2 className="text-5xl font-black italic mb-2 tracking-tighter uppercase" style={{ color: gachaResult.color }}>{gachaResult.name}</h2>
                    <p className="text-xl font-bold text-zinc-400 mb-12">ATK: {gachaResult.atk}</p>
                    <button 
                      onClick={() => setGachaResult(null)}
                      className="px-12 py-4 bg-white text-black font-black rounded-2xl text-xl hover:scale-110 transition-transform"
                    >
                      CONFIRM
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ENHANCE' && (
            <div className="text-center w-full max-w-lg">
               <div className="bg-zinc-900 p-10 rounded-[3rem] border-4 border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                  <div className="text-6xl mb-6">⚒️</div>
                  <h3 className="text-3xl font-black mb-2 italic" style={{ color: myWeapon.color }}>{myWeapon.name} (+{myWeapon.level})</h3>
                  <div className="flex justify-center gap-10 mb-10">
                    <div className="text-center">
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current ATK</div>
                      <div className="text-2xl font-black text-white">{totalAtk}</div>
                    </div>
                    <div className="text-zinc-600 text-3xl font-black flex items-center">→</div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Next ATK</div>
                      <div className="text-2xl font-black text-emerald-400">{totalAtk + Math.ceil(myWeapon.atk * 0.2)}</div>
                    </div>
                  </div>
                  <button 
                    onClick={enhanceWeapon}
                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 rounded-3xl font-black text-xl shadow-[0_10px_0_#059669] active:translate-y-2 active:shadow-none transition-all"
                  >
                    UPGRADE (💰{(myWeapon.level * 200).toLocaleString()})
                  </button>
                  <p className="mt-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Success Rate: 100%</p>
               </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
