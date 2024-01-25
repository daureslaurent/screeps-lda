const utils = require('utils/utils')
const SysCityWorkerModelActionData = require('sys/worker/core/model/SysCityWorkerActionData')

class SysCityWorkerAction {
    /**
     * @param type {string}
     * @param creepId {string}
     * @param data {SysCityWorkerModelActionData}
     */
    constructor(type, creepId, data) {
        if (typeof type === 'object' && !creepId && !data) {
            this.fromObj(type);
            return
        }
        this.id = utils.generateUniqueId()
        this.type = type
        this.data = data
        this.creepId = creepId
        /** @type {Creep} */
        this.creep = undefined;
        this.toDel = false;
        this.firstRun = true;
        this.isRun = false;

        this.treeChild = undefined
        this.treeParent = undefined
    }

    fromObj(obj) {
        this.id = obj.id;
        this.type = obj.type;
        if (obj.data !== undefined) {
            this.data = new SysCityWorkerModelActionData()
        }
        this.data = obj.data;
        this.creepId = obj.creepId;
        this.creep = obj.creep;
        this.toDel = obj.toDel;
        this.treeChild = obj.treeChild;
        this.treeParent = obj.treeParent;
    }
}

module.exports = SysCityWorkerAction;