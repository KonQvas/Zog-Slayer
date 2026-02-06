
import { Entity, UnitType } from '../types';

export const MAGE_STATS = { 
  speed: 1.6, health: 100, mana: 250, color: '#3b82f6', name: 'Void Weaver',
  range: 4.5, damage: 20, cooldown: 1500, radius: 0.35
};

export const createMage = (id: string, poolIndex: number, pos: { x: number; y: number }): Entity => ({
  id,
  poolIndex,
  pos: { ...pos },
  depth: pos.x + pos.y,
  lastSortDepth: -999,
  path: { target: null, waypoints: [], groupId: null },
  stats: {
    type: UnitType.MAGE,
    name: MAGE_STATS.name,
    health: MAGE_STATS.health,
    maxHealth: MAGE_STATS.health,
    mana: MAGE_STATS.mana,
    maxMana: MAGE_STATS.mana,
    speed: MAGE_STATS.speed,
    color: MAGE_STATS.color,
    radius: MAGE_STATS.radius,
    attackRange: MAGE_STATS.range,
    attackDamage: MAGE_STATS.damage,
    attackCooldown: MAGE_STATS.cooldown,
    lastAttackTime: 0
  },
  render: {
    assetId: 'mage',
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
