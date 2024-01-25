const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const FlowType = require('core/flow/FlowType');
const actionHelper = require('sys/worker/core/sys/SysActionHelper')

class CityWorkerActionPickTombstone extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionPickTombstone', roomData.room, gameAccess, roomData, 1, WorkerAction.PICKUP_TOMBSTONE);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        // utils.talkAction(action.creep, '⚒️')
        /** @type {Tombstone} */
        const site = action.data.getTargetObject(this.gameAccess);
        const range = 1;

        if (site != null) {
            const inRange = action.creep.pos.inRangeTo(site, range)
            if (inRange) {
                action.creep.setStatic(true);
                const ret = action.creep.withdraw(site, RESOURCE_ENERGY);
                if (ret === ERR_NOT_IN_RANGE) {
                    utils.talkAction(action.creep, `Ⓜ️`)
                }
                if (ret === OK) {
                    const powerWork = utils.countBody(action.creep.body, WORK);
                    const energyUpgrade = powerWork * UPGRADE_CONTROLLER_POWER;
                    utils.talkAction(action.creep, `⚡`)
                    // console.log(`UPGRADE [${action.creepId}]`)
                    // this.roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.UPGRADE).pushOutput(energyUpgrade)
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
        return true;
    }

}

module.exports = CityWorkerActionPickTombstone;