const SpawnerBodyBuilder = require('sys/spawner/builder/SpawnerBodyBuilder');
const SpawnerGenerateData = require('sys/spawner/model/SpawnerGenerateData');
const SpawnerAbstractBuilder = require('sys/spawner/builder/SpawnerAbstractBuilder');

// Spawner modules
/** @type {SpawnerAbstractBuilder[]} */
const BUILDER_MODULES = [
    require('sys/spawner/builder/ClassicCreepBuilder'),
    require('sys/spawner/builder/ColoniesCreepBuilder'),
    require('sys/spawner/builder/GroupCreepBuilder'),
]

class SpawnerSystem {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;
        /** @type {SpawnerData[]} */
        this.queue = []

        /** @type {Map<SpawnerType, SpawnerAbstractBuilder>} */
        this.builder = new Map();
        BUILDER_MODULES.forEach(m => {
            const inst = new (m)();
            this.builder.set(inst.spawnerType, inst)
        })
        this.bodyBuilder = new SpawnerBodyBuilder();
    }

    /**
     * @param level {number}
     * @return {number}
     */
    getMaxEnergy(level) {
        const maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][level];
        return 300 + ((maxExtensions) * 50);
    }

    /**
     * @param input {SpawnerData}
     * @param energyCapacityAvailable {number}
     */
    handleGenerate(input, energyCapacityAvailable, gameAccess) {
        const spawnerTyper = input.spawnerType;
        const builder = this.builder.has(spawnerTyper)
            ? this.builder.get(spawnerTyper)
            : new SpawnerAbstractBuilder('default');
        return this.createGenerateCreep(input.botRole, input.level, builder, energyCapacityAvailable, input.askData, gameAccess)
    }

    /**
     *
     * @param role {BotRole}
     * @param level {Number}
     * @param builder {SpawnerAbstractBuilder}
     * @param energyCapacityAvailable {number}
     * @param askData {{}}
     * @param gameAccess {GameAccess}
     * @return {SpawnerGenerateData}
     */
    createGenerateCreep(role, levelRaw, builder, energyCapacityAvailable, askData = undefined, gameAccess) {
        const creepName = builder.buildCreepName(role)

        const bodyInput = builder.buildCreepBody(role);
        const bodyMax = builder.buildCreepMaxBody(role);

        const recoveryMode = gameAccess.getCreepsByRoom(this.roomName).length <= 2
        const safeMode = gameAccess.getCreepsByRoom(this.roomName).length <= 4
        const level = recoveryMode ? 1 : safeMode === true ? Math.round(levelRaw/2) : levelRaw

        const energyAvailable =  Math.min(this.getMaxEnergy(level), energyCapacityAvailable)

        const bodyProcess = this.bodyBuilder.processBodyByLevel(bodyInput, bodyMax, level, energyAvailable);
        const bodyCost = bodyProcess.bodyCost;
        const body = bodyProcess.body;

        const memory = {
            role: role,
            level: level,
            bodyCost: bodyCost,
            baseRoom: this.roomName,
            needEvolve: levelRaw <= 3
        }
        const finalMemory = builder.buildCreepMemory(memory, askData);
        const hash = builder.buildCreepHash(role, level, builder.spawnerType, askData)
        const flowType = builder.buildCreepFlowCost()

        return new SpawnerGenerateData(creepName, body, finalMemory, hash, bodyCost, flowType);
    }

}

module.exports = SpawnerSystem;