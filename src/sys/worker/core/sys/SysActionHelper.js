const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const SysActionFactory = require('sys/worker/core/sys/SysActionFactory');

class SysActionHelper {

    constructor() {
        this.actionFactory = new SysActionFactory();
    }

    /**
     * @param sysStorage
     * @param resource
     * @param amount
     * @param creep
     * @param roomName {string}
     * @return {SysCityWorkerAction|undefined}
     */
    askWithdrawClassicInRoom(sysStorage, resource, amount, creep, roomName) {
        const storages = this.getWithdrawFromMainRoom(sysStorage, roomName)
            .filter(s => s.getAvailable(RESOURCE_ENERGY, -amount));
        if (storages.length > 0) {
            const closest = creep.pos.findClosestByPath(storages);
            const storage = closest != null ? closest : storages[0];
            if (storage) {
                return this.getFactory().actionWithdrawHelper(storage.id, amount, resource, creep.id);
            }
        }
        return undefined;
    }

    /**
     * @param sysStorage
     * @param resource
     * @param amount
     * @param creep
     * @param roomName {string}
     * @return {SysCityWorkerAction|undefined}
     */
    askWithdrawEnergyInRoom(sysStorage, resource, amount, creep, roomName) {
        const storages = this.getWithdrawFromMainRoom(sysStorage, roomName)
            .filter(s => console.log(`room[${s.pos.roomName}]`) || true)
            .map(s => {return{ s: s, in: s.getFuture(RESOURCE_ENERGY)}})
            .filter(s => s.in > 0)
            .sort((a, b) => b.in - a.in)
            .slice(-2);

        if (storages.length > 0) {

            const closest = creep.pos.findClosestByPath(storages.map(s => s.s));
            const storage = closest != null ? closest : storages[0];
            if (storage) {
                const amountEnd = Math.min(amount, storage.getFuture(RESOURCE_ENERGY))
                return this.getFactory().actionWithdrawHelper(storage.id, amountEnd, resource, creep.id);
            }
        }
        return undefined;
    }

    moveMiningSysSource(sysSource, idWorkbench, idTarget, creep) {
        const workBench = sysSource.getWorkBenchById(idWorkbench)
        if (workBench !== undefined) {
            const pos = workBench.getPos()
            if (creep.pos.isEqualTo(pos)) {
                return this.getFactory().actionHarvest(idTarget, creep.id);
            } else {
                return this.getFactory().actionMove(pos, creep.id);
            }
        }
        return undefined;
    }

    /**
     * @return {SysActionFactory}
     */
    getFactory() {
        return this.actionFactory;
    }

    /**
     * @param sysStorage
     * @param roomName {string}
     * @return {SysStorageUnit[]}
     */
    getWithdrawInRoom(sysStorage, roomName) {
        return sysStorage.getAllStorageRaw()
            .filter(s => s.getPos().roomName === roomName)
            .filter(s => s.typeStorage !== STRUCTURE_TOWER)
            .filter(s => s.access !== AccessStorage.LINK_DEPOSIT)
    }

    // /**
    //  * @param sysStorage {SysStorageManager}
    //  */
    // getWithdrawForMainRoom(sysStorage) {
    //     const mainStorageId = sysStorage.getMainStorageId();
    //     return this.getWithdrawInRoom(sysStorage)
    //         .filter(s => s.id !== mainStorageId)
    //         .filter(s => s.access !== AccessStorage.DEPOSIT)
    // }

    /**
     * @param sysStorage
     * @param roomName {string}
     * @return {SysStorageUnit[]}
     */
    getWithdrawFromMainRoom(sysStorage, roomName) {
        return this.getWithdrawInRoom(sysStorage, roomName)
        // .filter(s => s.access !== AccessStorage.DEPOSIT)
    }

}

module.exports = new SysActionHelper();