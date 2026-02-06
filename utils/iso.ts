
import { Vector2 } from '../types';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants';

/**
 * Converts grid coordinates to screen coordinates
 */
export const gridToScreen = (gridX: number, gridY: number, cameraX: number, cameraY: number): Vector2 => {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2) + cameraX,
    y: (gridX + gridY) * (TILE_HEIGHT / 2) + cameraY
  };
};

/**
 * Converts screen coordinates to grid coordinates
 */
export const screenToGrid = (screenX: number, screenY: number, cameraX: number, cameraY: number): Vector2 => {
  const dx = screenX - cameraX;
  const dy = screenY - cameraY;
  
  const gridX = (dx / (TILE_WIDTH / 2) + dy / (TILE_HEIGHT / 2)) / 2;
  const gridY = (dy / (TILE_HEIGHT / 2) - dx / (TILE_WIDTH / 2)) / 2;
  
  return { x: gridX, y: gridY };
};

export const getFacing = (current: Vector2, target: Vector2): any => {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  if (angle > -22.5 && angle <= 22.5) return 'E';
  if (angle > 22.5 && angle <= 67.5) return 'SE';
  if (angle > 67.5 && angle <= 112.5) return 'S';
  if (angle > 112.5 && angle <= 157.5) return 'SW';
  if (angle > 157.5 || angle <= -157.5) return 'W';
  if (angle > -157.5 && angle <= -112.5) return 'NW';
  if (angle > -112.5 && angle <= -67.5) return 'N';
  if (angle > -67.5 && angle <= -22.5) return 'NE';
  return 'E';
};
