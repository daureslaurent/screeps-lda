const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const BotRole = require('core/enum/BotRole')
const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const utilsBuild = require('src/utils/utils.build')
const DIRECTIONS = [TOP, RIGHT, BOTTOM, LEFT];

class CityFeatExplorer extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatExplorer', room, gameAccess, roomData, 25);
    }

    slowRun() {
        // const report = this.roomData.getBaseReport();
        // this.checkFillingRoomEnergy(report)
        // this.logBaseReportStorage(report);
        // this.roomData.getSysStorage().tick();
        const sysColon = this.roomData.getSysColon();
        sysColon.tick();
    }

    run() {
        const sysColon = this.roomData.getSysColon();
        const levelRoom = this.roomData.getRoomLevel();
        const sysInterCity = this.roomData.getSysInterCity();

        sysColon.tick();
        sysColon.unTagAll();

        if (levelRoom < 1) {
            console.log(`[${Game.shard.name}][${this.room}] Low level no colonies !`)
            return;
        }
        // Lvl1
        let l1 = [];
        let l2 = [];
        let l3 = [];

        if (levelRoom >= 2) {
            l1 = this.explorePath(this.room, this.room);
        }

        if (levelRoom >= 3) {
            // Lvl2
            l2 = l1
                .filter(r => !sysColon.roomEndPath(r))
                .map(r => this.explorePath(r, this.room))
                .reduce((result, value) => {
                    return result.concat(value);
                }, []);
        }
        //
        // if (levelRoom >= 4) {
        //     l3 = l2
        //         .filter(r => !sysColon.roomEndPath(r))
        //         .map(r => this.explorePath(r, this.room))
        //         .reduce((result, value) => {
        //             return result.concat(value);
        //         }, []);
        // }

        // const preFinal = [...new Set([...l1])];
        const preFinal = [...new Set([...l1, ...l2, ...l3])];

        // const limitExploration = Math.round(levelRoom * 1.5);
        const limitExploration = 3;
        preFinal
            .slice(0, limitExploration > 7 ? 7 : limitExploration)
            .filter(ex => this.preHandleColon(sysColon.retrieveColon(ex), sysColon, sysInterCity))
            .forEach(ex => this.handleColon(sysColon.retrieveColon(ex), sysColon, sysInterCity));
    }

    /**
     *
     * @param roomBase {string}
     * @param idRoomExclusion {string}
     * @return {string[]}
     */
    explorePath(roomBase, idRoomExclusion) {
        return this.getSurroundRooms(roomBase)
            .filter(r => r !== idRoomExclusion);
    }

    /**
     * @param colon {SysColon}
     * @param sysColom {SysColonManager}
     * @param sysInterCity {InterCityManager}
     */
    preHandleColon(colon, sysColom, sysInterCity) {
        const roomName = colon.roomName
        if (colon.getCountSource() === 3) {
            this.roomData.getSysInterCity().addKeeperRoom(roomName)
        }
        return true;
    }

    /**
     * @param colon {SysColon}
     * @param sysColom {SysColonManager}
     * @param sysInterCity {InterCityManager}
     */
    handleColon(colon, sysColom, sysInterCity) {
        const roomName = colon.roomName
        const masterRoomName = this.room
        // console.log(`EXPLORER - handle ${roomName}`)
        const notInRoom = this.roomData.getCreeps()
            .filter(c => c.colon != null && c.colon.target === roomName && c.colon.ori === masterRoomName);
        const inMasterRoom = this.gameAccess.getCreepsByRoom(roomName)
            .filter(c => c.colon != null && c.colon.target === roomName && c.colon.ori === masterRoomName);

        colon.clearCreeps();
        [...notInRoom, ...inMasterRoom].forEach(c => {
            const role = c.role === BotRole.RECYCLER ? c.roleTmp : c.role
            colon.appendCreep(c.id, role)
        })

        if (!sysInterCity.takeControl(this.room, roomName)) {
            return;
        }

        // if (colon.explored === true && colon.getCountSource() === 0) {
        //     console.log(`Nothing to take in ${roomName}`)
        //     return
        // }
        const noReelProblem = ['Invader', 'someone120']

        if (colon.hostile && colon.totalGain <= 0 && !noReelProblem.includes(colon.getHostileOwner())) {
            // console.log(`Real enemies in ${roomName} !`)
            return
        }

        if (colon.getCountSource() === 3) {
            // console.log(`Source keeper bypass ${roomName} !`)
            colon.active = false;
            this.roomData.getSysInterCity().addKeeperRoom(roomName)
            return
        }
        colon.setTag(true);


        if (!Game.rooms[roomName]) {
            // console.log(`Missing creep in room ${roomName} ?! Explore[${colon.explored}]`)
            return
        }

        // Check SysSources container
        colon.getSysSources()
            .forEach(s => {
                if (s.getSysStorage() === undefined) {
                    utilsBuild.createIfEmpty(STRUCTURE_CONTAINER, s.getBestOutputStorePos(), this.gameAccess.getRoom(colon.roomName))
                }
            })

        this.exploreRoom(roomName, colon);
        //refresh storage
        this.checkContainer(roomName, this.roomData.getSysStorage(), colon)

        const controller = Game.rooms[roomName].controller;
        const tick = controller === undefined ? 0 : controller.reservation === undefined ? 0 : controller.reservation.ticksToEnd;

        const hostileRes = controller != null && controller.reservation != null && controller.reservation.username !== this.roomData.getUsername()


        colon.updateReservation(hostileRes ? -1 : tick);
        // Road build
        // if (!colon.constructed) {
        //     const mainStorageSys = this.roomData.getSysStorage().getMainStorage();
        //     if (mainStorageSys) {
        //         const mainStorage = this.gameAccess.Game.getObjectById(mainStorageSys.id);
        //         utilsBuild.buildRoadBetweenObjects(controller, mainStorage)
        //     }
        // }


    }

    /**
     * @param roomName {string}
     * @param colon {SysColon}
     */
    exploreRoom(roomName, colon) {
        // console.log(`EXPLORER - exploreRoom ${roomName} => ${colon.explored}`)

        if (!colon.explored || true) {
            const sourcesId = [
                ...this.gameAccess.getSourcesByRoom(roomName).map(source => source.id),
            ];
            colon.setSources(sourcesId);
            const room = this.gameAccess.getRoom(roomName);
            // console.log(`EXPLORE CONSTRUCT ${room}`)

            const hostileCreep = room.find(FIND_HOSTILE_CREEPS, {
                filter: creep => creep.body.some(part => part.type === ATTACK || part.type === RANGED_ATTACK)
            });
            const hostileStructure = room.find(FIND_HOSTILE_STRUCTURES);

            const inConstruct = room.find(FIND_CONSTRUCTION_SITES);
            const struct = room.find(FIND_STRUCTURES);

            const endHostile = hostileCreep.length > 0 || hostileStructure.length > 0;
            if (endHostile) {
                let hostileOwner = ''
                if (hostileStructure.length > 0) {
                    hostileOwner = hostileStructure[0].owner.username;
                }
                if (hostileCreep.length > 0) {
                    hostileOwner = hostileCreep[0].owner.username
                }
                colon.updateHostileOwner(hostileOwner);
            }

            const carryColon = colon.getCountByRole(BotRole.CARRY_COLON) > 0 ?
                colon.getCreepsIdByRole(BotRole.CARRY_COLON)
                    .map(id => this.gameAccess.Game.getObjectById(id))
                    .filter(c => c != null)[0] :
                undefined
            if (carryColon !== undefined && carryColon.memory.distance > 0) {
                colon.updateDistance(carryColon.memory.distance)
            }

            const endFinish = sourcesId.length > 0 && sourcesId.length < 3;
            const endConstructed = inConstruct.length === 0 && struct.length > 3;
            const amountWork = (inConstruct.length * 3) + struct.filter(s => s.hits < s.hitsMax).length;

            // console.log(`EXPLORE REPORT - hostile[/${endHostile}] finish[${endFinish}] constructed[${endConstructed}]`
            //     +` struct[${struct.length}] const[${inConstruct.length}]`)

            colon.updateHostile(endHostile);
            colon.finishExploration(endFinish)
            colon.setConstructed(endConstructed);
            colon.updateAmountWork(amountWork);
            // console.log(`EXPLORER FINISH !- source[${sourcesId.length}] - active[${sourcesId.length > 0}]`)
        }
    }


    /**
     *
     * @param roomName {string}
     * @param sysStorage {SysStorageManager}
     * @param colon {SysColon}
     */
    checkContainer(roomName, sysStorage, colon) {
        const filter = {
            filter: structure => structure.structureType === STRUCTURE_CONTAINER,
        }
        const containers = [...this.gameAccess.getSourcesByRoom(roomName)
            .map(source => {
                return {
                    containers: source.pos.findInRange(FIND_STRUCTURES, 2, filter),
                    source: source,
                }
            })
            .filter(s => s.containers !== undefined && s.containers.length !== 0),
        ];

        let totalStorage = 0;
        const sysSources = colon.getSysSources();
        containers.forEach(data => {
            sysStorage.updateStorageMap(data.source.id, data.containers[0].id, AccessStorage.WITHDRAW)
            totalStorage += data.containers[0].store[RESOURCE_ENERGY];

            sysSources.filter(s => s.getIdBaseObject() === data.source.id)
                .forEach(s => s.updateSysStorage(sysStorage.getStorageFromIdMaster(data.source.id)[0]))

            if (this.roomData.getRoomLevel() >= 4 && colon.active && colon.getTag()) {
                const mainStorageSys = this.roomData.getSysStorage().getMainStorage();
                if (mainStorageSys) {
                    const keeperRooms = this.roomData.getSysInterCity().getKeeperRoom();
                    const whiteRooms = this.roomData.getSysColon().getAllColon().map(c => c.roomName)
                    whiteRooms.push(this.room)
                    utilsBuild.buildRoadBetweenObjects(
                        data.containers[0],
                        mainStorageSys.getStorage(),
                        keeperRooms,
                        whiteRooms,
                        this.roomData)
                }
            }

        })
        colon.updateStorage(containers.length > 0, totalStorage)
    }

    /**
     * @return {string[]}
     */
    getSurroundRooms(roomOri) {
        const exits = Game.map.describeExits(roomOri);
        return DIRECTIONS
            .map(direction => exits !== undefined ? exits[direction] : undefined)
            .filter(direction => direction !== undefined);
    }

}

module.exports = CityFeatExplorer;