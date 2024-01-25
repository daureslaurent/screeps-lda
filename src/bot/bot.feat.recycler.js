const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')
const FlowType = require('core/flow/FlowType');

class BotFeatRecycler extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatBuilder', BotRole.RECYCLER, gameAccess, roomDataFactory);

        // this.feats = [ new (require('city.feat.spawner'))(room, gameAccess, roomData)]
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        /** @type {Creep} */
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        if (creep == null) {
            return;
        }

        // if (creepFast.colon !== undefined) {
        //     // console.log('change room')
        //     if (creep.room.name !== creepFast.colon.ori) {
        //         // console.log('creep.room.name', creep.room.name);
        //
        //         // Calculate the exit position from the current room to the target room.
        //         const exit = Game.map.findExit(creep.room, creepFast.colon.ori);
        //         const exitPos = creep.pos.findClosestByRange(exit);
        //
        //         if (exitPos) {
        //             creep.moveTo(exitPos);
        //             creep.memory.roomSwap = true;
        //             return;
        //         }
        //     }
        // }

        // const roomData = this.roomDataFactory.getRoomData(creep.room.name);
        const roomData = this.getRoomData();

        const sysSpawn = roomData.getSysSpawner();
        sysSpawn.pushRecycle(creep.id)
        // const roomData = this.roomDataFactory.getRoomData(creepFast.baseRoom);
        const spawn = roomData.getMainSpawn();

        // console.log(`roomData ${roomData.room}`);
        // console.log(`spawn ${spawn}`);

        if (creep.memory.roomSwap) {
            // console.log('roomSwap');
            // Check if the creep is now in the target room, and reset the roomSwap flag.
            if (creep.room.name === creepFast.colon.ori) {
                creep.memory.roomSwap = false;
            } else {
                // Handle cases where the creep is still in the previous room.
                // You may want to implement some fallback logic here.
                // console.log("Creep is still in the previous room.");
            }
        }

        // console.log(`recycler -> firstRecycle[${creep.memory.firstRecycle}]`)
        //
        // if (!creep.memory.firstRecycle) {
        //     creep.memory.firstRecycle = true;
        //     if (creep.memory.sysStorageId) {
        //         roomData.sysStorage.getStorageByIdAction(creep.memory.sysStorageId)
        //             .cancelAction(creep.memory.sysStorageId);
        //         creep.memory.sysStorageId = undefined;
        //     }
        // }
        // console.log(`recycler -> store[${creep.store[RESOURCE_ENERGY]}]`)
        //
        //
        // if (creep.store[RESOURCE_ENERGY] > 0) {
        //     console.log(`recycler -> sysStorageId[${creep.memory.sysStorageId}]`)
        //
        //     if (creep.memory.sysStorageId === undefined) {
        //         const mainStorage = this.getRoomData().sysStorage.getMainStorage();
        //         if (mainStorage) {
        //             const ret = mainStorage.deposit(creep.id, RESOURCE_ENERGY, creep.store[RESOURCE_ENERGY])
        //             console.log(`clean energy creep ret ${ret}`)
        //
        //             if (ret) {
        //                 creep.memory.sysStorageId = ret;
        //                 creep.memory.idStorage = mainStorage.getId();
        //             }
        //             else {
        //                 creep.memory.sysStorageId = undefined;
        //                 creep.memory.idStorage = undefined;
        //             }
        //         }
        //     }
        //
        //
        //     if (creep.memory.idStorage) {
        //         const storage = this.gameAccess.Game.getObjectById(creep.memory.idStorage);
        //         console.log(`clean energy creep ${storage} ${creep.memory.sysStorageId}`)
        //         if (storage) {
        //             const isArrived = creep.pos.inRangeTo(storage, 1)
        //             if (isArrived) {
        //                 const sysStorage = this.getRoomData().getSysStorage()
        //                 const retFinish = sysStorage.getStorageFromIdStorage(storage.id)
        //                     .finishActionId(creep.memory.sysStorageId);
        //                 if (retFinish === OK || retFinish === 'NOT_FOUND' || retFinish === ERR_NOT_ENOUGH_ENERGY) {
        //                     console.log(`Debug carry [${creep.id}] - reset target`)
        //                     creep.memory.idStorage = undefined;
        //                     creep.memory.sysStorageId = undefined;
        //                 }
        //             }
        //             else {
        //                 creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
        //             }
        //         }
        //         else {
        //             creep.memory.idStorage = undefined;
        //             creep.memory.sysStorageId = undefined;
        //         }
        //
        //     }
        //
        // }
        // else {
        // console.log(`recycling ${creepFast.charge}% [${creep.ticksToLive}][${creepFast.roleTmp}]`)
        // const prc = (creep.room.energyAvailable / creep.room.energyCapacityAvailable) * 100
        // const minsNb = this.getFriends(creep).map(c => c.ticksToLive).length

        // if (creepFast.charge > 50 && prc < 20) {
        //     console.log(`Forced stop recycle`)
        //     creep.memory.recyclingId = undefined;
        //     creep.memory.role = String(creep.memory.roleTmp);
        //     sysSpawn.finishRecycle(creep.id)
        //
        //     return;
        // }


        if (spawn) {
            if (!creep.pos.isNearTo(spawn.pos)) {
                creep.moveTo(spawn.pos)
            }
            return;
            creep.memory.recyclingId = spawn.id;

            // const mins = this.getFriends(creep).map(c => c.ticksToLive)
            // const minTickToLive = Math.min(...mins);
            // if (minTickToLive < 100 && minTickToLive === Number.parseInt(creep.ticksToLive)
            //     || minTickToLive > 100) {

            const diffTick = creep.ticksToLive - creep.memory.debugTick;
            creep.memory.debugTick = creep.ticksToLive;
            creep.memory.recyclerDiff = diffTick;

            creep.setStatic(true);

            const renewalCostPercentage = 0.1; // Renewal cost percentage, set to 10%
            const energyRequired = Math.ceil(spawn.energyCapacity * renewalCostPercentage);
            // console.log(`Energy required to renew the creep: ${energyRequired}`);

            let recycleResult = spawn.renewCreep(creep);
            // console.log(`recycleResult ${recycleResult}`)

            if (recycleResult === OK && diffTick > 0) {
                const renewalCostPercentage = 0.1; // Renewal cost percentage, set to 10%
                const cost = Math.ceil( spawn.energyCapacity * renewalCostPercentage);
                if (creep.memory.colon !== undefined && creep.memory.roleTmp !== BotRole.EXPLORER) {
                    const sysColon = this.getRoomData().getSysColon().getColon(creep.memory.colon.target);
                    if (!sysColon) {
                        creep.memory.role = BotRole.NONE
                        creep.memory.roleTmp = BotRole.NONE
                        return;
                    }
                    roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.COLONIES).pushOutput(cost)

                    sysColon.addEnergyExchange(-cost, this.gameAccess.getTime(), creep.memory.roleTmp)
                    // console.log(`==> push cost for ${sysColon.roomName}`)
                } else {
                    roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.SPAWNER).pushOutput(energyRequired)
                }

                console.log(`==> Charging at ${creepFast.charge}% [${creep.ticksToLive}][${creepFast.roleTmp}] diff[${diffTick}]`)
                return;
            }
            if (recycleResult === ERR_FULL) {
                creep.memory.recyclingId = undefined;
                creep.memory.role = String(creep.memory.roleTmp);
                sysSpawn.finishRecycle(creep.id)

            }
            else if (recycleResult === ERR_NOT_IN_RANGE || -7) {
                creep.moveTo(spawn.pos);
                creep.setStatic(false);
            }
            else {
                console.log('err recycling', recycleResult);
            }


            // }
            // else {
            //     console.log('waiting turn recycling')
            // }


        } else {
            console.log(`No spawns found to recycle creep ${creep.name}`);
        }
    }

    /**
     * @param creep
     * @return {Creep[]}
     */
    getFriends(creep) {
        return this.getRoomData().getCreeps()
            .map(c => this.gameAccess.Game.getObjectById(c.id))
            .filter(c => c != null)
            .filter(c => c.memory.role === BotRole.RECYCLER && c.pos.roomName === creep.pos.roomName)
            .filter(c => c.memory.recyclingId === creep.memory.recyclingId);
    }


    explore() {

    }
}

module.exports = BotFeatRecycler;