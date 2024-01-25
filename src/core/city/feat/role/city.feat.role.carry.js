const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const BotRole = require('core/enum/BotRole')
const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const WorkerType = require('sys/worker/core/model/WorkerType')
const WorkerOrder = require('sys/worker/core/model/WorkerOrder')
const Logs = require('utils/Logs');
const utilsNexus = require('utils/utils.build.nexus');

class CityFeatRoleCarry extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatRoleCarry', room, gameAccess, roomData, 2);
    }

    slowRun() {

    }

    run() {
        const sysCity = this.roomData.getSysCity()
        const sysWorker = this.roomData.getSysWorker()
        const sysTransporter = this.roomData.getSysTransporter();
        const sysStorage = this.roomData.getSysStorage();
        // console.log("== CityFeatRoleCarry ==")
        const nbRefill = sysTransporter.getNumberRunningByType(WorkerType.REFILL) || 0
        let nbCarryWorker = sysTransporter.getNumberRunningByType(WorkerType.CARRY) || 0
        // console.log(`nbRefill ${nbRefill}`)
        const countCarry = this.roomData.getCreeps().filter(c => c.role === BotRole.CARRY).length;
        const transporterCount = this.roomData.getCreeps().filter(c => (c.role === BotRole.RECYCLER ? c.roleTmp : c.role) === BotRole.TRANSPORTER).length;
        const nbOperator = this.roomData.getSysTransporter().getNumberRunningByType(WorkerType.OPERATOR) || 0

        const consumeEnergyFlag = sysStorage.isConsumeEnergyFlag()
            && !this.roomData.getSysCity().needRefill();

        if (transporterCount === 0) {
            sysWorker.cleanOrderType(WorkerType.REFILL)
            if (sysCity.needRefill() && nbRefill < 2 /*&& countCarry < 2*/) {
                const spawn = this.roomData.getSpawners()[0];
                sysWorker.pushOrder(new WorkerOrder(
                    WorkerType.REFILL,
                    spawn.pos,
                    spawn.id, {},
                ))
            }
        }

        sysTransporter.cleanOrderType(WorkerType.REFILL)
        if (sysCity.needRefill() && nbRefill < 2 /*&& countCarry < 2*/) {
            const spawn = this.roomData.getSpawners()[0];
            sysTransporter.pushOrder(new WorkerOrder(
                WorkerType.REFILL,
                spawn.pos,
                spawn.id, {},
            ))
        }

        const minStorageEnergy = 150;

        // const mainStorageId = sysStorage.getMainStorageId().filter(s => s.typeStorage !== STRUCTURE_TOWER);
        const mainStorageId = sysStorage.getMainStorageId();
        const roomStorage = sysStorage.getAllStorageByRoom(this.room)
            .filter(s => s.id !== mainStorageId)
        const nbLinkWithdraw = roomStorage.filter(s => s.access === AccessStorage.LINK_WITHDRAW).length
        const nbLinkDeposit = roomStorage.filter(s => s.access === AccessStorage.LINK_DEPOSIT).length

        const typeLink = nbLinkWithdraw === 0 && nbLinkDeposit > 0 ?
            AccessStorage.LINK_DEPOSIT :
            AccessStorage.LINK_WITHDRAW

        const storageAvailable = roomStorage
            .filter(s => s.access === AccessStorage.WITHDRAW || (s.access === typeLink && nbOperator < 1))



        // .filter(s => s.getFuture(RESOURCE_ENERGY) > minStorageEnergy)

        // const storageWithDraw = roomStorage.filter(s => s.access === AccessStorage.WITHDRAW);


        const mainStorage = sysStorage.getMainStorage();

        sysTransporter.cleanOrderType(WorkerType.CARRY)
        // if (mainStorage !== undefined && mainStorage.getFuturePercent(RESOURCE_ENERGY) < 98) {
        //     storageAvailable.forEach(s => {
        //         if (s !== undefined && s.getFuture(RESOURCE_ENERGY) > 500) {
        //             sysTransporter.pushOrder(new WorkerOrder(
        //                 WorkerType.CARRY,
        //                 s.getPos(),
        //                 s.id, {
        //                     depositSysStorage: mainStorage.id,
        //                     mandatoryWithdraw: true,
        //                 },
        //             ))
        //             nbCarryWorker++;
        //         }
        //     });
        // }

        const linkWithdraw = roomStorage.filter(s => s.access === AccessStorage.LINK_WITHDRAW);
        linkWithdraw
            .filter(s => s.getFuture(RESOURCE_ENERGY) > 0 && nbOperator < 1)
            .forEach(s => sysTransporter.pushOrder(new WorkerOrder(
                WorkerType.CARRY,
                s.getPos(),
                s.id, {
                    depositSysStorage: mainStorage.id,
                    mandatoryWithdraw: true,
                },
            )))

        this.roomData.getSysWorkbenchRoom().forEach(work => {
            if (work.getNeedCarryOutput() || work.getNeedCarryInput()) {
                sysTransporter.pushOrder(work.getWorkOrder(this.roomData))
            }
        })
        // const controllerStorage = sysCity.getSysCityController().getSysStorage();
        // if (controllerStorage !== undefined && consumeEnergyFlag) {
        //     const storageNeed = controllerStorage.getStore().getCapacity() - controllerStorage.getFuture(RESOURCE_ENERGY)
        //     const maxNeed = Math.min(500, storageNeed);
        //     if (mainStorage !== undefined && maxNeed > 200 && mainStorage.getFuture(RESOURCE_ENERGY) > maxNeed) {
        //         sysTransporter.pushOrder(new WorkerOrder(
        //             WorkerType.CARRY,
        //             mainStorage.getPos(),
        //             mainStorage.id, {
        //                 depositSysStorage: controllerStorage.id,
        //                 mandatoryWithdraw: false,
        //             },
        //         ))
        //     }
        // }
        //
        // // Carry mineral
        // const sysMineral = this.roomData.getSysCity().getSysCityMineral();
        // if (sysMineral.getNeedCarryOutput()) {
        //     const storage = sysMineral.getSysStorage();
        //     if (storage && sysMineral.typeMineral != null) {
        //         sysTransporter.pushOrder(new WorkerOrder(
        //             WorkerType.CARRY,
        //             storage.getPos(),
        //             storage.id,
        //             {
        //                 depositSysStorage: mainStorage.id,
        //                 mandatoryWithdraw: true,
        //                 resource: sysMineral.typeMineral
        //             },
        //         ))
        //     }
        // }

        // .filter(s => s.)

        sysWorker.cleanOrderType(WorkerType.UPGRADER)
        const controller = this.roomData.getRoomGame().controller;
        let nbUpgrader = this.roomData.getSysWorker().getNumberRunningByType(WorkerType.UPGRADER) || 0

        let askNumber = 0;
        const sysController = sysCity.getSysCityController();
        if (controller.level <= 2 && sysController.getSysStorage() === undefined) {
            if (nbUpgrader < 3) {
                sysController.getFreeWorkBenchObj()
                    .forEach(wb => {
                        if (askNumber < 1 && nbUpgrader < 3) {
                            const pos = new RoomPosition(wb.pos.x, wb.pos.y, this.room)
                            sysWorker.pushOrder(new WorkerOrder(WorkerType.UPGRADER, pos, controller.id, {
                                workBench: wb.id,
                            }))
                            askNumber++;
                            nbUpgrader++;
                        }
                    })
            }
        } else if (sysController.getTotalEnergyStorage() > 0 && sysController.getNeedBodyFlow() !== 0 &&
            (sysController.getTotalBodyFlow() < sysController.getNeedBodyFlow() || sysController.getUsedWorkBenchObj().length === 0)) {
            sysController.getFreeWorkBenchObj()
                .forEach(wb => {
                    if (askNumber < 2) {
                        const pos = new RoomPosition(wb.pos.x, wb.pos.y, this.room)
                        sysWorker.pushOrder(new WorkerOrder(WorkerType.UPGRADER, pos, controller.id, {
                            workBench: wb.id,
                        }))
                        askNumber++;
                    }
                })
        }

        const room = this.roomData.getRoomGame();
        if (this.tmpPickup === undefined) {
            this.tmpPickup = [];
        }
        this.tmpPickup = this.tmpPickup.filter(a => this.gameAccess.Game.getObjectById(a) != null)

        // Find all the available energy resources (dropped energy)
        sysTransporter.getWorkerOrder().cleanOrderType(WorkerType.PICKUP_DROPPED)
        room.find(FIND_DROPPED_RESOURCES, {
            filter: (resource) => {
                return resource.resourceType === RESOURCE_ENERGY;
            }
        })
            .filter(dropped => {
                // Check if the dropped resource is within the room boundaries
                return dropped.pos.x > 1 && dropped.pos.x < 48 &&
                    dropped.pos.y > 1 && dropped.pos.y < 48;
            })
            .filter(d => !this.tmpPickup.includes(d.id) && d.amount > 50)
            .forEach(dropped => {
                if (mainStorage != null) {
                    sysTransporter.getWorkerOrder().pushOrder(new WorkerOrder(
                        WorkerType.PICKUP_DROPPED,
                        dropped.pos,
                        dropped.id, {
                            depositSysStorage: mainStorage.id,
                            mandatoryWithdraw: true,
                        },
                    ))
                }
            });
        //
        // // Find all the tombstones with resources
        // sysTransporter.cleanOrderType(WorkerType.PICKUP_TOMB)
        // room.find(FIND_TOMBSTONES, {
        //     filter: (tombstone) => {
        //         return tombstone.store.getUsedCapacity() > 0;
        //     }
        // })
        //     .filter(d => !this.tmpPickup.includes(d.id))
        //     .forEach(dropped => {
        //         this.tmpPickup.push(dropped.id)
        //         sysTransporter.pushOrder(new WorkerOrder(
        //             WorkerType.PICKUP_TOMB,
        //             dropped.pos,
        //             dropped.id, {
        //                 depositSysStorage: mainStorage.id,
        //                 mandatoryWithdraw: true,
        //             },
        //         ))
        //     });

        //
        // // Loop through each energy resource and tombstone and assign creeps to gather them
        // energy.forEach((resource) => {
        //     const creep = Game.creeps['harvester' + resource.id];
        //     if (!creep) {
        //         // If no assigned creep, find a suitable creep and assign it to collect the resource
        //         const availableCreeps = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.store.getFreeCapacity() > 0);
        //         if (availableCreeps.length > 0) {
        //             availableCreeps[0].memory.target = resource.id;
        //         }
        //     }
        // });
        //
        // tombstones.forEach((tombstone) => {
        //     const creep = Game.creeps['hauler' + tombstone.id];
        //     if (!creep) {
        //         // If no assigned creep, find a suitable creep and assign it to collect from the tombstone
        //         const availableCreeps = _.filter(Game.creeps, (c) => c.memory.role === 'hauler' && c.store.getFreeCapacity() > 0);
        //         if (availableCreeps.length > 0) {
        //             availableCreeps[0].memory.target = tombstone.id;
        //         }
        //     }
        // });


        // if (consumeEnergyFlag) {
        //
        //     const freeWorker = this.roomData.getCreeps()
        //         .filter(c => c.role === BotRole.STARTER)
        //         .filter(c => c.worker === undefined)
        //         .length;
        //
        //     if (nbUpgrader < 6) {
        //         const nbOrder = freeWorker > 2 ? 2 : (freeWorker - 1)
        //         for (let i = 0; i < nbOrder; i++) {
        //             sysWorker.pushOrder(new WorkerOrder(
        //                 WorkerType.UPGRADER,
        //                 controller.pos,
        //                 controller.id,
        //                 { controller: controller.pos},
        //             ))
        //         }
        //     }
        //
        // }
        // else {
        //     if (nbUpgrader < 1) {
        //         sysWorker.pushOrder(new WorkerOrder(
        //             WorkerType.UPGRADER,
        //             controller.pos,
        //             controller.id,
        //             { controller: controller.pos},
        //         ))
        //     }
        // }


        sysTransporter.cleanOrderType(WorkerType.OPERATOR)
        const terminal = this.roomData.getRoomGame().terminal;
        if (terminal != null) {
            if (nbOperator < 1) {
                const posRaw = utilsNexus.buildNexus(this.roomData.getMainSpawn().pos, false)
                    .operatorPos[0];
                const pos = new RoomPosition(posRaw.x, posRaw.y, this.room)
                sysTransporter.pushOrder(new WorkerOrder(WorkerType.OPERATOR, pos, terminal.id, {}))
            }
        }

        const sysTransportColonies = this.roomData.getSysColoniesWorker();
        sysTransportColonies.cleanOrderType(WorkerType.CARRY_COLONIE);
        this.roomData.getSysWorkbenchColonies().forEach(work => {
            if (work.getNeedCarryOutput() || work.getNeedCarryInput()) {
                sysTransportColonies.pushOrder(work.getWorkOrder(this.roomData))
            }
        })

        // sysStorage.getAllStorageNotInRoom()
        //     .filter(s => s.getFuture(RESOURCE_ENERGY) > 500)
        //     .forEach(s => sysTransportColonies.pushOrder(new WorkerOrder(
        //         WorkerType.CARRY_COLONIE,
        //         s.getPos(),
        //         s.id,
        //         {depositSysStorage: sysStorage.getMainStorage().id}
        //     )))

    }

}

module.exports = CityFeatRoleCarry;