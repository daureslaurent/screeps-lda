const utils = require('src/utils/utils')
const _moduleCityWorker = require('src/core/interface/_moduleCityWorker');
const FlowType = require('core/flow/FlowType')
const BotRole = require('core/enum/BotRole');
const WorkerAction = require('sys/worker/core/model/WorkerAction');


class CityWorkerActionHarvest extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('CityWorkerActionHarvest', roomData.room, gameAccess, roomData, 1, WorkerAction.HARVEST);
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    run(action) {
        if (action.creep.memory.role === BotRole.RECYCLER) {
            return true;
        }
        if (action.creep.store.getFreeCapacity() === 0) {
            return true;
        }
        action.creep.setStatic(true);
        const retHarvest = action.creep.harvest(action.data.getTargetObject(this.gameAccess))
        if (retHarvest === OK) {
            const powerWork = utils.countBody(action.creep.body, WORK);
            const energyHarvest = powerWork * HARVEST_POWER;
            // this.roomData.getSysWorker().addBodyUsage({
            //     work: powerWork,
            // })
            this.roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.MINING).pushInput(energyHarvest)
            action.creep.setStatic(true);
            // console.log(`HARVEST [${action.creepId}]`)
            utils.talkAction(action.creep, '🛸')

            return false;
        } else if (retHarvest === ERR_NOT_ENOUGH_ENERGY) {
            return true;
        } else {
            console.log(`retHarvest ${retHarvest}`)
        }
        return true;
    }

}

module.exports = CityWorkerActionHarvest;