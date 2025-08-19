import { Room } from './Room.js';
import { CorridorBuilder } from './CorridorBuilder.js';

export class MapGenerator {
    constructor(config) {
        this.config = config;
    }

    generateConnectedMap() {
        const map = this.createEmptyMap();
        const rooms = this.generateRooms(4, 5);
        this.carveRooms(map, rooms);
        this.connectAllRooms(map, rooms);
        this.ensureConnectivity(map);
        return map;
    }

    createEmptyMap() {
        return Array(this.config.HEIGHT).fill().map(() => Array(this.config.WIDTH).fill(1));
    }

    generateRooms(minRooms, maxRooms) {
        const rooms = [];
        const roomCount = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;
        
        for (let i = 0; i < roomCount; i++) {
            const room = this.generateValidRoom(rooms);
            if (room) {
                rooms.push(room);
            }
        }
        
        return rooms;
    }

    generateValidRoom(existingRooms, maxAttempts = 50) {
        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            const w = Math.floor(Math.random() * 4) + 4;
            const h = Math.floor(Math.random() * 3) + 4;
            const x = Math.floor(Math.random() * (this.config.WIDTH - w - 4)) + 2;
            const y = Math.floor(Math.random() * (this.config.HEIGHT - h - 4)) + 2;
            
            const newRoom = new Room(x, y, w, h);
            
            if (!this.doesRoomOverlap(newRoom, existingRooms)) {
                return newRoom;
            }
        }
        return null;
    }

    doesRoomOverlap(room, existingRooms) {
        return existingRooms.some(existingRoom => room.intersects(existingRoom));
    }

    carveRooms(map, rooms) {
        rooms.forEach(room => {
            for (let dy = 0; dy < room.h; dy++) {
                for (let dx = 0; dx < room.w; dx++) {
                    map[room.y + dy][room.x + dx] = 0;
                }
            }
        });
    }

    connectAllRooms(map, rooms) {
        if (rooms.length < 2) return;
        
        const connections = this.createRoomConnections(rooms);
        const mst = this.findMinimumSpanningTree(connections, rooms.length);
        this.createExtraConnections(map, connections, mst, rooms);
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

    createExtraConnections(map, connections, mst, rooms) {
        const extraConnections = Math.min(2, connections.length - mst.length);
        for (let i = 0; i < extraConnections; i++) {
            const randomConn = connections[Math.floor(Math.random() * connections.length)];
            if (!mst.includes(randomConn)) {
                CorridorBuilder.connectRooms(map, rooms[randomConn.from], rooms[randomConn.to]);
            }
        }
    }

    ensureConnectivity(map) {
        const visited = Array(this.config.HEIGHT).fill().map(() => Array(this.config.WIDTH).fill(false));
        const components = this.findConnectedComponents(map, visited);
        
        if (components.length > 1) {
            this.connectComponents(map, components);
        }
    }

    findConnectedComponents(map, visited) {
        const components = [];
        for (let y = 0; y < this.config.HEIGHT; y++) {
            for (let x = 0; x < this.config.WIDTH; x++) {
                if (map[y][x] === 0 && !visited[y][x]) {
                    const component = [];
                    this.floodFill(x, y, map, visited, component);
                    components.push(component);
                }
            }
        }
        return components;
    }

    floodFill(x, y, map, visited, component) {
        const stack = [{x, y}];
        const directions = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
        
        while (stack.length > 0) {
            const current = stack.pop();
            
            if (this.isInvalidCell(current.x, current.y, map, visited)) continue;
            
            visited[current.y][current.x] = true;
            component.push({ x: current.x, y: current.y });
            
            directions.forEach(dir => {
                stack.push({x: current.x + dir.x, y: current.y + dir.y});
            });
        }
    }

    isInvalidCell(x, y, map, visited) {
        return x < 0 || x >= this.config.WIDTH || 
               y < 0 || y >= this.config.HEIGHT ||
               visited[y][x] || 
               map[y][x] === 1;
    }

    connectComponents(map, components) {
        for (let i = 0; i < components.length - 1; i++) {
            const point1 = components[i][Math.floor(Math.random() * components[i].length)];
            const point2 = components[i + 1][Math.floor(Math.random() * components[i + 1].length)];
            CorridorBuilder.connectPoints(map, point1, point2);
        }
    }
}