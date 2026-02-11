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

    placePart(x, y, partId, level = 1) {
        if (!this.isValid(x, y)) return false;
        console.log(`Grid.placePart: placing ${partId} at ${x},${y} with level ${level}`);
        this.cells[y][x] = { partId: partId, level: level };
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

    upgradePart(x, y) {
        if (!this.isValid(x, y)) return false;
        const cell = this.cells[y][x];
        if (!cell) return false;

        cell.level = (cell.level || 1) + 1;
        return true;
    }

    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // --- Core Logic: Velocity Calculation ---
    getVelocity() {
        let totalVelocity = 0;
        let globalMultiplier = 1.0;

        // Apply Tech Global Multiplier
        if (this.game.tech) {
            globalMultiplier *= this.game.tech.getGlobalMultiplier();
        }

        // Pre-fetch tech values to avoid repeated lookups
        const engineMult = this.game.tech ? this.game.tech.getEngineMultiplier() : 1.0;
        const boosterBonus = this.game.tech ? this.game.tech.getBoosterSynergyBonus() : 0.0;

        // 1. Identification & Synergies
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[y][x];
                if (!cell) continue;

                const partDef = MasterData.parts[cell.partId];
                if (!partDef) continue;

                // Level Multiplier (e.g. +50% per level above 1? Or +10%? Linear)
                // Level 1 = x1.0
                // Level 2 = x1.5 (if factor is 0.5)
                // Let's go with +20% per extra level for now.
                const level = cell.level || 1;
                const levelMult = 1.0 + (level - 1) * 0.2;

                // --- Global Multipliers (Wheels) ---
                if (partDef.type === 'wheel') {
                    // Use defined effect value or default 0.1
                    const effectVal = partDef.effect ? partDef.effect.value : 0.1;
                    globalMultiplier += effectVal * levelMult;
                }

                // --- Base Velocity (Engines) ---
                if (partDef.type === 'engine') {
                    // Fix: Reset velocity for each engine
                    let velocity = partDef.baseVelocity * engineMult * levelMult;
                    let multiplier = 1.0;

                    // Check Neighbors
                    // Note: getNeighbors returns cell objects { partId, level }
                    const neighbors = this.getNeighbors(x, y);
                    for (const n of neighbors) {
                        const nPartDef = MasterData.parts[n.partId];

                        // Synergy logic
                        if (nPartDef) {
                            const nLevel = n.level || 1;
                            // Synergy scales with level (e.g. +10% effectiveness per level)
                            const synLevelMult = 1.0 + (nLevel - 1) * 0.1;

                            if (nPartDef.type === 'booster') {
                                // Base from data (plus tech) * level status
                                const baseVal = nPartDef.effect ? nPartDef.effect.value : 2.0;
                                multiplier *= (baseVal + boosterBonus) * synLevelMult;
                            }
                            if (nPartDef.type === 'frame') {
                                // Base from data * level status
                                const baseVal = nPartDef.effect ? nPartDef.effect.value : 1.2;
                                multiplier *= baseVal * synLevelMult;
                            }
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
