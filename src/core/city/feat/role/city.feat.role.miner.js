const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const BotRole = require('core/enum/BotRole')
const WorkerType = require('sys/worker/core/model/WorkerType')
const SysWorkerOrder = require('sys/worker/core/model/WorkerOrder')
const Logs = require('utils/Logs');

class CityFeatRoleMiner extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatRoleMiner', room, gameAccess, roomData, 3);
    }

    slowRun() {
    }

    run() {
        const sysCity = this.roomData.getSysCity()
        const sysWorker = this.roomData.getSysWorker();

        if (this.roomData.getRoomLevel() >= 6) {
            this.handleExtractor(sysWorker)
        }

        let first = true;
        const needs = []
        const sources = sysCity.getSysCitySources();
        const minerStarterCount = this.roomData.getSysWorker().getNumberRunningByType(WorkerType.MINING_STARTER) || 0
        const carryCount = this.roomData.getCreeps().filter(c => c.role === BotRole.TRANSPORTER).length
        // console.log(`minerStarterCount => ${minerStarterCount}`)
        // console.log(`carryCount => ${carryCount}`)
        const numberFree = this.roomData.getCreeps()
            .filter(c => c.role === BotRole.STARTER && c.worker === undefined)
            .length;

        sources
            .filter(s => s.getFreeWorkBench() > 0)
            .filter(s => s.getSysStorage() === undefined || s.getSysStorage().getFuture(RESOURCE_ENERGY) < 2000)
            .map(s => {
                if (s.getTotalBodyFlow() < s.getNeedBodyFlow() || s.getUsedWorkBenchObj().length === 0) {
                    s.getFreeWorkBenchObj()
                        .sort((a, b) => b.position - a.position)
                        .slice(-1)
                        .forEach(wb => {
                            let type = WorkerType.MINING;
                            if (carryCount === 0 && minerStarterCount < 1 && first) {
                                type = WorkerType.MINING_STARTER;
                                first = false;
                            }
                            const pos = new RoomPosition(wb.pos.x, wb.pos.y, this.room)
                            needs.push(new SysWorkerOrder(type, pos, s.getIdBaseObject(), {
                                workBench: wb.id,
                            }))
                        })
                }

                return s
            })
            .map(s => s.getFreeWorkBench())
            .reduce((total, value) => total + value, 0);



        sysWorker.cleanOrderType(WorkerType.MINING)
        sysWorker.cleanOrderType(WorkerType.MINING_STARTER)
        needs.forEach(need => sysWorker.pushOrder(need))

    }

    handleExtractor(sysWorker) {
        sysWorker.cleanOrderType(WorkerType.EXTRACTOR)
        const sysExtractor = this.roomData.getSysCity().getSysCityMineral();
        if (sysExtractor
            && sysExtractor.getFreeWorkBench() > 0
            && sysExtractor.getNeedBodyFlow() > sysExtractor.getTotalBodyFlow()) {
            sysWorker.pushOrder(new SysWorkerOrder(WorkerType.EXTRACTOR, sysExtractor.getBestOutputStorePos()
                , sysExtractor.getMineralId(), {}));
        }
    }

}

module.exports = CityFeatRoleMiner;