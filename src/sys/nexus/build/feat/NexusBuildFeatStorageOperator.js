const BuildData = require('sys/nexus/build/BuildData');
const _nexusBuilderFeat = require('sys/nexus/core/_nexusBuilderFeat');

class NexusBuildFeatStorageOperator extends _nexusBuilderFeat {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        super('Storage-operator', 200, 0)
        this.roomName = roomName;

        /** @type {BuildData[]} */
        this.endData = []

        this.levelRunned = -1;

        this.containerPos = undefined;
        this.storagePos = undefined;
        this.linkPos = undefined;
    }

    onInit(gameAccess, roomData, buildTemplate) {
        if (this.levelRunned === -1) {
            const roomName = roomData.room;
            this.levelRunned = roomData.getRoomLevel();

            this.containerPos = this.forceAddRoomName(buildTemplate.getContainer(), roomName);
            this.storagePos = this.forceAddRoomName(buildTemplate.getStorage(), roomName);
            this.linkPos = this.forceAddRoomName(buildTemplate.getLink(), roomName);
        }
        this.doCheckLevel(roomData.getRoomLevel());
        return true;
    }

    forceAddRoomName(data, roomName) {
        return {...data, roomName: roomName}
    }

    onUpdate(gameAccess, roomData, buildTemplate) {

    }

    doCheckLevel(level) {
        const mainStorageType = level >= 4 ? STRUCTURE_STORAGE : STRUCTURE_CONTAINER
        const mainStoragePos = level >= 4 ? this.storagePos : this.containerPos
        this.endData.push(this.checkPosTerrainNotWall(mainStoragePos, mainStorageType))

        if (level === 5) {
            // TODO: ask for remove older container if exist (on update ?)

            this.endData.push(this.checkPosTerrainNotWall(this.linkPos, STRUCTURE_LINK))
        }
        if (level >= 6) {
            this.endData.push(this.checkPosTerrainNotWall(this.linkPos, STRUCTURE_TERMINAL))
        }
    }

    getBuildData() {
        return this.endData || [];
    }


}

module.exports = NexusBuildFeatStorageOperator;