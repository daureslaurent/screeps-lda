const Logs = require('utils/Logs');

class WorkerCreepRunner {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;
        this.running = new Map();
    }

    /**
     *
     * @param sysCity {SysCity}
     * @param gameAccess
     * @param roomData
     * @param modules {{modulesAction: Map<any, any>, modulesWorkerType: Map<any, any>}}
     * @param sysWorker {WorkerCreepAbstract}
     */
    runRunning(sysCity, gameAccess, roomData, modules, sysWorker) {
        const sysStorage = roomData.getSysStorage();
        this.getAllRunning()
            .map(r => {
                return {
                    creep: gameAccess.Game.getObjectByIdNonCached(r.creepId),
                    running: r,
                }
            })
            .filter(data => {
                const del = data.creep == null;
                data.running.toDel = del;
                return !del
            })
            .filter(data => {
                const del = data.creep.memory.worker.runningId !== data.running.id && !data.running.firstUse;
                // if (del) {
                //     console.log(`========= !!! Desync worker creep ! ${data.creep.memory.runningId} = ${data.running.id}`)
                //     Logs.error(`Desync worker creep ! running: ${JSON.stringify(data.running)}`, this.roomName)
                // }
                data.running.toDel = del;
                return !del
            })
            .filter(data =>
                data.creep.memory.worker !== undefined && !data.creep.memory.worker.actionId)
            .forEach(data => {
                const type = data.running.type;
                if (type !== undefined && modules.modulesWorkerType.has(type)) {
                    // utils.talkAction(data.creep, `👽${type}`)
                    const module = modules.modulesWorkerType.get(type)

                    const action = module.run(data.creep, data.running, sysCity, sysWorker, sysStorage);
                    data.running.firstUse = false;
                    if (action === true) {
                        if (module.clean) {
                            module.clean(data.running, sysCity, sysWorker);
                        }
                        this.removeRunning(data.running.id)
                    } else if (typeof action === 'object') {
                        data.creep.memory.worker.actionId = action.id;
                        sysWorker.getWorkerAction().pushAction(action);
                    }
                }
            })
    }

    /**
     *
     * @param running {WorkerRunning}
     */
    pushRunning(running) {
        if (!this.running.has(running.id)) {
            this.running.set(running.id, running)
        }
    }

    /**
     *
     * @return {WorkerRunning[]}
     */
    getAllRunning() {
        return Array.from(this.running.values())
            .filter(s => s != null)
            .reduce((result, value) => {
                return result.concat(value);
            }, [])
    }


    getRunning(id) {
        return this.running.get(id);
    }

    removeRunning(id) {
        if (this.running.has(id)) {
            this.running.delete(id);
        }
    }

    getNumberRunningByType(type) {
        return this.getAllRunning()
            .filter(r => r.type === type)
            .length;
    }

    /**
     * @param modulesWorkerType
     * @param sysCity
     */
    cleanFinished(modulesWorkerType, sysCity) {
        this.getAllRunning()
            .filter(r => r.toDel)
            .forEach(r => {
                if (modulesWorkerType.get(r.type).clean) {
                    modulesWorkerType.get(r.type)
                        .clean(r, sysCity, this);
                }
                this.removeRunning(r.id);
            });
    }

    /**
     * @param gameAccess
     * @param modulesWorkerType
     * @param sysCity
     */
    clean(gameAccess, modulesWorkerType, sysCity) {
        this.getAllRunning()
            .filter(r => gameAccess.Game.getObjectById(r.creepId) == null && !r.firstUse)
            .forEach(r => {
                if (modulesWorkerType.get(r.type).clean) {
                    modulesWorkerType.get(r.type)
                        .clean(r, sysCity, this);
                }
                this.removeRunning(r.id);
            });
    }
}

module.exports = WorkerCreepRunner;