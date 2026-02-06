
import { Entity, UnitType } from '../types';

export const OVERSEER_STATS = { 
  speed: 2.2, health: 1500, mana: 500, color: '#f43f5e', name: 'Zog the Insufferable',
  range: 2.0, damage: 25, cooldown: 1200, radius: 0.8
};

export const createOverseer = (id: string, poolIndex: number, pos: { x: number; y: number }): Entity => ({
  id,
  poolIndex,
  pos: { ...pos },
  depth: pos.x + pos.y,
  lastSortDepth: -999,
  path: { target: null, waypoints: [], groupId: null },
  stats: {
    type: UnitType.BOSS_OVERSEER,
    name: OVERSEER_STATS.name,
    health: OVERSEER_STATS.health,
    maxHealth: OVERSEER_STATS.health,
    mana: OVERSEER_STATS.mana,
    maxMana: OVERSEER_STATS.mana,
    speed: OVERSEER_STATS.speed,
    color: OVERSEER_STATS.color,
    radius: OVERSEER_STATS.radius,
    attackRange: OVERSEER_STATS.range,
    attackDamage: OVERSEER_STATS.damage,
    attackCooldown: OVERSEER_STATS.cooldown,
    lastAttackTime: 0
  },
  render: {
    assetId: 'overseer',
    animationState: 'idle',
    direction: 'S',
    frame: 0,
    lastFrameUpdate: Date.now(),
    selected: false,
    effectTimer: 0
  },
  combat: {
    targetEntityId: null,
    aggroRadius: 12,
    isBoss: true,
    lastSpecialTime: 0
  }
});
