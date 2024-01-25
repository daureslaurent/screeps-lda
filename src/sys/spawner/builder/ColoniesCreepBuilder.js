const SpawnerAbstractBuilder = require('sys/spawner/builder/SpawnerAbstractBuilder');
const SpawnerType = require('sys/spawner/model/SpawnerType')
const FlowType = require('core/flow/FlowType');

class ColoniesCreepBuilder extends SpawnerAbstractBuilder {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        super(SpawnerType.COLON);
    }

    buildCreepBody(role) {
        return super.buildCreepBody(role);
    }

    buildCreepMaxBody(role) {
        return super.buildCreepMaxBody(role);
    }

    buildCreepMemory(baseMemory, askData) {
        return {
            ...super.buildCreepMemory(baseMemory, askData),
            colon: {
                target: askData.target,
                ori: askData.ori,
            },
        }
    }

    buildCreepName(role) {
        return super.buildCreepName(role);
    }

    buildCreepHash(role, level, spawnerType, askData) {
        return super.buildCreepHash(role, level, spawnerType, askData) + ':' + askData.target;
    }

    buildCreepFlowCost() {
        return FlowType.COLONIES
    }
}

module.exports = ColoniesCreepBuilder;