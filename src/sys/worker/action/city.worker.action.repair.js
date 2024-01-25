const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const actionHelper = require('sys/worker/core/sys/SysActionHelper')
const FlowType = require('core/flow/FlowType');

class CityWorkerActionRepair extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionRepair', roomData.room, gameAccess, roomData, 1, WorkerAction.REPAIR);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        utils.talkAction(action.creep, '⚒️')
        const site = action.data.getTargetObject(this.gameAccess);
        if (site) {
            if (site.hits === site.hitsMax) {
                return true;
            }
            const ret = action.creep.repair(site);
            if (ret === ERR_NOT_IN_RANGE) {
                return actionHelper.getFactory()
                    .actionMove(action.data.getTargetPos(this.gameAccess), action.creepId, 1)
            } else if (ret === OK) {
                const energyPerTickPerPart = 1; // Energy units consumed per tick per WORK part

                const powerWork = utils.countBody(action.creep.body, WORK);
                const totalRepairPower = /*REPAIR_POWER **/ powerWork;

                // const maxRepairNeeded = (site.hitsMax - site.hits)/100;
                // const energyConsume = totalRepairPower;
                // const energyConsume = Math.min(totalRepairPower, maxRepairNeeded) * energyPerTickPerPart;
                this.roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.CONSTRUCT).pushOutput(totalRepairPower)
            } else if (ret !== OK) {
                return true;
            }

        } else {
            return true;
        }
        action.creep.setStatic(true);
        return false;
    }

}

module.exports = CityWorkerActionRepair;