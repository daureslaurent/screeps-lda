const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')
const FlowType = require('core/flow/FlowType');
const {body} = require('sys/spawner/config/SpawnerBodyDico');

// Define some constants for tower behavior
// const REPAIR_THRESHOLD = 0.98;  // Repair structures below 80% health
const REPAIR_THRESHOLD = 0.8; // Repair structures below 80% health
const MAX_WALL_REPAIR = 200 * 1000

const ATTACK_HOSTILES = true; // Set to false if you don't want to attack hostiles
class BotFeatTower extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatTower', BotRole.TOWER, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param tower {StructureTower}
     */
    run(tower) {
        const roomData = this.roomDataFactory.getRoomData(tower.pos.roomName);

        if (!Memory.hostile) {
            Memory.hostile = []
        }
        if (!Memory.hostile[tower.room.name]) {
            Memory.hostile[tower.room.name] = []
        }


        const closestHealingCreep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (creep) => creep.getActiveBodyparts(HEAL) > 0
        });

        if (closestHealingCreep && Memory.hostile[tower.room.name][closestHealingCreep.id] !== Game.time) {
            Memory.hostile[tower.room.name][closestHealingCreep.id] = Game.time;
            return tower.attack(closestHealingCreep);
        }

        // Find the closest hostile creeps
        const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        if (closestHostile && ATTACK_HOSTILES) {
            return tower.attack(closestHostile);
        }

        // Find the closest injured creep
        const closestInjuredCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (creep) => creep.hits < creep.hitsMax, /** HEAL_THRESHOLD*/
        });

        if (closestInjuredCreep) {
            return tower.heal(closestInjuredCreep);
        }

        // Find the closest damaged structure
        const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => (structure.hits < structure.hitsMax * REPAIR_THRESHOLD &&
                structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART),
        });
        if (closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
            roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.CONSTRUCT).pushOutput(10)
            return
        }

        const mainStorage = roomData.getSysStorage().getMainStorage()

        if (tower.store[RESOURCE_ENERGY] > 300 && (mainStorage) || (mainStorage && mainStorage.getEnergy() > 10000)) {
            // MIN WALL RAMPART
            const maxHit = roomData.getRoomLevel() >= 4 ? 50 * 1000 : 20 * 1000;
            const walls = tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => (structure.hits < maxHit &&
                    (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART)),
            })
                .sort((a, b) => a.hits - b.hits)[0]
            if (walls) {
                tower.repair(walls);
                roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.CONSTRUCT).pushOutput(10)
                return
            }
        }


        if (mainStorage && mainStorage.getEnergy() > 40000) {
            // Find the closest damaged structure
            const closestWall = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) =>
                    (structure.hits < MAX_WALL_REPAIR &&
                        structure.structureType === STRUCTURE_WALL) ||
                    (structure.hits < MAX_WALL_REPAIR &&
                        structure.structureType === STRUCTURE_RAMPART),
            });
            if (closestWall) {
                tower.repair(closestWall);
                roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.CONSTRUCT).pushOutput(10)
            }
        }


    }
}

module.exports = BotFeatTower;