const SysWorkerRunning = require('sys/worker/core/model/WorkerRunning');
const WorkerType = require('sys/worker/core/model/WorkerType');
const Logs = require('utils/Logs');

class WorkerCreepOrder {
    /**
     * @param roomName {string}
     * @param orderSort {string[]}
     */
    constructor(roomName, orderSort) {
        this.roomName = roomName;

        this.order = [];
        this.orderSort = orderSort || [];
    }

    getPressure() {
        return this.getOrder()
            .filter(o => o.data.slowUsage !== true)
            .length;
    }

    /**
     * @param sysCity
     * @param gameAccess
     * @param roomData
     * @param modules {{modulesAction: Map<any, any>, modulesWorkerType: Map<any, any>}}
     * @param sysWorker {WorkerCreepAbstract}
     */
    runOrder(sysCity, gameAccess, roomData, modules, sysWorker) {
        if (this.getOrder().length === 0) {
            return;
        }
        const freeWorkerOri = sysWorker.getFreeCreepWorker(gameAccess);
        if (freeWorkerOri.length === 0) {
            return;
        }

        const summary = this.doSummary()
        /** @type {Map<string, WorkerOrder>} */
        const mapOrder = new Map();
        summary.action.forEach(order => mapOrder.set(order.id, order));

        /** @type {Map<string, Creep>} */
        const mapFreeCreep = new Map();
        freeWorkerOri.forEach(c => mapFreeCreep.set(c.id, c));

        mapOrder.forEach((order, key) => {
            const type = order.type;
            if (modules.modulesWorkerType.has(type)) {
                if (Game.rooms[order.pos.roomName] == null) {
                    Logs.error(`Error not access room ${order.pos.roomName}`, this.roomName);
                    return;
                }
                const module = modules.modulesWorkerType.get(type);
                const remainsCreep = [].concat(...Array.from(mapFreeCreep.values()))

                /** @type {Creep[]} */
                const freeWorker = module.creepFilter !== undefined
                    ? module.creepFilter(remainsCreep, order)
                    : remainsCreep;

                const closestCreep = sysWorker.getClosestCreepInOrder === true
                    ? order.pos.findClosestByPath(freeWorker)
                    : null;
                const creep = closestCreep != null
                    ? closestCreep
                    : freeWorker[Math.floor(Math.random() * freeWorker.length)]
                if (creep != null) {
                    const freshCreep = gameAccess.Game.getObjectById(creep.id);
                    if (freshCreep.memory.worker === undefined /*|| freshCreep.memory.worker.runningId === undefined*/) {
                        const ret = module.preWork(sysCity, sysWorker, roomData.getSysStorage(), order, creep);
                        if (ret === true) {
                            const running = new SysWorkerRunning(
                                order.type,
                                order.pos,
                                order.idTarget,
                                order.data,
                                creep.id);
                            this.bindActionToCreep(freshCreep, running);

                            sysWorker.getWorkerRunning().pushRunning(running)
                            this.removeOrder(order.id)
                            mapOrder.delete(order.id);
                            mapFreeCreep.delete(creep.id);
                        }
                    }
                }
            }
        })
    }


    /**
     * @return {{action: WorkerOrder[]}}
     */
    doSummary() {
        let containRefill = false;
        const order = this.getOrder()
            .filter(o => o != null)
            .sort((a, b) => {
                const a1 = this.orderSort.indexOf(a.type);
                const b1 = this.orderSort.indexOf(b.type);
                return a1 - b1;
            })
            .filter(o => {
                if (o.type === WorkerType.REFILL) {
                    containRefill = true;
                }
                return true;
            })
            .slice(0, containRefill ? 3 : 5)
        return {
            action: order,
        }
    }

    /**
     *
     * @param creep
     * @param running {WorkerRunning}
     * @return {*}
     */
    bindActionToCreep(creep, running) {
        if (!creep.memory.worker) {
            creep.memory.worker = {}
        }
        creep.memory.worker.runningId = running.id;
        return creep;
    }

    /**
     * @param order {WorkerOrder}
     */
    pushOrder(order) {
        this.order.push(order);
    }

    removeOrder(id) {
        this.order = this.order.filter(o => o.id !== id);
    }

    cleanOrderType(type) {
        this.order = this.order
            .filter(o => o != null)
            .filter(o => o.type !== type)
    }

    /**
     * @return {WorkerOrder[]}
     */
    getOrder() {
        return this.order;
    }
}

module.exports = WorkerCreepOrder;