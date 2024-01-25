const BotRole = require('core/enum/BotRole')
const WorkerCreepAbstract = require('sys/worker/core/WorkerCreepAbstract');
const WorkerType = require('sys/worker/core/model/WorkerType');

// MODULES
const MODULES_WORK_TYPE = [
    require('sys/worker/role/transport/city.worker.refill'),
    require('sys/worker/role/transport/city.worker.pickup.dropped'),
    require('sys/worker/role/transport/city.worker.pickup.dropped.tombstone'),
    require('sys/worker/role/transport/city.worker.carry'),
    require('sys/worker/role/transport/WorkerRoleOperator'),
    // require('sys/worker/role/city.worker.carry.intercity'),
]
const MODULES_ACTION = [
    require('sys/worker/action/city.worker.action.move'),
    require('sys/worker/action/city.worker.action.pickup'),
    require('sys/worker/action/city.worker.action.pick.Tombstone'),
    require('sys/worker/action/city.worker.action.storage.deposit'),
    require('sys/worker/action/city.worker.action.storage.deposit.helper'),
    require('sys/worker/action/city.worker.action.storage.withdraw'),
    require('sys/worker/action/city.worker.action.storage.withdraw.helper'),
    require('sys/worker/action/city.worker.action.transfert'),
]

const customOrder = [
    WorkerType.REFILL,
    WorkerType.OPERATOR,
    WorkerType.CARRY,
    WorkerType.CARRY_INTER_CITY,
    WorkerType.PICKUP_DROPPED,
    WorkerType.PICKUP_TOMB,
];

class SysCityTransporter extends WorkerCreepAbstract {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomName {string}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomName, roomData) {
        super(gameAccess, roomName, roomData, 'TransporterWorker')
    }


    setHandleBotRole() {
        return [BotRole.TRANSPORTER];
    }

    setModules(modulesWorkerType, modulesAction, gameAccess, roomData) {
        this.fillModules(MODULES_WORK_TYPE, modulesWorkerType, gameAccess, roomData)
        this.fillModules(MODULES_ACTION, modulesAction, gameAccess, roomData)
    }

    setOrderSort() {
        return customOrder;
    }

    debugCustomExternal(visual, posOri, gameAccess) {
        return this.basicDebug(posOri, visual, gameAccess)
    }

}

module.exports = SysCityTransporter;