const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const FlowType = require('core/flow/FlowType');
const storageOrder = [
    STRUCTURE_STORAGE,
    STRUCTURE_CONTAINER,
    STRUCTURE_LINK,
]

class CityFeatStorage extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatStorage', room, gameAccess, roomData, 15);
    }

    slowRun() {
        // const report = this.roomData.getBaseReport();
        // this.checkFillingRoomEnergy()
        // this.logBaseReportStorage(report);
        this.roomData.getSysStorage().tick();
        this.handleMarketSlow();
    }

    run() {

        this.slowRun();

        const sysStorage = this.roomData.getSysStorage();

        this.discoverNewStorage();
        this.checkMainStorage(sysStorage)
        this.handleLink();
        this.countEnergy();
        this.handleMarket();
    }

    /**
     * @param sysStorage {SysStorageManager}
     */
    checkStorageExist(sysStorage) {
        sysStorage.getAllStorage().filter(s => !s.getStorage())
    }

    countEnergy() {
        const sysStorage = this.roomData.getSysStorage();
        sysStorage.getAllStorageByRoom(this.room)
            .map(s => s.getFuture(RESOURCE_ENERGY))
            .reduce((total, value) => total + value, 0);

        const mainStorage = sysStorage.getMainStorage();
        if (mainStorage && mainStorage.getStorage()) {
            this.roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.MAIN_STORAGE)
                .pushFixedValue(mainStorage.getEnergy())
        }
    }

    handleLink() {
        const sysStorage = this.roomData.getSysStorage();
        const linksMain = sysStorage.getAllStorageAccess(AccessStorage.LINK_WITHDRAW);
        const linksDeposit = sysStorage.getAllStorageAccess(AccessStorage.LINK_DEPOSIT);
        if (linksMain.length === 0 || linksDeposit.length === 0) {
            return;
        }
        const linkMain = linksMain[0];
        const linkObjMain = this.gameAccess.Game.getObjectById(linkMain.id);


        // if (linkObjMain.cooldown > 0) {
        //     return;
        // }

        const maxFill = linkMain.getFreeEnergy();
        // const inStore = linksDeposit.reduce((total, value) => total + value.getEnergy(), 0);
        const sysTransporter = this.roomData.getSysTransporter();

        linksDeposit
            .filter(link => this.gameAccess.Game.getObjectById(link.id).cooldown === 0)
            // .sort((a, b) => b.getEnergy() - a.getEnergy())
            .map(link => {
                const amount = link.getEnergy();
                const fixedAmount = amount > maxFill ? maxFill : amount;
                return {
                    obj: this.gameAccess.Game.getObjectById(link.id),
                    amount: fixedAmount,
                }
            })
            .forEach(data => {
                const ret = data.obj.transferEnergy(linkObjMain, data.amount)
                if (ret === OK) {
                    // const mainStorage = this.roomData.getSysStorage().getMainStorage()
                    // sysTransporter.pushOrder(new WorkerOrder(
                    //     WorkerType.CARRY,
                    //     data.obj.pos,
                    //     data.obj.id, {
                    //         depositSysStorage: mainStorage.id,
                    //         mandatoryWithdraw: true,
                    //     },
                    // ));
                }

            });

    }

    discoverNewStorage() {
        const sysStorage = this.roomData.getSysStorage();

        this.roomData.getSources().forEach(source => {
            this.findStorageObject(source.pos, 2)
                .forEach(storage =>
                    sysStorage.updateStorageMap(source.id, storage.id, AccessStorage.WITHDRAW),
                );
            this.findLinkObject(source.pos, 3)
                .forEach(storage =>
                    sysStorage.updateStorageMap(source.id, storage.id, AccessStorage.LINK_DEPOSIT),
                );
        })
        this.roomData.getSpawners().forEach(spawn => {
            this.findStorageObject(spawn.pos, 4)
                .forEach(s => {
                    // console.log(`SysStorage update main ${spawn.id}`)
                    sysStorage.updateStorageMap(spawn.id, s.id, AccessStorage.ALL)
                });
            this.findLinkObject(spawn.pos, 3)
                .forEach(storage =>
                    sysStorage.updateStorageMap(spawn.id, storage.id, AccessStorage.LINK_WITHDRAW),
                );
        })
        this.roomData.getTowers().forEach(tower => {
            sysStorage.updateStorageMap(tower.id, tower.id, AccessStorage.DEPOSIT);
            // this.findStorageObject(tower.pos, 1)
            //     .forEach(s =>
            //         sysStorage.updateStorageMap(tower.id, s.id, AccessStorage.DEPOSIT))
        })


        const controler = this.roomData.getRoomGame().controller;
        const sysController = this.roomData.getSysCity().getSysCityController();
        const posControllerStorage = sysController.getBestOutputStorePos();

        this.findStorageObject(posControllerStorage, 1)
            .forEach(s => {
                sysStorage.updateStorageMap(controler.id, s.id, AccessStorage.DEPOSIT)
                const createdSysStorage = sysStorage.getStorageFromIdMaster(controler.id)[0]
                this.roomData.getSysCity().getSysCityController().updateSysStorage(createdSysStorage)
                if (!this.roomData.exclusionWithDrawCarry.includes(s.id)) {
                    this.roomData.exclusionWithDrawCarry.push(s.id)
                }
            });

        const sysMarket = this.roomData.getSysMarket();
        const terminal = this.roomData.getRoomGame().terminal
        if (sysMarket != null && terminal != null) {
            sysStorage.updateStorageMap(terminal.id, terminal.id, AccessStorage.DEPOSIT)
            sysMarket.updateStorage(sysStorage.getStorageFromIdMaster(terminal.id)[0])
        }

        const sysMineral = this.roomData.getSysCity().getSysCityMineral();
        if (sysMineral != null) {
            this.findStorageObject(sysMineral.getBestOutputStorePos(), 1)
                .forEach(s => {
                    sysStorage.updateStorageMap(sysMineral.idWorker, s.id, AccessStorage.WITHDRAW)
                    const createdSysStorage = sysStorage.getStorageFromIdMaster(sysMineral.idWorker)[0]
                    sysMineral.updateSysStorage(createdSysStorage)
                });
        }


    }


    /**
     *
     * @param sysStorage {SysStorageManager}
     */
    checkMainStorage(sysStorage) {
        const currentMainStorageIds = sysStorage.getMainStorageId() || '';
        const idSpawn = this.roomData.getSpawners()[0].id;
        const customOrder = [
            STRUCTURE_STORAGE,
            STRUCTURE_CONTAINER,
            STRUCTURE_LINK,
        ];

        const storages = sysStorage.getStorageFromIdMaster(idSpawn)
        storages
            .sort((a, b) => {
                const a1 = customOrder.indexOf(a.structureType);
                const b1 = customOrder.indexOf(b.structureType);
                return a1 - b1;
            })
            .slice(0, 1)
            .forEach(value => {
                if (value.id !== currentMainStorageIds) {
                    sysStorage.updateMainStorageId(value.id)
                }
            })

    }

    checkFillingRoomEnergy() {
        // console.log('checkFillingRoomEnergy');
        const room = this.roomData.getRoomGame();
        const currentEnergy = room.energyAvailable;
        const maxEnergy = room.energyCapacityAvailable;
        const fillEnergy = currentEnergy < maxEnergy;

        const fillTower = this.roomData.getTowers()
            .filter(s =>
                (s.structureType === STRUCTURE_TOWER && s.store[RESOURCE_ENERGY] < 100) ||
                s.structureType !== STRUCTURE_TOWER,
            ).length !== 0;

        // report.needFillingRoomEnergy = fillEnergy || fillTower;
        if (fillEnergy) {
            this.roomData.getSources()
        }
        // console.log(`energy ${currentEnergy}/${maxEnergy}`)
    }


    /**
     *
     * @param pos {RoomPosition}
     * @param range {Number}
     * @returns {RoomObject[]}
     */
    findStorageObject(pos, range) {
        if (pos == null) {
            return [];
        }
        const nearbyContainers = pos.findInRange(FIND_STRUCTURES, range, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_CONTAINER ||
                    structure.structureType === STRUCTURE_STORAGE);
            },
        });

        return nearbyContainers.sort((a, b) => {
            const roleAIndex = storageOrder.indexOf(a.role);
            const roleBIndex = storageOrder.indexOf(b.role);
            return roleAIndex - roleBIndex;
        });
    }

    /**
     *
     * @param pos {RoomPosition}
     * @param range {Number}
     * @returns {RoomObject[]}
     */
    findLinkObject(pos, range = 3) {
        const nearbyContainers = pos.findInRange(FIND_STRUCTURES, range, {
            filter: (structure) => {
                return structure.structureType === STRUCTURE_LINK
            },
        });

        return nearbyContainers.sort((a, b) => {
            const roleAIndex = storageOrder.indexOf(a.role);
            const roleBIndex = storageOrder.indexOf(b.role);
            return roleAIndex - roleBIndex;
        });
    }


    handleMarket() {
        if (this.roomData.getRoomGame().terminal == null) {
            return
        }
        const sysMarket = this.roomData.getSysMarket()

        const mineral = this.roomData.getSysCity().getSysCityMineral();
        if (mineral != null) {
            sysMarket.setRoomMineral(mineral.typeMineral);
        }

        const terminal = this.roomData.getRoomGame().terminal;
        if (terminal != null) {
            sysMarket.setTerminalId(terminal.id);
        }



    }

    handleMarketSlow() {
        if (this.roomData.getRoomGame().terminal == null) {
            return
        }
        const sysMarket = this.roomData.getSysMarket()
        sysMarket.externalDebugVisual(this.gameAccess)
        sysMarket.update(this.gameAccess, this.roomData)

        // const sysStorageUnit = this.roomData.getSysStorage()
        //     .getStorageFromIdMaster(sysMarket.terminalId);
        // sysMarket.updateStorage(sysStorageUnit);
    }
}

module.exports = CityFeatStorage;