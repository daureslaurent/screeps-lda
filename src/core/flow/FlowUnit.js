const SysCityFlowModelData = require('core/flow/FlowModelData');
const USE_MEMORY = true;

class FlowUnit {
    constructor(typeResource, roomName, fixValues, tag = false) {
        this.roomName = roomName
        this.typeResource = typeResource;
        this.flowData = new Map();
        this.maxTime = tag ? 200 : 1000;
        this.tickEnergyFlow = 0;

        this.resourceTotalInTime = 0;

        this.totalResource = 0;
        this.diff = 0;

        // fixed value
        this.fixValues = fixValues;
        this.fixedTmpValue = undefined;


        if (USE_MEMORY === true) {
            this.constructMemory();
            this.loadMemory();
        }
    }

    constructMemory() {
        if (!Memory.sysFlow) {
            Memory.sysFlow = {}
        }
        if (!Memory.sysFlow.base) {
            Memory.sysFlow.base = {}
        }
        if (!Memory.sysFlow.base[this.roomName]) {
            Memory.sysFlow.base[this.roomName] = {}
        }
        if (!Memory.sysFlow.base[this.roomName][this.typeResource]) {
            Memory.sysFlow.base[this.roomName][this.typeResource] = {}
        }
    }

    saveMemory() {
        if (USE_MEMORY === true) {
            Memory.sysFlow.base[this.roomName][this.typeResource].tickEnergyFlow = this.tickEnergyFlow;
            Memory.sysFlow.base[this.roomName][this.typeResource].totalResource = this.totalResource;
            Memory.sysFlow.base[this.roomName][this.typeResource].flowData = Array.from(this.flowData.entries());
        }
    }

    loadMemory() {
        const memory = Memory.sysFlow.base[this.roomName][this.typeResource]
        if (memory) {
            this.tickEnergyFlow = memory.tickEnergyFlow || 0;
            this.totalResource = memory.totalResource || 0;
            this.flowData = new Map(memory.flowData)
        }
    }

    update() {
        const currentTick = Game.time;

        Array.from(this.flowData.keys())
            .forEach(key => {
                if (key < currentTick - this.maxTime) {
                    this.flowData.delete(key);
                }
            })

        this.calculateEnergyFlow();
        if (USE_MEMORY === true) {
            this.saveMemory();
        }
    }

    pushInput(amount) {
        this.pushRaw(amount, true);
    }

    pushOutput(amount) {
        this.pushRaw(amount, false);
    }

    pushRaw(amountRaw, isInput) {
        const amount = isInput ? amountRaw : -amountRaw
        this.totalResource += amount;
        const time = Game.time;
        const existingData = this.flowData.get(time);

        if (existingData) {
            existingData.amount += amount;
        } else {
            this.flowData.set(time, new SysCityFlowModelData(amount, isInput));
        }
    }

    pushFixedValue(fixedAmount) {
        if (this.fixedTmpValue === undefined) {
            this.fixedTmpValue = fixedAmount;
            return;
        }
        const flow = fixedAmount - this.fixedTmpValue;
        this.fixedTmpValue = fixedAmount
        this.pushRaw(flow, true)
    }

    calculateEnergyFlow() {
        let total = 0;
        let number = 0;
        let prevData = null;
        const sortedTimes = [...this.flowData.keys()].sort((a, b) => a - b);

        for (const time of sortedTimes) {
            const data = this.flowData.get(time);
            if (prevData) {
                const diffTime = data.time - prevData.time;
                const diffPerTick = data.amount / diffTime;
                total += data.amount;
                number += diffTime;
            }
            prevData = data;
        }

        if (prevData) {
            number += Game.time - prevData.time
        }

        const rawTotal = total / number || 0;
        this.tickEnergyFlow = Math.round(rawTotal * 10) / 10;

        this.diff = total > this.resourceTotalInTime ?
            1 :
            total < this.resourceTotalInTime ?
                -1 :
                0
        this.resourceTotalInTime = total;
    }

    getTotalFlow() {
        // return this.tickEnergyFlow;
        return this.resourceTotalInTime / this.maxTime;
    }

    getLastFlow() {
        const lastData = [...this.flowData.values()].pop();
        if (!lastData || lastData.time !== Game.time) {
            return 0;
        }
        return lastData.amount;
    }

    getFastFlow() {
        const fast = (this.getTotalFlow() + (this.getLastFlow() * 2)) / 3
        return Math.round(fast * 10) / 10
    }

    getTotalResource() {
        return this.resourceTotalInTime;
        // return this.totalResource
    }

    getDiff() {
        return this.diff;
    }

    /**
     * @return {string}
     */
    getOldestTime() {
        return Array.from(this.flowData.keys())
            .sort((a, b) => b - a)
            .slice(-1)[0] || Game.time;
    }

    isFixedValue() {
        return this.fixValues;
    }
}

module.exports = FlowUnit;