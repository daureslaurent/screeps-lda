const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const actionHelper = require('sys/worker/core/sys/SysActionHelper')


class CityWorkerActionStorageWithdraw extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionStorageWithdraw', roomData.room, gameAccess, roomData, 1, WorkerAction.WITHDRAW_SYS_STORAGE);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    ask(action) {
        const idSysStorage = action.data.getTargetId();
        const sysStorage = this.roomData.getSysStorage().getStorageFromIdStorage(idSysStorage)
        const idWithdraw = sysStorage
            .withdraw(action.creepId, action.data.resource, action.data.amount, 20);
        if (idSysStorage === 'ERR_TIRED') {
            sysStorage.cleanCreep(action.creepId);
        } else if (idWithdraw !== undefined) {
            // this.roomData.getSysWorker().addBodyUsage({
            //     carry: utils.countBody(action.creep.body, CARRY),
            // })
            action.data.idWithdraw = idWithdraw;
        }
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        utils.talkAction(action.creep, '🛍️')
        const targetPos = action.data.getTargetPos(this.gameAccess);
        const range = 1;

        if (!action.data.idWithdraw) {
            this.ask(action);
        }

        const inRange = action.creep.pos.inRangeTo(targetPos, range)
        if (inRange === true) {
            const idSysStorage = action.data.getTargetId();
            const sysStorage = this.roomData.getSysStorage().getStorageFromIdStorage(idSysStorage)

            const retActionSysStorage = sysStorage.finishActionId(action.data.idWithdraw);

            if (retActionSysStorage === OK) {
                return true;
            } else if (retActionSysStorage === ERR_TIRED) {
                sysStorage.cleanCreep(action.creepId);
                action.data.idWithdraw = undefined
                return true
            } else {
                sysStorage.cancelAction(idSysStorage)
                return true;
            }
        } else {
            return actionHelper.getFactory().actionMove(targetPos, action.creepId);
        }
    }

}

module.exports = CityWorkerActionStorageWithdraw;