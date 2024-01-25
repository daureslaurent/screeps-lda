const BotRole = require('core/enum/BotRole')
const WorkerCreepAbstract = require('sys/worker/core/WorkerCreepAbstract');
const WorkerType = require('sys/worker/core/model/WorkerType');

const MODULES_WORK_TYPE = [
    // require('src/sys/worker/role/city.worker.starter'),
    // require('src/sys/worker/role/city.worker.miner'),
    // require('sys/worker/role/transport/city.worker.refill'),
    // require('src/sys/worker/role/city.worker.construct'),
    // require('src/sys/worker/role/city.worker.repair'),
    // require('src/sys/worker/role/city.worker.upgrader'),
    require('sys/worker/role/transport/city.worker.carry.colonies'),
    // require('src/sys/worker/role/city.worker.carry.intercity'),
    // require('src/sys/worker/role/WorkerRoleExtractor'),
]
const MODULES_ACTION = [
    require('src/sys/worker/action/city.worker.action.move'),
    // require('src/sys/worker/action/city.worker.action.harvest'),
    // require('src/sys/worker/action/city.worker.action.build'),
    require('src/sys/worker/action/city.worker.action.storage.deposit'),
    require('src/sys/worker/action/city.worker.action.storage.deposit.helper'),
    require('src/sys/worker/action/city.worker.action.storage.withdraw'),
    require('src/sys/worker/action/city.worker.action.storage.withdraw.helper'),
    // require('src/sys/worker/action/city.worker.action.transfert'),
    // require('src/sys/worker/action/city.worker.action.repair'),
    // require('src/sys/worker/action/city.worker.action.upgrade'),
]

const customOrder = [
    WorkerType.CARRY_COLONIE,
    // WorkerType.MINING_STARTER,
    // WorkerType.MINING,
    // WorkerType.UPGRADER,
    // WorkerType.REPAIR,
    // WorkerType.CONSTRUCT,
    // WorkerType.CARRY_INTER_CITY,
    // WorkerType.CARRY,
];

class SysColoniesWorker extends WorkerCreepAbstract {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomName {string}
     * @param roomData
     */
    constructor(gameAccess, roomName, roomData) {
        super(gameAccess, roomName, roomData)
        this.getClosestCreepInOrder = false;
    }

    setHandleBotRole() {
        return [BotRole.COLONIES_TRANSPORTER];
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

module.exports = SysColoniesWorker;