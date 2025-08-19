import { CONFIG } from './Config.js';
import { MapGenerator } from '../map/MapGenerator.js';
import { ItemPlacer } from '../utils/ItemPlacer.js';
import { Renderer } from '../rendering/Renderer.js';
import { InputHandler } from '../utils/InputHandler.js';
import { Helpers } from '../utils/helpers.js';

export class Game {
    constructor() {
        this.config = CONFIG;
        this.map = [];
        this.hero = null;
        this.enemies = [];
        this.swords = [];
        this.potions = [];
        
        this.mapGenerator = new MapGenerator(this.config);
        this.itemPlacer = new ItemPlacer(this.config);
        this.renderer = new Renderer(this.config);
        this.inputHandler = new InputHandler();
        
        this.moveInterval = null;
        this.isGameOver = false;
        
        console.log('🎮 Игра инициализирована');
    }

    init() {
       
        this.generateMap();
        this.placeItems();
        this.setupControls();
        this.startEnemyMovement();
        this.render();
      
    }

    generateMap() {  
        this.map = this.mapGenerator.generateConnectedMap();
    }

    placeItems() {
        const items = this.itemPlacer.placeItems(this.map);
        this.hero = items.hero;
        this.enemies = items.enemies;
        this.swords = items.swords;
        this.potions = items.potions;
    }

    setupControls() {
        this.inputHandler.bind(this);
    }

    startEnemyMovement() {
        this.moveInterval = setInterval(() => {
            if (!this.isGameOver) {
                this.moveEnemies();
                this.enemiesAttack();
                this.render();
            }
        }, this.config.ENEMY_MOVE_INTERVAL);
    }

    stopEnemyMovement() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
    }

    moveHero(dx, dy) {
        if (this.isGameOver) return;
        if (this.hero.move(dx, dy, this.map)) {
            this.checkInteractions();
            this.render();
        }
    }

    checkInteractions() {
        this.checkSwordPickup();
        this.checkPotionPickup();
        this.checkEnemyStep();
    }

    checkSwordPickup() {
        const swordIndex = this.swords.findIndex(s => s.x === this.hero.x && s.y === this.hero.y);
        if (swordIndex !== -1) {
            const sword = this.swords[swordIndex];
            const oldAttack = this.hero.attackPower;
            console.log(`⚔️ Подобран меч в (${sword.x}, ${sword.y})! Атака: ${oldAttack} → ${oldAttack + this.config.SWORD_BONUS}`);
            this.swords.splice(swordIndex, 1);
            this.hero.increaseAttack(this.config.SWORD_BONUS);
        }
    }

    checkPotionPickup() {
        const potionIndex = this.potions.findIndex(p => p.x === this.hero.x && p.y === this.hero.y);
        if (potionIndex !== -1) {
            const potion = this.potions[potionIndex];
            const oldHealth = this.hero.health;
            const newHealth = Math.min(this.hero.maxHealth, oldHealth + this.config.POTION_HEAL);
            console.log(`🧪 Подобрано зелье в (${potion.x}, ${potion.y})! Здоровье: ${oldHealth}/${this.hero.maxHealth} → ${newHealth}/${this.hero.maxHealth}`);
            this.potions.splice(potionIndex, 1);
            this.hero.heal(this.config.POTION_HEAL);
        }
    }

    checkEnemyStep() {
        const enemyIndex = this.enemies.findIndex(e => e.x === this.hero.x && e.y === this.hero.y);
        if (enemyIndex !== -1) {
            const enemy = this.enemies[enemyIndex];
            const oldHealth = this.hero.health;
            const damage = enemy.attackPower;
            const newHealth = Math.max(0, oldHealth - damage);
            console.log(`💥 Герой наступил на врага в (${enemy.x}, ${enemy.y})! Получено ${damage} урона: ${oldHealth} → ${newHealth}`);
            if (this.hero.takeDamage(enemy.attackPower)) {
                this.gameOver();
            }
        }
    }

    attack() {
        if (this.isGameOver) return;
        const directions = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
        let hit = false;

        directions.forEach(dir => {
            const ex = this.hero.x + dir.x;
            const ey = this.hero.y + dir.y;

            const enemyIndex = this.enemies.findIndex(e => e.x === ex && e.y === ey);
            if (enemyIndex !== -1) {
                hit = this.attackEnemy(enemyIndex) || hit;
            }
        });

        if (hit) {
            this.render();
        }
    }

    attackEnemy(enemyIndex) {
        const enemy = this.enemies[enemyIndex];
        const oldHealth = enemy.health;
        const damage = this.hero.attackPower;
        const newHealth = Math.max(0, oldHealth - damage);
        console.log(`⚔️ Атака врага в (${enemy.x}, ${enemy.y}) с уроном ${damage}: ${oldHealth} → ${newHealth}`);
        if (enemy.takeDamage(this.hero.attackPower)) {
            console.log(`💀 Враг побежден в (${enemy.x}, ${enemy.y})!`);
            this.enemies.splice(enemyIndex, 1);
            this.checkVictory();
        }
        return true;
    }

    moveEnemies() {
        // console.log('👹 Движение врагов...'); // Закомментировано для уменьшения спама
        this.enemies.forEach(enemy => {
            if (Math.random() > this.config.ENEMY_MOVE_CHANCE) {
                this.moveEnemy(enemy);
            }
        });
    }

    moveEnemy(enemy) {
        const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        const validMoves = directions.filter(dir => {
            const newX = enemy.x + dir.x;
            const newY = enemy.y + dir.y;
            
            return this.isValidMove(newX, newY) && 
                   !this.isCellOccupied(newX, newY, enemy);
        });
        
        if (validMoves.length > 0) {
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            enemy.x += move.x;
            enemy.y += move.y;
        }
    }

    isValidMove(x, y) {
        return x >= 0 && x < this.config.WIDTH &&
               y >= 0 && y < this.config.HEIGHT &&
               this.map[y][x] === 0;
    }

    isCellOccupied(x, y, excludeEntity = null) {
        const entities = [
            this.hero,
            ...this.enemies,
            ...this.swords,
            ...this.potions
        ];
        
        return Helpers.isCellOccupied(x, y, entities, excludeEntity);
    }

    enemiesAttack() {
        this.enemies.forEach(enemy => {
            if (enemy.getDistanceTo(this.hero.x, this.hero.y) === 1) {
                const oldHealth = this.hero.health;
                const damage = enemy.attackPower;
                const newHealth = Math.max(0, oldHealth - damage);
                console.log(`👹 Враг в (${enemy.x}, ${enemy.y}) атакует героя на ${damage} урона: ${oldHealth} → ${newHealth}`);
                if (this.hero.takeDamage(enemy.attackPower)) {
                    this.gameOver();
                }
            }
        });
    }

    gameOver() {
        this.isGameOver = true;
        this.stopEnemyMovement();
        this.inputHandler.unbind();
        console.log(`💀 ИГРА ОКОНЧЕНА: Герой погиб! Финальные характеристики - HP: 0/${this.hero.maxHealth}, АТК: ${this.hero.attackPower}`);
        this.renderer.showMessage("Игра окончена! Герой погиб.");
    }

    checkVictory() {
        if (this.enemies.length === 0) {
            this.isGameOver = true;
            this.stopEnemyMovement();
            this.inputHandler.unbind();
            console.log(`🎉 ПОБЕДА: Все враги побеждены! Финальные характеристики - HP: ${this.hero.health}/${this.hero.maxHealth}, АТК: ${this.hero.attackPower}`);
            this.renderer.showMessage("Поздравляем! Вы победили! Все враги уничтожены.");
            return true;
        }
        return false;
    }

    render() {
        this.renderer.render({
            map: this.map,
            hero: this.hero,
            enemies: this.enemies,
            swords: this.swords,
            potions: this.potions
        });
    }

    getGameState() {
        return {
            map: this.map,
            hero: this.hero,
            enemies: this.enemies,
            swords: this.swords,
            potions: this.potions
        };
    }
}