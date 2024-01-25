const USE_MEMORY = false;
const SpawnerData = require('sys/spawner/model/SpawnerData');
const VisualUiBox = require('core/visual/visual.ui.box');
const NexusBuilderFeatLoader = require('sys/nexus/build/feat/FeatLoaderNexusBuilder');

class NexusBuildRef {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;

        this.featManager = new NexusBuilderFeatLoader(roomName);

        this.constructMemory();
        if (USE_MEMORY === true) {
            this.loadMemory();
        }
    }

    constructMemory() {
        if (USE_MEMORY === false) {
            Memory.sysNexus = undefined
        }
        if (!Memory.sysNexus) {
            Memory.sysNexus = {}
        }
        if (!Memory.sysNexus.base) {
            Memory.sysNexus.base = {}
        }
        if (!Memory.sysNexus.base[this.roomName]) {
            Memory.sysNexus.base[this.roomName] = {}
        }
    }
    saveMemory() {
        if (USE_MEMORY === true) {
            Memory.sysNexus.base[this.roomName].queue = this.queue;
        }
    }
    loadMemory() {
        const memory = Memory.sysNexus.base[this.roomName]
        if (memory) {
            this.queue = memory.queue.map(e => new SpawnerData(e)) || [];
        }
    }

}

module.exports = NexusCityBuilder;