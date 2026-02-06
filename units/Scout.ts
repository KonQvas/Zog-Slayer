
import { Entity, UnitType } from '../types';

export const SCOUT_STATS = { 
  speed: 3.2, health: 80, mana: 50, color: '#22c55e', name: 'Phase Scout',
  range: 1.2, damage: 8, cooldown: 600, radius: 0.25
};

export const createScout = (id: string, poolIndex: number, pos: { x: number; y: number }): Entity => ({
  id,
  poolIndex,
  pos: { ...pos },
  depth: pos.x + pos.y,
  lastSortDepth: -999,
  path: { target: null, waypoints: [], groupId: null },
  stats: {
    type: UnitType.SCOUT,
    name: SCOUT_STATS.name,
    health: SCOUT_STATS.health,
    maxHealth: SCOUT_STATS.health,
    mana: SCOUT_STATS.mana,
    maxMana: SCOUT_STATS.mana,
    speed: SCOUT_STATS.speed,
    color: SCOUT_STATS.color,
    radius: SCOUT_STATS.radius,
    attackRange: SCOUT_STATS.range,
    attackDamage: SCOUT_STATS.damage,
    attackCooldown: SCOUT_STATS.cooldown,
    lastAttackTime: 0
  },
  render: {
    assetId: 'scout',
    animationState: 'idle',
    direction: 'S',
    frame: 0,
    lastFrameUpdate: Date.now(),
    selected: false,
    effectTimer: 0
  },
  combat: {
    targetEntityId: null,
    aggroRadius: 5
  }
});
