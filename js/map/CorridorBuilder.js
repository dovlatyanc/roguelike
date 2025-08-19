export class CorridorBuilder {
    static connectRooms(map, room1, room2) {
        let x = room1.centerX;
        let y = room1.centerY;
        
        const horizontalFirst = Math.random() > 0.5;
        
        if (horizontalFirst) {
            CorridorBuilder.buildHorizontalCorridor(map, x, room2.centerX, y);
            CorridorBuilder.buildVerticalCorridor(map, y, room2.centerY, room2.centerX);
        } else {
            CorridorBuilder.buildVerticalCorridor(map, y, room2.centerY, x);
            CorridorBuilder.buildHorizontalCorridor(map, x, room2.centerX, room2.centerY);
        }
        
        map[room2.centerY][room2.centerX] = 0;
    }

    static buildHorizontalCorridor(map, startX, endX, y) {
        const step = startX < endX ? 1 : -1;
        for (let x = startX; x !== endX; x += step) {
            map[y][x] = 0;
        }
    }

    static buildVerticalCorridor(map, startY, endY, x) {
        const step = startY < endY ? 1 : -1;
        for (let y = startY; y !== endY; y += step) {
            map[y][x] = 0;
        }
    }

    static connectPoints(map, point1, point2) {
        let x = point1.x;
        let y = point1.y;
        
        while (x !== point2.x || y !== point2.y) {
            map[y][x] = 0;
            
            if (x !== point2.x && (y === point2.y || Math.random() > 0.5)) {
                x += (x < point2.x) ? 1 : -1;
            } else {
                y += (y < point2.y) ? 1 : -1;
            }
        }
        
        map[y][x] = 0;
    }
}