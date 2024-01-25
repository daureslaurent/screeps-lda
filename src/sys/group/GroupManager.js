const GroupType = require('sys/group/GroupType');
const GroupUnit = require('sys/group/GroupUnit');
const SysInterCityGroupModuleBuilding = require('sys/group/type/sys.inter.city.group.module.building');
const SysInterCityGroupModuleKeeper = require('sys/group/type/sys.inter.city.group.module.keeper');
const SysInterCityGroupModuleGuard = require('sys/group/type/sys.inter.city.group.module.guard');
const SysInterCityGroupModuleGourou = require('sys/group/type/sys.inter.city.group.module.gourou');
const SysGroupModuleGuard = require('sys/group/type/SysGroupModuleGuard');

class GroupManager {
    /**
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(roomDataFactory) {
        /** @type {Map<string, GroupUnit[]>} */
        this.groupMap = new Map();
        this.roomDataFactory = roomDataFactory;
    }

    /**
     * @param type
     * @param roomOri
     * @param flagPos {RoomPosition}
     */
    createGroup(type, roomOri, flagPos = undefined) {
        if (!this.groupMap.has(roomOri)) {
            this.groupMap.set(roomOri, [])
        }
        this.groupMap.get(roomOri)
            .push(this.instantiateGroup(type, roomOri, flagPos));
    }

    instantiateGroup(type, roomOri, flagPos = undefined) {
        if (GroupType.BUILDING === type) {
            return new SysInterCityGroupModuleBuilding(roomOri, this.roomDataFactory)
        }
        if (GroupType.KEEPER === type) {
            return new SysInterCityGroupModuleKeeper(roomOri, this.roomDataFactory)
        }
        if (GroupType.GUARD === type) {
            // return new SysInterCityGroupModuleGuard(roomOri, this.roomDataFactory)
            return new SysGroupModuleGuard(roomOri, this.roomDataFactory)
        }
        if (GroupType.GOUROU === type) {
            return new SysInterCityGroupModuleGourou(roomOri, this.roomDataFactory, flagPos)
        }
        return new GroupUnit(type, roomOri, this.roomDataFactory);
    }

    deleteGroup(idGroup, roomOri) {
        const groups = this.groupMap.get(roomOri);
        if (groups && groups.length > 0) {
            this.groupMap.set(roomOri, groups.filter(g => g.getGroupId() !== idGroup))
        }
    }

    /**
     * @return {GroupUnit[]}
     */
    getAllGroup() {
        return [].concat(...Array.from(this.groupMap.values()));
    }

    /**
     * @param room {string}
     * @return {GroupUnit[]}
     */
    getGroupByRoomHandle(room) {
        if (!this.groupMap.has(room)) {
            return [];
        }
        return this.groupMap.get(room);
    }

    /**
     * @param room {string}
     * @return {GroupUnit[]}
     */
    getGroupByRoomOri(room) {
        return this.getAllGroup()
            .filter(g => g.roomOri === room);
    }

}

module.exports = GroupManager;