
import React, { useState, useEffect } from 'react';
import { BackButton } from '../../components/BackButton';

export const BlueScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [percent, setPercent] = useState(0);
  const [showRealContent, setShowRealContent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setPercent(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5);
      });
    }, 800);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen support
  useEffect(() => {
    const enterFullscreen = () => {
      const doc = window.document.documentElement;
      if (doc.requestFullscreen) doc.requestFullscreen();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (document.fullscreenElement) document.exitFullscreen();
    };
  }, [onBack]);

  return (
    <div className="fixed inset-0 bg-[#0078d7] z-[9999] text-white font-sans flex flex-col p-[10%] select-none cursor-none">
      {/* Secret Back Button (Invisible) */}
      <button 
        onClick={onBack} 
        className="absolute top-0 left-0 w-16 h-16 opacity-0 hover:opacity-10 transition-opacity bg-white/20 rounded-full m-4"
      ></button>

      <div className="max-w-4xl w-full">
        <div className="text-[120px] leading-none mb-10">:(</div>
        
        <h1 className="text-3xl font-light mb-8 leading-snug">
          Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.
        </h1>

        <div className="text-3xl font-light mb-12">
          {percent}% complete
        </div>

        <div className="flex gap-10 items-start">
          <div className="bg-white p-2 w-32 h-32 flex-shrink-0">
             <div className="w-full h-full bg-[#0078d7] flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-white opacity-50 rotate-45"></div>
             </div>
          </div>
          
          <div className="text-sm font-light space-y-2 opacity-80 uppercase tracking-wide">
            <p>For more information about this issue and possible fixes, visit https://www.windows.com/stopcode</p>
            <p className="mt-4">If you call a support person, give them this info:</p>
            <p>Stop code: CRITICAL_PROCESS_DIED</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-10 text-[10px] opacity-20 uppercase tracking-[0.5em] font-mono">
        Simulation Mode: Active / ESC to exit
      </div>
    </div>
  );
};
