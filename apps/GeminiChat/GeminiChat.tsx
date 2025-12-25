import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../../components/Button';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const GeminiChat: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: '안녕하세요! 저는 당신의 AI 어시스턴트입니다. 무엇을 도와드릴까요?' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Initialize ai instance with process.env.API_KEY directly as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
      });

      // Using .text property directly from response as per guidelines
      const text = response.text || "죄송합니다. 응답을 생성할 수 없습니다.";
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "오류가 발생했습니다. API 키를 확인하거나 나중에 다시 시도해주세요."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 relative">
       {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Internal Minimal Header */}
      <div className="p-4 bg-slate-900/50 backdrop-blur border-b border-slate-800 flex justify-between items-center z-10 shrink-0">
         <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Gemini 3 Flash</h2>
         <button onClick={() => setMessages([])} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
           대화 지우기
         </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm transition-all ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none' 
                  : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none'
              }`}
            >
              <p className="leading-7 whitespace-pre-wrap text-sm md:text-base">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-6 py-4 rounded-tl-none flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/80 backdrop-blur border-t border-slate-800 z-10 shrink-0">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
            disabled={loading}
            className="flex-1 bg-slate-800/50 text-white px-5 py-4 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-500 transition-all shadow-inner"
          />
          <Button onClick={handleSend} disabled={loading} className={`px-8 ${loading ? 'opacity-50' : ''}`}>
            <span className="text-xl">➤</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
