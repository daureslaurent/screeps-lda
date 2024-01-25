const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const MineralWorkbench = require('sys/workbench/workspace/MineralWorkbench');

class CityFeatMiner extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatMiner', room, gameAccess, roomData, 1);
    }

    slowRun() {
    }

    run() {
        const sysCity = this.roomData.getSysCity();
        const sysStorage = this.roomData.getSysStorage();

        // Retrieve source
        const sources = this.roomData.getSources();
        sources.forEach(s => {
            sysCity.updateSysCitySource(s.id, this.gameAccess)
            const sysStorageUnit = sysStorage.getStorageFromIdMaster(s.id)[0];
            sysCity.getSysCitySource(s.id).updateSysStorage(sysStorageUnit);
        })

        const sysMineral = sysCity.getSysCityMineral();
        if (sysMineral == null) {
            const mineral = Game.rooms[this.room].find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_EXTRACTOR }
            })[0]
            if (mineral != null) {
                sysCity.setSysCityMineral(new MineralWorkbench(mineral.id, this.room))
            }
        }
        else {
            sysMineral.update(this.gameAccess)
            sysMineral.externalDebug(this.gameAccess)
        }


        //Debug
        sysCity.getSysCitySources()
            .forEach(s => s.externalDebug(this.gameAccess))
    }
}

module.exports = CityFeatMiner;