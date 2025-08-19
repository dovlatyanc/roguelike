export class Hero {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.health = config.HERO_MAX_HEALTH;
        this.maxHealth = config.HERO_MAX_HEALTH;
        this.attackPower = config.HERO_ATTACK_POWER;
    }

    move(dx, dy, map) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (this.isValidMove(newX, newY, map)) {
            this.x = newX;
            this.y = newY;
            return true;
        }
        return false;
    }

    isValidMove(x, y, map) {
        return x >= 0 && x < this.config.WIDTH &&
               y >= 0 && y < this.config.HEIGHT &&
               map[y][x] === 0;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    increaseAttack(power) {
        this.attackPower += power;
    }

    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }
}