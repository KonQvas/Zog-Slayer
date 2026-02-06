
import { Entity, GameState, Vector2, Direction, AnimationState, UnitType } from './types';
import { getDirection } from './isoUtils';
import { 
  SEPARATION_STRENGTH, 
  ARRIVAL_THRESHOLD_SQ, 
  GROUP_ARRIVAL_THRESHOLD_SQ,
  MAX_SEPARATION_DIST,
  KNOCKBACK_DECAY,
  KNOCKBACK_STOP_THRESHOLD,
  MIN_VELOCITY_SQ,
  BOSS_SEPARATION_MULTIPLIER,
  HIT_BOX
} from './constants';
import { SpatialGrid } from './spatialGrid';
import { UNIT_ASSETS } from './assets/metadata';

const HIT_RECOVERY_TIME = 400;
const ATTACK_RECOVERY_TIME = 800;

export const MovementSystem = (state: GameState, dt: number, spatialGrid: SpatialGrid) => {
  const { entities, positionBuffer } = state;
  
  entities.forEach(entity => {
    const idx = entity.poolIndex * 2;
    const px = positionBuffer[idx];
    const py = positionBuffer[idx + 1];

    if (entity.render.animationState === 'die') {
      if (entity.gridKey !== undefined) {
        spatialGrid.removeByKey(entity.gridKey, entity.id);
        entity.gridKey = undefined;
      }
      return;
    }

    const currentKey = spatialGrid.getKey(px, py);
    if (entity.gridKey === undefined) {
      spatialGrid.insertWithKey(currentKey, entity.id);
      entity.gridKey = currentKey;
    } else if (currentKey !== entity.gridKey) {
      spatialGrid.removeByKey(entity.gridKey, entity.id);
      spatialGrid.insertWithKey(currentKey, entity.id);
      entity.gridKey = currentKey;
    }
  });

  entities.forEach(entity => {
    if (!entity.stats || entity.render.animationState === 'die') return;

    const idx = entity.poolIndex * 2;
    const px = positionBuffer[idx];
    const py = positionBuffer[idx + 1];
    
    let desiredVx = 0;
    let desiredVy = 0;
    let isMoving = false;

    if (entity.knockback) {
      positionBuffer[idx] += entity.knockback.x * dt;
      positionBuffer[idx + 1] += entity.knockback.y * dt;
      entity.knockback.x *= KNOCKBACK_DECAY;
      entity.knockback.y *= KNOCKBACK_DECAY;
      if (Math.abs(entity.knockback.x) + Math.abs(entity.knockback.y) < KNOCKBACK_STOP_THRESHOLD) {
        entity.knockback = undefined;
        if (entity.render.animationState === 'hit') entity.render.animationState = 'idle';
      }
    } else if (entity.path && entity.path.target) {
      const dx = entity.path.target.x - px;
      const dy = entity.path.target.y - py;
      const d2 = dx * dx + dy * dy;

      if (d2 < ARRIVAL_THRESHOLD_SQ) {
        if (entity.path.waypoints.length > 0) {
          entity.path.target = entity.path.waypoints.shift() || null;
        } else {
          entity.path.target = null;
          if (entity.render.animationState === 'walk') entity.render.animationState = 'idle';
        }
      } else {
        const dist = Math.sqrt(d2);
        desiredVx = (dx / dist) * entity.stats.speed;
        desiredVy = (dy / dist) * entity.stats.speed;
        isMoving = true;
      }
    }

    const neighbors = spatialGrid.queryRadius({ x: px, y: py }, MAX_SEPARATION_DIST);
    let sepX = 0, sepY = 0;

    for (let i = 0; i < neighbors.length; i++) {
      const nid = neighbors[i];
      if (nid === entity.id) continue;
      const other = entities.get(nid);
      if (!other || !other.stats || other.render.animationState === 'die') continue;
      const oIdx = other.poolIndex * 2;
      const opx = positionBuffer[oIdx];
      const opy = positionBuffer[oIdx + 1];
      const dx = px - opx;
      const dy = py - opy;
      const d2 = dx * dx + dy * dy;
      const separationThreshold = (entity.stats.radius + other.stats.radius) * 1.1;
      const separationThresholdSq = separationThreshold * separationThreshold;
      if (d2 < separationThresholdSq && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        const weight = (separationThreshold - d) / separationThreshold;
        const multiplier = entity.combat?.isBoss ? BOSS_SEPARATION_MULTIPLIER : 1.0;
        sepX += (dx / d) * weight * SEPARATION_STRENGTH * multiplier;
        sepY += (dy / d) * weight * SEPARATION_STRENGTH * multiplier;
      }
    }

    const finalVx = desiredVx + sepX;
    const finalVy = desiredVy + sepY;
    if (finalVx * finalVx + finalVy * finalVy > MIN_VELOCITY_SQ) {
      positionBuffer[idx] += finalVx * dt;
      positionBuffer[idx + 1] += finalVy * dt;
      if (isMoving) {
        entity.render.direction = getDirection({ x: px, y: py }, { x: px + finalVx, y: py + finalVy });
        entity.render.animationState = 'walk';
      }
    }
    entity.depth = positionBuffer[idx] + positionBuffer[idx + 1];
  });
};

export const CombatSystem = (entities: Map<string, Entity>, now: number) => {
  entities.forEach(entity => {
    if (!entity.stats || entity.render.animationState === 'die') return;
    if (entity.stats.health <= 0) {
      entity.render.animationState = 'die';
      entity.render.frame = 0;
      entity.render.deathTime = now;
      entity.path = undefined;
      entity.combat = undefined;
      return;
    }
    if (entity.render.animationState === 'attack' || entity.render.animationState === 'hit') {
      const duration = entity.render.animationState === 'hit' ? HIT_RECOVERY_TIME : ATTACK_RECOVERY_TIME;
      if (now - (entity.render.lastFrameUpdate || 0) > duration) {
          const asset = UNIT_ASSETS[entity.render.assetId] || UNIT_ASSETS['scout'];
          if (entity.render.frame === (asset.frameCount[entity.render.animationState] - 1)) {
              entity.render.animationState = 'idle';
          }
      }
    }
  });
};

export const AnimationSystem = (entities: Map<string, Entity>, now: number) => {
  entities.forEach(entity => {
    const asset = UNIT_ASSETS[entity.render.assetId] || UNIT_ASSETS['scout'];
    const rate = asset.frameRate[entity.render.animationState] || 150;
    
    if (now - entity.render.lastFrameUpdate > rate) {
      const frameCount = asset.frameCount[entity.render.animationState] || 4;
      if (entity.render.animationState === 'die' && entity.render.frame === frameCount - 1) return; 
      entity.render.frame = (entity.render.frame + 1) % frameCount;
      entity.render.lastFrameUpdate = now;
    }
  });
};

export const SelectionSystem = (state: GameState, gridToScreen: any, isShift: boolean = false) => {
  if (!state.selectionRect) return;
  const { start, end } = state.selectionRect;
  const x1 = Math.min(start.x, end.x), x2 = Math.max(start.x, end.x);
  const y1 = Math.min(start.y, end.y), y2 = Math.max(start.y, end.y);

  state.entities.forEach(entity => {
    if (entity.combat?.isBoss || entity.render.animationState === 'die') return;
    const px = state.positionBuffer[entity.poolIndex * 2];
    const py = state.positionBuffer[entity.poolIndex * 2 + 1];
    const screenPos = gridToScreen(px, py, state.camera);
    const uX1 = screenPos.x - HIT_BOX.WIDTH, uX2 = screenPos.x + HIT_BOX.WIDTH;
    const uY1 = screenPos.y + HIT_BOX.TOP, uY2 = screenPos.y + HIT_BOX.BOTTOM;
    const inRect = !(uX2 < x1 || uX1 > x2 || uY2 < y1 || uY1 > y2);
    if (isShift) { if (inRect) entity.render.selected = true; } else { entity.render.selected = inRect; }
  });
};
