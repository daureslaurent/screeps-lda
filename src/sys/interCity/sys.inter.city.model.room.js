class SysInterCityModelRoom {

    constructor(roomName) {
        this.roomName = roomName;
        this.level = 0;
        this.containMainStorage = false;
        this.totalFlow;
        this.mainEnergy = 0;
        this.isHelped = false;
        this.progressLevel = 0;
    }

    /**
     * @param controller {StructureController}
     * @param mainStorage {SysStorageUnit}
     * @param totalFlow {number}
     */
    updateGeneralCity(controller, mainStorage, totalFlow) {
        this.level = controller.level;
        const levelP = (controller.progress / controller.progressTotal) * 100
        this.progressLevel = Math.round(levelP * 100) / 100;

        if (mainStorage != null) {
            this.containMainStorage = true;
            this.mainEnergy = mainStorage.getEnergy()
        } else {
            this.containMainStorage = false;
        }

        this.totalFlow = totalFlow;
    }

}

module.exports = SysInterCityModelRoom;