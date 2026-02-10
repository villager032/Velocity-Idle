import { Grid } from './grid.js';
import { UIManager } from './ui.js';
import { MasterData } from './data.js';

export class Game {
    constructor() {
        this.lastTime = 0;
        this.accumulatedTime = 0;

        // Game State
        this.state = {
            velocity: 0, // km/h (internal unit might be m/s)
            distance: 0, // meters
            resources: { scrap: 0, rubber: 0, circuit: 0 }, // { materialId: amount }
            unlocks: [], // [recipeId]
            currentAreaId: 'area_junkyard',
            inventory: ['engine_basic', 'wheel_basic', 'frame_basic'] // Start with some parts
        };

        // Initialize Systems
        this.grid = new Grid(this);
        this.ui = new UIManager(this);

        // Initialize Resources
        MasterData.materials.forEach(mat => {
            this.state.resources[mat.id] = 0;
        });

        // Initial Unlocks (Debug/Start)
        this.state.unlocks.push('engine_basic', 'wheel_basic', 'frame_basic', 'booster_basic');
    }

    init() {
        console.log("Velocity Idle Initialized");

        this.grid.init();

        // Try to load
        if (!this.load()) {
            console.log("No save found, starting new game.");
        }

        this.ui.init();

        // Start Loop
        requestAnimationFrame((ts) => this.loop(ts));

        // Auto Save Interval (every 10 seconds)
        setInterval(() => this.save(), 10000);
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = (timestamp - this.lastTime) / 1000; // Seconds
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.ui.update(deltaTime);

        requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt) {
        // 1. Calculate Velocity from Grid
        // (Optimization: Only recalc when grid changes, but for now we pull it)
        const currentVelocity = this.grid.getVelocity(); // Units/sec
        this.state.velocity = currentVelocity;

        // 2. Update Distance
        // velocity is "distance per second"
        this.state.distance += this.state.velocity * dt;

        // 3. Resource Generation
        if (this.state.velocity > 0) {
            const area = MasterData.areas.find(a => a.id === this.state.currentAreaId);
            if (area) {
                const dropRate = 0.5; // Base per second
                const amount = dropRate * (1 + this.state.velocity * 0.01) * dt;

                this.state.resources[area.primaryDrop] += amount;
            }
        }

        // 4. Check Area Progression
        // Update Area based on Max Velocity reached or current velocity? 
        // Design doc says "Accumulated distance increases, and if current velocity > threshold..."
        // Let's stick to Velocity Threshold for switching areas for now.
        const nextArea = MasterData.areas.slice().reverse().find(a => this.state.velocity >= a.threshold);
        if (nextArea && this.state.currentAreaId !== nextArea.id) {
            this.state.currentAreaId = nextArea.id;
        }

        this.checkUnlocks();
    }

    checkUnlocks() {
        const currentVel = this.state.velocity;
        // Optimization: Could check maxVelocity if we tracked it, but checking all parts against currentVel is fine for small list.

        Object.values(MasterData.parts).forEach(part => {
            if (part.unlockVelocity <= currentVel) {
                if (!this.state.unlocks.includes(part.id)) {
                    this.state.unlocks.push(part.id);
                    // Notify UI to update shop
                    this.ui.renderShop(); // A bit expensive to call every frame inside loop if many unlocks happen, but safe for now.
                    // Better: UI updates in its own loop based on state diff, or we enable a flag.
                    // For now, let's just push. calling renderShop() here might be overkill if it happens every frame.
                    // Actually, if it's already in unlocks, we don't enter here. So it only runs ONCE per unlock. Safe.
                }
            }
        });
    }

    buyPart(partId) {
        const partDef = MasterData.parts[partId];
        if (!partDef) return;

        // Check Cost
        for (const [resId, cost] of Object.entries(partDef.cost)) {
            if (this.state.resources[resId] < cost) {
                console.log("Not enough resources");
                return;
            }
        }

        // Deduct Resources
        for (const [resId, cost] of Object.entries(partDef.cost)) {
            this.state.resources[resId] -= cost;
        }

        // Add to Inventory
        this.ui.addInventoryItem(partId);
    }

    // --- Persistence ---
    save() {
        const saveData = {
            state: this.state,
            grid: this.grid.exportState(),
            timestamp: Date.now()
        };
        localStorage.setItem('velocityIdleSave', JSON.stringify(saveData));
    }

    load() {
        const saveString = localStorage.getItem('velocityIdleSave');
        if (!saveString) return false;

        try {
            const saveData = JSON.parse(saveString);

            // Merge state (to keep structure if we add new fields later)
            this.state = { ...this.state, ...saveData.state };

            // Load Grid
            this.grid.importState(saveData.grid);

            console.log("Save Loaded");
            return true;
        } catch (e) {
            console.error("Failed to load save", e);
            return false;
        }
    }
}
