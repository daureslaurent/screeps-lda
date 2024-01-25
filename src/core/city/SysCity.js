const SysCityModelEnergy = require('core/city/sys/sys.city.model.energy')
const SysCitySource = require('sys/workbench/workspace/SourceWorkbench')
const TIMEOUT_ALARM = 5;
const MAX_ENERGY_HISTORY = 5;
const SysWarrior = require('sys/warrior/sys.warrior')
const SysCityFlow = require('core/flow/FlowManager')
const ControllerWorkbench = require('sys/workbench/workspace/ControllerWorkbench')
const MarketManager = require('sys/market/MarketManager');
const NexusManager = require('sys/nexus/NexusManager');

class SysCity {
    /**
     *
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;

        this.levelRoom = 0;

        this.towerFill = false;
        this.extensionFill = false;
        this.spawnFill = false;

        this.energy = new SysCityModelEnergy(0, 0)
        this.energyHistory = [];
        this.energyAverage = 0;
        this.energyTopMax = 0;

        this.storedEnergy = 0;
        this.storedColonEnergy = 0;
        this.storedMainEnergy = 0;

        this.spawnSummary = {};
        this.spawnFuture = '';
        this.lastSpawnError = '';

        this.sysCitySource = new Map();
        this.sysCityController = new ControllerWorkbench(Game.rooms[roomName].controller.id, this.roomName)
        this.sysCityMineral = undefined;

        this.sysMarket = new MarketManager(roomName)

        this.sysNexus = new NexusManager(roomName);

        this.sysWarrior = new SysWarrior(roomName);
        this.sysFlow = new SysCityFlow(roomName);
        this.idsToFill = [];
        this.idsDamage = [];
        this.idsConstruct = [];

        this.waitingPos = new RoomPosition(25, 25, roomName);

        this.nextCheckWorkerSpawner = 0;

        this.cityAlarm = {
            lowCity: {
                value: false,
                time: -1,
            },
        }

        this.constructMemory();
        this.loadMemory();
        console.log(`sysCity create ${roomName}`);
    }

    constructMemory() {
        if (!Memory.sysCity) {
            Memory.sysCity = {}
        }
        if (!Memory.sysCity.base) {
            Memory.sysCity.base = {}
        }
        if (!Memory.sysCity.base[this.roomName]) {
            Memory.sysCity.base[this.roomName] = {}
        }
    }

    saveMemory() {
        // Memory.sysCity.base[this.roomName].explored = this.explored;
        // Memory.sysCity.base[this.roomName].active = this.active;
        // Memory.sysCity.base[this.roomName].containSource = this.containSource;
        // Memory.sysCity.base[this.roomName].hostile = this.hostile;
        // Memory.sysCity.base[this.roomName].constructed = this.constructed;
    }

    loadMemory() {
        const memory = Memory.sysCity.base[this.roomName]
        if (memory) {
            this.explored = memory.explored || false;
            this.active = memory.active || false
            this.containSource = memory.containSource || 0
            this.hostile = memory.hostile || false
            this.constructed = memory.constructed || false
        }
    }

    update() {
        this.processAverageEnergy();
        this.saveMemory();
    }

    processAverageEnergy() {
        this.energyTopMax = 0;
        const total = this.energyHistory
            .reduce((total, energy) => {
                if (this.energyTopMax < energy.currentEnergy) {
                    this.energyTopMax = energy.currentEnergy;
                }
                return total + energy.currentEnergy
            }, 0)
        this.energyAverage = total / this.energyHistory.length;
    }

    updateTowerFill(v) {
        this.towerFill = v
    }

    updateExtensionFill(v) {
        this.extensionFill = v
    }

    updateSpawnFill(v) {
        this.spawnFill = v
    }

    updateEnergyToFill(ids) {
        this.idsToFill = ids;
    }

    /**
     * @param pos {RoomPosition}
     */
    setWaitingPos(pos) {
        this.waitingPos = pos;
    }

    /**
     * @return {RoomPosition}
     */
    getWaitingPos() {
        return this.waitingPos;
    }

    /**
     * @return {string[]}
     */
    getEnergyToFill() {
        return this.idsToFill;
    }

    updateEnergy(current, max) {
        this.energy.max = max;
        this.energy.current = current;
        this.energyHistory.push(new SysCityModelEnergy(current, max));
        if (this.energyHistory.length > MAX_ENERGY_HISTORY) {
            this.energyHistory.shift();
        }
    }

    updateStoredEnergy(stored, mainStored) {
        this.storedEnergy = stored;
        this.storedMainEnergy = mainStored;
    }

    updateStoredColonEnergy(storedColon) {
        this.storedColonEnergy = storedColon;
    }

    updateLevelRoom(level) {
        this.levelRoom = level;
    }

    updateSpawnSummary(summary) {
        this.spawnSummary = summary;
    }

    updateSpawnFuture(spawnFuture) {
        this.spawnFuture = spawnFuture;
    }

    updateLastSpawnError(error) {
        this.lastSpawnError = error;
    }

    updateCityAlarm(alarm) {
        this.cityAlarm = alarm;
    }

    setNextCheckWorkerSpawner(tick) {
        this.nextCheckWorkerSpawner = tick;
    }

    getNextCheckWorkerSpawner() {
        return this.nextCheckWorkerSpawner;
    }


    updateLowCityAlarm(value, time) {
        if (value === false) {
            this.cityAlarm.lowCity.value = false
            this.cityAlarm.lowCity.time = undefined;
        } else if (this.cityAlarm.lowCity.value !== true && value === true) {
            this.cityAlarm.lowCity.value = value
            this.cityAlarm.lowCity.time = time;
        }

    }

    updateSysCitySource(idSource, gameAccess) {
        if (!this.sysCitySource.has(idSource)) {
            this.sysCitySource.set(idSource, new SysCitySource(idSource, this.roomName))
        }
        this.sysCitySource.get(idSource).update(gameAccess);
    }

    /**
     * @return {SysCitySource[]}
     */
    getSysCitySources() {
        return [].concat(...Array.from(this.sysCitySource.values()));
    }

    /**
     * @return {ControllerWorkbench}
     */
    getSysCityController() {
        return this.sysCityController;
    }

    /**
     * @param idSource {string}
     * @return {SysCitySource}
     */
    getSysCitySource(idSource) {
        return this.sysCitySource.get(idSource);
    }

    /**
     * @return {SysWarrior}
     */
    getSysWarrior() {
        return this.sysWarrior;
    }

    /**
     * @return {SysCityFlow}
     */
    getSysFlow() {
        return this.sysFlow;
    }

    needRefill() {
        return this.spawnFill ||
            this.extensionFill ||
            this.towerFill;
    }

    getAverageEnergy() {
        return this.energyAverage;
    }

    getMaxEnergy() {
        return this.energy.max;
    }

    getCurrentEnergy() {
        return this.energy.current;
    }

    getEnergyTopMax() {
        return this.energyTopMax;
    }

    getStoredMainEnergy() {
        return this.storedMainEnergy;
    }

    getStoredEnergy() {
        return this.storedEnergy;
    }

    getStoredColonEnergy() {
        return this.storedColonEnergy;
    }

    getLevelRoom() {
        return this.levelRoom;
    }

    getSpawnSummary() {
        return this.spawnSummary;
    }

    getSpawnFuture() {
        return this.spawnFuture;
    }

    getLastSpawnError() {
        return this.lastSpawnError;
    }

    /**
     * @param sysMineral {MineralWorkbench}
     */
    setSysCityMineral(sysMineral) {
        if (sysMineral != null) {
            this.sysCityMineral = sysMineral
        }
    }

    /**
     * @return {MineralWorkbench}
     */
    getSysCityMineral() {
        return this.sysCityMineral;
    }

    /**
     * @param time {Number}
     * @return {{lowCity: boolean}}
     */
    getCityAlarm(time) {
        if (this.cityAlarm.lowCity.time !== undefined &&
            time - this.cityAlarm.lowCity.time > TIMEOUT_ALARM) {
            return {
                lowCity: this.cityAlarm.lowCity.value,
            }
        }
        return {
            lowCity: false,
        }
    }

    /**
     * @return {MarketManager}
     */
    getSysMarket() {
        return this.sysMarket;
    }

    /**
     * @return {NexusManager}
     */
    getSysNexus() {
        return this.sysNexus;
    }

    setDamages(idsDamage) {
        this.idsDamage = idsDamage;
    }

    getDamages() {
        return this.idsDamage
    }

    setConstructs(idsConstruct) {
        this.idsConstruct = idsConstruct;
    }

    /**
     * @return {string[]}
     */
    getConstructs() {
        return this.idsConstruct
    }
}

module.exports = SysCity;