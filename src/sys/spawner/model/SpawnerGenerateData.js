const utils = require('utils/utils');

class SpawnerGenerateData {

    /**
     *
     * @param name {string|SpawnerGenerateData}
     * @param body {string[]}
     * @param memory {{}}
     * @param hash {string}
     * @param cost {number}
     * @param costType {FlowType}
     */
    constructor(
        name,
        body,
        memory,
        hash,
        cost,
        costType,
        ) {
        if (body === undefined) {
            this.fromObj(name);
            return;
        }
        this.id = utils.generateUniqueId();
        this.name = name;
        this.body = body;
        this.memory = memory;
        this.hash = hash;
        this.cost = cost;
        this.costType = costType;
        this.presure = 0;
        this.finish = false;
        this.spawning = false;
    }

    setSpawn() {
        this.spawning = true;
    }

    setFinish() {
        this.finish = true;
    }
    /**
     * @param obj {SpawnerGenerateData}
     */
    fromObj(obj) {
        this.id = obj.id;
        this.name = obj.name;
        this.body = obj.body;
        this.memory = obj.memory;
        this.hash = obj.hash;
        this.cost = obj.cost;
        this.costType = obj.costType;
        this.presure = obj.presure;
        this.finish = obj.finish;
        this.spawning = obj.spawning;
    }

}

module.exports = SpawnerGenerateData;