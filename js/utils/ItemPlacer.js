import { Hero } from '../entities/Hero.js';
import { Enemy } from '../entities/Enemy.js';
import { Sword } from '../entities/Sword.js';
import { Potion } from '../entities/Potion.js';
import { Helpers } from './helpers.js';

export class ItemPlacer {
    constructor(config) {
        this.config = config;
    }

    placeItems(map) {
        let emptyCells = Helpers.getEmptyCells(map);
        emptyCells = Helpers.shuffleArray(emptyCells);

        const hero = this.placeHero(emptyCells);
        const enemies = this.placeEnemies(emptyCells);
        const swords = this.placeSwords(emptyCells);
        const potions = this.placePotions(emptyCells);

        return { hero, enemies, swords, potions };
    }

    placeHero(emptyCells) {
        if (emptyCells.length === 0) return new Hero(1, 1, this.config);
        
        const heroCell = emptyCells.pop();
        return new Hero(heroCell.x, heroCell.y, this.config);
    }

    placeEnemies(emptyCells) {
        const enemies = [];
        for (let i = 0; i < this.config.ENEMY_COUNT && emptyCells.length > 0; i++) {
            const cell = emptyCells.pop();
            enemies.push(new Enemy(cell.x, cell.y, this.config));
        }
        return enemies;
    }

   placeSwords(emptyCells) {
    const swords = [];
    for (let i = 0; i < this.config.SWORD_COUNT && emptyCells.length > 0; i++) {
        const cell = emptyCells.pop();
        swords.push(new Sword(cell.x, cell.y)); 
    }
    return swords;
}

  placePotions(emptyCells) {
    const potions = [];
    for (let i = 0; i < this.config.POTION_COUNT && emptyCells.length > 0; i++) {
        const cell = emptyCells.pop();
        potions.push(new Potion(cell.x, cell.y)); 
    }
    return potions; 
}}