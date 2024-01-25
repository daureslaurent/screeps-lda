const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const WorkerAction = require('sys/worker/core/model/WorkerAction')
const actionHelper = require('sys/worker/core/sys/SysActionHelper')
const FlowType = require('core/flow/FlowType');


class CityWorkerActionStorageDepositHelper extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionStorageDepositHelper', roomData.room, gameAccess, roomData, 1, WorkerAction.DEPOSIT_HELPER_SYS);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    ask(action) {
        const idSysStorage = action.data.getTargetId();
        const roomData = action.data.customRoomData !== undefined ?
            this.roomData.getSysInterCity().getRoomDataForRoom(action.data.customRoomData) :
            this.roomData;
        const sysStorage = roomData.getSysStorage().getStorageFromIdStorage(idSysStorage)

        const idDeposit = sysStorage
            .deposit(action.creepId, action.data.resource, action.data.amount, action.data.timeout);

        if (idSysStorage === 'ERR_TIRED') {
            sysStorage.cleanCreep(action.creepId);
        } else if (idDeposit !== undefined) {
            action.data.idDeposit = idDeposit;
        }
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        const targetPos = action.data.getTargetPos(this.gameAccess);
        if (targetPos === undefined) {
            console.log('ERREUR DEPOSIT HELPER')
            return true;
        }
        const range = 1;

        if (!action.data.idDeposit) {
            this.ask(action);
        }

        const inRange = action.creep.pos.inRangeTo(targetPos, range)
        if (inRange === true) {
            const idDeposit = action.data.idDeposit

            const roomData = action.data.customRoomData !== undefined ?
                this.roomData.getSysInterCity().getRoomDataForRoom(action.data.customRoomData) :
                this.roomData;

            const sysStorageManager = roomData.getSysStorage();

            const sysStorage = sysStorageManager.getStorageFromIdStorage(action.data.getTargetId())
            const retActionSysStorage = sysStorage.finishActionId(idDeposit);
            if (retActionSysStorage === OK) {
                // roomData.getSysWorker().addBodyUsage({
                //     carry: utils.countBody(action.creep.body, CARRY),
                // })

                if (action.data.customRoomData !== undefined) {
                    roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.INTERCITY).pushInput(action.data.amount)
                    this.roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.INTERCITY).pushOutput(action.data.amount)
                }

                return true;
            } else if (retActionSysStorage === ERR_TIRED) {
                sysStorage.cleanCreep(action.creepId);
                action.data.idDeposit = undefined
                return true
            } else {
                sysStorage.cancelAction(idDeposit)
                return true;
            }
        } else {
            return actionHelper.getFactory().actionMove(targetPos, action.creepId);
        }
    }

}

module.exports = CityWorkerActionStorageDepositHelper;