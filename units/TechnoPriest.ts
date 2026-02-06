
import { Entity, UnitType } from '../types';

export const TECHNO_PRIEST_STATS = { 
  speed: 1.7, health: 140, mana: 180, color: '#eab308', name: 'Circuit Shaman',
  range: 3.0, damage: 12, cooldown: 1200, radius: 0.4
};

export const createTechnoPriest = (id: string, poolIndex: number, pos: { x: number; y: number }): Entity => ({
  id,
  poolIndex,
  pos: { ...pos },
  depth: pos.x + pos.y,
  lastSortDepth: -999,
  path: { target: null, waypoints: [], groupId: null },
  stats: {
    type: UnitType.TECHNO_PRIEST,
    name: TECHNO_PRIEST_STATS.name,
    health: TECHNO_PRIEST_STATS.health,
    maxHealth: TECHNO_PRIEST_STATS.health,
    mana: TECHNO_PRIEST_STATS.mana,
    maxMana: TECHNO_PRIEST_STATS.mana,
    speed: TECHNO_PRIEST_STATS.speed,
    color: TECHNO_PRIEST_STATS.color,
    radius: TECHNO_PRIEST_STATS.radius,
    attackRange: TECHNO_PRIEST_STATS.range,
    attackDamage: TECHNO_PRIEST_STATS.damage,
    attackCooldown: TECHNO_PRIEST_STATS.cooldown,
    lastAttackTime: 0
  },
  render: {
    assetId: 'techno_priest',
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
