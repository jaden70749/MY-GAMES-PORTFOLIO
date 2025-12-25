
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { OrthographicCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import '../../types';
import { BackButton } from '../../components/BackButton';

// --- Types ---
interface BoxData {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

interface DebrisData extends BoxData {
  id: string;
  velocity: [number, number, number];
}

// --- Constants ---
const BOX_HEIGHT = 1;
const MOVE_SPEED_BASE = 9; // 초당 이동 유닛
const INITIAL_SIZE = 3;
const CAMERA_ZOOM = 40;

// --- Sound Logic ---
const playTone = (note: number) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const baseFreq = 220;
    const notes = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; // Major Pentatonic steps
    const index = note % notes.length;
    const octave = Math.floor(note / notes.length);
    const freq = baseFreq * Math.pow(2, (notes[index] + octave * 12) / 12);

    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
};

const playCrash = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.5);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
};

// --- Components ---

const GameBox = ({ position, size, color }: BoxData) => {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color="rgba(255,255,255,0.4)" />
      </lineSegments>
    </mesh>
  );
};

const Debris = ({ position, size, color, velocity }: DebrisData) => {
  const ref = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(true);

  useFrame((_, delta) => {
    if (!ref.current || !visible) return;
    
    ref.current.position.x += velocity[0] * delta * 10;
    ref.current.position.y += velocity[1] * delta * 10;
    ref.current.position.z += velocity[2] * delta * 10;
    
    ref.current.rotation.x += delta * 2;
    ref.current.rotation.z += delta * 2;
    
    const scaleFactor = Math.pow(0.95, delta * 60);
    ref.current.scale.multiplyScalar(scaleFactor);

    if (ref.current.scale.x < 0.05) setVisible(false);
  });

  if (!visible) return null;

  return (
    <mesh ref={ref} position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
};

const StackScene: React.FC<{
  setScore: (s: number) => void;
  setGameOver: (b: boolean) => void;
  isGameover: boolean;
  onRestartSignal: number; 
}> = ({ setScore, setGameOver, isGameover, onRestartSignal }) => {
  const [stack, setStack] = useState<BoxData[]>([]);
  const [debris, setDebris] = useState<DebrisData[]>([]);
  const [currentBlock, setCurrentBlock] = useState<BoxData | null>(null);
  
  const direction = useRef(1); 
  const levelRef = useRef(0);
  const clickProcessed = useRef(false);
  const hueRef = useRef(0);
  const camRef = useRef<THREE.Group>(null);

  const initGame = () => {
    hueRef.current = Math.random();
    const startColor = new THREE.Color().setHSL(hueRef.current, 0.6, 0.5);
    const baseBlock: BoxData = {
      position: [0, 0, 0],
      size: [INITIAL_SIZE, BOX_HEIGHT, INITIAL_SIZE],
      color: '#' + startColor.getHexString()
    };
    
    setStack([baseBlock]);
    
    hueRef.current += 0.05;
    const nextColor = new THREE.Color().setHSL(hueRef.current, 0.6, 0.5).getStyle();
    setCurrentBlock({
      position: [-10, BOX_HEIGHT, 0], 
      size: [INITIAL_SIZE, BOX_HEIGHT, INITIAL_SIZE],
      color: nextColor
    });

    setDebris([]);
    levelRef.current = 1;
    direction.current = 1;
    setScore(0);
    setGameOver(false);
    clickProcessed.current = false;
  };

  useEffect(() => {
    initGame();
  }, [onRestartSignal]);

  useEffect(() => {
    const handleAction = () => {
      if (isGameover || clickProcessed.current || !currentBlock) return;
      clickProcessed.current = true;
      placeBlock();
    };

    const onKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') handleAction(); };
    window.addEventListener('mousedown', handleAction);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', handleAction);

    return () => {
      window.removeEventListener('mousedown', handleAction);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', handleAction);
    };
  }, [stack, currentBlock, isGameover]);

  const placeBlock = () => {
    if (!currentBlock) return;

    const prevBlock = stack[stack.length - 1];
    const isMovingX = levelRef.current % 2 !== 0;

    const pos = currentBlock.position;
    const prevPos = prevBlock.position;
    const size = currentBlock.size;

    const deltaDist = isMovingX ? pos[0] - prevPos[0] : pos[2] - prevPos[2];
    const overhang = Math.abs(deltaDist);
    const overlap = isMovingX ? size[0] - overhang : size[2] - overhang;

    if (overlap > 0) {
      playTone(levelRef.current);

      const newSize: [number, number, number] = isMovingX 
        ? [overlap, BOX_HEIGHT, size[2]] 
        : [size[0], BOX_HEIGHT, overlap];
      
      const newPos: [number, number, number] = [...pos] as [number, number, number];
      if (isMovingX) {
        newPos[0] = prevPos[0] + deltaDist / 2;
      } else {
        newPos[2] = prevPos[2] + deltaDist / 2;
      }

      const placedBlock: BoxData = {
        position: newPos,
        size: newSize,
        color: currentBlock.color
      };
      setStack(prev => [...prev, placedBlock]);
      setScore(levelRef.current);

      const debrisSize: [number, number, number] = isMovingX 
        ? [overhang, BOX_HEIGHT, size[2]] 
        : [size[0], BOX_HEIGHT, overhang];
      
      if (overhang > 0.1) {
          const dPos: [number, number, number] = [...pos] as [number, number, number];
          if (isMovingX) {
             dPos[0] = (pos[0] > prevPos[0]) 
                ? newPos[0] + newSize[0] / 2 + debrisSize[0] / 2
                : newPos[0] - newSize[0] / 2 - debrisSize[0] / 2;
          } else {
             dPos[2] = (pos[2] > prevPos[2])
                ? newPos[2] + newSize[2] / 2 + debrisSize[2] / 2
                : newPos[2] - newSize[2] / 2 - debrisSize[2] / 2;
          }
    
          const newDebris: DebrisData = {
            id: Math.random().toString(),
            position: dPos,
            size: debrisSize,
            color: currentBlock.color,
            velocity: [0, -1, 0]
          };
          setDebris(prev => [...prev, newDebris]);
      }

      levelRef.current += 1;
      hueRef.current += 0.05;
      const nextColor = new THREE.Color().setHSL(hueRef.current % 1, 0.6, 0.5).getStyle();
      
      const nextIsX = levelRef.current % 2 !== 0;
      const spawnDist = 12;

      setCurrentBlock({
        position: nextIsX 
          ? [-spawnDist, levelRef.current * BOX_HEIGHT, newPos[2]] 
          : [newPos[0], levelRef.current * BOX_HEIGHT, -spawnDist], 
        size: newSize, 
        color: nextColor
      });
      
      clickProcessed.current = false; 

    } else {
      playCrash();
      setGameOver(true);
      setDebris(prev => [...prev, {
        id: Math.random().toString(),
        position: currentBlock.position,
        size: currentBlock.size,
        color: currentBlock.color,
        velocity: [0, -2, 0]
      }]);
      setCurrentBlock(null);
    }
  };

  useFrame((state, delta) => {
    if (isGameover || !currentBlock) return;
    const dt = Math.min(delta, 0.1);

    const speed = (MOVE_SPEED_BASE + (levelRef.current * 0.3)); 
    const limit = 12;
    const isMovingX = levelRef.current % 2 !== 0;

    setCurrentBlock(prev => {
        if (!prev) return null;
        const newPos: [number, number, number] = [...prev.position] as [number, number, number];
        
        if (isMovingX) {
            newPos[0] += speed * dt * direction.current;
            if (newPos[0] > limit) direction.current = -1;
            if (newPos[0] < -limit) direction.current = 1;
        } else {
            newPos[2] += speed * dt * direction.current;
            if (newPos[2] > limit) direction.current = -1;
            if (newPos[2] < -limit) direction.current = 1;
        }
        return { ...prev, position: newPos };
    });

    if (camRef.current) {
       const targetY = levelRef.current * BOX_HEIGHT + 4;
       camRef.current.position.y = THREE.MathUtils.lerp(camRef.current.position.y, targetY, 0.05);
    }
  });

  return (
    <>
      <group ref={camRef} position={[0, 4, 0]}>
        <OrthographicCamera 
            makeDefault 
            position={[20, 20, 20]} 
            zoom={CAMERA_ZOOM} 
            near={-50} 
            far={200}
            onUpdate={c => c.lookAt(0, 0, 0)}
        />
        <pointLight position={[10, 20, 10]} intensity={0.6} castShadow />
      </group>
      
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[-10, 30, 20]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />

      {stack.map((box, i) => (
        <GameBox key={i} {...box} />
      ))}

      {currentBlock && <GameBox {...currentBlock} />}

      {debris.map((d) => (
        <Debris key={d.id} {...d} />
      ))}

      <mesh position={[0, -1, 0]} receiveShadow>
         <cylinderGeometry args={[5, 8, 2, 32]} />
         <meshStandardMaterial color="#333" />
      </mesh>
    </>
  );
};

export const StackGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [restartSignal, setRestartSignal] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score]);

  const handleRestart = () => {
    setRestartSignal(s => s + 1);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] select-none touch-none">
      <Canvas shadows dpr={[1, 2]}>
        <StackScene 
            setScore={setScore} 
            setGameOver={setGameOver} 
            isGameover={gameOver}
            onRestartSignal={restartSignal}
        />
      </Canvas>

      <div className="absolute top-20 left-0 right-0 flex flex-col items-center pointer-events-none z-10">
          <div className="text-7xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{score}</div>
          {highScore > 0 && <div className="text-sm font-bold text-white/50 mt-2">BEST: {highScore}</div>}
      </div>

      <BackButton onClick={onBack} />

      {gameOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-md">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center transform scale-110 transition-all border-4 border-indigo-500">
                <h2 className="text-3xl font-black text-slate-800 mb-2">GAME OVER</h2>
                <div className="text-5xl font-black text-rose-500 mb-2">{score}</div>
                <div className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Blocks Stacked</div>
                <button 
                    onClick={handleRestart}
                    className="px-8 py-3 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
                >
                    TRY AGAIN
                </button>
            </div>
        </div>
      )}

      {!gameOver && score === 0 && (
          <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none animate-bounce z-10">
              <span className="bg-white/10 text-white px-6 py-3 rounded-full font-bold text-sm backdrop-blur-md border border-white/20">
                 Tap or Space to Stack
              </span>
          </div>
      )}
    </div>
  );
};
