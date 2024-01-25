const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const SysStorageUnit = require('sys/storage/sys.storage.unit');

class SysStorageManager {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomName {string}
     */
    constructor(gameAccess, roomName) {
        this.gameAccess = gameAccess;
        this.storageMap = new Map();
        this.roomName = roomName;
        this.mainStorageId = undefined;
    }

    tick() {
        const allStorages = this.getAllStorage();
        allStorages.forEach(v => v.update());
        this.storageMap.forEach((value, key) => {
            if (this.gameAccess.Game.getObjectById(key) === undefined) {
                // console.log(`SysStorage delete ${key}`)
                this.storageMap.delete(key);
            }
        });

    }

    /**
     *
     * @returns {SysStorageUnit[]}
     */
    getAllStorage() {
        return Array.from(this.storageMap.values())
            .filter(s => s != null)
            .filter(s => /*s.access !== AccessStorage.LINK_WITHDRAW ||*/ s.access !== AccessStorage.LINK_DEPOSIT)
            .reduce((result, value) => {
                return result.concat(value);
            }, [])
    }

    /**
     *
     * @return {SysStorageUnit[]}
     */
    getAllStorageRaw() {
        return Array.from(this.storageMap.values())
            .filter(s => s != null)
            .reduce((result, value) => {
                return result.concat(value);
            }, [])
    }

    /**
     *
     * @param roomName {string|null}
     * @return {SysStorageUnit[]}
     */
    getAllStorageByRoom(roomName) {
        const roomNameEnd = roomName || this.roomName;
        return this.getAllStorage()
            .filter(s => s.pos.roomName === roomNameEnd)
    }

    /**
     * @return {SysStorageUnit[]}
     */
    getAllStorageNotInRoom() {
        return this.getAllStorage()
            .filter(s => s.pos.roomName !== this.roomName)
    }

    /**
     * @param access {AccessStorage}
     * @return {SysStorageUnit[]}
     */
    getAllStorageAccess(access) {
        return this.getAllStorageRaw()
            .filter(s => s.access === access);
    }


    /**
     *
     * @param resource
     * @param amount
     * @return {SysStorageUnit[]}
     */
    getAvailableStorageUnit(resource, amount) {
        return this.getAllStorage()
            .filter(v => v.getAvailable(resource, amount));
    }

    /**
     * @param idAction
     * @return {SysStorageUnit | null}
     */
    // getStorageByIdAction(idAction) {
    //     return this.getAllStorage()
    //         .filter(s => s.containActionId(idAction))[0];
    // }

    /**
     * @param idMaster
     * @returns {SysStorageUnit[]}
     */
    getStorageFromIdMaster(idMaster) {
        if (!this.storageMap.has(idMaster)) {
            return [];
        }
        return Array.from(this.storageMap.get(idMaster))
            .filter(s => s != null)
            .reduce((result, value) => {
                return result.concat(value);
            }, [])
    }

    /**
     * @param idStorage
     * @returns {SysStorageUnit}
     */
    getStorageFromIdStorage(idStorage) {
        return this.getAllStorage()
            .filter(s => {
                // console.log(`filter sys ==== ${idStorage} ${s.id} ${s.idStorage === idStorage}`)
                return s.idStorage === idStorage
            })[0];
    }

    /**
     * @param idStorage {string}
     * @param access {AccessStorage}
     * @returns {SysStorageUnit}
     */
    createStorageUnit(idStorage, access) {
        return new SysStorageUnit(this.gameAccess, idStorage, access || AccessStorage.ALL);
    }

    /**
     * @param idObject
     * @param access {AccessStorage}
     * @param idStorage
     */

    updateStorageMap(idObject, idStorage, access) {
        // console.log(`UPDATE STORAGE EXPLORER AA ${idObject} - ${idStorage}`)

        if (!idObject || !idStorage) {
            return;
        }
        if (!this.storageMap.has(idObject)) {
            this.storageMap.set(idObject, [this.createStorageUnit(idStorage, access)]);
            return;
        }

        const data = this.storageMap.get(idObject).map(su => su.idStorage);
        if (!data.includes(idStorage)) {
            const storageUnit = this.createStorageUnit(idStorage, access);
            this.storageMap.get(idObject).push(storageUnit)
        }
    }

    /**
     * @param mainStorageId {string}
     */
    updateMainStorageId(mainStorageId) {
        this.mainStorageId = mainStorageId;
    }

    getMainStorageId() {
        return this.mainStorageId;
    }

    /**
     * @return {SysStorageUnit}
     */
    getMainStorage() {
        return this.getStorageFromIdStorage(this.mainStorageId);
    }

    isConsumeEnergyFlag() {
        const mainStorage = this.getMainStorage();
        if (mainStorage != null) {
            const isStorageMain = mainStorage.typeStorage === STRUCTURE_STORAGE;
            const minConsume = isStorageMain ? 3000 : 1000;
            return mainStorage.getFuture(RESOURCE_ENERGY) > minConsume;
        }
        return false;
    }

}

module.exports = SysStorageManager;