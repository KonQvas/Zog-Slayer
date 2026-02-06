
import React, { useEffect, useRef, useState } from 'react';
import { Vector2, Unit, Entity } from './types';
import { screenToGrid, gridToScreen } from './isoUtils';
import { SelectionSystem } from './systems';
import { GameEngine } from './engine';
import GameOverlay from './components/GameOverlay';
import { 
  UI_SYNC_INTERVAL, 
  DOUBLE_CLICK_WINDOW, 
  DRAG_THRESHOLD_SQ, 
  HIT_BOX 
} from './constants';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [uiUnits, setUiUnits] = useState<Unit[]>([]);
  const [showControls, setShowControls] = useState(false);
  
  const isDragging = useRef(false);
  const isPanning = useRef(false);
  const isFormationMode = useRef(false);
  const lastMousePos = useRef<Vector2>({ x: 0, y: 0 });
  const mouseDownPos = useRef<Vector2>({ x: 0, y: 0 });

  const lastClickTime = useRef<number>(0);
  const lastPickedId = useRef<string | null>(null);

  useEffect(() => {
    const engine = new GameEngine((units) => {
      setUiUnits(units);
    });
    engineRef.current = engine;

    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      engine.setRenderer(canvasRef.current);
    }

    engine.start();

    const syncInterval = setInterval(() => {
      engine.syncUI();
    }, UI_SYNC_INTERVAL);

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        engine.state.camera.x = window.innerWidth / 2;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === '8' || e.code === 'Numpad8') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      }

      if (key === 'o') {
        setShowControls(prev => !prev);
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      engine.stop();
      clearInterval(syncInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseDownPos.current = { x, y };

    if (e.button === 0) {
      isDragging.current = true;
      if (e.altKey) {
        isFormationMode.current = true;
        const gridPos = screenToGrid(x, y, engine.state.camera);
        engine.state.formationPath = [gridPos];
      } else {
        isFormationMode.current = false;
        engine.state.selectionRect = { start: { x, y }, end: { x, y } };
      }
    } else if (e.button === 1) {
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 2) {
      const gridPos = screenToGrid(x, y, engine.state.camera);
      const isShift = e.shiftKey;

      engine.state.entities.forEach(entity => {
        if (entity.render.selected && entity.path) {
          if (isShift) {
            if (!entity.path.target) {
              entity.path.target = { ...gridPos };
            } else {
              entity.path.waypoints.push({ ...gridPos });
            }
          } else {
            entity.path.target = { ...gridPos };
            entity.path.waypoints = [];
          }
          entity.render.animationState = 'walk';
        }
      });
      engine.state.moveIndicator = { pos: gridPos, time: engine.state.gameTime };
      engine.syncUI();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPanning.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      engine.state.camera.x += dx;
      engine.state.camera.y += dy;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }

    if (isDragging.current) {
      if (isFormationMode.current && engine.state.formationPath) {
        const currentGridPos = screenToGrid(x, y, engine.state.camera);
        if (e.shiftKey) {
          const last = engine.state.formationPath[engine.state.formationPath.length - 1];
          const distSq = (currentGridPos.x - last.x)**2 + (currentGridPos.y - last.y)**2;
          if (distSq > 0.04) {
            engine.state.formationPath.push(currentGridPos);
          }
        } else {
          engine.state.formationPath = [engine.state.formationPath[0], currentGridPos];
        }
      } else if (engine.state.selectionRect) {
        engine.state.selectionRect.end = { x, y };
        SelectionSystem(engine.state, gridToScreen, e.shiftKey);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    if (e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isFormationMode.current && engine.state.formationPath && engine.state.formationPath.length > 1) {
        const path = engine.state.formationPath;
        const selectedEntities: Entity[] = [];
        engine.state.entities.forEach(entity => {
          if (entity.render.selected) selectedEntities.push(entity);
        });

        if (selectedEntities.length > 0) {
          const n = selectedEntities.length;
          
          const segmentLengths: number[] = [];
          const cumulativeLengths: number[] = [0];
          let totalLength = 0;
          for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i+1].x - path[i].x;
            const dy = path[i+1].y - path[i].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            segmentLengths.push(len);
            totalLength += len;
            cumulativeLengths.push(totalLength);
          }

          const getPointAtDist = (d: number): Vector2 => {
            if (d <= 0) return { ...path[0] };
            if (d >= totalLength) return { ...path[path.length - 1] };
            for (let i = 0; i < segmentLengths.length; i++) {
              if (d <= cumulativeLengths[i + 1]) {
                const t = (d - cumulativeLengths[i]) / segmentLengths[i];
                return {
                  x: path[i].x + (path[i+1].x - path[i].x) * t,
                  y: path[i].y + (path[i+1].y - path[i].y) * t,
                };
              }
            }
            return { ...path[path.length - 1] };
          };

          const targetSlots: Vector2[] = [];
          for (let i = 0; i < n; i++) {
            const t = n > 1 ? i / (n - 1) : 0.5;
            targetSlots.push(getPointAtDist(t * totalLength));
          }

          const getClosestDistOnPath = (uPos: Vector2): number => {
            let minDistSq = Infinity;
            let closestDist = 0;
            for (let i = 0; i < segmentLengths.length; i++) {
              const p1 = path[i];
              const p2 = path[i+1];
              const l2 = segmentLengths[i] * segmentLengths[i];
              if (l2 === 0) continue;
              let t = ((uPos.x - p1.x) * (p2.x - p1.x) + (uPos.y - p1.y) * (p2.y - p1.y)) / l2;
              t = Math.max(0, Math.min(1, t));
              const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
              const dSq = (uPos.x - proj.x)**2 + (uPos.y - proj.y)**2;
              if (dSq < minDistSq) {
                minDistSq = dSq;
                closestDist = cumulativeLengths[i] + t * segmentLengths[i];
              }
            }
            return closestDist;
          };

          const sortedUnits = [...selectedEntities].sort((a, b) => getClosestDistOnPath(a.pos) - getClosestDistOnPath(b.pos));
          
          let distNormal = 0;
          let distReversed = 0;
          for (let i = 0; i < n; i++) {
            const dNormalX = sortedUnits[i].pos.x - targetSlots[i].x;
            const dNormalY = sortedUnits[i].pos.y - targetSlots[i].y;
            distNormal += dNormalX * dNormalX + dNormalY * dNormalY;

            const dRevX = sortedUnits[i].pos.x - targetSlots[n - 1 - i].x;
            const dRevY = sortedUnits[i].pos.y - targetSlots[n - 1 - i].y;
            distReversed += dRevX * dRevX + dRevY * dRevY;
          }

          const finalUnitOrder = distReversed < distNormal ? sortedUnits.reverse() : sortedUnits;
          const assignments = finalUnitOrder.map((unit, i) => ({ unit, slot: targetSlots[i] }));
          
          const getDistSq = (unit: Entity, slot: Vector2) => {
            const dx = unit.pos.x - slot.x;
            const dy = unit.pos.y - slot.y;
            return dx * dx + dy * dy;
          };

          for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < n - 1; i++) {
              const u1 = assignments[i].unit;
              const s1 = assignments[i].slot;
              const u2 = assignments[i+1].unit;
              const s2 = assignments[i+1].slot;

              const currentDist = getDistSq(u1, s1) + getDistSq(u2, s2);
              const swappedDist = getDistSq(u1, s2) + getDistSq(u2, s1);

              if (swappedDist < currentDist) {
                assignments[i].slot = s2;
                assignments[i+1].slot = s1;
              }
            }
          }

          assignments.forEach(({ unit, slot }) => {
            if (unit.path) {
              unit.path.target = slot;
              unit.path.waypoints = [];
              unit.render.animationState = 'walk';
            }
          });
        }
        engine.state.formationPath = null;
      } else if (engine.state.selectionRect) {
        const dragDistSq = Math.pow(x - mouseDownPos.current.x, 2) + Math.pow(y - mouseDownPos.current.y, 2);

        if (dragDistSq < DRAG_THRESHOLD_SQ) {
          let pickedId: string | null = null;
          let bestDistSq = 10000;

          engine.state.entities.forEach(entity => {
            const sPos = gridToScreen(entity.pos.x, entity.pos.y, engine.state.camera);
            const dx = x - sPos.x;
            const dy = y - sPos.y;

            if (Math.abs(dx) <= HIT_BOX.WIDTH && dy >= HIT_BOX.TOP && dy <= HIT_BOX.BOTTOM) {
              const dSq = dx * dx + Math.pow(dy + HIT_BOX.CENTER_OFFSET, 2);
              if (dSq < bestDistSq) {
                bestDistSq = dSq;
                pickedId = entity.id;
              }
            }
          });

          const now = Date.now();
          const isDoubleClick = (now - lastClickTime.current < DOUBLE_CLICK_WINDOW) && (pickedId === lastPickedId.current) && pickedId !== null;
          const isCtrlClick = (e.ctrlKey || e.metaKey) && pickedId !== null;

          if (isDoubleClick || isCtrlClick) {
            const pickedEntity = engine.state.entities.get(pickedId!);
            if (pickedEntity && pickedEntity.stats) {
              const targetType = pickedEntity.stats.type;
              engine.state.entities.forEach(entity => {
                if (entity.stats?.type === targetType) {
                  entity.render.selected = true;
                } else if (!e.shiftKey) {
                  entity.render.selected = false;
                }
              });
            }
          } else if (e.shiftKey) {
            if (pickedId) {
              const entity = engine.state.entities.get(pickedId);
              if (entity) entity.render.selected = !entity.render.selected;
            }
          } else {
            engine.state.entities.forEach(entity => {
              entity.render.selected = (entity.id === pickedId);
            });
          }
          lastClickTime.current = now;
          lastPickedId.current = pickedId;
        }
        engine.state.selectionRect = null;
      }

      isDragging.current = false;
      isFormationMode.current = false;
      engine.state.formationPath = null;
      engine.syncUI();
    }
    if (e.button === 1) isPanning.current = false;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
        className="w-full h-full cursor-crosshair"
      />
      <GameOverlay units={uiUnits} />
      
      {showControls && (
        <div className="absolute bottom-6 left-6 p-4 bg-black/80 border-2 border-purple-600 comic-border backdrop-blur-md rounded-lg pointer-events-none transition-opacity duration-300">
          <div className="grid grid-cols-1 gap-1 text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
             <div className="flex items-center gap-2"><span className="text-white bg-purple-600 px-1 font-black">LMB</span> DRAG TO SELECT SQUAD</div>
             <div className="flex items-center gap-2"><span className="text-white bg-purple-600 px-1 font-black">ALT + LMB</span> DRAW STRAIGHT FORMATION</div>
             <div className="flex items-center gap-2"><span className="text-white bg-purple-600 px-1 font-black">ALT + SHIFT + LMB</span> DRAW FREE-FORM FORMATION</div>
             <div className="flex items-center gap-2"><span className="text-white bg-purple-600 px-1 font-black">CTRL+LMB / DBL-CLICK</span> SELECT ALL OF TYPE</div>
             <div className="flex items-center gap-2"><span className="text-white bg-purple-600 px-1 font-black">SHIFT+LMB</span> ADD/TOGGLE SELECTION</div>
             <div className="flex items-center gap-2"><span className="text-white bg-purple-600 px-1 font-black">RMB</span> MOVE SELECTED TO GRID</div>
             <div className="flex items-center gap-2"><span className="text-white bg-purple-600 px-1 font-black">SHIFT+RMB</span> QUEUE COMMANDS</div>
             <div className="flex items-center gap-2"><span className="text-white bg-purple-600 px-1 font-black">MMB</span> PAN CAMERA VIEW</div>
             <div className="flex items-center gap-2"><span className="text-white bg-cyan-600 px-1 font-black">NUM8</span> TOGGLE FULLSCREEN</div>
             <div className="flex items-center gap-2"><span className="text-white bg-cyan-600 px-1 font-black">O</span> HIDE THIS MENU</div>
          </div>
        </div>
      )}
    </div>
  );
}
