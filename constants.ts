
import { AppRoute, AppCardData } from './types';

export const APP_CARDS: AppCardData[] = [
  {
    id: AppRoute.SHAPE_STACKER,
    category: 'GAME',
    title: '피지컬 셰이프 스태커',
    description: '물리 엔진 기반의 리얼한 도형 쌓기! 1초간 흔들림 없이 버티면 단단하게 굳어 다음 탑의 기반이 됩니다.',
    bgGradient: 'from-amber-400 to-orange-500',
    accentColor: '#f59e0b',
    tags: ['Physics', 'Puzzle', 'Skill']
  },
  {
    id: AppRoute.SLIME_RPG,
    category: 'GAME',
    title: '슬라임 RPG: 마스터리',
    description: '무기 뽑기, 강화, 상점 시스템이 추가된 본격 방치형 RPG! 최강의 슬라임 헌터가 되어보세요.',
    bgGradient: 'from-green-500 to-emerald-700',
    accentColor: '#10b981',
    tags: ['RPG', 'Gacha', 'Upgrade']
  },
  {
    id: AppRoute.PHONE_CASE_APP,
    category: 'EFFICIENCY',
    title: '폰 케이스 꾸미기 스튜디오',
    description: '프리미엄 재질과 세련된 디자인 도구로 나만의 폰 케이스를 완성하세요.',
    bgGradient: 'from-pink-400 to-fuchsia-500',
    accentColor: '#d946ef',
    tags: ['Design', 'Creative', 'Custom']
  },
  {
    id: AppRoute.BLUE_SCREEN,
    category: 'EFFICIENCY',
    title: '블루스크린 시뮬레이터',
    description: '친구를 놀래켜줄 가장 완벽한 방법. 윈도우 블루스크린을 완벽하게 재현합니다.',
    bgGradient: 'from-blue-700 to-blue-900',
    accentColor: '#1d4ed8',
    tags: ['Fun', 'Prank', 'Utility']
  },
  {
    id: AppRoute.TANK_GAME,
    category: 'GAME',
    title: 'Tank.io 3D',
    description: '강력한 탱크를 조종하여 전장을 지배하세요. 적을 파괴하고 레벨을 올려 최강의 전차로 거듭나세요.',
    bgGradient: 'from-blue-500 to-indigo-600',
    accentColor: '#3b82f6',
    tags: ['Action', 'Upgrade', '3D']
  },
  {
    id: AppRoute.STACK_GAME,
    category: 'GAME',
    title: 'Stack.io',
    description: '완벽한 타이밍으로 블록을 쌓아 하늘 끝까지 도달하세요. 집중력이 승부를 결정합니다.',
    bgGradient: 'from-emerald-400 to-teal-500',
    accentColor: '#10b981',
    tags: ['Timing', 'Arcade', 'Hyper-Casual']
  },
  {
    id: AppRoute.GUITAR_GAME,
    category: 'MUSIC',
    title: '온라인 기타',
    description: '어쿠스틱 기타의 아름다운 선율을 연주하세요. 당신의 손끝에서 시작되는 감동적인 음악.',
    bgGradient: 'from-orange-500 to-amber-700',
    accentColor: '#f59e0b',
    tags: ['Instrument', 'Music', 'Creative']
  },
  {
    id: AppRoute.MUSIC_COMPOSER,
    category: 'MUSIC',
    title: '클래식 작곡가',
    description: '오선지 위에 나만의 선율을 그리세요. 클래식 악보 기반의 직관적인 작곡 시스템.',
    bgGradient: 'from-indigo-500 to-purple-700',
    accentColor: '#6366f1',
    tags: ['Classical', 'Score', 'Compose']
  },
  {
    id: AppRoute.PICK_APP,
    category: 'EFFICIENCY',
    title: '제비뽑기 Pro',
    description: '참가자 전원의 순위를 한 번에 결정하세요. 공정하고 화려한 랭킹 시스템.',
    bgGradient: 'from-zinc-700 to-zinc-900',
    accentColor: '#71717a',
    tags: ['Utility', 'Ranking', 'Draw']
  },
  {
    id: AppRoute.PAINT_APP,
    category: 'EFFICIENCY',
    title: '그림판 Studio',
    description: '자유로운 상상을 그리세요. Undo 기능과 다양한 브러시가 포함된 전문가형 캔버스.',
    bgGradient: 'from-pink-500 to-rose-600',
    accentColor: '#f43f5e',
    tags: ['Drawing', 'Art', 'Studio']
  }
];
