const _nexusBuilderFeatSequential = require('sys/nexus/core/_nexusBuilderFeatSequential');

class NexusBuildFeatRoad extends _nexusBuilderFeatSequential {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        super('RoadNexus', undefined, 2)
        this.roomName = roomName;

        /** @type {{x: number, y: number}[]} */
        this.rawPos = [];
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
        if (this.rawPos.length === 0) {
            this.rawPos = buildTemplate.getRoad().slice();
        }
        if (index > this.rawPos.length) {
            this.endData = this.endData.filter(d => d != null)
            return this.finishSequential();
        }

        const pos = {...this.rawPos[index], roomName: roomData.room};
        this.endData.push(this.checkPosTerrainNotWall(pos, STRUCTURE_ROAD));
    }

    getBuildData() {
        return this.endData || [];
    }

}

module.exports = NexusBuildFeatRoad;