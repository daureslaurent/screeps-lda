const utils = require('utils/utils')
class SpawnerData {

    /**
     *
     * @param botRole {BotRole || SpawnerData}
     * @param level {number}
     * @param spawnerType {SpawnerType}
     * @param askData {{}}
     */
    constructor(botRole, level,  spawnerType, askData = undefined) {
        if (level === undefined) {
            this.fromObj(botRole);
            return;
        }
        this.id = utils.generateUniqueId();
        this.botRole = botRole;
        this.level = level;
        this.spawnerType = spawnerType;
        this.askData = askData;
    }

    /**
     * @param obj {SpawnerData}
     */
    fromObj(obj) {
        this.id = obj.id;
        this.botRole = obj.botRole;
        this.level = obj.level;
        this.spawnerType = obj.spawnerType;
        this.askData = obj.askData;
    }

}

module.exports = SpawnerData;