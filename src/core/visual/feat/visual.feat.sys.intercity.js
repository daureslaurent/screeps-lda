const _moduleVisual = require('core/visual/visual._module');
const RoomData = require('core/game/RoomData');
const SysStorageUnit = require('sys/storage/sys.storage.unit');
const SysWorker = require('sys/worker/SysCityWorker');
const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const NeedsGame = require('core/interface/model.needsGame');
const VisualUiBox = require('core/visual/visual.ui.box')
const VisualUiSelector = require('core/visual/visual.ui.selector')
const BotRole = require('core/enum/BotRole')
const utils = require('utils/utils')

// const DEFAULT_ROOM = 'E22S34'
// const DEPOSIT_STYLE = {
//     radius: 0.2,
//     fill: 'blue',
//     opacity: 0.7,
// }
// const WITHDRAW_STYLE = {
//     radius: 0.2,
//     fill: 'green',
//     opacity: 0.7,
// }
// const WITHDRAW_STYLE_PRINCIPALS = {
//     radius: 0.2,
//     fill: 'green',
//     opacity: 0.7,
// }
// const WITHDRAW_STYLE_CARRY = {
//     radius: 0.2,
//     fill: 'yellow',
//     opacity: 0.7,
// }

class VisualFeatSysWorker extends _moduleVisual {

    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('VisualFeatSysWorker', NeedsGame.ALL, gameAccess);
        this.roomData = roomData;
        this.room = roomData.room;
        this.roomVisual = roomData.getRoomGame().visual;
        this.mapCities = new Map();
    }

    banner() {
    }

    run() {
        const flag = Game.flags[this.room + 'IS']
        if (flag) {
            this.drawSysIntercity(flag);
        }
    }

    drawSysIntercity(flag) {
        const sysInterCity = this.roomData.getSysInterCity();
        const roomVisual = Game.rooms[flag.pos.roomName].visual;

        const box = new VisualUiBox(
            roomVisual,
            flag.pos,
        );

        box.setTitle('Inter City')
        // sysInterCity.getAllColonies().forEach(c => {
        //     box.addLine(`= ${c.getRoomName()} == ${c.getRoomMaster()}`)
        // })

        box.addLine('Cities')
        sysInterCity.getAllRoomCity().forEach(rc => {
            box.addLine(`[${rc.roomName}][${rc.level}]${rc.progressLevel.toFixed(2)}%🌼${rc.mainEnergy}\t⚡${rc.totalFlow}/t`)
        })

        box.draw();
    }

}

module.exports = VisualFeatSysWorker;