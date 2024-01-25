const BotRole = require('core/enum/BotRole')
const GroupType = require('sys/group/GroupType');
const GroupUnit = require('sys/group/GroupUnit');

const USE_MEMORY = true;

class TechTransport extends GroupUnit {
    /**
     * @param type {GroupType}
     * @param roomDataFactory {RoomDataFactory}
     * @param roomOri {string}
     */
    constructor(type, roomOri, roomDataFactory) {
        super(GroupType.GOUROU, roomOri, roomDataFactory);
        // this.needFullCreepOperate = true;
        // this.recyleTTL = 0;
        // this.groupId += ':'+flagPos.roomName

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

        /** @type {RoomPosition[]} */
        this.keeperPositions = []


        this.constructMemory();
        if (USE_MEMORY === true) {
            this.loadMemory();
        }

        if (this.tmpPosLead) {
            this.currentPos = this.tmpPosLead
        }

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
        let origin = this.tmpPosLead || Game.flags.G2.pos;
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
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runGroupTech(gameAccess, roomData) {

    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runGroup(gameAccess, roomData) {
        const creeps = this.getAllGroupCreepObj(gameAccess);

        /** @type {Creep} */
        const leadCreep = gameAccess.Game.getObjectById(this.creepLeadId)

        // Forgot lead
        if (this.creepLeadId != null && leadCreep == null) {
            this.creepLeadId = undefined;
            this.tmpPosLead = undefined;
        } else if (leadCreep != null) {
            if (this.tmpPosLead != null && this.tmpPosLead.roomName !== leadCreep.pos.roomName) {
                this.state = '';
            }
            this.tmpPosLead = leadCreep.pos;
        }


        console.log(`total creep ${creeps.length}`)

        if (this.currentPos == null) {
            this.currentPos = this.tmpPosLead;
        }

        if (leadCreep != null && leadCreep.pos.roomName === this.targetPos.roomName && this.state !== 'CLAIM') {
            this.state = 'CLAIM'
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

        this.saveMemory();
    }

    /**
     * @param creep {Creep}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runCreepTech(creep, gameAccess, roomData) {
        // Find route

        // Sync

        // (Recharge and oth)
        if (this.onCreepSync(creep, gameAccess, roomData) === false) {
            return;
        }

        if (this.state === 'RUN') {
            if (this.path && this.path.path.length > 0) {
                const indexCreep = this.indexPath + creep.memory.gourou.index;
                const currentPos = this.path.path[indexCreep - 1];
                const nextPos = this.path.path[indexCreep];
                const overPos = this.path.path[indexCreep + 1];

                if (this.indexPath !== 0 && currentPos != null && !creep.pos.isEqualTo(currentPos)) {
                    this.suspend = true;
                    console.log(`GOUROU suspend nextPos ${nextPos}`)
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
                } else {
                    this.suspend = true;
                }
            }
            return;
        }

        // RUN
        return this.runCreep(creep, gameAccess, roomData)
    }

    /**
     * @return {boolean}
     */
    onCreepSync() {

    }

    /**
     * @param creep {Creep}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runCreep(creep, gameAccess, roomData) {


        // utils.talkAction(creep, 'G')
        // if ((this.state === 'RECYCLE' || creep.pos.roomName === this.roomHandle)
        // && creep.memory.role !== BotRole.CLAIMER) {
        //     const minTTL = 1000;
        //     if (creep.ticksToLive <= minTTL && creep.memory.role !== BotRole.RECYCLER) {
        //         creep.memory.roleTmp = String(creep.memory.role);
        //         creep.memory.role = BotRole.RECYCLER
        //         if (creep.memory.firstRecycle) {
        //             creep.memory.firstRecycle = undefined;
        //         }
        //         return;
        //     }
        // }
        // if (this.state === 'WAIT_SPAWN') {
        //     creep.moveTo(this.currentPos);
        // }
        // if (creep.pos.roomName !== this.currentPos.roomName && this.state === 'SYNC') {
        //     return creep.moveToRoom(this.currentPos.roomName)
        // }


        // this.suspend = true;
        // }
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

module.exports = TechTransport;