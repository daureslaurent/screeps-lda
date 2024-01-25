const _nexusBuilderFeat = require('sys/nexus/core/_nexusBuilderFeat');
class _nexusBuilderFeatSequential extends _nexusBuilderFeat {
    /**
     * @param name {string}
     * @param updateWait {number}
     * @param levelToTrigger {number}
     */
    constructor(name, updateWait = undefined, levelToTrigger) {
        super(name, updateWait, levelToTrigger);
        this.multiplesInit = true;

        this.sequential = {
            current: -1,
            max: -1,
            finish: false,
        }
    }

    finishSequential() {
        this.sequential.finish = true;
        this.finishInit();
    }

    onInit(gameAccess, roomData, buildTemplate) {
        // Start sequential
        const sequential = this.sequential;
        if (sequential.current === -1) {
            // init
            sequential.current = 0;
            sequential.finish = false;
        }
        this.onInitSequential(sequential.current, gameAccess, roomData, buildTemplate);
        sequential.current += 1;
        return this.sequential.finish;
    }

    /**
     * @abstract
     * @param index {number}
     * @param gameAccess
     * @param roomData
     * @param buildTemplate
     */
    onInitSequential(index, gameAccess, roomData, buildTemplate) {}

    /**
     * @abstract
     * @param buildData {BuildData}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param buildTemplate
     * @return {BuildData}
     */
    onFastCheck(buildData, gameAccess, roomData, buildTemplate) {}

}

module.exports = _nexusBuilderFeatSequential;