const BotRole = require('core/enum/BotRole')
const GroupType = require('sys/group/GroupType');
const GroupUnit = require('sys/group/GroupUnit');
const SysCitySource = require('sys/workbench/workspace/SourceWorkbench');

const MODULES = [
    require('sys/group/type/role/building/sys.inter.city.group.role.building.carry'),
    require('sys/group/type/role/building/sys.inter.city.group.role.building.builder'),
];

const USE_MEMORY = true;

class SysInterCityGroupModuleKeeper extends GroupUnit {
    /**
     * @param roomDataFactory {RoomDataFactory}
     * @param roomOri {string}
     */
    constructor(roomOri, roomDataFactory) {
        super(GroupType.KEEPER, roomOri, roomDataFactory);

        this.modules = new Map();
        MODULES.forEach(m => {
            const instance = new (m)();
            this.modules.set(instance.role, instance);
        });

        this.appendNeed(BotRole.BREAKER, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.BREAKER, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.HEALER, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.CARRY, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.CARRY, this.roomDataOri.getRoomLevel())

        this.endRecycleTTL = CREEP_LIFE_TIME - (CREEP_LIFE_TIME / 10);

        this.currentRoom = undefined;

        /** @type {SysCitySource} */
        this.sysSourceKeeper = undefined;
        this.containGuard = undefined;

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
        if (Game.flags['B2B2'] !== undefined) {
            this.currentPos = Game.flags['B2B2'].pos;
        }

        if (this.state === 'KEEPER') {
            this.state = '';
        }

        if (this.state === 'RECYCLE') {
            this.currentPos = roomData.getSysCity().getWaitingPos();
            if (notReadyHigh === 0) {
                this.state = ''
            }
            return;
        }

        if (this.state === '') {
            this.roomWaiting = [];

            roomData.getSysColon().getColons()
                .filter(c => c.getCountSource() >= 3)
                .forEach(colon => this.roomWaiting.push(colon.roomName))

            roomData.getSysColon().getColons()
                .forEach(c => console.log(c.getCountSource()))
            console.log(`=== Keeper ${this.roomWaiting}`)

            const roomDistance = this.roomWaiting
                .map(r => {
                    return {
                        room: r,
                        distance: Game.map.findRoute(this.currentPos.roomName, r).length,
                    }
                })
                .sort((a, b) => b.distance - a.distance)
            const closestRoom = roomDistance.pop();
            this.currentRoom = closestRoom.room;
            this.currentPos = new RoomPosition(25, 25, this.currentRoom)
            this.state = 'WAIT_CREEP'
        }


        if (this.state === 'WAIT_CREEP') {
            const inRoomCreeps = this.getAllGroupCreepObj(gameAccess)
                .filter(c => c.pos != null)
                .filter(c => c.pos.roomName === this.currentRoom)
                .slice(-1);
            if (inRoomCreeps.length > 0) {
                this.currentPos = inRoomCreeps[0].pos;
                this.state = 'WORK';
                return;
            }
        }

        if (this.sysSourceKeeper === undefined) {
            const sources = gameAccess.getRoom(this.currentRoom).find(FIND_SOURCES)
            const closest = this.currentPos.findClosestByPath(sources)
            if (closest != null) {
                this.sysSourceKeeper = new SysCitySource(closest.id, this.roomOri);
            }
        }
        this.sysSourceKeeper.update(gameAccess)
        this.sysSourceKeeper.externalDebug(gameAccess)

        const guard = this.sysSourceKeeper.getBestOutputStorePos().findInRange(FIND_HOSTILE_CREEPS, 3);
        this.containGuard = guard.length > 0 ? guard[0].id : undefined;

        if (this.containGuard) {
            this.state = 'CLEAN'
        }

        if (this.state === 'CLEAN') {
            if (this.containGuard) {
                // this.currentPos = gameAccess.Game.getObjectById(this.containGuard).pos
            }
        }

        console.log(`== GUARD KEEPER ${guard}`)

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

        if (creep.body.map(b => b.type).includes(HEAL)) {
            if (creep.hits < creep.hitsMax) {
                creep.heal(creep);
            }
            friends
                .filter(c => c.hits < c.hitsMax)
                .filter(c => c.pos.isNearTo(creep.pos))
                .forEach(c => creep.heal(c))
        }

        if (creep.body.map(b => b.type).includes(RANGED_ATTACK)) {
            if (this.state === 'CLEAN') {
                const target = gameAccess.Game.getObjectById(this.containGuard)
                creep.rangedAttack(target);
            }
        }


        if (this.state === 'RECYCLE') {
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
        box.addLine(`Energy ${this.totalEnergy} / ${this.maxEnergy}`)
        box.addLine(`Guard ${this.containGuard}`)
    }

}

module.exports = SysInterCityGroupModuleKeeper;