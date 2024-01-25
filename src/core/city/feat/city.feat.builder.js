const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const utilsBuild = require('src/utils/utils.build')
const BuildTemplate = require('sys/nexus/build/BuildTemplate');

const MAX_WALL_REPAIR = 5000

class CityFeatBuilder extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatBuilder', room, gameAccess, roomData, 500);
        this.creepInProcess = [];
        this.logTmp = {};
        this.firstRunDEPRECATED = false;

        this.template = new BuildTemplate(roomData.getMainSpawn().pos)
    }

    checkProcess(levelRoom, room, sysStorage) {
        this.template.getExtension().forEach(p => utilsBuild.createIfEmpty(STRUCTURE_EXTENSION, p, room))

        if (levelRoom < 4) {
            // this.template.getContainer().forEach(p => utilsBuild.createIfEmpty(STRUCTURE_CONTAINER, p, room))
        }
        if (levelRoom >= 4) {
            utilsBuild.createIfEmpty(STRUCTURE_STORAGE, this.template.getStorage(), room)
            // utilsBuild.createWallCity(room);
        }
        if (levelRoom >= 5) {
            const p = this.template.getContainer()
            utilsBuild.destroyIfExists(STRUCTURE_CONTAINER, new RoomPosition(p.x, p.y, room.name), room)

            utilsBuild.createIfEmpty(STRUCTURE_LINK, this.template.getLink(), room)

            const mainStorage = sysStorage.getMainStorage();
            if (mainStorage != null && mainStorage.getEnergy() >= 10000) {
                this.template.getCityRampart()
                    .forEach(p => utilsBuild.createIfEmpty(STRUCTURE_RAMPART, p, room))
            }


        }
        if (levelRoom >= 6) {
            utilsBuild.createIfEmpty(STRUCTURE_TERMINAL, this.template.getTerminal(), room)
            /** @type {Mineral} */
            const mineral = room.find(FIND_MINERALS)[0];
            if (mineral) {
                utilsBuild.createConstruction(mineral.pos, STRUCTURE_EXTRACTOR, room);
                this.checkMineralOutputStore(room);

            }
            const sysMineral = this.roomData.getSysCity().getSysCityMineral();
            if (sysMineral != null) {
                utilsBuild.buildRoadBetweenRoomPosition(sysStorage.getMainStorage().pos, sysMineral.getBestOutputStorePos())
            }
        }
        if (levelRoom >= 3) {
            this.template.getTower().forEach(p => utilsBuild.createIfEmpty(STRUCTURE_TOWER, p, room))
            // this.checkCreateRoad();
            this.template.getRoad().forEach(p => utilsBuild.createIfEmpty(STRUCTURE_ROAD, p, room))

            // this.checkPlaceControllerContainer();
        }
        if (levelRoom >= 2) {
            this.checkControllerOutputStore(room);
        }
    }

    run() {
        this.slowRun();
        const levelRoom = this.roomData.getRoomLevel();
        const room = this.roomData.getRoomGame();
        const sysStorage = this.roomData.getSysStorage();
        const sysCity = this.roomData.getSysCity();

        if (this.firstRunDEPRECATED === true) {
            this.firstRunDEPRECATED = false;
        }
        else {
            this.checkProcess(levelRoom, room, sysStorage)
            this.checkSourcesOutputStore(room);
            const damages = room.find(FIND_STRUCTURES, {
                filter: (structure) =>
                    (structure.structureType === STRUCTURE_RAMPART &&
                        structure.hits < MAX_WALL_REPAIR) ||
                    (structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART &&
                        structure.hits < structure.hitsMax),
            });
            sysCity.setDamages(damages)
        }

        const constructs = room.find(FIND_MY_CONSTRUCTION_SITES);
        sysCity.setConstructs(constructs);

        const waitingPosRaw = this.template.getWaitingPos();
        sysCity.setWaitingPos(new RoomPosition(waitingPosRaw.x, waitingPosRaw.y, this.room));
    }

    slowRun() {
        this.banner()

        // this.logDamages()
    }

    checkSourcesOutputStore(room) {
        const sysCitySources = this.roomData.getSysCity().getSysCitySources();
        const nbLinkSource = sysCitySources
            .filter(s => s.getSysStorage() !== undefined && s.getSysStorage().typeStorage === STRUCTURE_LINK)
            .length
        const level = this.roomData.getRoomLevel();
        const currentDisp = level < 5 ? 0 : level > 5 ? 2 : 1;
        let linkToBuild = currentDisp - nbLinkSource;

        sysCitySources
            .sort((a, b) => b.distanceToMain - a.distanceToMain)
            .forEach(s => {
                const posRaw = s.getBestOutputStorePos();
                const pos = new RoomPosition(posRaw.x, posRaw.y, room.name);
                if (((s.getSysStorage() !== undefined && s.getSysStorage().typeStorage === STRUCTURE_CONTAINER)
                    || s.getSysStorage() === undefined) && linkToBuild > 0) {
                    linkToBuild--;
                    utilsBuild.destroyIfExists(STRUCTURE_CONTAINER, pos, room);
                    utilsBuild.createIfEmpty(STRUCTURE_LINK, pos, room)
                } else if (utilsBuild.isEmptyStructurePos(s.getBestOutputStorePos(), room)) {
                    utilsBuild.createIfEmpty(STRUCTURE_CONTAINER, pos, room)
                }
            })
    }

    checkControllerOutputStore(room) {
        const sysCityController = this.roomData.getSysCity().getSysCityController();
        const posContainer = sysCityController.getBestOutputStorePos();
        if (utilsBuild.isEmptyStructurePos(posContainer, room)) {
            utilsBuild.createIfEmpty(STRUCTURE_CONTAINER, posContainer, room)
        }
    }

    checkMineralOutputStore(room) {
        const sysMineral = this.roomData.getSysCity().getSysCityMineral();
        const posContainer = sysMineral.getBestOutputStorePos();
        if (utilsBuild.isEmptyStructurePos(posContainer, room)) {
            utilsBuild.createIfEmpty(STRUCTURE_CONTAINER, posContainer, room)
        }
    }

    checkCreateRoad() {
        //Check road between obj
        const roomData = this.roomData;
        const sysStorage = roomData.getSysStorage();

        const mainStorage = sysStorage.getMainStorage();
        if (mainStorage) {
            const storages = sysStorage.getAllStorageByRoom(this.room)
                .filter(s => s.id !== mainStorage.id);

            if (storages) {
                storages.forEach(s => {
                    const ori = this.gameAccess.Game.getObjectById(mainStorage.id)
                    const tgt = this.gameAccess.Game.getObjectById(s.id)
                    utilsBuild.buildRoadBetweenObjects(ori, tgt)
                })
            }
        }

    }
}

module.exports = CityFeatBuilder;