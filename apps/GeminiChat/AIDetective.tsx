import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { BackButton } from '../../components/BackButton';

// 타입 정의
interface Suspect { name: string; role: string; description: string; alibi: string; trait: string; }
interface Case { title: string; summary: string; initialEvidence: string[]; suspects: Suspect[]; culpritName: string; hiddenTruth: string; }
interface ChatMessage { suspectName: string; role: 'detective' | 'suspect'; text: string; }

export const AIDetective: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'START' | 'LOADING' | 'INVESTIGATION' | 'RESULT'>('START');
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [activeSuspect, setActiveSuspect] = useState<Suspect | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCaseFile, setShowCaseFile] = useState(false);
  const [verdictResult, setVerdictResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 설정: .env 파일에 VITE_GEMINI_API_KEY가 있는지 확인하세요.
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(API_KEY || "");
  const MODEL_NAME = "gemini-2.5-flash-lite"; // 가장 안정적인 모델명

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeSuspect]);

  // 1. 한국어 사건 생성
  const generateNewCase = async () => {
    if (!API_KEY) return alert("API Key가 설정되지 않았습니다. .env 파일을 확인해주세요.");
    setGameState('LOADING');
    try {
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `흥미진진한 추리 소설 스타일의 사건을 생성해줘. 모든 텍스트는 한국어로 작성해.
      용의자는 3명이고, 그 중 한 명만 범인이어야 해.
      결과는 반드시 다음 JSON 구조를 지켜줘:
      {
        "title": "사건 제목",
        "summary": "사건 개요 (상황 설명)",
        "initialEvidence": ["발견된 증거 1", "증거 2"],
        "suspects": [
          { "name": "이름", "role": "직업/관계", "description": "외모나 특징", "alibi": "알리바이", "trait": "성격" }
        ],
        "culpritName": "범인 이름 (suspects 중 한 명)",
        "hiddenTruth": "범행 동기와 방법 등 숨겨진 진실"
      }`;

      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text()) as Case;
      
      setCurrentCase(data);
      setGameState('INVESTIGATION');
      setActiveSuspect(data.suspects[0]);
      setChatHistory([]);
    } catch (error: any) {
      console.error(error);
      alert("사건을 불러오지 못했습니다. 다시 시도해 주세요.");
      setGameState('START');
    }
  };

  // 2. 한국어 심문 로직
  const handleInterrogate = async () => {
    if (!input.trim() || loading || !activeSuspect || !currentCase) return;
    const userMsg = input;
    setInput('');
    setChatHistory(prev => [...prev, { suspectName: activeSuspect.name, role: 'detective', text: userMsg }]);
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const systemPrompt = `당신은 '${activeSuspect.name}'입니다. 
      직업: ${activeSuspect.role}, 성격: ${activeSuspect.trait}. 
      당신이 범인입니까?: ${currentCase.culpritName === activeSuspect.name ? "네(절대 들키지 않게 연기하세요)" : "아니오"}.
      질문에 대해 성격에 맞춰 한국어로 자연스럽게 대답하세요. 3문장 이내로 짧게 말하세요.`;

      const result = await model.generateContent(`${systemPrompt}\n수사관의 질문: ${userMsg}`);
      setChatHistory(prev => [...prev, { suspectName: activeSuspect.name, role: 'suspect', text: result.response.text() }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { suspectName: activeSuspect.name, role: 'suspect', text: "그 질문에는 답하고 싶지 않군요." }]);
    } finally {
      setLoading(false);
    }
  };

  // 3. 정답 판정 (한국어 보고서)
  const solveCase = async (selectedName: string) => {
    if (!currentCase) return;
    setLoading(true);
    const isCorrect = selectedName === currentCase.culpritName;

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `수사관이 '${selectedName}'을 범인으로 지목했습니다. 실제 범인은 '${currentCase.culpritName}'입니다.
      사건의 진실: ${currentCase.hiddenTruth}.
      결과가 ${isCorrect ? '성공' : '실패'}임을 알리고, 사건의 전말을 소설처럼 흥미진진하게 한국어로 요약해줘.`;

      const result = await model.generateContent(prompt);
      setVerdictResult({ isCorrect, feedback: result.response.text() });
      setGameState('RESULT');
    } catch (error) {
      alert("보고서를 작성하는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans overflow-hidden relative">
      <BackButton onClick={onBack} />
      
      {/* 배경 레이아웃 생략 (기존 디자인 유지) */}
      
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col z-10 overflow-hidden">
        
        {/* 시작 화면 */}
        {gameState === 'START' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-6 inline-block px-4 py-1 border border-blue-500/30 rounded-full text-[10px] font-black tracking-[0.5em] text-blue-400 uppercase">Bureau of Justice</div>
            <h1 className="text-7xl font-black italic tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent underline decoration-blue-500/30">AI 탐정 수사대</h1>
            <p className="text-zinc-500 max-w-sm mb-12 text-sm leading-relaxed font-medium tracking-widest">생성형 AI가 만드는 실시간 사건 현장.<br/>당신의 논리로 진실을 포착하십시오.</p>
            <button onClick={generateNewCase} className="group relative px-16 py-5 overflow-hidden rounded-full transition-all hover:scale-105 active:scale-95">
              <div className="absolute inset-0 bg-blue-600 group-hover:bg-blue-500" />
              <span className="relative font-black text-xl italic tracking-tight">수사 개시</span>
            </button>
          </div>
        )}

        {/* 로딩 화면 */}
        {gameState === 'LOADING' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <div className="w-12 h-1 bg-blue-500 animate-pulse" />
            <p className="font-black text-xs text-blue-400 uppercase tracking-[0.5em]">사건 파일을 분류 중입니다...</p>
          </div>
        )}

        {/* 수사 화면 */}
        {gameState === 'INVESTIGATION' && currentCase && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-8 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black italic tracking-tight text-white">{currentCase.title}</h2>
                <div className="px-2 py-0.5 bg-blue-500 text-black text-[9px] font-black rounded uppercase">진행 중</div>
              </div>
              <button onClick={() => setShowCaseFile(true)} className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10">
                <span className="text-[11px] font-black uppercase tracking-widest">사건 기록 열람</span>
                <span className="text-lg">📁</span>
              </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* 왼쪽 용의자 리스트 */}
              <aside className="w-80 border-r border-white/5 p-6 flex flex-col gap-4">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2 px-2">심문 대상자</div>
                {currentCase.suspects.map(s => (
                  <button key={s.name} onClick={() => setActiveSuspect(s)} className={`p-5 rounded-2xl border text-left transition-all ${activeSuspect?.name === s.name ? 'bg-blue-600/10 border-blue-500/50' : 'bg-transparent border-white/5 hover:bg-white/5'}`}>
                    <div className={`font-black text-base italic mb-1 ${activeSuspect?.name === s.name ? 'text-blue-400' : 'text-white'}`}>{s.name}</div>
                    <div className="text-[10px] font-bold opacity-40 uppercase">{s.role}</div>
                  </button>
                ))}
                
                <div className="mt-auto pt-8 border-t border-white/5">
                  <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4 px-2">범인 지목</div>
                  <div className="space-y-2">
                    {currentCase.suspects.map(s => (
                      <button key={s.name + '_v'} onClick={() => solveCase(s.name)} className="w-full py-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl text-[10px] font-black transition-all italic">
                        {s.name}를 검거한다
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* 오른쪽 채팅창 */}
              <section className="flex-1 flex flex-col bg-zinc-950/30">
                <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar">
                  {chatHistory.filter(m => m.suspectName === activeSuspect?.name).map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'detective' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%]">
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 opacity-30 ${msg.role === 'detective' ? 'text-right' : 'text-left'}`}>
                          {msg.role === 'detective' ? '나 (수사관)' : activeSuspect?.name}
                        </div>
                        <div className={`px-6 py-4 rounded-[2rem] text-sm ${msg.role === 'detective' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-900 border border-white/5 text-zinc-100 rounded-tl-none'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* 입력창 */}
                <div className="p-8 border-t border-white/5">
                  <div className="max-w-3xl mx-auto flex gap-3">
                    <input 
                      value={input} 
                      onChange={e => setInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleInterrogate()} 
                      placeholder={`${activeSuspect?.name}에게 날카로운 질문을 던지세요...`} 
                      className="flex-1 bg-black/40 border border-white/10 rounded-full px-8 py-4 text-sm focus:border-blue-500 outline-none" 
                    />
                    <button onClick={handleInterrogate} disabled={loading || !input.trim()} className="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all">
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "전송"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* 결과 화면 */}
        {gameState === 'RESULT' && verdictResult && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 animate-in fade-in duration-700">
            <div className={`w-full max-w-3xl bg-[#111115] border-2 rounded-[3rem] p-12 flex flex-col items-center ${verdictResult.isCorrect ? 'border-emerald-500/40' : 'border-rose-500/40'}`}>
              <div className="text-7xl mb-6">{verdictResult.isCorrect ? '⭕' : '❌'}</div>
              <h2 className="text-6xl font-black italic mb-4 uppercase">{verdictResult.isCorrect ? '수사 성공' : '수사 실패'}</h2>
              <div className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-8 mb-8 overflow-y-auto max-h-60">
                <p className="text-lg leading-relaxed text-zinc-200 italic">{verdictResult.feedback}</p>
              </div>
              <div className="flex gap-4 w-full">
                <button onClick={() => setGameState('START')} className="flex-1 py-5 bg-white text-black font-black rounded-2xl uppercase italic">새 사건 시작</button>
                <button onClick={onBack} className="flex-1 py-5 bg-zinc-800 text-zinc-400 font-black rounded-2xl border border-white/5 uppercase italic">나가기</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};