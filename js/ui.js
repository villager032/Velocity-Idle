import { MasterData } from './data.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // DOM Elements
        this.elResources = document.getElementById('resource-list');
        this.elShop = document.getElementById('recipe-list');
        this.elInventory = document.getElementById('inventory-grid');
        this.elGrid = document.getElementById('vehicle-grid');
        this.elVelocity = document.getElementById('velocity-display');
        this.elDistance = document.getElementById('distance-display');
        this.elAreaList = document.getElementById('area-list');
        this.elBg = document.getElementById('scrolling-bg');

        // Drag State
        this.draggedItem = null; // { source: 'inventory'|'grid', id: string, x?: int, y?: int }
    }

    init() {
        this.renderGrid();
        this.setupDragAndDrop();
        this.renderShop(); // Initial shop render
        this.renderInventory(); // Initial inventory render
        this.renderResources(); // Initial resources render
        this.renderAreas();
    }

    update(dt) {
        // Update Stats
        this.elVelocity.textContent = `${Math.floor(this.game.state.velocity)} km/h`;
        this.elDistance.textContent = `${Math.floor(this.game.state.distance)} m`;

        // Update Resources
        this.renderResources();

        // Animation Speed (Visual only)
        // Base speed 5s, faster as velocity increases
        const vel = this.game.state.velocity;
        let speed = 0;
        if (vel > 0) {
            // duration = base / factor. 
            // e.g., 100km/h -> 2s, 1000km/h -> 0.2s
            // let's clamp it to manageable visual speeds
            const duration = Math.max(0.1, 5 - (vel * 0.01));
            // Just moving background position might be smoother than changing animation-duration constantly
            // But CSS variable is easy
            if (vel > 0) {
                // We will update background-position-x manually for smoother control
                // This is better done in a visual loop, but style.animationDuration update is "okay" for simple idle
                // Let's rely on a CSS variable for speed multiplier? 
                // Or simple JS background scroll
                const currentPos = parseFloat(this.elBg.dataset.pos || 0);
                const move = dt * (vel * 0.5 + 10); // +10 for base movement
                const newPos = (currentPos + move) % 100; // %100 for percentage based visual? No, px is better.
                // Actually background-repeat
                // Let's just create a scrolling effect via JS 
                const px = (Date.now() * (vel * 0.0005 + 0.1)) % 100; // Hacky
                this.elBg.style.transform = `translateX(-${px}%)`;
            }
        }

        this.updateBackground(this.game.state.currentAreaId);
        this.renderAreas(); // Update active highlight
    }

    renderResources() {
        this.elResources.innerHTML = '';
        for (const [id, value] of Object.entries(this.game.state.resources)) {
            const mat = MasterData.materials.find(m => m.id === id);
            if (!mat) continue;

            const li = document.createElement('li');
            li.innerHTML = `<span class="label">${mat.name}</span><span class="value">${Math.floor(value)}</span>`;
            this.elResources.appendChild(li);
        }
    }

    // --- Visual Helper ---
    getPartVisual(partDef) {
        // Generate SVG based on type
        // Colors
        const colors = {
            'engine': '#ffaa00',
            'wheel': '#eeeeee',
            'frame': '#888888',
            'booster': '#00aaff'
        };

        let color = colors[partDef.type] || '#fff';
        // T3/V2 variations could shift hue or brightness (simple logic for now)
        if (partDef.id.includes('v2')) color = '#ff5500';
        if (partDef.id.includes('race')) color = '#ffcc00';
        if (partDef.id.includes('plasma')) color = '#00ffff';
        if (partDef.id.includes('light')) color = '#aaaaaa';

        let content = '';

        if (partDef.type === 'engine') {
            content = `
                <rect x="10" y="10" width="30" height="30" rx="4" fill="${color}" stroke="none"/>
                <circle cx="25" cy="25" r="8" fill="rgba(0,0,0,0.3)"/>
                <rect x="23" y="10" width="4" height="30" fill="rgba(0,0,0,0.3)"/>
            `;
        } else if (partDef.type === 'wheel') {
            content = `
                <circle cx="25" cy="25" r="18" fill="none" stroke="${color}" stroke-width="4"/>
                <circle cx="25" cy="25" r="6" fill="${color}"/>
                <line x1="25" y1="7" x2="25" y2="43" stroke="${color}" stroke-width="2"/>
                <line x1="7" y1="25" x2="43" y2="25" stroke="${color}" stroke-width="2"/>
            `;
        } else if (partDef.type === 'frame') {
            content = `
                <rect x="5" y="20" width="40" height="10" fill="${color}"/>
                <rect x="20" y="5" width="10" height="40" fill="${color}"/>
                <circle cx="25" cy="25" r="3" fill="#000"/>
            `;
        } else if (partDef.type === 'booster') {
            content = `
                <path d="M10 40 L25 10 L40 40 L25 30 Z" fill="${color}"/>
            `;
        }

        return `<svg viewBox="0 0 50 50" width="100%" height="100%">${content}</svg>`;
    }

    renderShop() {
        this.elShop.innerHTML = '';

        const unlockedParts = Object.values(MasterData.parts).filter(p => this.game.state.unlocks.includes(p.id));

        unlockedParts.forEach(part => {
            const btn = document.createElement('div');
            btn.className = 'item-btn';
            btn.innerHTML = `
                <div class="header">${part.name}</div>
                <div class="cost">Cost: ${Object.entries(part.cost).map(([k, v]) => `${k}:${v}`).join(', ')}</div>
            `;
            btn.onclick = () => this.game.buyPart(part.id);
            this.elShop.appendChild(btn);
        });
    }

    renderInventory() {
        // Since we don't have a rigid inventory array in Game state yet (just infinite storage implicitly?), 
        // let's assume `game.state.inventory` exists or we just maintain a simple list.
        // Wait, `js/game.js` defined `unlocks` but not `inventory` array.
        // Let's Add `inventory` to Game state dynamically or just fix Game.js later.
        // For MVP, lets assume `game.state.inventory` is a list of Part IDs.

        if (!this.game.state.inventory) this.game.state.inventory = [];

        this.elInventory.innerHTML = '';
        this.game.state.inventory.forEach((partId, index) => {
            const div = document.createElement('div');
            div.className = 'part-item';
            div.innerHTML = this.getPartVisual(MasterData.parts[partId]);
            div.draggable = true;
            div.dataset.role = 'inventory';
            div.dataset.index = index;
            div.dataset.partId = partId;

            div.ondragstart = (e) => this.handleDragStart(e, { source: 'inventory', index, partId });

            this.elInventory.appendChild(div);
        });
    }

    // Call this when inventory changes
    addInventoryItem(partId) {
        if (!this.game.state.inventory) this.game.state.inventory = [];
        this.game.state.inventory.push(partId);
        this.renderInventory();
    }

    renderGrid() {
        this.elGrid.innerHTML = '';
        for (let y = 0; y < this.game.grid.height; y++) {
            for (let x = 0; x < this.game.grid.width; x++) {
                const cellDiv = document.createElement('div');
                cellDiv.className = 'grid-cell';
                cellDiv.dataset.x = x;
                cellDiv.dataset.y = y;

                const cellData = this.game.grid.getPartAt(x, y);
                if (cellData) {
                    const partDef = MasterData.parts[cellData.partId];
                    const partDiv = document.createElement('div');
                    partDiv.className = 'part';
                    partDiv.innerHTML = this.getPartVisual(partDef);
                    partDiv.dataset.type = partDef.type;
                    partDiv.draggable = true;

                    partDiv.ondragstart = (e) => {
                        e.stopPropagation(); // Don't drag cell
                        this.handleDragStart(e, { source: 'grid', x, y, partId: cellData.partId });
                    };

                    cellDiv.appendChild(partDiv);
                }

                // Drop Events
                cellDiv.ondragover = (e) => {
                    e.preventDefault();
                    cellDiv.classList.add('drag-over');
                };
                cellDiv.ondragleave = () => cellDiv.classList.remove('drag-over');
                cellDiv.ondrop = (e) => this.handleDrop(e, x, y);

                // Right Click to Remove
                cellDiv.oncontextmenu = (e) => {
                    e.preventDefault();
                    if (this.game.grid.getPartAt(x, y)) {
                        const partId = this.game.grid.getPartAt(x, y).partId;
                        this.game.grid.removePart(x, y);
                        this.addInventoryItem(partId);
                        this.renderGrid(); // Re-render self
                    }
                };

                this.elGrid.appendChild(cellDiv);
            }
        }
    }

    renderAreas() {
        this.elAreaList.innerHTML = '';
        MasterData.areas.forEach(area => {
            const div = document.createElement('div');
            div.className = 'area-item';

            // Check Unlock
            const isUnlocked = this.game.state.maxVelocity >= area.threshold;

            if (area.id === this.game.state.currentAreaId) {
                div.classList.add('active');
                div.innerHTML = `<div class="name">[ACTIVE] ${area.name}</div>`;
            } else if (isUnlocked) {
                div.classList.add('unlocked');
                div.innerHTML = `<div class="name">${area.name}</div>`;
                div.onclick = () => {
                    this.game.state.currentAreaId = area.id;
                    this.renderAreas(); // Update highlight
                };
            } else {
                div.classList.add('locked');
                div.innerHTML = `<div class="name">???</div><div class="info">Req: ${area.threshold} km/h</div>`;
            }

            this.elAreaList.appendChild(div);
        });
    }

    // --- Drag & Drop ---
    setupDragAndDrop() {
        // Inventory drop zone
        this.elInventory.ondragover = (e) => {
            e.preventDefault();
            this.elInventory.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
        };
        this.elInventory.ondragleave = () => {
            this.elInventory.style.backgroundColor = 'rgba(0,0,0,0.2)';
        };
        this.elInventory.ondrop = (e) => {
            e.preventDefault();
            this.elInventory.style.backgroundColor = 'rgba(0,0,0,0.2)';
            if (!this.draggedItem) return;

            // If dragging from Grid to Inventory
            if (this.draggedItem.source === 'grid') {
                const { x, y, partId } = this.draggedItem;
                this.game.grid.removePart(x, y);
                this.addInventoryItem(partId);
                this.renderGrid();
                this.draggedItem = null;
            }
        };
    }

    updateBackground(areaId) {
        if (this._lastAreaId === areaId) return;
        this._lastAreaId = areaId;

        const area = MasterData.areas.find(a => a.id === areaId);
        if (area && area.bgGradient) {
            this.elBg.style.background = area.bgGradient;
            this.elBg.style.backgroundSize = '50px 100%'; // Maintain grid effect
        }
    }

    handleDragStart(e, data) {
        this.draggedItem = data;
        e.dataTransfer.effectAllowed = 'move';
        // Setting data just in case
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
    }

    handleDrop(e, x, y) {
        e.preventDefault();
        const targetCell = e.target.closest('.grid-cell');
        if (targetCell) targetCell.classList.remove('drag-over');

        if (!this.draggedItem) return;

        // Logic:
        // 1. If dragging from Inventory:
        //    - Place in Grid (if empty).
        //    - If Grid has item, swap? Or fail.
        //    - Remove from Inventory logic.

        // 2. If dragging from Grid:
        //    - Move to new slot.
        //    - Update Grid data.

        const { source, index, partId, x: srcX, y: srcY } = this.draggedItem;

        if (source === 'inventory') {
            // Check if slot empty
            if (this.game.grid.getPartAt(x, y)) {
                // Swap or block? Block for MVP
                console.log("Slot occupied");
                return;
            }

            // Place
            this.game.grid.placePart(x, y, partId);
            // Remove from inventory
            this.game.state.inventory.splice(index, 1);

            this.renderInventory();
            this.renderGrid();
        } else if (source === 'grid') {
            // Move within grid
            const existing = this.game.grid.getPartAt(x, y);

            // Remove from source
            this.game.grid.removePart(srcX, srcY);

            if (existing) {
                // Swap: Put existing to source
                this.game.grid.placePart(srcX, srcY, existing.partId);
            }

            // Place dragged to target
            this.game.grid.placePart(x, y, partId);

            this.renderGrid();
        }

        this.draggedItem = null;
    }
}
