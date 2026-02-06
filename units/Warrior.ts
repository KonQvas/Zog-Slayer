
import { Entity, UnitType } from '../types';

export const WARRIOR_STATS = { 
  speed: 1.8, health: 220, mana: 30, color: '#ef4444', name: 'Rune Guardian',
  range: 1.0, damage: 15, cooldown: 1000, radius: 0.45
};

export const createWarrior = (id: string, poolIndex: number, pos: { x: number; y: number }): Entity => ({
  id,
  poolIndex,
  pos: { ...pos },
  depth: pos.x + pos.y,
  lastSortDepth: -999,
  path: { target: null, waypoints: [], groupId: null },
  stats: {
    type: UnitType.WARRIOR,
    name: WARRIOR_STATS.name,
    health: WARRIOR_STATS.health,
    maxHealth: WARRIOR_STATS.health,
    mana: WARRIOR_STATS.mana,
    maxMana: WARRIOR_STATS.mana,
    speed: WARRIOR_STATS.speed,
    color: WARRIOR_STATS.color,
    radius: WARRIOR_STATS.radius,
    attackRange: WARRIOR_STATS.range,
    attackDamage: WARRIOR_STATS.damage,
    attackCooldown: WARRIOR_STATS.cooldown,
    lastAttackTime: 0
  },
  render: {
    assetId: 'warrior',
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
