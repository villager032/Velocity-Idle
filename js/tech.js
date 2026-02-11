import { MasterData } from './data.js';

export class TechManager {
    constructor(game) {
        this.game = game;
        // Ensure state exists
        if (!this.game.state.researched) {
            this.game.state.researched = [];
        }
    }

    // --- Research Logic ---
    canResearch(techId) {
        if (this.game.state.researched.includes(techId)) return false; // Already researched

        const tech = MasterData.techs[techId];
        if (!tech) return false;

        // Check prerequisites
        if (tech.req && tech.req.length > 0) {
            for (const reqId of tech.req) {
                if (!this.game.state.researched.includes(reqId)) return false;
            }
        }

        // Check cost
        for (const [resId, cost] of Object.entries(tech.cost)) {
            if ((this.game.state.resources[resId] || 0) < cost) return false;
        }

        return true;
    }

    doResearch(techId) {
        if (!this.canResearch(techId)) return false;

        const tech = MasterData.techs[techId];

        // Consume resources
        for (const [resId, cost] of Object.entries(tech.cost)) {
            this.game.state.resources[resId] -= cost;
        }

        // Add to researched list
        this.game.state.researched.push(techId);

        // Notify UI (if necessary, or handled by update loop)
        // Ideally, UIManager should update the tech list
        return true;
    }

    // --- Effect Helpers ---
    // These will be called by Grid or Game classes to apply value modifiers

    getEngineMultiplier() {
        let mult = 1.0;
        this.game.state.researched.forEach(techId => {
            const tech = MasterData.techs[techId];
            if (tech.effect && tech.effect.type === 'engine_mult') {
                mult *= tech.effect.value;
            }
        });
        return mult;
    }

    getBoosterSynergyBonus() {
        let bonus = 0.0;
        this.game.state.researched.forEach(techId => {
            const tech = MasterData.techs[techId];
            if (tech.effect && tech.effect.type === 'booster_buff') {
                bonus += tech.effect.value;
            }
        });
        return bonus;
    }

    getGlobalMultiplier() {
        let mult = 1.0;
        this.game.state.researched.forEach(techId => {
            const tech = MasterData.techs[techId];
            if (tech.effect && tech.effect.type === 'global_mult') {
                mult *= tech.effect.value;
            }
        });
        return mult;
    }

    getCostMultiplier(partId) {
        let mult = 1.0;
        this.game.state.researched.forEach(techId => {
            const tech = MasterData.techs[techId];
            if (tech.effect && tech.effect.type === 'cost_reduc' && tech.effect.target === partId) {
                mult *= tech.effect.value;
            }
        });
        return mult;
    }
}
