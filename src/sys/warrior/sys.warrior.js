const SysWarriorUnit = require('src/sys/warrior/sys.warrior.unit');

class SysWarrior {
    /**
     *
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;

        this.units = [];

        // this.constructMemory();
        // this.loadMemory();
    }

    /**
     * @return {SysWarriorUnit[]}
     */
    getUnits() {
        return this.units;
    }

    /**
     * @param flagName {string}
     * @return {SysWarriorUnit|undefined}
     */
    getUnit(flagName) {
        const found = this.getUnits().filter(u => u.flagName === flagName);
        if (found != null && found.length > 0) {
            return found[0];
        }
        return undefined;
    }

    /**
     * @param type
     * @param name
     * @param flagName
     * @return {SysWarriorUnit}
     */
    createUnits(type, name, flagName) {
        const flag = Game.flags[flagName];
        const unit = new SysWarriorUnit(flag.pos.roomName, flagName, type);
        this.units.push(unit)
        return unit;
    }

    /**
     * @param flagName
     * @return {boolean}
     */
    exist(flagName) {
        return this.getUnit(flagName) !== undefined;
    }


    // constructMemory() {
    //     if (!Memory.sysCity) {
    //         Memory.sysCity = {}
    //     }
    //     if (!Memory.sysCity.base) {
    //         Memory.sysCity.base = {}
    //     }
    //     if (!Memory.sysCity.base[this.roomName]) {
    //         Memory.sysCity.base[this.roomName] = {}
    //     }
    // }

    // saveMemory() {
    //     // Memory.sysCity.base[this.roomName].explored = this.explored;
    //     // Memory.sysCity.base[this.roomName].active = this.active;
    //     // Memory.sysCity.base[this.roomName].containSource = this.containSource;
    //     // Memory.sysCity.base[this.roomName].hostile = this.hostile;
    //     // Memory.sysCity.base[this.roomName].constructed = this.constructed;
    // }

    // loadMemory() {
    //     const memory = Memory.sysCity.base[this.roomName]
    //     if (memory) {
    //         this.explored = memory.explored || false;
    //         this.active = memory.active || false
    //         this.containSource = memory.containSource || 0
    //         this.hostile = memory.hostile || false
    //         this.constructed = memory.constructed || false
    //     }
    // }

    update() {
        // this.processAverageEnergy();
        // this.saveMemory();


    }

}

module.exports = SysWarrior;