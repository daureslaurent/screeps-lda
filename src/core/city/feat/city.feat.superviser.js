const _moduleCityFeat = require('core/interface/_moduleCityFeat');

class CityFeatSuperviser extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatSuperviser', room, gameAccess, roomData, 3);
    }

    slowRun() {
        this.updateSysCity();
    }

    run() {
        this.slowRun()
        this.updateInterCity();
    }

    updateSysCity() {
        const sysStorage = this.roomData.getSysStorage();
        const sysCity = this.roomData.getSysCity();
        const room = this.roomData.getRoomGame();

        const levelRoom = this.roomData.getRoomLevel()
        sysCity.updateLevelRoom(levelRoom);

        const spawnFill = this.roomData.getSpawners()
            .filter(spawn => spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0)

        const extensionFill = room
            .find(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_EXTENSION,
            })
            .filter(extension => extension.store.getFreeCapacity(RESOURCE_ENERGY) > 0)

        const towerFill = this.roomData.getTowers()
            .filter(extension => extension.store.getFreeCapacity(RESOURCE_ENERGY) > 700)

        sysCity.updateSpawnFill(spawnFill.length !== 0)
        sysCity.updateExtensionFill(extensionFill.length !== 0)
        sysCity.updateTowerFill(towerFill.length !== 0)
        sysCity.updateEnergyToFill([
            ...spawnFill.map(s => s.id),
            ...extensionFill.map(s => s.id),
            ...towerFill.map(s => s.id),
        ]);

        const maxEnergy = room.energyCapacityAvailable;
        const currentEnergy = room.energyAvailable;
        sysCity.updateEnergy(currentEnergy, maxEnergy);

        const totalStoredEnergy = sysStorage.getAllStorageByRoom()
            .filter(s => s.typeStorage !== STRUCTURE_TOWER)
            .map(s => s.getEnergy())
            .reduce((total, v) => total + v, 0);
        const mainStorage = sysStorage.getMainStorage();
        if (mainStorage) {
            sysCity.updateStoredEnergy(totalStoredEnergy, mainStorage.getEnergy())
        } else {
            sysCity.updateStoredEnergy(totalStoredEnergy, 0)
        }

        const totalStoredColonEnergy = sysStorage.getAllStorageNotInRoom()
            .map(s => s.getEnergy())
            .reduce((total, v) => total + v, 0);
        if (totalStoredColonEnergy !== undefined) {
            sysCity.updateStoredColonEnergy(totalStoredColonEnergy);
        }

        // alarm
        const lowCity = currentEnergy <= 300 && this.roomData.getCreeps().length < 4;
        sysCity.updateLowCityAlarm(lowCity, this.gameAccess.getTime());

        sysCity.getSysCityController().update(this.gameAccess);

        //Debug
        sysCity.getSysCityController().externalDebug(this.gameAccess)
        sysCity.getSysFlow().update()
        sysCity.update();
    }

    updateInterCity() {
        const sysInterCity = this.roomData.getSysInterCity();
        const sysStorage = this.roomData.getSysStorage();

        const roomCity = sysInterCity.getOrCreateRoom(this.roomData.room);

        const controller = this.roomData.getRoomGame().controller;
        const mainStorage = sysStorage.getMainStorage()

        roomCity.updateGeneralCity(
            controller,
            mainStorage,
            this.roomData.getSysCity().getSysFlow().getTotalFlow(),
        )

        // if (mainStorage && mainStorage.getFuture(RESOURCE_ENERGY) > maxEnergy) {
        //     sysWorker.cleanOrderType(WorkerType.CARRY_INTER_CITY);
        //
        //     sysInterCity.getAllRoomCity()
        //         .filter(rc => rc.mainEnergy < 2000)
        //         .filter(rc => !rc.isHelped)
        //         .forEach(rc => {
        //             sysWorker.pushOrder(new SysWorkerOrder(
        //                 WorkerType.CARRY_INTER_CITY,
        //                 mainStorage.pos,
        //                 mainStorage.id, {
        //                     roomName: rc.roomName,
        //                     // target: rc.roomName,
        //                 },
        //             ))
        //         })
        //     // if (target) {
        //     // }
        //     // sysWorker.cleanOrderType(WorkerType.CARRY_INTER_CITY);
        //
        // }

    }

}

module.exports = CityFeatSuperviser;