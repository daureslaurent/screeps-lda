const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')
const WorkerAction = require('sys/worker/core/model/WorkerAction')


class CityWorkerActionTransfer extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionTransfer', roomData.room, gameAccess, roomData, 1, WorkerAction.TRANSFER);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        utils.talkAction(action.creep, '🎯')
        const target = action.data.getTargetObject(this.gameAccess);
        const range = 1;

        const inRange = action.creep.pos.inRangeTo(target, range)
        if (inRange === true) {
            action.creep.setStatic(true);
            const transfert = action.creep.transfer(target, action.data.resource);
            // this.roomData.getSysWorker().addBodyUsage({
            //     carry: utils.countBody(action.creep.body, CARRY),
            // })
            return true;
        } else {
            const data = new SysCityWorkerModelActionData();
            data.setTargetPos(target.pos);
            data.range = 1;
            return new SysCityWorkerAction(WorkerAction.MOVE, action.creepId, data);
        }
    }

}

module.exports = CityWorkerActionTransfer;