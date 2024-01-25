const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const actionHelper = require('sys/worker/core/sys/SysActionHelper')


class CityWorkerActionStorageDeposit extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionStorageDeposit', roomData.room, gameAccess, roomData, 1, WorkerAction.DEPOSIT_SYS_STORAGE);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    ask(action) {
        const idSysStorage = action.data.getTargetId();
        const sysStorage = this.roomData.getSysStorage().getStorageFromIdStorage(idSysStorage)
        const idDeposit = sysStorage.deposit(action.creepId, action.data.resource, action.data.amount)
        if (idDeposit !== undefined) {
            action.data.idDeposit = idDeposit;
        }
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        utils.talkAction(action.creep, '🪙')
        const targetPos = action.data.getTargetPos(this.gameAccess);
        const range = 1;

        if (action.data.idDeposit === undefined) {
            this.ask(action);
        }

        const inRange = action.creep.pos.inRangeTo(targetPos, range)
        if (inRange === true) {
            const idSysStorage = action.data.getTargetId();
            const sysStorage = this.roomData.getSysStorage().getStorageFromIdStorage(idSysStorage)

            const retActionSysStorage = sysStorage.finishActionId(action.data.idDeposit);
            if (retActionSysStorage === OK) {
                // this.roomData.getSysWorker().addBodyUsage({
                //     carry: utils.countBody(action.creep.body, CARRY),
                // })
                return true;
            } else if (retActionSysStorage === ERR_TIRED) {
                sysStorage.cleanCreep(action.creepId);
                action.data.idDeposit = undefined
                return this.ask(action);
            } else {
                sysStorage.cancelAction(idSysStorage)
                return true;
            }
        } else {
            return actionHelper.getFactory().actionMove(targetPos, action.creepId, 1)
        }
    }

}

module.exports = CityWorkerActionStorageDeposit;