import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai"; // 라이브러리명을 확인해주세요
import { BackButton } from '../../components/BackButton';

export const ImageGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');

  const generateImage = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);

    try {
      // 1. API 키 확인 (Vite 환경변수 방식)
      // @ts-ignore
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);

      // 2. 스크린샷 리스트에 있던 가장 최신 모델 사용
      // 이미지 생성 기능이 포함된 최신 모델명으로 세팅합니다.
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

      // 3. 이미지 생성 프롬프트 구성
      // Gemini는 텍스트 응답 내에 이미지를 포함하거나, 특정 API 호출로 생성합니다.
      // 현재 SDK 버전에서 가장 안정적인 호출 방식입니다.
      const result = await model.generateContent([
        `${prompt}를 이미지로 생성해줘. 비율은 ${aspectRatio}로 해줘.`
      ]);

      const response = await result.response;
      
      // 주의: Gemini 모델에 따라 이미지 데이터를 'inlineData'로 주거나 
      // 생성된 이미지의 URL을 텍스트로 줄 수 있습니다.
      // 여기서는 텍스트 모델과 동일하게 응답을 확인하는 로직입니다.
      
      const candidates = response.candidates;
      if (candidates && candidates[0].content.parts) {
        const newImages: string[] = [];
        
        for (const part of candidates[0].content.parts) {
          // base64 이미지 데이터가 직접 들어오는 경우
          if (part.inlineData) {
            newImages.push(`data:image/png;base64,${part.inlineData.data}`);
          } 
          // 만약 이미지 생성 결과가 URL 형태로 온다면 (모델 설정에 따라 다름)
          else if (part.text && part.text.includes('http')) {
             // 텍스트 내 URL 추출 로직 (필요시)
          }
        }

        if (newImages.length > 0) {
          setImages(prev => [...newImages, ...prev]);
        } else {
          // 이미지가 직접 오지 않고 설명만 오는 경우에 대한 처리
          console.log("Response text:", response.text());
          alert("이 모델은 현재 텍스트 설명만 가능하거나 이미지 생성 권한이 제한되었습니다.");
        }
      }
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      alert(`오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0c] text-white flex flex-col font-sans overflow-hidden relative">
      <BackButton onClick={onBack} />
      
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col p-6 md:p-12 z-10 overflow-y-auto custom-scrollbar">
        <header className="mb-12 text-center">
          <div className="inline-block px-4 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-4 shadow-lg shadow-rose-600/20">
            Next-Gen AI Art
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 italic">IMAGE STUDIO</h1>
          <p className="text-zinc-500 font-medium text-lg uppercase tracking-widest">GEMINI 3 FLASH ARTIST</p>
        </header>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl mb-12">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-4">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-2">Creative Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="어떤 이미지를 만들고 싶나요?"
                className="w-full h-32 p-6 bg-black/40 border border-white/5 rounded-2xl text-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none placeholder-zinc-700"
              />
            </div>
            <div className="md:w-64 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                 <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-2">Aspect Ratio</label>
                 <div className="grid grid-cols-3 gap-2">
                    {(['1:1', '16:9', '9:16'] as const).map(ratio => (
                      <button 
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-3 rounded-xl font-black text-xs transition-all border ${aspectRatio === ratio ? 'bg-white text-black border-white' : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'}`}
                      >
                        {ratio}
                      </button>
                    ))}
                 </div>
              </div>
              <button 
                onClick={generateImage}
                disabled={loading || !prompt.trim()}
                className={`flex-1 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest rounded-2xl transition-all ${loading ? 'bg-zinc-800 text-zinc-600' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 active:scale-95'}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>GENERATE <span className="text-xl">✨</span></>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((img, idx) => (
            <div key={idx} className="group relative bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/5 hover:scale-[1.02] transition-all">
               <img src={img} alt={`Generated ${idx}`} className="w-full h-auto object-cover" />
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <a href={img} download={`ai-art-${idx}.png`} className="px-6 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-110 transition-transform">Download</a>
               </div>
            </div>
          ))}
          {images.length === 0 && !loading && (
            <div className="col-span-full h-64 flex flex-col items-center justify-center border-4 border-dashed border-white/5 rounded-[3rem] opacity-20">
               <span className="text-8xl mb-4">🖼️</span>
               <p className="font-black text-xl uppercase italic">Waiting for your imagination...</p>
            </div>
          )}
          {loading && (
            <div className="bg-zinc-900/50 rounded-3xl aspect-square flex flex-col items-center justify-center gap-4 animate-pulse border border-white/5">
                <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black text-rose-500 uppercase tracking-widest">AI is creating...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};