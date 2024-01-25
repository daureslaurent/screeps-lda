const _module = require('core/interface/_module');

class _moduleBot extends _module {

    /**
     *
     * @param name {string}
     * @param role {string}
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(name, role, gameAccess, roomDataFactory) {
        super(name, undefined, gameAccess);
        // this.room = room;
        this.roomDataFactory = roomDataFactory;
        // this.actions = [];
        this.role = role;
    }

    getRole() {
        return this.role;
    }

    /**
     * @returns {RoomData}
     */
    getRoomData() {
        return this.roomDataFactory.getRoomData(this.room);
    }

    /**
     *
     * @param creep {Creep}
     */
    execute(creep) {
        if (this.profiler.isTimingEnable()) {
            this.initTime()
        }

        // this.room = creep.pos.roomName;
        this.room = creep.baseRoom;
        // console.log(`=BOT=MINING-- -==-- [${this.name}]`)
        const ret = this.run(creep)

        if (this.profiler.isTimingEnable()) {
            this.profiler.traceCreepTime(creep.role, this.endTime())
        }
        return ret;
        // return super.execute();
    }

    // preRun() {
    //     if (this.actions.length > 0) {
    //         console.log(this.name, 'waiting actions !')
    //     }
    //     this.actions = [];
    // }
    //
    // afterRun() {
    //     console.log(this.name, '_moduleCity - afterRun', JSON.stringify(this.actions))
    //     return this.actions;
    // }


}

module.exports = _moduleBot;