
import { AssetMetadata, AnimationState, Direction } from '../types';

const DEFAULT_FRAME_RATES: Record<AnimationState, number> = {
  idle: 200, walk: 110, attack: 100, hit: 80, die: 150, special: 120
};

const DEFAULT_FRAME_COUNTS: Record<AnimationState, number> = {
  idle: 4, walk: 8, attack: 6, hit: 4, die: 8, special: 6
};

export const UNIT_ASSETS: Record<string, AssetMetadata> = {
  'scout': {
    id: 'scout',
    baseScale: 1.0,
    shadowScale: { x: 20, y: 10 },
    hitboxOffset: { x: 0, y: -28 },
    placeholderType: 'humanoid',
    frameCount: DEFAULT_FRAME_COUNTS,
    frameRate: DEFAULT_FRAME_RATES,
    visorConfig: {
      w: (dir: Direction) => dir.length === 2 ? 8 : 12,
      h: 4,
      color: '#fff'
    },
    animationHooks: { bounce: true }
  },
  'warrior': {
    id: 'warrior',
    baseScale: 1.15,
    shadowScale: { x: 25, y: 12 },
    hitboxOffset: { x: 0, y: -28 },
    placeholderType: 'humanoid',
    frameCount: DEFAULT_FRAME_COUNTS,
    frameRate: DEFAULT_FRAME_RATES,
    visorConfig: {
      w: (dir: Direction) => dir.length === 2 ? 8 : 12,
      h: 4,
      color: '#fff'
    },
    animationHooks: { bounce: true }
  },
  'mage': {
    id: 'mage',
    baseScale: 1.0,
    shadowScale: { x: 20, y: 10 },
    hitboxOffset: { x: 0, y: -28 },
    placeholderType: 'humanoid',
    frameCount: DEFAULT_FRAME_COUNTS,
    frameRate: DEFAULT_FRAME_RATES,
    visorConfig: {
      w: (dir: Direction) => dir.length === 2 ? 8 : 12,
      h: 4,
      color: '#fff'
    },
    animationHooks: { bounce: true }
  },
  'techno_priest': {
    id: 'techno_priest',
    baseScale: 1.05,
    shadowScale: { x: 22, y: 11 },
    hitboxOffset: { x: 0, y: -28 },
    placeholderType: 'humanoid',
    frameCount: DEFAULT_FRAME_COUNTS,
    frameRate: DEFAULT_FRAME_RATES,
    visorConfig: {
      w: (dir: Direction) => dir.length === 2 ? 8 : 12,
      h: 4,
      color: '#fff'
    },
    animationHooks: { bounce: true }
  },
  'overseer': {
    id: 'overseer',
    baseScale: 1.8,
    shadowScale: { x: 20, y: 10 }, // Note: scale is applied globally in renderer
    hitboxOffset: { x: 0, y: -28 },
    placeholderType: 'boss',
    frameCount: { ...DEFAULT_FRAME_COUNTS, die: 12, special: 10 },
    frameRate: DEFAULT_FRAME_RATES,
    visorConfig: {
      w: 18,
      h: 6,
      color: (state: AnimationState) => state === 'special' ? '#fff' : '#f00'
    },
    animationHooks: { bounce: false, lunge: true, chargeEffect: true }
  }
};
