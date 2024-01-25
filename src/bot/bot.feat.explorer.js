const _moduleBot = require('core/interface/_moduleBot');
const utils = require('utils/utils')
const BotRole = require('core/enum/BotRole')

class BotFeatExplorer extends _moduleBot {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotFeatCristobal', BotRole.EXPLORER, gameAccess, roomDataFactory);
    }

    /**
     *
     * @param creepFast {Creep}
     */
    run(creepFast) {
        const creep = this.gameAccess.Game.getObjectById(creepFast.id);
        if (creep == null) {
            console.log('creep null !')
            return;
        }

        const roomData = this.getRoomData();
        const sysColon = roomData.sysColon;

        // const hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        // if (hostile) {
        //     if (creep.rangedAttack(hostile) === ERR_NOT_IN_RANGE) {
        //         creep.moveTo(hostile, { visualizePathStyle: { stroke: '#ff0000' } });
        //     }
        // }
        // else {
        if (!sysColon.needExplorer()) {
            const hostile = sysColon.getRoomsHostile();
            if (hostile.length > 0) {
                creep.moveToRoom(hostile[0].roomName)
                utils.talkAction(creep, `🐅 ${hostile[0].roomName}`)
                return
            } else {
                utils.talkAction(creep, `🚩`);
                // creep.moveTo(Game.flags.B);
                return
            }
        }
        if (!creep.memory.exploring) {
            const explore = sysColon.getExplorerBotRooms();

            if (explore.length > 0 && explore[0] != null) {
                creep.memory.exploring = explore[0].roomName;
                creep.memory.scanning = 10;
                utils.talkAction(creep, `Explore - ${creep.memory.exploring}`);
            } else {
                creep.memory.needEvolve = true;
            }
        }

        const exploring = creep.memory.exploring;

        if (exploring !== undefined /*&& creep.room.name !== exploring*/) {
            // console.log(`EXPLORE ROOM: ${exploring}`);
            utils.talkAction(creep, `Exploring - ${exploring}`);
            if (!this.isAccessibleRoom()) {
                sysColon.getColon(exploring).explored = true;
                return;
            }
            creep.moveTo(new RoomPosition(25, 25, exploring));
        } else {
            // console.log(`Exploring ${exploring} - ${creep.memory.scanning}`);

            if (creep.memory.scanning > 0) {
                utils.talkAction(creep, `scanning ...`);
                creep.moveToRoom(exploring, 5)

                creep.memory.scanning -= 1;
            } else {
                creep.memory.exploring = undefined;
            }
        }
    }

    isAccessibleRoom(currentRoom, targetRoom) {
        if (currentRoom === targetRoom) {
            return true;
        }
        const currentRoomStatus = Game.map.getRoomStatus(currentRoom);
        const targetRoomStatus = Game.map.getRoomStatus(targetRoom);
        return (currentRoomStatus.status === 'respawn' && targetRoomStatus.status === 'respawn') ||
            (currentRoomStatus.status === 'normal' && targetRoomStatus.status === 'normal')
    }

    // }
}

module.exports = BotFeatExplorer;