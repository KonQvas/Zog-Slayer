
export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 64;
export const WORLD_SIZE = 24;

// Physics & Movement
export const UNIT_COLLISION_RADIUS = 0.35; 
export const SEPARATION_STRENGTH = 15.0; 
export const ARRIVAL_THRESHOLD = 0.25;
export const GROUP_ARRIVAL_THRESHOLD = 0.85; 
export const ARRIVAL_THRESHOLD_SQ = ARRIVAL_THRESHOLD * ARRIVAL_THRESHOLD;
export const GROUP_ARRIVAL_THRESHOLD_SQ = GROUP_ARRIVAL_THRESHOLD * GROUP_ARRIVAL_THRESHOLD;
export const MAX_SEPARATION_DIST = 1.5; 
export const BOSS_SEPARATION_MULTIPLIER = 3.0;
export const KNOCKBACK_DECAY = 0.88;
export const KNOCKBACK_STOP_THRESHOLD = 0.1;
export const MIN_VELOCITY_SQ = 0.0025;

// Selection & Interaction
export const UI_SYNC_INTERVAL = 50;
export const DOUBLE_CLICK_WINDOW = 300;
export const DRAG_THRESHOLD_SQ = 36; // 6px movement tolerance
export const HIT_BOX = {
  WIDTH: 25,
  TOP: -70,
  BOTTOM: 15,
  CENTER_OFFSET: 25
};

// Visual FX & Render Metrics
export const FX_CHROMATIC_SHIFT = 2.5; // Increased for comic look
export const FX_BLOOM_ALPHA = 0.3;
export const FX_BLOOM_BLUR = '6px';
export const FX_BLOOM_BRIGHTNESS = 1.2;
export const FX_BLOOM_CONTRAST = 1.4;
export const FX_SCANLINE_GAP = 4;
export const FX_SCANLINE_ALPHA = 0.03;

// Comic Filter Specifics
export const FX_HALFTONE_SIZE = 4;
export const FX_PAPER_ALPHA = 0.08;
export const FX_VIGNETTE_STRENGTH = 0.5;

export const DEATH_DURATION = 3000;
export const MOVE_INDICATOR_DURATION = 500;
export const MOVE_INDICATOR_BASE_SIZE = 25;
export const MOVE_INDICATOR_GROWTH = 50;

export const SELECTION_RING_RADIUS = 38;
export const SELECTION_DASH = [6, 3];
export const FORMATION_DASH = [10, 5];
export const WAYPOINT_DASH = [4, 6];

export const HECKLE_OFFSET_Y = -120;
export const HECKLE_BOUNCE_AMP = 5;
export const HECKLE_BOUNCE_FREQ = 200;

export const HEALTH_BAR = {
  WIDTH: 40,
  HEIGHT: 4,
  OFFSET_Y: -50,
  PADDING: 1
};

// Boss Config (Zog)
export const BOSS_CONFIG = {
  HECKLE_CHANCE: 0.004,
  HECKLE_COOLDOWN: 4500,
  HECKLE_DISPLAY_TIME: 2500,
  SPECIAL_COOLDOWN: 8000,
  WINDUP_DURATION: 1200,
  SHOVE_RADIUS: 4.5,
  BLAST_DAMAGE: 20,
  BLAST_FORCE: 20.0,
  TARGET_REFRESH_RATE: 3000,
  SCREEN_SHAKE_IMPACT: 18
};

export const COLORS = {
  PRIMARY: '#a855f7', 
  SECONDARY: '#06b6d4', 
  ACCENT: '#f43f5e', 
  BG: '#050507',
  GRID_GLOW: 'rgba(168, 85, 247, 0.12)',
  SELECTION: 'rgba(6, 182, 212, 0.15)',
  HEALTH_HIGH: '#22c55e',
  HEALTH_LOW: '#ef4444',
  VOID: '#1e1b4b',
  WAYPOINT: 'rgba(34, 211, 238, 0.4)',
  WAYPOINT_ACTIVE: 'rgba(34, 211, 238, 0.8)',
  FORMATION_PREVIEW: '#22d3ee',
  FORMATION_GLOW: '#06b6d4'
};
