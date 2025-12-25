
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackButton } from '../../components/BackButton';

// --- Constants & Audio ---
const BASE_FREQS = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]; 
// Index 0: Low E (Thickest)
// Index 5: High E (Thinnest)

// Chord Data Mapping
const KEY_CHORD_MAP: { [code: string]: { name: string, shape: number[] } } = {
    // C Family
    'Digit1': { name: 'C', shape: [-1, 3, 2, 0, 1, 0] },
    'KeyQ':   { name: 'Cm', shape: [-1, 3, 5, 5, 4, 3] }, 
    'KeyA':   { name: 'C7', shape: [-1, 3, 2, 3, 1, 0] },

    // D Family
    'Digit2': { name: 'D', shape: [-1, -1, 0, 2, 3, 2] },
    'KeyW':   { name: 'Dm', shape: [-1, -1, 0, 2, 3, 1] },
    'KeyS':   { name: 'D7', shape: [-1, -1, 0, 2, 1, 2] },

    // E Family
    'Digit3': { name: 'E', shape: [0, 2, 2, 1, 0, 0] },
    'KeyE':   { name: 'Em', shape: [0, 2, 2, 0, 0, 0] },
    'KeyD':   { name: 'E7', shape: [0, 2, 0, 1, 0, 0] },

    // F Family
    'Digit4': { name: 'F', shape: [1, 3, 3, 2, 1, 1] },
    'KeyR':   { name: 'Fm', shape: [1, 3, 3, 1, 1, 1] },
    'KeyF':   { name: 'F7', shape: [1, 3, 1, 2, 1, 1] },

    // G Family
    'Digit5': { name: 'G', shape: [3, 2, 0, 0, 0, 3] },
    'KeyT':   { name: 'Gm', shape: [3, 5, 5, 3, 3, 3] },
    'KeyG':   { name: 'G7', shape: [3, 2, 0, 0, 0, 1] },

    // A Family
    'Digit6': { name: 'A', shape: [-1, 0, 2, 2, 2, 0] },
    'KeyY':   { name: 'Am', shape: [-1, 0, 2, 2, 1, 0] },
    'KeyH':   { name: 'A7', shape: [-1, 0, 2, 0, 2, 0] },

    // B Family
    'Digit7': { name: 'B', shape: [-1, 2, 4, 4, 4, 2] },
    'KeyU':   { name: 'Bm', shape: [-1, 2, 4, 4, 3, 2] },
    'KeyJ':   { name: 'B7', shape: [-1, 2, 1, 2, 0, 2] },

    // Special
    'Space':  { name: 'Open', shape: [0, 0, 0, 0, 0, 0] } 
};

// UI Button List
const CHORD_BUTTONS = [
    { display: 'C',  code: 'Digit1' }, { display: 'Cm', code: 'KeyQ' }, { display: 'C7', code: 'KeyA' },
    { display: 'D',  code: 'Digit2' }, { display: 'Dm', code: 'KeyW' }, { display: 'D7', code: 'KeyS' },
    { display: 'E',  code: 'Digit3' }, { display: 'Em', code: 'KeyE' }, { display: 'E7', code: 'KeyD' },
    { display: 'F',  code: 'Digit4' }, { display: 'Fm', code: 'KeyR' }, { display: 'F7', code: 'KeyF' },
    { display: 'G',  code: 'Digit5' }, { display: 'Gm', code: 'KeyT' }, { display: 'G7', code: 'KeyG' },
    { display: 'A',  code: 'Digit6' }, { display: 'Am', code: 'KeyY' }, { display: 'A7', code: 'KeyH' },
    { display: 'B',  code: 'Digit7' }, { display: 'Bm', code: 'KeyU' }, { display: 'B7', code: 'KeyJ' },
];

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
};

const playNote = (stringIdx: number, fret: number) => {
    if (fret === -1) return; 
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const detune = (Math.random() - 0.5) * 3; 
    const freq = BASE_FREQS[stringIdx] * Math.pow(2, fret / 12);
    
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.detune.setValueAtTime(detune, ctx.currentTime);

    // Harmonics for brightness
    const overtone = ctx.createOscillator();
    overtone.type = 'sawtooth';
    overtone.frequency.setValueAtTime(freq, ctx.currentTime);
    overtone.detune.setValueAtTime(detune + 4, ctx.currentTime);
    const overtoneGain = ctx.createGain();
    overtoneGain.gain.value = 0.25;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.015); 
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0); 

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, now); 
    filter.frequency.exponentialRampToValueAtTime(150, now + 2.0);

    osc.connect(filter);
    overtone.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    overtone.start();
    osc.stop(now + 3.5);
    overtone.stop(now + 3.5);
};

// --- Visual Components ---

const GuitarStringVisual = ({ thickness, isWound, isActive, isVibrating }: { thickness: number, isWound: boolean, isActive: boolean, isVibrating: boolean }) => {
    
    const woundGradient = 'repeating-linear-gradient(90deg, #3d2410, #8d5a2d 2px, #3d2410 4px)';
    const plainGradient = 'linear-gradient(0deg, #9ca3af, #f3f4f6, #9ca3af)';

    const filterStyle = isActive ? 'none' : 'brightness(0.5) grayscale(0.8)';
    const shadowStyle = isActive 
        ? `0 2px ${Math.max(2, thickness/2)}px rgba(0,0,0,0.8)` 
        : 'none';

    return (
        <div className="w-full h-full relative flex items-center justify-center">
            <div 
                className={`transition-all duration-75 w-full ${isVibrating ? 'animate-vibrate' : ''}`}
                style={{
                    height: `${thickness}px`,
                    background: isWound ? woundGradient : plainGradient,
                    boxShadow: shadowStyle,
                    filter: filterStyle,
                    borderRadius: '9999px',
                }}
            />
        </div>
    );
};

const ChordModeStage = ({ activeChordName, activeShape, onStrum }: { activeChordName: string, activeShape: number[], onStrum: (s: number) => void }) => {
    const [vibratingStrings, setVibratingStrings] = useState<boolean[]>([false, false, false, false, false, false]);

    const handleStringEnter = (stringIdx: number) => {
        if (activeShape[stringIdx] !== -1) {
            onStrum(stringIdx);
            setVibratingStrings(prev => { const n = [...prev]; n[stringIdx] = true; return n; });
            setTimeout(() => setVibratingStrings(prev => { const n = [...prev]; n[stringIdx] = false; return n; }), 150);
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative bg-[#1c1917] items-center justify-center overflow-hidden">
             <div className="absolute inset-0 pointer-events-none" 
                  style={{ 
                      background: `radial-gradient(circle at center, #27272a 0%, #09090b 70%, #000000 100%)`
                  }} 
             />
             
             <div className="w-full h-full flex flex-col justify-evenly py-8 px-0 z-10">
                 {[5, 4, 3, 2, 1, 0].map((stringIdx) => { 
                     const isWound = stringIdx < 4; 
                     const thickness = isWound ? 4 + ((3-stringIdx) * 1) : 2 + ((5-stringIdx) * 0.5);
                     const isActive = activeShape[stringIdx] !== -1;

                     return (
                         <div 
                            key={stringIdx}
                            className="flex-1 w-full flex items-center relative group cursor-pointer hover:bg-white/5 transition-colors"
                            onMouseEnter={() => handleStringEnter(stringIdx)}
                            onTouchMove={(e) => { 
                                const touch = e.touches[0];
                                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                                if(target && target.closest(`[data-string="${stringIdx}"]`)) {
                                    handleStringEnter(stringIdx);
                                }
                            }}
                            data-string={stringIdx}
                         >
                             <GuitarStringVisual 
                                thickness={thickness} 
                                isWound={isWound} 
                                isActive={isActive} 
                                isVibrating={vibratingStrings[stringIdx]}
                             />
                         </div>
                     )
                 })}
             </div>

             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 select-none z-0">
                 <div className="text-[25vw] font-serif font-bold text-white leading-none tracking-tighter shadow-xl">{activeChordName || 'Open'}</div>
             </div>
        </div>
    );
};

interface SoloMarker {
    string: number; 
    fret: number;
    id: number;
}

const SoloModeStage = ({ onPlayNote, markers }: { onPlayNote: (s: number, f: number) => void, markers: SoloMarker[] }) => {
    const frets = 15;
    const boardRef = useRef<HTMLDivElement>(null);

    const handleBoardClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (!boardRef.current) return;
        
        const rect = boardRef.current.getBoundingClientRect();
        let clientX, clientY;
        
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const fretWidth = rect.width / frets;
        const fret = Math.floor(x / fretWidth) + 1;
        
        const totalH = rect.height;
        const stringHeight = totalH / 6;
        const visualRow = Math.floor(y / stringHeight);
        const stringIdx = 5 - visualRow; 

        if (stringIdx >= 0 && stringIdx <= 5 && fret >= 1 && fret <= frets) {
            onPlayNote(stringIdx, fret);
        }
    };

    return (
        <div className="w-full h-full bg-[#0c0a09] relative flex items-center justify-center overflow-hidden select-none">
            <div 
                ref={boardRef}
                className="w-full h-full relative bg-[#3f1f14] cursor-pointer overflow-hidden"
                onMouseDown={handleBoardClick}
                onTouchStart={handleBoardClick}
                onMouseMove={(e) => { if (e.buttons === 1) handleBoardClick(e); }}
                onTouchMove={(e) => { handleBoardClick(e); }}
                style={{ 
                    backgroundImage: `
                        linear-gradient(90deg, rgba(0,0,0,0.6) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.6) 100%),
                        url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`
                }}
            >
                 {Array.from({length: frets}).map((_, i) => (
                     <div key={i} 
                        className="absolute top-0 bottom-0 pointer-events-none z-0"
                        style={{ 
                            left: `${((i + 1) / frets) * 100}%`,
                            width: '4px', 
                            transform: 'translateX(-50%)',
                            background: 'linear-gradient(90deg, #525252, #e5e5e5, #525252)',
                            boxShadow: '2px 0 4px rgba(0,0,0,0.8)'
                        }}
                     >
                         <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[#a8a29e] text-[10px] font-bold opacity-50">{i + 1}</span>
                     </div>
                 ))}

                 {[3, 5, 7, 9, 12, 15].map(f => (
                     <div key={f} 
                        className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none z-0"
                        style={{ 
                            left: `${((f - 0.5) / frets) * 100}%`,
                            width: f===12 ? '30px' : '18px',
                            height: f===12 ? '30px' : '18px',
                            background: '#e5e7eb',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                            transform: f===12 ? 'translate(-50%, -50%) rotate(45deg)' : 'translate(-50%, -50%)',
                            opacity: 0.8
                        }}
                     />
                 ))}

                 {Array.from({length: 6}).map((_, i) => {
                     const visualRow = i;
                     const stringIdx = 5 - i;
                     const isWound = stringIdx < 4;
                     const thickness = isWound ? 4 + ((3-stringIdx) * 1) : 2 + ((5-stringIdx) * 0.5);
                     const topPerc = ((i * 2) + 1) * (100/12);

                     return (
                         <div key={stringIdx} 
                              className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                              style={{ top: `${topPerc}%`, height: '2px', transform: 'translateY(-50%)' }}
                         >
                             <div className="w-full relative">
                                 <div className="absolute top-[3px] left-0 right-0 h-[4px] bg-black/60 blur-[2px]" />
                                 <div className="w-full flex items-center justify-center">
                                      <GuitarStringVisual 
                                          thickness={thickness}
                                          isWound={isWound}
                                          isActive={true}
                                          isVibrating={false}
                                      />
                                 </div>
                             </div>
                         </div>
                     )
                 })}

                 {markers.map(m => {
                     const visualRow = 5 - m.string;
                     const leftPerc = ((m.fret - 0.5) / frets) * 100;
                     const topPerc = ((visualRow * 2) + 1) * (100/12);

                     return (
                         <div key={m.id}
                            className="absolute w-12 h-12 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_20px_#22d3ee] z-20 transform -translate-x-1/2 -translate-y-1/2 animate-ping-once pointer-events-none mix-blend-screen"
                            style={{ 
                                left: `${leftPerc}%`, 
                                top: `${topPerc}%` 
                            }}
                         />
                     )
                 })}
            </div>
            
            <style>{`
                @keyframes vibrate {
                    0% { transform: scaleY(1); }
                    25% { transform: scaleY(1.3); }
                    50% { transform: scaleY(0.9); }
                    75% { transform: scaleY(1.2); }
                    100% { transform: scaleY(1); }
                }
                .animate-vibrate {
                    animation: vibrate 0.08s linear infinite;
                }
                @keyframes pingOnce {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(2.0); opacity: 0; }
                }
                .animate-ping-once {
                    animation: pingOnce 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export const GuitarGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [mode, setMode] = useState<'CHORD' | 'SOLO'>('CHORD');
    const pressedKeysRef = useRef<Set<string>>(new Set());
    const [activeChordCode, setActiveChordCode] = useState<string | null>(null);
    const [markers, setMarkers] = useState<SoloMarker[]>([]);

    const handleStrum = (stringIdx: number) => {
        let shape = [0, 0, 0, 0, 0, 0]; // Default open
        if (activeChordCode && KEY_CHORD_MAP[activeChordCode]) {
            shape = KEY_CHORD_MAP[activeChordCode].shape;
        } 
        const fret = shape[stringIdx];
        playNote(stringIdx, fret);
    };

    const handleSoloPlay = (stringIdx: number, fret: number) => {
        playNote(stringIdx, fret);
        const id = Math.random();
        setMarkers(prev => [...prev, { string: stringIdx, fret, id }]);
        setTimeout(() => setMarkers(prev => prev.filter(m => m.id !== id)), 500);
    };

    useEffect(() => {
        const updateChord = () => {
            if (pressedKeysRef.current.size === 0) {
                setActiveChordCode(null);
                return;
            }
            let found = null;
            for (const btn of CHORD_BUTTONS) {
                if (pressedKeysRef.current.has(btn.code)) found = btn.code;
            }
            setActiveChordCode(found);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            
            if (mode === 'CHORD') {
                if (KEY_CHORD_MAP[e.code]) {
                    pressedKeysRef.current.add(e.code);
                    updateChord();
                }
            } else {
                if (e.shiftKey) {
                    const s5 = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'];
                    const f5 = s5.indexOf(e.code);
                    if (f5 !== -1) { handleSoloPlay(5, f5 + 1); return; }
                    const s4 = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'];
                    const f4 = s4.indexOf(e.code);
                    if (f4 !== -1) { handleSoloPlay(4, f4 + 1); return; }
                } else {
                    const s3 = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'];
                    const f3 = s3.indexOf(e.code);
                    if (f3 !== -1) { handleSoloPlay(3, f3 + 1); return; }
                    const s2 = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'];
                    const f2 = s2.indexOf(e.code);
                    if (f2 !== -1) { handleSoloPlay(2, f2 + 1); return; }
                    const s1 = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'];
                    const f1 = s1.indexOf(e.code);
                    if (f1 !== -1) { handleSoloPlay(1, f1 + 1); return; }
                    const s0 = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'];
                    const f0 = s0.indexOf(e.code);
                    if (f0 !== -1) { handleSoloPlay(0, f0 + 1); return; }
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (mode === 'CHORD') {
                if (pressedKeysRef.current.has(e.code)) {
                    pressedKeysRef.current.delete(e.code);
                    updateChord();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [mode]);

    const currentChord = activeChordCode ? KEY_CHORD_MAP[activeChordCode] : { name: '', shape: [0,0,0,0,0,0] };

    return (
        <div className="w-full h-full flex flex-col bg-[#1c1917] relative">
            <BackButton onClick={onBack} />
            
            <div className="h-16 flex items-center justify-center px-4 z-50 bg-[#0c0a09]/80 backdrop-blur border-b border-white/10 shrink-0">
                <div className="flex bg-black/50 rounded-full p-1 border border-white/10">
                     <button onClick={() => setMode('CHORD')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'CHORD' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>CHORDS</button>
                     <button onClick={() => setMode('SOLO')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'SOLO' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}>SOLO</button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                {mode === 'CHORD' ? (
                    <ChordModeStage 
                        activeChordName={currentChord.name}
                        activeShape={currentChord.shape}
                        onStrum={handleStrum}
                    />
                ) : (
                    <SoloModeStage 
                        onPlayNote={handleSoloPlay}
                        markers={markers}
                    />
                )}
            </div>
            
            {mode === 'CHORD' && (
                <div className="h-40 bg-[#0c0a09] border-t border-white/10 p-2 overflow-y-auto shrink-0 z-40 custom-scrollbar">
                     <div className="text-center text-[10px] text-gray-500 font-bold mb-2 uppercase">Tap to Select Chord</div>
                     <div className="flex flex-wrap justify-center gap-1.5 pb-4">
                         {CHORD_BUTTONS.map(btn => (
                             <button
                                key={btn.code}
                                onClick={() => setActiveChordCode(btn.code)}
                                className={`w-12 h-14 rounded-lg flex flex-col items-center justify-center border transition-all ${activeChordCode === btn.code ? 'bg-orange-600 border-orange-400 text-white scale-95 shadow-[0_0_15px_rgba(234,88,12,0.6)]' : 'bg-zinc-800 border-zinc-700 text-gray-400'}`}
                             >
                                 <span className="text-base font-black">{btn.display}</span>
                                 <span className="text-[9px] uppercase opacity-50">{btn.code.replace('Key','').replace('Digit','')}</span>
                             </button>
                         ))}
                     </div>
                </div>
            )}
        </div>
    );
};
