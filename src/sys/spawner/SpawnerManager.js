const USE_MEMORY = false;
const SpawnerData = require('sys/spawner/model/SpawnerData');
const Logs = require('utils/Logs');
const SpawnerSystem = require('sys/spawner/SpawnerSystem');
const SpawnerScale = require('sys/spawner/SpawnerScale');
const VisualUiBox = require('core/visual/visual.ui.box');
const BotRole = require('core/enum/BotRole');
const SpawnerRecycleData = require('sys/spawner/model/SpawnerRecycleData');
const RecyclerManager = require('sys/spawner/RecyclerManager');

class SpawnerManager {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;
        /** @type {SpawnerData[]} */
        this.inputAsk = []
        /** @type {SpawnerGenerateData[]} */
        this.queue = []

        this.spawnSystem = new SpawnerSystem(roomName);
        this.spawnerScale = new SpawnerScale(roomName);
        this.recycler = new RecyclerManager(roomName);

        this.constructMemory();
        if (USE_MEMORY === true) {
            this.loadMemory();
        }

        this.lastRun = undefined;
    }

    constructMemory() {
        if (USE_MEMORY === false) {
            Memory.sysSpawner = undefined
        }
        if (!Memory.sysSpawner) {
            Memory.sysSpawner = {}
        }
        if (!Memory.sysSpawner.base) {
            Memory.sysSpawner.base = {}
        }
        if (!Memory.sysSpawner.base[this.roomName]) {
            Memory.sysSpawner.base[this.roomName] = {}
        }
    }
    saveMemory() {
        if (USE_MEMORY === true) {
            Memory.sysSpawner.base[this.roomName].queue = this.queue;
        }
    }
    loadMemory() {
        const memory = Memory.sysSpawner.base[this.roomName]
        if (memory) {
            this.queue = memory.queue.map(e => new SpawnerData(e)) || [];
        }
    }

    /**
     * @param botRole {BotRole}
     * @param level {number}
     * @param spawnerType {SpawnerType}
     * @param askData {{}}
     */
    pushAskSpawn(botRole, level, spawnerType, askData = undefined) {
        const exist = this.inputAsk
            .filter(e => e.botRole === botRole)[0];
        if (exist == null) {
            const elem = new SpawnerData(botRole, level, spawnerType, askData);
            this.inputAsk.push(elem)
        }
    }

    pushRecycle(idCreep) {
        const spawnerId = this.spawnerScale.spawnersIds[0];
        if (spawnerId == null) {
            Logs.error('cannot find spawner when push recycle !', this.roomName)
            return;
        }
        this.recycler.pushRecycle(idCreep, spawnerId);
    }

    /**
     * @param idCreep
     */
    finishRecycle(idCreep) {
        this.recycler.finishRecycle(idCreep);
    }

    /**
     * @param id {string}
     * @return {SpawnerGenerateData}
     */
    getQueue(id) {
        return this.queue.filter(e => e.id === id)[0];
    }
    /**
     * @param hash {string}
     * @return {SpawnerGenerateData}
     */
    getQueueHash(hash) {
        return this.queue.filter(e => e.hash === hash)[0];
    }
    /**
     * @param id {string}
     */
    deleteQueue(id) {
        this.queue = this.queue.filter(e => e.id !== id);
    }

    /**
     * @param id {string}
     * @return {SpawnerData}
     */
    getInputAsk(id) {
        return this.inputAsk.filter(e => e.id === id)[0];
    }
    /**
     * @param id {string}
     */
    deleteInputAsk(id) {
        this.inputAsk = this.inputAsk.filter(e => e.id !== id);
    }
    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    doSpawn(gameAccess, roomData) {
        this.spawnerScale.autoFindSpawner(gameAccess)
        this.spawnerScale.updateSpawners(gameAccess)
        if (this.inputAsk.length > 0 || this.queue.length > 0) {
            this.inputAsk
                .map(input => {
                    const energyCapacityAvailable = gameAccess.getRoom(this.roomName).energyCapacityAvailable
                    return {
                        gen: this.spawnSystem.handleGenerate(input, energyCapacityAvailable, gameAccess),
                        input: input,
                    }
                })
                .filter(genData => genData.input != null && genData.gen != null)
                .forEach(genData => {
                    const hash = genData.gen.hash;
                    if (this.getQueueHash(hash) != null) {
                        this.getQueueHash(hash).presure += 1;
                    }
                    else {
                        this.queue.push(genData.gen)
                    }
                    this.deleteInputAsk(genData.input.id);
                })
        }


        // Check Spawner - check current spawn for track end of spawn
        const spawningHash = this.spawnerScale.getSpawningHash();

        this.queue.forEach(data => {
            if (spawningHash.includes(data.hash) && !data.spawning) {
                data.setSpawn();
            }
            if (!spawningHash.includes(data.hash) && data.spawning) {
                data.setFinish();
            }
        })

        // Handle recycle
        this.recycler.update(gameAccess, roomData);

        //Handle spawn
        if (this.recycler.needRecycle() && roomData.getRoomLevel() >= 3) {
            this.lastRun = 'Recycler'
            this.recycler.doRenew(gameAccess, roomData);
        }
        else if (this.recycler.canSpawn()) {
            this.lastRun = 'Spawner'
            this.queue
                .sort((a, b) =>  (b.presure !== a.presure)
                    ? b.presure - a.presure
                    :a.cost - b.cost)
                .map(gen => {
                    return {
                        gen: gen,
                        spawnId: this.spawnerScale.getFreeSpawner(gameAccess, gen.cost),
                    }})
                .filter(data => data.gen != null && data.spawnId != null)
                .forEach(gen => this.spawnerScale
                    .spawn(gen.spawnId, gen.gen, gameAccess, roomData))
        }
        else {
            this.lastRun = 'No use'
        }
        this.queue.filter(q => q.finish)
            .forEach(q => this.deleteQueue(q.id))

    }

    externalDebugVisual(gameAccess) {
        const flagName = this.roomName + 'SP'
        const flag = Game.flags[flagName]
        if (flag == null) {
            return;
        }
        const visual = Game.rooms[this.roomName].visual;
        const pos = flag.pos;

        const box = new VisualUiBox(visual, pos);
        box.setTitle(`SysSpawner`)

        /** @type {{id: string, state: string}[]} */
        const spawners = []
        this.spawnerScale.freeSpawner.forEach(id => spawners.push({id: id , state: 'free'}))
        this.spawnerScale.idleSpawner.forEach(id => spawners.push({id: id , state: 'idle'}))
        const room = gameAccess.getRoom(this.roomName);
        const maxEnergy = room.energyCapacityAvailable
        const currentEnergy = room.energyAvailable

        box.addLine(`== Spawners == ⚡[${currentEnergy} / ${maxEnergy}]`)
        box.addLine(`= lastRun: ${this.lastRun}`)
        spawners.forEach(sd => {
            box.addLine(`- ${sd.id} - ${sd.state}`)
            if (sd.state === 'idle') {
                /** @type {StructureSpawn} */
                const spwaner = gameAccess.Game.getObjectById(sd.id);
                box.addLine(`-- ${JSON.stringify(spwaner.spawning)}`)
            }
        })

        box.addLine(`-= Queue[${this.queue.length}] =-`)
        this.queue.forEach(data => box
            .addLine(`- ${data.hash} ⚡${data.cost} 🪠${data.presure} ${data.spawning}:${data.finish}`))

        box.addLine(`-= ${this.recycler.fastMode?'🚀':''} Recycle[${this.recycler.recycles.length}] =-`)
        box.addLine(`Strategy: ${this.recycler.getStrategyRenew()}`)
        this.recycler.recycles.forEach(data => {
            box.addLine(`- [${data.costRecycle}] ${data.role}⌛${data.remains} ⌚${data.distance} ${Game.time - data.entryTime} ${data.actif ? '⚡' : ''}${data.rodin ? '🪵' : ''}`);
        })

        box.draw()
    }
}

module.exports = SpawnerManager;