const SysWorkbench = require('sys/workbench/SysWorkbench')

class MineralWorkbench extends SysWorkbench {
    constructor(idExtractor, handleRoom) {
        super(idExtractor, handleRoom)
        this.offsetFindBench = 1;

        this.typeMineral = undefined;
        this.idMineral = undefined;
        this.ticksToRegeneration = undefined
        this.mineralAmount = undefined
    }

    /**
     * @param gameAccess
     * @param extractor {StructureExtractor}
     */
    customUpdate(gameAccess, extractor) {
        if (extractor == null) {
            return;
        }

        if (this.idMineral == null) {
            /** @type {Mineral} */
            const mineral = gameAccess.getRoom(extractor.pos.roomName).find(FIND_MINERALS)[0];
            if (mineral != null) {
                this.updateMineral(mineral);
            }
        }
        const mineral = gameAccess.Game.getObjectById(this.idMineral)
        this.updateMineral(mineral);
    }

    /**
     * @return {string}
     */
    getMineralId() {
        return this.idMineral;
    }

    /**
     * @param mineral {Mineral}
     */
    updateMineral(mineral) {
        this.idMineral = mineral.id;
        this.typeMineral = mineral.mineralType
        this.ticksToRegeneration = mineral.ticksToRegeneration
        this.mineralAmount = mineral.mineralAmount

        this.exploitResource = mineral.mineralType;
    }

    /**
     * @param visual {RoomVisual}
     * @param source {Source}
     * @param box {VisualUiBox}
     */
    debugCustomShowWorkBench(visual, source, box) {
        if (this.ticksToRegeneration === undefined) {
            box.addLine(`Mineral: ${this.typeMineral}:${this.mineralAmount}`)
        }
        else {
            box.addLine(`Mineral: Regen[${this.ticksToRegeneration}]`)
        }
    }

    bodyFlowCalcul() {
        return this.mineralAmount > 0 ? 1 : 0;
    }

    updateCarryInput() {
        return false;
    }

    updateCarryOutput() {
        return this.helperCarryStatusByAmount(amount => amount > 0);
    }

    /**
     * @return {WorkerOrder}
     * @param storage
     * @param mainStorage
     */
    onWorkOrder(storage, mainStorage) {
        return this.helperWorkOrderWithdraw(storage, mainStorage)
    }
}

module.exports = MineralWorkbench;