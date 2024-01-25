const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const actionHelper = require('sys/worker/core/sys/SysActionHelper')
const FlowType = require('core/flow/FlowType');
const WorkerAction = require('sys/worker/core/model/WorkerAction');

class CityWorkerActionBuild extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionBuild', roomData.room, gameAccess, roomData, 1, WorkerAction.BUILD);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        utils.talkAction(action.creep, '⚒️')
        const site = action.data.getTargetObject(this.gameAccess);
        if (site) {
            try {
                if (site.progress === site.progressTotal) {
                    return true;
                }
            } catch (err) {
                return true;
            }

            action.creep.setStatic(true);
            const ret = action.creep.build(site);
            if (ret === ERR_NOT_IN_RANGE) {
                return actionHelper.getFactory()
                    .actionMove(action.data.getTargetPos(this.gameAccess), action.creepId, 2);
            } else if (ret === OK) {
                const powerWork = utils.countBody(action.creep.body, WORK);
                const energyConsume = Math.min(powerWork * BUILD_POWER, site.progressTotal - site.progress)
                this.roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.CONSTRUCT).pushOutput(energyConsume)
            } else {
                return true;
            }
        } else {
            return true;
        }
        // this.roomData.getSysWorker().addBodyUsage({
        //     work: utils.countBody(action.creep.body, WORK),
        //     carry: utils.countBody(action.creep.body, CARRY),
        // })
        return false;
    }

}

module.exports = CityWorkerActionBuild;