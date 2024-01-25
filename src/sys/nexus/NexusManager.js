const USE_MEMORY = false;
const SpawnerData = require('sys/spawner/model/SpawnerData');
const Logs = require('utils/Logs');
const SpawnerSystem = require('sys/spawner/SpawnerSystem');
const SpawnerScale = require('sys/spawner/SpawnerScale');
const VisualUiBox = require('core/visual/visual.ui.box');
const BotRole = require('core/enum/BotRole');
const SpawnerRecycleData = require('sys/spawner/model/SpawnerRecycleData');
const RecyclerManager = require('sys/spawner/RecyclerManager');
const NexusCityBuilder = require('sys/nexus/build/NexusCityBuilder');

class NexusManager {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;

        this.nexusBuilder = new NexusCityBuilder(roomName);

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

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param flag {Flag}
     */
    update(gameAccess, roomData, flag = undefined) {
        console.log(`====== UPDATE NEXUS ${this.roomName}`)
        this.nexusBuilder.update(gameAccess, roomData, flag);
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param flag {Flag}
     */
    run(gameAccess, roomData, flag = undefined) {
        console.log(`====== RUN NEXUS ${this.roomName}`)
        this.nexusBuilder.run(gameAccess, roomData, flag);

    }

}

module.exports = NexusManager;