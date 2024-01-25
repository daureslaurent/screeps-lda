const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const GroupType = require('sys/group/GroupType');
const utils = require('src/utils/utils');
const utilsSpawn = require('src/utils/utils.spawn');
const {
    SPAWNER,
} = require('core/flow/FlowType');
const BotRole = require('core/enum/BotRole')
const Logs = require('utils/Logs');
const SpawnerType = require('sys/spawner/model/SpawnerType')

class CityFeatIntercity extends _moduleCityFeat {

    /**
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatIntercity', room, gameAccess, roomData, 10);
    }

    slowRun() {
        const sysGroup = this.roomData.getSysInterCity().getSysGroup();
        const creepsGroup = this.gameAccess.getAllCreepsArray()
            .filter(c => c.interCity !== undefined && c.baseRoom === this.room)

        // Run groups handle by room
        sysGroup.getGroupByRoomHandle(this.room)
            .forEach(g => {
                // Search
                creepsGroup
                    .filter(c => c.interCity.groupId === g.getGroupId())
                    .forEach(c => {
                        const role = c.role === BotRole.RECYCLER ? c.roleTmp : c.role
                        if (role != null) {
                            g.appendCreep(role, c.id)
                        }
                    })
                // Update missing creep for avoid not wanted WAIT_SPAWN
                const spawnNeed = g.getSpawnSummary();

                g.update(this.gameAccess);
                g.handleGroup(this.gameAccess);
                g.debugExternal();

                // Spawn from needs
                if (spawnNeed.length > 0) {
                    const spawnElem = spawnNeed[0]
                    this.roomData.getSysSpawner()
                        .pushAskSpawn(spawnElem.role, spawnElem.level,  SpawnerType.GROUP, {groupId: g.getGroupId()});
                }
            })

        sysGroup.getAllGroup()
            .filter(g => g.toDelete === true)
            .forEach(g => sysGroup.deleteGroup(g.getGroupId(), g.roomOri))
    }

    run() {
        if (this.roomData.getRoomLevel() < 3) {
            return
        }
        const sysInterCity = this.roomData.getSysInterCity();
        const sysGroup = sysInterCity.getSysGroup();

        // Check existing group from groups
        const groups = sysGroup.getGroupByRoomOri(this.room)
        const creepAliveOK = this.roomData.getCreeps().length > 5;
        const mainStorageOk = this.roomData.getSysStorage().getMainStorage() != null
            && this.roomData.getSysStorage().getMainStorage().getEnergy() > 5000

        // const hostilInRoom = this.roomData.getRoomGame().find(FIND_HOSTILE_CREEPS).length > 0;
        const colonActive = this.roomData.getSysColon().getAllColon()
            .filter(c => c.active && c.getTag())
            .length > 0

        if (groups.filter(g => g.type === GroupType.BUILDING).length === 0
            && this.roomData.getRoomLevel() >= 3 && creepAliveOK && mainStorageOk && colonActive
        ) {
            sysGroup.createGroup(GroupType.BUILDING, this.room);
        }
        // if (groups.filter(g => g.type === GroupType.GUARD).length === 0 && hostilInRoom) {
            // sysGroup.createGroup(GroupType.GUARD, this.room);
        // }

        const gourouFlags = [
            Game.flags.GOUROU,
            // Game.flags.GOUROU2,
        ]

        gourouFlags
            .filter(f => f != null)
            .filter(f => groups
                .filter(g => g.type === GroupType.GOUROU)
                .filter(g => g.flagPos != null && g.flagPos.roomName === f.pos.roomName)
                .length === 0)
            .forEach(f => {
                if (/*this.room === 'E58N6' && */creepAliveOK /*&& mainStorageOk*/) {
                    sysGroup.createGroup(GroupType.GOUROU, this.room, f.pos);
                }
            })

        const hostileColon = this.roomData.getSysColon().getColons()
            .filter(c => c.hostile && c.getTag() && c.active)
        if (groups.filter(g => g.type === GroupType.GUARD).length === 0 && hostileColon.length > 0) {
            sysGroup.createGroup(GroupType.GUARD, this.room);
        }
        this.slowRun();
    }

}

module.exports = CityFeatIntercity;