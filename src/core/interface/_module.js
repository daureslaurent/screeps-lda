const NeedsGame = require('core/interface/model.needsGame')
const Logs = require('utils/Logs');
const ENABLE_TRY_CATCH =
    // true
false

// true;
class _module {
    /**
     * @param name {string}
     * @param needsGane {NeedsGame}
     * @param gameAccess {GameAccess}
     */
    constructor(name, needsGane, gameAccess) {
        this.name = name + 'Module';
        this.needsGane = needsGane || [NeedsGame.ALL];

        /** @type {GameAccess} */
        this.gameAccess = gameAccess;

        this.catching = false;
        this.profiler = gameAccess != null ? gameAccess.getProfiler() : undefined;
        this.lastRun = -1;
        console.log('construct module', this.name, this.needsGane)
    }

    /**
     *
     * @returns {[Action]|void}
     */
    execute() {
        this.lastRun = this.gameAccess.getTime();
        if (!ENABLE_TRY_CATCH) {
            return this.executeProcess();
        }
        try {
            this.catching = true;
            return this.executeProcess()
        } catch (error) {
            console.log(`===============!!!!! ERROR MODULE !!!!!====================`);
            console.log(`==== DETAIL: ${error}`);
            console.log(`==== FROM: ${this.name}`);
            Logs.error(`Error module ${this.name} with error: ${error}`, JSON.stringify(this))
            console.log(`===============!!!!! ERROR MODULE !!!!!====================`);
        }
    }

    initTime() {
        this.startTime = Game.cpu.getUsed();
    }

    endTime() {
        return Game.cpu.getUsed() - this.startTime;
    }

    executeProcess() {
        if (this.profiler.isTimingEnable()) {
            this.initTime()
        }

        this.banner();
        this.preRun();
        const runData = this.run() || '';
        const afterRunData = this.afterRun() || '';

        if (this.profiler.isTimingEnable()) {
            this.profiler.traceTime(this.name, this.endTime())
        }

        if (afterRunData !== '' && runData !== '') {
            console.log(this.name, '!! multiple returned data !!')
        }
        if (afterRunData !== '') {
            return afterRunData;
        }
        if (runData !== '') {
            return runData;
        }
    }

    banner() {
        // console.log(`=GAME=====--- -==-- ${this.catching?'|C+|':''}[${this.name}]`)
    }

    preRun() {

    }

    afterRun() {

    }

    /**
     * @abstract
     */
    run() {
        console.log(this.name, '!! run() not implemented')
    }

    /**
     * @return {number}
     */
    getLastRunTime() {
        return this.lastRun;
    }

}

module.exports = _module;