const WorkerCreepRunner = require('sys/worker/core/WorkerCreepRunner');
const WorkerCreepOrder = require('sys/worker/core/WorkerCreepOrder');
const WorkerCreepAction = require('sys/worker/core/WorkerCreepAction');
const WorkerCreepMetric = require('sys/worker/core/WorkerCreepMetric');
const VisualUiBox = require('core/visual/visual.ui.box');
const BotRole = require('core/enum/BotRole');
const utils = require('utils/utils');
const SpawnerType = require('sys/spawner/model/SpawnerType');

class WorkerCreepAbstract {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomName {string}
     * @param roomData {RoomData}
     * @param workerName
     */
    constructor(gameAccess, roomName, roomData, workerName = 'WorkerCreepAbstract') {
        this.roomName = roomName;

        this.runningWorker = new WorkerCreepRunner(roomName);
        this.orderWorker = new WorkerCreepOrder(roomName, this.setOrderSort());
        this.actionWorker = new WorkerCreepAction(roomName);
        this.metricWorker = new WorkerCreepMetric(roomName);

        /** @type {string[]} */
        this.handleBotRole = this.setHandleBotRole();
        this.modulesWorkerType = new Map();
        this.modulesAction = new Map();
        this.setModules(this.modulesWorkerType, this.modulesAction, gameAccess, roomData);

        this.workerName = workerName

        /** @type {Map<string, { count: number, wait: number}>} */
        this.throttleMap = new Map();

        this.throttleMap.set('order', { count: 0, wait: 0})

        /** OPTS
         * Handle the evolve creep (TODO: handle multiple spawn with and without BoteRole)
         */
        this.multiplesTypeCreeps = false;

        this.getClosestCreepInOrder = true;
    }

    /**
     * @abstract
     * @return {string[]}
     */
    setOrderSort() {
        // return []
    }

    /**
     * @abstract
     * @param modulesWorkerType {Map<string, *>}
     * @param modulesAction {Map<string, *>}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    setModules(modulesWorkerType, modulesAction, gameAccess, roomData) {
        // this.fillModules(MODULES_WORK_TYPE, modulesWorkerType, gameAccess, roomData)
        // this.fillModules(MODULES_ACTION, modulesAction, gameAccess, roomData)
    }

    /**
     * @param modulesClassInput {*[]}
     * @param mapModuleOutput {Map<string, *>}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    fillModules(modulesClassInput, mapModuleOutput,  gameAccess, roomData) {
        modulesClassInput.forEach(m => {
            const instance = new (m)(gameAccess, roomData);
            mapModuleOutput.set(instance.role, instance);
        });
    }

    /**
     * @return {{modulesAction: Map<any, any>, modulesWorkerType: Map<any, any>}}
     */
    getModules() {
        return  {
            modulesAction: this.modulesAction,
            modulesWorkerType: this.modulesWorkerType,
        }
    }

    /**
     * @abstract
     * @return {string[]}
     */
    setHandleBotRole() {
        return []
    }

    /**
     * @param gameAccess {GameAccess}
     */
    checkCreepEvolve(gameAccess) {
        if (this.multiplesTypeCreeps === true) {
            return;
        }

        const creeps = this.getAllCreeps(gameAccess)
            .filter(c => !c.needEvolve);
        if (creeps.length === 0) {
            return;
        }

        const bodyCosts = creeps.map(c => Number(c.costBody));
        const maxCreepCost = Math.max(...bodyCosts)
        const minCreepCost = Math.min(...bodyCosts)
        if (maxCreepCost !== minCreepCost) {
            // need evolve creep that are in the minCreepCost
            creeps.filter(c => c.costBody === minCreepCost && !c.needEvolve)
                .map(c => gameAccess.Game.getObjectById(c.id))
                .filter(c => c != null)
                .forEach(c => c.memory.needEvolve = true)
        }
    }

    update(gameAccess, sysCity) {
        const modules = this.getModules().modulesWorkerType
        this.getWorkerAction().cleanAction();
        this.getWorkerRunning().cleanFinished(modules, sysCity);
        this.getWorkerRunning().clean(gameAccess, modules, sysCity);
        this.getWorkerMetric().clean();
    }

    handleThrottle(th) {
        if (th.wait <= 0) {
            return true;
        }
        if (th.count === th.wait) {
            th.count = 0
            return true;
        }
        th.count ++;
        // console.log('===================================== THROTTLE =========================')
        return false;
    }

    runOrder(sysCity, gameAccess, roomData) {
        // if (this.throttleMap.has('order')) {
        //     if (this.handleThrottle(this.throttleMap.get('order'))) {
        //         return this.getWorkerOrder().runOrder(sysCity, gameAccess, roomData, this.getModules(), this);
        //     }
        //     return;
        // }
        return this.getWorkerOrder().runOrder(sysCity, gameAccess, roomData, this.getModules(), this);
    }
    runRunning(sysCity, gameAccess, roomData) {
        return this.getWorkerRunning().runRunning(sysCity, gameAccess, roomData, this.getModules(), this);
    }
    runAction(gameAccess) {
        return this.getWorkerAction().runAction(gameAccess, this.getModules());
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData
     * @param debugFlag {Flag}
     */
    run(gameAccess, roomData, debugFlag = undefined) {
        if (gameAccess == null) {
            return;
        }
        const sysCity = roomData.getSysCity()

        this.cleanCreeps(gameAccess);
        this.runOrder(sysCity, gameAccess, roomData);
        this.runRunning(sysCity, gameAccess, roomData);
        this.runAction(gameAccess);

        const workers = this.getAllCreeps(gameAccess)

        this.pushWorkerUsage(workers.filter(c => c.worker != null).length)
        const metricWorker = this.getAverageUsage() / workers.length;
        this.setMetricWorker(metricWorker);
        this.update(gameAccess, sysCity);
        if (debugFlag != null) {
            this.debugExternal(Game.rooms[this.roomName].visual, debugFlag.pos, gameAccess);
        }

        if (gameAccess.getTime() % 5 === 0 && this.getNeedSpawn(gameAccess)) {
            const countCreep = this.getAllCreeps(gameAccess).length;
            roomData.getSysSpawner().pushAskSpawn(
                this.handleBotRole[0],
                countCreep > 1 ? roomData.getRoomLevel() : 1,
                SpawnerType.CLASSIC
            )
        }
        this.checkCreepEvolve(gameAccess);
    }

    getNeedSpawn(gameAccess) {
        const creeps = this.getAllCreeps(gameAccess);
        if (creeps.length === 0) {
            return true;
        }
        const pressure = this.getWorkerOrder().getPressure() - creeps
            .filter(c => c != null
                && c.role === BotRole.RECYCLER
                && c.worker != null
                && c.worker.runningId != null).length
        if (pressure > 3) {
            return true
        }
        if (this.getWorkerMetric().getMetricWorker() < 0.95) {
            return false;
        }
        return pressure > 0;
    }

    /**
     * @param gameAccess {GameAccess}
     * @return {*[]}
     */
    getCreeps(gameAccess) {
        return gameAccess.getCreepsByRoom(this.roomName)
            .filter(c => this.handleBotRole.includes(c.role))
            .filter(c => c.baseRoom === this.roomName)
    }

    /**
     * @param gameAccess {GameAccess}
     * @return {*[]}
     */
    getAllCreeps(gameAccess) {
        return gameAccess.getAllCreepsArray()
            .filter(c => c.baseRoom === this.roomName)
            .filter(c => this.handleBotRole.includes(c.role) || this.handleBotRole.includes(c.roleTmp))
    }

    /**
     * @param gameAccess {GameAccess}
     */
    cleanCreeps(gameAccess) {
        this.getCreeps(gameAccess)
            .forEach(c => {
                if (c.worker !== undefined) {
                    const idRunning = c.worker.runningId
                    const actionId = c.worker.actionId
                    if (idRunning !== undefined || actionId !== undefined) {
                        const creep = gameAccess.Game.getObjectByIdNonCached(c.id);
                        let fullReset = false;

                        if (idRunning !== undefined) {
                            if (!this.getWorkerRunning().running.has(idRunning)) {
                                fullReset = true;
                                creep.memory.worker.runningId = undefined;
                            }
                        }
                        if (actionId !== undefined) {
                            if (!this.getWorkerAction().action.has(actionId)) {
                                creep.memory.worker.actionId = undefined;
                            }
                        }
                        if (fullReset) {
                            creep.memory.worker = undefined;
                        }
                    }
                }
            })
    }

    /**
     * @param gameAccess {GameAccess}
     * @return {Creep[]}
     */
    getFreeCreepWorker(gameAccess) {
        return this.getAllCreeps(gameAccess)
            .map(c => gameAccess.Game.getObjectByIdNonCached(c.id))
            .filter(c => c.memory.worker === undefined)
            .filter(c => c.memory.baseRoom === this.roomName)
    }


    // SysTransportCityFeat



    /**
     * @return {WorkerCreepOrder}
     */
    getWorkerOrder() {
        return this.orderWorker;
    }

    /**
     * @return {WorkerCreepRunner}
     */
    getWorkerRunning() {
        return this.runningWorker;
    }

    /**
     * @return {WorkerCreepAction}
     */
    getWorkerAction() {
        return this.actionWorker;
    }

    /**
     * @return {WorkerCreepMetric}
     */
    getWorkerMetric() {
        return this.metricWorker;
    }

    /**
     * @return {number}
     */
    getMetricWorker() {
        return this.getWorkerMetric().getMetricWorker();
    }

    /**
     * @param nbUsage {number}
     */
    pushWorkerUsage(nbUsage) {
        return this.getWorkerMetric().pushWorkerUsage(nbUsage);
    }

    /**
     * @return {number}
     */
    getAverageUsage() {
        return this.getWorkerMetric().getAverageUsage();
    }

    setMetricWorker(metric) {
        return this.getWorkerMetric().setMetricWorker(metric);
    }

    /**
     * @param visual {RoomVisual}
     * @param posOri {RoomPosition}
     * @param gameAccess {GameAccess}
     */
    debugExternal(visual, posOri, gameAccess) {
        this.debugCustomExternal(visual, posOri, gameAccess);
    }

    /**
     * @abstract
     * @param visual {RoomVisual}
     * @param posOri {RoomPosition}
     * @param gameAccess {GameAccess}
     */
    debugCustomExternal(visual, posOri, gameAccess) {
    }

    /**
     * @param action
     * @param box
     * @param tree
     * @return {*}
     */
    debugRecursiveAction(action, box, tree) {
        const actionStr = (tree > 0 ? `->[${action.type}]` : `[${action.type}][${action.creepId}]`)
        box.addLine(`${actionStr}`);
        if (action.treeChild !== undefined) {
            return this.debugRecursiveAction(this.action.get(action.treeChild), box, tree + 1);
        }
    }

    getNumberRunningByType(type) {
        return this.getWorkerRunning().getAllRunning()
            .filter(r => r.type === type)
            .length;
    }

    // HELPER REFACTO

    pushOrder(order) {
        return this.getWorkerOrder().pushOrder(order)
    }
    cleanOrderType(type) {
        return this.getWorkerOrder().cleanOrderType(type)
    }

    /**
     * @param pos {RoomPosition}
     * @param roomVisual
     * @param gameAccess
     */
    basicDebug(pos, roomVisual, gameAccess) {
        const sysWorker = this
        const box = new VisualUiBox(
            roomVisual,
            pos,
        );

        const creepWorkers = this.getAllCreeps(gameAccess)
            .map(c => gameAccess.Game.getObjectById(c.id));

        box.setTitle(`${this.workerName} [${creepWorkers.length}]`);

        const totalCharge = creepWorkers
            .filter(c => c != null)
            .map(c => c.ticksToLive)
            .reduce((total, value) => total + value, 0)
        const averageCharge = (totalCharge / creepWorkers.length) / CREEP_LIFE_TIME;
        const showAverageCharge = `${Math.round((averageCharge * 100) * 10) / 10}`
        const metricWorker = Math.round(sysWorker.getMetricWorker()*100) + '%'
        box.addLine(`Usage: ⚡${showAverageCharge} 🏭${metricWorker}`)
        box.addLine(`NeedSpawn: ⚡${this.getNeedSpawn(gameAccess) ?'🟢':'🔴'}`)

        const orderMinimal = sysWorker.getWorkerOrder().getOrder()
            .map(o => o.type)
            .reduce((total, value) => total + `[${value}]`, '')
        box.addLine(`Order: 🌀${sysWorker.getWorkerOrder().getPressure()} ${sysWorker.getWorkerOrder().getOrder().length}: ${orderMinimal}`)
        sysWorker.getWorkerOrder().getOrder().forEach(order => {
            roomVisual.circle(order.pos, {
                radius: 0.2,
                fill: '#ff0000',
            });
        })
        box.addLine(`Running: ${sysWorker.getWorkerRunning().getAllRunning().length}`)
        sysWorker.getWorkerRunning().getAllRunning().forEach(running => {
            roomVisual.circle(running.pos, {
                radius: 0.2,
                fill: '#0012ff',
            });
            // const aliveCreep = Game.getObjectById(running.creepId);
            // box.addLine(`= ID[${running.id}]\tCID${aliveCreep!=null?'🔵':'🔴'}[${running.creepId}]\t${running.type}\t[${running.toDel}]`)
        })

        box.addLine(`Action ${sysWorker.getWorkerAction().getActions().length}`)

        const localWorker = creepWorkers
            .filter(c => c != null)
            .filter(c => c.pos.roomName === this.roomName)
            .sort((a, b) => b.memory.bodyCost - a.memory.bodyCost);

        const extWorker = creepWorkers
            .filter(c => c != null)
            .filter(c => c.pos.roomName !== this.roomName)
            .sort((a, b) => b.memory.bodyCost - a.memory.bodyCost);

        localWorker.forEach(c => box.addLine(this.visualDebugCreep(c, sysWorker)))
        box.addLine(' === EXT ===')
        extWorker.forEach(c => box.addLine(this.visualDebugCreep(c, sysWorker)))

        box.draw();
    }

    visualDebugCreep(creep, sysWorker) {
        const c = creep;
        const name = `${c.name.slice(-3)}`
        const worker = c.memory.worker;
        const ledWorker = worker === undefined ? '🟢' : '🟡';
        const carry = c.store[RESOURCE_ENERGY] === 0 ?
            '🟢' :
            c.store.getFreeCapacity(RESOURCE_ENERGY) === 0 ?
                'Ⓜ️' :
                '🟡';
        const strLive = c.memory.needEvolve ?
            c.ticksToLive > 200 ?
                '🟣' :
                '🟡' :
            c.memory.role !== BotRole.RECYCLER ?
                '🟢' :
                '🔴'
        const charge = Math.round(((c.ticksToLive / CREEP_LIFE_TIME) * 100) );


        const isRunning = worker !== undefined && worker.runningId !== undefined;
        let strRunning = ''
        if (isRunning) {
            const running = sysWorker.getWorkerRunning().getRunning(worker.runningId)
            strRunning = running !== undefined ? running.type : ''
        }


        const isAction = worker !== undefined && worker.actionId !== undefined;
        let strActionRec = '';
        if (isAction && this.handleBotRole.includes(c.memory.role)) {
            strActionRec = this.actionStringRecursiveAction(sysWorker, sysWorker.getWorkerAction().getAction(worker.actionId), '')
        }

        return `[${name}][${c.memory.bodyCost}]\t` +
            ` ${ledWorker}${strLive}${carry}${'⚡' + charge} [${strRunning}] ${strActionRec}`;
    }

    actionStringRecursiveAction(sysWorker, action, out) {
        out += `->[${action != null ? action.type : 'null'}]`;
        if (action !== undefined && action.treeChild !== undefined) {
            return this.actionStringRecursiveAction(sysWorker, sysWorker.getWorkerAction().getAction(action.treeChild), out);
        } else {
            return out;
        }
    }

}

module.exports = WorkerCreepAbstract;