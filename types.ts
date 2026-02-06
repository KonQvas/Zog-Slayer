
export interface Vector2 {
  x: number;
  y: number;
}

export enum UnitType {
  SCOUT = 'SCOUT',
  WARRIOR = 'WARRIOR',
  MAGE = 'MAGE',
  TECHNO_PRIEST = 'TECHNO_PRIEST',
  BOSS_OVERSEER = 'BOSS_OVERSEER'
}

export type AnimationState = 'idle' | 'walk' | 'attack' | 'hit' | 'die' | 'special';
export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface PathComponent {
  target: Vector2 | null;
  waypoints: Vector2[];
  groupId: string | null;
}

export interface UnitStatsComponent {
  type: UnitType;
  name: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  speed: number;
  color: string;
  radius: number;
  attackRange: number;
  attackDamage: number;
  attackCooldown: number;
  lastAttackTime: number;
}

/**
 * Metadata defining how a unit should be rendered.
 * Decouples visual logic from the core game engine.
 */
export interface AssetMetadata {
  id: string;
  baseScale: number;
  shadowScale: { x: number; y: number };
  hitboxOffset: Vector2;
  placeholderType: 'humanoid' | 'heavy' | 'boss';
  frameCount: Record<AnimationState, number>;
  frameRate: Record<AnimationState, number>;
  visorConfig: {
    w: number | ((dir: Direction) => number);
    h: number;
    color: string | ((state: AnimationState) => string);
  };
  animationHooks?: {
    bounce?: boolean;
    lunge?: boolean;
    chargeEffect?: boolean;
  };
}

export interface RenderComponent {
  assetId: string; // Key for AssetMetadata
  animationState: AnimationState;
  direction: Direction;
  frame: number;
  lastFrameUpdate: number;
  selected: boolean;
  effectTimer: number;
  spriteSheet?: HTMLImageElement;
  heckleText?: string;
  heckleTime?: number;
  deathTime?: number;
}

export interface CombatComponent {
  targetEntityId: string | null;
  aggroRadius: number;
  isBoss?: boolean;
  lastSpecialTime?: number;
  specialWindup?: number;
  isCharging?: boolean;
}

export interface Entity {
  id: string;
  poolIndex: number; 
  pos: Vector2; 
  knockback?: Vector2;
  path?: PathComponent;
  stats?: UnitStatsComponent;
  render: RenderComponent;
  combat?: CombatComponent;
  gridKey?: number; 
  depth: number;
  lastSortDepth: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  pos: Vector2;
  targetPos: Vector2 | null;
  speed: number;
  health: number;
  maxHealth: number;
  selected: boolean;
  color: string;
  facing: Direction;
  name: string;
  mana: number;
}

export interface Tile {
  x: number;
  y: number;
  type: 'dirt' | 'rune' | 'techno' | 'crystal' | 'void';
  height: number;
}

export interface GameState {
  entities: Map<string, Entity>;
  tiles: Tile[];
  camera: Vector2;
  selectionRect: { start: Vector2; end: Vector2 } | null;
  formationPath: Vector2[] | null;
  moveIndicator: { pos: Vector2; time: number } | null;
  worldSize: number;
  gameTime: number;
  screenShake?: number;
  
  positionBuffer: Float32Array;
  velocityBuffer: Float32Array;
}
