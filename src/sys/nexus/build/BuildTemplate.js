const utilsBuildNexus = require('utils/utils.build.nexus');

class BuildTemplate {

    /**
     * @param posOri {RoomPosition}
     */
    constructor(posOri) {
        // TODO: DEPRECATED ! USER MORE GENERIC
        this.nexus = utilsBuildNexus.buildNexus(posOri);
    }

    getWaitingPos() {
        return this.nexus.waitingPos[0]
    }

    getExtension() {
        return this.nexus.extension;
    }

    getContainer() {
        return this.nexus.container[0];
    }

    getStorage() {
        return this.nexus.storage[0];
    }

    getLink() {
        return this.nexus.link[0];
    }

    getTerminal() {
        return this.nexus.terminal[0];
    }

    getTower() {
        return this.nexus.tower;
    }

    getRoad() {
        return this.nexus.road
    }

    getCityRampart() {
        return this.nexus.cityRampart
    }

}

module.exports = BuildTemplate;