import { MasterData } from './data.js';
import { Translations } from './loc.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // DOM Elements
        this.elResources = document.getElementById('resource-list');
        this.elShop = document.getElementById('recipe-list');
        this.elInventory = document.getElementById('inventory-grid');
        this.elGrid = document.getElementById('vehicle-grid');
        this.elVelocity = document.getElementById('velocity-display');

        this.elAreaList = document.getElementById('area-list');
        this.elBg = document.getElementById('scrolling-bg');

        // Tabs
        this.elTabShop = document.getElementById('btn-tab-shop');
        this.elTabTech = document.getElementById('btn-tab-tech');
        this.elContentShop = document.getElementById('tab-shop');
        this.elContentTech = document.getElementById('tab-tech');
        this.elTechList = document.getElementById('tech-list');

        // Selection
        this.elSelectionPanel = document.getElementById('selection-panel');
        this.elSelName = document.getElementById('sel-name');
        this.elSelLevel = document.getElementById('sel-level');
        this.btnUpgrade = document.getElementById('btn-upgrade');
        this.btnDeselect = document.getElementById('btn-deselect');

        // State
        this.draggedItem = null; // { source: 'inventory'|'grid', id: string, x?: int, y?: int }
        this.selectedCell = null; // { x, y }
        this.lang = 'ja'; // Default
    }

    init() {
        this.renderGrid();
        this.setupDragAndDrop();
        this.setupTabs();
        this.setupSelection();
        this.renderShop(); // Initial shop render
        this.renderInventory(); // Initial inventory render
        this.renderResources(); // Initial resources render
        this.renderTech(); // Initial tech render
        this.initAreas();
        this.setupSettings();
        this.updateTexts();
    }

    setupSettings() {
        const modal = document.getElementById('settings-modal');
        const btnOpen = document.getElementById('btn-settings-open');
        const btnClose = document.getElementById('btn-settings-close');
        const btnLang = document.getElementById('btn-lang-toggle');
        const btnReset = document.getElementById('btn-reset');

        if (btnOpen) {
            btnOpen.onclick = () => {
                if (modal.classList.contains('hidden')) {
                    modal.classList.remove('hidden');
                } else {
                    modal.classList.add('hidden');
                }
            };
        }
        if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');

        if (btnLang) {
            btnLang.onclick = () => {
                const newLang = this.lang === 'en' ? 'ja' : 'en';
                this.setLanguage(newLang);
            };
        }

        if (btnReset) {
            btnReset.onclick = () => {
                const confirmMsg = this.getText('msg_reset_confirm');
                if (window.confirm(confirmMsg)) {
                    localStorage.removeItem('velocityIdleSave');
                    alert(this.getText('msg_reset_done'));
                    location.reload();
                }
            };
        }
    }

    // Removed old setupLanguage as it is now part of setupSettings
    // setupLanguage() { ... }

    setLanguage(lang) {
        this.lang = lang;
        this.updateTexts();
        this.renderShop();
        this.renderTech();
        this.renderResources();
        this.renderSelection();
        this.updateAreas(true); // Force update
    }

    getText(keyOrObj, args = {}) {
        if (!keyOrObj) return '';

        // Case 1: MasterData object { en: '...', ja: '...' }
        if (typeof keyOrObj === 'object' && keyOrObj[this.lang]) {
            return keyOrObj[this.lang];
        }

        // Case 2: Translation Key String
        if (typeof keyOrObj === 'string') {
            const dict = Translations[this.lang];
            let val = dict[keyOrObj] || keyOrObj;

            // Replace args {cost: 100} -> "Cost: 100"
            for (const [k, v] of Object.entries(args)) {
                val = val.replace(`{${k}}`, v);
            }
            return val;
        }

        return String(keyOrObj);
    }

    updateTexts() {
        // Update data-i18n elements
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = this.getText(key);
        });
    }

    setupSelection() {
        this.btnDeselect.onclick = () => this.deselectCell();
        this.btnUpgrade.onclick = () => this.upgradeSelectedPart();
    }

    selectCell(x, y) {
        if (!this.game.grid.getPartAt(x, y)) {
            this.deselectCell();
            return;
        }
        this.selectedCell = { x, y };
        this.renderSelection();
        this.renderGrid(); // To show highlight
    }

    deselectCell() {
        this.selectedCell = null;
        this.elSelectionPanel.classList.add('hidden');
        this.renderGrid(); // To remove highlight
    }

    renderSelection() {
        if (!this.selectedCell) return;

        const cell = this.game.grid.getPartAt(this.selectedCell.x, this.selectedCell.y);
        if (!cell) {
            this.deselectCell();
            return;
        }

        const partDef = MasterData.parts[cell.partId];
        const level = cell.level || 1;

        // Calculate upgrade cost
        // Formula: Base Cost * (1.5 ^ level)
        // Simple linear for now? No, exponential is better for idle.
        const costMultiplier = Math.pow(1.5, level);
        const upgradeCost = {};
        let canAfford = true;

        for (const [res, amount] of Object.entries(partDef.cost)) {
            upgradeCost[res] = Math.floor(amount * costMultiplier * 0.5); // 50% of scaled base cost
            if ((this.game.state.resources[res] || 0) < upgradeCost[res]) {
                canAfford = false;
            }
        }

        this.elSelName.textContent = this.getText(partDef.name);
        this.elSelLevel.textContent = `Lv.${level} -> Lv.${level + 1}`;

        // Preview Stats
        const currentStats = this.getPartStats(partDef, level);
        const nextStats = this.getPartStats(partDef, level + 1);

        let statHtml = '';
        if (currentStats.baseVelocity) {
            statHtml += `<div>${this.getText('lbl_base_vel')}: ${currentStats.baseVelocity.toFixed(1)} -> <span class="highlight">${nextStats.baseVelocity.toFixed(1)}</span></div>`;
        }
        if (currentStats.globalMult) {
            statHtml += `<div>${this.getText('lbl_global_buff')}: +${(currentStats.globalMult * 100).toFixed(0)}% -> <span class="highlight">+${(nextStats.globalMult * 100).toFixed(0)}%</span></div>`;
        }
        if (currentStats.boosterMult) {
            statHtml += `<div>${this.getText('lbl_adj_buff')}: x${currentStats.boosterMult.toFixed(2)} -> <span class="highlight">x${nextStats.boosterMult.toFixed(2)}</span></div>`;
        }
        if (currentStats.frameMult) {
            statHtml += `<div>${this.getText('lbl_adj_buff')}: x${currentStats.frameMult.toFixed(2)} -> <span class="highlight">x${nextStats.frameMult.toFixed(2)}</span></div>`;
        }

        // Insert stat preview before upgrade button
        let previewDiv = document.getElementById('upgrade-preview');
        if (!previewDiv) {
            previewDiv = document.createElement('div');
            previewDiv.id = 'upgrade-preview';
            previewDiv.className = 'upgrade-stats';
            this.btnUpgrade.parentNode.insertBefore(previewDiv, this.btnUpgrade);
        }
        previewDiv.innerHTML = statHtml;


        const costStr = Object.entries(upgradeCost).map(([k, v]) => `${this.getText(MasterData.materials.find(m => m.id === k).name)}:${v}`).join(', ');
        const btnText = this.getText('msg_upgrade', { cost: costStr });
        this.btnUpgrade.textContent = btnText;

        this.elSelectionPanel.classList.remove('hidden');

        // Initial state update
        this.updateSelectionState();
    }

    upgradeSelectedPart() {
        if (!this.selectedCell) return;
        const cell = this.game.grid.getPartAt(this.selectedCell.x, this.selectedCell.y);
        if (!cell) return;

        const partDef = MasterData.parts[cell.partId];
        const level = cell.level || 1;
        const costMultiplier = Math.pow(1.5, level);
        const upgradeCost = {};

        // Check affordability again
        for (const [res, amount] of Object.entries(partDef.cost)) {
            upgradeCost[res] = Math.floor(amount * costMultiplier * 0.5);
            if ((this.game.state.resources[res] || 0) < upgradeCost[res]) return;
        }

        // Pay
        for (const [res, amount] of Object.entries(upgradeCost)) {
            this.game.state.resources[res] -= amount;
        }

        // Upgrade
        this.game.grid.upgradePart(this.selectedCell.x, this.selectedCell.y);

        this.renderSelection(); // Update cost
        this.renderGrid(); // Update badge
        this.renderResources();
    }

    showEnding(accumulatedTime) {
        // Create Modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.width = '400px';
        modal.style.zIndex = '3000';
        modal.style.textAlign = 'center';
        modal.style.display = 'block';

        // Format Time
        const totalSeconds = Math.floor(accumulatedTime);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        modal.innerHTML = `
            <div class="modal-content">
                <h1 style="color: var(--accent-color); margin-bottom: 20px;">${this.getText('msg_game_clear')}</h1>
                <p style="margin-bottom: 20px;">${this.getText('msg_clear_desc')}</p>
                <h2 style="margin-bottom: 30px;">${this.getText('msg_clear_time', { time: timeStr })}</h2>
                <button id="btn-ending-continue" class="item-btn" style="text-align: center;">${this.getText('btn_continue')}</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-ending-continue').onclick = () => {
            modal.remove();
        };
    }

    setupTabs() {
        this.elTabShop.onclick = () => this.switchTab('shop');
        this.elTabTech.onclick = () => this.switchTab('tech');
    }

    switchTab(tabName) {
        if (tabName === 'shop') {
            this.elTabShop.classList.add('active');
            this.elTabTech.classList.remove('active');
            this.elContentShop.classList.remove('hidden');
            this.elContentTech.classList.add('hidden');
        } else if (tabName === 'tech') {
            this.elTabShop.classList.remove('active');
            this.elTabTech.classList.add('active');
            this.elContentShop.classList.add('hidden');
            this.elContentTech.classList.remove('hidden');
            this.renderTech(); // Refresh when opening
        }
    }

    update(dt) {
        // Update Stats
        this.elVelocity.textContent = `${Math.floor(this.game.state.velocity)} km/h`;


        // Update Resources
        this.renderResources();

        // Update Tech List (Availability might change with resources)
        // Optimization: Only update visible tab?
        if (!this.elContentTech.classList.contains('hidden')) {
            // Maybe don't re-render entire DOM every frame.
            // Just update classes? For now, let's update heavily.
            // Actually, let's NOT update every frame. Only on events.
        }

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
        // Debounce? 60fps update of DOM text is fine for one element.
        // this.updateHUD(); // Removed undefined function call

        // Update Play Time (only needs seconds precision)
        if (this.game.accumulatedTime) {
            const totalSeconds = Math.floor(this.game.accumulatedTime);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            const el = document.getElementById('play-time-display');
            if (el) el.textContent = timeStr;
        }

        this.updateBackground(this.game.state.currentAreaId);
        this.updateAreas(); // Update active highlight

        // Update Upgrade Button State
        if (this.selectedCell) {
            this.updateSelectionState();
        }
    }

    updateSelectionState() {
        if (!this.selectedCell) return;
        const cell = this.game.grid.getPartAt(this.selectedCell.x, this.selectedCell.y);
        if (!cell) return;

        const partDef = MasterData.parts[cell.partId];
        const level = cell.level || 1;
        const costMultiplier = Math.pow(1.5, level);
        let canAfford = true;

        for (const [res, amount] of Object.entries(partDef.cost)) {
            const cost = Math.floor(amount * costMultiplier * 0.5);
            if ((this.game.state.resources[res] || 0) < cost) {
                canAfford = false;
                break;
            }
        }

        this.btnUpgrade.disabled = !canAfford;
        this.btnUpgrade.style.opacity = canAfford ? '1' : '0.5';
        this.btnUpgrade.style.cursor = canAfford ? 'pointer' : 'not-allowed';
    }

    renderResources() {
        this.elResources.innerHTML = '';
        for (const [id, value] of Object.entries(this.game.state.resources)) {
            const mat = MasterData.materials.find(m => m.id === id);
            if (!mat) continue;

            // Visibility Check:
            // 1. If we have some, show it.
            // 2. If valid drop from any unlocked area, show it.
            let isVisible = false;

            if (value > 0) {
                isVisible = true;
            } else {
                // Check unlocked areas
                // Find area where primaryDrop === id
                const sourceArea = MasterData.areas.find(a => a.primaryDrop === id);
                if (sourceArea) {
                    if (this.game.state.maxVelocity >= sourceArea.threshold) {
                        isVisible = true;
                    }
                }
            }

            if (!isVisible) continue;

            const li = document.createElement('li');
            li.innerHTML = `<span class="label">${this.getText(mat.name)}</span><span class="value">${Math.floor(value)}</span>`;
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
        if (partDef.id.includes('alien')) color = '#00ffaa';
        if (partDef.id.includes('nuclear')) color = '#33ff33'; // Radioactive green
        if (partDef.id.includes('antimatter')) color = '#9900ff'; // Void purple

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

    getPartStats(partDef, level) {
        const stats = {};
        const levelMult = 1.0 + (level - 1) * 0.2; // Base + 20%
        const synLevelMult = 1.0 + (level - 1) * 0.1; // Base + 10%

        if (partDef.type === 'engine') {
            stats.baseVelocity = partDef.baseVelocity * levelMult;
        }
        if (partDef.type === 'wheel') {
            const val = partDef.effect ? partDef.effect.value : 0.1;
            stats.globalMult = val * levelMult;
        }
        if (partDef.type === 'booster') {
            // Base 2.0 (ignoring tech for display simplicity, or I could fetch it)
            // Tech bonus complicates "base" display. Let's show the raw multiplier part.
            const val = partDef.effect ? partDef.effect.value : 2.0;
            stats.boosterMult = val * synLevelMult;
        }
        if (partDef.type === 'frame') {
            const val = partDef.effect ? partDef.effect.value : 1.2;
            stats.frameMult = val * synLevelMult;
        }
        return stats;
    }

    renderShop() {
        this.elShop.innerHTML = '';

        const unlockedParts = Object.values(MasterData.parts).filter(p => this.game.state.unlocks.includes(p.id));

        unlockedParts.forEach(part => {
            const btn = document.createElement('div');
            btn.className = 'item-btn';
            btn.innerHTML = `
                <div class="header">${this.getText(part.name)}</div>
                <div class="cost">${this.getText('lbl_cost')}: ${Object.entries(part.cost).map(([k, v]) => `${this.getText(MasterData.materials.find(m => m.id === k).name)}:${v}`).join(', ')}</div>
            `;
            btn.onclick = () => this.game.buyPart(part.id);

            // Tooltip Events
            btn.onmouseenter = (e) => this.showTooltip(e, part);
            btn.onmousemove = (e) => this.moveTooltip(e);
            btn.onmouseleave = () => this.hideTooltip();

            this.elShop.appendChild(btn);
        });
    }

    renderTech() {
        this.elTechList.innerHTML = '';

        // Sort: Researched (bottom) -> Available (top) -> Locked (middle)
        // Or standard dependency order?
        // Let's just list them.
        Object.values(MasterData.techs).forEach(tech => {
            const isResearched = this.game.state.researched.includes(tech.id);
            const canResearch = this.game.tech.canResearch(tech.id);

            // Check visibility: Show if unlocked OR if prerequisites met (even if can't afford)
            // Or simple check: Show if prerequisites are researched.
            // If prerequisites not met, hide?
            // Let's show everything for now to see tree, but dim locked ones.
            // Better: Show if reqs are met.
            let isVisible = true;
            if (tech.req.length > 0) {
                // If any req is NOT researched, hide it?
                // No, show next step.
                // If ALL reqs are researched, show.
                // If ANY req is missing, hide (unless it's a root tech)
                const reqsMet = tech.req.every(r => this.game.state.researched.includes(r));
                if (!reqsMet) isVisible = false;
            }

            // Exceptions: Always show if we have researched it (though it should have met reqs)
            if (isResearched) isVisible = true;

            if (!isVisible) return;

            const div = document.createElement('div');
            div.className = `tech-item ${isResearched ? 'researched' : ''} ${!canResearch && !isResearched ? 'locked' : ''}`;

            let costStr = Object.entries(tech.cost).map(([k, v]) => `${this.getText(MasterData.materials.find(m => m.id === k).name)}:${v}`).join(', ');

            div.innerHTML = `
                <h4>${this.getText(tech.name)} ${isResearched ? '✓' : ''}</h4>
                <div class="desc">${this.getText(tech.desc)}</div>
                ${!isResearched ? `<div class="cost">${this.getText('lbl_cost')}: ${costStr}</div>` : ''}
            `;

            if (!isResearched) {
                div.onclick = () => {
                    if (this.game.tech.doResearch(tech.id)) {
                        this.renderTech();
                        this.renderResources();
                    }
                };
            }

            this.elTechList.appendChild(div);
        });
    }

    // --- Tooltip ---
    showTooltip(e, part) {
        const tooltip = document.getElementById('tooltip');
        if (!tooltip) return;

        let desc = `<div class="title">${this.getText(part.name)}</div>`;
        desc += `<div class="stat">${this.getText('lbl_type')}: ${part.type.toUpperCase()}</div>`;

        if (part.baseVelocity > 0) {
            desc += `<div class="stat">${this.getText('lbl_base_vel')}: +${part.baseVelocity}</div>`;
        }

        if (part.synergy && part.synergy.target) {
            desc += `<div class="synergy">${this.getText('lbl_synergy')}: ${this.getText('val_to_adj')} ${part.synergy.target.toUpperCase()} x${part.synergy.mult}</div>`;
        }

        // Specific logic for wheels/frames if added later to data
        if (part.type === 'wheel') {
            const val = part.effect ? part.effect.value : 0.1;
            desc += `<div class="stat">${this.getText('lbl_global_buff')}: +${(val * 100).toFixed(0)}%</div>`;
        }
        if (part.type === 'frame') {
            const val = part.effect ? part.effect.value : 1.2;
            desc += `<div class="stat">${this.getText('lbl_adj_buff')}: ${this.getText('val_to_eng')} x${val.toFixed(1)}</div>`;
        }
        if (part.type === 'booster') {
            const val = part.effect ? part.effect.value : 2.0;
            desc += `<div class="stat">${this.getText('lbl_adj_buff')}: ${this.getText('val_to_eng')} x${val.toFixed(1)}</div>`;
        }

        tooltip.innerHTML = desc;
        tooltip.classList.remove('hidden');
        this.moveTooltip(e);
    }

    moveTooltip(e) {
        const tooltip = document.getElementById('tooltip');
        if (!tooltip) return;

        // Offset from mouse
        const x = e.clientX + 15;
        const y = e.clientY + 15;

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }

    renderInventory() {
        if (!this.game.state.inventory) this.game.state.inventory = [];

        this.elInventory.innerHTML = '';
        this.game.state.inventory.forEach((item, index) => {
            // item can be string (ID) or object { id, level }
            // Normalize
            let partId = item;
            let level = 1;

            if (typeof item === 'object') {
                partId = item.id;
                level = item.level || 1;
            }

            const div = document.createElement('div');
            div.className = 'part-item';
            div.innerHTML = this.getPartVisual(MasterData.parts[partId]);

            // Render Level Badge
            if (level > 1) {
                const lvlBadge = document.createElement('div');
                lvlBadge.className = 'level-badge';
                lvlBadge.textContent = `Lv.${level}`;
                div.appendChild(lvlBadge);
            }

            div.draggable = true;
            div.dataset.role = 'inventory';
            div.dataset.index = index;
            div.dataset.partId = partId;

            div.ondragstart = (e) => this.handleDragStart(e, { source: 'inventory', index, partId, level });

            // Right Click to Delete (Overlay)
            div.oncontextmenu = (e) => {
                e.preventDefault();

                // Remove existing overlays
                const existing = this.elInventory.querySelectorAll('.delete-overlay');
                existing.forEach(el => el.remove());

                // Create Overlay
                const overlay = document.createElement('div');
                overlay.className = 'delete-overlay';
                overlay.innerHTML = '🗑'; // Trash icon
                overlay.title = this.getText('msg_delete_part_confirm', { level: level });

                // Confirmed Delete
                overlay.onclick = (ev) => {
                    ev.stopPropagation();
                    this.game.state.inventory.splice(index, 1);
                    this.renderInventory();
                };

                // Cancel on leave
                div.onmouseleave = () => overlay.remove();

                // Cancel if clicked elsewhere (handled by re-render or explicit remove)
                // Actually, div.appendChild might be enough.
                div.appendChild(overlay);
            };

            this.elInventory.appendChild(div);
        });
    }

    // Call this when inventory changes
    addInventoryItem(partIdOrData) {
        if (!this.game.state.inventory) this.game.state.inventory = [];

        let newItem = { id: null, level: 1 };

        if (typeof partIdOrData === 'string') {
            newItem.id = partIdOrData;
            newItem.level = 1;
        } else if (typeof partIdOrData === 'object' && partIdOrData) {
            newItem.id = partIdOrData.id || partIdOrData.partId;
            newItem.level = partIdOrData.level || 1;
        }

        if (!newItem.id) {
            console.error("UI.addInventoryItem: Invalid item data", partIdOrData);
            return;
        }

        console.log("UI.addInventoryItem: Adding", newItem);
        this.game.state.inventory.push(newItem);
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

                // Selection Highlight
                if (this.selectedCell && this.selectedCell.x === x && this.selectedCell.y === y) {
                    cellDiv.classList.add('selected');
                    cellDiv.style.border = '2px solid var(--accent-color)';
                }

                const cellData = this.game.grid.getPartAt(x, y);
                if (cellData) {
                    const partDef = MasterData.parts[cellData.partId];
                    const partDiv = document.createElement('div');
                    partDiv.className = 'part';
                    if (partDef) {
                        partDiv.innerHTML = this.getPartVisual(partDef);
                        partDiv.dataset.type = partDef.type;

                        // Level Indicator
                        if (cellData.level > 1) {
                            const lvlBadge = document.createElement('div');
                            lvlBadge.className = 'level-badge';
                            lvlBadge.textContent = `Lv.${cellData.level}`;
                            partDiv.appendChild(lvlBadge);
                        }
                    }
                    partDiv.draggable = true;

                    partDiv.ondragstart = (e) => {
                        e.stopPropagation(); // Don't drag cell
                        // Pass full data including level
                        this.handleDragStart(e, {
                            source: 'grid',
                            x,
                            y,
                            partId: cellData.partId,
                            level: cellData.level
                        });
                        // Also select on drag start? Maybe.
                        // this.selectCell(x, y); // Disabled to prevent re-render killing drag
                    };

                    // Click to select
                    partDiv.onclick = (e) => {
                        e.stopPropagation();
                        this.selectCell(x, y);
                    };

                    cellDiv.appendChild(partDiv);
                } else {
                    // Clicking empty cell deselects
                    cellDiv.onclick = () => this.deselectCell();
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
                    const part = this.game.grid.getPartAt(x, y);
                    if (part) {
                        this.game.grid.removePart(x, y);
                        this.addInventoryItem({ id: part.partId, level: part.level });
                        this.deselectCell(); // Deselect on remove
                        this.renderGrid(); // Re-render self
                    }
                };

                this.elGrid.appendChild(cellDiv);
            }
        }
    }

    initAreas() {
        this.elAreaList.innerHTML = '';
        MasterData.areas.forEach(area => {
            const div = document.createElement('div');
            div.className = 'area-item';
            div.dataset.id = area.id;
            div.onclick = () => {
                // Only allow if unlocked
                const isUnlocked = this.game.state.maxVelocity >= area.threshold;
                if (isUnlocked || area.id === this.game.state.currentAreaId) {
                    this.game.state.currentAreaId = area.id;
                    this.updateAreas(); // Update highlight
                }
            };
            this.elAreaList.appendChild(div);
        });
        this.updateAreas();
    }

    updateAreas(force = false) {
        // Update status of existing elements
        const children = Array.from(this.elAreaList.children);
        children.forEach(div => {
            const areaId = div.dataset.id;
            const area = MasterData.areas.find(a => a.id === areaId);
            if (!area) return;

            const isUnlocked = this.game.state.maxVelocity >= area.threshold;
            const isActive = areaId === this.game.state.currentAreaId;

            // Determine target state
            let newState = 'locked';
            if (isActive) newState = 'active';
            else if (isUnlocked) newState = 'unlocked';

            // Only update if state changed OR forced (e.g. language change)
            if (force || div.dataset.state !== newState) {
                div.dataset.state = newState;
                div.className = 'area-item'; // Reset classes
                div.classList.add(newState);

                if (newState === 'active') {
                    div.innerHTML = `<div class="name">${this.getText('active_area')} ${this.getText(area.name)}</div>`;
                } else if (newState === 'unlocked') {
                    div.innerHTML = `<div class="name">${this.getText(area.name)}</div>`;
                } else {
                    div.innerHTML = `<div class="name">${this.getText('area_locked')}</div><div class="info">${this.getText('area_req', { val: area.threshold })}</div>`;
                }
            }
        });
    }

    renderAreas() {
        // Proxy to update for backward compatibility if called elsewhere, 
        // but ideally we call initAreas() once and updateAreas() loop.
        if (this.elAreaList.children.length === 0) {
            this.initAreas();
        } else {
            this.updateAreas();
        }
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
                const { x, y, partId, level } = this.draggedItem;
                console.log(`UI.ondrop (Inventory): Dropped from grid. Level: ${level}`);
                this.game.grid.removePart(x, y);
                this.addInventoryItem({ id: partId, level: level || 1 });
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

        console.log("UI.handleDrop: DraggedItem:", this.draggedItem);

        const { source, index, partId, x: srcX, y: srcY } = this.draggedItem;

        if (source === 'inventory') {
            if (this.game.grid.getPartAt(x, y)) {
                console.log("Slot occupied");
                return;
            }
            const level = this.draggedItem.level || 1;
            console.log(`UI.handleDrop: Inv -> Grid. Level: ${level}`);
            this.game.grid.placePart(x, y, partId, level);
            this.game.state.inventory.splice(index, 1);
            this.renderInventory();
            this.renderGrid();

        } else if (source === 'grid') {
            const level = this.draggedItem.level || 1;
            console.log(`UI.handleDrop: Grid -> Grid. Level: ${level}`);
            const existing = this.game.grid.getPartAt(x, y);

            this.game.grid.removePart(srcX, srcY);

            if (existing) {
                console.log(`UI.handleDrop: Swapping with existing level ${existing.level}`);
                this.game.grid.placePart(srcX, srcY, existing.partId, existing.level);
            }

            this.game.grid.placePart(x, y, partId, level);

            this.renderGrid();
        }

        this.draggedItem = null;
    }
}
