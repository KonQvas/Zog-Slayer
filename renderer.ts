
import { GameState, Entity, Tile, AnimationState, Direction, Vector2, AssetMetadata } from './types';
import { gridToScreen, screenToGrid } from './isoUtils';
import { 
  TILE_WIDTH, 
  TILE_HEIGHT, 
  COLORS, 
  FX_CHROMATIC_SHIFT, 
  FX_BLOOM_ALPHA, 
  FX_BLOOM_BLUR, 
  FX_BLOOM_BRIGHTNESS, 
  FX_BLOOM_CONTRAST, 
  FX_SCANLINE_GAP, 
  FX_SCANLINE_ALPHA, 
  DEATH_DURATION, 
  MOVE_INDICATOR_DURATION, 
  MOVE_INDICATOR_BASE_SIZE, 
  MOVE_INDICATOR_GROWTH, 
  SELECTION_RING_RADIUS, 
  SELECTION_DASH, 
  FORMATION_DASH, 
  WAYPOINT_DASH, 
  HECKLE_OFFSET_Y, 
  HECKLE_BOUNCE_AMP, 
  HECKLE_BOUNCE_FREQ, 
  HEALTH_BAR, 
  BOSS_CONFIG,
  FX_HALFTONE_SIZE,
  FX_PAPER_ALPHA,
  FX_VIGNETTE_STRENGTH
} from './constants';
import { SpatialGrid } from './spatialGrid';
import { UNIT_ASSETS } from './assets/metadata';

export class IsoRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private tileBuffer: HTMLCanvasElement | null = null;
  private bufferOffset: { x: number; y: number } = { x: 0, y: 0 };
  private lastWorldSize: number = 0;

  // Global Post-Processing Buffers
  private actorLayer: HTMLCanvasElement;
  private actorCtx: CanvasRenderingContext2D;
  private halftonePattern: CanvasPattern | null = null;

  private renderList: Entity[] = [];
  private seenSet: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error("Could not initialize 2D context");
    this.ctx = context;
    
    // Initialize actor layer for global FX
    this.actorLayer = document.createElement('canvas');
    const aContext = this.actorLayer.getContext('2d');
    if (!aContext) throw new Error("Could not initialize actor buffer context");
    this.actorCtx = aContext;
    
    this.createHalftonePattern();
    this.resizeBuffers();
  }

  private createHalftonePattern() {
    const size = FX_HALFTONE_SIZE;
    const pCanvas = document.createElement('canvas');
    pCanvas.width = size * 2;
    pCanvas.height = size * 2;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      pCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      pCtx.beginPath();
      pCtx.arc(size, size, size / 1.5, 0, Math.PI * 2);
      pCtx.fill();
      this.halftonePattern = this.ctx.createPattern(pCanvas, 'repeat');
    }
  }

  private resizeBuffers() {
    if (this.actorLayer.width !== this.canvas.width || this.actorLayer.height !== this.canvas.height) {
      this.actorLayer.width = this.canvas.width;
      this.actorLayer.height = this.canvas.height;
    }
  }

  public preRenderTiles(tiles: Tile[], worldSize: number) {
    const bufferWidth = worldSize * TILE_WIDTH + TILE_WIDTH;
    const bufferHeight = (worldSize + 1) * TILE_HEIGHT;

    const buffer = document.createElement('canvas');
    buffer.width = bufferWidth;
    buffer.height = bufferHeight;
    const bCtx = buffer.getContext('2d');
    if (!bCtx) return;

    const localCamera = { x: bufferWidth / 2, y: 0 };
    this.bufferOffset = localCamera;
    this.lastWorldSize = worldSize;

    tiles.forEach(tile => {
      const p = gridToScreen(tile.x, tile.y, localCamera);
      this.drawTileToCtx(bCtx, p, tile);
    });

    this.tileBuffer = buffer;
  }

  render(state: GameState, spatialGrid: SpatialGrid) {
    this.resizeBuffers();
    const { ctx, canvas, actorCtx, actorLayer } = this;
    const { camera, entities, tiles, selectionRect, formationPath, worldSize, moveIndicator, gameTime, screenShake } = state;

    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    actorCtx.clearRect(0, 0, actorLayer.width, actorLayer.height);

    ctx.save();
    
    if (screenShake && screenShake > 0) {
      const sx = (Math.random() - 0.5) * screenShake;
      const sy = (Math.random() - 0.5) * screenShake;
      ctx.translate(sx, sy);
      actorCtx.translate(sx, sy);
      state.screenShake = screenShake * 0.9;
      if (state.screenShake < 0.5) state.screenShake = undefined;
    }

    if (this.tileBuffer && this.lastWorldSize === worldSize) {
      const drawX = camera.x - this.bufferOffset.x;
      const drawY = camera.y;
      ctx.drawImage(this.tileBuffer, drawX, drawY);
    } else {
      this.preRenderTiles(tiles, worldSize);
    }

    const padding = 3;
    const p1 = screenToGrid(0, 0, camera);
    const p2 = screenToGrid(canvas.width, 0, camera);
    const p3 = screenToGrid(0, canvas.height, camera);
    const p4 = screenToGrid(canvas.width, canvas.height, camera);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x) - padding;
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x) + padding;
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y) - padding;
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y) + padding;

    const visibleIds = spatialGrid.queryBox(minX, minY, maxX, maxY);
    
    this.renderList.length = 0;
    this.seenSet.clear();

    for (let i = 0; i < visibleIds.length; i++) {
      const id = visibleIds[i];
      if (this.seenSet.has(id)) continue;
      this.seenSet.add(id);
      const entity = entities.get(id);
      if (entity) this.renderList.push(entity);
    }

    this.renderList.sort((a, b) => a.depth - b.depth);

    for (let i = 0; i < this.renderList.length; i++) {
      const entity = this.renderList[i];
      const p = gridToScreen(entity.pos.x, entity.pos.y, camera);
      this.drawEntityToCtx(actorCtx, p, entity, gameTime);
    }

    if (moveIndicator) this.drawMoveIndicatorToCtx(actorCtx, moveIndicator, gameTime, camera);
    this.drawQueuedPathsToCtx(actorCtx, state);

    this.applyGlobalFX();

    if (selectionRect) this.drawSelectionRect(selectionRect);
    if (formationPath) this.drawFormationPreview(state);
    
    ctx.restore();
  }

  private applyGlobalFX() {
    const { ctx, canvas, actorLayer, halftonePattern } = this;
    ctx.save();
    
    // 1. Chromatic Aberration Pass (Comic Ink Shift)
    const shift = FX_CHROMATIC_SHIFT;
    ctx.globalAlpha = 1.0;
    ctx.drawImage(actorLayer, -shift, 0);
    
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(actorLayer, shift, 0);
    
    // 2. High Contrast Bloom (Pop)
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = FX_BLOOM_ALPHA;
    ctx.filter = `blur(${FX_BLOOM_BLUR}) brightness(${FX_BLOOM_BRIGHTNESS}) contrast(${FX_BLOOM_CONTRAST})`;
    ctx.drawImage(actorLayer, 0, 0);
    ctx.filter = 'none';

    // 3. Halftone Overlay
    if (halftonePattern) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = halftonePattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 4. Scanlines (Comic Print Quality)
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = FX_SCANLINE_ALPHA;
    ctx.fillStyle = '#000';
    for (let i = 0; i < canvas.height; i += FX_SCANLINE_GAP) {
      ctx.fillRect(0, i, canvas.width, 1);
    }

    // 5. Paper Grain Texture
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = FX_PAPER_ALPHA;
    ctx.fillStyle = '#fdfbf0'; // Slightly yellowed paper
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 6. Vignette (Dramatic Focus)
    const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width * 0.2, canvas.width/2, canvas.height/2, canvas.width * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${FX_VIGNETTE_STRENGTH})`);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
  }

  private drawFormationPreview(state: GameState) {
    const { ctx } = this;
    const { formationPath, camera, entities, gameTime } = state;
    if (!formationPath || formationPath.length < 2) return;

    let count = 0;
    entities.forEach(e => { if (e.render.selected) count++; });
    if (count === 0) return;

    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.FORMATION_GLOW;
    ctx.strokeStyle = COLORS.FORMATION_PREVIEW;
    ctx.lineWidth = 3;
    ctx.setLineDash(FORMATION_DASH);
    ctx.lineDashOffset = -gameTime / 20;
    
    ctx.beginPath();
    const startP = gridToScreen(formationPath[0].x, formationPath[0].y, camera);
    ctx.moveTo(startP.x, startP.y);
    for (let i = 1; i < formationPath.length; i++) {
      const p = gridToScreen(formationPath[i].x, formationPath[i].y, camera);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    const segmentLengths: number[] = [];
    const cumulativeLengths: number[] = [0];
    let totalLength = 0;
    for (let i = 0; i < formationPath.length - 1; i++) {
      const dx = formationPath[i+1].x - formationPath[i].x;
      const dy = formationPath[i+1].y - formationPath[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segmentLengths.push(len);
      totalLength += len;
      cumulativeLengths.push(totalLength);
    }

    const getPointAtDist = (d: number): Vector2 => {
      if (d <= 0) return { ...formationPath[0] };
      if (d >= totalLength) return { ...formationPath[formationPath.length - 1] };
      for (let i = 0; i < segmentLengths.length; i++) {
        if (d <= cumulativeLengths[i + 1]) {
          const t = (d - cumulativeLengths[i]) / segmentLengths[i];
          return {
            x: formationPath[i].x + (formationPath[i+1].x - formationPath[i].x) * t,
            y: formationPath[i].y + (formationPath[i+1].y - formationPath[i].y) * t,
          };
        }
      }
      return { ...formationPath[formationPath.length - 1] };
    };

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0.5;
      const gPos = getPointAtDist(t * totalLength);
      const p = gridToScreen(gPos.x, gPos.y, camera);
      this.drawWaypointMarker(ctx, p, 'rgba(34, 211, 238, 0.6)', gameTime);
    }
    ctx.restore();
  }

  private drawQueuedPathsToCtx(targetCtx: CanvasRenderingContext2D, state: GameState) {
    const { entities, camera, gameTime } = state;
    entities.forEach(entity => {
      if (!entity.render.selected || !entity.path || !entity.path.target) return;
      targetCtx.save();
      targetCtx.setLineDash(WAYPOINT_DASH);
      targetCtx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      targetCtx.lineWidth = 2;
      targetCtx.beginPath();
      const currentP = gridToScreen(entity.pos.x, entity.pos.y, camera);
      targetCtx.moveTo(currentP.x, currentP.y);
      const targetP = gridToScreen(entity.path.target.x, entity.path.target.y, camera);
      targetCtx.lineTo(targetP.x, targetP.y);
      this.drawWaypointMarker(targetCtx, targetP, COLORS.WAYPOINT_ACTIVE, gameTime);
      entity.path.waypoints.forEach(wp => {
        const wpP = gridToScreen(wp.x, wp.y, camera);
        targetCtx.lineTo(wpP.x, wpP.y);
        this.drawWaypointMarker(targetCtx, wpP, COLORS.WAYPOINT, gameTime);
      });
      targetCtx.stroke();
      targetCtx.restore();
    });
  }

  private drawWaypointMarker(targetCtx: CanvasRenderingContext2D, p: Vector2, color: string, gameTime: number) {
    targetCtx.save();
    targetCtx.translate(p.x, p.y);
    targetCtx.rotate((gameTime / 800) % (Math.PI * 2));
    targetCtx.fillStyle = color;
    const size = 6;
    targetCtx.beginPath();
    targetCtx.moveTo(0, -size);
    targetCtx.lineTo(size, 0);
    targetCtx.lineTo(0, size);
    targetCtx.lineTo(-size, 0);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.restore();
  }

  private drawMoveIndicatorToCtx(targetCtx: CanvasRenderingContext2D, indicator: { pos: Vector2; time: number }, gameTime: number, camera: Vector2) {
    const duration = MOVE_INDICATOR_DURATION;
    const elapsed = gameTime - indicator.time;
    if (elapsed > duration || elapsed < 0) return;
    const t = elapsed / duration;
    const p = gridToScreen(indicator.pos.x, indicator.pos.y, camera);
    targetCtx.save();
    targetCtx.translate(p.x, p.y);
    const size = Math.max(0.1, MOVE_INDICATOR_BASE_SIZE + t * MOVE_INDICATOR_GROWTH);
    const alpha = (1 - t);
    targetCtx.beginPath();
    targetCtx.ellipse(0, 0, size, Math.max(0.1, size / 2), 0, 0, Math.PI * 2);
    targetCtx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
    targetCtx.lineWidth = 4 * (1 - t);
    targetCtx.stroke();
    targetCtx.restore();
  }

  private drawTileToCtx(targetCtx: CanvasRenderingContext2D, p: { x: number; y: number }, tile: Tile) {
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    targetCtx.beginPath();
    targetCtx.moveTo(p.x, p.y - hh);
    targetCtx.lineTo(p.x + hw, p.y);
    targetCtx.lineTo(p.x, p.y + hh);
    targetCtx.lineTo(p.x - hw, p.y);
    targetCtx.closePath();
    switch(tile.type) {
        case 'rune': targetCtx.fillStyle = 'rgba(168, 85, 247, 0.12)'; break;
        case 'crystal': targetCtx.fillStyle = 'rgba(6, 182, 212, 0.12)'; break;
        case 'techno': targetCtx.fillStyle = 'rgba(234, 179, 8, 0.08)'; break;
        case 'void': targetCtx.fillStyle = '#0a0a1a'; break;
        default: targetCtx.fillStyle = 'rgba(12, 12, 18, 0.4)'; break;
    }
    targetCtx.fill();
    targetCtx.strokeStyle = COLORS.GRID_GLOW;
    targetCtx.lineWidth = 1;
    targetCtx.stroke();
  }

  private drawEntityToCtx(targetCtx: CanvasRenderingContext2D, p: { x: number; y: number }, entity: Entity, gameTime: number) {
    const { render, stats, combat } = entity;
    const asset = UNIT_ASSETS[render.assetId] || UNIT_ASSETS['scout'];
    const scale = asset.baseScale;

    targetCtx.save();
    if (render.animationState === 'die' && render.deathTime) {
      const elapsed = gameTime - render.deathTime;
      const alpha = Math.max(0, 1 - (elapsed / DEATH_DURATION));
      targetCtx.globalAlpha = alpha;
      if (alpha <= 0) { targetCtx.restore(); return; }
    }

    if (asset.animationHooks?.chargeEffect && combat?.isCharging && combat.specialWindup) {
      const remaining = combat.specialWindup - gameTime;
      const progress = Math.max(0.01, 1 - (remaining / BOSS_CONFIG.WINDUP_DURATION));
      targetCtx.save();
      targetCtx.translate(p.x, p.y);
      targetCtx.beginPath();
      targetCtx.ellipse(0, 0, Math.max(0.1, progress * 180), Math.max(0.1, progress * 90), 0, 0, Math.PI * 2);
      targetCtx.strokeStyle = `rgba(244, 63, 94, ${0.5 + Math.sin(gameTime / 50) * 0.3})`;
      targetCtx.lineWidth = 4;
      targetCtx.setLineDash([10, 5]);
      targetCtx.stroke();
      targetCtx.restore();
    }

    if (render.selected) {
      targetCtx.save();
      targetCtx.translate(p.x, p.y);
      targetCtx.beginPath();
      targetCtx.ellipse(0, 0, SELECTION_RING_RADIUS * scale, (SELECTION_RING_RADIUS / 2) * scale, 0, 0, Math.PI * 2);
      targetCtx.strokeStyle = combat?.isBoss ? COLORS.ACCENT : COLORS.SECONDARY;
      targetCtx.lineWidth = 2;
      targetCtx.setLineDash(SELECTION_DASH);
      targetCtx.stroke();
      targetCtx.fillStyle = combat?.isBoss ? 'rgba(244, 63, 94, 0.1)' : 'rgba(6, 182, 212, 0.1)';
      targetCtx.fill();
      targetCtx.restore();
    }

    targetCtx.beginPath();
    targetCtx.ellipse(p.x, p.y, asset.shadowScale.x * scale, asset.shadowScale.y * scale, 0, 0, Math.PI * 2);
    targetCtx.fillStyle = 'rgba(0,0,0,0.4)';
    targetCtx.fill();

    targetCtx.save();
    targetCtx.translate(p.x, p.y);
    targetCtx.scale(scale, scale);
    
    if (render.spriteSheet) {
        this.drawSprite(targetCtx, render);
    } else {
        this.drawPlaceholder(targetCtx, render, asset, stats?.color || '#fff', gameTime);
    }
    
    if (render.heckleText) {
      targetCtx.save();
      targetCtx.scale(1/scale, 1/scale);
      targetCtx.fillStyle = '#fff';
      targetCtx.strokeStyle = '#000';
      targetCtx.lineWidth = 4;
      targetCtx.font = 'bold 20px "Bangers"';
      targetCtx.textAlign = 'center';
      const bounce = Math.sin(Date.now() / HECKLE_BOUNCE_FREQ) * HECKLE_BOUNCE_AMP;
      targetCtx.strokeText(render.heckleText, 0, HECKLE_OFFSET_Y + bounce);
      targetCtx.fillText(render.heckleText, 0, HECKLE_OFFSET_Y + bounce);
      targetCtx.restore();
    }
    targetCtx.restore();

    if (stats && stats.health < stats.maxHealth && stats.health > 0) {
      const w = HEALTH_BAR.WIDTH * scale;
      const h = HEALTH_BAR.HEIGHT;
      const x = p.x - w/2;
      const y = p.y + (HEALTH_BAR.OFFSET_Y * scale);
      targetCtx.fillStyle = '#000';
      targetCtx.fillRect(x - HEALTH_BAR.PADDING, y - HEALTH_BAR.PADDING, w + (HEALTH_BAR.PADDING * 2), h + (HEALTH_BAR.PADDING * 2));
      targetCtx.fillStyle = '#111';
      targetCtx.fillRect(x, y, w, h);
      const hpRatio = stats.health / stats.maxHealth;
      targetCtx.fillStyle = hpRatio > 0.4 ? COLORS.HEALTH_HIGH : COLORS.HEALTH_LOW;
      targetCtx.fillRect(x, y, w * hpRatio, h);
    }
    targetCtx.restore();
  }

  private drawSprite(ctx: CanvasRenderingContext2D, render: any) {
      const frameWidth = 128; 
      const frameHeight = 128; 
      const directions: Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const row = Math.max(0, directions.indexOf(render.direction));
      ctx.drawImage(
          render.spriteSheet,
          render.frame * frameWidth, row * frameHeight, frameWidth, frameHeight,
          -frameWidth / 2, -frameHeight + 32, 
          frameWidth, frameHeight
      );
  }

  private drawPlaceholder(ctx: CanvasRenderingContext2D, render: any, asset: AssetMetadata, color: string, gameTime: number) {
    const { direction: dir, animationState: state, frame } = render;
    const bounce = (asset.animationHooks?.bounce && state === 'walk') ? Math.sin(gameTime / 90) * 5 : 0;
    const chargeOffset = state === 'special' ? Math.sin(gameTime / 30) * 3 : 0;
    let attackLungeX = 0, attackLungeY = 0;

    const dirAngles: Record<Direction, number> = {
        'S': Math.PI / 2, 'SE': Math.PI / 4, 'E': 0, 'NE': -Math.PI / 4,
        'N': -Math.PI / 2, 'NW': -3 * Math.PI / 4, 'W': Math.PI, 'SW': 3 * Math.PI / 4
    };
    const baseAngle = dirAngles[dir] || 0;

    if (asset.animationHooks?.lunge && state === 'attack') {
        const attackProgress = frame / asset.frameCount.attack;
        const lungeMag = Math.sin(attackProgress * Math.PI) * 35;
        attackLungeX = Math.cos(baseAngle) * lungeMag;
        attackLungeY = Math.sin(baseAngle) * lungeMag;
    }

    ctx.save();
    ctx.translate(chargeOffset + attackLungeX, asset.hitboxOffset.y + bounce + attackLungeY);

    if (asset.placeholderType === 'boss' && state === 'attack') {
        const attackProgress = frame / asset.frameCount.attack;
        const thrustDist = Math.sin(attackProgress * Math.PI) * 60;
        ctx.save();
        ctx.rotate(baseAngle);
        const bladeLen = 50 + thrustDist;
        const bladeWidth = 15;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(bladeLen - 20, -bladeWidth);
        ctx.lineTo(bladeLen, 0);
        ctx.lineTo(bladeLen - 20, bladeWidth);
        ctx.closePath();
        const bladeGrad = ctx.createLinearGradient(0, 0, bladeLen, 0);
        bladeGrad.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
        bladeGrad.addColorStop(0.7, 'rgba(244, 63, 94, 0.9)');
        bladeGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');
        ctx.fillStyle = bladeGrad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f43f5e';
        ctx.fill();
        ctx.restore();
    }

    ctx.beginPath();
    if (asset.placeholderType === 'boss') {
      ctx.moveTo(0, -50); ctx.lineTo(30, -10); ctx.lineTo(15, 40); ctx.lineTo(-15, 40); ctx.lineTo(-30, -10);
    } else {
      ctx.moveTo(0, -38); ctx.lineTo(22, 0); ctx.lineTo(0, 32); ctx.lineTo(-22, 0);
    }
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, -50, 0, 40);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.strokeStyle = state === 'hit' ? '#fff' : '#000';
    ctx.lineWidth = asset.placeholderType === 'boss' ? 4 : 3;
    ctx.stroke();
    ctx.fill();

    const visorOffsets: Record<Direction, [number, number]> = {
      'S':  [0, 10], 'SE': [12, 6], 'E':  [15, -6], 'NE': [10, -18],
      'N':  [0, -22], 'NW': [-10, -18], 'W':  [-15, -6], 'SW': [-12, 6]
    };
    const [vx, vy] = visorOffsets[dir] || [0, 10];
    const visorWValue = typeof asset.visorConfig.w === 'function' ? asset.visorConfig.w(dir) : asset.visorConfig.w;
    const visorColor = typeof asset.visorConfig.color === 'function' ? asset.visorConfig.color(state) : asset.visorConfig.color;
    
    ctx.fillStyle = visorColor;
    ctx.beginPath();
    ctx.ellipse(vx, vy, Math.max(0.1, visorWValue), Math.max(0.1, asset.visorConfig.h), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    if (asset.placeholderType === 'boss') {
        ctx.ellipse(vx + Math.sin(gameTime / 150) * 2, vy, 2.5, 4.5, 0, 0, Math.PI * 2);
    } else {
        ctx.arc(vx, vy, 1.5, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.restore();
  }

  private drawSelectionRect(rect: { start: { x: number; y: number }; end: { x: number; y: number } }) {
    const { ctx } = this;
    const x = Math.min(rect.start.x, rect.end.x);
    const y = Math.min(rect.start.y, rect.end.y);
    const w = Math.max(0.1, Math.abs(rect.start.x - rect.end.x));
    const h = Math.max(0.1, Math.abs(rect.start.y - rect.end.y));
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fillRect(x, y, w, h);
  }
}
