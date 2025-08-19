export class Renderer {
    constructor(config) {
        this.config = config;
        this.$field = $('.field');
        this.$healthValue = $('.health-value');
        this.$attackValue = $('.attack-value');
    }

    render(gameState) {
        this.$field.empty();
        this.renderMap(gameState.map);
        this.renderEntities(gameState);
        this.updateStats(gameState.hero);
    }

    renderMap(map) {
        for (let y = 0; y < this.config.HEIGHT; y++) {
            for (let x = 0; x < this.config.WIDTH; x++) {
                this.renderTile(x, y, map[y][x]);
            }
        }
    }

    renderTile(x, y, tileType) {
        const tile = this.createTile(x, y);
        tile.addClass('tile'); // ВСЕГДА добавляем базовый класс
        if (tileType === 1) {
            tile.addClass('tileW');
        }
        this.$field.append(tile);
    }

    renderEntities(gameState) {
        this.renderHero(gameState.hero);
        this.renderEnemies(gameState.enemies);
        this.renderSwords(gameState.swords);
        this.renderPotions(gameState.potions);
    }

    renderHero(hero) {
        const tile = this.getTileAt(hero.x, hero.y);
        tile.addClass('tileP');
        this.addHealthBar(tile, hero.getHealthPercentage());
    }

    renderEnemies(enemies) {
        enemies.forEach(enemy => {
            const tile = this.getTileAt(enemy.x, enemy.y);
            tile.addClass('tileE');
            this.addHealthBar(tile, enemy.getHealthPercentage());
        });
    }

    renderSwords(swords) {
        swords.forEach(sword => {
            const tile = this.getTileAt(sword.x, sword.y);
            tile.addClass('tileSW');
        });
    }

    renderPotions(potions) {
        potions.forEach(potion => {
            const tile = this.getTileAt(potion.x, potion.y);
            tile.addClass('tileHP');
        });
    }

    getTileAt(x, y) {
        return this.$field.find(`[data-x="${x}"][data-y="${y}"]`);
    }

    createTile(x, y) {
        const tile = $('<div></div>')
            .attr('data-x', x)
            .attr('data-y', y)
            .addClass('tile')
            .css({
                left: x * this.config.TILE_SIZE,
                top: y * this.config.TILE_SIZE,
                width: this.config.TILE_SIZE,
                height: this.config.TILE_SIZE
            });
        return tile;
    }

    addHealthBar(tile, percentage) {
        const healthBar = $('<div class="health"></div>').css({
            width: percentage + '%'
        });
        tile.append(healthBar);
    }

    updateStats(hero) {
        this.$healthValue.text(`${hero.health}/${hero.maxHealth}`);
        this.$attackValue.text(hero.attackPower);
    }

    showMessage(message) {
        alert(message);
    }
}