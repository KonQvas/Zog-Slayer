
import { GameState, Entity, Vector2, UnitType, Tile } from './types';
import { WORLD_SIZE } from './constants';
import { MovementSystem, CombatSystem, AnimationSystem } from './systems';
import { ZogAbilitiesSystem } from './ZogAbilitiesSystem';
import { IsoRenderer } from './renderer';
import { SpatialGrid } from './spatialGrid';
import { createUnit } from './units/factory';

const MAX_ENTITIES = 512;
const BOSS_POOL_INDEX = 100;
const INITIAL_UNIT_COUNT = 16;
const GRID_CELL_SIZE = 1.5;

export class GameEngine {
  public state: GameState;
  private renderer: IsoRenderer | null = null;
  private spatialGrid: SpatialGrid<string>;
  private lastTime: number = 0;
  private frameId: number | null = null;
  private onSyncUI: (units: any[]) => void;

  constructor(onSyncUI: (units: any[]) => void) {
    this.onSyncUI = onSyncUI;
    this.spatialGrid = new SpatialGrid<string>(GRID_CELL_SIZE);
    
    const positionBuffer = new Float32Array(MAX_ENTITIES * 2);
    const velocityBuffer = new Float32Array(MAX_ENTITIES * 2);

    this.state = {
      entities: new Map(),
      tiles: this.createTiles(),
      camera: { x: window.innerWidth / 2, y: 50 },
      selectionRect: null,
      formationPath: null,
      moveIndicator: null,
      worldSize: WORLD_SIZE,
      gameTime: 0,
      positionBuffer,
      velocityBuffer
    };

    this.initEntities();
  }

  private createTiles(): Tile[] {
    const tiles: Tile[] = [];
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let y = 0; y < WORLD_SIZE; y++) {
        const rand = Math.random();
        let type: Tile['type'] = 'dirt';
        if (rand > 0.98) type = 'void';
        else if (rand > 0.94) type = 'crystal';
        else if (rand > 0.88) type = 'rune';
        else if (rand > 0.82) type = 'techno';
        tiles.push({ x, y, height: 0, type });
      }
    }
    return tiles;
  }

  private initEntities() {
    const types = [UnitType.SCOUT, UnitType.WARRIOR, UnitType.MAGE, UnitType.TECHNO_PRIEST];
    for (let i = 0; i < INITIAL_UNIT_COUNT; i++) {
      const type = types[i % types.length];
      const id = `unit-${i}`;
      const startX = 4 + Math.floor(i / 4) * 2.5;
      const startY = 4 + (i % 4) * 2.5;
      this.state.positionBuffer[i * 2] = startX;
      this.state.positionBuffer[i * 2 + 1] = startY;
      const entity = createUnit(type, id, i, { x: startX, y: startY });
      this.state.entities.set(id, entity);
    }

    const bossId = 'boss-zog';
    const bossIdx = BOSS_POOL_INDEX; 
    const bossX = 16;
    const bossY = 16;
    this.state.positionBuffer[bossIdx * 2] = bossX;
    this.state.positionBuffer[bossIdx * 2 + 1] = bossY;
    const boss = createUnit(UnitType.BOSS_OVERSEER, bossId, bossIdx, { x: bossX, y: bossY });
    this.state.entities.set(bossId, boss);
  }

  public setRenderer(canvas: HTMLCanvasElement) {
    this.renderer = new IsoRenderer(canvas);
    this.renderer.preRenderTiles(this.state.tiles, this.state.worldSize);
  }

  public start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
  }

  private loop = (now: number) => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.state.gameTime = now;

    ZogAbilitiesSystem(this.state, dt, this.spatialGrid);
    MovementSystem(this.state, dt, this.spatialGrid);
    CombatSystem(this.state.entities, now);
    AnimationSystem(this.state.entities, now);

    this.state.entities.forEach(entity => {
      entity.pos.x = this.state.positionBuffer[entity.poolIndex * 2];
      entity.pos.y = this.state.positionBuffer[entity.poolIndex * 2 + 1];
    });

    if (this.renderer) {
      this.renderer.render(this.state, this.spatialGrid);
    }

    this.frameId = requestAnimationFrame(this.loop);
  };

  public syncUI() {
    const unitsArray = Array.from(this.state.entities.values()).map(e => ({
      id: e.id,
      type: e.stats?.type || UnitType.SCOUT,
      pos: { ...e.pos },
      targetPos: e.path?.target ? { ...e.path.target } : null,
      speed: e.stats?.speed || 0,
      health: e.stats?.health || 0,
      maxHealth: e.stats?.maxHealth || 100,
      selected: !!e.render.selected,
      color: e.stats?.color || '#fff',
      facing: e.render.direction,
      name: e.stats?.name || 'Unknown',
      mana: e.stats?.mana || 0
    }));
    this.onSyncUI(unitsArray);
  }
}
