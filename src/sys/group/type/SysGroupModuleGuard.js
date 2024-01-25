const BotRole = require('core/enum/BotRole')
const GroupType = require('sys/group/GroupType');
const GroupUnit = require('sys/group/GroupUnit');
const Logs = require('utils/Logs');
const utils = require('utils/utils');

const MODULES = [
    require('sys/group/type/role/building/sys.inter.city.group.role.building.carry'),
    require('sys/group/type/role/building/sys.inter.city.group.role.building.builder'),
];

const USE_MEMORY = true;

class SysGroupModuleGuard extends GroupUnit {
    /**
     * @param roomDataFactory {RoomDataFactory}
     * @param roomOri {string}
     */
    constructor(roomOri, roomDataFactory) {
        super(GroupType.GUARD, roomOri, roomDataFactory);
        this.needFullCreepOperate = false;
        const minTTL = 0;
        this.enableRecycle = false;

        this.modules = new Map();
        MODULES.forEach(m => {
            const instance = new (m)();
            this.modules.set(instance.role, instance);
        });

        this.appendNeed(BotRole.BREAKER, this.roomDataOri.getRoomLevel())

        this.appendNeed(BotRole.TANK, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.TANK, this.roomDataOri.getRoomLevel())

        this.currentRoom = undefined;
        this.hostileRooms = [];
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


    findWork(roomData) {
        this.hostileRooms = roomData.getSysColon().getColons()
            .filter(c => c.hostile && c.getTag() && c.active);

        if (this.hostileRooms.length === 0) {
            console.log('Need destroy this group !')
            this.state = 'DESTROY';
        }
        else {
            this.currentRoom = this.hostileRooms[0].roomName;
            console.log(`Target Guard room ! [${this.currentRoom}]`)
        }
    }

    onDestroy(creeps) {
        this.byPassSpawn = true;
        if (creeps.filter(c => c != null).length === 0) {
            this.toDelete = true;
            this.state = ''
            Logs.logA(`debug guard -- final destroy ${this.toDelete}`)
            this.saveMemory()
            return 'DESTROY'
        }
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runGroup(gameAccess, roomData) {
        const creeps = this.getAllGroupCreepObj(gameAccess)
        if (creeps.length === 0) {
            this.state = '';
            this.currentRoom = undefined;
            return;
        }
        if (this.currentPos == null) {
            if (creeps.length > 0) {
                this.currentPos = creeps[0].pos;
            }
            else {
                this.currentPos = roomData.getSysCity().getWaitingPos();
            }
        }

        if (this.currentRoom == null || this.currentRoom == '') {
            this.findWork(roomData);
        }

        if (this.currentRoom != null && this.currentRoom != '') {
            if (this.currentPos.roomName !== this.currentRoom) {
                console.log(`======== this.currentRoom [${this.currentRoom}]`)
                this.currentPos = new RoomPosition(25, 25, this.currentRoom)
            }
            if (Game.rooms[this.currentPos.roomName]) {
                this.state = 'CLEAN'
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
                const hostileSpawn = this.currentPos.findClosestByPath(FIND_HOSTILE_SPAWNS);
                if (hostileSpawn) {
                    this.targetAttack = hostileSpawn.id;
                    this.currentPos = hostileSpawn.pos
                    return
                }
                Logs.logA(`Guard group ${this.getGroupId()} finish`, this.hostileRooms)
                this.currentRoom = null;
            }
        }

        if (this.state === 'DESTROY') {
            const ret = this.onDestroy(creeps);
            if (ret) {
                return ret;
            }
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

        // if (this.state === 'RECYCLE' || this.state === 'WAIT_CREEP') {
        //     const minTTL = this.endRecycleTTL;
        //     if (creep.ticksToLive <= minTTL && creep.memory.role !== BotRole.RECYCLER) {
        //         creep.memory.roleTmp = String(creep.memory.role);
        //         creep.memory.role = BotRole.RECYCLER
        //         if (creep.memory.firstRecycle) {
        //             creep.memory.firstRecycle = undefined;
        //         }
        //         return;
        //     }
        // }

        creep.moveTo(this.currentPos)
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

module.exports = SysGroupModuleGuard;