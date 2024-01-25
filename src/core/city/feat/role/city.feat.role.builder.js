const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const WorkerType = require('sys/worker/core/model/WorkerType')
const SysWorkerOrder = require('sys/worker/core/model/WorkerOrder')
const CUSTOM_ORDER = [
    STRUCTURE_CONTAINER,
    STRUCTURE_EXTENSION,
    STRUCTURE_ROAD,
]

class CityFeatRoleBuilder extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatRoleBuilder', room, gameAccess, roomData, 5);
    }

    slowRun() {
    }

    run() {
        const sysCity = this.roomData.getSysCity()
        const sysWorker = this.roomData.getSysWorker();
        const sysStorage = this.roomData.getSysStorage();
        // console.log("== CityFeatRoleBuilder ==")

        const nbConstruct = sysWorker.getNumberRunningByType(WorkerType.CONSTRUCT) || 0
        const nbRepair = sysWorker.getNumberRunningByType(WorkerType.REPAIR) || 0

        // console.log(`nbConstruct ${nbConstruct}`)
        // console.log(`nbRepair ${nbRepair}`)
        const futureMainStorageEnergy = sysStorage.getMainStorage() != null
            ? sysStorage.getMainStorage().getFuture(RESOURCE_ENERGY)
            : 0;
        //Fill order
        const consumeEnergyFlag = sysStorage.isConsumeEnergyFlag()
            && (!this.roomData.getSysCity().needRefill() || futureMainStorageEnergy > 20 * 1000);
        const constructs = sysCity.getConstructs();

        const mainStorage = sysStorage.getMainStorage();
        if (mainStorage !== undefined) {
            const mainEnergy = mainStorage.getEnergy();
            if (sysCity.getConstructs().length > 0 && this.roomData.getRoomGame().controller.ticksToDowngrade >= 30000) {
                sysCity.getSysCityController().setForceNeedBodyFlow(0)
            }
            else if (this.roomData.getRoomLevel() >= 4) {
                const controllerWork = mainEnergy < 2000 ?
                    2 :
                    mainStorage < 5000 ?
                        4 :
                        mainEnergy < 20000 ?
                            9:
                            15;
                sysCity.getSysCityController().setForceNeedBodyFlow(controllerWork)
            }
            else if (this.roomData.getRoomLevel() >= 5) {
                // const sysFlow = this.roomData.getSysCity().getSysFlow();
                //
                // const totalFlow = sysFlow.getFlowUnits()
                //     .map(fu => fu.getTotalFlow())
                //     .reduce((total, value) => total + value, 0);
                // // const metricFlow = sysFlow.getFlowUnit(FlowType.MAIN_STORAGE)
                // //     .getTotalFlow();
                //
                // const metricFlow = totalFlow - 1;
                // const corr = Math.abs(metricFlow) > 3;
                // const currentFlow = sysCity.getSysCityController().getNeedBodyFlow();
                // const fixFlow = corr
                //     ?currentFlow + (metricFlow > 0 ?+0.1 :-0.1)
                //     :currentFlow
                const controllerWork = mainEnergy < 12000 ?
                    0 :
                    mainStorage < 30000 ?
                        6 :
                        mainEnergy < 60000 ?
                            12:
                            25;
                sysCity.getSysCityController().setForceNeedBodyFlow(controllerWork)
            }
            else {
                const controllerWork = mainEnergy < 700 ?
                    2 :
                    mainStorage < 1200 ?
                        4 :
                        mainEnergy < 1500 ?
                            9:
                            15;
                sysCity.getSysCityController().setForceNeedBodyFlow(controllerWork)
            }
        }
        else {
            sysCity.getSysCityController().setForceNeedBodyFlow(constructs.length > 2 ? 1 : 8)
        }

        sysWorker.cleanOrderType(WorkerType.CONSTRUCT)

        const nbMaxConstruct = this.roomData.getRoomLevel() >= 3 ? 3 : 7
        const heavyConstruct = constructs.filter(c => c.structureType === STRUCTURE_CONTAINER ||
            c.structureType === STRUCTURE_EXTENSION ||
            c.structureType === STRUCTURE_TOWER ||
            c.structureType === STRUCTURE_STORAGE)
            .length > 0;
        const slice = heavyConstruct ? 2 : 4
        const occur = heavyConstruct ? 1 : 1

        const containStorageConstruct = constructs.filter(c => c.structureType === STRUCTURE_STORAGE);
        const isStoragePrio = containStorageConstruct.length > 0;
        if (isStoragePrio && nbConstruct < nbMaxConstruct) {
            containStorageConstruct.forEach(c => {
                sysWorker.pushOrder(new SysWorkerOrder(
                    WorkerType.CONSTRUCT,
                    c.pos,
                    c.id,
                    {
                        tgtDebug: c.id,
                    },
                ))
            })
        }
        else if (constructs.length > 0 && (consumeEnergyFlag || this.roomData.getRoomLevel() <= 2)) {
            // if (consumeEnergyFlag || this.roomData.getRoomLevel() <= 2 ) {
            const storeReady = this.roomData.getSysStorage().getAllStorage()
                .filter(s => s.getFuture(RESOURCE_ENERGY) > 100)
                .length




            if (constructs.length > 0 && nbConstruct < nbMaxConstruct && storeReady > 0) {
                constructs
                    .sort((a, b) => {
                        const roleAIndex = CUSTOM_ORDER.indexOf(a.structureType);
                        const roleBIndex = CUSTOM_ORDER.indexOf(b.structureType);
                        return roleBIndex - roleAIndex;
                    })
                    .slice(-slice)
                    .filter(id => id != null)
                    .forEach(structure => {
                        for (let i = 0; i < occur; i++) {
                            sysWorker.pushOrder(new SysWorkerOrder(
                                WorkerType.CONSTRUCT,
                                structure.pos,
                                structure.id, {
                                    tgtDebug: structure.id,
                                },
                            ))
                        }
                    })
            }
        }

        constructs.filter(c => c.structureType === STRUCTURE_WALL)
            .forEach(structure => {
                sysWorker.pushOrder(new SysWorkerOrder(
                    WorkerType.CONSTRUCT,
                    structure.pos,
                    structure.id, {
                        tgtDebug: structure.id,
                        slowUsage: true
                    },
                ))
            });



        sysWorker.cleanOrderType(WorkerType.REPAIR)
        if (this.roomData.getTowers().length === 0) {
            const repairs = sysCity.getDamages();
            if (repairs.length > 0 && nbRepair < 1) {
                repairs.slice(-1)
                    .filter(id => id != null)
                    .forEach(structure => sysWorker.pushOrder(new SysWorkerOrder(
                        WorkerType.REPAIR,
                        structure.pos,
                        structure.id, {
                            tgtDebug: structure.id,
                        },
                    )))
            }
        }

        // }
    }

}

module.exports = CityFeatRoleBuilder;