const Logs = require('utils/Logs');
const utilsBuildNexus = require('utils/utils.build.nexus');
const DEBUG_VISUAL = true;
const SEARCH_ARRAY_TWO = [{
    dx: 0,
    dy: 2,
},
    {
        dx: 2,
        dy: 0,
    },
    {
        dx: 2,
        dy: 2,
    },
    {
        dx: 0,
        dy: -2,
    },
    {
        dx: -2,
        dy: 0,
    },
    {
        dx: -2,
        dy: -2,
    },
];

/**
 * @param pos1
 * @param pos2
 * @param blackList
 * @param whiteList
 * @param roomData {RoomData}
 */
function buildRoadBetweenRoomPositionInner(pos1, pos2, blackList = [], whiteList = [], roomData = undefined) {
    if (!pos1 || !pos2) {
        return
    }

    // Define your keeper room names or blacklist here
    const blackListedRooms = [ /*'E55N4', 'E56N4'*/]; // Add blacklisted room names
    const roomsToAvoid = [...blackListedRooms, ...blackList]; // Add rooms you want to avoid here
    if (roomData) {
        whiteList.push(roomData.room);
    }
    const path = PathFinder.search(pos1, {
        pos: pos2,
        range: 1,

    }, {
        maxOps: 20000,

        // plainCost: 30, // Adjust cost based on your needs
        // swampCost: 20, // Adjust cost based on your needs
        roomCallback: function (roomName) {
            let costs = new PathFinder.CostMatrix();
            // Check if the room is to be avoided
            if (roomsToAvoid.includes(roomName) || (whiteList.length > 0 && !whiteList.includes(roomName))) {
                // Assign a high cost to the entire room to avoid it
                for (let y = 0; y < 50; y++) {
                    for (let x = 0; x < 50; x++) {
                        costs.set(x, y, 0xff); // Set high cost for the entire room
                    }
                }
                return costs;
            }

            const room = Game.rooms[roomName];
            if (!room) return;
            const visual = Game.rooms[roomName].visual;

            // Use Room.getTerrain to get terrain information
            const terrain = room.getTerrain();
            for (let y = 0; y < 50; y++) {
                for (let x = 0; x < 50; x++) {
                    const terrainType = terrain.get(x, y);
                    if (terrainType === TERRAIN_MASK_WALL) {
                        costs.set(x, y, 0xff);
                    }
                    else if (terrainType === TERRAIN_MASK_SWAMP) {
                        costs.set(x, y, 50);
                    }
                    else {
                        costs.set(x, y, 20)
                    }
                }
            }

            if (roomData !== undefined && roomData.room === roomName) {
                const nexus = utilsBuildNexus.buildNexus(roomData.getMainSpawn().pos);
                nexus.road.forEach(pos => {
                    costs.set(pos.x, pos.y, 0x00);
                });
                [
                    ...nexus.extension,
                    ...nexus.tower,
                    ...nexus.spawnPos,
                    ...nexus.waitingPos,
                    ...nexus.emptyPos,
                ].forEach(pos => {
                    costs.set(pos.x, pos.y, 0xff);
                })
            }

            room.find(FIND_CONSTRUCTION_SITES).forEach(function (structure) {
                if (structure.structureType === STRUCTURE_ROAD) {
                    costs.set(structure.pos.x, structure.pos.y, 0);
                }
            });

            room.find(FIND_STRUCTURES).forEach(function (structure) {
                if (structure.structureType !== STRUCTURE_ROAD
                    && structure.structureType !== STRUCTURE_RAMPART
                    && structure.structureType !== STRUCTURE_CONTAINER
                ) {
                    costs.set(structure.pos.x, structure.pos.y, 0xff);
                }
                else if (structure.structureType === STRUCTURE_ROAD) {
                    costs.set(structure.pos.x, structure.pos.y, 0);
                }
                else if (structure.structureType === STRUCTURE_RAMPART) {
                    costs.set(structure.pos.x, structure.pos.y, 0);
                }
                else {
                    costs.set(structure.pos.x, structure.pos.y, 100);
                }
            });

            return costs;
        },
    });


    // Build roads along the path
    for (let i = 0; i < path.path.length; i++) {
        const pos = path.path[i];
        const room = Game.rooms[pos.roomName];
        if (room) {
            color = roomData === undefined
                ? 'rgba(91,146,255,0.81)'
                : 'rgba(203,105,210,0.85)'
            room.visual.circle(pos, {fill: color,})
            room.createConstructionSite(pos, STRUCTURE_ROAD)
        }

    }
}

module.exports = {
    createConstruction(pos, typeStructure, room) {
        if (!room || pos.roomName !== room.name) {
            console.log('createConstruction: !!!!! POSSIBLE ERROR ON [ROOM GAME] VS [ROOM POS] !!!!')
        }
        if (pos) {
            const result = room
                .createConstructionSite(pos.x, pos.y, typeStructure);
            if (result !== OK) {
            }
        }
    },
    /**
     * @param structureType {string}
     * @param pos {RoomPosition}
     * @param room {Room}
     */
    createIfEmpty(structureType, pos, room) {
        if (!room) {
            console.log('invalide room !')
        }
        if (pos.roomName !== room.name) {
            pos.roomName = room.name
        }
        if (this.isEmptyStructurePos(pos, room)) {
            this.createConstruction(pos, structureType, room);
        }
    },
    /**
     * @param pos {RoomPosition}
     * @param room {Room}
     * @param structureType {string}
     */
    destroyIfExists(structureType, pos, room) {
        if (!room) {
            console.log('Invalid room!');
            return;
        }
        const structures = pos.lookFor(LOOK_STRUCTURES);
        const structure = structures.find(s => s.structureType === structureType && s.pos.isEqualTo(pos));

        if (structure) {
            structure.destroy();
        }
    },
    /**
     * @param pos {RoomPosition}
     * @param room {Room}
     * @return {boolean}
     */
    isEmptyStructurePos(pos, room) {
        const obj = room.lookAt(pos)[0]
        if (!this.isTerrainFree(room.getTerrain(), pos)) {
            return false;
        }
        return obj === undefined || obj.structureType === undefined
    },
    /**
     * @param terrain {Terrain}
     * @param pos {RoomPosition}
     */
    isTerrainFree: (terrain, pos) => {
        if (pos == null) {
            return false
        }
        return terrain.get(pos.x, pos.y) !== TERRAIN_MASK_WALL
    },
    /**
     * @param refPos {RoomPosition}
     * @param room {Room}
     * @returns {RoomPosition}
     */
    findPositionAround: (refPos, room) => {
        // console.log(`findPositionAround [${refPos}]`)
        for (const offset of SEARCH_ARRAY_TWO) {
            const x = refPos.x + offset.dx;
            const y = refPos.y + offset.dy;

            // Check if the tile at (x, y) is empty and the terrain is not 'wall'
            if (room.getTerrain().get(x, y) !== TERRAIN_MASK_WALL) {
                // console.log(`new RoomPosition(${x}, ${y}, ${room.name})`)
                return new RoomPosition(x, y, room.name);
            }
        }
    },
    /**
     * @param pos1 {RoomPosition}
     * @param pos2 {RoomPosition}
     * @param blackList {string[]}
     * @param whiteList {string[]}
     * @param roomData {RoomData}
     */
    buildRoadBetweenRoomPosition: (
        pos1,
        pos2,
        blackList = [],
        whiteList = [],
        roomData = undefined) => {
        return buildRoadBetweenRoomPositionInner(pos1, pos2, blackList, whiteList, roomData);
    },
    /**
     * @param object1 {RoomObject}
     * @param object2 {RoomObject}
     * @param blackList {string[]}
     * @param whiteList {string[]}
     * @param roomData {RoomData}
     */
    buildRoadBetweenObjects: (
        object1,
        object2,
        blackList = [],
        whiteList = [],
        roomData = undefined) => {
        if (!object1 || !object2) {
            return
        }
        return buildRoadBetweenRoomPositionInner(object1.pos, object2.pos, blackList, whiteList, roomData);
    },
    /**
     * @param room {Room}
     * @param showVisual
     */
    createWallCity(room, showVisual = false) {
        // Assuming you have access to the room object
        if (room == null) {
            return
        }

        const visual = room.visual;
        const exits = room.find(FIND_EXIT);

        // Iterate through each exit
        exits
            .filter(exit => exit !== undefined /*&& exit.pos !== undefined*/)
            .forEach(exit => {
                // Get the position of the exit
                const exitPos = exit;

                // Get positions around the exit
                const positionsAroundExit = room.lookForAtArea(LOOK_TERRAIN, exitPos.y - 2, exitPos.x - 2, exitPos.y + 2, exitPos.x + 2, true);
                // Build walls leaving 1 space around the exit
                positionsAroundExit.forEach(tile => {
                    const { x, y, terrain, } = tile;
                    if (terrain !== undefined && terrain !== 'wall' &&
                        x > 0 && x < 49 &&
                        y > 0 && y < 49) {
                        const pos = new RoomPosition(x, y, room.name);
                        if (!_.some(pos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureRoad)) {
                            if (showVisual){
                                visual.circle(pos, {
                                    radius: 0.5,
                                    fill: '#1827d5',
                                });
                            }
                            this.createIfEmpty(STRUCTURE_WALL, pos, room)
                        } else {
                            if (showVisual) {
                                visual.circle(pos, {
                                    radius: 0.5,
                                    fill: '#80d56d',
                                });
                            }
                            this.createIfEmpty(STRUCTURE_RAMPART, pos, room)
                        }
                    }
                });

            });
    },


}