const utils = require('utils/utils')
const BotRole = require('core/enum/BotRole')
const SysCitySource = require('sys/workbench/workspace/SourceWorkbench');
const USE_MEMORY = true;
const MAX_HISTORY_EXCHANGE = 500

class SysColon {
    /**
     *
     // * @param gameAccess {GameAccess}
     * @param roomName {string}
     * @param roomOri {string}
     */
    constructor(roomName, roomOri) {
        this.roomName = roomName;
        this.roomOri = roomOri;

        this.creeps = new Map();


        this.controllerId = undefined;
        this.reservation = undefined;

        this.explored = false;
        this.active = false;
        this.containSource = 0;
        this.hostile = false;
        this.constructed = false;

        this.storageEnergy = 0;
        this.containStorage = false;

        this.hostileOwner = ''
        this.amountWork = 0;
        this.distance = 0;

        this.totalGain = 0;

        this.tag = false;

        this.exchangeEnergy = []

        this.sysSourcesMap = new Map();

        this.constructMemory();
        if (USE_MEMORY === true) {
            this.loadMemory();
        }
        console.log(`SysColon create ${roomName}`);
    }

    constructMemory() {
        if (USE_MEMORY === false) {
            Memory.sysColon = undefined
        }
        if (!Memory.sysColon) {
            Memory.sysColon = {}
        }
        if (!Memory.sysColon.base) {
            Memory.sysColon.base = {}
        }
        if (!Memory.sysColon.base[this.roomOri]) {
            Memory.sysColon.base[this.roomOri] = {}
        }
        if (!Memory.sysColon.base[this.roomOri][this.roomName]) {
            Memory.sysColon.base[this.roomOri][this.roomName] = {}
        }
    }

    saveMemory() {
        if (USE_MEMORY === true) {
            Memory.sysColon.base[this.roomOri][this.roomName].explored = this.explored;
            Memory.sysColon.base[this.roomOri][this.roomName].active = this.active;
            Memory.sysColon.base[this.roomOri][this.roomName].containSource = this.containSource;
            Memory.sysColon.base[this.roomOri][this.roomName].hostile = this.hostile;
            Memory.sysColon.base[this.roomOri][this.roomName].constructed = this.constructed;
            Memory.sysColon.base[this.roomOri][this.roomName].containStorage = this.containStorage;
            Memory.sysColon.base[this.roomOri][this.roomName].storageEnergy = this.storageEnergy;
            Memory.sysColon.base[this.roomOri][this.roomName].hostileOwner = this.hostileOwner;
            Memory.sysColon.base[this.roomOri][this.roomName].amountWork = this.amountWork;
            Memory.sysColon.base[this.roomOri][this.roomName].distance = this.distance;
            Memory.sysColon.base[this.roomOri][this.roomName].exchangeEnergy = this.exchangeEnergy;
            Memory.sysColon.base[this.roomOri][this.roomName].totalGain = this.totalGain;
        }
    }

    loadMemory() {
        const memory = Memory.sysColon.base[this.roomOri][this.roomName]
        if (memory) {
            this.explored = memory.explored || false;
            this.active = memory.active || false
            this.containSource = memory.containSource || 0
            this.hostile = memory.hostile || false
            this.constructed = memory.constructed || false
            this.containStorage = memory.containStorage || false
            this.storageEnergy = memory.storageEnergy || 0
            this.hostileOwner = memory.hostileOwner || ''
            this.amountWork = memory.amountWork || 0
            this.distance = memory.distance || 0
            this.exchangeEnergy = memory.exchangeEnergy || []
            this.totalGain = memory.totalGain || 0
        }
    }

    update() {
        const count = this.exchangeEnergy
            .sort((a, b) => b.time - b.time)
            .filter(e => e.time < (Game.time - MAX_HISTORY_EXCHANGE))
            .reduce((total, value) => total + value.amount, 0);
        this.totalGain += count;
        this.exchangeEnergy = this.exchangeEnergy
            .sort((a, b) => b.time - b.time)
            .filter(e => e.time >= (Game.time - MAX_HISTORY_EXCHANGE))

        this.saveMemory();
    }

    updateGameAccess(gameAccess) {
        this.sysSourcesMap.forEach((value, key) => {
            value.update(gameAccess)
            value.externalDebug(gameAccess);
        })
    }

    getTotalGain() {
        return this.totalGain + this.exchangeEnergy
            .reduce((total, value) => total + Number(value.amount), 0);
    }

    clearCreeps() {
        this.creeps.clear();
    }

    appendCreep(creepId, role) {
        this.explored = true;
        if (!this.creeps.has(role)) {
            this.creeps.set(role, []);
        }

        const arr = this.creeps.get(role);
        if (!arr.includes(creepId)) {
            arr.push(creepId);
        }
    }

    /**
     * @param ids {string[]}
     */
    setSources(ids) {
        ids.forEach(id => {
            if (!this.sysSourcesMap.has(id)) {
                this.sysSourcesMap.set(id, new SysCitySource(id, this.roomOri, true))
            }
        })
        this.containSource = ids.length;
    }

    /**
     * @return {SysCitySource[]}
     */
    getSysSources() {
        return [].concat(...Array.from(this.sysSourcesMap.values()));
    }

    setConstructed(value) {
        this.constructed = value;
    }

    finishExploration(active) {
        this.explored = true;
        this.active = active;
        this.saveMemory();
    }

    /**
     * @param role {BotRole}
     * @return {number}
     */
    getCountByRole(role) {
        return this.creeps.has(role) ?
            this.creeps.get(role)
                .filter(c => {
                    const obj = Game.getObjectById(c);
                    return obj != null && obj.ticksToLive > 200
                })
                .length :
            0
    }

    updateReservation(tick) {
        this.reservation = tick;
    }

    updateHostile(hostile) {
        this.hostile = hostile;
    }

    updateHostileOwner(hostileOwner) {
        this.hostileOwner = hostileOwner;
    }

    updateStorage(exist, storage) {
        this.containStorage = exist;
        this.storageEnergy = storage;
    }

    updateAmountWork(amount) {
        this.amountWork = amount;
    }

    updateDistance(distance) {
        if (distance !== 0) {
            this.distance = distance;
        }
    }

    doSummary() {
        if (!this.active) {
            return undefined;
        }
        const needClaim = this.reservation != null && this.reservation < 1000
        const cristobalCount = this.hostile ? 1 : needClaim ? 1 : 0;
        // const rodrigoCount = this.amountWork > 50 ? 2 : this.containStorage ? 1 : 2;
        const multiSourceRodrigo = this.hostile ? 0 : this.containSource
        const guard = this.hostile ? 1 : 0;
        const carry = this.hostile ? 0 : this.containStorage && this.storageEnergy > 100 ? 1 : 0;
        const multiSourceCarry = carry * this.containSource;

        return {
            room: this.roomName,
            count: this.creeps.length,
            cristobal: cristobalCount - this.getCountByRole(BotRole.CRISTOBAL),
            rodrigo: multiSourceRodrigo - this.getCountByRole(BotRole.RODRIGO),
            guard: guard - this.getCountByRole(BotRole.GUARD),
            // carry: carry - this.getCountByRole(BotRole.CARRY_COLON),
            carry: 0,
            // carry: multiSourceCarry - this.getCountByRole(BotRole.CARRY_COLON),
        }
    }

    /**
     * @param amountRaw {number}
     * @param time {number}
     * @param type {BotRole}
     */
    addEnergyExchange(amountRaw, time, type = BotRole.CARRY_COLON) {
        const amount = Number(amountRaw);
        const typeEnd = type + '_' + (amount > 0 ? 'GAIN' : 'COST');

        const exchangeEnergy = {
            amount: amount,
            type: typeEnd,
            time: time,
        }
        //find duplicate
        const last = this.exchangeEnergy
            .filter(r => r.type === typeEnd)
            .filter(r => r.time >= time - 5)
            .sort((a, b) => b.time - a.time)
            .slice(-1)

        if (last.length > 0) {
            last[0].amount += amount
            last[0].time = time
        } else {
            this.exchangeEnergy.push(exchangeEnergy)
        }
    }

    /**
     * @return {{}[]}
     */
    getEnergyExchange() {
        return this.exchangeEnergy;
    }

    getCountSource() {
        return this.containSource;
    }

    getCountCreeps() {
        return this.getCreepsId().length;
    }

    /**
     * @return {string[]}
     */
    getCreepsId() {
        return utils.mapToList(this.creeps)
    }

    /**
     *
     * @param role {BotRole}
     * @return {string[]}
     */
    getCreepsIdByRole(role) {
        if (this.creeps.has(role)) {
            return this.creeps.get(role)
        }
        return []
    }

    getHostileOwner() {
        return this.hostileOwner;
    }

    /**
     * @return {number}
     */
    getDistance() {
        return this.distance;
    }

    getTag() {
        return this.tag;
    }

    getAmountWork() {
        return this.amountWork;
    }

    /**
     * @param value {boolean}
     */
    setTag(value) {
        this.tag = value;
    }
}

module.exports = SysColon;