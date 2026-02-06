
import { Vector2, Direction } from './types';
import { TILE_WIDTH, TILE_HEIGHT } from './constants';

export const gridToScreen = (gridX: number, gridY: number, camera: Vector2): Vector2 => {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2) + camera.x,
    // Add half tile height to shift the reference point from the top corner to the center of the diamond
    y: (gridX + gridY) * (TILE_HEIGHT / 2) + camera.y + (TILE_HEIGHT / 2)
  };
};

export const screenToGrid = (screenX: number, screenY: number, camera: Vector2): Vector2 => {
  const dx = screenX - camera.x;
  // Subtract half tile height to compensate for the center-offset in gridToScreen
  const dy = screenY - camera.y - (TILE_HEIGHT / 2);
  const gridX = (dx / (TILE_WIDTH / 2) + dy / (TILE_HEIGHT / 2)) / 2;
  const gridY = (dy / (TILE_HEIGHT / 2) - dx / (TILE_WIDTH / 2)) / 2;
  return { x: gridX, y: gridY };
};

/**
 * Calculates visual direction based on grid movement.
 * In isometric view:
 * +X grid = SE visually
 * +Y grid = SW visually
 * -X grid = NW visually
 * -Y grid = NE visually
 */
export const getDirection = (from: Vector2, to: Vector2): Direction => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // atan2(dy, dx) returns angle in radians
  // Pure +X: 0 deg
  // Pure +Y: 90 deg
  // Pure -X: 180 deg
  // Pure -Y: -90 deg
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Mapping based on the isometric orientation logic
  if (angle > -22.5 && angle <= 22.5) return 'SE';   // +X
  if (angle > 22.5 && angle <= 67.5) return 'S';    // +X, +Y
  if (angle > 67.5 && angle <= 112.5) return 'SW';  // +Y
  if (angle > 112.5 && angle <= 157.5) return 'W';   // -X, +Y
  if (angle > 157.5 || angle <= -157.5) return 'NW'; // -X
  if (angle > -157.5 && angle <= -112.5) return 'N'; // -X, -Y
  if (angle > -112.5 && angle <= -67.5) return 'NE'; // -Y
  if (angle > -67.5 && angle <= -22.5) return 'E';   // +X, -Y
  
  return 'S';
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
