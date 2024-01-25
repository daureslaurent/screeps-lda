const _nexusFeat = require('sys/nexus/core/_nexusFeat');
const BuildData = require('sys/nexus/build/BuildData');
class _nexusBuilderFeat extends _nexusFeat {
    /**
     * @param name {string}
     * @param updateWait {number}
     * @param levelToTrigger {number}
     */
    constructor(name, updateWait = undefined, levelToTrigger) {
        super(name, updateWait, levelToTrigger);
    }

    /**
     * @abstract
     * @return {BuildData[]}
     */
    getBuildData() {
        return []
    }

    /**
     * @param posRaw {{x: number, y: number, roomName: string}}
     * @param structureType
     * @param cb {function(terrain)}
     * @return {BuildData}
     */
    checkPosTerrain(posRaw, structureType, cb) {
        if (posRaw.x > 0 && posRaw.x < 49 && posRaw.y > 0 && posRaw.y < 49) {
            const pos = new RoomPosition(posRaw.x, posRaw.y, posRaw.roomName);
            const terrain = pos.lookFor(LOOK_TERRAIN)
            if (terrain !== undefined && cb(terrain)) {
                return new BuildData(undefined, pos, structureType)
            }
        }
        return undefined;
    }

    /**
     * @param posRaw {{x: number, y: number, roomName: string}}
     * @param structureType
     * @return {BuildData}
     */
    checkPosTerrainNotWall(posRaw, structureType) {
        if (posRaw.x > 0 && posRaw.x < 49 && posRaw.y > 0 && posRaw.y < 49) {
            const pos = new RoomPosition(posRaw.x, posRaw.y, posRaw.roomName);
            const terrain = pos.lookFor(LOOK_TERRAIN)
            if (terrain !== undefined && terrain != 'wall') {
                return new BuildData(undefined, pos, structureType)
            }
        }
        return undefined;
    }

    /**
     * @param posRaw {{x: number, y: number, roomName: string}}
     * @param cbTerrain {function(terrain):boolean}
     * @param cbStructure {function(structureType[]):string}
     * @return {BuildData}
     */
    checkPosStructureTerrain(posRaw, cbTerrain, cbStructure) {
        if (posRaw.x > 0 && posRaw.x < 49 && posRaw.y > 0 && posRaw.y < 49) {
            const pos = new RoomPosition(posRaw.x, posRaw.y, posRaw.roomName);
            const terrain = pos.lookFor(LOOK_TERRAIN)
            if (terrain !== undefined && cbTerrain(terrain)) {
                const lookOver = [...pos.lookFor(LOOK_STRUCTURES), ...pos.lookFor(LOOK_CONSTRUCTION_SITES)]
                return new BuildData(undefined, pos, cbStructure(lookOver))
            }
        }
        return undefined;
    }
}

module.exports = _nexusBuilderFeat;