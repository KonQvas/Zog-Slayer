
import { Vector2 } from './types';

export class SpatialGrid<T = string> {
  private cellSize: number;
  private grid: Map<number, T[]>;

  constructor(cellSize: number = 2) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * Generates a unique integer key for a grid cell using bit-shifting.
   */
  public getKey(x: number, y: number): number {
    const gx = (x / this.cellSize) | 0;
    const gy = (y / this.cellSize) | 0;
    return ((gx + 1000) << 16) | (gy + 1000);
  }

  clear() {
    this.grid.clear();
  }

  insert(x: number, y: number, value: T) {
    this.insertWithKey(this.getKey(x, y), value);
  }

  insertWithKey(key: number, value: T) {
    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    cell.push(value);
  }

  removeByKey(key: number, value: T) {
    const cell = this.grid.get(key);
    if (cell) {
      const idx = cell.indexOf(value);
      if (idx !== -1) {
        if (cell.length === 1) {
          this.grid.delete(key);
        } else {
          cell[idx] = cell[cell.length - 1];
          cell.pop();
        }
      }
    }
  }

  /**
   * Efficiently queries all entities within a rectangular grid area.
   * Perfect for viewport culling.
   */
  queryBox(minX: number, minY: number, maxX: number, maxY: number): T[] {
    const results: T[] = [];
    const startX = (minX / this.cellSize) | 0;
    const endX = (maxX / this.cellSize) | 0;
    const startY = (minY / this.cellSize) | 0;
    const endY = (maxY / this.cellSize) | 0;

    for (let x = startX; x <= endX; x++) {
      const offsetX = (x + 1000) << 16;
      for (let y = startY; y <= endY; y++) {
        const key = offsetX | (y + 1000);
        const values = this.grid.get(key);
        if (values) {
          for (let i = 0; i < values.length; i++) {
            results.push(values[i]);
          }
        }
      }
    }
    return results;
  }

  queryRadius(pos: Vector2, radius: number): T[] {
    return this.queryBox(pos.x - radius, pos.y - radius, pos.x + radius, pos.y + radius);
  }
}
