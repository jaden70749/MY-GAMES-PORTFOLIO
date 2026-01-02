
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'https://esm.sh/matter-js';
import { BackButton } from '../../components/BackButton';

// 상수 설정
const SHAPE_TYPES = ['square', 'rectangle', 'triangle', 'plank', 'beam', 'stair', 'ladder'];
const VOID_WIDTH_PERCENT = 0.20;

// 다음 블럭 아이콘 컴포넌트
const ShapeIcon = ({ type }: { type: string }) => {
  const baseClass = "bg-white border border-white/20 shadow-sm";
  switch (type) {
    case 'square': return <div className={`w-8 h-8 ${baseClass}`} />;
    case 'rectangle': return <div className={`w-12 h-6 ${baseClass}`} />;
    case 'triangle': return <div className={`w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[28px] border-b-white`} />;
    case 'plank': return <div className={`w-16 h-2 ${baseClass}`} />;
    case 'beam': return <div className={`w-2 h-16 ${baseClass}`} />;
    case 'stair': return (
      <div className="flex items-end">
        <div className={`w-5 h-5 ${baseClass}`} />
        <div className={`w-5 h-10 ${baseClass}`} />
      </div>
    );
    case 'ladder': return (
      <div className="flex gap-1 h-12">
        <div className={`w-1.5 h-full ${baseClass}`} />
        <div className="flex flex-col justify-between py-1">
          <div className="w-4 h-1 bg-white/50" />
          <div className="w-4 h-1 bg-white/50" />
          <div className="w-4 h-1 bg-white/50" />
        </div>
        <div className={`w-1.5 h-full ${baseClass}`} />
      </div>
    );
    default: return <div className={`w-8 h-8 ${baseClass}`} />;
  }
};

export const ShapeStacker: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const groundRef = useRef<Matter.Body | null>(null);
  const [nextShape, setNextShape] = useState<string>(SHAPE_TYPES[0]);
  const activeBodyRef = useRef<Matter.Body | null>(null); 
  const mouseXRef = useRef(window.innerWidth / 2);
  
  const [height, setHeight] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [showDamageFlash, setShowDamageFlash] = useState(false);

  const settleTimersRef = useRef<Map<number, number>>(new Map());
  const processedFallsRef = useRef<Set<number>>(new Set());
  const cameraYRef = useRef(0);
  const isWaitingRef = useRef(false);

  const getRandomColor = () => {
    const colors = [
      { main: '#3b82f6', border: '#60a5fa' }, // Blue
      { main: '#10b981', border: '#34d399' }, // Green
      { main: '#f59e0b', border: '#fbbf24' }, // Amber
      { main: '#8b5cf6', border: '#a78bfa' }, // Purple
      { main: '#ec4899', border: '#f472b6' }, // Pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createShatterEffect = (x: number, y: number, color: string) => {
    if (!engineRef.current) return;
    const particles: Matter.Body[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 6 + 2;
      const particle = Matter.Bodies.rectangle(x, y, size, size, {
        friction: 0.1,
        restitution: 0.4,
        render: { fillStyle: color, opacity: 0.8 },
        label: 'particle'
      });
      const force = 0.02;
      Matter.Body.applyForce(particle, particle.position, {
        x: (Math.random() - 0.5) * force,
        y: (Math.random() - 0.5) * force
      });
      particles.push(particle);
    }
    Matter.World.add(engineRef.current.world, particles);
    setTimeout(() => {
      if (engineRef.current && engineRef.current.world) {
        Matter.Composite.remove(engineRef.current.world, particles);
      }
    }, 1000);
  };

  const triggerLifeLoss = () => {
    setLives(prev => {
      const next = Math.max(0, prev - 1);
      if (next <= 0) setGameOver(true);
      return next;
    });
    setShowDamageFlash(true);
    setTimeout(() => setShowDamageFlash(false), 200);
  };

  const handleResize = useCallback(() => {
    if (!renderRef.current || !sceneRef.current || !engineRef.current || !groundRef.current) return;
    
    const width = sceneRef.current.clientWidth;
    const heightLimit = sceneRef.current.clientHeight;

    renderRef.current.options.width = width;
    renderRef.current.options.height = heightLimit;
    renderRef.current.canvas.width = width;
    renderRef.current.canvas.height = heightLimit;

    // 땅(Platform) 위치 재조정
    Matter.Body.setPosition(groundRef.current, { x: width / 2, y: heightLimit - 40 });
  }, []);

  const initPhysics = useCallback(() => {
    if (!sceneRef.current) return;

    const width = sceneRef.current.clientWidth;
    const heightLimit = sceneRef.current.clientHeight;

    const engine = Matter.Engine.create({
      enableSleeping: true,
      positionIterations: 8,
      velocityIterations: 8
    });
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: width,
        height: heightLimit,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio,
      },
    });
    renderRef.current = render;

    const groundTopY = heightLimit - 80;
    const groundBase = Matter.Bodies.rectangle(width / 2, heightLimit - 40, width * 0.4, 80, {
      isStatic: true,
      render: { fillStyle: '#0f172a', strokeStyle: '#334155', lineWidth: 4 },
      label: 'ground'
    });
    groundRef.current = groundBase;

    Matter.World.add(engine.world, [groundBase]);
    Matter.Runner.run(Matter.Runner.create(), engine);
    Matter.Render.run(render);

    Matter.Events.on(engine, 'afterUpdate', () => {
        if (!engineRef.current) return;
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        let highestPoint = groundTopY;
        const now = Date.now();
        const currentWidth = sceneRef.current?.clientWidth || width;

        bodies.forEach(body => {
            if (body.label === 'particle') return;
            if (body.isStatic) {
                if (body.label !== 'ground' && body.bounds.min.y < highestPoint) {
                    highestPoint = body.bounds.min.y;
                }
                return;
            }

            const isTouchingVoid = body.bounds.min.x < currentWidth * VOID_WIDTH_PERCENT || body.bounds.max.x > currentWidth * (1 - VOID_WIDTH_PERCENT);
            const isFallingAbyss = body.position.y > groundTopY + 400;
            
            if (isTouchingVoid || isFallingAbyss) {
                if (!processedFallsRef.current.has(body.id)) {
                    processedFallsRef.current.add(body.id);
                    createShatterEffect(body.position.x, body.position.y, body.render.fillStyle || '#ffffff');
                    triggerLifeLoss();
                    Matter.Composite.remove(engineRef.current!.world, body);

                    if (activeBodyRef.current?.id === body.id) {
                      isWaitingRef.current = true;
                      setTimeout(() => {
                        activeBodyRef.current = null;
                        isWaitingRef.current = false;
                      }, 400);
                    }
                }
                return;
            }

            const vel = Matter.Vector.magnitude(body.velocity);
            const angVel = Math.abs(body.angularVelocity);

            if (vel < 0.2 && angVel < 0.1) {
                if (!settleTimersRef.current.has(body.id)) {
                    settleTimersRef.current.set(body.id, now);
                } else if (now - settleTimersRef.current.get(body.id)! > 700) {
                    const colors = getRandomColor();
                    Matter.Body.setStatic(body, true);
                    const allParts = body.parts.length > 1 ? body.parts.slice(1) : [body];
                    allParts.forEach(p => {
                      p.render.fillStyle = colors.main;
                      p.render.strokeStyle = colors.border;
                      p.render.lineWidth = 2;
                      p.render.opacity = 0.8;
                    });
                    settleTimersRef.current.delete(body.id);
                    if (activeBodyRef.current?.id === body.id) activeBodyRef.current = null;
                }
            } else {
                settleTimersRef.current.delete(body.id);
            }
        });

        let targetY = cameraYRef.current;
        if (isWaitingRef.current) {
          targetY = Math.min(0, highestPoint - heightLimit * 0.4);
        } else if (activeBodyRef.current) {
          const bodyY = activeBodyRef.current.position.y;
          const viewportCenter = cameraYRef.current + heightLimit * 0.5;
          if (bodyY > viewportCenter) targetY = bodyY - heightLimit * 0.5;
        } else {
          targetY = Math.min(0, highestPoint - heightLimit * 0.4);
        }

        cameraYRef.current += (targetY - cameraYRef.current) * 0.08; 
        if (renderRef.current) {
          Matter.Render.lookAt(renderRef.current, {
              min: { x: 0, y: cameraYRef.current },
              max: { x: currentWidth, y: cameraYRef.current + heightLimit }
          });
        }

        const currentAltitude = parseFloat((Math.max(0, (groundTopY - highestPoint) / 10)).toFixed(1));
        setHeight(currentAltitude);
    });

    window.addEventListener('resize', handleResize);
  }, [handleResize]);

  const dropShape = (e: React.MouseEvent | React.TouchEvent) => {
    if (!engineRef.current || gameOver || !isGameStarted || !sceneRef.current) return;

    const rect = sceneRef.current.getBoundingClientRect();
    const width = rect.width;
    const safeMin = width * VOID_WIDTH_PERCENT;
    const safeMax = width * (1 - VOID_WIDTH_PERCENT);
    
    let rawX;
    if ('touches' in e) rawX = e.touches[0].clientX - rect.left;
    else rawX = (e as React.MouseEvent).clientX - rect.left;

    const x = Math.max(safeMin, Math.min(safeMax, rawX));
    const type = nextShape;
    const options = { 
      render: { fillStyle: 'rgba(255,255,255,0.9)', strokeStyle: '#ffffff', lineWidth: 1 }, 
      friction: 0.4, 
      restitution: 0.1,
      density: 0.002
    };
    
    let body;
    const spawnY = cameraYRef.current + 40;

    switch(type) {
        case 'square': body = Matter.Bodies.rectangle(x, spawnY, 40, 40, options); break;
        case 'rectangle': body = Matter.Bodies.rectangle(x, spawnY, 80, 40, options); break;
        case 'triangle': body = Matter.Bodies.polygon(x, spawnY, 3, 28, options); break;
        case 'plank': body = Matter.Bodies.rectangle(x, spawnY, 140, 16, options); break;
        case 'beam': body = Matter.Bodies.rectangle(x, spawnY, 18, 110, options); break;
        case 'stair': 
            body = Matter.Body.create({
                parts: [
                    Matter.Bodies.rectangle(x, spawnY, 32, 32, options),
                    Matter.Bodies.rectangle(x + 32, spawnY + 32, 32, 32, options)
                ]
            });
            break;
        case 'ladder':
            body = Matter.Body.create({
                parts: [
                  Matter.Bodies.rectangle(x - 18, spawnY, 10, 100, options),
                  Matter.Bodies.rectangle(x + 18, spawnY, 10, 100, options),
                  Matter.Bodies.rectangle(x, spawnY - 30, 26, 8, options),
                  Matter.Bodies.rectangle(x, spawnY, 26, 8, options),
                  Matter.Bodies.rectangle(x, spawnY + 30, 26, 8, options)
                ]
            });
            break;
        default: body = Matter.Bodies.rectangle(x, spawnY, 40, 40, options);
    }

    Matter.World.add(engineRef.current.world, body);
    activeBodyRef.current = body;
    isWaitingRef.current = false;
    setNextShape(SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const width = rect.width;
    const safeMin = width * VOID_WIDTH_PERCENT;
    const safeMax = width * (1 - VOID_WIDTH_PERCENT);
    const rawX = e.clientX - rect.left;
    const clampedX = Math.max(safeMin, Math.min(safeMax, rawX));
    mouseXRef.current = clampedX;
    const line = document.getElementById('pointer-line');
    if (line) line.style.left = `${clampedX + rect.left}px`;
  };

  useEffect(() => {
    if (isGameStarted) initPhysics();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, [isGameStarted, initPhysics, handleResize]);

  return (
    <div className="w-full h-full bg-[#030616] relative flex flex-col items-center select-none touch-none overflow-hidden font-sans text-white">
      <BackButton onClick={onBack} />
      
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0b1a45_0%,#030616_100%)] pointer-events-none" />
      
      {/* 데미지 피드백 */}
      <div className={`absolute inset-0 bg-rose-600/25 z-[60] pointer-events-none transition-opacity duration-200 ${showDamageFlash ? 'opacity-100' : 'opacity-0'}`} />

      {/* VOID 영역 디자인 (사용자 이미지 기반) */}
      <div className="absolute inset-0 pointer-events-none z-10 flex justify-between">
          <div className="h-full bg-gradient-to-r from-rose-950/40 via-rose-950/10 to-transparent border-r-2 border-rose-600/20 flex flex-col items-center justify-center gap-12" style={{ width: `${VOID_WIDTH_PERCENT * 100}%` }}>
             {"VOID".split("").map((c, i) => (
               <span key={i} className="text-rose-900/40 font-black text-8xl tracking-widest drop-shadow-[0_0_10px_rgba(225,29,72,0.2)]">{c}</span>
             ))}
          </div>
          <div className="h-full bg-gradient-to-l from-rose-950/40 via-rose-950/10 to-transparent border-l-2 border-rose-600/20 flex flex-col items-center justify-center gap-12" style={{ width: `${VOID_WIDTH_PERCENT * 100}%` }}>
             {"VOID".split("").map((c, i) => (
               <span key={i} className="text-rose-900/40 font-black text-8xl tracking-widest drop-shadow-[0_0_10px_rgba(225,29,72,0.2)]">{c}</span>
             ))}
          </div>
      </div>

      {/* HUD (좌측 상단 배치, 이미지 스타일 반영) */}
      <div className="absolute top-8 left-10 pointer-events-none z-50 flex flex-col items-start gap-5">
        <div className="flex gap-4 items-stretch">
            {/* 고도계 박스 */}
            <div className="bg-[#050505] backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] min-w-[160px] flex flex-col justify-center">
                <div className="text-[10px] font-black text-rose-500/80 uppercase tracking-[0.3em] mb-1">ALTITUDE</div>
                <div className="text-7xl font-black italic text-white tracking-tighter leading-none">
                  {Math.floor(height)}<span className="text-xl ml-1 not-italic opacity-40 font-medium tracking-normal">m</span>
                </div>
            </div>

            {/* NEXT 블럭 박스 */}
            <div className="bg-[#050505] backdrop-blur-3xl border border-white/10 p-5 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center min-w-[110px]">
                <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-3">NEXT</div>
                <div className="h-14 flex items-center justify-center scale-110">
                    <ShapeIcon type={nextShape} />
                </div>
            </div>
        </div>

        {/* 하트 (생명력) */}
        <div className="flex gap-4 px-3">
            {[...Array(3)].map((_, i) => (
                <div key={i} className={`transition-all duration-500 transform ${i < lives ? 'scale-110 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]' : 'scale-50 opacity-10 grayscale'}`}>
                    <svg className={`w-12 h-12 ${i < lives ? 'text-rose-600' : 'text-zinc-900'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </div>
            ))}
        </div>
      </div>

      {/* 가이드 라인 (포인터) */}
      {isGameStarted && !gameOver && (
          <div className="fixed top-0 bottom-0 w-[1px] bg-white/30 pointer-events-none z-0 shadow-[0_0_12px_rgba(255,255,255,0.4)]" style={{ left: `${mouseXRef.current}px` }} id="pointer-line" />
      )}

      {/* 메인 게임 씬 */}
      <div ref={sceneRef} 
           onMouseMove={handleMouseMove}
           onMouseDown={dropShape} 
           onTouchStart={dropShape} 
           className="w-full h-full relative z-0 cursor-crosshair" />

      {/* 시작 화면 */}
      {!isGameStarted && (
        <div className="absolute inset-0 bg-[#020512]/96 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 text-center">
            <div className="max-w-md animate-in zoom-in duration-500">
                <div className="mb-4 text-rose-500 font-black tracking-[0.6em] text-xs uppercase animate-pulse">INITIATING PROJECT</div>
                <h1 className="text-8xl font-black italic tracking-tighter uppercase mb-8 text-white leading-none">SNAP<br/><span className="text-rose-600 underline decoration-rose-600/20 underline-offset-[12px]">VOID</span></h1>
                <p className="text-zinc-500 font-bold mb-14 text-[10px] uppercase tracking-[0.4em] leading-relaxed">STAY CENTERED. BUILD HIGHER.<br/>THE <span className="text-rose-600">VOID</span> CONSUMES ALL EDGES.</p>
                <button onClick={() => setIsGameStarted(true)} className="w-full py-6 bg-white text-black font-black text-2xl rounded-[2rem] shadow-[0_12px_0_#94a3b8] hover:bg-rose-600 hover:text-white hover:shadow-[0_12px_0_#9f1239] transition-all uppercase italic active:translate-y-1 active:shadow-none">BOOT CORE</button>
            </div>
        </div>
      )}

      {/* 게임 오버 화면 */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 text-center">
            <div className="animate-in zoom-in duration-500">
                <div className="text-rose-600 font-black text-xs uppercase tracking-[0.5em] mb-4">CRITICAL SYSTEM FAILURE</div>
                <h2 className="text-9xl font-black italic tracking-tighter uppercase mb-4 text-white">LOST</h2>
                <div className="text-white/60 font-black text-4xl mb-14 italic tracking-tight uppercase">MAX ALTITUDE: <span className="text-rose-600">{height}m</span></div>
                <button onClick={() => window.location.reload()} className="w-72 py-6 bg-rose-600 text-white font-black text-2xl rounded-[2rem] shadow-[0_12px_0_#9f1239] active:translate-y-1 active:shadow-none uppercase italic hover:bg-rose-500 transition-all">REBOOT</button>
            </div>
        </div>
      )}
    </div>
  );
};
