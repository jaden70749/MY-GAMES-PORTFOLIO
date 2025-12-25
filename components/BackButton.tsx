
import React from 'react';

export const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="absolute top-4 left-4 w-11 h-11 bg-black/30 hover:bg-black/50 text-white rounded-xl backdrop-blur-xl flex items-center justify-center shadow-2xl z-[1000] transition-all active:scale-90 border border-white/10 group"
    aria-label="Go Back"
  >
    <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);
