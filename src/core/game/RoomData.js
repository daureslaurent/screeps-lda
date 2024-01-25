const SysStorageManager = require('sys/storage/sys.storage.manager');
const SysColonManager = require('sys/colon/SysColonManager');
const SysCity = require('core/city/SysCity');
const SysCityWorker = require('sys/worker/SysCityWorker')
const BotRole = require('core/enum/BotRole');
const SysCityTransporter = require('sys/worker/SysCityTransporter')
const SpawnerManager = require('sys/spawner/SpawnerManager');
const MarketManager = require('sys/market/MarketManager');
const WorkerCreepAbstract = require('sys/worker/core/WorkerCreepAbstract');
const SysColoniesWorker = require('sys/worker/SysColoniesWorker');

class RoomData {

    /**
     * @param gameAccess {GameAccess}
     * @param room {string}
     * @param username {string}
     * @param cityName {string}
     * @param interCity {InterCityManager}
     */
    constructor(
        gameAccess,
        room,
        cityName,
        interCity,
        username,
    ) {
        this.gameAccess = gameAccess;
        this.room = room;
        this.cityName = cityName;
        this.sysStorage = new SysStorageManager(gameAccess, room);
        this.sysColon = new SysColonManager(gameAccess, room);
        this.sysCity = new SysCity(room);
        this.sysWorker = new SysCityWorker(gameAccess, room, this)
        this.sysTransorter = new SysCityTransporter(gameAccess, room, this)
        this.sysColoniesWorker = new SysColoniesWorker(gameAccess, room, this)
        this.sysSpawner = new SpawnerManager(room)
        this.exclusionWithDrawCarry = []
        this.levelRoom = 0;
        this.interCity = interCity;
        this.logEvent = [];
        this.username = username;
    }

    /**
     * @returns {Structure[]}
     */
    getEnergyToFill() {
        return this.getEnergyStructures()
            .filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
    }

    /** SYS Storage **/

    /**
     *
     * @returns {SysStorageUnit[]}
     */
    getAvailableStorageUnit(resource, amount) {
        return this.sysStorage.getAllStorage()
    }


    // ==== Game uses

    /**
     * @returns {StructureExtension[]}
     */
    getEnergyStructures() {
        return this.gameAccess.getFillEnergyRoom(this.room);
    }

    /**
     * @returns {Room}
     */
    getRoomGame() {
        return this.gameAccess.getRoom(this.room);
    }

    /**
     * @returns {StructureSpawn[]}
     */
    getSpawners() {
        return this.gameAccess.getSpawnerByRoom(this.room);
    }


    /**
     * @returns {StructureTower[]}
     */
    getTowers() {
        return this.gameAccess.getTowersByRoom(this.room);
    }

    /**
     * @returns {StructureSpawn}
     */
    getMainSpawn() {
        return this.gameAccess.getSpawnerByRoom(this.room)[0];
    }

    /**
     * @returns {Creep[]}
     */
    getCreeps() {
        const concat = [this.gameAccess.getCreepsByRoom(this.room)];
        this.getSysColon()
            .getRoomsActive()
            .forEach(r => concat.push(this.gameAccess.getCreepsByRoom(r)));
        return [].concat(...concat);
    }

    /**
     * @return {Creep[]}
     */
    getCreepsForSpawn() {
        const creeps = [];

        for (var i in Game.creeps) {
            const c = Game.creeps[i];
            if (c.memory.baseRoom === this.room) {
                creeps.push(c);
            }
        }
        return creeps;
    }

    /**
     * @returns {Source[]}
     */
    getSources() {
        return this.gameAccess.getSourcesByRoom(this.room);
    }


    getSourcesForMining(idCreep) {
        const sourceReport = {}
        this.getSources()
            .map(source => source.id)
            .forEach(idSource => sourceReport[idSource] = 0);

        this.getCreeps()
            .filter(creep =>
                creep.role === BotRole.MINER &&
                creep.source !== undefined &&
                creep.id !== idCreep)
            .forEach(creep => sourceReport[creep.source]++);

        return Object.keys(sourceReport).reduce((min, source) => {
            if (sourceReport[source] < sourceReport[min]) {
                return source;
            }
            return min;
        }, Object.keys(sourceReport)[0]);
    }

    /**
     * @returns {SysStorageManager}
     */
    getSysStorage() {
        return this.sysStorage;
    }

    /**
     * @return {SysColonManager}
     */
    getSysColon() {
        return this.sysColon;
    }

    /**
     * @return {SysCityTransporter}
     */
    getSysTransporter() {
        return this.sysTransorter;
    }

    /**
     * @returns {number}
     */
    getRoomLevel() {
        return this.levelRoom;
    }

    addLogEvent(event) {
        this.logEvent.push(event);
    }

    /**
     * @return {SysCity}
     */
    getSysCity() {
        return this.sysCity;
    }

    /**
     * @return {SysCityWorker}
     */
    getSysWorker() {
        return this.sysWorker;
    }

    /**
     * @return {SysColoniesWorker}
     */
    getSysColoniesWorker() {
        return this.sysColoniesWorker;
    }

    /**
     * @return {InterCityManager}
     */
    getSysInterCity() {
        return this.interCity;
    }

    /**
     * @return {SpawnerManager}
     */
    getSysSpawner() {
        return this.sysSpawner;
    }

    /**
     * @return {MarketManager}
     */
    getSysMarket() {
        return this.sysCity.getSysMarket();
    }

    /**
     * @return {string}
     */
    getCityName() {
        return this.cityName;
    }

    getUsername() {
        return this.username;
    }

    /**
     * @return {SysWorkbench[]}
     */
    getSysWorkbenchRoom() {
        const sysCity = this.getSysCity();
        return [sysCity.getSysCityMineral(), sysCity.getSysCityController(), ...sysCity.getSysCitySources()]
            .filter(v => v != null);
    }

    /**
     * @return {SysWorkbench[]}
     */
    getSysWorkbenchColonies() {
        return this.getSysColon().getColons()
            .map(c => c.getSysSources())
            .reduce((total, value) => value.concat(total), [])
            .filter(v => v != null);
    }

}

module.exports = RoomData;