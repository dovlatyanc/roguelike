export class Helpers {
    static getEmptyCells(map) {
        const cells = [];
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                if (map[y][x] === 0) {
                    cells.push({ x, y });
                }
            }
        }
        return cells;
    }

    static shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    static isCellOccupied(x, y, entities, excludeEntity = null) {
        return entities.some(entity => 
            entity.x === x && entity.y === y && (!excludeEntity || entity !== excludeEntity)
        );
    }

    static getRandomDirection() {
        const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        return directions[Math.floor(Math.random() * directions.length)];
    }
}