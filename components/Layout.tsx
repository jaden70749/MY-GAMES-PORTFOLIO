import React from 'react';
import { AppRoute, AppCategory } from '../types';

interface HeaderProps {
  onNavigate: (route: AppRoute) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface NavbarProps {
  currentCategory: AppCategory;
  onSelectCategory: (category: AppCategory) => void;
}

// Icons
const GameLogoIcon = () => (
  <svg className="w-8 h-8 text-[#5865F2]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 6.5H4.5C3.39543 6.5 2.5 7.39543 2.5 8.5V15.5C2.5 16.6046 3.39543 17.5 4.5 17.5H19.5C20.6046 17.5 21.5 16.6046 21.5 15.5V8.5C21.5 7.39543 20.6046 6.5 19.5 6.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M8 10.5V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 12H9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 12H14.51" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.5 12H17.51" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SunIcon = () => (
  <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const CategoryIcon = ({ type }: { type: AppCategory }) => {
  switch (type) {
    case 'ALL':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'GAME':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      );
    case 'MUSIC':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    case 'EFFICIENCY':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default: return null;
  }
};

export const Header: React.FC<HeaderProps> = ({ onNavigate, isDarkMode, toggleTheme }) => (
  <header className="shrink-0 h-16 flex items-center justify-between px-6 z-50 select-none border-b transition-colors dark:bg-[#271c19] dark:border-[#3e2e28] bg-[#fdf6e3] border-gray-300">
    <div 
      className="flex items-center gap-3 cursor-pointer group" 
      onClick={() => onNavigate(AppRoute.LAUNCHER)}
    >
      <div className="group-hover:scale-110 transition-transform duration-200">
        <GameLogoIcon />
      </div>
      <h1 className="text-xl font-black tracking-tight group-hover:text-[#5865F2] transition-colors dark:text-white text-gray-900">
        My Games
      </h1>
    </div>

    {/* Right Side: Theme Toggle */}
    <div className="flex items-center gap-4">
       <button 
         onClick={toggleTheme}
         className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all focus:outline-none"
         title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
       >
         <div className="relative w-6 h-6 overflow-hidden">
            <div className={`absolute inset-0 transform transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${isDarkMode ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`}>
                <SunIcon />
            </div>
            <div className={`absolute inset-0 transform transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${isDarkMode ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}>
                <MoonIcon />
            </div>
         </div>
       </button>
    </div>
  </header>
);

export const Navbar: React.FC<NavbarProps> = ({ currentCategory, onSelectCategory }) => {
  const categories: { id: AppCategory; label: string }[] = [
    { id: 'ALL', label: '모든 프로젝트' },
    { id: 'GAME', label: '게임' },
    { id: 'MUSIC', label: '음악' },
    { id: 'EFFICIENCY', label: '효율' },
  ];

  return (
    <nav className="shrink-0 h-16 flex items-center px-6 gap-3 z-40 select-none shadow-md overflow-x-auto custom-scrollbar border-b transition-colors dark:bg-[#271c19] dark:border-[#3e2e28] bg-[#fdf6e3] border-gray-300">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-sm border ${
            currentCategory === cat.id
              ? 'bg-[#5865F2] text-white border-[#5865F2] shadow-indigo-500/30'
              : 'dark:bg-[#3e2e28] dark:text-gray-300 dark:border-transparent dark:hover:bg-[#4d3a33] dark:hover:text-white bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <CategoryIcon type={cat.id} />
          {cat.label}
        </button>
      ))}
    </nav>
  );
};

export const Footer: React.FC = () => (
  <footer className="shrink-0 h-12 flex items-center justify-center px-6 text-[11px] z-50 border-t select-none transition-colors dark:bg-[#271c19] dark:border-[#3e2e28] dark:text-gray-500 bg-[#fdf6e3] border-gray-300 text-gray-500">
    <span>© 2025 My Games. All rights reserved. | <span className="hover:text-black dark:hover:text-white cursor-pointer transition-colors font-semibold">kiri_llim</span></span>
  </footer>
);