
import React from 'react';

export enum AppRoute {
  LAUNCHER = 'LAUNCHER',
  TANK_GAME = 'TANK_GAME',
  GUITAR_GAME = 'GUITAR_GAME',
  STACK_GAME = 'STACK_GAME',
  PICK_APP = 'PICK_APP',
  PAINT_APP = 'PAINT_APP',
  MUSIC_COMPOSER = 'MUSIC_COMPOSER',
  PHONE_CASE_APP = 'PHONE_CASE_APP',
  SLIME_RPG = 'SLIME_RPG',
  BLUE_SCREEN = 'BLUE_SCREEN',
  SHAPE_STACKER = 'SHAPE_STACKER'
}

export type AppCategory = 'ALL' | 'GAME' | 'MUSIC' | 'EFFICIENCY';

export interface AppCardData {
  id: AppRoute; 
  category: AppCategory;
  title: string;
  description: string;
  bgGradient: string; 
  accentColor: string;
  tags?: string[];
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
