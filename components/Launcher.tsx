
import React from 'react';
import { AppCardData, AppRoute, AppCategory } from '../types';
import { APP_CARDS } from '../constants';

interface LauncherProps {
  onLaunch: (route: AppRoute) => void;
  selectedCategory: AppCategory;
}

const GameThumbnail: React.FC<{ appId: AppRoute }> = ({ appId }) => {
  if (appId === AppRoute.AI_DETECTIVE) {
    return (
      <div className="w-full h-full relative bg-slate-900 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent)]" />
          <div className="flex flex-col items-center gap-3">
             <span className="text-8xl drop-shadow-[0_10px_30px_rgba(59,130,246,0.5)]">🔦</span>
             <div className="flex gap-1.5 animate-pulse">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="w-2 h-2 bg-blue-500 rounded-full [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full [animation-delay:0.4s]" />
             </div>
          </div>
          <div className="absolute bottom-4 text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] shadow-black drop-shadow-lg italic">Bureau of AI Investigation</div>
      </div>
    );
  }
  if (appId === AppRoute.AI_CHAT) {
    return (
      <div className="w-full h-full relative bg-blue-600 flex items-center justify-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-400 rounded-full blur-[60px] opacity-50" />
          <span className="text-8xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">💬</span>
          <div className="absolute top-4 right-4 bg-white text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-xl">Smart Gemini</div>
      </div>
    );
  }
  if (appId === AppRoute.AI_WRITER) {
    return (
      <div className="w-full h-full relative bg-violet-600 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)]" />
          <div className="flex flex-col items-center gap-4">
            <span className="text-8xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">🖋️</span>
            <div className="flex gap-2">
               <div className="w-8 h-2 bg-white/20 rounded-full animate-pulse" />
               <div className="w-12 h-2 bg-white/40 rounded-full animate-pulse [animation-delay:0.2s]" />
               <div className="w-6 h-2 bg-white/20 rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
          <div className="absolute bottom-4 text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Professional Writing AI</div>
      </div>
    );
  }
  if (appId === AppRoute.SHAPE_STACKER) {
    return (
      <div className="w-full h-full relative bg-amber-400 flex items-center justify-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <div className="w-16 h-8 bg-blue-500 border-4 border-black rotate-3"></div>
            <div className="w-12 h-12 bg-rose-500 border-4 border-black -rotate-6"></div>
            <div className="w-20 h-10 bg-emerald-500 border-4 border-black"></div>
          </div>
          <div className="absolute bottom-4 text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Physics Stacker</div>
      </div>
    );
  }
  if (appId === AppRoute.SLIME_RPG) {
    return (
      <div className="w-full h-full relative bg-emerald-500 flex items-center justify-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-24 bg-green-300 rounded-[50%_50%_30%_30%] border-4 border-black shadow-[0_10px_0_rgba(0,0,0,0.2)]">
            <div className="absolute top-8 left-6 w-3 h-3 bg-black rounded-full"></div>
            <div className="absolute top-8 right-6 w-3 h-3 bg-black rounded-full"></div>
          </div>
          <div className="absolute bottom-4 text-white font-black text-xs uppercase tracking-widest">Lv. 99 Slime Mastery</div>
      </div>
    );
  }
  if (appId === AppRoute.PHONE_CASE_APP) {
    return (
      <div className="w-full h-full relative bg-pink-400 flex items-center justify-center overflow-hidden">
          <div className="w-20 h-40 bg-white rounded-3xl border-4 border-black relative">
            <div className="absolute top-4 right-4 w-4 h-8 bg-zinc-800 rounded-md"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl drop-shadow-lg">✨</span>
            </div>
          </div>
      </div>
    );
  }
  if (appId === AppRoute.BLUE_SCREEN) {
    return (
      <div className="w-full h-full relative bg-[#0078d7] flex items-center justify-center overflow-hidden font-mono p-4">
          <div className="text-white">
            <div className="text-4xl mb-2">:(</div>
            <div className="text-[8px] leading-tight opacity-80 uppercase">Your PC ran into a problem and needs to restart...</div>
          </div>
      </div>
    );
  }
  if (appId === AppRoute.TANK_GAME) {
    return (
      <div className="w-full h-full relative bg-[#3b82f6] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,#ffffff_25%,transparent_25%,transparent_50%,#ffffff_50%,#ffffff_75%,transparent_75%,transparent)] bg-[size:20px_20px]"></div>
          <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]">
             <rect x="20" y="25" width="15" height="50" rx="4" fill="#1e293b" stroke="#000" strokeWidth="3" />
             <rect x="65" y="25" width="15" height="50" rx="4" fill="#1e293b" stroke="#000" strokeWidth="3" />
             <rect x="30" y="30" width="40" height="40" rx="6" fill="#60a5fa" stroke="#000" strokeWidth="4" />
             <circle cx="50" cy="50" r="12" fill="#2563eb" stroke="#000" strokeWidth="4" />
          </svg>
      </div>
    );
  }
  if (appId === AppRoute.STACK_GAME) {
    return (
      <div className="w-full h-full relative bg-[#10b981] overflow-hidden flex items-center justify-center">
          <div className="flex flex-col gap-1 items-center">
              <div className="w-24 h-8 bg-emerald-200 border-3 border-black translate-x-3 shadow-[4px_4px_0px_black]"></div>
              <div className="w-24 h-8 bg-emerald-400 border-3 border-black -translate-x-3 shadow-[4px_4px_0px_black]"></div>
              <div className="w-24 h-8 bg-emerald-600 border-3 border-black translate-x-1 shadow-[4px_4px_0px_black]"></div>
          </div>
      </div>
    );
  }
  if (appId === AppRoute.GUITAR_GAME) {
    return (
      <div className="w-full h-full relative bg-[#f59e0b] flex items-center justify-center">
          <span className="text-8xl filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">🎸</span>
      </div>
    );
  }
  if (appId === AppRoute.MUSIC_COMPOSER) {
    return (
      <div className="w-full h-full relative bg-[#6366f1] flex items-center justify-center overflow-hidden">
          <div className="flex flex-col gap-3 w-full px-8">
              {[1, 2, 3].map(i => (
                  <div key={i} className="w-full border-t-4 border-black/20" />
              ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl text-white font-black drop-shadow-[6px_6px_0_black]">𝄞</span>
          </div>
      </div>
    );
  }
  if (appId === AppRoute.PICK_APP) {
    return (
      <div className="w-full h-full relative bg-[#4b5563] flex items-center justify-center">
          <span className="text-8xl filter drop-shadow-[6px_6px_0_black]">👑</span>
          <div className="absolute top-4 right-4 bg-yellow-400 border-2 border-black px-2 py-1 text-[10px] font-black uppercase">Draw Pro</div>
      </div>
    );
  }
  if (appId === AppRoute.PAINT_APP) {
    return (
      <div className="w-full h-full relative bg-[#f43f5e] flex items-center justify-center">
          <span className="text-8xl filter drop-shadow-[6px_6px_0_black]">🎨</span>
          <svg className="absolute w-full h-full opacity-10" viewBox="0 0 100 100">
              <circle cx="20" cy="20" r="15" fill="white" />
              <circle cx="80" cy="80" r="20" fill="white" />
          </svg>
      </div>
    );
  }
  return <div className="w-full h-full bg-slate-300"></div>;
};

const BannerCard: React.FC<{ data: AppCardData; onClick: () => void }> = ({ data, onClick }) => {
  return (
    <div 
      className="group relative bg-white dark:bg-[#1a1614] border-[5px] border-black rounded-[2.5rem] overflow-hidden hover:-translate-y-3 transition-all duration-300 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,107,0,0.3)] cursor-pointer h-[440px] flex flex-col"
      onClick={onClick}
    >
      <div className="h-[240px] w-full relative border-b-[5px] border-black">
         <GameThumbnail appId={data.id} />
         <div className="absolute top-4 left-4 bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase border-2 border-white/20 shadow-xl">
            {data.category}
         </div>
      </div>
      <div className="p-7 flex-1 flex flex-col justify-between group-hover:bg-slate-50 dark:group-hover:bg-white/5 transition-colors">
        <div>
          <h3 className="text-3xl font-black mb-1.5 tracking-tighter uppercase italic group-hover:text-indigo-600 transition-colors">{data.title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold leading-relaxed line-clamp-2">{data.description}</p>
        </div>
        <div className="flex justify-between items-center mt-4">
           <div className="flex gap-2">
              {data.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="text-[9px] font-black bg-black text-white px-2.5 py-1.5 rounded-md uppercase border border-white/10">#{tag}</span>
              ))}
           </div>
           <button className="bg-[#fbbf24] border-[4px] border-black px-6 py-2.5 font-black text-sm rounded-xl shadow-[5px_5px_0px_black] active:shadow-none active:translate-y-1 transition-all uppercase italic">
             ENTER
           </button>
        </div>
      </div>
    </div>
  );
};

export const Launcher: React.FC<LauncherProps> = ({ onLaunch, selectedCategory }) => {
  const filteredCards = selectedCategory === 'ALL' 
    ? APP_CARDS 
    : APP_CARDS.filter(c => c.category === selectedCategory);

  return (
    <div className="h-full w-full overflow-y-auto p-10 bg-grid-pattern dark:bg-none transition-colors custom-scrollbar border-t-8 border-black">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredCards.map((card) => (
            <BannerCard 
              key={card.id} 
              data={card} 
              onClick={() => onLaunch(card.id)} 
            />
          ))}
      </div>
    </div>
  );
};
