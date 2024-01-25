const Utils = require('utils/utils')
const SpawnerBodyDico = require('sys/spawner/config/SpawnerBodyDico')
const FlowType = require('core/flow/FlowType')

class SpawnerAbstractBuilder {
    /**
     * @param spawnerType {SpawnerType}
     */
    constructor(spawnerType) {
        this.spawnerType = spawnerType;
    }

    /**
     * @abstract
     * @param role {BotRole}
     * @return {string}
     */
    buildCreepName(role) {
        return Utils.generateUniqueId()
    }

    /**
     * @abstract
     * @param role {BotRole}
     * @return {string[]}
     */
    buildCreepBody(role) {
        return SpawnerBodyDico.body[role];
    }

    /**
     * @abstract
     * @param role {BotRole}
     * @return {string[]}
     */
    buildCreepMaxBody(role) {
        return SpawnerBodyDico.maxBody[role];
    }

    /**
     * @abstract
     * @return {{}}
     */
    buildCreepMemory(baseMemory, askData = undefined) {
        return {
            ...baseMemory,
        }
    }

    /**
     * @abstract
     * @param role
     * @param level
     * @param spawnerType
     * @param askData
     */
    buildCreepHash(role, level, spawnerType, askData = undefined) {
        return role + ':' + level + ':' + spawnerType
    }

    /**
     * @abstract
     * @return {FlowType}
     */
    buildCreepFlowCost() {
        return FlowType.SPAWNER
    }

}

module.exports = SpawnerAbstractBuilder;