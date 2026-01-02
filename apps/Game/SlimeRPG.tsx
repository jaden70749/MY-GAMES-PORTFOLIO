
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
  { name: '강철 검', atk: 15, tier: 'COMMON', color: '#64748b' },
  { name: '빛나는 검', atk: 35, tier: 'RARE', color: '#38bdf8' },
  { name: '불꽃 대검', atk: 70, tier: 'RARE', color: '#f87171' },
  { name: '드래곤 슬레이어', atk: 180, tier: 'EPIC', color: '#818cf8' },
  { name: '천상의 날개', atk: 450, tier: 'EPIC', color: '#fcd34d' },
  { name: '슬라임 학살자', atk: 1500, tier: 'LEGENDARY', color: '#f472b6' },
];

export const SlimeRPG: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [level, setLevel] = useState(1);
  const [stage, setStage] = useState(1);
  const [subStage, setSubStage] = useState(1);
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
    return myWeapon.atk + (myWeapon.level - 1) * Math.ceil(myWeapon.atk * 0.25);
  }, [myWeapon]);

  const slimeColors = ['#6ee7b7', '#60a5fa', '#f87171', '#fbbf24', '#8b5cf6'];
  const slimeNames = ['숲 슬라임', '물 슬라임', '용암 슬라임', '번개 슬라임', '심연 슬라임'];
  const isBoss = subStage === 10;

  const attack = useCallback(() => {
    if (hp <= 0 || activeTab !== 'BATTLE') return;
    setIsAttacking(true);
    setTimeout(() => setIsAttacking(false), 80);

    const dmg = Math.floor(totalAtk * (0.9 + Math.random() * 0.2));
    setHp(prev => Math.max(0, prev - dmg));
    
    const id = Date.now();
    setDamageNumbers(prev => [...prev, { id, val: dmg, x: Math.random() * 60 - 30, y: Math.random() * 30 - 15 }]);
    setTimeout(() => setDamageNumbers(prev => prev.filter(n => n.id !== id)), 500);
  }, [hp, totalAtk, activeTab]);

  useEffect(() => {
    if (hp <= 0) {
      const rewardExp = Math.floor((20 + stage * 10) * (isBoss ? 5 : 1));
      const rewardGold = Math.floor((15 + stage * 5) * (isBoss ? 8 : 1));
      
      setExp(prev => {
        let newExp = prev + rewardExp;
        if (newExp >= maxExp) {
          setLevel(l => l + 1);
          setMaxExp(me => Math.floor(me * 1.4));
          return newExp - maxExp;
        }
        return newExp;
      });
      setGold(prev => prev + rewardGold);

      setTimeout(() => {
        let nextSub = subStage + 1;
        let nextStage = stage;
        if (nextSub > 10) {
          nextSub = 1;
          nextStage++;
        }
        setSubStage(nextSub);
        setStage(nextStage);

        const nextType = Math.floor(Math.random() * slimeColors.length);
        setSlimeType(nextType);
        
        const newMaxHp = Math.floor((80 + (nextStage * 50) + (nextSub * 20)) * (nextSub === 10 ? 4 : 1));
        setMaxHp(newMaxHp);
        setHp(newMaxHp);
      }, 300);
    }
  }, [hp]);

  const doGacha = () => {
    if (gold < 200) return;
    setGold(prev => prev - 200);
    const rand = Math.random();
    let tierIdx = 0;
    if (rand > 0.99) tierIdx = 6;
    else if (rand > 0.95) tierIdx = 5;
    else if (rand > 0.85) tierIdx = 4;
    else if (rand > 0.7) tierIdx = 3;
    else if (rand > 0.5) tierIdx = 2;
    else if (rand > 0.25) tierIdx = 1;
    
    const newW: Weapon = { id: Date.now().toString(), ...WEAPONS_DATA[tierIdx], level: 1 };
    setGachaResult(newW);
    if (newW.atk > myWeapon.atk) setMyWeapon(newW);
  };

  return (
    <div className="w-full h-full bg-[#020617] text-white flex flex-col font-sans select-none overflow-hidden relative">
      <BackButton onClick={onBack} />
      
      <header className="bg-black/80 backdrop-blur-xl p-4 border-b border-white/10 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-xl flex items-center justify-center font-black text-lg border border-white/10">L.{level}</div>
          <div>
            <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">MISSION PROGRESS</div>
            <div className="text-sm font-black italic">STAGE {stage}-{subStage} {isBoss && <span className="text-rose-500 animate-pulse ml-1">[BOSS]</span>}</div>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
             <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">WALLET</div>
             <div className="text-lg font-black text-yellow-400">💰 {gold.toLocaleString()}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        <nav className="flex justify-center gap-2 p-3 bg-white/5 border-b border-white/5 shrink-0">
          {['BATTLE', 'SHOP', 'GACHA', 'ENHANCE'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-1.5 rounded-xl font-black text-[10px] transition-all border ${activeTab === tab ? 'bg-white text-black border-white shadow-lg' : 'text-zinc-500 border-transparent hover:text-white hover:bg-white/10'}`}>
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          {activeTab === 'BATTLE' && (
            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
              <div className="w-full space-y-1.5">
                 <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-60">
                    <span>PROGRESS</span>
                    <span>{subStage} / 10</span>
                 </div>
                 <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${subStage * 10}%` }}></div>
                 </div>
              </div>

              <div className="relative">
                <div className="text-center mb-4">
                  <div className={`text-2xl font-black uppercase italic tracking-tighter ${isBoss ? 'text-rose-500 scale-105' : 'text-zinc-400'}`}>{slimeNames[slimeType]}</div>
                  <div className="text-sm font-bold text-red-500 mt-1">HP: {Math.ceil(hp).toLocaleString()}</div>
                  <div className="w-56 h-3 bg-zinc-900 rounded-full overflow-hidden border border-black mx-auto mt-2">
                    <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300" style={{width: `${(hp/maxHp)*100}%`}}></div>
                  </div>
                </div>

                <div onClick={attack} className={`cursor-pointer transition-all duration-75 transform active:scale-95 ${isAttacking ? 'translate-y-2' : ''}`}>
                  <div 
                    className={`rounded-[50%_50%_40%_40%] border-[4px] border-black shadow-[0_15px_0_rgba(0,0,0,0.5)] transition-all relative flex items-center justify-center ${isBoss ? 'w-56 h-52' : 'w-48 h-44'}`}
                    style={{ backgroundColor: slimeColors[slimeType] }}
                  >
                    <div className={`flex gap-10 ${isBoss ? 'scale-125' : ''}`}>
                      <div className="w-4 h-4 bg-black rounded-full animate-pulse"></div>
                      <div className="w-4 h-4 bg-black rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {damageNumbers.map(n => (
                  <div key={n.id} className="absolute text-3xl font-black text-red-500 animate-float-up pointer-events-none drop-shadow-[0_2px_0_black]" style={{ left: `calc(50% + ${n.x}px)`, top: `calc(50% + ${n.y}px)` }}>
                    -{n.val.toLocaleString()}
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center space-y-2 w-full">
                 <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex justify-between">
                    <span>ATK: {totalAtk.toLocaleString()}</span>
                    <span>EXP {Math.floor((exp/maxExp)*100)}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(exp/maxExp)*100}%` }}></div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'SHOP' && (
             <div className="max-w-md w-full grid grid-cols-1 gap-4">
               <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 hover:border-emerald-500 transition-all flex items-center gap-6">
                 <div className="text-4xl">🥩</div>
                 <div className="flex-1">
                    <h3 className="text-lg font-black">고급 몬스터 고기</h3>
                    <p className="text-[10px] text-zinc-500">경험치 +40%</p>
                 </div>
                 <button onClick={() => { if(gold >= 1000) { setGold(g => g-1000); setExp(e => e + maxExp * 0.4); } }} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-xs">💰1,000</button>
               </div>
             </div>
          )}

          {activeTab === 'GACHA' && (
            <div className="text-center flex flex-col items-center max-w-sm w-full">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-3xl shadow-xl border-4 border-white/10 mb-8 flex items-center justify-center text-5xl animate-pulse">🗡️</div>
              <h2 className="text-xl font-black mb-1 italic">MYTHIC GACHA</h2>
              <p className="text-zinc-500 font-bold text-[10px] mb-8 uppercase tracking-widest">Equipped: <span style={{color: myWeapon.color}}>{myWeapon.name}</span></p>
              <button onClick={doGacha} className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-lg rounded-2xl shadow-[0_8px_0_#ca8a04] active:translate-y-1 active:shadow-none transition-all uppercase italic">OPEN (💰200)</button>

              {gachaResult && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] animate-in fade-in zoom-in duration-200">
                  <div className="bg-zinc-900 p-10 rounded-[2.5rem] border-4 border-white/10 text-center flex flex-col items-center">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: gachaResult.color }}>You found a item!</div>
                    <div className="text-8xl mb-6">⚔️</div>
                    <h2 className="text-4xl font-black italic mb-2 tracking-tighter uppercase" style={{ color: gachaResult.color }}>{gachaResult.name}</h2>
                    <p className="text-lg font-bold text-zinc-400 mb-10">ATK: {gachaResult.atk}</p>
                    <button onClick={() => setGachaResult(null)} className="px-12 py-3 bg-white text-black font-black rounded-xl text-lg hover:scale-105 transition-transform">OK</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ENHANCE' && (
            <div className="text-center w-full max-w-xs">
               <div className="bg-zinc-900/80 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                  <div className="text-5xl mb-6">🛠️</div>
                  <h3 className="text-xl font-black mb-4 italic" style={{ color: myWeapon.color }}>{myWeapon.name} <span className="opacity-40">+{myWeapon.level}</span></h3>
                  <div className="flex justify-between items-center mb-8 px-4">
                    <div className="text-center">
                      <div className="text-[8px] font-black text-zinc-500 uppercase">Current</div>
                      <div className="text-lg font-black">{totalAtk.toLocaleString()}</div>
                    </div>
                    <div className="text-emerald-500 font-black">→</div>
                    <div className="text-center">
                      <div className="text-[8px] font-black text-emerald-500 uppercase">Next</div>
                      <div className="text-lg font-black text-emerald-400">{(totalAtk + Math.ceil(myWeapon.atk * 0.25)).toLocaleString()}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { const cost = myWeapon.level * 300; if(gold >= cost) { setGold(g => g - cost); setMyWeapon(prev => ({ ...prev, level: prev.level + 1 })); } }}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-sm shadow-[0_6px_0_#065f46] active:translate-y-1 active:shadow-none transition-all uppercase"
                  >
                    UPGRADE (💰{(myWeapon.level * 300).toLocaleString()})
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
        .animate-float-up { animation: float-up 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};
