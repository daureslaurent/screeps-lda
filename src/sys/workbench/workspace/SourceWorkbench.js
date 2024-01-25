const SysWorkbench = require('sys/workbench/SysWorkbench')
const WorkerType = require('sys/worker/core/model/WorkerType');

class SourceWorkbench extends SysWorkbench {
    constructor(idSource, handleRoom, isColon) {
        super(idSource, handleRoom)
        this.isColon = isColon;
    }

    /**
     *
     * @param visual {RoomVisual}
     * @param source {Source}
     * @param box
     */
    debugCustomShowWorkBench(visual, source, box) {
        box.setTitle(`Source [${this.distanceToMain}]`)
        box.addLine(`Energy ${this.energy} / ${this.energyCapacity} [${this.ticksToRegeneration}]`);
    }


    /**
     * @param gameAccess
     * @param baseObject {Source}
     */
    customUpdate(gameAccess, baseObject) {
        if (baseObject != null) {
            this.energy = baseObject.energy
            this.energyCapacity = baseObject.energyCapacity
            this.ticksToRegeneration = baseObject.ticksToRegeneration || -1
        }
    }

    bodyFlowCalcul() {
        const value = (this.energy / HARVEST_POWER) / this.ticksToRegeneration
        return Math.round(value * 10) / 10;
    }

    updateCarryInput() {
        return false;
    }

    updateCarryOutput() {
        const value = this.isColon
            ? 500 - this.distanceToMain
            : 800
        return this.helperCarryStatusByAmount(amount => amount >= value);
    }

    /**
     * @return {WorkerOrder}
     * @param storage
     * @param mainStorage
     */
    onWorkOrder(storage, mainStorage) {
        return this.helperWorkOrderWithdraw(storage, mainStorage,
            this.isColon ?WorkerType.CARRY_COLONIE :WorkerType.CARRY)
    }
}

module.exports = SourceWorkbench;