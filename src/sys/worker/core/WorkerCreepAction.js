const BotRole = require('core/enum/BotRole');

class WorkerCreepAction {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;
        this.action = new Map();
    }


    /**
     * @param modules {{modulesAction: *, modulesWorkerType: *}}
     * @param gameAccess {GameAccess}
     */
    runAction(gameAccess, modules) {
        this.filterPreAction(this.getActions(), gameAccess)
            .forEach(action => {
                const retAction = this.runUnitAction(action, modules);
                if (retAction !== undefined) {
                    this.pushAction(retAction)
                }
            })

        this.filterPreAction(this.getActions(), gameAccess)
            .forEach(action => {
                // console.log(`======== SECOND ACTION ${action.type}`)
                const retAction = this.runUnitAction(action, modules);
                if (retAction !== undefined) {
                    this.pushAction(retAction)
                }
            })
        this.getActions()
            .forEach(action => action.isRun = false);
    }

    /**
     *
     * @param action {SysCityWorkerAction}
     * @param modules {{modulesAction: Map<any, any>, modulesWorkerType: Map<any, any>}}
     * @return {undefined|*}
     */
    runUnitAction(action, modules) {
        const actionType = action.type;
        // utils.talkAction(action.creep, '🦾');

        // console.log(`=== Action [${actionType}] - ${action.creepId}`)
        if (actionType !== undefined && modules.modulesAction.has(actionType)) {
            const retAction = modules.modulesAction
                .get(actionType)
                .run(action);
            action.isRun = true;
            if (typeof retAction === 'boolean' && retAction === true) {
                if (action.treeParent !== undefined) {
                    if (this.action.has(action.treeParent)) {
                        this.action.get(action.treeParent).treeChild = undefined;
                        action.creep.memory.worker.actionId = action.treeParent;
                    }
                } else {
                    action.creep.memory.worker.actionId = undefined;
                }
                this.removeAction(action.id);
            } else if (typeof retAction === 'object') {
                action.treeChild = retAction.id
                retAction.treeParent = action.id;
                return retAction;
            }
        }
        return undefined;
    }

    /**
     * @param actions {SysCityWorkerAction[]}
     * @param gameAccess {GameAccess}
     * @return {SysCityWorkerAction[]}
     */
    filterPreAction(actions, gameAccess) {
        return actions
            .filter(action =>
                action !== undefined && typeof action === 'object'
                && action.treeChild === undefined
                && action.isRun === false
            )
            .map(action => {
                action.creep = gameAccess.Game.getObjectByIdNonCached(action.creepId)
                return action;
            })
            .filter(action => {
                const toDel = action.creep == null
                if (action.toDel !== toDel) {
                    action.toDel = toDel;
                }
                if (action.firstRun === true) {
                    action.firstRun = false;
                }
                return !toDel;
            })
            .filter(action => action.creep.memory.worker !== undefined
                && action.creep.memory.role !== BotRole.RECYCLER)
    }

    /**
     * @param action {SysCityWorkerAction}
     */
    pushAction(action) {
        if (action !== undefined) {
            this.action.set(action.id, action)
        }
    }

    removeAction(actionId) {
        if (this.action.has(actionId)) {
            this.action.delete(actionId);
        }
    }

    /**
     * @return {SysCityWorkerAction[]}
     */
    getActions() {
        return Array.from(this.action.values())
            .filter(s => s != null)
            .reduce((result, value) => {
                return result.concat(value);
            }, [])
    }

    getAction(id) {
        return this.action.get(id);
    }

    cleanAction() {
        this.getActions()
            .filter(a => a == null)
            .forEach(a => this.removeAction(a.id));
    }

}

module.exports = WorkerCreepAction;