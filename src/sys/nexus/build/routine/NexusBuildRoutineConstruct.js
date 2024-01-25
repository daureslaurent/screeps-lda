const _nexusRoutineFeat = require('sys/nexus/core/_nexusRoutineFeat');

class NexusBuildRoutineConstruct extends _nexusRoutineFeat {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        super('Construct', 3, 0)
        this.roomName = roomName;

        /** @type {BuildData[]} */
        this.endData = []
    }

    onInit(gameAccess, roomData, buildDatas) {
        return true;
    }

    onUpdate(gameAccess, roomData, buildTemplate) {
        // roomData.getRoomGame().find(FIND_STRUCTURES)
        //     .forEach(s => console.log(s.id))
    }

    getBuildData() {
        return this.endData || [];
    }


}

module.exports = NexusBuildRoutineConstruct;