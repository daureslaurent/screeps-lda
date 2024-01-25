const _nexusFeat = require('sys/nexus/core/_nexusFeat');
const BuildData = require('sys/nexus/build/BuildData');
class _nexusRoutineFeat extends _nexusFeat {
    /**
     * @param name {string}
     * @param updateWait {number}
     * @param levelToTrigger {number}
     */
    constructor(name, updateWait = undefined, levelToTrigger) {
        super(name, updateWait, levelToTrigger);
    }

}

module.exports = _nexusRoutineFeat;