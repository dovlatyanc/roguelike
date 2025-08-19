class Game {
  constructor() {
    this.WIDTH = 30;
    this.HEIGHT = 18;
    this.TILE_SIZE = 40;
    
    this.map = [];
    this.hero = this.createHero();
    this.enemies = [];
    this.swords = [];
    this.potions = [];
    
    this.$field = $('.field');
    this.$stats = $('.stats');
    this.moveInterval = null;
  }

  createHero() {
    return {
      x: 0,
      y: 0,
      health: 30,
      maxHealth: 30,
      attackPower: 1
    };
  }

  init() {
    this.generateConnectedMap();
    this.placeItems();
    this.render();
    this.bindControls();
    this.startEnemyMovement();
  }

  // Генерация карты
  generateConnectedMap() {
    this.createEmptyMap();
    const rooms = this.generateRooms(4, 5);
    this.connectAllRooms(rooms);
    this.ensureConnectivity();
  }

  createEmptyMap() {
    this.map = Array(this.HEIGHT).fill().map(() => Array(this.WIDTH).fill(1));
  }

  generateRooms(minRooms, maxRooms) {
    const rooms = [];
    const roomCount = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;
    
    for (let i = 0; i < roomCount; i++) {
      const room = this.generateValidRoom(rooms);
      if (room) {
        rooms.push(room);
        this.carveRoom(room);
      }
    }
    
    return rooms;
  }

  generateValidRoom(existingRooms, maxAttempts = 50) {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const w = Math.floor(Math.random() * 4) + 4;
      const h = Math.floor(Math.random() * 3) + 4;
      const x = Math.floor(Math.random() * (this.WIDTH - w - 4)) + 2;
      const y = Math.floor(Math.random() * (this.HEIGHT - h - 4)) + 2;
      
      const room = { x, y, w, h, centerX: Math.floor(x + w/2), centerY: Math.floor(y + h/2) };
      
      if (!this.doesRoomOverlap(room, existingRooms)) {
        return room;
      }
    }
    return null;
  }

  doesRoomOverlap(room, existingRooms) {
    return existingRooms.some(existingRoom => 
      room.x < existingRoom.x + existingRoom.w + 2 &&
      room.x + room.w + 2 > existingRoom.x &&
      room.y < existingRoom.y + existingRoom.h + 2 &&
      room.y + room.h + 2 > existingRoom.y
    );
  }

  carveRoom(room) {
    for (let dy = 0; dy < room.h; dy++) {
      for (let dx = 0; dx < room.w; dx++) {
        this.map[room.y + dy][room.x + dx] = 0;
      }
    }
  }

  // Соединение комнат
  connectAllRooms(rooms) {
    if (rooms.length < 2) return;
    
    const connections = this.createRoomConnections(rooms);
    const mst = this.findMinimumSpanningTree(connections, rooms.length);
    this.createExtraConnections(connections, mst, rooms);
  }

  createRoomConnections(rooms) {
    const connections = [];
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const distance = Math.abs(rooms[i].centerX - rooms[j].centerX) + 
                       Math.abs(rooms[i].centerY - rooms[j].centerY);
        connections.push({ from: i, to: j, distance });
      }
    }
    return connections.sort((a, b) => a.distance - b.distance);
  }

  findMinimumSpanningTree(connections, roomCount) {
    const parent = {};
    for (let i = 0; i < roomCount; i++) parent[i] = i;
    
    const find = (x) => {
      if (parent[x] !== x) parent[x] = find(parent[x]);
      return parent[x];
    };
    
    const mst = [];
    for (const conn of connections) {
      const rootFrom = find(conn.from);
      const rootTo = find(conn.to);
      
      if (rootFrom !== rootTo) {
        mst.push(conn);
        parent[rootFrom] = rootTo;
      }
    }
    
    return mst;
  }

  createExtraConnections(connections, mst, rooms) {
    const extraConnections = Math.min(2, connections.length - mst.length);
    for (let i = 0; i < extraConnections; i++) {
      const randomConn = connections[Math.floor(Math.random() * connections.length)];
      if (!mst.includes(randomConn)) {
        this.connectRooms(rooms[randomConn.from], rooms[randomConn.to]);
      }
    }
  }

  connectRooms(room1, room2) {
    let x = room1.centerX;
    let y = room1.centerY;
    
    const horizontalFirst = Math.random() > 0.5;
    
    if (horizontalFirst) {
      this.createHorizontalCorridor(x, room2.centerX, y);
      this.createVerticalCorridor(y, room2.centerY, room2.centerX);
    } else {
      this.createVerticalCorridor(y, room2.centerY, x);
      this.createHorizontalCorridor(x, room2.centerX, room2.centerY);
    }
    
    this.map[room2.centerY][room2.centerX] = 0;
  }

  createHorizontalCorridor(startX, endX, y) {
    const step = startX < endX ? 1 : -1;
    for (let x = startX; x !== endX; x += step) {
      this.map[y][x] = 0;
    }
  }

  createVerticalCorridor(startY, endY, x) {
    const step = startY < endY ? 1 : -1;
    for (let y = startY; y !== endY; y += step) {
      this.map[y][x] = 0;
    }
  }

  // Обеспечение связности
  ensureConnectivity() {
    const visited = Array(this.HEIGHT).fill().map(() => Array(this.WIDTH).fill(false));
    const components = this.findConnectedComponents(visited);
    
    if (components.length > 1) {
      this.connectComponents(components);
    }
  }

  findConnectedComponents(visited) {
    const components = [];
    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        if (this.map[y][x] === 0 && !visited[y][x]) {
          const component = [];
          this.floodFill(x, y, visited, component);
          components.push(component);
        }
      }
    }
    return components;
  }

  floodFill(x, y, visited, component) {
    const stack = [{x, y}];
    const directions = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
    
    while (stack.length > 0) {
      const current = stack.pop();
      
      if (this.isInvalidCell(current.x, current.y, visited)) continue;
      
      visited[current.y][current.x] = true;
      component.push({ x: current.x, y: current.y });
      
      directions.forEach(dir => {
        stack.push({x: current.x + dir.x, y: current.y + dir.y});
      });
    }
  }

  isInvalidCell(x, y, visited) {
    return x < 0 || x >= this.WIDTH || 
           y < 0 || y >= this.HEIGHT ||
           visited[y][x] || 
           this.map[y][x] === 1;
  }

  connectComponents(components) {
    for (let i = 0; i < components.length - 1; i++) {
      const point1 = components[i][Math.floor(Math.random() * components[i].length)];
      const point2 = components[i + 1][Math.floor(Math.random() * components[i + 1].length)];
      this.connectPoints(point1, point2);
    }
  }

  connectPoints(point1, point2) {
    let x = point1.x;
    let y = point1.y;
    
    while (x !== point2.x || y !== point2.y) {
      this.map[y][x] = 0;
      
      if (x !== point2.x && (y === point2.y || Math.random() > 0.5)) {
        x += (x < point2.x) ? 1 : -1;
      } else {
        y += (y < point2.y) ? 1 : -1;
      }
    }
    
    this.map[y][x] = 0;
  }

  // Движение и взаимодействия
  moveHero(dx, dy) {
    const newX = this.hero.x + dx;
    const newY = this.hero.y + dy;

    if (this.isValidMove(newX, newY)) {
      this.hero.x = newX;
      this.hero.y = newY;
      this.checkInteractions();
      this.enemiesAttack();
      this.render();
    }
  }

  isValidMove(x, y) {
    return x >= 0 && x < this.WIDTH &&
           y >= 0 && y < this.HEIGHT &&
           this.map[y][x] === 0;
  }

  isCellOccupied(x, y, excludeEnemy = null) {
    if (this.hero.x === x && this.hero.y === y) return true;
    
    const enemyOccupied = this.enemies.some(enemy => 
      enemy.x === x && enemy.y === y && (!excludeEnemy || enemy !== excludeEnemy)
    );
    
    if (enemyOccupied) return true;
    
    return this.swords.some(sword => sword.x === x && sword.y === y) ||
           this.potions.some(potion => potion.x === x && potion.y === y);
  }

  checkInteractions() {
    const { x, y } = this.hero;

    this.checkSwordPickup(x, y);
    this.checkPotionPickup(x, y);
    this.checkEnemyStep(x, y);
  }

  checkSwordPickup(x, y) {
    const swordIndex = this.swords.findIndex(s => s.x === x && s.y === y);
    if (swordIndex !== -1) {
      this.swords.splice(swordIndex, 1);
      this.hero.attackPower += 2;
    }
  }

  checkPotionPickup(x, y) {
    const potionIndex = this.potions.findIndex(p => p.x === x && p.y === y);
    if (potionIndex !== -1) {
      this.potions.splice(potionIndex, 1);
      this.hero.health = Math.min(this.hero.maxHealth, this.hero.health + 20);
    }
  }

  checkEnemyStep(x, y) {
    const enemyIndex = this.enemies.findIndex(e => e.x === x && e.y === y);
    if (enemyIndex !== -1) {
      const enemy = this.enemies[enemyIndex];
      this.hero.health -= enemy.attackPower;
      
      if (this.hero.health <= 0) {
        this.gameOver();
      }
    }
  }

  startEnemyMovement() {
    this.moveInterval = setInterval(() => {
      this.moveEnemies();
      this.enemiesAttack();
      this.render();
    }, 1000);
  }

  stopEnemyMovement() {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
  }

  enemiesAttack() {
    this.enemies.forEach(enemy => {
      const distance = Math.abs(enemy.x - this.hero.x) + Math.abs(enemy.y - this.hero.y);
      
      if (distance === 1) {
        this.hero.health -= enemy.attackPower;
        
        if (this.hero.health <= 0) {
          this.gameOver();
        }
      }
    });
  }

  attack() {
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
    enemy.health -= this.hero.attackPower;

    if (enemy.health <= 0) {
      this.enemies.splice(enemyIndex, 1);
      this.checkVictory();
    }

    return true;
  }

  moveEnemies() {
    this.enemies.forEach(enemy => {
      if (Math.random() > 0.7) {
        this.moveEnemy(enemy);
      }
    });
  }

  moveEnemy(enemy) {
    const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    const validMoves = directions.filter(dir => {
      const newX = enemy.x + dir.x;
      const newY = enemy.y + dir.y;
      
      return this.isValidMove(newX, newY) && !this.isCellOccupied(newX, newY, enemy);
    });
    
    if (validMoves.length > 0) {
      const move = validMoves[Math.floor(Math.random() * validMoves.length)];
      enemy.x += move.x;
      enemy.y += move.y;
    }
  }

  // Управление игрой
  gameOver() {
    alert("Игра окончена! Герой погиб.");
    this.stopEnemyMovement();
    $(document).off('keydown');
  }

  checkVictory() {
    if (this.enemies.length === 0) {
      alert("Поздравляем! Вы победили! Все враги уничтожены.");
      this.stopEnemyMovement();
      $(document).off('keydown');
      return true;
    }
    return false;
  }

  bindControls() {
    const keyMap = {
      'w': () => this.moveHero(0, -1),
      's': () => this.moveHero(0, 1),
      'a': () => this.moveHero(-1, 0),
      'd': () => this.moveHero(1, 0),
      ' ': () => this.attack()
    };

    $(document).on('keydown', (e) => {
      const action = keyMap[e.key.toLowerCase()];
      if (action) {
        e.preventDefault();
        action();
      }
    });
  }

  // Размещение предметов
  getEmptyCells() {
    const cells = [];
    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        if (this.map[y][x] === 0) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  placeItems() {
    let emptyCells = this.shuffleArray(this.getEmptyCells());

    if (emptyCells.length > 0) {
      const heroCell = emptyCells.pop();
      this.hero.x = heroCell.x;
      this.hero.y = heroCell.y;
    }

    this.placeEnemies(emptyCells, 10);
    this.placeSwords(emptyCells, 2);
    this.placePotions(emptyCells, 10);
  }

  placeEnemies(cells, count) {
    for (let i = 0; i < count && cells.length > 0; i++) {
      const cell = cells.pop();
      this.enemies.push({ 
        x: cell.x, 
        y: cell.y, 
        health: 15,
        maxHealth: 15,
        attackPower: Math.floor(Math.random() * 3) + 2
      });
    }
  }

  placeSwords(cells, count) {
    for (let i = 0; i < count && cells.length > 0; i++) {
      this.swords.push(cells.pop());
    }
  }

  placePotions(cells, count) {
    for (let i = 0; i < count && cells.length > 0; i++) {
      this.potions.push(cells.pop());
    }
  }

  // Отрисовка
  render() {
    this.$field.empty();

    for (let y = 0; y < this.HEIGHT; y++) {
      for (let x = 0; x < this.WIDTH; x++) {
        const tile = this.createTile(x, y);
        this.addTileContent(tile, x, y);
        this.$field.append(tile);
      }
    }
  }

  createTile(x, y) {
    const tile = $('<div class="tile"></div>');
    tile.css({
      left: x * this.TILE_SIZE,
      top: y * this.TILE_SIZE,
      width: this.TILE_SIZE,
      height: this.TILE_SIZE
    });

    tile.addClass(this.map[y][x] === 1 ? 'tileW' : 'tile');
    return tile;
  }

  addTileContent(tile, x, y) {
    if (this.hero.x === x && this.hero.y === y) {
      tile.addClass('tileP');
      this.addHealthBar(tile, this.hero.health, this.hero.maxHealth);
    }

    this.enemies.forEach(enemy => {
      if (enemy.x === x && enemy.y === y) {
        tile.addClass('tileE');
        this.addHealthBar(tile, enemy.health, enemy.maxHealth);
      }
    });

    if (this.swords.some(sword => sword.x === x && sword.y === y)) {
      tile.addClass('tileSW');
    }

    if (this.potions.some(potion => potion.x === x && potion.y === y)) {
      tile.addClass('tileHP');
    }
  }

  addHealthBar(tile, currentHealth, maxHealth) {
    const healthBar = $('<div class="health"></div>').css({
      width: (currentHealth / maxHealth * 100) + '%'
    });
    tile.append(healthBar);
  }
}

// Запуск
$(document).ready(() => {
  const game = new Game();
  game.init();
});