const SysWorkbench = require('sys/workbench/SysWorkbench')

class ControllerWorkbench extends SysWorkbench {
    constructor(idController, handleRoom) {
        super(idController, handleRoom)
        this.offsetFindBench = 2;
    }

    findBestPositionOutputStore(baseObject) {
        const terrain = new Room.Terrain(baseObject.room.name);
        const spaceAround = []

        this.workBench.forEach(workBench => {
            workBench.bestPos = false;
            const pos = workBench.getPos();

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const newX = pos.x + dx;
                    const newY = pos.y + dy;
                    const strPos = newX + ':' + newY
                    const newPos = new RoomPosition(newX, newY, pos.roomName);
                    if (newX >= 0 && newX <= 49 && newY >= 0 && newY <= 49 &&
                        (this.isTerrainFree(terrain, newPos) &&
                            !spaceAround.includes(strPos))) {
                        spaceAround.push(strPos);
                    }
                }
            }
        });

        const workStr = this.workBench.map(w => w.getPos()).map(pos => pos.x + ':' + pos.y)

        const finalSpaceContainer = spaceAround
            .filter(p => !workStr.includes(p))
            .map(p => p.split(':'))
            .map(split => new RoomPosition(split[0], split[1], baseObject.room.name))

        let bestPos;
        let maxPotential = -1;

        finalSpaceContainer.forEach(potentialPos => {
            let potential = 0;
            this.workBench.forEach(workBench => {
                if (
                    Math.abs(potentialPos.x - workBench.getPos().x) <= 1 &&
                    Math.abs(potentialPos.y - workBench.getPos().y) <= 1
                ) {
                    potential += 1; // Calculate potential based on your criteria
                }
            });

            if (potential > maxPotential) {
                maxPotential = potential;
                bestPos = potentialPos;
            }
        });

        return bestPos;
    }

    /**
     * @param visual {RoomVisual}
     * @param baseObject {Structure}
     * @param box
     */
    debugCustomShowWorkBench(visual, baseObject, box) {
    }

    customUpdate(gameAccess, baseObject) {
    }

    bodyFlowCalcul() {
        return this.needBodyFlow;
    }

    updateCarryInput() {
        return this.helperCarryStatusByAmount(amount => amount < 500);
    }

    updateCarryOutput() {
        return false;
    }

    onWorkOrder(storage, mainStorage) {
        return this.helperWorkOrderDeposit(storage, mainStorage)
    }
}

module.exports = ControllerWorkbench;