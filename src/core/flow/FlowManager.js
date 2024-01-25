const FlowType = require('core/flow/FlowType')
const FlowUnit = require('core/flow/FlowUnit')

/** @type {FlowType[]} */
const PRE_INIT_RESOURCES = [
    FlowType.MINING,
    FlowType.CONSTRUCT,
    FlowType.UPGRADE,
    FlowType.SPAWNER,
    FlowType.COLONIES,
    FlowType.INTERCITY,
]
const FLOW_TAG_RESOURCES = [
    FlowType.MINING,
    FlowType.CONSTRUCT,
    FlowType.UPGRADE,
    FlowType.SPAWNER,
    FlowType.INTERCITY,
]

/** @type {FlowType[]} */
const PRE_INIT_RESOURCES_FIXED = [
    FlowType.MAIN_STORAGE,
]

class FlowManager {
    constructor(roomName) {
        this.roomName = roomName;
        /** @type {Map<FlowType, FlowUnit>} */
        this.flowMap = new Map();

        PRE_INIT_RESOURCES.forEach(type => this.flowMap
            .set(type, new FlowUnit(type, roomName, false, FLOW_TAG_RESOURCES.includes(type))));

        PRE_INIT_RESOURCES_FIXED.forEach(type => this.flowMap
            .set(type, new FlowUnit(type, roomName, true)));
    }

    update() {
        this.getFlowUnits().forEach(fu => fu.update());
        this.getFlowUnitsFixed().forEach(fu => fu.update());
    }

    /**
     * @return {FlowUnit[]}
     */
    getFlowUnits() {
        return [].concat(...Array.from(this.flowMap.values()))
            .filter(f => !f.isFixedValue());
    }

    /**
     * @return {FlowUnit[]}
     */
    getFlowUnitsFixed() {
        return [].concat(...Array.from(this.flowMap.values()))
            .filter(f => f.isFixedValue());
    }

    /**
     * @param type {FlowType}
     * @return {undefined|FlowUnit}
     */
    getFlowUnit(type) {
        if (this.flowMap.has(type)) {
            return this.flowMap.get(type);
        }
        return undefined;
    }

    getTotalFlow() {
        const total = this.getFlowUnits()
            .reduce((total, value) => total + value.getTotalFlow(), 0)
        return Math.round(total * 10) / 10
    }
}

module.exports = FlowManager;