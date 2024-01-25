const _moduleBot = require('core/interface/_moduleBot');
const BotRole = require('core/enum/BotRole')
const utils = require('utils/utils')
const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const STORAGE_MAIN_LOW = 500

class BotFeatCarry extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatEven', BotRole.CARRY, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creep {Creep}
     * @param roomData {RoomData}
     */
    retrieveStorageWithdraw(creep, roomData) {
        const sysCity = roomData.getSysCity();
        const sysStorage = roomData.getSysStorage();
        const resource = RESOURCE_ENERGY;
        const maxAmount = creep.store.getFreeCapacity(resource);
        const mainStorage = sysStorage.getMainStorage()

        if (sysCity.needRefill()) {
            const links = sysStorage.getAllStorageAccess(AccessStorage.LINK_WITHDRAW);
            if (links.length > 0) {
                const link = links[0];
                if (link) {
                    const linkFuture = link.getFuture(RESOURCE_ENERGY)
                    if (link && linkFuture > 0) {
                        const maxWithdraw = Math.min(maxAmount, linkFuture)
                        const id = link.withdraw(creep.id, resource, maxWithdraw);
                        if (id !== undefined) {
                            return {
                                storage: link,
                                id: id,
                            }
                        }
                    }
                }
            }
            if (mainStorage) {
                const mainFuture = mainStorage.getFuture(RESOURCE_ENERGY) - maxAmount
                if (mainFuture > STORAGE_MAIN_LOW) {
                    const maxWithdraw = Math.min(maxAmount, mainFuture)
                    const id = mainStorage.withdraw(creep.id, resource, maxWithdraw);
                    if (id !== undefined) {
                        return {
                            storage: mainStorage,
                            id: id,
                        }
                    }
                }
            }

        }

        const storages = [
            ...sysStorage.getAllStorageAccess(AccessStorage.WITHDRAW),
            ...sysStorage.getAllStorageAccess(AccessStorage.LINK_WITHDRAW),
        ]
            .filter(s => s.id !== mainStorage.id)
            .filter(s => s.getAvailable(resource, -maxAmount))
            .map(s => s.getStorage())
            .filter(s => s != null);

        utils.talkAction(creep, 'A')

        if (storages.length > 0) {
            let storageResult = creep.pos.findClosestByPath(storages);
            if (storageResult) {
                const storage = sysStorage.getStorageFromIdStorage(storageResult.id)
                if (storage) {
                    const id = storage.withdraw(creep.id, resource, maxAmount);
                    if (id !== undefined) {
                        return {
                            storage: storage,
                            id: id,
                        }
                    }
                }

            }
        }

        utils.talkAction(creep, 'LOW')
        const storagesLow = [
            ...sysStorage.getAllStorageAccess(AccessStorage.WITHDRAW),
            ...sysStorage.getAllStorageAccess(AccessStorage.LINK_WITHDRAW),
        ]
            .filter(s => s.id !== mainStorage.id)
            .filter(s => s.getFuture(resource) > 0)
        if (storagesLow.length > 0) {
            let storageResult = creep.pos.findClosestByPath(storagesLow
                .map(s => s.getStorage())
                .filter(s => s != null),
            );

            if (storageResult) {
                const storage = sysStorage.getStorageFromIdStorage(storageResult.id)
                if (storage) {
                    const maxWithdraw = Math.min(maxAmount, storage.getFuture(RESOURCE_ENERGY));
                    const id = storage.withdraw(creep.id, resource, maxWithdraw);
                    if (id !== undefined) {
                        return {
                            storage: storage,
                            id: id,
                        }
                    }
                }

            }

        }

        utils.talkAction(creep, '🤿')
        return {
            storage: undefined,
            id: undefined,
        }
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        const roomData = this.roomDataFactory.getRoomData(creepFast.baseRoom);
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        utils.talkAction(creep, 'C')

        const needRefill = roomData.getSysCity().needRefill();
        // if (!roomData.baseReport.needFillingRoomEnergy) {
        //     return creep.moveTo(Game.flags.B);
        // }

        if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
            creep.memory.action = 'WITHDRAW'
        }
        if (!needRefill && creep.store.getFreeCapacity() >= creep.store.getCapacity() / 2) {
            creep.memory.action = 'WITHDRAW'
        }
        if (needRefill && creep.store.getUsedCapacity() >= creep.store.getCapacity() / 2) {
            creep.memory.action = 'DEPOSIT'
        }
        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.action = 'DEPOSIT'
        }

        if ('DEPOSIT' === creep.memory.action) {
            if (!creep.memory.idDeposit) {

                if (creep.memory.idWithdraw !== undefined) {
                    const storage = this.getRoomData()
                        .getSysStorage()
                        .getStorageFromIdStorage(creep.memory.idWithdraw)
                    // .getStorageByIdAction(creep.memory.sysStorageId);
                    if (storage) {
                        storage.cancelAction(creep.memory.sysStorageId);
                    }
                    creep.memory.idWithdraw = undefined
                    creep.memory.sysStorageId = undefined;
                }

                let deposit;
                if (needRefill === true) {
                    deposit = this.fillingRoomEnergy(creep, roomData);
                }
                if (!deposit) {
                    deposit = this.fillingMainStorage(creep, roomData);
                }
                if (!deposit) {
                    creep.memory.isWaiting = true;
                } else {
                    creep.memory.isWaiting = false;
                    creep.memory.idDeposit = deposit.id
                }
            }


            const deposit = this.gameAccess.Game.getObjectById(creep.memory.idDeposit);
            if (!deposit) {
                utils.talkAction(creep, '👿');
                // creep.moveTo(Game.flags.A);
                creep.memory.idDeposit = undefined;
                creep.memory.idWithdraw = undefined;
                return;
            }

            if (deposit.structureType === STRUCTURE_CONTAINER || deposit.structureType === STRUCTURE_STORAGE) {
                const isArrived = creep.pos.inRangeTo(deposit, 1)

                if (isArrived) {
                    const sysStorage = this.getRoomData().getSysStorage()
                    const retFinish = sysStorage.getStorageFromIdStorage(deposit.id)
                        .finishActionId(creep.memory.sysStorageId);
                    if (retFinish === OK || retFinish === ERR_TIRED) {
                        creep.memory.idDeposit = undefined;
                        creep.memory.sysStorageId = undefined;
                    }
                } else {
                    creep.moveTo(deposit, {
                        visualizePathStyle: {
                            stroke: '#ffffff',
                        },
                    });
                }
            } else if (deposit.structureType === STRUCTURE_TOWER) {
                const storedCreep = creep.store[RESOURCE_ENERGY];
                const cc = 200 - deposit.store[RESOURCE_ENERGY];
                const diffTower = cc < 0 ? 0 : cc;

                const transfert = creep.transfer(deposit, RESOURCE_ENERGY, Math.min(storedCreep, diffTower));
                if (transfert === ERR_NOT_IN_RANGE) {
                    creep.moveTo(deposit, {
                        visualizePathStyle: {
                            stroke: '#ffaa00',
                        },
                    });
                }
                if (transfert === ERR_FULL) {
                    creep.memory.idDeposit = undefined;
                }
                if (transfert === OK) {
                    creep.memory.idDeposit = undefined;
                }
            } else {
                const transfert = creep.transfer(deposit, RESOURCE_ENERGY);
                if (transfert === ERR_NOT_IN_RANGE) {
                    creep.moveTo(deposit, {
                        visualizePathStyle: {
                            stroke: '#ffaa00',
                        },
                    });
                }
                if (transfert === ERR_FULL) {
                    creep.memory.idDeposit = undefined;
                }
                if (transfert === OK) {
                    creep.memory.idDeposit = undefined;
                }
            }

        } else {
            creep.memory.idDeposit = undefined;

            if (!creep.memory.idWithdraw) {

                const {
                    storage,
                    id,
                } = this.retrieveStorageWithdraw(creep, roomData);
                if (storage != null && id != null) {
                    creep.memory.idWithdraw = storage.id
                    creep.memory.sysStorageId = id
                }
            }

            const withdraw = this.gameAccess.Game.getObjectById(creep.memory.idWithdraw);
            if (withdraw) {
                const isArrived = creep.pos.inRangeTo(withdraw, 1)
                if (isArrived) {
                    const sysStorage = this.getRoomData().getSysStorage()
                    const storage = sysStorage.getStorageFromIdStorage(withdraw.id)
                    if (storage) {
                        const retFinish = storage
                            .finishActionId(creep.memory.sysStorageId);
                        if (retFinish === OK || retFinish === ERR_TIRED) {
                            creep.memory.idWithdraw = undefined;
                            creep.memory.sysStorageId = undefined;
                        }
                    }

                } else {
                    creep.moveTo(withdraw, {
                        visualizePathStyle: {
                            stroke: '#ffffff',
                        },
                    });
                }
            }

            if (!withdraw || creep.memory.isWaiting) {
                utils.talkAction(creep, '🤷‍♂️');
                creep.memory.idWithdraw = undefined;
                creep.memory.sysStorageId = undefined;
                // creep.moveTo(Game.flags.A);
            } else if (withdraw.store[RESOURCE_ENERGY] === 0) {
                utils.talkAction(creep, '😴');
            }

        }
    }

    getFriends(creep) {
        return this.getRoomData().getCreeps()
            .filter(c => c.role === creep.memory.role)
            .map(c => this.gameAccess.Game.getObjectById(c.id));
    }

    fillingRoomEnergy(creep, roomData) {
        utils.talkAction(creep, '🎯')

        const friends = this.getFriends(creep)
            .map(c => c.memory.idDeposit);

        const energyToFill = roomData.getSysCity().getEnergyToFill()
            .map(id => this.gameAccess.Game.getObjectById(id))
        // const energyToFill = [...roomData.getEnergyToFill(), ...roomData.getTowers()]
        //     .filter(storage => {
        //         const usedByFriends = friends.includes(storage.id)
        //         console.log(`====filter ${storage.id}[${!usedByFriends}][${friends}]`)
        // return !usedByFriends
        // })
        const toFill = creep.pos.findClosestByPath(energyToFill);
        return toFill;
    }

    fillingMainStorage(creep, roomData) {
        const amount = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        const resource = RESOURCE_ENERGY;
        const mainStorageId = roomData.getSysStorage().getMainStorageId();
        utils.talkAction(creep, '🪙')
        const aux = roomData.getSysStorage().getAvailableStorageUnit(resource, amount)
            .filter(v => v.access === AccessStorage.DEPOSIT)
            .filter(v => v.id !== mainStorageId)
            .filter(a => a.getAvailable(resource, amount));
        const needAux = aux.map(v => v.getEnergy() < 1000).length;

        // const storageUnit = roomData.getSysStorage().getStorageFromIdMaster(idSpawner)[0];
        const storageUnit = roomData.getSysStorage().getMainStorage();
        if (storageUnit) {
            // console.log(`=============== CARRY getMainStorage ${storageUnit}`)
            // console.log(`=============== CARRY c1 ${storageUnit.getFuture(resource) < STORAGE_MAIN_LOW}`)
            // console.log(`=============== CARRY c2 ${needAux === 0}`)
            // console.log(`=============== CARRY needAux ${needAux}`)

            if (storageUnit.getFuture(resource) < STORAGE_MAIN_LOW || needAux === 0) {
                // console.log(`=============== CARRY C3 ${storageUnit.getAvailable(resource, amount)}`)

                if (storageUnit.getAvailable(resource, amount)) {
                    // console.log(`=============== CARRY 123 storageUnit ${storageUnit}`)
                    const ret = storageUnit.deposit(creep.id, RESOURCE_ENERGY, amount)
                    if (ret !== undefined) {
                        creep.memory.sysStorageId = ret;
                        return storageUnit;
                    }
                }
            }
        }
        // console.log(`=============== CARRY AAAAAAA aux.length ${aux.length}`)


        // console.log('aux', aux)
        if (aux.length > 0) {
            const auxRet = creep.pos.findClosestByPath(aux);
            // console.log('auxRet', auxRet)
            if (auxRet) {
                const storageUnit = roomData.getSysStorage().getStorageFromIdStorage(auxRet.id)
                const ret = storageUnit.deposit(creep.id, resource, amount)
                if (ret) {
                    creep.memory.sysStorageId = ret;
                    return storageUnit;
                }
            }
        }

        const auxLow = roomData.getSysStorage().getAvailableStorageUnit(resource, amount)
            .filter(v => v.access === AccessStorage.DEPOSIT)
            .filter(value => value.getStore().getFreeCapacity(resource) > 0)
            .sort((a, b) =>
                a.getStore().getFreeCapacity(resource) - b.getStore().getFreeCapacity(resource))
            .slice(-2);
        if (auxLow.length > 0) {
            const auxRet = creep.pos.findClosestByPath(auxLow);
            if (auxRet) {
                const storageUnit = roomData.getSysStorage().getStorageFromIdStorage(auxRet.id)
                const ret = storageUnit.deposit(creep.id, resource, amount)
                if (ret) {
                    creep.memory.sysStorageId = ret;
                    return storageUnit;
                }
            }
        }
        // if (storageUnit) {
        //     return storageUnit;
        // }
        // console.log(`=============== CARRY end no result`)

        return undefined;
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

module.exports = BotFeatCarry;