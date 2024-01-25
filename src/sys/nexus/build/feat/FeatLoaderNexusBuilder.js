const FEATURE_CITY_BUILDER = [
    require('sys/nexus/build/feat/NexusBuildFeatWallDefensive'),
    require('sys/nexus/build/feat/NexusBuildFeatExtension'),
    require('sys/nexus/build/feat/NexusBuildFeatTower'),
    require('sys/nexus/build/feat/NexusBuildFeatRoad'),
    require('sys/nexus/build/feat/NexusBuildFeatStorageOperator'),
]
class FeatLoaderNexusBuilder {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        /** @type {_nexusBuilderFeat[]} */
        this.feats = [];
        FEATURE_CITY_BUILDER.forEach(m => {
            const inst = new (m)(roomName);
            this.feats.push(inst);
        })
    }

    /**
     * @return {_nexusBuilderFeat[]}
     */
    getFeats() {
        return this.feats;
    }

    /**
     * @param level {number}
     * @return {_nexusBuilderFeat[]}
     */
    getFeatsLevel(level) {
        return this.feats
            .filter(f => f.getMinimalLevel() <= level);
    }


    /**
     * @param level {number}
     * @return {_nexusBuilderFeat[]}
     */
    getUpdatable(level) {
        return this.getFeatsLevel(level)
            .filter(f => f.getUpdateEnable());
    }

    /**
     * @param level {number}
     * @return {_nexusBuilderFeat[]}
     */
    getFeatsNotInit(level) {
        return this.getFeatsLevel(level)
            .filter(f => !f.getIsInit());
    }


}

module.exports = FeatLoaderNexusBuilder;