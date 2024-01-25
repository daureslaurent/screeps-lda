const _nexusBuilderFeatSequential = require('sys/nexus/core/_nexusBuilderFeatSequential');

class NexusBuildFeatWallDefensive extends _nexusBuilderFeatSequential {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        super('WallDefensive', 50, 4)
        this.roomName = roomName;

        this.exits = undefined;
        /** @type {BuildData[]} */
        this.endData = []
    }

    /**
     * @param index {number}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param buildTemplate {BuildTemplate}
     */
    onInitSequential(index, gameAccess, roomData, buildTemplate) {
        if (this.exits === undefined) {
            this.exits = roomData.getRoomGame().find(FIND_EXIT)
                .filter(e => e != null);
        }

        if (index >= this.exits.length) {
            const raw = this.endData.slice();
            const map = new Map();
            raw.forEach(r => {
                const hash = `${r.pos.x}:${r.pos.y}`;
                if (!map.has(hash)) {
                    map.set(hash, r);
                }
            })
            this.endData = Array.from(map.values())
            return this.finishSequential();
        }
        this.endData.push(...this.checkExit(this.exits[index], roomData.getRoomGame()))
    }

    /**
     * @param exitPos
     * @param room {Room}
     * @return {BuildData[]}
     */
    checkExit(exitPos, room) {
        // Get positions around the exit
        const positionsAroundExit = room.lookForAtArea(
            LOOK_TERRAIN,
            exitPos.y - 2,
            exitPos.x - 2,
            exitPos.y + 2,
            exitPos.x + 2,
            true
        );

        // Build walls leaving 1 space around the exit
        return positionsAroundExit
            .map(tile =>
                this.checkPos(tile.x, tile.y, room.name))
            .filter(data => data != null)
    }

    /**
     * @param x {number}
     * @param y {number}
     * @param roomName {string}
     * @return {BuildData}
     */
    checkPos(x, y, roomName) {
        return this.checkPosStructureTerrain({x:x, y:y, roomName:roomName},
            terrain => terrain != 'wall',
            structureTypes => {
                const count = structureTypes
                    .filter(s => s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL)
                    .length;
                return count > 0 ? STRUCTURE_RAMPART : STRUCTURE_WALL;
            })
    }

    getBuildData() {
        return this.endData || [];
    }

    onFastCheck(buildData, gameAccess, roomData, buildTemplate) {
        return this.checkPos(buildData.pos.x, buildData.pos.y, buildData.pos.roomName);
    }

    onUpdate(gameAccess, roomData, buildTemplate) {
        this.endData = this.endData.map(data => this.onFastCheck(data))
    }
}

module.exports = NexusBuildFeatWallDefensive;