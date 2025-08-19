import { Game } from './core/Game.js';

$(document).ready(() => {
    try {
        const game = new Game();
        game.init();
        
        console.log('Игра успешно запущена!');
    } catch (error) {
        console.error('Ошибка при запуске игры:', error);
        alert('Произошла ошибка при запуске игры. Проверьте консоль для подробностей.');
    }
});