const BotRole = require('core/enum/BotRole')
const GroupType = require('sys/group/GroupType');
const GroupUnit = require('sys/group/GroupUnit');
const Logs = require('utils/Logs');

const MODULES = [
    require('sys/group/type/role/building/sys.inter.city.group.role.building.carry'),
    require('sys/group/type/role/building/sys.inter.city.group.role.building.builder'),
];

const USE_MEMORY = true;
const MAX_ROOM_TIMEOUT = 600;

class SysInterCityGroupModuleBuilding extends GroupUnit {
    /**
     * @param roomDataFactory {RoomDataFactory}
     * @param roomOri {string}
     */
    constructor(roomOri, roomDataFactory) {
        super(GroupType.BUILDING, roomOri, roomDataFactory);
        this.needFullCreepOperate = true;

        this.modules = new Map();
        MODULES.forEach(m => {
            const instance = new (m)();
            this.modules.set(instance.role, instance);
        });

        this.appendNeed(BotRole.BUILDER, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.CARRY, this.roomDataOri.getRoomLevel())
        this.appendNeed(BotRole.CARRY, this.roomDataOri.getRoomLevel())

        /** @type {{ tgt:string, type: string}[]} */
        this.currentWork = [];
        this.roomRepair = [];
        this.roomConstruct = [];
        this.workRemain = -1;

        this.distanceMain = 0;

        // this.endRecycleTTL = CREEP_LIFE_TIME - (CREEP_LIFE_TIME / 10);
        this.endRecycleTTL = 700;

        /** @type {{ roomName: string, done: number }[]} */
        this.roomDone = []
        this.roomWaiting = []
        this.currentRoom = undefined;

        this.totalEnergy = 0
        this.maxEnergy = 0

        this.startTimeRoom = -1;

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
            Memory.sysGroup.base[this.roomOri][this.groupId].startTimeRoom = this.startTimeRoom;
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
            this.currentRoom = memory.currentRoom || ''
            this.state = memory.state || 'INIT'
            this.startTimeRoom = memory.startTimeRoom || -1
        }
    }

    /**
     *
     * @param gameAccess {GameAccess}
     */
    getCurrentWork(gameAccess) {
        const work = this.currentWork
            .map(w => {
                return {
                    tgt: gameAccess.Game.getObjectById(w.tgt),
                    type: w.type,
                }
            })
            .filter(w => w.tgt != null)
            .filter(w => w.tgt.pos.isEqualTo(this.currentPos))
        if (work.length > 0) {
            return work[0]
        }
        return undefined;
    }

    finishWork(idTgt, type) {
        if (type === 'REPAIR') {
            this.roomRepair = this.roomRepair.filter(v => v !== idTgt)
        } else if (type === 'CONSTRUCT') {
            this.roomConstruct = this.roomConstruct.filter(v => v !== idTgt)
        }
        this.currentWork = this.currentWork.filter(w => w.type !== type && w.tgt !== idTgt)
    }

    askRepairRoom(roomName) {
        if (/*this.currentRoom === roomName ||*/ this.roomWaiting.includes(roomName)) {
            return
        }
        if (!this.roomDone.map(d => d.roomName).includes(roomName)) {
            this.roomWaiting.push(roomName);
            this.saveMemory();
        }
    }

    finishRoom(roomName) {
        Logs.logA(`Wagon finish building - ${roomName}`, this.getGroupId())
        if (this.currentPos.roomName === roomName) {
            this.roomDone.push({
                roomName: roomName,
                done: Game.time,
            })
        }
        this.currentRoom = undefined;
        this.currentWork = [];
        this.roomConstruct = [];
        this.roomRepair = [];
        this.saveMemory();
    }

    resetRoom() {
        this.roomWaiting = this.roomWaiting.filter(r => r !== this.currentRoom)
        this.roomConstruct = [];
        this.roomRepair = [];
        this.currentWork = [];
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runGroup(gameAccess, roomData) {
        if ((this.currentPos == null && this.currentRoom != null) ||
            this.currentRoom != null &&
            this.currentRoom !== '""' &&
            this.currentRoom !== '' &&
            this.currentRoom !== this.currentPos.roomName
        ) {
            this.currentPos = new RoomPosition(25, 25, this.currentRoom);
        }

        const notReadyHigh = this.getAllGroupCreepObj(gameAccess)
            .filter(c => c.ticksToLive < this.endRecycleTTL)
            .length

        if (this.state === 'RECYCLE') {
            this.currentPos = roomData.getSysCity().getWaitingPos();
            if (notReadyHigh === 0) {
                this.state = ''
            }
            return;
        }
        if (this.state === 'WAIT_SPAWN') {
            this.currentPos = roomData.getSysCity().getWaitingPos();
        }

        if (this.state === '') {
            const colons = roomData.getSysColon().getColons().filter(c => c.getTag() && c.explored)
            this.roomWaiting = [];
            colons.forEach(colon => {
                this.askRepairRoom(colon.roomName);
            })
            if (this.roomWaiting.length === 0) {
                this.roomDone = [];
                return;
            }
            this.state = 'ROUTING'
        }
        if (this.state === 'ROUTING') {
            if (notReadyHigh !== 0 && this.currentPos.roomName === this.roomOri && roomData.getRoomLevel() > 3) {
                this.state = 'RECYCLE'
                return;
            }
            // this.distanceMain = this.currentPos.findPathTo(roomData.getSysCity().getWaitingPos()).length
            const roomDistance = this.roomWaiting
                .map(r => {
                    return {
                        room: r,
                        distance: Game.map.findRoute(this.currentPos.roomName, r).length,
                    }
                })
                .sort((a, b) => b.distance - a.distance)
            console.log(`room ${JSON.stringify(roomDistance)}`)
            const closestRoom = roomDistance.pop();
            console.log(`closest room ${JSON.stringify(closestRoom)}`)
            this.currentRoom = closestRoom.room;
            this.currentPos = new RoomPosition(25, 25, this.currentRoom)
            this.startTimeRoom = gameAccess.getTime();
            Logs.logA(`Wagon go building - ${this.currentRoom}`, this.getGroupId())
            this.state = 'WAIT_CREEP'
        }
        if (this.state === 'WAIT_CREEP') {
            const inRoomCreeps = this.getAllGroupCreepObj(gameAccess)
                .filter(c => c.pos != null)
                .filter(c => c.pos.roomName === this.currentRoom)
                .slice(-1);
            if (inRoomCreeps.length > 0) {
                this.currentPos = inRoomCreeps[0].pos;
                this.state = 'PRE_WORK';
                return;
            }
            const waitingRoomCreep = this.getAllGroupCreepObj(gameAccess)
                .filter(c => this.roomWaiting.includes(c.pos.roomName))
            if (waitingRoomCreep.length > 0) {
                this.currentRoom = waitingRoomCreep[0].pos.roomName;
                this.currentPos = new RoomPosition(25, 25, this.currentRoom)
                return;
            }
        }
        if (this.state === 'PRE_WORK') {
            // FIND REPAIR / CONSTRUCT
            const room = gameAccess.getRoom(this.currentPos.roomName);
            // Find construction sites
            this.roomConstruct = room.find(FIND_CONSTRUCTION_SITES).map(s => s.id);
            // Find structures in need of repair
            this.roomRepair = room.find(FIND_STRUCTURES, {
                filter: structure => {
                    return structure.hits < structure.hitsMax &&
                        ((structure.owner !== undefined && structure.owner === roomData.getRoomGame().controller.owner.username) ||
                            structure.owner === undefined) &&
                        (structure.structureType !== STRUCTURE_RAMPART && structure.structureType !== STRUCTURE_WALL)
                },
            }).map(s => s.id);
            this.state = 'WORK';
        }

        if (this.state === 'WORK') {
            const filterWork = this.roomRepair.length > 0 ? this.roomRepair : this.roomConstruct

            const work = filterWork
                .map(id => gameAccess.Game.getObjectById(id))
                .filter(a => a != null)
            this.workRemain = work.length;
            const timeElapsed = gameAccess.getTime() - this.startTimeRoom;
            if (work.length === 0 || timeElapsed > MAX_ROOM_TIMEOUT) {
                this.state = 'ROOM_DONE';
                return;
            }
            const closestWork = this.currentPos.findClosestByPath(work);
            if (closestWork != null && !this.currentWork.includes(closestWork.id)) {
                const type = this.roomRepair.includes(closestWork.id) ? 'REPAIR' : 'CONSTRUCT'
                const exist = this.currentWork.filter(w => w.tgt === closestWork.id).length > 0
                if (!exist) {
                    this.currentWork.push({
                        tgt: closestWork.id,
                        type: type,
                    });
                }
            }
            const workToDo = this.currentWork.slice(-1)[0];
            if (workToDo != null) {
                const objWork = gameAccess.Game.getObjectById(workToDo.tgt);
                if (objWork != null) {
                    this.currentPos = objWork.pos;
                }
                else {
                    this.currentWork = this.currentWork
                        .filter(e => e.tgt !== workToDo.tgt && e.type !== workToDo.type)
                }
            }

            const creeps = this.getAllGroupCreepObj(gameAccess);

            this.totalEnergy = creeps
                .map(c => c.store.getUsedCapacity(RESOURCE_ENERGY))
                .reduce((total, value) => total + value);
            this.maxEnergy = creeps
                .map(c => c.store.getCapacity())
                .reduce((total, value) => total + value);
            const carryCount = this.creepsMap.get(BotRole.CARRY).length
            const carryLocked = creeps.filter(c => c.memory.role === BotRole.CARRY && c.memory.locked).length;

            if (this.totalEnergy < 100 && carryLocked === carryCount && this.totalEnergy !== undefined && roomData.getRoomLevel() > 3) {
                this.resetRoom();
                this.state = 'RECYCLE'
                return;
            }
        }
        if (this.state === 'ROOM_DONE') {
            this.finishRoom(this.currentRoom);
            this.state = '';
        }
        this.saveMemory();
    }

    /**
     * @param creep {Creep}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runCreep(creep, gameAccess, roomData) {
        if (creep.memory.role === BotRole.RECYCLER) {
            return ;
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

        const role = creep.memory.role
        if (this.modules.has(role)) {
            return this.modules.get(role).runCreep(creep, gameAccess, roomData, this);
        }

    }

    /**
     * @param box {VisualUiBox}
     * @param visual {RoomVisual}
     */
    debugExternalCustom(box, visual) {
        box.addLine(`Energy ${this.totalEnergy} / ${this.maxEnergy}`)
        // box.addLine(`Distance ${this.distanceMain}`)
        box.addLine(`Room Current [${this.currentRoom}]`)
        box.addLine(`Room Done`)
        box.addLineChunk(JSON.stringify(this.roomDone.map(d => d.roomName)))
        box.addLine(`Room Waiting`)
        box.addLineChunk(JSON.stringify(this.roomWaiting))
        box.addLine(`Room Timeout: ${Game.time - this.startTimeRoom}`)

        const workElem = this.currentWork[0];
        const work = workElem != null ? `${workElem.type} @ ${workElem.tgt}` : 'No work !'
        box.addLineChunk(`${work}`)
        this.roomRepair.map(id => Game.getObjectById(id)).filter(o => o != null)
            .forEach(s => visual.circle(s.pos, {
                radius: 0.5,
                fill: 'rgba(234,255,0,0.2)',
            }))
        this.roomConstruct.map(id => Game.getObjectById(id)).filter(o => o != null)
            .forEach(s => visual.circle(s.pos, {
                radius: 0.5,
                fill: 'rgba(0,149,255,0.2)',
            }))
        this.currentWork.map(id => Game.getObjectById(id)).filter(o => o != null)
            .filter(o => o != null)
            .forEach(s => visual.circle(s.pos, {
                radius: 0.5,
                fill: 'rgba(47,255,0,0.76)',
            }))
    }

    getLog(gameAccess) {
        return `cur[${this.currentRoom}] remains[${this.workRemain}]`;
    }
}

module.exports = SysInterCityGroupModuleBuilding;