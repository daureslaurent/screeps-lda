const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const FlowType = require('core/flow/FlowType');
const actionHelper = require('sys/worker/core/sys/SysActionHelper')

class CityWorkerActionUpgrade extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionUpgrade', roomData.room, gameAccess, roomData, 1, WorkerAction.UPGRADE);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        // utils.talkAction(action.creep, '⚒️')
        const site = action.data.getTargetObject(this.gameAccess);
        const range = 2;

        if (site) {
            const inRange = action.creep.pos.inRangeTo(site, range)
            if (inRange) {
                action.creep.setStatic(true);
                const ret = action.creep.upgradeController(site);
                if (ret === ERR_NOT_IN_RANGE) {
                    utils.talkAction(action.creep, `Ⓜ️`)

                }
                if (ret === OK) {
                    const powerWork = utils.countBody(action.creep.body, WORK);
                    const energyUpgrade = powerWork * UPGRADE_CONTROLLER_POWER;
                    utils.talkAction(action.creep, `⚡`)
                    // console.log(`UPGRADE [${action.creepId}]`)
                    this.roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.UPGRADE).pushOutput(energyUpgrade)
                    return false;
                } else if (ret !== OK) {
                    return true;
                }
            } else {
                return actionHelper.getFactory().actionMove(
                    action.data.getTargetPos(this.gameAccess),
                    action.creepId,
                    range);
            }
        }
        return false;
    }

}

module.exports = CityWorkerActionUpgrade;