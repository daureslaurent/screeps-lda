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
        super('CityWorkerActionStorageWithdraw', roomData.room, gameAccess, roomData, 1, WorkerAction.WITHDRAW_HELPER_SYS);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    ask(action) {
        const idSysStorage = action.data.getTargetId();
        const sysStorage = this.roomData.getSysStorage().getStorageFromIdStorage(idSysStorage)

        const fixedAmount = Math.min(sysStorage.getFuture(action.data.resource), action.data.amount,
            action.creep.store.getFreeCapacity(action.data.resource))

        const idWithdraw = sysStorage
            .withdraw(action.creepId, action.data.resource, fixedAmount, action.data.timeout);

        if (idSysStorage === 'ERR_TIRED') {
            sysStorage.cleanCreep(action.creepId);
        } else if (idWithdraw !== undefined) {
            action.data.idWithdraw = idWithdraw;
        }
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        const targetPos = action.data.getTargetPos(this.gameAccess);
        if (targetPos === undefined) {
            console.log('ERREUR WITHDRAW HELPER')
            return true;
        }
        const range = 1;

        if (!action.data.idWithdraw) {
            utils.talkAction(action.creep, '❔')
            this.ask(action);
        }

        const inRange = action.creep.pos.inRangeTo(targetPos, range)
        if (inRange === true) {
            const idWithdraw = action.data.idWithdraw
            const sysStorageManager = this.roomData.getSysStorage();
            const sysStorage = sysStorageManager.getStorageFromIdStorage(action.data.getTargetId())
            const retActionSysStorage = sysStorage.finishActionId(idWithdraw);

            if (retActionSysStorage === OK) {
                // this.roomData.getSysWorker().addBodyUsage({
                //     carry: utils.countBody(action.creep.body, CARRY),
                // })

                return true;
            } else if (retActionSysStorage === ERR_TIRED) {
                sysStorage.cleanCreep(action.creepId);
                action.data.idWithdraw = undefined
                return true
            } else {
                sysStorage.cancelAction(idWithdraw)
                return true;
            }
        } else {
            return actionHelper.getFactory().actionMove(targetPos, action.creepId);
        }
    }

}

module.exports = CityWorkerActionStorageWithdraw;