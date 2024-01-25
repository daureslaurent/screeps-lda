const SysCitySourceWorkbench = require('sys/workbench/model/WorkbenchModel');
const VisualUiBox = require('core/visual/visual.ui.box')
const utils = require('utils/utils')
const WorkerOrder = require('sys/worker/core/model/WorkerOrder');
const WorkerType = require('sys/worker/core/model/WorkerType');

class SysWorkbench {
    constructor(idWorker, handleRoom) {
        this.idWorker = idWorker;

        this.energy = 0;
        this.energyCapacity = 0;
        this.ticksToRegeneration = 0;

        /** @Type {SysCitySourceWorkbench[]} */
        this.workBench = [];
        this.freeWorkBench = 0;

        this.bestOutputPos = undefined;
        this.sysStorage = undefined;
        this.unregisterAsked = false;
        this.distanceToMain = -1;

        this.needBodyFlow = 0;

        this.offsetFindBench = 1;
        this.exploitResource = RESOURCE_ENERGY;

        this.carryOutput = false;
        this.carryInput = false;

        this.handleRoom = handleRoom;
    }

    /**
     * @param gameAccess {GameAccess}
     */
    update(gameAccess) {
        const baseObject = this.getBaseObject(gameAccess);
        if (baseObject != null) {
            if (this.workBench.length === 0) {
                this.workBench = this.findWorkBench(baseObject);
            }
            if (this.bestOutputPos === undefined) {
                this.bestOutputPos = this.findBestPositionOutputStore(baseObject);
                this.calculateIndexWorkbench();
            }
        }

        this.unregisterAsked = false;
        try {
            this.updateFreeWorkBench();
        } catch (e) {
            console.log(`sys.city.area.worker:update -> ${e}`);
        }
        if (this.distanceToMain === -1) {
            this.distanceToMain = this.setDistanceToMain(gameAccess);
        }
        this.carryInput = this.updateCarryInput();
        this.carryOutput = this.updateCarryOutput();

        this.customUpdate(gameAccess, baseObject);
    }

    /**
     * @abstract
     * @param gameAccess {GameAccess}
     * @param baseObject {Object || Structure}
     */
    customUpdate(gameAccess, baseObject) {}

    /**
     * @param gameAccess {GameAccess}
     * @return {number}
     */
    setDistanceToMain(gameAccess) {
        const posStorage = this.getBestOutputStorePos();
        const spawner = gameAccess.getSpawnerByRoom(this.handleRoom)[0]
        if (spawner != null && posStorage != null) {
            const pathRaw = PathFinder.search(posStorage, {
                pos: spawner.pos,
                range: 1,
            }, {
                maxOps: 20000,
            });

            if (pathRaw != null && pathRaw.path != null && pathRaw.path.length > 0) {
                return pathRaw.path.length;
            }
        }
        return -1;
    }

    externalDebug(gameAccess) {
        return;
        const baseObject = this.getBaseObject(gameAccess);
        try {
            this.debugShowWorkBench(baseObject.room.visual, baseObject)
        } catch (e) {
            console.log(`sys.city.area.worker:externalDebug -> ${e}`);
        }
    }

    /**
     * @param gameAcces {GameAccess}
     * @return {Object || Structure}
     */
    getBaseObject(gameAcces) {
        return gameAcces.Game.getObjectById(this.idWorker)
    }

    /**
     * @param baseObject {Structure}
     * @return {RoomPosition[]}
     */
    findWorkBench(baseObject) {
        const offset = this.offsetFindBench;
        const workBench = [];
        if (baseObject) {
            const terrain = new Room.Terrain(baseObject.room.name);
            for (let xOffset = -offset; xOffset <= offset; xOffset++) {
                for (let yOffset = -offset; yOffset <= offset; yOffset++) {
                    const x = baseObject.pos.x + xOffset;
                    const y = baseObject.pos.y + yOffset;
                    const pos = new RoomPosition(x, y, baseObject.room.name);
                    if (this.isTerrainFree(terrain, pos)) {
                        workBench.push(new SysCitySourceWorkbench(pos));
                    }
                }
            }
            return workBench;
        }
    }

    /**
     * @param creepId {string}
     * @return {boolean}
     */
    containCreeId(creepId) {
        return this.workBench.filter(w => w.creepId === creepId)[0] != null;
    }

    /**
     * @param creepId {string}
     * @return {SysCitySourceWorkbench}
     */
    getWorkBenchByCreeId(creepId) {
        return this.workBench.filter(w => w.creepId === creepId)[0]
    }

    updateFreeWorkBench() {
        this.freeWorkBench = this.workBench
            .filter(workBench => {
                const isFree = workBench.getPos().lookFor(LOOK_CREEPS).length === 0 || true;
                workBench.setFree(isFree);
                return !workBench.getRegister();
            })
            .length
    }

    /**
     * @param terrain {Terrain}
     * @param pos {RoomPosition}
     */
    isTerrainFree(terrain, pos) {
        const objectsAtPos = pos.lookFor(LOOK_STRUCTURES);
        const hasWall = objectsAtPos.some(obj => obj.structureType === STRUCTURE_WALL);
        return terrain.get(pos.x, pos.y) !== TERRAIN_MASK_WALL && !hasWall
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

    getTotalBodyFlow() {
        return this.workBench
            .map(w => w.getBodyFlow())
            .reduce((total, value) => total + value, 0);
    }

    getNeedBodyFlow() {
        return this.bodyFlowCalcul();
    }

    /**
     * @abstract
     * @return {number}
     */
    bodyFlowCalcul() {}

    setForceNeedBodyFlow(value) {
        this.needBodyFlow = value;
    }

    /**
     *
     * @param visual {RoomVisual}
     * @param baseObject {Structure}
     */
    debugShowWorkBench(visual, baseObject) {
        this.workBench.forEach(w => {
            if (w.getRegister()) {
                visual.circle(w.pos, {
                    radius: 0.5,
                    fill: '#f58f21',
                });
            }

            if (w.getFree()) {
                visual.circle(w.pos, {
                    radius: 0.5,
                    fill: '#80d56d',
                });
            } else {
                visual.circle(w.pos, {
                    radius: 0.5,
                    fill: '#c01b1b',
                });
            }
            // visual.text(`${w.position}`, w.pos.x, w.pos.y)
        })
        if (this.bestOutputPos !== undefined) {
            visual.circle(this.bestOutputPos, {
                radius: 0.5,
                fill: '#37e706',
            });
        }

        const box = new VisualUiBox(
            visual,
            new RoomPosition(baseObject.pos.x, baseObject.pos.y, baseObject.pos.roomName),
        );
        const sysStorage = this.sysStorage;

        const flow = `Flow: ${this.getTotalBodyFlow()}/${this.getNeedBodyFlow()}`
        box.setTitle(`BaseObject Worker [${this.distanceToMain}]`)
        box.addLine(`${flow}`);
        if (sysStorage) {
            box.addLine(`Storage ${sysStorage.getEnergy()} (${this.getExploitFuture()})`);
        }
        const res = this.getExploitResource() === RESOURCE_ENERGY ? '⚡' : this.getExploitResource()
        box.addLine(`Ex: ${res}[${this.getExploitFuture()}]`);

        const carryI = this.getNeedCarryInput() ? '🟢':'⚫'
        const carryO = this.getNeedCarryOutput() ? '🟢':'⚫'

        box.addLine(`Carry: I:${carryI} O:${carryO}`);

        if (this.debugCustomShowWorkBench !== undefined) {
            this.debugCustomShowWorkBench(baseObject.room.visual, baseObject, box)
        }

        box.draw()
    }

    /**
     * @abstract
     * @param visual {RoomVisual}
     * @param baseObject {Structure}
     * @param box {VisualUiBox}
     */
    debugCustomShowWorkBench(visual, baseObject, box) {
    }

    /**
     * @return {number}
     */
    getFreeWorkBench() {
        return this.freeWorkBench;
    }

    /**
     *
     * @return {SysCitySourceWorkbench[]}
     */
    getFreeWorkBenchObj() {
        return this.freeWorkBench = this.workBench
            // .filter(workBench => workBench.getFree())
            .filter(workBench => !workBench.getRegister())
            .sort((a, b) => a.position - b.position)
    }

    getUsedWorkBenchObj() {
        return this.freeWorkBench = this.workBench
            // .filter(workBench => workBench.getFree())
            .filter(workBench => workBench.getRegister())
    }


    getWorkBenchById(id) {
        const workBenchs = this.workBench
            .filter(w => w.id === id)
        return workBenchs.length > 0 ?
            workBenchs[0] :
            undefined;
    }

    /**
     * @param id {string}
     * @param body {string[]}
     * @param creepId {string}
     * @return {boolean}
     */
    registerWorkBench(id, body, creepId) {
        const workBench = this.getWorkBenchById(id);
        if (workBench === undefined) {
            return false;
        }
        if (workBench.getRegister()) {
            return false;
        }
        workBench.setRegister(true, utils.countBody(body, WORK), creepId);
        this.updateFreeWorkBench();

        return true;
    }

    unregisterWorkBench(id) {
        const workBench = this.getWorkBenchById(id);
        if (workBench === undefined) {
            return false;
        }
        if (workBench.getRegister()) {
            workBench.setRegister(false, 0, undefined);
        }
        return true;
    }

    askUnRegisterWorkBench(id) {
        if (this.unregisterAsked === true) {
            return false;
        }
        if (this.getUsedWorkBenchObj() <= 1) {
            return false
        }
        const workBench = this.getWorkBenchById(id);
        if (workBench === undefined) {
            return true;
        }
        const currentWork = this.getTotalBodyFlow();
        if (currentWork - workBench.getBodyFlow() < this.getNeedBodyFlow()) {
            return false;
        }
        this.unregisterAsked = true;
        return true;
    }

    /**
     * @return {RoomPosition}
     */
    getBestOutputStorePos() {
        return this.bestOutputPos;
    }

    /**
     * @param sysStorageUnit {SysStorageUnit}
     */
    updateSysStorage(sysStorageUnit) {
        this.sysStorage = sysStorageUnit;
    }

    /**
     * @return {SysStorageUnit}
     */
    getSysStorage() {
        return this.sysStorage;
    }

    getTotalEnergyStorage() {
        return this.sysStorage != null ? this.sysStorage.getFuture(RESOURCE_ENERGY) : 0;
    }


    /**
     * Function to calculate the distance between two positions
     * @param pos1 {RoomPosition}
     * @param pos2 {RoomPosition}
     * @return {number}
     */
    getDistance(pos1, pos2) {
        return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
    }

    /**
     * Function to sort a list of positions by their distance to posOri and posTgt
     * @param posList {SysCitySourceWorkbench[]}
     * @param posTgt {RoomPosition}
     * @return {*}
     */
    sortByDistanceTo(posList, posTgt) {
        return posList.sort((posA, posB) => {
            const distanceToTgtA = this.getDistance(posA.getPos(), posTgt);
            const distanceToTgtB = this.getDistance(posB.getPos(), posTgt);

            return distanceToTgtA - distanceToTgtB;
        });
    }


    calculateIndexWorkbench() {
        this.sortByDistanceTo(this.workBench, this.getBestOutputStorePos())
            .forEach((value, index) => {
                value.position = index;
            })
    }

    /**
     * @return {string}
     */
    getIdBaseObject() {
        return this.idWorker;
    }

    getExploitResource() {
        return this.exploitResource;
    }

    getExploitFuture() {
        const sysStorage = this.getSysStorage();
        if (sysStorage != null) {
            return sysStorage.getFuture(this.getExploitResource());
        }
        return -1;
    }

    getNeedCarryOutput() {
        return this.carryOutput;
    }

    getNeedCarryInput() {
        return this.carryInput;
    }

    /**
     * @abstract
     * @return {boolean}
     */
    updateCarryInput() {}

    /**
     * @abstract
     * @return {boolean}
     */
    updateCarryOutput() {}

    /**
     * @param cb
     * @return {boolean}
     */
    helperCarryStatusByAmount(cb) {
        const sysStorage = this.getSysStorage();
        if (sysStorage) {
            return cb(sysStorage.getFuture(this.getExploitResource()));
        }
        return false;
    }

    /**
     * @param roomData {RoomData}
     * @return {undefined|WorkerOrder}
     */
    getWorkOrder(roomData) {
        const mainStorage = roomData.getSysStorage().getMainStorage();
        const storage = this.getSysStorage();
        if (storage != null && mainStorage != null) {
            return this.onWorkOrder(storage, mainStorage);
        }
        return undefined;
    }

    /**
     * @abstract
     * @param storage
     * @param mainStorage
     * @return {WorkerOrder}
     */
    onWorkOrder(storage, mainStorage) {}


    /**
     * @param storage
     * @param mainStorage
     * @param workerType
     */
    helperWorkOrderWithdraw(storage, mainStorage, workerType = WorkerType.CARRY) {
        return new WorkerOrder(
            workerType,
            storage.getPos(),
            storage.id,
            {
                depositSysStorage: mainStorage.id,
                mandatoryWithdraw: true,
                resource: this.getExploitResource(),
                distance: this.distanceToMain * 2,
            },
        );
    }

    /**
     * @param storage
     * @param mainStorage
     * @param mandatoryWithdraw
     * @return {WorkerOrder}
     */
    helperWorkOrderDeposit(storage, mainStorage, mandatoryWithdraw = false) {
        return new WorkerOrder(
            WorkerType.CARRY,
            mainStorage.getPos(),
            mainStorage.id,
            {
                depositSysStorage: storage.id,
                mandatoryWithdraw: mandatoryWithdraw,
                resource: this.getExploitResource(),
                distance: this.distanceToMain * 2,
            },
        );
    }
}

module.exports = SysWorkbench;