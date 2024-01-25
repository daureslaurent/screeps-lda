const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const WorkerAction = require('sys/worker/core/model/WorkerAction')

class CityWorkerActionMove extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionMove', roomData.room, gameAccess, roomData, 1, WorkerAction.MOVE);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        const targetPos = action.data.getTargetPos(this.gameAccess);
        const range = action.data.range
        if (action.creep.pos.inRangeTo(targetPos, range)) {
            return true;
        }
        action.creep.setStatic(false);
        action.creep.moveTo(action.data.getTargetPos(this.gameAccess))
        return false;
    }

}

module.exports = CityWorkerActionMove;