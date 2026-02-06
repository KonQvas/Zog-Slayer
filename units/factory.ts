
import { Entity, UnitType, Vector2 } from '../types';
import { createScout } from './Scout';
import { createWarrior } from './Warrior';
import { createMage } from './Mage';
import { createTechnoPriest } from './TechnoPriest';
import { createOverseer } from './Overseer';

export const createUnit = (type: UnitType, id: string, poolIndex: number, pos: Vector2): Entity => {
  switch (type) {
    case UnitType.SCOUT:
      return createScout(id, poolIndex, pos);
    case UnitType.WARRIOR:
      return createWarrior(id, poolIndex, pos);
    case UnitType.MAGE:
      return createMage(id, poolIndex, pos);
    case UnitType.TECHNO_PRIEST:
      return createTechnoPriest(id, poolIndex, pos);
    case UnitType.BOSS_OVERSEER:
      return createOverseer(id, poolIndex, pos);
    default:
      return createScout(id, poolIndex, pos);
  }
};
