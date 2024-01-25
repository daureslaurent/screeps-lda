const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData');
const SysCityWorkerAction = require('sys/worker/core/model/SysCityWorkerAction');
const WorkerAction = require('sys/worker/core/model/WorkerAction');
const _moduleCityWorker = require('core/interface/_moduleCityWorker');

class SysActionFactory extends _moduleCityWorker {

    /**
     * @param pos {RoomPosition}
     * @param creepId {string}
     * @param range
     * @return {SysCityWorkerAction}
     */
    actionMove(pos, creepId, range = 1) {
        const data = new SysCityWorkerModelActionData();
        data.range = range;
        data.setTargetPos(pos);
        return new SysCityWorkerAction(WorkerAction.MOVE, creepId, data);
    }

    /**
     * @param idTarget {string}
     * @param creepId {string}
     * @return {SysCityWorkerAction}
     */
    actionHarvest(idTarget, creepId) {
        const data = new SysCityWorkerModelActionData();
        data.setTargetId(idTarget);
        return new SysCityWorkerAction(WorkerAction.HARVEST, creepId, data);
    }

    /**
     * @param idTarget {string}
     * @param creepId {string}
     * @return {SysCityWorkerAction}
     */
    actionPickup(idTarget, creepId) {
        const data = new SysCityWorkerModelActionData();
        data.setTargetId(idTarget);
        return new SysCityWorkerAction(WorkerAction.PICKUP, creepId, data);
    }

    /**
     * @param idTarget {string}
     * @param creepId {string}
     * @return {SysCityWorkerAction}
     */
    actionPickupTomb(idTarget, creepId) {
        const data = new SysCityWorkerModelActionData();
        data.setTargetId(idTarget);
        return new SysCityWorkerAction(WorkerAction.PICKUP_TOMBSTONE, creepId, data);
    }

    /**
     * @param idStorage {string}
     * @param amount {Number}
     * @param resource {string}
     * @param creepId {string}
     * @param timeout {undefined | number}
     * @return {SysCityWorkerAction}
     */
    actionWithdrawHelper(idStorage, amount, resource, creepId, timeout) {
        const data = new SysCityWorkerModelActionData();
        data.setTargetId(idStorage);
        data.amount = amount;
        data.resource = resource;
        if (timeout != null) {
            data.timeout = timeout;
        }
        return new SysCityWorkerAction(WorkerAction.WITHDRAW_HELPER_SYS, creepId, data);
    }

    /**
     * @param idStorage {string}
     * @param amount {Number}
     * @param resource {string}
     * @param creepId {string}
     * @param timeout {undefined | number}
     * @return {SysCityWorkerAction}
     */
    actionDepositHelper(idStorage, amount, resource, creepId, timeout) {
        console.log(`=========== DHS sysStorgaeId ${idStorage} amount ${amount}`)
        const data = new SysCityWorkerModelActionData();
        data.setTargetId(idStorage);
        data.amount = amount;
        data.resource = resource;
        if (timeout != null) {
            data.timeout = timeout;
        }
        return new SysCityWorkerAction(WorkerAction.DEPOSIT_HELPER_SYS, creepId, data);
    }

    actionDepositHelperInterCity(idStorage, amount, resource, creepId, roomNameTarget) {
        console.log(`=========== DHS sysStorgaeId ${idStorage} amount ${amount}`)
        const data = new SysCityWorkerModelActionData();
        data.setTargetId(idStorage);
        data.amount = amount;
        data.resource = resource;
        data.customRoomData = roomNameTarget;
        return new SysCityWorkerAction(WorkerAction.DEPOSIT_HELPER_SYS, creepId, data);
    }

    /**
     * @param targetObject {Object}
     * @param creepId {string}
     * @return {SysCityWorkerAction}
     */
    actionBuildObj(targetObject, creepId) {
        const data = new SysCityWorkerModelActionData();
        data.setTargetObj(targetObject);
        return new SysCityWorkerAction(WorkerAction.BUILD, creepId, data);
    }

    /**
     *
     * @param targetId {string}
     * @param creepId {string}
     * @return {SysCityWorkerAction}
     */
    actionBuildId(targetId, creepId) {
        const data = new SysCityWorkerModelActionData();
        data.setTargetObj(targetId);
        return new SysCityWorkerAction(WorkerAction.BUILD, creepId, data);
    }

    /**
     *
     * @param targetId {string}
     * @param creepId {string}
     * @return {SysCityWorkerAction}
     */
    actionUpgrade(targetId, creepId) {
        const data = new SysCityWorkerModelActionData();
        data.setTargetId(targetId);
        return new SysCityWorkerAction(WorkerAction.UPGRADE, creepId, data);
    }

}

module.exports = SysActionFactory;