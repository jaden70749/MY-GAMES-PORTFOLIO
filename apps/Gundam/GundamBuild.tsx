
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, ContactShadows, Float, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { BackButton } from '../../components/BackButton';

// --- 파츠 정의 (건담의 주요 부위) ---
interface Part {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  type: 'box' | 'cone' | 'cylinder';
}

const GUNDAM_PARTS: Part[] = [
  // 몸체 및 머리
  { id: 'torso', name: '가슴 장갑 (Torso)', position: [0, 1.5, 0], rotation: [0, 0, 0], scale: [1.2, 1.3, 0.8], color: '#1e3a8a', type: 'box' },
  { id: 'waist', name: '허리 유닛 (Waist)', position: [0, 0.8, 0], rotation: [0, 0, 0], scale: [1, 0.4, 0.7], color: '#f8fafc', type: 'box' },
  { id: 'head', name: '헤드 유닛 (Head)', position: [0, 2.5, 0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5], color: '#f8fafc', type: 'box' },
  { id: 'v_fin', name: 'V-안테나 (V-Fin)', position: [0, 2.8, 0.3], rotation: [Math.PI, 0, 0], scale: [0.8, 0.2, 0.1], color: '#fbbf24', type: 'cone' },
  
  // 팔
  { id: 'arm_l', name: '왼팔 하부 (L-Arm)', position: [1.1, 1.6, 0], rotation: [0, 0, -0.1], scale: [0.3, 1, 0.3], color: '#f8fafc', type: 'box' },
  { id: 'arm_r', name: '오른팔 하부 (R-Arm)', position: [-1.1, 1.6, 0], rotation: [0, 0, 0.1], scale: [0.3, 1, 0.3], color: '#f8fafc', type: 'box' },
  { id: 'shoulder_l', name: '왼쪽 어깨 (L-Shoulder)', position: [1.2, 2.2, 0], rotation: [0, 0, 0], scale: [0.8, 0.6, 0.9], color: '#1e3a8a', type: 'box' },
  { id: 'shoulder_r', name: '오른쪽 어깨 (R-Shoulder)', position: [-1.2, 2.2, 0], rotation: [0, 0, 0], scale: [0.8, 0.6, 0.9], color: '#1e3a8a', type: 'box' },
  
  // 다리
  { id: 'leg_l', name: '왼쪽 다리 (L-Leg)', position: [0.5, -0.3, 0], rotation: [0, 0, 0], scale: [0.45, 1.8, 0.5], color: '#f8fafc', type: 'box' },
  { id: 'leg_r', name: '오른쪽 다리 (R-Leg)', position: [-0.5, -0.3, 0], rotation: [0, 0, 0], scale: [0.45, 1.8, 0.5], color: '#f8fafc', type: 'box' },
  { id: 'foot_l', name: '왼발 (L-Foot)', position: [0.5, -1.3, 0.2], rotation: [0, 0, 0], scale: [0.5, 0.3, 0.9], color: '#be123c', type: 'box' },
  { id: 'foot_r', name: '오른발 (R-Foot)', position: [-0.5, -1.3, 0.2], rotation: [0, 0, 0], scale: [0.5, 0.3, 0.9], color: '#be123c', type: 'box' },
  
  // 무장
  { id: 'backpack', name: '고기동 백팩 (Backpack)', position: [0, 1.8, -0.7], rotation: [0, 0, 0], scale: [1.4, 1.2, 0.5], color: '#334155', type: 'box' },
  { id: 'wing_l', name: '윙 바인더 L (Wing L)', position: [1.5, 2.5, -1], rotation: [0.5, -0.5, -0.5], scale: [0.2, 3, 1], color: '#1d4ed8', type: 'box' },
  { id: 'wing_r', name: '윙 바인더 R (Wing R)', position: [-1.5, 2.5, -1], rotation: [0.5, 0.5, 0.5], scale: [0.2, 3, 1], color: '#1d4ed8', type: 'box' },
  { id: 'shield', name: '대형 실드 (Shield)', position: [1.8, 1.2, 0.5], rotation: [0, 0.3, 0], scale: [0.1, 2.5, 1.2], color: '#be123c', type: 'box' },
  { id: 'rifle', name: '빔 라이플 (Rifle)', position: [-1.8, 1.2, 1], rotation: [Math.PI / 2, 0, 0], scale: [0.2, 0.2, 3], color: '#475569', type: 'cylinder' },
];

const RobotPart = ({ part, assembled, isActive, isLastAdded }: { part: Part, assembled: boolean, isActive: boolean, isLastAdded: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (assembled) {
      meshRef.current.position.lerp(new THREE.Vector3(...part.position), 0.15);
      meshRef.current.rotation.set(...part.rotation);
      meshRef.current.scale.lerp(new THREE.Vector3(...part.scale), 0.15);
    } else if (isActive) {
      const t = state.clock.elapsedTime;
      meshRef.current.position.y = 4 + Math.sin(t * 2) * 0.3;
      meshRef.current.position.x = Math.cos(t) * 2;
      meshRef.current.position.z = Math.sin(t) * 2;
      meshRef.current.rotation.y += delta * 1.5;
      meshRef.current.scale.setScalar(1.5);
    }
  });

  if (!assembled && !isActive) return null;

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        {part.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
        {part.type === 'cone' && <coneGeometry args={[0.5, 1, 4]} />}
        {part.type === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 16]} />}
        
        <meshStandardMaterial 
          color={assembled ? part.color : '#60a5fa'} 
          emissive={isActive ? '#3b82f6' : assembled && isLastAdded ? '#ffffff' : '#000000'}
          emissiveIntensity={isActive ? 1.5 : isLastAdded ? 0.5 : 0}
          metalness={0.8}
          roughness={0.2}
          transparent={!assembled}
          opacity={assembled ? 1 : 0.7}
        />
      </mesh>
      
      {assembled && isLastAdded && (
        <Sparkles 
          position={part.position} 
          count={20} 
          scale={2} 
          size={2} 
          speed={0.5} 
          color="#60a5fa" 
        />
      )}
    </group>
  );
};

const AssemblyScene = ({ assembledParts, activePartIdx }: { assembledParts: string[], activePartIdx: number }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={50} />
      <OrbitControls 
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        autoRotate={assembledParts.length === GUNDAM_PARTS.length}
        autoRotateSpeed={0.5}
      />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="night" />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, -5, -10]} color="#3b82f6" intensity={1} />
      <pointLight position={[10, 5, 5]} color="#ef4444" intensity={0.5} />

      <group position={[0, 0, 0]}>
        {GUNDAM_PARTS.map((part, idx) => (
          <RobotPart 
            key={part.id} 
            part={part} 
            assembled={assembledParts.includes(part.id)}
            isActive={idx === activePartIdx}
            isLastAdded={assembledParts[assembledParts.length - 1] === part.id}
          />
        ))}
      </group>

      <ContactShadows position={[0, -2, 0]} opacity={0.7} scale={20} blur={2.5} far={4} />
      <gridHelper args={[40, 40, '#1e293b', '#0f172a']} position={[0, -2, 0]} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#020617" />
      </mesh>
    </>
  );
};

export const GundamBuild: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [assembledParts, setAssembledParts] = useState<string[]>([]);
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const assembleNext = () => {
    if (activePartIdx >= GUNDAM_PARTS.length) return;
    
    const part = GUNDAM_PARTS[activePartIdx];
    setAssembledParts(prev => [...prev, part.id]);
    
    if (activePartIdx === GUNDAM_PARTS.length - 1) {
      setIsComplete(true);
    } else {
      setActivePartIdx(prev => prev + 1);
    }

    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 800);
  };

  const progress = (assembledParts.length / GUNDAM_PARTS.length) * 100;

  return (
    <div className="relative w-full h-full bg-[#020617] text-white font-mono overflow-hidden select-none">
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <AssemblyScene 
              assembledParts={assembledParts} 
              activePartIdx={isComplete ? -1 : activePartIdx} 
            />
          </Suspense>
        </Canvas>
      </div>

      <BackButton onClick={onBack} />

      <div className="absolute top-20 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.5)]">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-sky-400">GUNPLA MASTER 3D</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Mobile Suit Factory System v4.0</p>
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 right-8 -translate-y-1/2 hidden lg:flex flex-col gap-2 z-10">
        <div className="text-[10px] font-black text-slate-500 mb-2 border-b border-slate-800 pb-1">ASSEMBLY LOG</div>
        {GUNDAM_PARTS.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 justify-end group">
            <span className={`text-[9px] font-bold transition-all ${assembledParts.includes(p.id) ? 'text-sky-400' : i === activePartIdx ? 'text-white animate-pulse' : 'text-slate-700'}`}>
              {p.name.split(' ')[0]}
            </span>
            <div className={`w-2 h-2 rounded-sm border transition-all ${assembledParts.includes(p.id) ? 'bg-sky-500 border-sky-400 shadow-[0_0_5px_#38bdf8]' : i === activePartIdx ? 'border-white scale-110' : 'border-slate-800'}`} />
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl">
          <div className="flex justify-between items-end mb-3 px-2">
            <div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Module</div>
              <div className="text-xl font-black">
                {isComplete ? '조립 완료 (Unit Complete)' : GUNDAM_PARTS[activePartIdx].name}
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-sky-400 italic">{Math.round(progress)}%</span>
            </div>
          </div>

          <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-6 border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(56,189,248,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-4">
            {!isComplete ? (
              <button 
                onClick={assembleNext}
                className="flex-1 py-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 group border-b-4 border-sky-800"
              >
                <span className="group-hover:translate-y-[-2px] transition-transform uppercase italic">Snap Part</span>
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.5,6.5H4.5C3.395,6.5,2.5,7.395,2.5,8.5V15.5C2.5,16.605,3.395,17.5,4.5,17.5H19.5C20.605,17.5,21.5,16.605,21.5,15.5V8.5C21.5,7.395,20.605,6.5,19.5,6.5Z" />
                </svg>
              </button>
            ) : (
              <button 
                onClick={() => { setAssembledParts([]); setActivePartIdx(0); setIsComplete(false); }}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-emerald-800"
              >
                <span className="uppercase italic">New Assembly</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="text-6xl font-black italic text-sky-400 animate-bounce tracking-tighter drop-shadow-[0_0_20px_rgba(56,189,248,0.8)]">
            CLICK!
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/20 animate-scan z-10 pointer-events-none" />

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0vh); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
      `}</style>
    </div>
  );
};
