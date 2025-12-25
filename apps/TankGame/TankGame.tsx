
import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { Environment, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import '../../types';
import { BackButton } from '../../components/BackButton';

// --- Constants & Config ---
const MAP_SIZE = 100;
const MAX_SHAPES = 50;
const MAX_ENEMIES = 8; 
const VIEW_DISTANCE = 35;

// Class Types
type TankClass = 'BASIC' | 'TWIN' | 'SNIPER' | 'MACHINE_GUN' | 'FLANK_GUARD';

const STAT_TYPES = [
  { id: 0, name: 'Health Regen', color: '#ff8c69', key: '1' },
  { id: 1, name: 'Max Health', color: '#ff69b4', key: '2' },
  { id: 2, name: 'Body Damage', color: '#bf7ff5', key: '3' },
  { id: 3, name: 'Bullet Speed', color: '#699bff', key: '4' },
  { id: 4, name: 'Bullet Pen.', color: '#ffd966', key: '5' },
  { id: 5, name: 'Bullet Dmg', color: '#ff6666', key: '6' },
  { id: 6, name: 'Reload', color: '#98fb98', key: '7' },
  { id: 7, name: 'Move Speed', color: '#87ceeb', key: '8' },
];

const SHAPE_TYPES = {
  SQUARE: { type: 'SQUARE', hp: 10, xp: 10, color: '#ffe869', size: 1, sides: 4, score: 10 },
  TRIANGLE: { type: 'TRIANGLE', hp: 30, xp: 25, color: '#fc7677', size: 1.3, sides: 3, score: 25 },
  PENTAGON: { type: 'PENTAGON', hp: 100, xp: 130, color: '#768dfc', size: 2, sides: 5, score: 130 },
};

// --- Utils ---
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const checkCollision = (p1: THREE.Vector3, r1: number, p2: THREE.Vector3, r2: number) => {
  return p1.distanceToSquared(p2) < (r1 + r2) * (r1 + r2);
};
const BOT_NAMES = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "X-ray", "Yankee", "Zulu"];

// --- Game State Types ---
interface Entity {
  id: string;
  position: THREE.Vector3;
  rotation: number;
  radius: number;
}

interface PlayerState extends Entity {
  name: string;
  health: number;
  maxHealth: number;
  level: number;
  xp: number;
  maxXp: number;
  statPoints: number;
  stats: number[]; // 0-7
  score: number;
  classType: TankClass;
}

interface EnemyBot extends Entity {
  name: string;
  health: number;
  maxHealth: number;
  velocity: THREE.Vector3;
  targetId: string | null;
  lastShot: number;
  color: string;
  classType: TankClass;
  score: number;
}

interface Bullet extends Entity {
  velocity: THREE.Vector3;
  damage: number;
  penetration: number;
  health: number;
  ttl: number;
  ownerId: string;
  color: string;
}

interface Shape extends Entity {
  type: keyof typeof SHAPE_TYPES;
  health: number;
  maxHealth: number;
  velocity: THREE.Vector3;
  rotationSpeed: number;
}

interface FloatingText {
  id: string;
  position: THREE.Vector3;
  text: string;
  color: string;
  life: number;
}

// --- Visual Components ---

const Background = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
    <planeGeometry args={[MAP_SIZE * 2, MAP_SIZE * 2]} />
    <meshStandardMaterial color="#cdcdcd" />
    <gridHelper args={[MAP_SIZE * 2, MAP_SIZE, 0x999999, 0xe0e0e0]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} />
  </mesh>
);

const HealthBar: React.FC<{ health: number; maxHealth: number; size: number; position: THREE.Vector3, color?: string }> = ({ health, maxHealth, size, position, color = "#85e37d" }) => {
  const percent = Math.max(0, Math.min(1, health / maxHealth));
  
  return (
    <Billboard position={[position.x, position.y + size * 1.5, position.z]}>
      {/* Background */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[size * 2, size * 0.3]} />
        <meshBasicMaterial color="#333" />
      </mesh>
      {/* Fill */}
      <mesh position={[(percent - 1) * size, 0, 0.01]}>
        <planeGeometry args={[size * 2 * percent, size * 0.25]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </Billboard>
  );
};

// Reusable Tank Mesh
const TankBody: React.FC<{ color: string, classType: TankClass }> = ({ color, classType }) => {
    // Barrel Definitions based on class
    const renderBarrels = () => {
        const barrelMat = <meshStandardMaterial color="#999999" />;
        const baseLen = 1.8;
        const baseW = 0.8;

        switch (classType) {
            case 'TWIN':
                return (
                    <>
                        <mesh position={[0.5, 0.5, baseLen / 2]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                            <cylinderGeometry args={[baseW/2, baseW/2, baseLen, 16]} />
                            {barrelMat}
                        </mesh>
                        <mesh position={[-0.5, 0.5, baseLen / 2]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                            <cylinderGeometry args={[baseW/2, baseW/2, baseLen, 16]} />
                            {barrelMat}
                        </mesh>
                    </>
                );
            case 'SNIPER':
                return (
                    <mesh position={[0, 0.5, baseLen * 0.8]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                        <cylinderGeometry args={[baseW/2, baseW/2, baseLen * 1.6, 16]} />
                        {barrelMat}
                    </mesh>
                );
            case 'MACHINE_GUN':
                return (
                    <mesh position={[0, 0.5, baseLen / 2]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                        <cylinderGeometry args={[baseW * 0.8, baseW * 0.4, baseLen * 0.9, 16]} />
                        {barrelMat}
                    </mesh>
                );
            case 'FLANK_GUARD':
                return (
                    <>
                        <mesh position={[0, 0.5, baseLen / 2]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                            <cylinderGeometry args={[baseW/2, baseW/2, baseLen, 16]} />
                            {barrelMat}
                        </mesh>
                        <mesh position={[0, 0.5, -baseLen * 0.4]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                            <cylinderGeometry args={[baseW/2, baseW/2, baseLen * 0.8, 16]} />
                            {barrelMat}
                        </mesh>
                    </>
                );
            case 'BASIC':
            default:
                return (
                    <mesh position={[0, 0.5, baseLen / 2]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                        <cylinderGeometry args={[baseW/2, baseW/2, baseLen, 16]} />
                        {barrelMat}
                    </mesh>
                );
        }
    };

    return (
        <>
            {renderBarrels()}
            <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[1, 1, 1, 32]} />
                <meshStandardMaterial color={color} />
                <mesh position={[0, 0.51, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <ringGeometry args={[0.9, 1, 32]} />
                    <meshBasicMaterial color="rgba(0,0,0,0.2)" transparent opacity={0.3} />
                </mesh>
            </mesh>
        </>
    )
}

// 3D Preview Component for Upgrade Menu
const TankPreview: React.FC<{ type: TankClass, color: string }> = ({ type, color }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if(ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.5;
            ref.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });
    return (
        <group ref={ref}>
            <TankBody color={color} classType={type} />
        </group>
    );
};

const PlayerWrapper: React.FC<{ player: PlayerState }> = ({ player }) => {
    const group = useRef<THREE.Group>(null);
    useFrame(() => {
        if (group.current) {
            group.current.position.lerp(player.position, 0.2);
            const targetRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation);
            group.current.quaternion.slerp(targetRot, 0.2);
        }
    });

    return (
        <group ref={group}>
            <TankBody color="#00b2e1" classType={player.classType} />
            <Billboard position={[0, 2.5, 0]}>
                <Text fontSize={0.5} color="black" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="white">
                    {player.name}
                </Text>
            </Billboard>
            <HealthBar health={player.health} maxHealth={player.maxHealth} size={1} position={new THREE.Vector3(0,0,0)} />
        </group>
    )
}

const EnemyWrapper: React.FC<{ enemy: EnemyBot }> = ({ enemy }) => {
    const group = useRef<THREE.Group>(null);
    
    useFrame(() => {
        if (group.current) {
            group.current.position.lerp(enemy.position, 0.2);
            const targetRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), enemy.rotation);
            group.current.quaternion.slerp(targetRot, 0.2);
        }
    });

    return (
        <group ref={group}>
             <TankBody color={enemy.color} classType={enemy.classType} />
             <Billboard position={[0, 2.5, 0]}>
                <Text fontSize={0.5} color="black" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="white">
                    {enemy.name}
                </Text>
             </Billboard>
             <HealthBar health={enemy.health} maxHealth={enemy.maxHealth} size={1} position={new THREE.Vector3(0,0,0)} color="#ff6666" />
        </group>
    )
}

const ShapeMesh: React.FC<{ shape: Shape }> = ({ shape }) => {
  const config = SHAPE_TYPES[shape.type];
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
        groupRef.current.position.copy(shape.position);
    }
    if (meshRef.current) {
        meshRef.current.rotation.y += shape.rotationSpeed * delta * 60;
        meshRef.current.rotation.x += shape.rotationSpeed * 0.5 * delta * 60;
    }
  });

  let geometry;
  if (shape.type === 'SQUARE') geometry = <boxGeometry args={[config.size, config.size, config.size]} />;
  else if (shape.type === 'TRIANGLE') geometry = <tetrahedronGeometry args={[config.size * 0.8]} />;
  else geometry = <dodecahedronGeometry args={[config.size * 0.7]} />;

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {geometry}
        <meshStandardMaterial color={config.color} roughness={0.4} />
        <mesh scale={[1.05, 1.05, 1.05]}>
           {shape.type === 'SQUARE' ? <boxGeometry args={[config.size, config.size, config.size]} /> : 
            shape.type === 'TRIANGLE' ? <tetrahedronGeometry args={[config.size * 0.8]} /> : 
            <dodecahedronGeometry args={[config.size * 0.7]} />}
           <meshBasicMaterial color="black" side={THREE.BackSide} />
        </mesh>
      </mesh>
      <HealthBar health={shape.health} maxHealth={SHAPE_TYPES[shape.type].hp} size={config.size} position={new THREE.Vector3(0, 0, 0)} />
    </group>
  );
};

const BulletMesh: React.FC<{ bullet: Bullet }> = ({ bullet }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(() => {
        if(ref.current) ref.current.position.copy(bullet.position);
    });
    return (
        <mesh ref={ref} scale={[0.8, 0.8, 0.8]}>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color={bullet.color} emissive={bullet.color} emissiveIntensity={0.5} />
        </mesh>
    );
};

// --- Main Logic ---

const GameScene: React.FC<{
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onDie: () => void;
  logicStateRef: React.MutableRefObject<any>;
  minimapRef: React.RefObject<HTMLCanvasElement | null>;
  setLeaderboard: (data: any[]) => void;
}> = ({ player, setPlayer, onDie, logicStateRef, minimapRef, setLeaderboard }) => {
  const { camera, mouse } = useThree();
  
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [enemies, setEnemies] = useState<EnemyBot[]>([]);
  
  const ls = logicStateRef.current;

  const syncState = () => {
    if (ls.bullets.length !== bullets.length) setBullets([...ls.bullets]);
    if (ls.shapes.length !== shapes.length) setShapes([...ls.shapes]);
    if (ls.enemies.length !== enemies.length) setEnemies([...ls.enemies]);
  };

  const calculateLevelUp = (currentP: PlayerState, gainedXp: number, scoreAdd: number) => {
        let newXp = currentP.xp + gainedXp;
        let newLevel = currentP.level;
        let newStatPoints = currentP.statPoints;
        let newMaxXp = currentP.maxXp;
        
        while (newXp >= newMaxXp) {
            newXp -= newMaxXp;
            newLevel++;
            newStatPoints++;
            newMaxXp = Math.floor(newMaxXp * 1.2);
        }
        return { 
            ...currentP, 
            xp: newXp, 
            level: newLevel, 
            maxXp: newMaxXp, 
            statPoints: newStatPoints, 
            score: currentP.score + scoreAdd,
        };
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1); // 안정적인 델타값
    ls.frameCount++;
    const now = state.clock.elapsedTime;
    let listChanged = false;

    // Leaderboard Update (Every ~1 sec)
    if (ls.frameCount % 60 === 0) {
        const allEntities = [
            { name: player.name, score: player.score, id: player.id },
            ...ls.enemies.map((e: EnemyBot) => ({ name: e.name, score: e.score, id: e.id }))
        ];
        allEntities.sort((a: any, b: any) => b.score - a.score);
        setLeaderboard(allEntities.slice(0, 5));
    }

    // Stats
    const STAT_VALS = player.stats;
    const maxHp = 50 + STAT_VALS[1] * 20;
    const moveSpeed = (0.15 + STAT_VALS[7] * 0.02) * 60; // 초당 환산
    let reloadTime = 0.5 * Math.pow(0.9, STAT_VALS[6]);
    let bulletDmg = 5 + STAT_VALS[5] * 3;
    let bulletSpd = (0.2 + STAT_VALS[3] * 0.04) * 60; // 초당 환산
    let bulletPen = 10 + STAT_VALS[4] * 5;
    const regenAmt = (0.05 + STAT_VALS[0] * 0.03);

    if (player.classType === 'SNIPER') {
        reloadTime *= 1.5;
        bulletSpd *= 1.5;
        bulletDmg *= 1.5;
        bulletPen *= 2.0;
    } else if (player.classType === 'MACHINE_GUN') {
        reloadTime *= 0.6;
        bulletDmg *= 0.7; 
    }

    // Move
    const moveVec = new THREE.Vector3(0, 0, 0);
    if (ls.keys['KeyW'] || ls.keys['ArrowUp']) moveVec.z -= 1;
    if (ls.keys['KeyS'] || ls.keys['ArrowDown']) moveVec.z += 1;
    if (ls.keys['KeyA'] || ls.keys['ArrowLeft']) moveVec.x -= 1;
    if (ls.keys['KeyD'] || ls.keys['ArrowRight']) moveVec.x += 1;
    
    if (moveVec.length() > 0) {
        moveVec.normalize().multiplyScalar(moveSpeed * dt);
        player.position.add(moveVec);
    }
    player.position.x = Math.max(-MAP_SIZE, Math.min(MAP_SIZE, player.position.x));
    player.position.z = Math.max(-MAP_SIZE, Math.min(MAP_SIZE, player.position.z));
    player.position.y = 0;

    // Aim
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, target);
    if (target) {
        const dx = target.x - player.position.x;
        const dz = target.z - player.position.z;
        player.rotation = Math.atan2(dx, dz);
    }

    // Camera
    const camOffset = new THREE.Vector3(0, 35, 25);
    const camTarget = player.position.clone();
    camera.position.lerp(camTarget.add(camOffset), 0.1);
    camera.lookAt(player.position.x, 0, player.position.z);

    // Fire
    const spawnBullet = (pos: THREE.Vector3, rot: number, owner: string, color: string, dmg: number, spd: number, pen: number, ttl: number = 120) => {
        const vel = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot)).multiplyScalar(spd * dt);
        const startPos = pos.clone().add(new THREE.Vector3(Math.sin(rot)*2, 0.5, Math.cos(rot)*2));
        
        ls.bullets.push({
            id: Math.random().toString(),
            position: startPos,
            rotation: rot,
            radius: 0.5,
            velocity: vel,
            damage: dmg,
            penetration: pen,
            health: pen,
            ttl: ttl,
            ownerId: owner,
            color: color
        });
        listChanged = true;
    };

    if ((ls.keys['MOUSE_LEFT'] || ls.keys['Space'] || ls.autoFire) && now - ls.lastShot > reloadTime) {
        ls.lastShot = now;
        const color = '#00b2e1';
        switch (player.classType) {
            case 'TWIN':
                spawnBullet(player.position, player.rotation - 0.15, 'player', color, bulletDmg, bulletSpd, bulletPen);
                spawnBullet(player.position, player.rotation + 0.15, 'player', color, bulletDmg, bulletSpd, bulletPen);
                break;
            case 'FLANK_GUARD':
                spawnBullet(player.position, player.rotation, 'player', color, bulletDmg, bulletSpd, bulletPen);
                spawnBullet(player.position, player.rotation + Math.PI, 'player', color, bulletDmg, bulletSpd, bulletPen);
                break;
            case 'MACHINE_GUN':
                const spread = (Math.random() - 0.5) * 0.4;
                spawnBullet(player.position, player.rotation + spread, 'player', color, bulletDmg, bulletSpd, bulletPen);
                break;
            case 'SNIPER':
            case 'BASIC':
            default:
                spawnBullet(player.position, player.rotation, 'player', color, bulletDmg, bulletSpd, bulletPen);
                break;
        }
    }
    
    // Spawn Enemies
    if (ls.enemies.length < MAX_ENEMIES && Math.random() < 0.02) {
        const angle = Math.random() * Math.PI * 2;
        const radius = rand(40, MAP_SIZE - 10); 
        const pos = new THREE.Vector3(Math.sin(angle)*radius, 0, Math.cos(angle)*radius);
        const botClass = Math.random() > 0.8 ? 'SNIPER' : 'BASIC';
        ls.enemies.push({
            id: 'enemy_' + Math.random().toString(36).substr(2, 9),
            name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
            position: pos, rotation: 0, radius: 1,
            health: 50 + (player.level * 2), maxHealth: 50 + (player.level * 2),
            velocity: new THREE.Vector3(0,0,0), targetId: null, lastShot: 0, color: '#f04f4f', classType: botClass,
            score: Math.floor(Math.random() * 5000)
        });
        listChanged = true;
    }

    ls.enemies.forEach(bot => {
        let closestTarget: { position: THREE.Vector3, type: 'TANK' | 'SHAPE' } | null = null;
        let minDist = Infinity;
        const distToPlayer = bot.position.distanceTo(player.position);
        if (distToPlayer < VIEW_DISTANCE) { closestTarget = { position: player.position, type: 'TANK' }; minDist = distToPlayer; }
        ls.enemies.forEach(other => {
            if (other.id !== bot.id) {
                const d = bot.position.distanceTo(other.position);
                if (d < VIEW_DISTANCE && d < minDist) { closestTarget = { position: other.position, type: 'TANK' }; minDist = d; }
            }
        });
        if (!closestTarget || minDist > 20) {
            ls.shapes.forEach(shape => {
                const d = bot.position.distanceTo(shape.position);
                if (d < VIEW_DISTANCE && d < minDist) { closestTarget = { position: shape.position, type: 'SHAPE' }; minDist = d; }
            });
        }
        let moveDir = new THREE.Vector3(0,0,0);
        if (closestTarget) {
            const dx = closestTarget.position.x - bot.position.x;
            const dz = closestTarget.position.z - bot.position.z;
            const idealRotation = Math.atan2(dx, dz);
            const error = (Math.sin(now * 3 + parseInt(bot.id.slice(-4), 36)) * 0.1); 
            bot.rotation = idealRotation + error;
            const dist = bot.position.distanceTo(closestTarget.position);
            if (dist > 15) moveDir = closestTarget.position.clone().sub(bot.position).normalize().multiplyScalar(7.2 * dt);
            else if (dist < 8) moveDir = bot.position.clone().sub(closestTarget.position).normalize().multiplyScalar(6 * dt);
            else moveDir = new THREE.Vector3(Math.sin(bot.rotation + Math.PI/2), 0, Math.cos(bot.rotation + Math.PI/2)).multiplyScalar(3 * dt);
            if (now - bot.lastShot > 0.8) {
                bot.lastShot = now;
                spawnBullet(bot.position, bot.rotation, bot.id, '#f04f4f', 10 + (player.level), (0.35 * 60), 10);
            }
        } else {
             bot.rotation += (Math.random() - 0.5) * 0.05;
             moveDir = new THREE.Vector3(Math.sin(bot.rotation), 0, Math.cos(bot.rotation)).multiplyScalar(2.4 * dt);
        }
        bot.position.add(moveDir);
        bot.position.x = Math.max(-MAP_SIZE, Math.min(MAP_SIZE, bot.position.x));
        bot.position.z = Math.max(-MAP_SIZE, Math.min(MAP_SIZE, bot.position.z));
        bot.position.y = 0;
    });

    if (now - ls.lastRegen > 1) {
        if (player.health < maxHp && player.health > 0) setPlayer(p => ({ ...p, health: Math.min(maxHp, p.health + regenAmt * 20) }));
        ls.lastRegen = now;
    }

    if (ls.shapes.length < MAX_SHAPES && Math.random() < 0.08) {
        const r = Math.random();
        const type = r > 0.9 ? 'PENTAGON' : r > 0.7 ? 'TRIANGLE' : 'SQUARE';
        const angle = Math.random() * Math.PI * 2;
        const radius = rand(10, MAP_SIZE - 5);
        ls.shapes.push({
            id: Math.random().toString(), type: type,
            position: new THREE.Vector3(Math.sin(angle) * radius, 0.5, Math.cos(angle) * radius),
            rotation: Math.random(), radius: SHAPE_TYPES[type].size,
            health: SHAPE_TYPES[type].hp, maxHealth: SHAPE_TYPES[type].hp,
            velocity: new THREE.Vector3(rand(-1.2, 1.2) * dt, 0, rand(-1.2, 1.2) * dt), rotationSpeed: rand(-0.02, 0.02)
        });
        listChanged = true;
    }

    for (let i = ls.bullets.length - 1; i >= 0; i--) {
        const b = ls.bullets[i];
        b.position.add(b.velocity);
        b.ttl -= delta * 60; // 60FPS 기준 TTL 감소
        let hit = false;
        if (b.ttl <= 0 || b.position.length() > MAP_SIZE + 5) { ls.bullets.splice(i, 1); listChanged = true; continue; }
        for (let j = ls.shapes.length - 1; j >= 0; j--) {
            const s = ls.shapes[j];
            if (checkCollision(b.position, b.radius, s.position, s.radius)) {
                s.health -= b.damage; b.health -= b.penetration; hit = true;
                if (s.health <= 0) {
                    const config = SHAPE_TYPES[s.type];
                    if (b.ownerId === 'player') setPlayer(p => calculateLevelUp(p, config.xp, config.score));
                    ls.shapes.splice(j, 1); listChanged = true;
                }
                break;
            }
        }
        if (!hit && b.ownerId !== 'player') {
            if (checkCollision(b.position, b.radius, player.position, 1.5)) {
                 setPlayer(p => ({ ...p, health: p.health - b.damage }));
                 b.health = 0; hit = true;
            }
        }
        if (!hit) {
             for (let k = ls.enemies.length - 1; k >= 0; k--) {
                 const e = ls.enemies[k];
                 if (b.ownerId !== e.id) {
                     if (checkCollision(b.position, b.radius, e.position, 1.2)) {
                         e.health -= b.damage; b.health -= b.penetration; hit = true;
                         if (e.health <= 0) {
                             if (b.ownerId === 'player') setPlayer(p => calculateLevelUp(p, 2000, 1000 + e.score));
                             ls.enemies.splice(k, 1); listChanged = true;
                         }
                         break;
                     }
                 }
             }
        }
        if (b.health <= 0 || hit) { ls.bullets.splice(i, 1); listChanged = true; }
    }

    for (const s of ls.shapes) {
        s.position.add(s.velocity);
        if (Math.abs(s.position.x) > MAP_SIZE) s.velocity.x *= -1;
        if (Math.abs(s.position.z) > MAP_SIZE) s.velocity.z *= -1;
        if (checkCollision(player.position, 1, s.position, s.radius)) {
            const push = player.position.clone().sub(s.position).setY(0).normalize();
            player.position.add(push.multiplyScalar(0.2)); s.position.sub(push.multiplyScalar(0.2));
            setPlayer(p => ({ ...p, health: p.health - 1 }));
        }
    }

    // Minimap
    const canvas = minimapRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const size = canvas.width;
            ctx.clearRect(0, 0, size, size);
            const map = (val: number) => ((val + MAP_SIZE) / (MAP_SIZE * 2)) * size;
            ls.shapes.forEach(s => {
                ctx.fillStyle = s.type === 'PENTAGON' ? '#768dfc' : '#ffe869';
                ctx.beginPath(); ctx.arc(map(s.position.x), map(s.position.z), 1.5, 0, Math.PI * 2); ctx.fill();
            });
            ctx.fillStyle = '#f04f4f';
            ls.enemies.forEach(e => {
                ctx.beginPath(); ctx.arc(map(e.position.x), map(e.position.z), 3, 0, Math.PI * 2); ctx.fill();
            });
            const px = map(player.position.x);
            const py = map(player.position.z);
            ctx.fillStyle = '#00b2e1';
            ctx.save(); ctx.translate(px, py); ctx.rotate(-player.rotation); 
            ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(3, 3); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }

    if (player.health <= 0) onDie();
    if (listChanged) syncState();
  });

  return (
    <>
        <PlayerWrapper player={player} />
        {bullets.map(b => <BulletMesh key={b.id} bullet={b} />)}
        {shapes.map(s => <ShapeMesh key={s.id} shape={s} />)}
        {enemies.map(e => <EnemyWrapper key={e.id} enemy={e} />)}
    </>
  );
};

export const TankGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [dead, setDead] = useState(false);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  const [player, setPlayer] = useState<PlayerState>({
    id: 'player', position: new THREE.Vector3(0, 0, 0), rotation: 0, radius: 1, name: 'You',
    health: 50, maxHealth: 50, level: 1, xp: 0, maxXp: 100,
    statPoints: 0, stats: [0, 0, 0, 0, 0, 0, 0, 0], score: 0, classType: 'BASIC'
  });

  const logicStateRef = useRef({
    bullets: [] as Bullet[], shapes: [] as Shape[], enemies: [] as EnemyBot[],
    floatingTexts: [] as FloatingText[], keys: {} as { [key: string]: boolean },
    lastShot: 0, lastRegen: 0, autoFire: false, frameCount: 0
  });

  useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
          logicStateRef.current.keys[e.code] = true;
          if (e.code === 'KeyE') logicStateRef.current.autoFire = !logicStateRef.current.autoFire;
          const statIndex = parseInt(e.key) - 1;
          if (statIndex >= 0 && statIndex < 8) (window as any).upgradeStat(statIndex);
      };
      const onKeyUp = (e: KeyboardEvent) => logicStateRef.current.keys[e.code] = false;
      const onMouseDown = () => logicStateRef.current.keys['MOUSE_LEFT'] = true;
      const onMouseUp = () => logicStateRef.current.keys['MOUSE_LEFT'] = false;
      window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
      window.addEventListener('mousedown', onMouseDown); window.addEventListener('mouseup', onMouseUp);
      return () => {
          window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
          window.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mouseup', onMouseUp);
      };
  }, []);

  (window as any).upgradeStat = (index: number) => {
    setPlayer(prev => {
        if (prev.statPoints > 0 && prev.stats[index] < 8) {
            const newStats = [...prev.stats];
            newStats[index]++;
            return { ...prev, statPoints: prev.statPoints - 1, stats: newStats };
        }
        return prev;
    });
  };

  const startGame = () => {
    setIsPlaying(true); setDead(false);
    logicStateRef.current.bullets = []; logicStateRef.current.shapes = []; logicStateRef.current.enemies = [];
    const nickInput = document.getElementById('nickname') as HTMLInputElement;
    const name = nickInput?.value || 'Player';
    setPlayer({
        id: 'player', position: new THREE.Vector3(0, 0, 0), rotation: 0, radius: 1, name: name,
        health: 50, maxHealth: 50, level: 1, xp: 0, maxXp: 100,
        statPoints: 0, stats: [0, 0, 0, 0, 0, 0, 0, 0], score: 0, classType: 'BASIC'
    });
  };

  const handleClassUpgrade = (newClass: TankClass) => {
      setPlayer(prev => ({ ...prev, classType: newClass }));
  };

  return (
    <div className="relative w-full h-full bg-[#cdcdcd] overflow-hidden select-none">
      <Canvas shadows camera={{ fov: 45 }}>
        <Environment preset="city" />
        <ambientLight intensity={0.6} />
        <directionalLight position={[50, 50, 25]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
        <Background />
        {isPlaying && !dead && (
            <GameScene 
                player={player} setPlayer={setPlayer} onDie={() => setDead(true)} 
                logicStateRef={logicStateRef} minimapRef={minimapRef}
                setLeaderboard={setLeaderboard}
            />
        )}
      </Canvas>

      <BackButton onClick={onBack} />

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
         <div className="bg-gray-800/80 text-white px-6 py-2 rounded-lg border-2 border-gray-600 font-bold text-xl drop-shadow-md">
            SCORE: {player.score}
         </div>
      </div>

      {/* LEADERBOARD */}
      {isPlaying && !dead && (
          <div className="absolute top-4 right-4 z-40 bg-gray-900/80 rounded-lg p-2 text-white border-2 border-gray-600 min-w-[150px]">
              <div className="text-xs text-gray-400 font-bold uppercase mb-1">Leaderboard</div>
              {leaderboard.map((ent, i) => (
                  <div key={ent.id || i} className="flex justify-between text-sm mb-0.5">
                      <span className={`${ent.id === 'player' ? 'text-cyan-400 font-bold' : 'text-gray-200'}`}>{i+1}. {ent.name}</span>
                      <span className="text-gray-400 text-xs ml-2">{ent.score >= 1000 ? (ent.score/1000).toFixed(1)+'k' : ent.score}</span>
                  </div>
              ))}
          </div>
      )}

      {isPlaying && !dead && (
        <div className="absolute bottom-4 right-4 w-[120px] h-[120px] bg-black/60 border-2 border-gray-600 rounded-lg overflow-hidden z-40 backdrop-blur-sm shadow-xl">
             <canvas ref={minimapRef} width={120} height={120} />
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle,transparent_50%,#000_150%)]"></div>
        </div>
      )}

      {isPlaying && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[60%] max-w-2xl z-40 flex flex-col items-center">
            <div className="text-white font-black text-xl mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Lvl {player.level} {player.classType === 'BASIC' ? 'Tank' : player.classType}
            </div>
            <div className="w-full h-6 bg-gray-800 rounded-full border-2 border-gray-600 overflow-hidden relative shadow-lg">
                <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${(player.xp / player.maxXp) * 100}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] tracking-wide">
                    XP: {player.xp} / {player.maxXp}
                </div>
            </div>
        </div>
      )}

      {isPlaying && player.statPoints > 0 && (
        <div className="absolute bottom-4 left-4 z-40 flex flex-col gap-1 w-52 pointer-events-none">
            {STAT_TYPES.map((stat, idx) => {
                const val = player.stats[idx];
                return (
                    <div key={stat.id} className="relative group pointer-events-auto">
                         <div className="flex items-center gap-1">
                             <div className="flex-1 h-5 bg-gray-800/80 rounded-r-md border border-gray-600 relative overflow-hidden flex items-center pr-2">
                                <div className="absolute left-0 top-0 bottom-0 transition-all duration-200" style={{ width: `${(val/8)*100}%`, backgroundColor: stat.color }}></div>
                                <span className="relative z-10 text-[10px] font-bold text-white ml-2 drop-shadow uppercase">{stat.name}</span>
                                <span className="relative z-10 ml-auto text-[10px] font-bold text-white">{val}/8</span>
                             </div>
                             {player.statPoints > 0 && val < 8 && (
                                 <button onClick={() => (window as any).upgradeStat(idx)} className="w-6 h-6 rounded bg-gray-200 hover:bg-white text-black font-bold flex items-center justify-center text-sm shadow cursor-pointer transition-transform active:scale-95">+</button>
                             )}
                         </div>
                    </div>
                );
            })}
             {player.statPoints > 0 && <div className="text-white text-sm font-bold animate-pulse mt-1 ml-1 text-shadow-black">x{player.statPoints} Points Available</div>}
        </div>
      )}

      {/* CLASS UPGRADE MENU - 3D PREVIEW */}
      {isPlaying && player.level >= 15 && player.classType === 'BASIC' && !dead && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
              {[
                  { id: 'TWIN', name: 'Twin', color: '#00b2e1' },
                  { id: 'SNIPER', name: 'Sniper', color: '#00b2e1' },
                  { id: 'MACHINE_GUN', name: 'Machine Gun', color: '#00b2e1' },
                  { id: 'FLANK_GUARD', name: 'Flank Guard', color: '#00b2e1' }
              ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleClassUpgrade(c.id as TankClass)}
                    className="w-32 h-40 bg-gray-800/90 border-4 border-gray-600 hover:border-white hover:scale-110 transition-all rounded-xl flex flex-col items-center justify-between p-2 shadow-2xl cursor-pointer group"
                  >
                      {/* Mini 3D Scene */}
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-gradient-to-b from-gray-700 to-gray-900 relative">
                          <Canvas camera={{ position: [0, 3, 3], fov: 45 }}>
                              <ambientLight intensity={1} />
                              <directionalLight position={[5, 5, 5]} intensity={1} />
                              <TankPreview type={c.id as TankClass} color={c.color} />
                          </Canvas>
                      </div>
                      <span className="text-white font-bold text-sm text-center group-hover:text-cyan-300">{c.name}</span>
                  </button>
              ))}
          </div>
      )}

      {(!isPlaying || dead) && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-colors duration-500 ${dead ? 'bg-red-900/80' : 'bg-black/40'}`}>
           <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border-4 border-blue-500 transform scale-100 transition-all">
                <h1 className={`text-5xl font-black mb-2 tracking-tighter uppercase ${dead ? 'text-red-600' : 'text-blue-500'}`}>{dead ? 'YOU DIED' : 'Tank.io 3D'}</h1>
                <p className="text-gray-500 mb-6 font-medium">{dead ? `Final Score: ${player.score}` : 'Dominate the arena. Destroy shapes. Upgrade stats.'}</p>
                {!dead && <input type="text" id="nickname" placeholder="Nickname" className="w-full px-4 py-3 bg-gray-100 rounded-lg mb-4 border-2 border-gray-200 focus:border-blue-400 focus:outline-none font-bold text-gray-700 text-center" defaultValue="Player" />}
                <button onClick={startGame} className={`w-full text-white font-black text-xl py-4 rounded-lg shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all ${dead ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                    {dead ? 'RESPAWN' : 'PLAY GAME'}
                </button>
                <div className="mt-4 text-xs text-gray-400 font-bold">WASD: Move • Mouse: Aim • Click: Shoot • E: Auto Fire</div>
           </div>
        </div>
      )}
    </div>
  );
};
