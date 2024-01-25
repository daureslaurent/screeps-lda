const Logs = require('utils/Logs');
const FlowType = require('core/flow/FlowType')

class SpawnerScale {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;
        this.spawnersIds = []
        /** @type {Map<string, StructureSpawn>} */
        this.mapSpawner = new Map();

        this.freeSpawner = [];
        this.idleSpawner = [];

        this.hashSpawning = [];
    }

    /**
     * @param id {string}
     */
    addSpawner(id) {
        const exist = this.spawnersIds
            .filter(data => data === id).length > 0;
        if (!exist) {
            this.spawnersIds.push(id);
        }
    }

    /**
     * @param gameAccess {GameAccess}
     */
    autoFindSpawner(gameAccess) {
        gameAccess.getSpawnerByRoom(this.roomName)
            .forEach(s => this.addSpawner(s.id))
    }

    /**
     * @param gameAccess {GameAccess}
     * @param cost {number}
     * @return {undefined|string}
     */
    getFreeSpawner(gameAccess, cost) {
        const energyAvailable = gameAccess.getRoom(this.roomName).energyAvailable;
        if (cost > energyAvailable) {
            return undefined;
        }
        if (this.freeSpawner.length > 0) {
            return this.freeSpawner[0]
        }
        return undefined
    }

    /**
     * @return {string[]}
     */
    getSpawningHash() {
        return this.hashSpawning;
    }

    /**
     * @param gameAccess {GameAccess}
     */
    updateSpawners(gameAccess) {
        // Refresh spawner
        this.mapSpawner.clear()
        this.freeSpawner = [];
        this.idleSpawner = [];
        this.hashSpawning = [];
        this.spawnersIds.forEach(id => {
            this.mapSpawner.set(id, gameAccess.Game.getObjectByIdNonCached(id))
            /** @type {StructureSpawn} */
            const spawner = this.mapSpawner.get(id);
            const hashSpawning = spawner.memory.hash;
            if (hashSpawning !== undefined) {
                if (!this.hashSpawning.includes(hashSpawning)) {
                    this.hashSpawning.push(hashSpawning);
                }
            }
            if (spawner.spawning) {
                this.idleSpawner.push(id);
            }
            else {
                if (hashSpawning !== undefined) {
                    spawner.memory.hash = undefined;
                }
                this.freeSpawner.push(id);
            }
        });
    }

    /**
     * @param id {string}
     * @param gameAccess {GameAccess}
     */
    getSpawnerFromId(id, gameAccess) {
        return gameAccess.Game.getObjectByIdNonCached(id);
    }

    /**
     * @param idSpawner {string}
     * @param spawnerGenerateData {SpawnerGenerateData}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    spawn(idSpawner, spawnerGenerateData, gameAccess, roomData) {
        if (!this.mapSpawner.has(idSpawner) || this.idleSpawner.includes(idSpawner)) {
            // Logs.error(`Spawner ${idSpawner} not ok`)
            return;
        }

        /** @type {StructureSpawn} */
        const spawn = this.getSpawnerFromId(idSpawner, gameAccess);
        if (spawn.spawning) {
            Logs.error(`Spawner ${idSpawner} spawning !!`)
            return;
        }

        const retSpawn = spawn.spawnCreep(
            spawnerGenerateData.body,
            spawnerGenerateData.name,
            { memory: spawnerGenerateData.memory});

        if (retSpawn === OK) {
            Logs.logA(`Spawn OK - ${spawnerGenerateData.hash}`, this.roomName)
            spawn.memory.hash = spawnerGenerateData.hash;
            this.freeSpawner = this.freeSpawner.filter(id => id !== idSpawner);
            this.idleSpawner.push(idSpawner);

            const costType = spawnerGenerateData.costType;
            if (costType != null) {
                if (costType === FlowType.COLONIES) {
                    roomData.getSysColon().getColon(spawnerGenerateData.memory.colon.target)
                        .addEnergyExchange(-spawnerGenerateData.cost, gameAccess.getTime(), spawnerGenerateData.memory.role)
                }
                roomData.getSysCity().getSysFlow().getFlowUnit(costType).pushOutput(spawnerGenerateData.cost)
            }
            return OK;
        }
        // else if (retSpawn === ERR_NOT_ENOUGH_ENERGY) {
        //     Logs.error(`error spawner energy: cost: ${spawnerGenerateData.cost}`, this.roomName)
        // }
        // else {
        //     Logs.error(`error spawner: ${retSpawn}`, this.roomName)
        // }
        return undefined
    }

}

module.exports = SpawnerScale;