
import { GameState, UnitType } from './types';
import { getDirection } from './isoUtils';
import { SpatialGrid } from './spatialGrid';
import { BOSS_CONFIG } from './constants';

const HECKLES = [
  "MOVE IT, MAGGOT!",
  "PATHETIC FORMATION!",
  "MY GRANDMA MOVES FASTER!",
  "GET OUT OF MY GRID!",
  "LOVELY TARGET PRACTICE!",
  "WASTE OF ETHER!",
  "COWER BEFORE ME!",
  "ZOG REIGNS SUPREME!"
];

/**
 * ZogAbilitiesSystem handles the AI, heckling, and special abilities 
 * specifically for the Boss Overseer (Zog).
 */
export const ZogAbilitiesSystem = (state: GameState, dt: number, spatialGrid: SpatialGrid) => {
  const { entities, positionBuffer, gameTime } = state;

  entities.forEach(boss => {
    // Only process if this is the Boss Overseer and it's alive
    if (!boss.combat?.isBoss || boss.render.animationState === 'die' || !boss.stats) return;

    const bIdx = boss.poolIndex * 2;
    const bx = positionBuffer[bIdx];
    const by = positionBuffer[bIdx + 1];

    // 1. Target Selection Logic
    const needsNewTarget = !boss.combat.targetEntityId || 
                           !entities.has(boss.combat.targetEntityId) || 
                           entities.get(boss.combat.targetEntityId)?.render.animationState === 'die';

    if (needsNewTarget || gameTime % BOSS_CONFIG.TARGET_REFRESH_RATE < 50) {
      let closestDist = Infinity;
      let targetId: string | null = null;
      
      entities.forEach(playerUnit => {
        if (playerUnit.id === boss.id || playerUnit.render.animationState === 'die') return;
        
        const dx = playerUnit.pos.x - bx;
        const dy = playerUnit.pos.y - by;
        const d2 = dx * dx + dy * dy;
        
        if (d2 < (boss.combat!.aggroRadius ** 2) && d2 < closestDist) {
          closestDist = d2;
          targetId = playerUnit.id;
        }
      });
      boss.combat.targetEntityId = targetId;
    }

    const target = boss.combat.targetEntityId ? entities.get(boss.combat.targetEntityId) : null;

    // 2. Heckling (Taunts)
    if (!boss.render.heckleText || (gameTime - (boss.render.heckleTime || 0) > BOSS_CONFIG.HECKLE_COOLDOWN)) {
       if (Math.random() < BOSS_CONFIG.HECKLE_CHANCE) {
          boss.render.heckleText = HECKLES[Math.floor(Math.random() * HECKLES.length)];
          boss.render.heckleTime = gameTime;
       }
    } else if (gameTime - (boss.render.heckleTime || 0) > BOSS_CONFIG.HECKLE_DISPLAY_TIME) {
      boss.render.heckleText = undefined;
    }

    // 3. Special Ability: The "Void Blast" (Telegraphed Shove)
    const timeSinceSpecial = gameTime - (boss.combat.lastSpecialTime || 0);
    
    if (!boss.combat.isCharging && timeSinceSpecial > BOSS_CONFIG.SPECIAL_COOLDOWN) {
      const nearbyCount = spatialGrid.queryRadius({ x: bx, y: by }, BOSS_CONFIG.SHOVE_RADIUS)
        .filter(id => {
          const u = entities.get(id);
          return u && !u.combat?.isBoss && u.render.animationState !== 'die';
        }).length;

      if (nearbyCount >= 1) { 
        boss.combat.isCharging = true;
        boss.combat.specialWindup = gameTime + BOSS_CONFIG.WINDUP_DURATION;
        boss.render.animationState = 'special';
        boss.render.heckleText = "GET BACK!";
        boss.render.heckleTime = gameTime;
        if (boss.path) boss.path.target = null;
      }
    }

    if (boss.combat.isCharging && gameTime >= (boss.combat.specialWindup || 0)) {
      boss.combat.isCharging = false;
      boss.combat.lastSpecialTime = gameTime;
      state.screenShake = BOSS_CONFIG.SCREEN_SHAKE_IMPACT;
      
      const victims = spatialGrid.queryRadius({ x: bx, y: by }, BOSS_CONFIG.SHOVE_RADIUS);
      victims.forEach(id => {
        const unit = entities.get(id);
        if (unit && !unit.combat?.isBoss && unit.render.animationState !== 'die') {
          const dx = unit.pos.x - bx;
          const dy = unit.pos.y - by;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          
          const force = BOSS_CONFIG.BLAST_FORCE / (dist + 0.4);
          unit.knockback = {
            x: (dx / dist) * force,
            y: (dy / dist) * force
          };
          
          if (unit.stats) {
            unit.stats.health -= BOSS_CONFIG.BLAST_DAMAGE;
            unit.render.animationState = 'hit';
            if (unit.path) unit.path.target = null;
          }
        }
      });
    }

    // 4. Combat Navigation and Basic Attacks
    if (target && !boss.combat.isCharging) {
      const dx = target.pos.x - bx;
      const dy = target.pos.y - by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > boss.stats.attackRange * 0.85) {
        if (boss.path) {
            boss.path.target = { x: target.pos.x, y: target.pos.y };
            boss.path.waypoints = [];
        }
      } else {
        if (boss.path) boss.path.target = null;
        
        if (gameTime - boss.stats.lastAttackTime > boss.stats.attackCooldown) {
          boss.render.animationState = 'attack';
          boss.stats.lastAttackTime = gameTime;
          boss.render.direction = getDirection(boss.pos, target.pos);
          
          if (target.stats) {
            target.stats.health -= boss.stats.attackDamage;
            target.render.animationState = 'hit';
            target.knockback = {
              x: (dx / dist) * 2.5,
              y: (dy / dist) * 2.5
            };
          }
        }
      }
    }
  });
};
