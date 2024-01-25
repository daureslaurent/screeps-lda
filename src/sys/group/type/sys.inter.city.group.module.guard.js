const BotRole = require('core/enum/BotRole')
const GroupType = require('sys/group/GroupType');
const GroupUnit = require('sys/group/GroupUnit');
const SysCitySource = require('sys/workbench/workspace/SourceWorkbench');
const Logs = require('utils/Logs');
const utils = require('utils/utils');

const MODULES = [
    require('sys/group/type/role/building/sys.inter.city.group.role.building.carry'),
    require('sys/group/type/role/building/sys.inter.city.group.role.building.builder'),
];

const USE_MEMORY = true;

class SysInterCityGroupModuleGuard extends GroupUnit {
    /**
     * @param roomDataFactory {RoomDataFactory}
     * @param roomOri {string}
     */
    constructor(roomOri, roomDataFactory) {
        super(GroupType.GUARD, roomOri, roomDataFactory);
        this.needFullCreepOperate = false;
        // this.byPassSpawn = true;
        const minTTL = 0;

        this.modules = new Map();
        MODULES.forEach(m => {
            const instance = new (m)();
            this.modules.set(instance.role, instance);
        });

        this.appendNeed(BotRole.BREAKER, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.BREAKER, this.roomDataOri.getRoomLevel())
        // this.appendNeed(BotRole.BREAKER, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.TANK, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.TANK, this.roomDataOri.getRoomLevel())
        // this.appendNeed(BotRole.HEALER, this.roomDataOri.getRoomLevel())

        this.endRecycleTTL = CREEP_LIFE_TIME - (CREEP_LIFE_TIME / 10);

        this.currentRoom = undefined;
        this.hostileRooms = [];

        /** @type {SysCitySource} */
        this.sysSourceKeeper = undefined;
        this.containGuard = undefined;

        this.targetAttack = undefined;

        this.constructMemory();
        if (USE_MEMORY === true) {
            this.loadMemory();
        }

    }

    constructMemory() {
        if (USE_MEMORY === false) {
            Memory.sysGroup = undefined
        }
        if (!Memory.sysGroup) {
            Memory.sysGroup = {}
        }
        if (!Memory.sysGroup.base) {
            Memory.sysGroup.base = {}
        }
        if (!Memory.sysGroup.base[this.roomOri]) {
            Memory.sysGroup.base[this.roomOri] = {}
        }
        if (!Memory.sysGroup.base[this.roomOri][this.groupId]) {
            Memory.sysGroup.base[this.roomOri][this.groupId] = {}
        }
    }

    saveMemory() {
        if (USE_MEMORY === true) {
            Memory.sysGroup.base[this.roomOri][this.groupId].currentWork = this.currentWork;
            Memory.sysGroup.base[this.roomOri][this.groupId].roomRepair = this.roomRepair;
            Memory.sysGroup.base[this.roomOri][this.groupId].roomConstruct = this.roomConstruct;
            Memory.sysGroup.base[this.roomOri][this.groupId].roomDone = this.roomDone;
            Memory.sysGroup.base[this.roomOri][this.groupId].roomWaiting = this.roomWaiting;
            Memory.sysGroup.base[this.roomOri][this.groupId].currentRoom = this.currentRoom;
            Memory.sysGroup.base[this.roomOri][this.groupId].state = this.state;
        }
    }

    loadMemory() {
        const memory = Memory.sysGroup.base[this.roomOri][this.groupId]
        if (memory) {
            this.currentWork = memory.currentWork || [];
            this.roomRepair = memory.roomRepair || []
            this.roomConstruct = memory.roomConstruct || []
            this.roomDone = memory.roomDone || []
            this.roomWaiting = memory.roomWaiting || []
            this.currentRoom = memory.currentRoom || []
            this.state = memory.state || 'INIT'
        }
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runGroup(gameAccess, roomData) {
        this.currentPos = roomData.getSysCity().getWaitingPos() //inRoomCreeps[0].pos;
        if (this.state === "WAIT_SPAWN") {
            this.state = '';
        }
        Logs.logA(`debug guard -- state ${this.state}`)
        const creeps = this.getAllGroupCreepObj(gameAccess)
        const notReadyHigh = creeps
            .filter(c => c.ticksToLive < this.endRecycleTTL || c.memory.role === BotRole.RECYCLER)
            .length
        if (this.state === 'DESTROY') {
            this.byPassSpawn = true;
            if (creeps.filter(c => c != null).length === 0) {
                this.toDelete = true;
                this.state = ''
                Logs.logA(`debug guard -- final destroy ${this.toDelete}`)
                this.saveMemory()
                return 'DESTROY'
            }
        }

        if (this.state === 'RECYCLE') {
            this.currentPos = roomData.getSysCity().getWaitingPos();
            if (notReadyHigh === 0) {
                this.state = ''
            }
            return;
        }

        if (this.state === '') {
            // if (creeps.length < this.needCreep.length) {
            //     this.currentPos = roomData.getSysCity().getWaitingPos();
            //     this.state = 'WAIT_CREEP'
            //     return ;
            // }
            // else {
                this.currentPos = creeps[0].pos
            // }

            // this.hostileRooms = roomData.getSysColon().getColons()
            //     .filter(c => /*c.hostile && */c.getTag() && c.active)
            //     .filter(c => c.hostile || Game.rooms[c.roomName].find(FIND_HOSTILE_CREEPS).length > 0)
            // // if (Game.rooms[this.roomOri].find(FIND_HOSTILE_CREEPS))
            //
            // if (this.hostileRooms.length === 0) {
            //     this.state = 'DESTROY';
            //     return;
            // }
            // const roomDistance = this.hostileRooms
            //     .filter(a => a != null)
            //     .map(r => {
            //         return {
            //             room: r,
            //             distance: Game.map.findRoute(this.currentPos.roomName, r).length,
            //         }
            //     })
            //     .sort((a, b) => a.distance - b.distance)
            // const closestRoom = roomDistance.slice(-1);
            if (/*closestRoom.length > 0 || */true) {
                // this.currentRoom = closestRoom[0].room.roomName;
                // this.currentRoom = 'E58N5';
                // this.currentRoom = Game.flags.WW.pos.roomName//'E58N5';
                // this.currentPos = new RoomPosition(25, 25, this.currentRoom)
                // this.currentPos = Game.flags.WW.pos
                this.state = 'WORK';
            }
        }

        if (this.state === 'WAIT_CREEP') {
            this.currentPos = roomData.getSysCity().getWaitingPos() //inRoomCreeps[0].pos;
            // const inRoomCreeps = this.getAllGroupCreepObj(gameAccess)
            //     .filter(c => c.pos != null)
            //     .filter(c => c.pos.roomName === this.roomHandle)
            // if (inRoomCreeps.length === this.getAllGroupCreep().length /*&& inRoomCreeps.length >= 2*/) {
                this.currentPos = Game.flags.WW.pos
                // this.currentPos = new RoomPosition(25, 25, this.currentRoom)
                this.state = 'WORK';
                // return;
            // }
        }

        if (this.state === 'WORK') {
            if (this.currentPos.roomName !== this.currentRoom) {
                this.currentPos = Game.flags.WW.pos
                // this.currentPos = new RoomPosition(25, 25, this.currentRoom)
            }

            if (Game.rooms[this.currentPos.roomName]) {
                this.state = 'CLEAN'

            }
        }


        // if (this.sysSourceKeeper === undefined) {
        //     const sources = gameAccess.getRoom(this.currentRoom).find(FIND_SOURCES)
        //     const closest = this.currentPos.findClosestByPath(sources)
        //     if (closest != null) {
        //         this.sysSourceKeeper = new SysCitySource(closest.id);
        //     }
        // }
        // this.sysSourceKeeper.update(gameAccess)
        // this.sysSourceKeeper.externalDebug(gameAccess)

        // const guard = this.sysSourceKeeper.getBestOutputStorePos().findInRange(FIND_HOSTILE_CREEPS, 3);
        // this.containGuard = guard.length > 0 ? guard[0].id : undefined;
        if (this.state === 'CLEAN') {
            if (this.currentPos.roomName !== this.currentRoom) {
                this.currentPos = Game.flags.WW.pos
                // this.currentPos = new RoomPosition(25, 25, this.currentRoom)
            }
            const targetEnemy = this.currentPos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (targetEnemy) {
                this.targetAttack = targetEnemy.id;
                this.currentPos = targetEnemy.pos
                return
            }
            const hostileConst = this.currentPos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES);
            if (hostileConst) {
                this.targetAttack = hostileConst.id;
                this.currentPos = hostileConst.pos
                return
            }
            const hostileStruct = this.currentPos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
            if (hostileStruct) {
                this.targetAttack = hostileStruct.id;
                this.currentPos = hostileStruct.pos
                return
            }
            Logs.logA(`Guard group ${this.getGroupId()} finish`, this.hostileRooms)
            // this.state = '';
        }


        this.saveMemory();
    }

    /**
     * @param creep {Creep}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runCreep(creep, gameAccess, roomData) {


        const friends = this.getAllGroupCreepObj(gameAccess)
            .filter(c => c.id !== creep.id);

        if (creep.getActiveBodyparts(HEAL) > 0) {
            if (creep.hits < creep.hitsMax) {
                creep.heal(creep);
            }
            friends
                .filter(c => c.hits < c.hitsMax)
                .filter(c => c.pos.isNearTo(creep.pos))
                .forEach(c => creep.heal(c))
        }

        if (this.state === 'DESTROY') {
            if (creep.pos.roomName !== this.roomHandle) {
                creep.moveToRoom(this.roomHandle)
            }
            else {
                creep.suicide();
            }
            return;
        }

        if (this.state === 'CLEAN') {
            const targetGroup = gameAccess.Game.getObjectById(this.targetAttack)
            const targetEnemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            const target = targetGroup == null ? targetEnemy : targetGroup;
            utils.talkAction(creep, `${Math.round((creep.hits/creep.hitsMax)*100)}`)
            if (target != null) {
                if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                    if (creep.rangedAttack(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target)
                    }
                }
                if (creep.getActiveBodyparts(ATTACK) > 0) {
                    const target = gameAccess.Game.getObjectById(this.targetAttack)
                    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target)
                    }
                }
                return;
            }
        }

        if (this.state === 'RECYCLE' || this.state === 'WAIT_CREEP') {
            const minTTL = this.endRecycleTTL;
            if (creep.ticksToLive <= minTTL && creep.memory.role !== BotRole.RECYCLER) {
                creep.memory.roleTmp = String(creep.memory.role);
                creep.memory.role = BotRole.RECYCLER
                if (creep.memory.firstRecycle) {
                    creep.memory.firstRecycle = undefined;
                }
                return;
            }
        }

        creep.moveTo(this.currentPos)

        // const role = creep.memory.role
        // if (this.modules.has(role)) {
        //     return this.modules.get(role).runCreep(creep, gameAccess, roomData, this);
        // }

    }

    /**
     * @param box {VisualUiBox}
     * @param visual {RoomVisual}
     */
    debugExternalCustom(box, visual) {
        box.addLine(`Hostile room ${this.hostileRooms.map(h => h.roomName)}`)
        box.addLine(`Current room ${this.currentRoom}`)
        box.addLine(`Current pos ${this.currentPos}`)
        box.addLine(`targetAttack pos ${this.targetAttack}`)
    }

    getLog(gameAccess) {
        const tgt = gameAccess.Game.getObjectById(this.targetAttack);
        if (tgt != null) {
            const value = 100 - ( (tgt.hits / tgt.hitsMax) * 100 )
            return `tgt [${ Math.round(value * 100) / 100}%]`
        }
        return '';
    }
}

module.exports = SysInterCityGroupModuleGuard;