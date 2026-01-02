import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BackButton } from '../../components/BackButton';

type WritingTone = 'Professional' | 'Polite' | 'Concise' | 'Casual' | 'Creative';

export const AIWriter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState<WritingTone>('Professional');
  const [copied, setCopied] = useState(false);

  const tones: { id: WritingTone; label: string; icon: string }[] = [
    { id: 'Professional', label: '전문적', icon: '👔' },
    { id: 'Polite', label: '정중함', icon: '🙏' },
    { id: 'Concise', label: '간결함', icon: '✂️' },
    { id: 'Casual', label: '편안함', icon: '☕' },
    { id: 'Creative', label: '창의적', icon: '✨' },
  ];

  const handleRewrite = async () => {
    if (!input.trim() || loading) return;
    // @ts-ignore
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    setLoading(true);
    setOutput('');

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const result = await model.generateContent(`다음 문장을 '${tone}' 말투로 다듬어줘: ${input}`);
      const response = await result.response;
      setOutput(response.text());
    } catch (error: any) {
      console.error("Gemini Error:", error);
      setOutput(`에러(404): 모델을 찾을 수 없습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full bg-[#fcfcfc] flex flex-col items-center relative overflow-hidden">
      <BackButton onClick={onBack} />
      
      {/* 1. 상단 타이틀 구역 (고정) */}
      <header className="w-full flex flex-col items-center pt-16 pb-6 shrink-0 bg-[#fcfcfc]/80 backdrop-blur-md z-20">
        <h1 className="text-4xl font-black italic tracking-tighter">AI WRITER PRO</h1>
      </header>

      {/* 2. 중앙 스크롤 구역 (내용물이 길어지면 여기서 스크롤 발생) */}
      <main className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-40 scrollbar-hide">
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="여기에 글을 쓰세요..."
            className="w-full min-h-[200px] p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm text-lg focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
          />

          {output && (
            <div className="p-8 bg-zinc-900 text-white rounded-[2.5rem] shadow-2xl relative animate-in zoom-in duration-300">
              <p className="whitespace-pre-wrap text-lg leading-relaxed">{output}</p>
              <button 
                onClick={copyToClipboard} 
                className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
              >
                {copied ? 'COPIED!' : 'COPY'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 3. 하단 컨트롤 바 (고정) */}
      <div className="fixed bottom-10 w-full max-w-2xl px-6 z-30">
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-xl p-3 rounded-full border border-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
          <div className="flex gap-1 pl-2">
            {tones.map((t) => (
              <button 
                key={t.id} 
                onClick={() => setTone(t.id)} 
                className={`w-12 h-12 rounded-full transition-all flex items-center justify-center text-xl ${tone === t.id ? 'bg-zinc-900 text-white scale-110 shadow-lg' : 'text-zinc-300 hover:bg-zinc-50'}`}
              >
                {t.icon}
              </button>
            ))}
          </div>
          <button
            onClick={handleRewrite}
            disabled={loading || !input.trim()}
            className="px-10 h-14 bg-indigo-600 text-white rounded-full font-black text-sm tracking-widest hover:bg-indigo-500 disabled:bg-zinc-100 disabled:text-zinc-400 transition-all active:scale-95 shadow-lg shadow-indigo-200"
          >
            {loading ? 'REFINING...' : 'REFINE ✨'}
          </button>
        </div>
      </div>
    </div>
  );
};