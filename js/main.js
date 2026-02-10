import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();

    // For debugging
    window.game = game;
});
