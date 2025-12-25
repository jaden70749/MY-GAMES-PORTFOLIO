
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'https://esm.sh/matter-js';
import { BackButton } from '../../components/BackButton';

const SHAPE_TYPES = ['rectangle', 'circle', 'triangle', 'stair', 'ladder', 'plank', 'beam'];
const MATERIALS = [
  { name: 'Stone', color: '#78716c', border: '#44403c', label: '🪨' },
  { name: 'Wood', color: '#92400e', border: '#78350f', label: '🪵' },
  { name: 'Metal', color: '#475569', border: '#1e293b', label: '⚙️' },
  { name: 'Glass', color: '#bae6fd', border: '#7dd3fc', opacity: 0.6, label: '💎' },
];

export const ShapeStacker: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const nextShapeRef = useRef<string>(SHAPE_TYPES[0]);
  
  const [height, setHeight] = useState(0); // 미터(m) 단위
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [nextPreview, setNextPreview] = useState(SHAPE_TYPES[0]);

  const settleTimersRef = useRef<Map<number, number>>(new Map());
  const processedFallsRef = useRef<Set<number>>(new Set());

  const initPhysics = useCallback(() => {
    if (!sceneRef.current) return;

    const width = sceneRef.current.clientWidth || 800;
    const heightLimit = sceneRef.current.clientHeight || 800;

    if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        Matter.World.clear(engineRef.current!.world, false);
        Matter.Engine.clear(engineRef.current!);
        renderRef.current.canvas.remove();
    }

    const engine = Matter.Engine.create();
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

    // 중앙 바닥 (이 위로만 쌓아야 함)
    const platformWidth = width * 0.5;
    const ground = Matter.Bodies.rectangle(width / 2, heightLimit - 30, platformWidth, 60, {
      isStatic: true,
      render: { fillStyle: '#18181b', strokeStyle: '#fbbf24', lineWidth: 4 },
      label: 'ground'
    });

    Matter.World.add(engine.world, [ground]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    Matter.Events.on(engine, 'afterUpdate', () => {
        const bodies = Matter.Composite.allBodies(engine.world);
        let maxTop = heightLimit - 60;
        const now = Date.now();

        bodies.forEach(body => {
            if (body.isStatic) {
                if (body.label !== 'ground' && body.bounds.min.y < maxTop) {
                    maxTop = body.bounds.min.y;
                }
                return;
            }

            // 공허 체크 (좌우 25% 영역)
            const isInsideVoid = body.position.x < width * 0.25 || body.position.x > width * 0.75;
            if (isInsideVoid && body.position.y > heightLimit - 50) {
                if (!processedFallsRef.current.has(body.id)) {
                    processedFallsRef.current.add(body.id);
                    setLives(prev => {
                        const next = prev - 1;
                        if (next <= 0) setGameOver(true);
                        return next;
                    });
                    Matter.World.remove(engine.world, body);
                }
            }

            // 굳히기 로직
            const vel = Matter.Vector.magnitude(body.velocity);
            const angVel = Math.abs(body.angularVelocity);

            if (vel < 0.2 && angVel < 0.1) {
                if (!settleTimersRef.current.has(body.id)) {
                    settleTimersRef.current.set(body.id, now);
                } else {
                    const startTime = settleTimersRef.current.get(body.id)!;
                    if (now - startTime > 1000) {
                        const mat = MATERIALS[Math.floor(Math.random() * MATERIALS.length)];
                        Matter.Body.setStatic(body, true);
                        body.render.fillStyle = mat.color;
                        body.render.strokeStyle = mat.border;
                        body.render.lineWidth = 4;
                        body.render.opacity = mat.opacity || 1;
                        settleTimersRef.current.delete(body.id);
                    }
                }
            } else {
                settleTimersRef.current.delete(body.id);
            }
        });

        // 높이 계산 (10px = 1m)
        const currentHeight = Math.max(0, (heightLimit - 60 - maxTop) / 10);
        setHeight(parseFloat(currentHeight.toFixed(1)));
    });

    setHeight(0);
    setLives(3);
    setGameOver(false);
    processedFallsRef.current = new Set();
  }, []);

  const dropShape = (e: React.MouseEvent | React.TouchEvent) => {
    if (!engineRef.current || gameOver || !isGameStarted || !sceneRef.current) return;

    const rect = sceneRef.current.getBoundingClientRect();
    let x;
    if ('touches' in e) {
        x = e.touches[0].clientX - rect.left;
    } else {
        x = (e as React.MouseEvent).clientX - rect.left;
    }

    const type = nextShapeRef.current;
    const options = { render: { fillStyle: '#cbd5e1', opacity: 0.8 }, friction: 0.8, restitution: 0.1 };
    let body;

    switch(type) {
        case 'circle': body = Matter.Bodies.circle(x, 80, 25, options); break;
        case 'rectangle': body = Matter.Bodies.rectangle(x, 80, 50, 50, options); break;
        case 'triangle': body = Matter.Bodies.polygon(x, 80, 3, 30, options); break;
        case 'plank': body = Matter.Bodies.rectangle(x, 80, 150, 15, options); break;
        case 'beam': body = Matter.Bodies.rectangle(x, 80, 20, 120, options); break;
        case 'stair': 
            body = Matter.Body.create({
                parts: [
                    Matter.Bodies.rectangle(x, 80, 30, 30, options),
                    Matter.Bodies.rectangle(x + 30, 80 + 30, 30, 30, options),
                    Matter.Bodies.rectangle(x + 60, 80 + 60, 30, 30, options)
                ]
            });
            break;
        case 'ladder':
            body = Matter.Body.create({
                parts: [
                    Matter.Bodies.rectangle(x - 20, 80, 10, 100, options),
                    Matter.Bodies.rectangle(x + 20, 80, 10, 100, options),
                    ...[1, 2, 3, 4].map(i => Matter.Bodies.rectangle(x, 80 - 50 + (i * 20), 40, 5, options))
                ]
            });
            break;
        default: body = Matter.Bodies.rectangle(x, 80, 40, 40, options);
    }

    Matter.World.add(engineRef.current.world, body);
    
    const nextS = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
    nextShapeRef.current = nextS;
    setNextPreview(nextS);
  };

  useEffect(() => {
    if (isGameStarted) {
        initPhysics();
        const handleResize = () => !gameOver && initPhysics();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, [isGameStarted, initPhysics, gameOver]);

  return (
    <div className="w-full h-full bg-slate-900 relative flex flex-col items-center select-none touch-none overflow-hidden font-sans">
      <BackButton onClick={onBack} />

      {/* UI Overlay */}
      <div className="absolute top-20 left-0 right-0 px-10 flex justify-between items-start pointer-events-none z-20">
        <div className="flex flex-col gap-4">
            <div className="bg-black/60 backdrop-blur-md border-2 border-white/20 p-4 rounded-2xl shadow-xl min-w-[140px]">
                <div className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Altitude</div>
                <div className="text-4xl font-black italic text-white">{height}<span className="text-xl ml-1 not-italic opacity-50">m</span></div>
            </div>
            <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xl transition-all duration-500 ${i < lives ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : 'bg-slate-800 opacity-30 grayscale'}`}>❤️</div>
                ))}
            </div>
        </div>

        <div className="bg-black/60 backdrop-blur-md border-2 border-white/20 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-2">
            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Next Unit</div>
            <div className="text-4xl">{nextPreview === 'circle' ? '⚪' : nextPreview === 'rectangle' ? '⬜' : nextPreview === 'stair' ? '🪜' : nextPreview === 'ladder' ? '🪜' : nextPreview === 'plank' ? '📏' : nextPreview === 'beam' ? '🧱' : '📐'}</div>
        </div>
      </div>

      {/* Void Area Indicators */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-rose-900/40 to-transparent border-r-2 border-rose-500/20 flex items-center justify-center">
             <span className="rotate-90 text-rose-500/30 font-black tracking-[1em] text-4xl">VOID ZONE</span>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-rose-900/40 to-transparent border-l-2 border-rose-500/20 flex items-center justify-center">
             <span className="-rotate-90 text-rose-500/30 font-black tracking-[1em] text-4xl">VOID ZONE</span>
          </div>
      </div>

      <div 
        ref={sceneRef} 
        onMouseDown={dropShape}
        onTouchStart={dropShape}
        className="w-full h-full max-w-5xl bg-[#0f172a] relative overflow-hidden"
      >
          {/* Guide Line */}
          <div className="absolute top-0 bottom-0 w-px bg-white/5 left-1/2 pointer-events-none"></div>
      </div>

      {/* Modals */}
      {!isGameStarted && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-10">
            <div className="bg-slate-800 border-4 border-sky-500/50 rounded-[3rem] p-12 text-center max-w-md w-full shadow-2xl">
                <div className="text-7xl mb-6">🏗️</div>
                <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-6 text-white">EXTREME BUILDER</h1>
                <p className="text-slate-400 font-bold mb-10 leading-relaxed text-sm">
                    중앙 플랫폼 위에 물체를 쌓아 올리세요.<br/>
                    좌우 <span className="text-rose-400">공허 구역</span>으로 물체가 떨어지면 탈락!<br/>
                    1초간 멈추면 물체가 <span className="text-sky-400">랜덤 재질</span>로 굳어 기초가 됩니다.
                </p>
                <button 
                    onClick={() => setIsGameStarted(true)}
                    className="w-full py-6 bg-sky-500 text-white font-black text-2xl rounded-2xl shadow-[0_10px_0_#0369a1] active:translate-y-2 active:shadow-none transition-all uppercase italic"
                >
                    Start Construction
                </button>
            </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-10">
            <div className="bg-slate-900 border-4 border-rose-500 rounded-[3rem] p-12 text-center max-w-md w-full shadow-2xl">
                <div className="text-8xl mb-6">🏚️</div>
                <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2 text-white">Collapsed!</h2>
                <div className="text-rose-400 font-black text-2xl mb-10 uppercase tracking-widest">Record: {height}m</div>
                <button 
                    onClick={() => { setIsGameStarted(false); setTimeout(() => setIsGameStarted(true), 10); }}
                    className="w-full py-6 bg-rose-500 text-white font-black text-2xl rounded-2xl shadow-[0_10px_0_#9f1239] active:translate-y-2 active:shadow-none transition-all uppercase italic"
                >
                    Rebuild
                </button>
            </div>
        </div>
      )}

      <style>{`
        canvas {
            mask-image: linear-gradient(to bottom, black 90%, transparent 100%);
        }
      `}</style>
    </div>
  );
};
