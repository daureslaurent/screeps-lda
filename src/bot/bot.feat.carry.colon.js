const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')
const utils = require('utils/utils')
const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const FlowType = require('core/flow/FlowType');

class BotFeatCarryColon extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatCarryColon', BotRole.CARRY_COLON, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        if (creep == null) {
            return;
        }
        const roomData = this.roomDataFactory.getRoomData(creepFast.baseRoom);

        utils.talkAction(creep, 'Co')

        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            creep.memory.action = 'WITHDRAW'
        }
        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.action = 'DEPOSIT'
        }

        if ('DEPOSIT' === creep.memory.action) {
            creep.memory.idWithdraw = undefined;

            if (!creep.memory.idDeposit) {
                const mainStorage = this.getRoomData().getSysStorage().getMainStorage();
                if (mainStorage) {
                    const distance = Math.round(creep.memory.distance * 1.15) || undefined
                    const id = mainStorage.deposit(creep.id, RESOURCE_ENERGY, creep.store[RESOURCE_ENERGY], distance)
                    if (id !== undefined) {
                        creep.memory.idDeposit = mainStorage.id;
                        creep.memory.sysStorageId = id;
                    }
                } else {
                    console.log('CARRY ====== !!! No mainStorage !')
                }
            }


            const deposit = this.gameAccess.Game.getObjectById(creep.memory.idDeposit);
            if (deposit) {
                const isArrived = creep.pos.inRangeTo(deposit, 1)
                if (isArrived) {
                    const energyAmount = creep.store[RESOURCE_ENERGY];
                    const sysStorage = this.getRoomData().getSysStorage()
                    const retFinish = sysStorage.getStorageFromIdStorage(deposit.id)
                        .finishActionId(creep.memory.sysStorageId);
                    if (retFinish === OK || retFinish === ERR_TIRED) {
                        creep.memory.idDeposit = undefined;
                        creep.memory.sysStorageId = undefined;
                        creep.memory.distance = this.gameAccess.getTime() - creep.memory.dataDistance;
                        this.getRoomData().getSysColon().getColon(creep.memory.colon.target)
                            .addEnergyExchange(energyAmount, this.gameAccess.getTime());
                        roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.COLONIES).pushInput(energyAmount)

                    }
                } else {
                    creep.moveTo(deposit, {
                        avoidRooms: roomData.getSysInterCity().getKeeperRoom(),
                    })
                }
            } else {
                utils.talkAction(creep, '👿');
                // creep.moveTo(Game.flags.A);
                // creep.memory.idDeposit = undefined;

            }
        } else {
            creep.memory.idDeposit = undefined;

            if (!creep.memory.needEvolve && creep.memory.distance !== 0 && creep.memory.distance < 500 &&
                (creep.memory.distance * 1.15) * 2 > (creep.ticksToLive - 200)) {

                if (creep.memory.needEvolve) {
                    console.log('CARRY WAITING END TICK LIVE !')
                    return;
                }
                console.log('CARRY NEED CHARGING BEFORE TRIP !')
                creep.memory.role = BotRole.RECYCLER;
                creep.memory.roleTmp = BotRole.CARRY_COLON;
                return;
            }

            if (creep.pos.roomName !== creep.memory.colon.target) {
                creep.moveTo(new RoomPosition(25, 25, creep.memory.colon.target), {
                    avoidRooms: roomData.getSysInterCity().getKeeperRoom(),
                })
                // creep.moveToRoom(creep.memory.colon.target)
                return;
            }

            if (!creep.memory.idWithdraw) {
                const {
                    storage,
                    id,
                } = this.withdraw(creep, roomData);
                if (storage != null && id != null) {
                    creep.memory.idWithdraw = storage.id
                    creep.memory.sysStorageId = id
                }
            }

            /** @type {StructureContainer} */
            const withdraw = this.gameAccess.Game.getObjectById(creep.memory.idWithdraw);
            if (withdraw) {
                const isArrived = creep.pos.inRangeTo(withdraw, 1)
                if (isArrived) {
                    const sysStorage = this.getRoomData().getSysStorage()
                    const storage = sysStorage.getStorageFromIdStorage(withdraw.id)
                    if (storage) {
                        const retFinish = storage
                            .finishActionId(creep.memory.sysStorageId);
                        if (retFinish === OK) {
                            creep.memory.idWithdraw = undefined;
                            creep.memory.sysStorageId = undefined;
                            creep.memory.action = 'DEPOSIT'
                            creep.memory.dataDistance = this.gameAccess.getTime();
                        } else {
                            console.log(`ERR ${retFinish}`)
                            creep.memory.idWithdraw = undefined;

                        }
                    }
                } else {
                    creep.moveTo(withdraw, {
                        visualizePathStyle: {
                            stroke: '#ffffff',
                        },
                    });
                }
            } else {
                creep.moveToRoom(creep.memory.colon.target, 5)
                utils.talkAction(creep, '🤷‍♂️');
            }
        }
    }

    withdraw(creep, roomData) {
        utils.talkAction(creep, '👜')

        const sysStorage = roomData.getSysStorage();
        const resource = RESOURCE_ENERGY;
        const maxAmount = creep.store.getFreeCapacity(resource);

        const storagesColon = this.getRoomData().getSysStorage().getAllStorageByRoom(creep.memory.colon.target)
            .filter(v => v.access === AccessStorage.WITHDRAW)
            .filter(v => this.gameAccess.Game.getObjectById(v.id) != null)
            .filter(v => v.getFuture(RESOURCE_ENERGY) > 300);
        const storages = storagesColon.map(s => {
            return {
                storage: s,
                amount: s.getFuture(RESOURCE_ENERGY),
            }
        })
            .filter(a => a.amount !== 0)
            .sort((a, b) => a.amount - b.amount)
            .slice(-1)[0];
        if (storages) {
            const storage = storages.storage;
            if (storage) {
                const storageUnit = sysStorage.getStorageFromIdStorage(storage.id);
                if (storageUnit && storageUnit.getFuture(resource) > 0) {
                    const maxWithdraw = Math.min(maxAmount, storageUnit.getFuture(resource))
                    const id = storageUnit.withdraw(creep.id, resource, maxWithdraw)
                    if (id !== undefined) {
                        return {
                            storage: storageUnit,
                            id: id,
                        }
                    }
                }
            }
        }

        // const storage = creep.pos.findClosestByPath(storagesColon
        //     .map(value => value.getStorage())
        // );


        utils.talkAction(creep, '🤿')
        return {
            storage: null,
            id: null,
        }
    }

    pickup(creep) {
        const droppedResource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
        if (droppedResource) {
            const pickupResult = creep.pickup(droppedResource);
            if (pickupResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(droppedResource.pos);
            }
            return OK;
        }

        // If there are no dropped resources, try to pick up from tombstones
        const tombstone = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
            filter: tomb => tomb.store.getUsedCapacity(RESOURCE_ENERGY) > 0,
        });

        if (tombstone) {
            const pickupResult = creep.withdraw(tombstone, RESOURCE_ENERGY);
            if (pickupResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(tombstone.pos);
            }
            return OK;
        }

        return undefined;
    }
}

module.exports = BotFeatCarryColon;