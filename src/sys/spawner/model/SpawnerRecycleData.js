const Logs = require('utils/Logs');
const BotRole = require('core/enum/BotRole');
class SpawnerRecycleData {

    /**
     * @param idCreep {string}
     * @param spawnerId {string}
     * @param entryTime
     */
    constructor(idCreep, spawnerId, entryTime) {
        this.idCreep = idCreep;
        this.spawnerId = spawnerId;
        this.role = undefined;
        this.remains = -1;
        this.distance = -1;
        this.finish = false;
        this.rodin = false;
        this.actif = false;
        this.entryTime = entryTime;
        this.costRecycle = -1;
    }

    /**
     * @param gameAccess {GameAccess}
     */
    updateCreep(gameAccess) {
        this.actif = false;

        /** @type {Creep} */
        const creep = gameAccess.Game.getObjectById(this.idCreep);
        if (creep == null) {
            this.finish = true;
            Logs.error(`creep [${this.idCreep}] no valid ! maybe dead ?`)
            return;
        }
        if (creep.memory.role !== BotRole.RECYCLER) {
            this.finish = true;
        }
        this.remains = creep.ticksToLive;
        if (this.role === undefined) {
            this.role = creep.memory.roleTmp
        }
        if (this.spawnerId != null) {
            /** @type {StructureSpawn} */
            const spawner = gameAccess.Game.getObjectById(this.spawnerId)
            if (spawner) {
                this.distance = creep.pos.isNearTo(spawner.pos)
                    ? 1
                    : 1 + creep.pos.findPathTo(spawner.pos).length;
                    // : 10;
            }
        }
        if (this.costRecycle === -1) {
            const body = creep.body.map(b => b.type)
            this.costRecycle = Math.floor(600/body.length)
            // const bodyCost = bodyCostCalculator.calculateCost(body);
            // this.costRecycle = Math.ceil(bodyCost / 2.5 / body.length);
        }
    }


}

module.exports = SpawnerRecycleData;