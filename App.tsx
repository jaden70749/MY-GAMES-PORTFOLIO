
import React, { useState, useEffect } from 'react';
import { Launcher } from './components/Launcher';
import { TankGame } from './apps/TankGame/TankGame';
import { GuitarGame } from './apps/GuitarGame/GuitarGame';
import { StackGame } from './apps/StackGame/StackGame';
import { PickApp } from './apps/Efficiency/PickApp';
import { PaintApp } from './apps/Efficiency/PaintApp';
import { MusicComposer } from './apps/Music/MusicComposer';
import { PhoneCaseApp } from './apps/Efficiency/PhoneCaseApp';
import { SlimeRPG } from './apps/Game/SlimeRPG';
import { BlueScreen } from './apps/Efficiency/BlueScreen';
import { ShapeStacker } from './apps/Game/ShapeStacker';
import { Header, Navbar, Footer } from './components/Layout';
import { AppRoute, AppCategory } from './types';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.LAUNCHER);
  const [currentCategory, setCurrentCategory] = useState<AppCategory>('ALL');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDarkMode]);

  const renderScreen = () => {
    switch (currentRoute) {
      case AppRoute.LAUNCHER:
        return <Launcher onLaunch={setCurrentRoute} selectedCategory={currentCategory} />;
      case AppRoute.TANK_GAME:
        return <TankGame onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      case AppRoute.GUITAR_GAME:
        return <GuitarGame onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      case AppRoute.STACK_GAME:
        return <StackGame onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      case AppRoute.PICK_APP:
        return <PickApp onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      case AppRoute.PAINT_APP:
        return <PaintApp onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      case AppRoute.MUSIC_COMPOSER:
        return <MusicComposer onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      case AppRoute.PHONE_CASE_APP:
        return <PhoneCaseApp onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      case AppRoute.SLIME_RPG:
        return <SlimeRPG onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      case AppRoute.BLUE_SCREEN:
        return <BlueScreen onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      case AppRoute.SHAPE_STACKER:
        return <ShapeStacker onBack={() => setCurrentRoute(AppRoute.LAUNCHER)} />;
      default:
        return <Launcher onLaunch={setCurrentRoute} selectedCategory={currentCategory} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#1a1614] text-slate-100' : 'bg-[#fdf6e3] text-gray-900'}`}>
      <Header onNavigate={setCurrentRoute} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
      <Navbar 
          currentCategory={currentCategory} 
          onSelectCategory={setCurrentCategory} 
      />
      <main className={`flex-1 relative w-full overflow-hidden shadow-inner ${isDarkMode ? 'bg-[#0f0d0c]' : 'bg-[#ff6b00]'}`}>
        {renderScreen()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
