export class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.health = config.ENEMY_MAX_HEALTH;
        this.maxHealth = config.ENEMY_MAX_HEALTH;
        this.attackPower = Math.floor(
            Math.random() * (config.ENEMY_MAX_ATTACK - config.ENEMY_MIN_ATTACK + 1)
        ) + config.ENEMY_MIN_ATTACK;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }

    getDistanceTo(targetX, targetY) {
        return Math.abs(this.x - targetX) + Math.abs(this.y - targetY);
    }
}