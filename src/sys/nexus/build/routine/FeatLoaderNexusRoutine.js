const FEATURE_CITY_BUILDER = [
    require('sys/nexus/build/routine/NexusBuildRoutineConstruct'),
]
class FeatLoaderNexusRoutine {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        /** @type {_nexusFeat[]} */
        this.feats = [];
        FEATURE_CITY_BUILDER.forEach(m => {
            const inst = new (m)(roomName);
            this.feats.push(inst);
        })
    }

    /**
     * @return {_nexusRoutineFeat[]}
     */
    getFeats() {
        return this.feats;
    }

    /**
     * @param level {number}
     * @return {_nexusRoutineFeat[]}
     */
    getFeatsLevel(level) {
        return this.feats
            .filter(f => f.getMinimalLevel() <= level);
    }


    /**
     * @param level {number}
     * @return {_nexusRoutineFeat[]}
     */
    getUpdatable(level) {
        return this.getFeatsLevel(level)
            .filter(f => f.getUpdateEnable());
    }

    /**
     * @param level {number}
     * @return {_nexusRoutineFeat[]}
     */
    getFeatsNotInit(level) {
        return this.getFeatsLevel(level)
            .filter(f => !f.getIsInit());
    }


}

module.exports = FeatLoaderNexusRoutine;