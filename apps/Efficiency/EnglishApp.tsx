
import React, { useState, useEffect } from 'react';
import { BackButton } from '../../components/BackButton';

interface Word {
  id: string;
  en: string;
  ko: string;
  isMemorized: boolean;
}

const DEFAULT_WORDS: Word[] = [
  { id: '1', en: 'Efficiency', ko: '효율', isMemorized: false },
  { id: '2', en: 'Interactive', ko: '상호작용하는', isMemorized: false },
  { id: '3', en: 'Innovative', ko: '혁신적인', isMemorized: false },
  { id: '4', en: 'Synchronize', ko: '동기화하다', isMemorized: false },
  { id: '5', en: 'Algorithm', ko: '알고리즘', isMemorized: false },
];

export const EnglishApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [words, setWords] = useState<Word[]>(() => {
    const saved = localStorage.getItem('voca_master_words');
    return saved ? JSON.parse(saved) : DEFAULT_WORDS;
  });
  const [newEn, setNewEn] = useState('');
  const [newKo, setNewKo] = useState('');
  const [activeTab, setActiveTab] = useState<'LIST' | 'FLASHCARD'>('LIST');
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    localStorage.setItem('voca_master_words', JSON.stringify(words));
  }, [words]);

  const addWord = () => {
    if (!newEn.trim() || !newKo.trim()) return;
    const newWord: Word = {
      id: Date.now().toString(),
      en: newEn.trim(),
      ko: newKo.trim(),
      isMemorized: false,
    };
    setWords([newWord, ...words]);
    setNewEn('');
    setNewKo('');
  };

  const toggleMemorized = (id: string) => {
    setWords(words.map(w => w.id === id ? { ...w, isMemorized: !w.isMemorized } : w));
  };

  const deleteWord = (id: string) => {
    setWords(words.filter(w => w.id !== id));
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIdx((flashcardIdx + 1) % words.length);
    }, 150);
  };

  const memorizedCount = words.filter(w => w.isMemorized).length;
  const progress = words.length > 0 ? (memorizedCount / words.length) * 100 : 0;

  return (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col items-center p-6 font-sans overflow-hidden relative">
      <BackButton onClick={onBack} />

      <div className="max-w-4xl w-full flex flex-col h-full bg-white rounded-[2rem] shadow-2xl border-4 border-black overflow-hidden mt-10">
        {/* Header */}
        <header className="bg-black text-white p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center font-black text-2xl border-2 border-white rotate-3">A</div>
             <div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">Voca Master Pro</h1>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Efficiency Education System</p>
             </div>
          </div>
          
          <div className="flex gap-2 bg-zinc-800 p-1.5 rounded-xl border border-zinc-700">
             <button 
                onClick={() => setActiveTab('LIST')}
                className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${activeTab === 'LIST' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
             >
                LIST
             </button>
             <button 
                onClick={() => setActiveTab('FLASHCARD')}
                className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${activeTab === 'FLASHCARD' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
             >
                FLASHCARD
             </button>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="px-8 pt-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Memorization Progress</span>
            <span className="text-lg font-black text-blue-600 italic">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border-2 border-black shadow-inner">
            <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-8 flex flex-col">
          {activeTab === 'LIST' ? (
            <>
              {/* Input Area */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                <input 
                  type="text" 
                  value={newEn}
                  onChange={e => setNewEn(e.target.value)}
                  placeholder="English Word"
                  className="border-2 border-black px-4 py-3 rounded-xl font-bold focus:bg-blue-50 focus:outline-none transition-colors"
                />
                <input 
                  type="text" 
                  value={newKo}
                  onChange={e => setNewKo(e.target.value)}
                  placeholder="Meaning (Korean)"
                  className="border-2 border-black px-4 py-3 rounded-xl font-bold focus:bg-blue-50 focus:outline-none transition-colors"
                />
                <button 
                  onClick={addWord}
                  className="bg-black text-white font-black py-3 rounded-xl hover:bg-zinc-800 transition-all shadow-[4px_4px_0px_#3b82f6] active:shadow-none active:translate-x-1 active:translate-y-1"
                >
                  ADD WORD
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {words.map((w) => (
                  <div key={w.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${w.isMemorized ? 'bg-zinc-50 border-zinc-200 opacity-60' : 'bg-white border-black shadow-[4px_4px_0px_black]'}`}>
                    <button 
                      onClick={() => toggleMemorized(w.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 border-black transition-all ${w.isMemorized ? 'bg-green-400' : 'bg-white'}`}
                    >
                      {w.isMemorized && <span className="text-black font-black">✓</span>}
                    </button>
                    <div className="flex-1">
                      <h4 className="text-xl font-black tracking-tight">{w.en}</h4>
                      <p className="text-sm font-bold text-zinc-500">{w.ko}</p>
                    </div>
                    <button 
                      onClick={() => deleteWord(w.id)}
                      className="text-zinc-300 hover:text-red-500 font-black transition-colors px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {words.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <span className="text-9xl mb-4">📚</span>
                    <p className="font-black text-2xl uppercase italic">Vocabulary is empty</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Flashcard Mode */
            <div className="flex-1 flex flex-col items-center justify-center">
              {words.length > 0 ? (
                <div className="w-full max-w-sm">
                   <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full aspect-[4/3] cursor-pointer perspective-1000 group"
                   >
                      <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                         {/* Front */}
                         <div className="absolute inset-0 backface-hidden flex items-center justify-center bg-white border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_black] group-hover:scale-105 transition-transform">
                            <span className="text-4xl font-black tracking-tight uppercase italic">{words[flashcardIdx].en}</span>
                            <span className="absolute bottom-6 text-[10px] font-bold text-zinc-300 tracking-widest uppercase">Click to flip</span>
                         </div>
                         {/* Back */}
                         <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-blue-500 border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_black]">
                            <span className="text-4xl font-black text-white tracking-tight">{words[flashcardIdx].ko}</span>
                            <span className="absolute bottom-6 text-[10px] font-bold text-blue-200 tracking-widest uppercase">Meaning</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-4 mt-16 w-full">
                      <button 
                        onClick={() => toggleMemorized(words[flashcardIdx].id)}
                        className={`flex-1 py-4 border-4 border-black rounded-2xl font-black transition-all ${words[flashcardIdx].isMemorized ? 'bg-green-400 shadow-none' : 'bg-white hover:bg-zinc-50 shadow-[6px_6px_0px_black] active:shadow-none active:translate-y-1'}`}
                      >
                        {words[flashcardIdx].isMemorized ? 'MEMORIZED!' : 'I KNOW IT'}
                      </button>
                      <button 
                        onClick={nextCard}
                        className="bg-black text-white px-10 py-4 border-4 border-black rounded-2xl font-black shadow-[6px_6px_0px_#3b82f6] hover:bg-zinc-800 transition-all active:shadow-none active:translate-y-1"
                      >
                        NEXT
                      </button>
                   </div>
                </div>
              ) : (
                <div className="text-center opacity-20">
                   <span className="text-9xl">📖</span>
                   <p className="font-black text-xl mt-4">NO WORDS TO STUDY</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};
