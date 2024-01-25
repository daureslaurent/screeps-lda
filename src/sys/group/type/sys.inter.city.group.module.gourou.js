const utils = require('utils/utils')
const utilsBuild = require('utils/utils.build')
const BotRole = require('core/enum/BotRole')
const GroupType = require('sys/group/GroupType');
const GroupUnit = require('sys/group/GroupUnit');

const USE_MEMORY = true;

class SysInterCityGroupModuleGourou extends GroupUnit {
    /**
     * @param roomDataFactory {RoomDataFactory}
     * @param roomOri {string}
     * @param flagPos {RoomPosition}
     */
    constructor(roomOri, roomDataFactory, flagPos) {
        super(GroupType.GOUROU, roomOri, roomDataFactory);
        this.needFullCreepOperate = true;
        this.recyleTTL = 0;
        this.groupId += ':' + flagPos.roomName

        this.flagPos = flagPos;

        // this.currentPos = Game.flags.G2.pos

        // this.appendNeed(BotRole.GOUROU, 4)
        // this.appendNeed(BotRole.GOUROU, 4)
        // this.appendNeed(BotRole.GOUROU, 2)

        this.targetPos = undefined;

        /** @type {{path: RoomPosition[], opts: number, cost: number, incomplete: boolean}} */
        this.path = undefined
        this.indexPath = 0;
        this.maxIndexCreep = 0;

        this.suspend = false;
        this.creepLeadId = undefined;
        this.tmpPosLead = undefined;
        this.targetPosTmp = undefined;

        /** @type {Map<string, string[]>} */
        this.sourcesMap = new Map();
        this.constructId = undefined;

        /** @type {RoomPosition[]} */
        this.keeperPositions = []


        this.constructMemory();
        if (USE_MEMORY === true) {
            this.loadMemory();
        }

        if (this.tmpPosLead) {
            this.currentPos = this.tmpPosLead
        }

        this.enableRecycle = false;

        // this.targetPosTmp = undefined;
        // this.currentPos = Game.flags.G2.pos;
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
            Memory.sysGroup.base[this.roomOri][this.groupId].currentPos = this.currentPos;
            Memory.sysGroup.base[this.roomOri][this.groupId].state = this.state;
            Memory.sysGroup.base[this.roomOri][this.groupId].creepLeadId = this.creepLeadId;
            Memory.sysGroup.base[this.roomOri][this.groupId].tmpPosLead = this.tmpPosLead;
            Memory.sysGroup.base[this.roomOri][this.groupId].keeperPositions = this.keeperPositions;
        }
    }

    loadMemory() {
        const memory = Memory.sysGroup.base[this.roomOri][this.groupId]
        if (memory) {
            this.tmpPosLead = memory.tmpPosLead || undefined;
            this.creepLeadId = memory.creepLeadId || undefined;
            this.currentWork = memory.currentPos || undefined;
            this.keeperPositions = memory.keeperPositions || [];
            this.state = memory.state || 'INIT'
        }
    }

    findRoute() {
        console.log('=== find route')
        // let origin = this.tmpPosLead || this.currentPos;
        let origin = this.tmpPosLead || Game.rooms[this.roomOri].controller.pos;
        if (origin.roomName === this.roomHandle && Game.flags.G2) {
            origin = Game.flags.G2.pos;
        }
        // let origin = Game.flags.G2.pos;
        let destination = this.targetPos;

        let roomsToAvoid = ['E57N4'];

        const avoidFlag = Game.flags.AV0;
        if (avoidFlag) {
            roomsToAvoid.push(avoidFlag.pos.roomName)
        }


        const creepHostileFound = this.keeperPositions;

        // Use PathFinder to find a safe path through the room
        this.path = PathFinder.search(origin, {
            pos: destination,
            range: 0,
        }, {
            maxOps: 10000,
            // Avoiding Keeper Lair tiles
            roomCallback: function (roomName) {
                let costs = new PathFinder.CostMatrix();
                if (roomsToAvoid.includes(roomName)) {
                    for (let x = 0; x < 50; x++) {
                        for (let y = 0; y < 50; y++) {
                            costs.set(x, y, 0xff);
                        }
                    }
                    //33 39  31 38
                    console.log(`=== room avoid ${roomName}`)
                    return costs;
                }
                let room = Game.rooms[roomName];
                if (!room) {
                    creepHostileFound.filter(p => p.roomName === roomName)
                        .forEach(posHostile => {
                            for (let x = posHostile.x - 5; x <= posHostile.x + 5; x++) {
                                for (let y = posHostile.y - 5; y <= posHostile.y + 5; y++) {
                                    costs.set(x, y, 0xff);
                                }
                            }
                        })
                    console.log(`add cost non view room [${roomName}]`)
                    return costs;
                }

                const structuresHostile = room.find(FIND_HOSTILE_STRUCTURES)
                const containHeavyHostile = structuresHostile.filter(s => s.structureType === STRUCTURE_TOWER)
                    .length
                if (containHeavyHostile) {
                    for (let x = 0; x < 50; x++) {
                        for (let y = 0; y < 50; y++) {
                            costs.set(x, y, 0xff);
                        }
                    }
                    console.log('contain tower hostile !')
                    return costs;
                }


                room.find(FIND_HOSTILE_CREEPS)
                    .filter(c => creepHostileFound
                        .filter(pos => pos.isEqualTo && pos.isEqualTo(c.pos))
                        .length === 0)
                    .forEach(c => creepHostileFound.push(c.pos))

                // Add costs to tiles near Keeper Lairs
                room.find(FIND_HOSTILE_STRUCTURES, {
                    filter: {
                        structureType: STRUCTURE_KEEPER_LAIR,
                    },
                })
                    .forEach(function (lair) {
                        // Increase cost for tiles near Keeper Lairs
                        for (let x = lair.pos.x - 5; x <= lair.pos.x + 5; x++) {
                            for (let y = lair.pos.y - 5; y <= lair.pos.y + 5; y++) {
                                costs.set(x, y, 0xff); // Set high cost to avoid these tiles
                            }
                        }
                    });


                creepHostileFound.filter(p => p.roomName === roomName)
                    .forEach(posHostile => {
                        for (let x = posHostile.x - 5; x <= posHostile.x + 5; x++) {
                            for (let y = posHostile.y - 5; y <= posHostile.y + 5; y++) {
                                costs.set(x, y, 0xff);
                            }
                        }
                    })

                // Add costs to all structures except roads
                room.find(FIND_STRUCTURES).forEach(function (structure) {
                    if (structure.structureType !== STRUCTURE_ROAD && structure.structureType !== STRUCTURE_RAMPART) {
                        costs.set(structure.pos.x, structure.pos.y, 0xff);
                    }
                });
                return costs;
            },
        });
    }

    /**
     * @param creep {Creep}
     */
    pushCreepInSource(creep) {
        /** @type {{id: string, count: number}[]} */
        const usage = [];
        this.sourcesMap.forEach((value, key) => usage.push({
            id: key,
            count: value.length,
        }))

        const chosen = usage.sort((a, b) => b.count - a.count)
            .slice(-1)[0];
        if (chosen != null) {
            this.sourcesMap.get(chosen.id).push(creep.id);
            // Game.getObjectById(creep.id).memory.sourceId = chosen.id
            creep.memory.sourceId = chosen.id;
        }
    }


    getLog(gameAccess) {
        if (this.constructId != null) {
            /** @type {ConstructionSite} */
            const obj = gameAccess.Game.getObjectById(this.constructId);
            if (obj) {
                const v = (obj.progress / obj.progressTotal) * 100;
                return `Spawn ${Math.round(v * 100) / 100}%`
            }
        }
        return '-=-'
    }

    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runGroup(gameAccess, roomData) {
        const creeps = this.getAllGroupCreepObj(gameAccess);


        // check if need claimer
        if (!this.checkNeedClaimer) {
            const room = Game.rooms[this.flagPos.roomName];
            this.controlRoom = room && room.controller && room.controller.my;
            if (this.controlRoom !== true) {
                this.appendNeed(BotRole.CLAIMER, 3)
            }
            this.checkNeedClaimer = true;
        }

        const creepLead = gameAccess.Game.getObjectById(this.creepLeadId)
        if (this.creepLeadId != null && creepLead == null) {
            this.creepLeadId = undefined;
            this.tmpPosLead = undefined;
        } else if (creepLead != null) {
            if (this.tmpPosLead != null && this.tmpPosLead.roomName !== creepLead.pos.roomName) {
                this.state = '';
            }
            this.tmpPosLead = creepLead.pos;
        }
        console.log(`total creep ${creeps.length}`)

        if (creeps.length === 0) {
            this.byPassSpawn = false;
            console.log('no more creep !')
            return
        }
        // this.currentPos = this.;

        if (this.currentPos == null) {
            this.currentPos = this.tmpPosLead || roomData.getSysCity().getWaitingPos();
        }

        if (this.targetPos == null || !this.targetPos.isEqualTo(this.flagPos)) {
            this.targetPos = this.flagPos
            this.state = '';
        }


        /** @type {Creep} */
        const leadCreep = gameAccess.Game.getObjectById(this.creepLeadId)
        if (leadCreep != null && leadCreep.pos.roomName === this.targetPos.roomName && this.state !== 'CLAIM') {
            this.state = 'CLAIM'
        }

        const notReadyHigh = creeps
            .filter(c => c.ticksToLive < this.endRecycleTTL)
            .length

        if (this.state === undefined) {
            this.state = '';
        }

        if (this.state === 'RECYCLE') {
            this.currentPos = roomData.getSysCity().getWaitingPos();
            if (notReadyHigh === 0) {
                this.state = ''
            }
            return;
        }
        if (this.state === 'WAIT_SPAWN') {
            this.currentPos = roomData.getSysCity().getWaitingPos();
            this.tmpPosLead = null;
            return;
        }

        if (this.nextChangeRoom && leadCreep.pos.roomName) {
            this.nextChangeRoom = false
            this.state = ''
        }

        if (this.state === '') {
            if (this.currentPos != null && this.targetPos != null) {
                this.findRoute();
                this.indexPath = 0;
                this.state = 'SYNC'
            }
        }


        if ((this.path == null || this.path.path == null) && this.state !== 'CLAIM') {
            console.log('reset')
            this.state = ''
        }

        if (this.state === 'SYNC') {
            if (creeps.length === 0) {
                return;
            }
            // this.indexPath = this.maxIndexCreep + 2
            let maxIndex = -1
            let lead;
            creeps.forEach((creep, index) => {
                if (!creep.memory.gourou) {
                    creep.memory.gourou = {};
                }
                creep.memory.gourou.index = index;
                if (index > maxIndex) {
                    maxIndex = index;
                    lead = creep;
                }
            })
            this.creepLeadId = lead.id;
            this.tmpPosLead = lead.pos;
            if (this.tmpPosLead.roomName === this.targetPos.roomName) {
                this.state = 'CLAIM'
                return;
            }
            let notSync = 0;
            creeps.forEach(creep => {
                const pos = this.path.path[creep.memory.gourou.index];


                if (!creep.pos.isEqualTo(pos)) {
                    notSync++;
                    if (creep.memory.role !== BotRole.RECYCLER) {
                        if (pos.roomName !== this.roomHandle) {
                            const prePath = PathFinder.search(creep.pos, {
                                pos: pos,
                                range: 0,
                            });
                            creep.moveTo(prePath.path[0])
                            // creep.moveByPath(prePath.path);
                        } else {
                            creep.moveTo(pos)
                        }
                    }
                }
            })
            this.maxIndexCreep = creeps.length - 1;
            if (notSync === 0) {
                this.state = 'RUN';
            }

        }

        if (this.state === 'RUN') {
            const currentOffsetIndexPath = this.indexPath /*+ this.maxIndexCreep*/;

            /** @type {Creep} */
            const lead = gameAccess.Game.getObjectById(this.creepLeadId);
            if (lead.pos == null) {
                this.creepLeadId = undefined;
                this.state = '';
            }
            this.currentPos = lead.pos;
            if (this.tmpPosLead.roomName !== lead.pos.roomName) {
                //Change room , need repath for avoid keeper !
                this.tmpPosLead = lead.pos;
                this.nextChangeRoom = true;
            }

            if (!this.suspend) {
                this.indexPath++;
            } else {
                this.suspend = false;
                // this.state = '';
            }

            if (currentOffsetIndexPath >= this.path.path.length) {
                this.state = 'CLAIM'
            }
        }

        if (this.state === 'CLAIM') {
            this.byPassSpawn = true;
            utilsBuild.createIfEmpty(STRUCTURE_SPAWN, this.targetPos, Game.rooms[this.targetPos.roomName])

            const sourcesWorker = [].concat(...Array.from(this.sourcesMap.values()))
                .filter(c => c != null);
            if (this.sourcesMap.size === 0) {
                Game.rooms[this.targetPos.roomName].find(FIND_SOURCES)
                    .forEach(s => {
                        this.sourcesMap.set(s.id, [])
                    })
            }

            if (sourcesWorker.length === 0) {
                creeps
                    .filter(c => c.memory.role === BotRole.GOUROU)
                    .forEach(c => this.pushCreepInSource(c))
            }
            const objectsAtPosition = gameAccess.getRoom(this.targetPos.roomName)
                .lookForAt(LOOK_CONSTRUCTION_SITES, this.targetPos); // Change 'creep' to the type of object you're looking for

            if (objectsAtPosition.length > 0) {
                this.constructId = objectsAtPosition[0].id;
            }
            this.currentPos = this.targetPos;
        }

        this.saveMemory();
    }

    /**
     * @param creep {Creep}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runCreep(creep, gameAccess, roomData) {
        utils.talkAction(creep, 'G')
        if ((this.state === 'RECYCLE' || creep.pos.roomName === this.roomHandle) &&
            creep.memory.role !== BotRole.CLAIMER) {
            const minTTL = 1000;
            if (creep.ticksToLive <= minTTL && creep.memory.role !== BotRole.RECYCLER) {
                creep.memory.roleTmp = String(creep.memory.role);
                creep.memory.role = BotRole.RECYCLER
                if (creep.memory.firstRecycle) {
                    creep.memory.firstRecycle = undefined;
                }
                return;
            }
        }
        if (this.state === 'WAIT_SPAWN') {
            creep.moveTo(this.currentPos);
        }
        // if (creep.pos.roomName !== this.currentPos.roomName && this.state === 'SYNC') {
        //     return creep.moveToRoom(this.currentPos.roomName)
        // }

        if (this.state === 'RUN') {
            if (this.path && this.path.path.length > 0) {
                const indexCreep = this.indexPath + creep.memory.gourou.index;
                const currentPos = this.path.path[indexCreep - 1];
                const nextPos = this.path.path[indexCreep];
                // const overPos = this.path.path[indexCreep + 1];

                if (this.indexPath !== 0 && currentPos != null && !creep.pos.isEqualTo(currentPos)) {
                    this.suspend = true;
                    console.log(`GOUROU suspend nextPos ${nextPos}`)
                    // creep.moveByPath([nextPos]);
                    // PathFinder.search(creep.pos, currentPos)
                    creep.moveTo(currentPos, {
                        range: 0,
                    });
                    return;
                }

                if (nextPos != null && !this.suspend) {
                    const visual = Game.rooms[creep.pos.roomName].visual;
                    visual.circle(currentPos, {
                        radius: 0.5,
                        fill: '#ff6a00',
                    });
                    visual.circle(nextPos, {
                        radius: 0.7,
                        fill: '#44ff00',
                    });

                    creep.moveByPath([nextPos]);


                    // creep.moveTo(nextPos, {
                    // avoidCreeps: false,
                    // range: 0,
                    // });
                } else {
                    this.suspend = true;
                }
            }
            return;
            // this.suspend = true;
        }

        if (this.state === 'CLAIM') {
            if (creep.pos.roomName !== this.targetPos.roomName) {
                return creep.moveTo(this.targetPos)
            }
            if (creep.getActiveBodyparts(CLAIM) > 0) {
                if (creep.room.controller) {
                    if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                        return;
                    } else {
                        if (creep.signController(creep.room.controller, '🫵') === ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.controller);
                            return;
                        }
                    }
                }
            }
            if (creep.getActiveBodyparts(WORK) > 0) {
                if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
                    creep.memory.action = 'MINING'
                }
                if (creep.store.getFreeCapacity() === 0) {
                    creep.memory.action = 'STORE'
                }
                if (creep.memory.action === 'MINING') {
                    // if (creep.memory.sourceId === undefined) {
                    //     creep.memory.sourceId = creep.pos.findClosestByPath(creep.room.find(FIND_SOURCES)).id
                    // }
                    utils.talkAction(creep, creep.memory.sourceId)

                    if (creep.memory.sourceId !== undefined) {
                        const tgt = gameAccess.Game.getObjectById(creep.memory.sourceId)
                        if (tgt != null) {
                            const ret = creep.harvest(tgt)
                            if (ret === ERR_NOT_IN_RANGE) {
                                return creep.moveTo(tgt)
                            } else {
                                utils.talkAction(creep, ret)
                            }
                        }

                    }
                } else {
                    const buildTgt = gameAccess.Game.getObjectById(this.constructId);
                    if (buildTgt != null) {
                        if (creep.build(buildTgt) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(buildTgt);
                        }
                    }
                }
            }
        }


    }

    /**
     * @param box {VisualUiBox}
     * @param visual {RoomVisual}
     */
    debugExternalCustom(box, visual) {
        /** @type {Map<string, RoomVisual>} */
        const mapVisual = new Map();
        const currentRoomName = this.currentPos.roomName

        mapVisual.set(currentRoomName, visual);
        box.addLine(`Control room: ${this.controlRoom}`)

        this.keeperPositions
            .filter(k => k.roomName === currentRoomName)
            .forEach(p => mapVisual.get(currentRoomName)
                .circle(p, {
                    radius: 0.2,
                    fill: 'rgb(255,0,0)',
                }))

        if (this.path != null && this.path.path != null) {
            box.addLine(`Path ${this.path.path.length}`)
            box.addLine(`Index ${this.indexPath} / ${this.path.path.length}`)
            box.addLine(`Avoid POS ${this.keeperPositions.length}(${this.keeperPositions
                .filter(p => p.roomName === this.currentPos.roomName).length})`)

            this.sourcesMap.forEach((value, key) => {
                box.addLine(`Source - ${key} : ${value}`)
            })

            const currentIndexPos = this.path.path[this.indexPath];
            if (currentIndexPos != null && mapVisual.has(currentIndexPos.roomName)) {
                mapVisual.get(currentIndexPos.roomName).circle(currentIndexPos, {
                    radius: 0.2,
                    fill: 'rgb(27,178,192)',
                });
            }

            this.path.path.forEach((p, index) => {
                if (mapVisual.has(p.roomName)) {
                    if (index <= this.maxIndexCreep) {
                        mapVisual.get(p.roomName).text(index, p)
                        mapVisual.get(p.roomName).circle(p, {
                            radius: 0.2,
                            fill: 'rgb(47,255,0)',
                        });
                    } else {
                        mapVisual.get(p.roomName).circle(p, {
                            radius: 0.2,
                            fill: 'rgb(115,0,255)',
                        });
                    }
                }
            })
        }
    }

}

module.exports = SysInterCityGroupModuleGourou;