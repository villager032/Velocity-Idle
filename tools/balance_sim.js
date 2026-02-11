
// Mock MasterData based on js/data.js
const MasterData = {
    materials: [
        { id: 'scrap', name: 'Scrap' },
        { id: 'rubber', name: 'Rubber' },
        { id: 'circuit', name: 'Circuit' },
        { id: 'plasma', name: 'Plasma' },
        { id: 'antimatter', name: 'Antimatter' }
    ],
    parts: {
        'engine_basic': { id: 'engine_basic', type: 'engine', baseVelocity: 10, cost: { scrap: 10 }, unlockVelocity: 0 },
        'engine_v2': { id: 'engine_v2', type: 'engine', baseVelocity: 50, cost: { scrap: 200, rubber: 50 }, unlockVelocity: 50 },
        'engine_nuclear': { id: 'engine_nuclear', type: 'engine', baseVelocity: 250, cost: { circuit: 100, plasma: 50 }, unlockVelocity: 15000 },
        'wheel_basic': { id: 'wheel_basic', type: 'wheel', baseVelocity: 0, cost: { scrap: 5, rubber: 5 }, unlockVelocity: 0 },
        'wheel_race': { id: 'wheel_race', type: 'wheel', baseVelocity: 5, cost: { rubber: 100, scrap: 50 }, unlockVelocity: 200 },
        'frame_basic': { id: 'frame_basic', type: 'frame', baseVelocity: 0, cost: { scrap: 5 }, unlockVelocity: 0 },
        'frame_light': { id: 'frame_light', type: 'frame', baseVelocity: 0, cost: { scrap: 100, circuit: 10 }, unlockVelocity: 1000 },
        'frame_alien': { id: 'frame_alien', type: 'frame', baseVelocity: 0, cost: { plasma: 200, antimatter: 10 }, unlockVelocity: 50000 },
        'booster_basic': { id: 'booster_basic', type: 'booster', baseVelocity: 0, cost: { scrap: 50, circuit: 1 }, unlockVelocity: 100 },
        'booster_plasma': { id: 'booster_plasma', type: 'booster', baseVelocity: 0, cost: { circuit: 50, plasma: 10 }, unlockVelocity: 5000 },
        'booster_antimatter': { id: 'booster_antimatter', type: 'booster', baseVelocity: 0, cost: { antimatter: 50 }, unlockVelocity: 100000 }
    },
    areas: [
        { id: 'area_junkyard', threshold: 0, primaryDrop: 'scrap' },
        { id: 'area_highway', threshold: 100, primaryDrop: 'rubber' },
        { id: 'area_city', threshold: 2000, primaryDrop: 'circuit' },
        { id: 'area_space', threshold: 10000, primaryDrop: 'plasma' },
        { id: 'area_blackhole', threshold: 100000, primaryDrop: 'antimatter' }
    ]
};

// State
let state = {
    velocity: 0,
    maxVelocity: 0,
    resources: { scrap: 0, rubber: 0, circuit: 0, plasma: 0, antimatter: 0 },
    inventory: [], // Simplified: just count or simulate optimal grid
    grid: [], // We will simulate a simplified grid capacity
    time: 0 // Seconds
};

// Simulation Parameters
const GRID_SIZE = 100; // 10x10 slots

// Helper to calc cost
function getCost(partId, level) {
    const part = MasterData.parts[partId];
    const mult = Math.pow(1.5, level); // Standard 1.5 exp cost
    const cost = {};
    for (let k in part.cost) {
        cost[k] = Math.floor(part.cost[k] * mult); // Raw cost
        // Upgrade is 50% of this? No, code says Upgrade is 50% of scaled base.
        // Let's assume buying new parts mostly for expansion, upgrading for efficiency.
        // For simulation, let's just track "Buy Cost" for new parts.
        // Upgrade cost in UI code: amount * mult * 0.5.
    }
    return cost;
}

// Helper to check affordability
function canAfford(cost) {
    for (let k in cost) {
        if ((state.resources[k] || 0) < cost[k]) return false;
    }
    return true;
}

function pay(cost) {
    for (let k in cost) {
        state.resources[k] -= cost[k];
    }
}

// Logic to estimate velocity
// Assume player fills grid with optimal pattern.
// Early game: Engines + basic frames/wheels.
// Mid game: V2 Engines, Boosters.
// Late game: Nuclear, etc.
//
// To simplify complexity, we will track "Number of active engines" and "Average Level".
// Velocity ~= (NumEngines * BaseVel * UpgradeMult) * (GlobalMult)
//
// We will simulate a "Next Action" loop.
// Action: Buy best available part OR Upgrade existing parts.

let activeParts = []; // { id, level }

function calculateVelocity() {
    let vel = 0;
    let globalMult = 1.0;

    // Simplified calculation from Grid.js
    activeParts.forEach(p => {
        const def = MasterData.parts[p.id];
        let partVel = 0;
        const levelMult = 1.0 + (p.level - 1) * 0.2;

        if (def.type === 'engine') {
            partVel = def.baseVelocity * levelMult;
            // Assume 2 neighbors are boosters/frames on average (x2.0 or x1.2) for optimal play
            // Early game: just x1.0. 
            // Let's apply an "Efficiency Factor" that grows with unlocking parts.
            let efficiency = 1.0;
            if (state.maxVelocity > 100) efficiency = 1.5; // Boosters unlocked
            if (state.maxVelocity > 5000) efficiency = 3.0; // Plasma boosters / better layouts

            partVel *= efficiency;
            vel += partVel;
        }

        if (def.type === 'wheel') {
            globalMult += 0.1 * levelMult;
        }
    });

    return vel * globalMult;
}

// Main Simulation Loop
console.log("Starting Simulation...");

// Initial state
activeParts.push({ id: 'engine_basic', level: 1 });
activeParts.push({ id: 'wheel_basic', level: 1 });
activeParts.push({ id: 'frame_basic', level: 1 });

const dt = 1; // 1 second steps
let lastLogTime = 0;

while (state.time < 3600 * 20) { // Limit to 20 hours sim
    // 1. Calc Velocity
    state.velocity = calculateVelocity();
    if (state.velocity > state.maxVelocity) state.maxVelocity = state.velocity;

    // 2. Resources & Area Switching
    // Determine what we want to buy/upgrade (Best Engine)
    const unlockedParts = Object.values(MasterData.parts).filter(p => p.unlockVelocity <= state.maxVelocity);
    const bestEngine = unlockedParts.filter(p => p.type === 'engine').pop();

    // Check what resources we are missing for the Next Big Purchase (Best Engine)
    let missingRes = null;
    if (bestEngine) {
        // If we are replacing or filling
        // Just check costs
        for (let k in bestEngine.cost) {
            if ((state.resources[k] || 0) < bestEngine.cost[k]) {
                missingRes = k;
                break; // Found a bottleneck
            }
        }
    }

    // Default to highest unlocked area if no specific bottleneck (or if bottleneck is satisfied)
    // Actually, if we are missing a resource, find the area that drops it.
    let targetArea = MasterData.areas.slice().reverse().find(a => state.maxVelocity >= a.threshold); // Highest

    if (missingRes) {
        const areaForRes = MasterData.areas.find(a => a.primaryDrop === missingRes);
        if (areaForRes && state.maxVelocity >= areaForRes.threshold) {
            targetArea = areaForRes;
        }
    }

    // Generate
    // const currentArea = MasterData.areas.slice().reverse().find(a => state.maxVelocity >= a.threshold) || MasterData.areas[0];
    const dropRate = 0.5 * (1 + state.velocity * 0.002);
    state.resources[targetArea.primaryDrop] += dropRate * dt;

    // 3. Action: Buy/Upgrade
    // Priority:
    // 1. Unlock new parts (implicitly handled by checking what's available)
    // 2. Buy new Engine if slots available (<100)
    // 3. Upgrade existing parts if cheap

    // Find best "Buy" candidate that is unlocked
    // const unlockedParts = Object.values(MasterData.parts).filter(p => p.unlockVelocity <= state.maxVelocity);

    // Simple Strategy:
    // Always try to buy the highest tier Engine available
    // const bestEngine = unlockedParts.filter(p => p.type === 'engine').pop(); // Last one is usually best in list order?
    // Actually list order in data.js is convenient.

    // If we have less than X engines, buy more.
    let bought = false;

    // Replacement Logic: If full, consider replacing worst part
    if (activeParts.length >= GRID_SIZE) {
        // Find worst part (lowest base velocity)
        activeParts.sort((a, b) => MasterData.parts[a.id].baseVelocity - MasterData.parts[b.id].baseVelocity);
        const worst = activeParts[0];
        const worstDef = MasterData.parts[worst.id];

        // If best available engine is much better (e.g. > 2x base vel), replace
        if (bestEngine && bestEngine.baseVelocity > worstDef.baseVelocity * 1.5) {
            if (canAfford(bestEngine.cost)) {
                pay(bestEngine.cost);
                // Remove worst (simulating selling/trashing)
                activeParts.shift();
                // Add new
                activeParts.push({ id: bestEngine.id, level: 1 });
                bought = true;
                // console.log(`[Replaced] ${worst.id} -> ${bestEngine.id}`);
            }
        }
    } else {
        // Fill empty slots
        if (bestEngine && canAfford(bestEngine.cost)) {
            pay(bestEngine.cost);
            activeParts.push({ id: bestEngine.id, level: 1 });
            bought = true;
        }
    }

    // Also upgrade.
    if (!bought) {
        // Try to upgrade random part
        for (let i = 0; i < 10; i++) { // Try more times
            const p = activeParts[Math.floor(Math.random() * activeParts.length)];
            const def = MasterData.parts[p.id];
            const costMult = Math.pow(1.5, p.level);
            const upgradeCost = {};
            let affordable = true;
            for (let k in def.cost) {
                upgradeCost[k] = Math.floor(def.cost[k] * costMult * 0.5);
                if ((state.resources[k] || 0) < upgradeCost[k]) affordable = false;
            }

            if (affordable) {
                pay(upgradeCost);
                p.level++;
                bought = true;
                break;
            }
        }
    }

    // Log progress every hour (game time)
    if (state.time - lastLogTime >= 3600) {
        console.log(`[${(state.time / 3600).toFixed(0)}h] Vel: ${state.velocity.toFixed(0)} | Max: ${state.maxVelocity.toFixed(0)} | Parts: ${activeParts.length} (Best: ${bestEngine ? bestEngine.id : 'None'})`);
        lastLogTime = state.time;
    }

    // 4. Log Milestones
    MasterData.areas.forEach(a => {
        if (state.maxVelocity >= a.threshold && !a.reached) {
            a.reached = true;
            console.log(`[${(state.time / 3600).toFixed(2)}h] Reached ${a.id} (Vel: ${state.velocity.toFixed(0)})`);
        }
    });

    // Check End Goal
    if (state.maxVelocity >= 100000 && !state.won) {
        state.won = true;
        console.log(`[${(state.time / 3600).toFixed(2)}h] GOAL REACHED! (100,000 km/h)`);
        break;
    }

    state.time += dt;
}

if (!state.won) {
    console.log(`[TIMEOUT] Max Velocity after 20h: ${state.velocity.toFixed(0)}`);
}
