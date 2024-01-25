const GameProxy = require('core/game/GameProxy');
const BotRole = require('core/enum/BotRole')
const utilsBody = require('utils/utils.body')

class GameAccess {

    /**
     *
     * @param profiler {Profiler}
     */
    constructor(profiler) {
        this.Game = new GameProxy(profiler);
        this.profiler = profiler;
        this.name = 'GameAccess'

        /** @type {Map<string, {spawning: (boolean|Object|*), interCity: (*|undefined), role: string, charge: number, ticksToLive: (number|*), data: undefined, level: number, costBody: number, store, source: (*|undefined), body: (Array<{boost: string, type: string, hits: number}>|BodyInit|string|ReportBody|ReadableStream<Uint8Array>|HTMLElement|*), target: undefined, baseRoom: (*|string), roleTmp: (*|undefined), pos: (RoomPosition|*), needEvolve: (boolean|*), name, colon: (*|undefined), action: undefined, id, worker: (*|undefined)}>} */
        this.creepsMap = new Map();
        this.creepsFetched = false;

        this.spawnersMap = new Map();
        this.spawnersFetched = false;

        this.roomssMap = new Map();
        this.roomsFetched = false;

        this.towersMap = new Map();
        this.towersFetched = false;

        this.basicMap = new Map();
        this.basicFetched = false;

        this.energyRoomMap = new Map();
        this.energyRoomFetched = false;

        this.tick();
    }

    tick() {
        this.creepsFetched = false;
        this.spawnersFetched = false;
        this.roomsFetched = false;
        this.basicFetched = false;
        this.energyRoomFetched = false;
        this.towersFetched = false;
        this.Game.clear();
    }

    basicMapPush(key, value) {
        if (this.basicMap.has(key)) {
            this.basicMap.delete(key)
        }
        this.basicMap.set(key, value);
    }

    processBasic() {
        if (!this.basicFetched) {
            this.profiler.trace(this.name, '+processBasic');
            this.basicMapPush('Game.time', Game.time);
            this.basicFetched = true;
        }
    }


    processEnergyRoom() {
        if (!this.energyRoomFetched) {
            const opt = {
                filter: (structure) =>
                    structure.structureType === STRUCTURE_EXTENSION ||
                    structure.structureType === STRUCTURE_SPAWN,
            }
            this.profiler.trace(this.name, '+processEnergyRoom');
            this.energyRoomMap.clear();
            for (const room in this.getRooms()) {
                const energyStruct = Game.rooms[room].find(FIND_MY_STRUCTURES, opt)
                this.energyRoomMap.set(room, energyStruct);
            }
            this.energyRoomFetched = true;
        }
    }

    processTowers() {
        if (!this.towersFetched) {
            this.profiler.trace(this.name, '+processTowers');
            this.towersMap.clear();
            for (const room in this.getRooms()) {
                const towers = Game.rooms[room].find(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_TOWER);
                    },
                })
                this.towersMap.set(room, towers);
            }
            this.towersFetched = true;
        }
    }

    processCreeps() {
        if (!this.creepsFetched) {
            this.profiler.trace(this.name, '+processCreeps');
            this.creepsMap.clear();
            for (const room in this.getRooms()) {
                const creeps = Game.rooms[room].find(FIND_MY_CREEPS)
                    .map(creep => this.toFastCreep(creep))
                this.creepsMap.set(room, creeps);
            }
            this.creepsFetched = true;
        }
    }

    processRooms() {
        if (!this.roomsFetched) {
            this.profiler.trace(this.name, '+processRooms');
            this.roomssMap.clear();
            for (const room in this.getRooms()) {
                this.roomssMap.set(room, Game.rooms[room]);
            }
            this.roomsFetched = true;
        }
    }

    /**
     * @param creep
     * @return {{spawning: (boolean|Object|*), interCity: (*|undefined), role: string, charge: number, ticksToLive: (number|*), data: undefined, level: number, costBody: number, store, source: (*|undefined), body: (Array<{boost: string, type: string, hits: number}>|BodyInit|string|ReportBody|ReadableStream<Uint8Array>|HTMLElement|*), target: undefined, baseRoom: (*|string), roleTmp: (*|undefined), pos: (RoomPosition|*), needEvolve: (boolean|*), name, colon: (*|undefined), action: undefined, id, worker: (*|undefined)}}
     */
    toFastCreep(creep) {
        const creepMemory = Memory.creeps[creep.name];
        const costBody = utilsBody.getBodyCost(creep.body);
        const charge = Math
            .round(((creep.ticksToLive / CREEP_LIFE_TIME) * 100) * 10) / 10;
        if (creepMemory === undefined) {
            console.log('issue', creep)
            console.log('issue', JSON.stringify(creep.memory))
        }
        return {
            pos: creep.pos,
            id: creep.id,
            name: creep.name,
            spawning: creep.spawning,
            body: creep.body,
            ticksToLive: creep.ticksToLive,
            // carryCapacity: creep.carryCapacity,
            // carry: creep.carry,
            store: creep.store,
            // fatigue: creep.fatigue,
            // hits: creep.hits,
            // hitsMax: creep.hits
            role: creepMemory.role || BotRole.NONE,
            level: creepMemory.level || -1,
            roleTmp: creepMemory.roleTmp || undefined,
            action: creepMemory.action || undefined,
            data: creepMemory.data || undefined,
            target: creepMemory.target || undefined,
            source: creepMemory.source || undefined,
            charge: charge,
            costBody: costBody || -1,
            needEvolve: creepMemory.needEvolve || false,
            colon: creepMemory.colon || undefined,
            baseRoom: creepMemory.baseRoom || 'E22S34',
            worker: creepMemory.worker || undefined,
            interCity: creepMemory.interCity || undefined,
        }
    }

    processSpawners() {
        if (!this.spawnersFetched) {
            this.profiler.trace(this.name, '+processSpawners');
            this.spawnersMap.clear();
            for (const room in this.getRooms()) {
                const spawners = Game.rooms[room].find(FIND_MY_SPAWNS);
                this.spawnersMap.set(room, spawners);
            }
            this.spawnersFetched = true;
        }

    }

    /**
     * @return {IterableIterator<{spawning: (boolean|Object|*), interCity: (*|undefined), role: string, charge: number, ticksToLive: (number|*), data: undefined, level: number, costBody: number, store, source: (*|undefined), body: (Array<{boost: string, type: string, hits: number}>|BodyInit|string|ReportBody|ReadableStream<Uint8Array>|HTMLElement|*), target: undefined, baseRoom: (*|string), roleTmp: (*|undefined), pos: (RoomPosition|*), needEvolve: (boolean|*), name, colon: (*|undefined), action: undefined, id, worker: (*|undefined)}>}
     */
    getAllCreeps() {
        this.profiler.trace(this.name, 'getAllCreeps');
        this.processCreeps();
        return this.creepsMap.values();
    }

    /**
     * @return {{spawning: (boolean|Object|*), interCity: (*|undefined), role: string, charge: number, ticksToLive: (number|*), data: undefined, level: number, costBody: number, store, source: (*|undefined), body: (Array<{boost: string, type: string, hits: number}>|BodyInit|string|ReportBody|ReadableStream<Uint8Array>|HTMLElement|*), target: undefined, baseRoom: (*|string), roleTmp: (*|undefined), pos: (RoomPosition|*), needEvolve: (boolean|*), name, colon: (*|undefined), action: undefined, id, worker: (*|undefined)}[]}
     */
    getAllCreepsArray() {
        this.profiler.trace(this.name, 'getAllCreeps');
        this.processCreeps();
        return [].concat(...Array.from(this.creepsMap.values()));
    }

    /**
     * @param room {string}
     * @return {{spawning: (boolean|Object|*), interCity: (*|undefined), role: string, charge: number, ticksToLive: (number|*), data: undefined, level: number, costBody: number, store, source: (*|undefined), body: (Array<{boost: string, type: string, hits: number}>|BodyInit|string|ReportBody|ReadableStream<Uint8Array>|HTMLElement|*), target: undefined, baseRoom: (*|string), roleTmp: (*|undefined), pos: (RoomPosition|*), needEvolve: (boolean|*), name, colon: (*|undefined), action: undefined, id, worker: (*|undefined)}[]}
     */
    getCreepsByRoom(room) {
        this.profiler.trace(this.name, `getCreepsByRoom[${room}]`);
        this.processCreeps();
        const ret = this.creepsMap.get(room);
        if (!ret) {
            return [];
        }
        return ret;
    }

    /**
     * @param room
     * @returns {StructureTower[]}
     */
    getTowersByRoom(room) {
        this.profiler.trace(this.name, `getTowersByRoom[${room}]`);
        this.processTowers();
        return this.towersMap.get(room);
    }

    /**
     * @return {StructureTower[]}
     */
    getAllTowersArray() {
        this.profiler.trace(this.name, 'getAllTowersArray');
        this.processTowers();
        return [].concat(...Array.from(this.towersMap.values()));
    }

    /**
     * @param room
     * @returns {StructureSpawn[]}
     */
    getSpawnerByRoom(room) {
        this.profiler.trace(this.name, `getSpawnerByRoom[${room}]`);
        this.processSpawners();
        return this.spawnersMap.get(room);
    }

    /**
     * @param room
     * @return {Source[]}
     */
    getSourcesByRoom(room) {
        this.profiler.trace(this.name, `getSourcesByRoom[${room}] NoCached`);
        return Game.rooms[room].find(FIND_SOURCES)
    }

    /**
     * @return {Object<string, Room>}
     */
    getRooms() {
        this.profiler.trace(this.name, `getRooms - noCached`);
        return Game.rooms;
    }

    /**
     * @param roomName
     * @returns {Room}
     */
    getRoom(roomName) {
        this.profiler.trace(this.name, `getRoom[${roomName}]`);
        this.processRooms();
        return this.roomssMap.get(roomName);
    }

    /**
     * @param roomName {string}
     * @returns {StructureExtension[]}
     */
    getFillEnergyRoom(roomName) {
        this.profiler.trace(this.name, `getFillEnergyRoom[${roomName}]`)
        this.processEnergyRoom();
        return this.energyRoomMap.get(roomName);
    }

    // BASIC FUNCTION

    getTime() {
        this.profiler.trace(this.name, 'getTime()')
        this.processBasic();
        return this.basicMap.get('Game.time');
    }

    /**
     * @return {Profiler}
     */
    getProfiler() {
        return this.profiler;
    }

}

module.exports = GameAccess;