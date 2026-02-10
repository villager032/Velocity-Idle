import { MasterData } from './data.js';

export class Grid {
    constructor(game) {
        this.game = game;
        this.width = 10;
        this.height = 10;
        this.cells = []; // 2D Array: [y][x] = { partId: string | null }
    }

    init() {
        // Initialize Empty Grid
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(null);
            }
            this.cells.push(row);
        }
    }

    placePart(x, y, partId) {
        if (!this.isValid(x, y)) return false;
        this.cells[y][x] = { partId: partId };
        return true;
    }

    removePart(x, y) {
        if (!this.isValid(x, y)) return false;
        this.cells[y][x] = null;
        return true;
    }

    getPartAt(x, y) {
        if (!this.isValid(x, y)) return null;
        return this.cells[y][x];
    }

    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // --- Core Logic: Velocity Calculation ---
    getVelocity() {
        let totalVelocity = 0;
        let globalMultiplier = 1.0;

        // 1. Identification & Synergies
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                if (!cell) continue;

                const partDef = MasterData.parts[cell.partId];
                if (!partDef) continue;

                // --- Global Multipliers (Wheels) ---
                if (partDef.type === 'wheel') {
                    // Example: Each wheel adds +10% to total velocity
                    globalMultiplier += 0.1;
                }

                // --- Base Velocity (Engines) ---
                if (partDef.type === 'engine') {
                    let velocity = partDef.baseVelocity;
                    let multiplier = 1.0;

                    // Check Neighbors
                    const neighbors = this.getNeighbors(x, y);
                    for (const n of neighbors) {
                        const nPartDef = MasterData.parts[n.partId];

                        // Synergy: Booster x2.0
                        if (nPartDef.type === 'booster') {
                            multiplier *= 2.0;
                        }
                        // Synergy: Frame x1.2 (Stability support)
                        if (nPartDef.type === 'frame') {
                            multiplier *= 1.2;
                        }
                    }

                    totalVelocity += velocity * multiplier;
                }
            }
        }

        // Apply Global Multiplier
        return totalVelocity * globalMultiplier;
    }

    getNeighbors(x, y) {
        const neighbors = [];
        const dirs = [
            { dx: 0, dy: -1 }, // Up
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }, // Left
            { dx: 1, dy: 0 }   // Right
        ];

        for (const dir of dirs) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            if (this.isValid(nx, ny) && this.cells[ny][nx]) {
                neighbors.push(this.cells[ny][nx]);
            }
        }
        return neighbors;
    }

    // --- Persistence ---
    exportState() {
        return this.cells;
    }

    importState(data) {
        if (!data) return;
        this.cells = data;
    }
}
