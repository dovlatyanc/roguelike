export class Room {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.centerX = Math.floor(x + w / 2);
        this.centerY = Math.floor(y + h / 2);
    }

    intersects(otherRoom, padding = 2) {
        return this.x < otherRoom.x + otherRoom.w + padding &&
               this.x + this.w + padding > otherRoom.x &&
               this.y < otherRoom.y + otherRoom.h + padding &&
               this.y + this.h + padding > otherRoom.y;
    }
}